import 'package:flutter/foundation.dart';
import '../models/exam.dart';
import '../models/question.dart';
import '../models/answer.dart';
import '../services/exam_service.dart';

/// Provider untuk mengelola state ujian siswa
class ExamProvider with ChangeNotifier {
  final ExamService _examService = ExamService();

  List<Exam> _exams = [];
  Exam? _currentExam;
  List<Question> _questions = [];
  ExamResult? _examResult;
  List<ExamResult> _examResults = [];
  ExamFilter _currentFilter = ExamFilter.all;
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _error;
  int _currentQuestionIndex = 0;
  String? _attemptId;

  // Getter
  List<Exam> get exams => _exams;
  Exam? get currentExam => _currentExam;
  List<Question> get questions => _questions;
  ExamResult? get examResult => _examResult;
  List<ExamResult> get examResults => _examResults;
  ExamFilter get currentFilter => _currentFilter;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get error => _error;
  int get currentQuestionIndex => _currentQuestionIndex;
  String? get attemptId => _attemptId;

  /// Pertanyaan saat ini
  Question? get currentQuestion {
    if (_questions.isEmpty || _currentQuestionIndex >= _questions.length) {
      return null;
    }
    return _questions[_currentQuestionIndex];
  }

  /// Jumlah pertanyaan yang sudah dijawab
  int get answeredCount =>
      _questions.where((q) => q.isAnswered).length;

  /// Jumlah pertanyaan yang ditandai
  int get flaggedCount =>
      _questions.where((q) => q.isFlagged).length;

  /// Jumlah pertanyaan yang belum dijawab
  int get unansweredCount =>
      _questions.where((q) => !q.isAnswered).length;

  /// Persentase progress
  double get progressPercentage {
    if (_questions.isEmpty) return 0;
    return answeredCount / _questions.length;
  }

  /// Memuat daftar ujian
  Future<void> loadExams({ExamFilter? filter}) async {
    _isLoading = true;
    _error = null;
    if (filter != null) _currentFilter = filter;
    notifyListeners();

    try {
      final result = await _examService.getExams(filter: _currentFilter);
      if (result.success) {
        _exams = result.exams;
      } else {
        _error = result.message;
      }
    } catch (e) {
      _error = 'Gagal memuat ujian: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Memuat detail ujian
  Future<void> loadExamDetail(String examId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _examService.getExamDetail(examId);
      if (result.success) {
        _currentExam = result.exam;
      } else {
        _error = result.message;
      }
    } catch (e) {
      _error = 'Gagal memuat detail ujian: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Memulai ujian
  Future<bool> startExam(String examId, {String? token}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _examService.startExam(examId, token: token);
      if (result.success) {
        _attemptId = result.attemptId;
        // Muat pertanyaan setelah ujian dimulai
        await loadQuestions(examId);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = result.message;
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Gagal memulai ujian: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Memuat pertanyaan ujian
  Future<void> loadQuestions(String examId) async {
    try {
      final result = await _examService.getQuestions(examId);
      if (result.success) {
        _questions = result.questions;
        _currentQuestionIndex = 0;
      } else {
        _error = result.message;
      }
    } catch (e) {
      _error = 'Gagal memuat pertanyaan: ${e.toString()}';
    }
    notifyListeners();
  }

  /// Memilih jawaban untuk pertanyaan saat ini
  Future<void> selectAnswer(String optionLabel) async {
    if (currentQuestion == null || _currentExam == null) return;

    // Optimistis: perbarui UI langsung
    final index = _currentQuestionIndex;
    _questions[index] = _questions[index].copyWith(
      selectedAnswer: optionLabel,
      answerStatus: AnswerStatus.answered,
    );
    notifyListeners();

    // Kirim ke server di background
    try {
      await _examService.submitAnswer(
        examId: _currentExam!.id,
        questionId: _questions[index].id,
        selectedOption: optionLabel,
      );
    } catch (e) {
      // Abaikan error background, data tetap tersimpan lokal
    }
  }

  /// Menulis jawaban esai
  Future<void> submitEssayAnswer(String essayText) async {
    if (currentQuestion == null || _currentExam == null) return;

    final index = _currentQuestionIndex;
    _questions[index] = _questions[index].copyWith(
      selectedAnswer: essayText,
      answerStatus: AnswerStatus.answered,
    );
    notifyListeners();

    try {
      await _examService.submitAnswer(
        examId: _currentExam!.id,
        questionId: _questions[index].id,
        essayText: essayText,
      );
    } catch (e) {
      // Abaikan error background
    }
  }

  /// Tandai pertanyaan untuk ditinjau
  Future<void> toggleFlag() async {
    if (currentQuestion == null || _currentExam == null) return;

    final index = _currentQuestionIndex;
    final newFlag = !_questions[index].isFlagged;
    _questions[index] = _questions[index].copyWith(isFlagged: newFlag);
    notifyListeners();

    try {
      await _examService.flagQuestion(
        examId: _currentExam!.id,
        questionId: _questions[index].id,
        isFlagged: newFlag,
      );
    } catch (e) {
      // Abaikan error background
    }
  }

  /// Pindah ke pertanyaan berikutnya
  void nextQuestion() {
    if (_currentQuestionIndex < _questions.length - 1) {
      _currentQuestionIndex++;
      notifyListeners();
    }
  }

  /// Pindah ke pertanyaan sebelumnya
  void previousQuestion() {
    if (_currentQuestionIndex > 0) {
      _currentQuestionIndex--;
      notifyListeners();
    }
  }

  /// Pindah ke pertanyaan tertentu
  void goToQuestion(int index) {
    if (index >= 0 && index < _questions.length) {
      _currentQuestionIndex = index;
      notifyListeners();
    }
  }

  /// Mengumpulkan ujian
  Future<bool> submitExam() async {
    if (_currentExam == null) return false;

    _isSubmitting = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _examService.submitExam(_currentExam!.id);
      if (result.success) {
        // Muat hasil
        await loadExamResult(_currentExam!.id);
        _isSubmitting = false;
        notifyListeners();
        return true;
      } else {
        _error = result.message;
        _isSubmitting = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Gagal mengumpulkan ujian: ${e.toString()}';
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  /// Memuat hasil ujian
  Future<void> loadExamResult(String examId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _examService.getExamResult(examId);
      if (result.success) {
        _examResult = result.result;
      } else {
        _error = result.message;
      }
    } catch (e) {
      _error = 'Gagal memuat hasil: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Memuat daftar hasil ujian siswa
  Future<void> loadExamResults() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _examService.getSiswaResults();
      if (result.success) {
        _examResults = result.results;
      } else {
        _error = result.message;
      }
    } catch (e) {
      _error = 'Gagal memuat hasil ujian: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Mengatur filter
  void setFilter(ExamFilter filter) {
    _currentFilter = filter;
    loadExams(filter: filter);
  }

  /// Reset state ujian saat ini
  void resetCurrentExam() {
    _currentExam = null;
    _questions = [];
    _currentQuestionIndex = 0;
    _attemptId = null;
    _examResult = null;
    notifyListeners();
  }

  /// Reset state hasil ujian
  void resetExamResults() {
    _examResults = [];
    notifyListeners();
  }

  /// Bersihkan error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
