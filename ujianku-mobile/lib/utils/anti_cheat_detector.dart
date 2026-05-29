import 'package:flutter/material.dart';
import '../services/exam_service.dart';
import '../services/storage_service.dart';

/// Detektor anti-kecurangan untuk mencegah kecurangan saat ujian
///
/// Fitur:
/// - Mendeteksi perpindahan aplikasi (app switching)
/// - Mendeteksi screenshot
/// - Melacak jumlah pelanggaran
/// - Melaporkan pelanggaran ke server
/// - Menampilkan peringatan saat kembali ke aplikasi
class AntiCheatDetector with WidgetsBindingObserver {
  final String examId;
  final VoidCallback? onViolation;
  final VoidCallback? onMaxViolationsReached;

  int _violationCount = 0;
  bool _isMonitoring = false;
  DateTime? _lastBackgroundTime;
  final ExamService _examService = ExamService();
  // ignore: unused_field
  final StorageService _storage = StorageService();

  /// Jumlah maksimal pelanggaran sebelum diskualifikasi
  static const int maxViolations = 3;

  /// Durasi dianggap pelanggaran jika aplikasi di-background (dalam detik)
  static const int backgroundThresholdSeconds = 2;

  AntiCheatDetector({
    required this.examId,
    this.onViolation,
    this.onMaxViolationsReached,
  });

  /// Jumlah pelanggaran saat ini
  int get violationCount => _violationCount;

  /// Apakah sedang memantau
  bool get isMonitoring => _isMonitoring;

  /// Mulai memantau
  void startMonitoring() {
    if (_isMonitoring) return;
    _isMonitoring = true;
    WidgetsBinding.instance.addObserver(this);
  }

  /// Hentikan memantau
  void stopMonitoring() {
    if (!_isMonitoring) return;
    _isMonitoring = false;
    WidgetsBinding.instance.removeObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_isMonitoring) return;

    switch (state) {
      case AppLifecycleState.paused:
        // Aplikasi masuk ke background
        _lastBackgroundTime = DateTime.now();
        _handleAppSwitch();
        break;

      case AppLifecycleState.resumed:
        // Aplikasi kembali ke foreground
        if (_lastBackgroundTime != null) {
          final duration = DateTime.now().difference(_lastBackgroundTime!);
          if (duration.inSeconds > backgroundThresholdSeconds) {
            // Lama di background, laporkan
            _reportAndNotify(
              type: 'app_switch',
              description:
                  'Siswa meninggalkan aplikasi selama ${duration.inSeconds} detik',
            );
          }
        }
        break;

      case AppLifecycleState.inactive:
        // Aplikasi tidak aktif (mungkin screenshot atau notification panel)
        _handlePossibleScreenshot();
        break;

      case AppLifecycleState.detached:
        // Aplikasi terlepas
        break;

      case AppLifecycleState.hidden:
        // Aplikasi tersembunyi
        break;
    }
  }

  /// Menangani perpindahan aplikasi
  void _handleAppSwitch() {
    _reportAndNotify(
      type: 'app_switch',
      description: 'Siswa berpindah ke aplikasi lain',
    );
  }

  /// Menangani kemungkinan screenshot
  void _handlePossibleScreenshot() {
    // inactive state bisa disebabkan oleh screenshot atau notification panel
    // Kita laporkan sebagai warning ringan
    _reportAndNotify(
      type: 'screenshot',
      description: 'Kemungkinan screenshot atau akses notifikasi',
    );
  }

  /// Melaporkan pelanggaran dan memberi notifikasi
  void _reportAndNotify({
    required String type,
    required String description,
  }) {
    _violationCount++;

    // Laporkan ke server (fire and forget)
    _examService.reportViolation(
      examId: examId,
      type: type,
      description: description,
    );

    // Callback pelanggaran
    onViolation?.call();

    // Cek apakah sudah mencapai batas maksimal
    if (_violationCount >= maxViolations) {
      onMaxViolationsReached?.call();
    }
  }

  /// Mendeteksi perpindahan tab (untuk web)
  void detectTabSwitch() {
    _reportAndNotify(
      type: 'tab_switch',
      description: 'Siswa berpindah tab browser',
    );
  }

  /// Mendeteksi idle terlalu lama
  void detectIdleTimeout() {
    _reportAndNotify(
      type: 'idle_too_long',
      description: 'Siswa tidak aktif selama lebih dari 5 menit',
    );
  }

  /// Reset jumlah pelanggaran
  void resetViolations() {
    _violationCount = 0;
  }

  /// Dispose
  void dispose() {
    stopMonitoring();
  }
}

/// Widget pembungkus untuk deteksi anti-kecurangan
class AntiCheatWrapper extends StatefulWidget {
  final String examId;
  final Widget child;
  final VoidCallback? onViolation;
  final VoidCallback? onMaxViolationsReached;

  const AntiCheatWrapper({
    super.key,
    required this.examId,
    required this.child,
    this.onViolation,
    this.onMaxViolationsReached,
  });

  @override
  State<AntiCheatWrapper> createState() => _AntiCheatWrapperState();
}

class _AntiCheatWrapperState extends State<AntiCheatWrapper> {
  late AntiCheatDetector _detector;
  bool _showWarning = false;

  @override
  void initState() {
    super.initState();
    _detector = AntiCheatDetector(
      examId: widget.examId,
      onViolation: _handleViolation,
      onMaxViolationsReached: _handleMaxViolations,
    );
    _detector.startMonitoring();
  }

  void _handleViolation() {
    if (mounted) {
      setState(() {
        _showWarning = true;
      });

      // Sembunyikan peringatan setelah 3 detik
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          setState(() {
            _showWarning = false;
          });
        }
      });
    }
  }

  void _handleMaxViolations() {
    widget.onMaxViolationsReached?.call();
  }

  @override
  void dispose() {
    _detector.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_showWarning)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _ViolationWarningBanner(
              violationCount: _detector.violationCount,
            ),
          ),
      ],
    );
  }
}

/// Banner peringatan pelanggaran
class _ViolationWarningBanner extends StatelessWidget {
  final int violationCount;

  const _ViolationWarningBanner({required this.violationCount});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFFef4444),
        boxShadow: [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'PELANGGARAN TERDETEKSI! ($violationCount/$AntiCheatDetector.maxViolations)\n'
                'Anda meninggalkan aplikasi ujian. Pelanggaran berulang akan mengakibatkan diskualifikasi.',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
