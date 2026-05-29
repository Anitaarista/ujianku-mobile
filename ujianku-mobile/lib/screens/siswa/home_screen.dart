import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/exam_provider.dart';
import '../../models/exam.dart';
import '../../models/answer.dart';
import '../../config/api_config.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../widgets/exam_card.dart';
import '../../widgets/countdown_timer.dart';
import '../../widgets/custom_button.dart';

/// Halaman beranda siswa — PRO-MAX UI/UX
class SiswaHomeScreen extends StatefulWidget {
  const SiswaHomeScreen({super.key});

  @override
  State<SiswaHomeScreen> createState() => _SiswaHomeScreenState();
}

class _SiswaHomeScreenState extends State<SiswaHomeScreen> {
  final ApiService _api = ApiService();
  List<ExamResult> _recentResults = [];
  bool _isLoadingResults = false;
  double _averageScore = 0.0;
  int _totalExamsCompleted = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ExamProvider>().loadExams();
      _loadResults();
    });
  }

  Future<void> _loadResults() async {
    setState(() => _isLoadingResults = true);
    try {
      final response = await _api.get(ApiConfig.siswaResults);
      if (response.success && response.listBody != null) {
        final results = response.listBody!
            .map((e) => ExamResult.fromJson(e as Map<String, dynamic>))
            .toList();
        setState(() {
          _recentResults = results;
          _totalExamsCompleted = results.length;
          if (results.isNotEmpty) {
            _averageScore = results
                    .map((r) => r.totalScore)
                    .reduce((a, b) => a + b) /
                results.length;
          }
        });
      }
    } catch (_) {}
    setState(() => _isLoadingResults = false);
  }

  Future<void> _refreshAll() async {
    await Future.wait([
      context.read<ExamProvider>().loadExams(),
      _loadResults(),
    ]);
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Keluar dari Akun?',
            style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text(
          'Anda akan keluar dari akun dan harus login kembali.',
          style: TextStyle(color: Colors.grey[600]),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('Batal',
                style:
                    TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              await context.read<AuthProvider>().logout();
              if (mounted) {
                context.go('/login');
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('Keluar',
                style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final examProvider = context.watch<ExamProvider>();
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: RefreshIndicator(
        onRefresh: _refreshAll,
        color: AppTheme.primary,
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(child: _HomeHeader(user: user, onLogout: _showLogoutDialog)),

            // Statistik ringkas
            SliverToBoxAdapter(
              child: _QuickStats(
                upcomingCount: examProvider.exams
                    .where((e) => e.isUpcoming || e.isOngoing)
                    .length,
                completedCount: _totalExamsCompleted,
                averageScore: _averageScore,
              ),
            ),

            // Quick actions
            SliverToBoxAdapter(child: _QuickActions(
              onExams: () => context.go('/siswa/exams'),
              onResults: () => context.go('/siswa/results'),
              onProfile: () => context.go('/siswa/profile'),
            )),

            // Ujian mendatang
            SliverToBoxAdapter(
              child: _UpcomingExamSection(exams: examProvider.exams),
            ),

            // Hasil terbaru
            SliverToBoxAdapter(
              child: _RecentResultsSection(results: _recentResults),
            ),

            // Daftar ujian terbaru
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 24, 20, 8),
                child: Text(
                  'Ujian Terbaru',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
              ),
            ),

            // Daftar ujian
            examProvider.isLoading
                ? const SliverFillRemaining(
                    child: Center(
                        child: CircularProgressIndicator(color: AppTheme.primary)),
                  )
                : examProvider.exams.isEmpty
                    ? SliverFillRemaining(
                        child: _EmptyState(
                          icon: Icons.assignment_outlined,
                          message: 'Belum ada ujian tersedia',
                          subtitle: 'Ujian akan muncul ketika tersedia untuk Anda',
                        ),
                      )
                    : SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final exam = examProvider.exams[index];
                              return ExamCard(
                                exam: exam,
                                onTap: () =>
                                    context.push('/siswa/exams/${exam.id}'),
                              );
                            },
                            childCount: examProvider.exams.length > 5
                                ? 5
                                : examProvider.exams.length,
                          ),
                        ),
                      ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}

/// Header halaman beranda
class _HomeHeader extends StatelessWidget {
  final dynamic user;
  final VoidCallback onLogout;
  const _HomeHeader({required this.user, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 56, 20, 28),
      decoration: const BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            child: Text(
              user?.initials ?? 'S',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 20,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  Helpers.getGreeting(),
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  user?.name ?? 'Siswa',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.logout, color: Colors.white, size: 20),
              onPressed: () => _showLogoutDialog(),
              tooltip: 'Keluar',
            ),
          ),
        ],
      ),
    );
  }
}

/// Statistik ringkas
class _QuickStats extends StatelessWidget {
  final int upcomingCount;
  final int completedCount;
  final double averageScore;

  const _QuickStats({
    required this.upcomingCount,
    required this.completedCount,
    required this.averageScore,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Row(
        children: [
          _StatCard(
            icon: Icons.upcoming_outlined,
            label: 'Mendatang',
            value: '$upcomingCount',
            color: AppTheme.accent,
          ),
          const SizedBox(width: 12),
          _StatCard(
            icon: Icons.check_circle_outline,
            label: 'Selesai',
            value: '$completedCount',
            color: AppTheme.success,
          ),
          const SizedBox(width: 12),
          _StatCard(
            icon: Icons.bar_chart_outlined,
            label: 'Rata-rata',
            value: averageScore > 0 ? averageScore.toStringAsFixed(0) : '-',
            color: AppTheme.primary,
          ),
        ],
      ),
    );
  }
}

/// Kartu statistik
class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
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
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 11,
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

/// Quick action buttons
class _QuickActions extends StatelessWidget {
  final VoidCallback onExams;
  final VoidCallback onResults;
  final VoidCallback onProfile;

  const _QuickActions({
    required this.onExams,
    required this.onResults,
    required this.onProfile,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Aksi Cepat',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A1A2E),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _QuickActionButton(
                  icon: Icons.assignment_outlined,
                  label: 'Lihat Ujian',
                  color: AppTheme.primary,
                  onTap: () => context.go('/siswa/exams'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickActionButton(
                  icon: Icons.bar_chart_outlined,
                  label: 'Hasil Terakhir',
                  color: AppTheme.accent,
                  onTap: () => context.go('/siswa/results'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickActionButton(
                  icon: Icons.person_outline,
                  label: 'Profil',
                  color: AppTheme.secondary,
                  onTap: () => context.go('/siswa/profile'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Quick action button
class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
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
          child: Column(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey[800],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Seksi ujian mendatang
class _UpcomingExamSection extends StatelessWidget {
  final List<Exam> exams;
  const _UpcomingExamSection({required this.exams});

  @override
  Widget build(BuildContext context) {
    final upcomingExams =
        exams.where((e) => e.isOngoing || e.isUpcoming).take(3).toList();

    if (upcomingExams.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Ujian Mendatang',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1A2E),
                ),
              ),
              TextButton(
                onPressed: () => context.go('/siswa/exams'),
                child: const Text('Lihat Semua',
                    style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...upcomingExams.map((exam) => _UpcomingExamCard(exam: exam)),
        ],
      ),
    );
  }
}

/// Kartu ujian mendatang
class _UpcomingExamCard extends StatelessWidget {
  final Exam exam;
  const _UpcomingExamCard({required this.exam});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1e293b), Color(0xFF334155)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: exam.isOngoing
                      ? AppTheme.success.withValues(alpha: 0.25)
                      : AppTheme.accent.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  exam.isOngoing ? 'Berlangsung' : 'Mendatang',
                  style: TextStyle(
                    color: exam.isOngoing ? AppTheme.success : AppTheme.accent,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Spacer(),
              const Icon(Icons.access_time,
                  color: Colors.white60, size: 16),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            exam.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            exam.subject,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.65),
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _ExamInfoChip(
                  icon: Icons.calendar_today,
                  text: Helpers.formatDateShort(exam.startTime)),
              const SizedBox(width: 16),
              _ExamInfoChip(
                  icon: Icons.timer, text: exam.durationFormatted),
              const SizedBox(width: 16),
              _ExamInfoChip(
                  icon: Icons.quiz, text: '${exam.totalQuestions} Soal'),
            ],
          ),
          if (exam.isOngoing) ...[
            const SizedBox(height: 16),
            CountdownTimer(
              totalSeconds: exam.duration * 60,
              remainingSeconds: exam.remainingSeconds,
              fontSize: 24,
            ),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.push('/siswa/exams/${exam.id}'),
              style: ElevatedButton.styleFrom(
                backgroundColor: exam.isOngoing
                    ? AppTheme.success
                    : Colors.white.withValues(alpha: 0.15),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                exam.isOngoing ? 'Mulai Ujian' : 'Lihat Detail',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Chip info ujian
class _ExamInfoChip extends StatelessWidget {
  final IconData icon;
  final String text;

  const _ExamInfoChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Colors.white54, size: 14),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(
            color: Colors.white60,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

/// Seksi hasil terbaru
class _RecentResultsSection extends StatelessWidget {
  final List<ExamResult> results;
  const _RecentResultsSection({required this.results});

  @override
  Widget build(BuildContext context) {
    if (results.isEmpty) return const SizedBox.shrink();

    final displayResults = results.take(3).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Hasil Terbaru',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1A2E),
                ),
              ),
              TextButton(
                onPressed: () => context.go('/siswa/results'),
                child: const Text('Lihat Semua',
                    style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...displayResults.map((result) => _ResultCard(result: result)),
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
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
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
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
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
                  fontSize: 18,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.examTitle,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: Color(0xFF1A1A2E)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  result.subject,
                  style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                      fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          CustomButton(
            text: 'Lihat',
            variant: CustomButtonVariant.ghost,
            size: CustomButtonSize.small,
            customColor: AppTheme.primary,
            onPressed: () =>
                context.push('/siswa/exams/${result.examId}/result'),
          ),
        ],
      ),
    );
  }
}

/// State kosong
class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? subtitle;

  const _EmptyState({
    required this.icon,
    required this.message,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(
                color: Colors.grey[700],
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(
                subtitle!,
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 13,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
