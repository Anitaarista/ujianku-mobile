import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/proctor_provider.dart';
import '../../models/proctor_session.dart';
import '../../models/violation.dart';
import '../../utils/helpers.dart';
import '../../widgets/custom_button.dart';

/// Halaman beranda pengawas — PRO-MAX UI/UX
class PengawasHomeScreen extends StatefulWidget {
  const PengawasHomeScreen({super.key});

  @override
  State<PengawasHomeScreen> createState() => _PengawasHomeScreenState();
}

class _PengawasHomeScreenState extends State<PengawasHomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final proctor = context.read<ProctorProvider>();
      proctor.loadSessions();
      proctor.loadViolations();
    });
  }

  Future<void> _refresh() async {
    final proctor = context.read<ProctorProvider>();
    await proctor.loadSessions();
    await proctor.loadViolations();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final proctorProvider = context.watch<ProctorProvider>();
    final user = authProvider.user;
    final activeSession = proctorProvider.activeSession;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: AppTheme.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _PengawasHeader(user: user)),
            SliverToBoxAdapter(
              child: _ActiveSessionCard(
                session: activeSession,
                onMonitor: () {
                  if (activeSession != null) {
                    proctorProvider.selectSession(activeSession);
                    context.go('/pengawas/monitoring');
                  }
                },
              ),
            ),
            SliverToBoxAdapter(
              child: _TodayStats(sessions: proctorProvider.sessions),
            ),
            SliverToBoxAdapter(
              child: _QuickActions(
                onNewSession: () => context.go('/pengawas/monitoring'),
                onViolations: () => context.go('/pengawas/violations'),
                onReports: () => context.go('/pengawas/reports'),
              ),
            ),
            if (proctorProvider.violations.isNotEmpty)
              SliverToBoxAdapter(
                child: _RecentViolations(
                  violations: proctorProvider.violations,
                  onViewAll: () => context.go('/pengawas/violations'),
                ),
              ),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: Text(
                  'Jadwal Hari Ini',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
              ),
            ),
            proctorProvider.isLoading
                ? const SliverFillRemaining(
                    child: Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    ),
                  )
                : proctorProvider.error != null
                    ? SliverFillRemaining(
                        child: _ErrorState(
                          message: proctorProvider.error!,
                          onRetry: () => proctorProvider.loadSessions(),
                        ),
                      )
                    : proctorProvider.sessions.isEmpty
                        ? SliverFillRemaining(
                            child: Center(
                              child: Padding(
                                padding: const EdgeInsets.all(40),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.event_busy,
                                        size: 64, color: Colors.grey[400]),
                                    const SizedBox(height: 16),
                                    Text(
                                      'Tidak ada jadwal hari ini',
                                      style: TextStyle(
                                        color: Colors.grey[700],
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Jadwal pengawasan akan muncul di sini',
                                      style: TextStyle(
                                          color: Colors.grey[500], fontSize: 13),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          )
                        : SliverPadding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            sliver: SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, index) {
                                  final session =
                                      proctorProvider.sessions[index];
                                  return _SessionCard(
                                    session: session,
                                    onTap: () {
                                      proctorProvider
                                          .selectSession(session);
                                      if (session.isActive) {
                                        context.go('/pengawas/monitoring');
                                      } else if (session.isCompleted) {
                                        context.go(
                                          '/pengawas/sessions/${session.id}/report',
                                        );
                                      }
                                    },
                                  );
                                },
                                childCount: proctorProvider.sessions.length,
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

/// Header pengawas
class _PengawasHeader extends StatelessWidget {
  final dynamic user;
  const _PengawasHeader({required this.user});

  void _showLogoutDialog(BuildContext context) {
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
              if (context.mounted) {
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
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 56, 20, 28),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1e293b), Color(0xFF334155)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: Colors.white.withValues(alpha: 0.15),
            child: Text(
              user?.initials ?? 'P',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
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
                  style: const TextStyle(color: Colors.white60, fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  user?.name ?? 'Pengawas',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.shield_outlined, color: AppTheme.primary, size: 16),
                SizedBox(width: 4),
                Text(
                  'Pengawas',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: IconButton(
              icon: const Icon(Icons.logout, color: Colors.white, size: 20),
              onPressed: () => _showLogoutDialog(context),
              tooltip: 'Keluar',
              padding: const EdgeInsets.all(8),
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            ),
          ),
        ],
      ),
    );
  }
}

/// Kartu sesi aktif
class _ActiveSessionCard extends StatelessWidget {
  final ProctorSession? session;
  final VoidCallback? onMonitor;

  const _ActiveSessionCard({this.session, this.onMonitor});

  @override
  Widget build(BuildContext context) {
    if (session == null) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        child: Container(
          padding: const EdgeInsets.all(20),
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
              Icon(Icons.monitor_outlined, size: 32, color: Colors.grey[400]),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Tidak Ada Sesi Aktif',
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          color: Color(0xFF1A1A2E)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tidak ada sesi pengawasan berlangsung',
                      style: TextStyle(
                          color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Container(
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
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.circle, color: Colors.white, size: 8),
                      SizedBox(width: 6),
                      Text(
                        'Sesi Aktif',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'LIVE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              session!.examTitle,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              session!.subject,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _SessionInfoChip(
                  icon: Icons.people_outline,
                  text:
                      '${session!.activeStudents}/${session!.totalStudents} siswa',
                ),
                const SizedBox(width: 16),
                _SessionInfoChip(
                  icon: Icons.warning_amber,
                  text: '${session!.violationCount} pelanggaran',
                ),
                const SizedBox(width: 16),
                _SessionInfoChip(
                  icon: Icons.schedule,
                  text: session!.startTimeFormatted,
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onMonitor,
                icon: const Icon(Icons.monitor, size: 18),
                label: const Text('Mulai Monitoring'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  textStyle: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Chip info sesi
class _SessionInfoChip extends StatelessWidget {
  final IconData icon;
  final String text;

  const _SessionInfoChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Colors.white60, size: 14),
        const SizedBox(width: 4),
        Text(text,
            style: const TextStyle(color: Colors.white60, fontSize: 12, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

/// Statistik hari ini
class _TodayStats extends StatelessWidget {
  final List<ProctorSession> sessions;
  const _TodayStats({required this.sessions});

  @override
  Widget build(BuildContext context) {
    final activeSessions = sessions.where((s) => s.isActive).length;
    final totalViolations =
        sessions.fold<int>(0, (sum, s) => sum + s.violationCount);
    final totalMonitored =
        sessions.fold<int>(0, (sum, s) => sum + s.activeStudents);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Row(
        children: [
          Expanded(
            child: _StatCard(
              icon: Icons.play_circle_outline,
              label: 'Sesi Aktif',
              value: '$activeSessions',
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              icon: Icons.warning_amber,
              label: 'Pelanggaran',
              value: '$totalViolations',
              color: AppTheme.error,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              icon: Icons.people_outline,
              label: 'Dimonitor',
              value: '$totalMonitored',
              color: AppTheme.accent,
            ),
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
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
                color: color, fontSize: 24, fontWeight: FontWeight.w800),
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
    );
  }
}

/// Quick action buttons
class _QuickActions extends StatelessWidget {
  final VoidCallback onNewSession;
  final VoidCallback onViolations;
  final VoidCallback onReports;

  const _QuickActions({
    required this.onNewSession,
    required this.onViolations,
    required this.onReports,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Aksi Cepat',
            style: TextStyle(
                fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1A1A2E)),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.add_circle_outline,
                  label: 'Mulai Sesi',
                  color: AppTheme.primary,
                  onTap: onNewSession,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.warning_amber,
                  label: 'Pelanggaran',
                  color: AppTheme.warning,
                  onTap: onViolations,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.assessment_outlined,
                  label: 'Laporan',
                  color: AppTheme.accent,
                  onTap: onReports,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
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
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Recent violations summary
class _RecentViolations extends StatelessWidget {
  final List<Violation> violations;
  final VoidCallback onViewAll;

  const _RecentViolations({
    required this.violations,
    required this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    final recent = violations.take(3).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Pelanggaran Terbaru',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1A1A2E)),
              ),
              const Spacer(),
              TextButton(
                onPressed: onViewAll,
                child: const Text('Lihat Semua',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...recent.map((v) => _ViolationSummaryCard(violation: v)),
        ],
      ),
    );
  }
}

class _ViolationSummaryCard extends StatelessWidget {
  final Violation violation;
  const _ViolationSummaryCard({required this.violation});

  @override
  Widget build(BuildContext context) {
    final severityColor = Color(violation.severityColor);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: severityColor.withValues(alpha: 0.2)),
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
          Text(violation.typeIcon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  violation.studentName,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF1A1A2E)),
                ),
                Text(
                  violation.typeLabel,
                  style: TextStyle(
                    color: severityColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: severityColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  violation.severityLabel,
                  style: TextStyle(
                    color: severityColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                violation.timeFormatted,
                style: TextStyle(
                    color: Colors.grey[500], fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Kartu sesi pengawasan
class _SessionCard extends StatelessWidget {
  final ProctorSession session;
  final VoidCallback? onTap;

  const _SessionCard({required this.session, this.onTap});

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    String statusLabel;
    IconData statusIcon;

    switch (session.status) {
      case SessionStatus.active:
        statusColor = AppTheme.success;
        statusLabel = 'Berlangsung';
        statusIcon = Icons.play_circle;
        break;
      case SessionStatus.completed:
        statusColor = AppTheme.secondary;
        statusLabel = 'Selesai';
        statusIcon = Icons.check_circle;
        break;
      case SessionStatus.scheduled:
        statusColor = AppTheme.accent;
        statusLabel = 'Terjadwal';
        statusIcon = Icons.schedule;
        break;
    }

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
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(statusIcon, color: statusColor, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        session.examTitle,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                            color: Color(0xFF1A1A2E)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.only(left: 54),
                  child: Text(
                    '${session.subject} - ${session.className}',
                    style: TextStyle(
                        color: Colors.grey[600], fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                ),
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.only(left: 54),
                  child: Row(
                    children: [
                      Icon(Icons.people_outline,
                          size: 16, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text('${session.totalStudents} siswa',
                          style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500)),
                      const SizedBox(width: 16),
                      Icon(Icons.schedule, size: 16, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text(
                        '${session.startTimeFormatted} - ${session.endTimeFormatted}',
                        style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                if (session.violationCount > 0) ...[
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.only(left: 54),
                    child: Row(
                      children: [
                        Icon(Icons.warning_amber,
                            size: 16, color: AppTheme.warning),
                        const SizedBox(width: 4),
                        Text(
                          '${session.violationCount} pelanggaran',
                          style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.warning,
                              fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Error state
class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(
                  color: Colors.grey[700], fontSize: 14, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            CustomButton(
              text: 'Coba Lagi',
              variant: CustomButtonVariant.outline,
              onPressed: onRetry,
            ),
          ],
        ),
      ),
    );
  }
}
