import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/proctor_session.dart';
import '../models/violation.dart';
import '../services/proctor_service.dart';

/// Provider untuk mengelola state pengawasan
class ProctorProvider with ChangeNotifier {
  final ProctorService _proctorService = ProctorService();

  List<ProctorSession> _sessions = [];
  ProctorSession? _activeSession;
  List<StudentSessionStatus> _students = [];
  List<Violation> _violations = [];
  List<Violation> _recentViolations = [];
  Map<String, dynamic>? _report;
  StudentSessionStatus? _studentDetail;
  List<Violation> _studentViolations = [];
  bool _isLoading = false;
  bool _isMonitoring = false;
  String? _error;
  Timer? _monitoringTimer;

  // Statistik monitoring
  int _activeCount = 0;
  int _warningCount = 0;
  int _dangerCount = 0;

  // Getter
  List<ProctorSession> get sessions => _sessions;
  ProctorSession? get activeSession => _activeSession;
  List<StudentSessionStatus> get students => _students;
  List<Violation> get violations => _violations;
  List<Violation> get recentViolations => _recentViolations;
  Map<String, dynamic>? get report => _report;
  StudentSessionStatus? get studentDetail => _studentDetail;
  List<Violation> get studentViolations => _studentViolations;
  bool get isLoading => _isLoading;
  bool get isMonitoring => _isMonitoring;
  String? get error => _error;
  int get activeCount => _activeCount;
  int get warningCount => _warningCount;
  int get dangerCount => _dangerCount;

  /// Memuat daftar sesi pengawasan
  Future<void> loadSessions() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _proctorService.getSessions();
      if (result.success) {
        _sessions = result.sessions;
        // Cari sesi aktif
        _activeSession = _sessions.where((s) => s.isActive).firstOrNull;
      } else {
        _error = result.message;
      }
    } catch (e) {
      _error = 'Gagal memuat sesi: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Memilih sesi aktif untuk monitoring
  void selectSession(ProctorSession session) {
    _activeSession = session;
    notifyListeners();
  }

  /// Memulai monitoring — single fetch only.
  /// The caller (e.g. MonitoringScreen) is responsible for periodic polling.
  Future<void> startMonitoring(String sessionId) async {
    _isMonitoring = true;
    _error = null;
    notifyListeners();

    // Muat data sekali saja — timer diurus oleh layar pemanggil
    await _fetchMonitoringData(sessionId);
  }

  /// Mengambil data monitoring
  Future<void> _fetchMonitoringData(String sessionId) async {
    try {
      final result = await _proctorService.getMonitoringData(sessionId);
      if (result.success) {
        _students = result.students;
        _recentViolations = result.recentViolations;
        _activeCount = result.activeCount;
        _warningCount = result.warningCount;
        _dangerCount = result.dangerCount;
        notifyListeners();
      }
    } catch (e) {
      // Jangan set error, biarkan data terakhir tetap tampil
    }
  }

  /// Menghentikan monitoring
  void stopMonitoring() {
    _isMonitoring = false;
    _monitoringTimer?.cancel();
    _monitoringTimer = null;
    notifyListeners();
  }

  /// Mendapatkan detail siswa dalam sesi
  Future<void> getStudentDetail({
    required String sessionId,
    required String studentId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _proctorService.getStudentDetail(
        sessionId: sessionId,
        studentId: studentId,
      );
      if (result.success) {
        _studentDetail = result.studentStatus;
        _studentViolations = result.violations;
      } else {
        _error = result.message;
      }
    } catch (e) {
      _error = 'Gagal memuat detail siswa: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Memberi peringatan kepada siswa
  Future<bool> warnStudent({
    required String sessionId,
    required String studentId,
    String? message,
  }) async {
    try {
      return await _proctorService.warnStudent(
        sessionId: sessionId,
        studentId: studentId,
        message: message,
      );
    } catch (e) {
      _error = 'Gagal memberi peringatan: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  /// Diskualifikasi siswa
  Future<bool> disqualifyStudent({
    required String sessionId,
    required String studentId,
    required String reason,
  }) async {
    try {
      final success = await _proctorService.disqualifyStudent(
        sessionId: sessionId,
        studentId: studentId,
        reason: reason,
      );
      if (success) {
        // Perbarui status siswa di daftar lokal
        final index = _students.indexWhere((s) => s.studentId == studentId);
        if (index >= 0) {
          // Hapus dari daftar aktif atau tandai
          await _fetchMonitoringData(sessionId);
        }
      }
      return success;
    } catch (e) {
      _error = 'Gagal mendiskualifikasi: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  /// Mengizinkan siswa kembali
  Future<bool> allowStudent({
    required String sessionId,
    required String studentId,
  }) async {
    try {
      final success = await _proctorService.allowStudent(
        sessionId: sessionId,
        studentId: studentId,
      );
      if (success) {
        await _fetchMonitoringData(sessionId);
      }
      return success;
    } catch (e) {
      _error = 'Gagal mengizinkan siswa: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  /// Melaporkan pelanggaran
  Future<bool> reportViolation({
    required String sessionId,
    required String studentId,
    required String type,
    required String description,
    ViolationSeverity severity = ViolationSeverity.medium,
  }) async {
    try {
      return await _proctorService.reportViolation(
        sessionId: sessionId,
        studentId: studentId,
        type: type,
        description: description,
        severity: severity,
      );
    } catch (e) {
      _error = 'Gagal melaporkan pelanggaran: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  /// Memuat daftar pelanggaran
  Future<void> loadViolations({
    String? sessionId,
    ViolationType? type,
    String? search,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _proctorService.getViolations(
        sessionId: sessionId,
        type: type,
        search: search,
      );
      if (result.success) {
        _violations = result.violations;
      } else {
        _error = result.message;
      }
    } catch (e) {
      _error = 'Gagal memuat pelanggaran: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Memuat laporan sesi
  Future<void> loadSessionReport(String sessionId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _proctorService.getSessionReport(sessionId);
      if (result.success) {
        _report = result.report;
      } else {
        _error = result.message;
      }
    } catch (e) {
      _error = 'Gagal memuat laporan: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Mengakhiri sesi pengawasan
  Future<bool> endSession(String sessionId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final success = await _proctorService.endSession(sessionId);
      if (success) {
        stopMonitoring();
        _activeSession = null;
        await loadSessions();
      }
      _isLoading = false;
      notifyListeners();
      return success;
    } catch (e) {
      _error = 'Gagal mengakhiri sesi: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Bersihkan error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _monitoringTimer?.cancel();
    super.dispose();
  }
}
