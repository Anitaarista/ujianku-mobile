import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../models/answer.dart';
import '../../providers/exam_provider.dart';
import '../../utils/helpers.dart';
import '../../widgets/custom_button.dart';

/// Halaman hasil ujian — PRO-MAX UI/UX
class ExamResultScreen extends StatefulWidget {
  final String examId;

  const ExamResultScreen({super.key, required this.examId});

  @override
  State<ExamResultScreen> createState() => _ExamResultScreenState();
}

class _ExamResultScreenState extends State<ExamResultScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scoreAnimation;
  bool _showReview = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _scoreAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ExamProvider>().loadExamResult(widget.examId);
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final examProvider = context.watch<ExamProvider>();
    final result = examProvider.examResult;

    if (result != null && !_animationController.isCompleted) {
      _animationController.forward();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Hasil Ujian',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A2E),
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1A1A2E)),
          onPressed: () {
            // Go back to results list or home
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/siswa');
            }
          },
        ),
        actions: [
          if (result != null && result.answerReviews != null)
            TextButton.icon(
              onPressed: () {
                setState(() => _showReview = !_showReview);
              },
              icon: Icon(
                _showReview ? Icons.bar_chart : Icons.quiz_outlined,
                size: 18,
                color: AppTheme.primary,
              ),
              label: Text(
                _showReview ? 'Ringkasan' : 'Review Soal',
                style: const TextStyle(
                    color: AppTheme.primary, fontWeight: FontWeight.w600),
              ),
            ),
        ],
      ),
      body: examProvider.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : result == null
              ? _buildError(examProvider.error)
              : _showReview
                  ? _buildQuestionReview(result)
                  : _buildResult(result),
    );
  }

  Widget _buildError(String? error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
            const SizedBox(height: 16),
            Text(
              error ?? 'Gagal memuat hasil ujian',
              style: TextStyle(
                color: Colors.grey[700],
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            CustomButton(
              text: 'Coba Lagi',
              variant: CustomButtonVariant.outline,
              onPressed: () =>
                  context.read<ExamProvider>().loadExamResult(widget.examId),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResult(ExamResult result) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Kartu skor utama
          _ScoreCard(
            result: result,
            scoreAnimation: _scoreAnimation,
          ),
          const SizedBox(height: 24),

          // Status kelulusan
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Color(result.passColor).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: Color(result.passColor).withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  result.isPassed ? Icons.check_circle : Icons.cancel,
                  color: Color(result.passColor),
                  size: 28,
                ),
                const SizedBox(width: 12),
                Text(
                  result.passLabel,
                  style: TextStyle(
                    color: Color(result.passColor),
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Statistik detail
          Row(
            children: [
              _StatBox(
                label: 'Benar',
                value: '${result.correctAnswers}',
                color: AppTheme.success,
              ),
              const SizedBox(width: 12),
              _StatBox(
                label: 'Salah',
                value: '${result.incorrectAnswers}',
                color: AppTheme.error,
              ),
              const SizedBox(width: 12),
              _StatBox(
                label: 'Belum Dijawab',
                value: '${result.unanswered}',
                color: Colors.grey[500]!,
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Rincian skor
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey[200]!),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Rincian Skor',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                const SizedBox(height: 16),
                _ScoreRow(
                  label: 'Skor Pilihan Ganda',
                  score: result.pgScore,
                  icon: Icons.list_alt,
                ),
                const SizedBox(height: 12),
                _ScoreRow(
                  label: 'Skor Esai',
                  score: result.essayScore,
                  icon: Icons.edit_note,
                ),
                const Divider(height: 24),
                _ScoreRow(
                  label: 'Total Skor',
                  score: result.totalScore,
                  icon: Icons.summarize,
                  isBold: true,
                ),
                const SizedBox(height: 8),
                _ScoreRow(
                  label: 'Persentase',
                  score: result.percentage,
                  icon: Icons.percent,
                  isPercentage: true,
                ),
                const SizedBox(height: 8),
                _ScoreRow(
                  label: 'Grade',
                  score: null,
                  icon: Icons.grade,
                  isBold: true,
                  gradeLabel: result.grade.isNotEmpty ? result.grade : Helpers.getGradeLabel(result.totalScore),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Info waktu
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.timer_outlined, color: Colors.grey[600]),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Waktu Pengerjaan',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        _formatTimeTaken(result.timeTaken),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1A1A2E),
                        ),
                      ),
                    ],
                  ),
                ),
                if (result.completedAt != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Diselesaikan',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        Helpers.formatDateTime(result.completedAt!),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1A2E),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),

          // Review button
          if (result.answerReviews != null &&
              result.answerReviews!.isNotEmpty) ...[
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  setState(() => _showReview = true);
                },
                icon: const Icon(Icons.quiz_outlined),
                label: const Text('Review Jawaban'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primary,
                  side: const BorderSide(color: AppTheme.primary),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],

          const SizedBox(height: 32),

          // Tombol kembali
          CustomButton(
            text: 'Kembali ke Beranda',
            icon: Icons.home,
            isFullWidth: true,
            size: CustomButtonSize.large,
            onPressed: () => context.go('/siswa'),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildQuestionReview(ExamResult result) {
    final reviews = result.answerReviews ?? [];

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: reviews.length,
      itemBuilder: (context, index) {
        final review = reviews[index];
        final isCorrect = review.isCorrect;
        final wasAnswered = review.selectedOption != null;

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isCorrect
                  ? AppTheme.success.withValues(alpha: 0.3)
                  : wasAnswered
                      ? AppTheme.error.withValues(alpha: 0.3)
                      : Colors.grey[300]!,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with status
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isCorrect
                      ? AppTheme.success.withValues(alpha: 0.05)
                      : wasAnswered
                          ? AppTheme.error.withValues(alpha: 0.05)
                          : Colors.grey[50],
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(14),
                    topRight: Radius.circular(14),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Soal ${review.questionNumber}',
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Icon(
                      isCorrect
                          ? Icons.check_circle
                          : wasAnswered
                              ? Icons.cancel
                              : Icons.help_outline,
                      color: isCorrect
                          ? AppTheme.success
                          : wasAnswered
                              ? AppTheme.error
                              : Colors.grey[500],
                      size: 22,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isCorrect
                          ? 'Benar'
                          : wasAnswered
                              ? 'Salah'
                              : 'Tidak Dijawab',
                      style: TextStyle(
                        color: isCorrect
                            ? AppTheme.success
                            : wasAnswered
                                ? AppTheme.error
                                : Colors.grey[600],
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),

              // Question text
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.questionText,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.5,
                        color: Colors.grey[800],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Answer details
                    if (review.selectedOption != null) ...[
                      _ReviewAnswerRow(
                        label: 'Jawaban Anda',
                        value: review.selectedOption!,
                        color: isCorrect ? AppTheme.success : AppTheme.error,
                      ),
                    ],
                    if (!isCorrect || review.selectedOption == null) ...[
                      _ReviewAnswerRow(
                        label: 'Jawaban Benar',
                        value: review.correctOption,
                        color: AppTheme.success,
                      ),
                    ],
                    if (review.explanation != null &&
                        review.explanation!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFCD34D)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.lightbulb_outline,
                                    size: 16, color: Color(0xFFD97706)),
                                const SizedBox(width: 6),
                                const Text(
                                  'Pembahasan',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                    color: Color(0xFFD97706),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              review.explanation!,
                              style: TextStyle(
                                fontSize: 13,
                                height: 1.5,
                                color: Colors.grey[800],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatTimeTaken(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '$hours jam $minutes menit $seconds detik';
    }
    if (minutes > 0) {
      return '$minutes menit $seconds detik';
    }
    return '$seconds detik';
  }
}

/// Review answer row
class _ReviewAnswerRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _ReviewAnswerRow({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}

/// Kartu skor utama dengan animasi
class _ScoreCard extends StatelessWidget {
  final ExamResult result;
  final Animation<double> scoreAnimation;

  const _ScoreCard({required this.result, required this.scoreAnimation});

  @override
  Widget build(BuildContext context) {
    final scoreColor = Color(Helpers.getScoreColor(result.totalScore));

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scoreColor.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            result.examTitle,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A1A2E),
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            result.subject,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 24),

          // Lingkaran skor animasi
          AnimatedBuilder(
            animation: scoreAnimation,
            builder: (context, child) {
              return SizedBox(
                width: 160,
                height: 160,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CircularProgressIndicator(
                      value: (result.percentage / 100) * scoreAnimation.value,
                      strokeWidth: 12,
                      backgroundColor: scoreColor.withValues(alpha: 0.1),
                      valueColor:
                          AlwaysStoppedAnimation<Color>(scoreColor),
                    ),
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            (result.totalScore * scoreAnimation.value)
                                .toStringAsFixed(0),
                            style: TextStyle(
                              fontSize: 44,
                              fontWeight: FontWeight.w800,
                              color: scoreColor,
                            ),
                          ),
                          Text(
                            result.grade.isNotEmpty
                                ? result.grade
                                : Helpers.getGradeLabel(result.totalScore),
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: scoreColor.withValues(alpha: 0.7),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

/// Kotak statistik
class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatBox({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: color,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// Baris skor
class _ScoreRow extends StatelessWidget {
  final String label;
  final double? score;
  final IconData icon;
  final bool isBold;
  final bool isPercentage;
  final String? gradeLabel;

  const _ScoreRow({
    required this.label,
    this.score,
    required this.icon,
    this.isBold = false,
    this.isPercentage = false,
    this.gradeLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey[600]),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.w400,
              color: Colors.grey[800],
            ),
          ),
        ),
        Text(
          gradeLabel ??
              (isPercentage
                  ? '${score!.toStringAsFixed(1)}%'
                  : score!.toStringAsFixed(1)),
          style: TextStyle(
            fontSize: 16,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: isBold ? AppTheme.primary : const Color(0xFF1A1A2E),
          ),
        ),
      ],
    );
  }
}
