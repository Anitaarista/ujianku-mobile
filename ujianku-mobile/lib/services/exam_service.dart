import '../config/api_config.dart';
import '../models/exam.dart';
import '../models/question.dart';
import '../models/answer.dart';
import 'api_service.dart';

/// Layanan ujian untuk operasi terkait ujian siswa
class ExamService {
  final ApiService _api = ApiService();

  /// Mendapatkan daftar ujian (endpoint siswa)
  Future<ExamListResult> getExams({
    ExamFilter filter = ExamFilter.all,
    int page = 1,
    int perPage = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'per_page': perPage.toString(),
    };

    if (filter != ExamFilter.all) {
      queryParams['status'] = filter.name;
    }

    // Gunakan endpoint khusus siswa untuk mendapatkan data ujian yang relevan
    final response = await _api.get(ApiConfig.siswaExams, queryParams: queryParams);

    if (response.success && response.listBody != null) {
      final exams = response.listBody!
          .map((e) => Exam.fromJson(e as Map<String, dynamic>))
          .toList();

      final totalPages = response.data?['meta']?['last_page'] as int? ?? 1;

      return ExamListResult(
        success: true,
        exams: exams,
        totalPages: totalPages,
        currentPage: page,
      );
    }

    return ExamListResult(
      success: false,
      message: response.message,
    );
  }

  /// Mendapatkan detail ujian
  Future<ExamDetailResult> getExamDetail(String examId) async {
    final response = await _api.get(ApiConfig.examDetail(examId));

    if (response.success && response.body != null) {
      final exam = Exam.fromJson(response.body as Map<String, dynamic>);
      return ExamDetailResult(success: true, exam: exam);
    }

    return ExamDetailResult(
      success: false,
      message: response.message,
    );
  }

  /// Memulai ujian
  Future<StartExamResult> startExam(String examId, {String? token}) async {
    final body = <String, dynamic>{};
    if (token != null && token.isNotEmpty) {
      body['token'] = token;
    }

    final response = await _api.post(ApiConfig.examStart(examId), body: body);

    if (response.success && response.body != null) {
      final data = response.body as Map<String, dynamic>;
      return StartExamResult(
        success: true,
        attemptId: data['attempt_id']?.toString() ?? '',
        message: response.message,
      );
    }

    return StartExamResult(
      success: false,
      message: response.message,
    );
  }

  /// Mendapatkan daftar pertanyaan ujian
  Future<QuestionsResult> getQuestions(String examId) async {
    final response = await _api.get(ApiConfig.examQuestions(examId));

    if (response.success && response.listBody != null) {
      final questions = response.listBody!
          .map((e) => Question.fromJson(e as Map<String, dynamic>))
          .toList();

      return QuestionsResult(success: true, questions: questions);
    }

    return QuestionsResult(
      success: false,
      message: response.message,
    );
  }

  /// Mengirim jawaban untuk satu pertanyaan
  Future<bool> submitAnswer({
    required String examId,
    required String questionId,
    String? selectedOption,
    String? essayText,
  }) async {
    final body = <String, dynamic>{
      'question_id': questionId,
    };
    if (selectedOption != null) body['selected_option'] = selectedOption;
    if (essayText != null) body['essay_text'] = essayText;

    final response = await _api.post(ApiConfig.examAnswer(examId), body: body);
    return response.success;
  }

  /// Menandai pertanyaan untuk ditinjau
  Future<bool> flagQuestion({
    required String examId,
    required String questionId,
    required bool isFlagged,
  }) async {
    final response = await _api.post(
      ApiConfig.examAnswer(examId),
      body: {
        'question_id': questionId,
        'is_flagged': isFlagged,
      },
    );
    return response.success;
  }

  /// Mengumpulkan ujian
  Future<SubmitExamResult> submitExam(String examId) async {
    final response = await _api.post(ApiConfig.examSubmit(examId));

    if (response.success && response.body != null) {
      final data = response.body as Map<String, dynamic>;
      return SubmitExamResult(
        success: true,
        resultId: data['result_id']?.toString() ?? '',
        message: response.message,
      );
    }

    return SubmitExamResult(
      success: false,
      message: response.message,
    );
  }

  /// Mendapatkan hasil ujian
  Future<ExamResultData> getExamResult(String examId) async {
    final response = await _api.get(ApiConfig.examResult(examId));

    if (response.success && response.body != null) {
      final result = ExamResult.fromJson(response.body as Map<String, dynamic>);
      return ExamResultData(success: true, result: result);
    }

    return ExamResultData(
      success: false,
      message: response.message,
    );
  }

  /// Melaporkan pelanggaran (dari sisi siswa)
  Future<bool> reportViolation({
    required String examId,
    required String type,
    String? description,
  }) async {
    final body = <String, dynamic>{
      'type': type,
    };
    if (description != null) body['description'] = description;

    final response = await _api.post(
      '/exams/$examId/violation',
      body: body,
    );
    return response.success;
  }

  /// Mendapatkan daftar hasil ujian siswa
  Future<ExamResultsListResult> getSiswaResults({int page = 1}) async {
    final response = await _api.get(
      ApiConfig.siswaResults,
      queryParams: {'page': page.toString()},
    );

    if (response.success && response.listBody != null) {
      final results = response.listBody!
          .map((e) => ExamResult.fromJson(e as Map<String, dynamic>))
          .toList();

      return ExamResultsListResult(success: true, results: results);
    }

    return ExamResultsListResult(
      success: false,
      message: response.message,
    );
  }
}

/// Hasil daftar ujian
class ExamListResult {
  final bool success;
  final List<Exam> exams;
  final int totalPages;
  final int currentPage;
  final String message;

  const ExamListResult({
    required this.success,
    this.exams = const [],
    this.totalPages = 1,
    this.currentPage = 1,
    this.message = '',
  });
}

/// Hasil detail ujian
class ExamDetailResult {
  final bool success;
  final Exam? exam;
  final String message;

  const ExamDetailResult({
    required this.success,
    this.exam,
    this.message = '',
  });
}

/// Hasil mulai ujian
class StartExamResult {
  final bool success;
  final String attemptId;
  final String message;

  const StartExamResult({
    required this.success,
    this.attemptId = '',
    this.message = '',
  });
}

/// Hasil daftar pertanyaan
class QuestionsResult {
  final bool success;
  final List<Question> questions;
  final String message;

  const QuestionsResult({
    required this.success,
    this.questions = const [],
    this.message = '',
  });
}

/// Hasil kumpul ujian
class SubmitExamResult {
  final bool success;
  final String resultId;
  final String message;

  const SubmitExamResult({
    required this.success,
    this.resultId = '',
    this.message = '',
  });
}

/// Hasil data ujian
class ExamResultData {
  final bool success;
  final ExamResult? result;
  final String message;

  const ExamResultData({
    required this.success,
    this.result,
    this.message = '',
  });
}

/// Hasil daftar hasil ujian siswa
class ExamResultsListResult {
  final bool success;
  final List<ExamResult> results;
  final String message;

  const ExamResultsListResult({
    required this.success,
    this.results = const [],
    this.message = '',
  });
}
