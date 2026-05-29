import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../models/answer.dart';
import '../../providers/exam_provider.dart';
import '../../utils/helpers.dart';
import '../../widgets/custom_button.dart';

/// Halaman daftar hasil ujian siswa — PRO-MAX UI/UX
class ExamResultsListScreen extends StatefulWidget {
  const ExamResultsListScreen({super.key});

  @override
  State<ExamResultsListScreen> createState() => _ExamResultsListScreenState();
}

class _ExamResultsListScreenState extends State<ExamResultsListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ExamProvider>().loadExamResults();
    });
  }

  Future<void> _refreshResults() async {
    await context.read<ExamProvider>().loadExamResults();
  }

  @override
  Widget build(BuildContext context) {
    final examProvider = context.watch<ExamProvider>();

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
      ),
      body: RefreshIndicator(
        onRefresh: _refreshResults,
        color: AppTheme.primary,
        child: examProvider.isLoading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              )
            : examProvider.error != null
                ? _buildErrorState(examProvider)
                : examProvider.examResults.isEmpty
                    ? _buildEmptyState()
                    : _buildResultsList(examProvider),
      ),
    );
  }

  Widget _buildErrorState(ExamProvider provider) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
            const SizedBox(height: 16),
            Text(
              provider.error ?? 'Gagal memuat hasil ujian',
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
              onPressed: () => provider.loadExamResults(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.7,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bar_chart_outlined,
                      size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Belum Ada Hasil Ujian',
                    style: TextStyle(
                      color: Colors.grey[700],
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Hasil ujian akan muncul setelah Anda menyelesaikan ujian',
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 13,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildResultsList(ExamProvider provider) {
    // Hitung statistik
    double averageScore = 0;
    int bestScore = 0;
    final results = provider.examResults;

    if (results.isNotEmpty) {
      averageScore =
          results.map((r) => r.totalScore).reduce((a, b) => a + b) /
              results.length;
      bestScore = results
          .map((r) => r.totalScore.round())
          .reduce((a, b) => a > b ? a : b);
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Statistik ringkas
        if (results.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ringkasan Hasil',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _SummaryStatItem(
                        label: 'Total Ujian',
                        value: '${results.length}',
                        icon: Icons.assignment_turned_in_outlined,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SummaryStatItem(
                        label: 'Rata-rata',
                        value: averageScore.toStringAsFixed(0),
                        icon: Icons.bar_chart_outlined,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SummaryStatItem(
                        label: 'Nilai Tertinggi',
                        value: '$bestScore',
                        icon: Icons.emoji_events_outlined,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        const SizedBox(height: 24),

        // Daftar hasil
        const Text(
          'Riwayat Hasil',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A2E),
          ),
        ),
        const SizedBox(height: 12),
        ...results.map((result) => _ResultCard(result: result)),

        const SizedBox(height: 100),
      ],
    );
  }
}

/// Item statistik ringkas
class _SummaryStatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _SummaryStatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.75),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// Kartu hasil ujian
class _ResultCard extends StatelessWidget {
  final ExamResult result;
  const _ResultCard({required this.result});

  @override
  Widget build(BuildContext context) {
    final scoreColor = Color(Helpers.getScoreColor(result.totalScore));

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            if (result.examId.isNotEmpty) {
              context.push('/siswa/exams/${result.examId}/result');
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Lingkaran skor
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: scoreColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      result.totalScore.toStringAsFixed(0),
                      style: TextStyle(
                        color: scoreColor,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Info ujian
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        result.examTitle,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: Color(0xFF1A1A2E),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        result.subject,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          _MiniInfo(
                            icon: Icons.check_circle_outline,
                            text: '${result.correctAnswers} benar',
                            color: AppTheme.success,
                          ),
                          const SizedBox(width: 12),
                          _MiniInfo(
                            icon: Icons.cancel_outlined,
                            text: '${result.incorrectAnswers} salah',
                            color: AppTheme.error,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Status lulus/tidak
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: result.isPassed
                            ? AppTheme.success.withValues(alpha: 0.1)
                            : AppTheme.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        result.passLabel,
                        style: TextStyle(
                          color:
                              result.isPassed ? AppTheme.success : AppTheme.error,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      result.grade.isNotEmpty
                          ? result.grade
                          : Helpers.getGradeLabel(result.totalScore),
                      style: TextStyle(
                        color: scoreColor,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Mini info chip
class _MiniInfo extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;

  const _MiniInfo({
    required this.icon,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
