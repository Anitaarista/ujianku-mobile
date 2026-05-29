import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../config/theme.dart';
import '../../providers/proctor_provider.dart';
import '../../models/proctor_session.dart';
import '../../utils/helpers.dart';
import '../../widgets/custom_button.dart';

/// Halaman laporan sesi — PRO-MAX UI/UX
class ReportScreen extends StatefulWidget {
  final String sessionId;

  const ReportScreen({super.key, required this.sessionId});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final proctor = context.read<ProctorProvider>();
      if (widget.sessionId.isNotEmpty) {
        proctor.loadSessionReport(widget.sessionId);
      } else {
        // Load sessions so we can list completed ones for the user to pick
        proctor.loadSessions();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final proctorProvider = context.watch<ProctorProvider>();
    final report = proctorProvider.report;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Laporan Sesi',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A2E),
          ),
        ),
        actions: [
          if (widget.sessionId.isNotEmpty)
            IconButton(
              icon: Icon(Icons.share_outlined, color: Colors.grey[700]),
              onPressed: _shareReport,
              tooltip: 'Bagikan',
            ),
        ],
      ),
      body: widget.sessionId.isEmpty
          ? _buildSessionPicker(proctorProvider)
          : proctorProvider.isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: AppTheme.primary))
              : report == null
                  ? _buildError()
                  : _buildReport(report),
    );
  }

  /// When no sessionId is provided, show a list of completed sessions the
  /// pengawas can pick from.
  Widget _buildSessionPicker(ProctorProvider proctorProvider) {
    if (proctorProvider.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    final completedSessions = proctorProvider.sessions
        .where((s) => s.isCompleted)
        .toList();

    if (completedSessions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.assessment_outlined,
                  size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              Text(
                'Belum ada sesi yang selesai',
                style: TextStyle(
                    color: Colors.grey[700],
                    fontSize: 16,
                    fontWeight: FontWeight.w600),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'Laporan akan tersedia setelah sesi ujian selesai',
                style: TextStyle(color: Colors.grey[500], fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              CustomButton(
                text: 'Lihat Jadwal',
                variant: CustomButtonVariant.outline,
                onPressed: () => context.go('/pengawas'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          'Pilih Sesi untuk Laporan',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A2E),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Pilih sesi ujian yang sudah selesai untuk melihat laporannya',
          style: TextStyle(color: Colors.grey[600], fontSize: 13),
        ),
        const SizedBox(height: 16),
        ...completedSessions.map((session) => _ReportSessionCard(
          session: session,
          onTap: () => context.go(
            '/pengawas/sessions/${session.id}/report',
          ),
        )),
      ],
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
            const SizedBox(height: 16),
            Text(
              'Gagal memuat laporan',
              style: TextStyle(
                  color: Colors.grey[700],
                  fontSize: 16,
                  fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 24),
            CustomButton(
              text: 'Coba Lagi',
              variant: CustomButtonVariant.outline,
              onPressed: () => context
                  .read<ProctorProvider>()
                  .loadSessionReport(widget.sessionId),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReport(Map<String, dynamic> report) {
    final totalStudents = report['total_students'] as int? ?? 0;
    final completedStudents = report['completed_students'] as int? ?? 0;
    final activeStudents = report['active_students'] as int? ?? 0;
    final disqualifiedStudents = report['disqualified_students'] as int? ?? 0;
    final totalViolations = report['total_violations'] as int? ?? 0;
    final completionRate = report['completion_rate'] as double? ?? 0.0;
    final examTitle = report['exam_title'] as String? ?? 'Ujian';
    final subject = report['subject'] as String? ?? '';
    final className = report['class_name'] as String? ?? '';

    final violationBreakdown =
        report['violation_breakdown'] as Map<String, dynamic>? ?? {};
    final studentResults =
        report['student_results'] as List<dynamic>? ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ringkasan sesi
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
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
                Text(
                  'Ringkasan Sesi',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.75),
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  examTitle,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$subject - $className',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Statistik utama
          const Text(
            'Statistik',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A1A2E)),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _ReportStatCard(
                label: 'Total Siswa',
                value: '$totalStudents',
                icon: Icons.people_outline,
                color: AppTheme.primary,
              ),
              const SizedBox(width: 12),
              _ReportStatCard(
                label: 'Selesai',
                value: '$completedStudents',
                icon: Icons.check_circle_outline,
                color: AppTheme.success,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _ReportStatCard(
                label: 'Aktif',
                value: '$activeStudents',
                icon: Icons.play_circle_outline,
                color: AppTheme.accent,
              ),
              const SizedBox(width: 12),
              _ReportStatCard(
                label: 'Diskualifikasi',
                value: '$disqualifiedStudents',
                icon: Icons.block,
                color: AppTheme.error,
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Tingkat penyelesaian
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
                  'Tingkat Penyelesaian',
                  style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1A1A2E)),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: completionRate / 100,
                          minHeight: 12,
                          backgroundColor: Colors.grey[200],
                          valueColor: const AlwaysStoppedAnimation<Color>(
                              AppTheme.primary),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      '${completionRate.toStringAsFixed(1)}%',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Pelanggaran
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: totalViolations > 0
                  ? AppTheme.error.withValues(alpha: 0.05)
                  : AppTheme.success.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: totalViolations > 0
                    ? AppTheme.error.withValues(alpha: 0.2)
                    : AppTheme.success.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  totalViolations > 0
                      ? Icons.warning_amber
                      : Icons.check_circle,
                  color:
                      totalViolations > 0 ? AppTheme.error : AppTheme.success,
                  size: 32,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total Pelanggaran',
                        style: TextStyle(
                          color: totalViolations > 0
                              ? AppTheme.error
                              : AppTheme.success,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '$totalViolations pelanggaran tercatat',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '$totalViolations',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: totalViolations > 0
                        ? AppTheme.error
                        : AppTheme.success,
                  ),
                ),
              ],
            ),
          ),

          // Violation breakdown
          if (violationBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text(
              'Rincian Pelanggaran',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1A2E)),
            ),
            const SizedBox(height: 12),
            ...violationBreakdown.entries.map((entry) {
              final typeLabel = _getViolationTypeLabel(entry.key);
              final typeIcon = _getViolationTypeIcon(entry.key);
              final count = entry.value is int
                  ? entry.value as int
                  : (entry.value as double?)?.toInt() ?? 0;
              final percentage =
                  totalViolations > 0 ? (count / totalViolations) * 100 : 0.0;

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
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
                    Text(typeIcon, style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            typeLabel,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                                color: Color(0xFF1A1A2E)),
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: percentage / 100,
                              minHeight: 6,
                              backgroundColor: Colors.grey[200],
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                  AppTheme.warning),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '$count',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: Color(0xFF1A1A2E),
                          ),
                        ),
                        Text(
                          '${percentage.toStringAsFixed(0)}%',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
          ],

          // Student results table
          if (studentResults.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text(
              'Hasil Siswa',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1A2E)),
            ),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Table(
                  columnWidths: const {
                    0: FlexColumnWidth(2.5),
                    1: FlexColumnWidth(1),
                    2: FlexColumnWidth(1.2),
                    3: FlexColumnWidth(1),
                  },
                  children: [
                    TableRow(
                      decoration:
                          const BoxDecoration(color: Color(0xFFF8F9FA)),
                      children: [
                        _TableHeaderCell('Nama'),
                        _TableHeaderCell('Skor'),
                        _TableHeaderCell('Status'),
                        _TableHeaderCell('Pel.'),
                      ],
                    ),
                    ...studentResults.map((item) {
                      final data = item as Map<String, dynamic>;
                      final name = data['name'] as String? ?? '-';
                      final score = data['score'] as double? ??
                          (data['score'] as int?)?.toDouble() ??
                          0;
                      final status = data['status'] as String? ?? '-';
                      final violationCount =
                          data['violation_count'] as int? ?? 0;

                      Color statusColor;
                      String statusLabel;
                      switch (status.toLowerCase()) {
                        case 'completed':
                        case 'selesai':
                          statusColor = AppTheme.success;
                          statusLabel = 'Selesai';
                          break;
                        case 'disqualified':
                        case 'diskualifikasi':
                          statusColor = AppTheme.error;
                          statusLabel = 'Diskual.';
                          break;
                        default:
                          statusColor = AppTheme.accent;
                          statusLabel = 'Aktif';
                      }

                      final scoreColor =
                          Color(Helpers.getScoreColor(score));

                      return TableRow(
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          border: Border(
                            bottom: BorderSide(color: Color(0xFFE5E7EB)),
                          ),
                        ),
                        children: [
                          _TableDataCell(Text(
                            name,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                                color: Color(0xFF1A1A2E)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          )),
                          _TableDataCell(Text(
                            score.toStringAsFixed(0),
                            style: TextStyle(
                              color: scoreColor,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          )),
                          _TableDataCell(Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              statusLabel,
                              style: TextStyle(
                                color: statusColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          )),
                          _TableDataCell(Text(
                            violationCount > 0 ? '$violationCount' : '-',
                            style: TextStyle(
                              color: violationCount > 0
                                  ? AppTheme.warning
                                  : Colors.grey[500],
                              fontWeight: violationCount > 0
                                  ? FontWeight.w700
                                  : FontWeight.normal,
                              fontSize: 12,
                            ),
                            textAlign: TextAlign.center,
                          )),
                        ],
                      );
                    }),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 32),

          if (widget.sessionId.isNotEmpty) ...[
            CustomButton(
              text: 'Salin Laporan',
              icon: Icons.copy,
              variant: CustomButtonVariant.outline,
              isFullWidth: true,
              onPressed: _exportPdf,
            ),
            const SizedBox(height: 12),
            CustomButton(
              text: 'Akhiri Sesi',
              icon: Icons.stop_circle,
              variant: CustomButtonVariant.danger,
              isFullWidth: true,
              onPressed: _endSession,
            ),
          ],
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  String _buildReportSummaryText() {
    final report = context.read<ProctorProvider>().report;
    if (report == null) return 'Laporan belum tersedia.';

    final totalStudents = report['total_students'] as int? ?? 0;
    final completedStudents = report['completed_students'] as int? ?? 0;
    final activeStudents = report['active_students'] as int? ?? 0;
    final disqualifiedStudents = report['disqualified_students'] as int? ?? 0;
    final totalViolations = report['total_violations'] as int? ?? 0;
    final completionRate = report['completion_rate'] as double? ?? 0.0;
    final examTitle = report['exam_title'] as String? ?? 'Ujian';
    final subject = report['subject'] as String? ?? '';
    final className = report['class_name'] as String? ?? '';

    final violationBreakdown =
        report['violation_breakdown'] as Map<String, dynamic>? ?? {};
    final studentResults =
        report['student_results'] as List<dynamic>? ?? [];

    final buffer = StringBuffer();
    buffer.writeln('═══════════════════════════════════════');
    buffer.writeln('  LAPORAN SESI UJIAN - UjianKu');
    buffer.writeln('═══════════════════════════════════════');
    buffer.writeln();
    buffer.writeln('Ujian: $examTitle');
    buffer.writeln('Mata Pelajaran: $subject');
    buffer.writeln('Kelas: $className');
    buffer.writeln();
    buffer.writeln('── Statistik ──────────────────────────');
    buffer.writeln('Total Siswa: $totalStudents');
    buffer.writeln('Selesai: $completedStudents');
    buffer.writeln('Aktif: $activeStudents');
    buffer.writeln('Diskualifikasi: $disqualifiedStudents');
    buffer.writeln('Tingkat Penyelesaian: ${completionRate.toStringAsFixed(1)}%');
    buffer.writeln('Total Pelanggaran: $totalViolations');
    buffer.writeln();

    if (violationBreakdown.isNotEmpty) {
      buffer.writeln('── Rincian Pelanggaran ────────────────');
      for (final entry in violationBreakdown.entries) {
        final count = entry.value is int
            ? entry.value as int
            : (entry.value as double?)?.toInt() ?? 0;
        buffer.writeln('${_getViolationTypeLabel(entry.key)}: $count');
      }
      buffer.writeln();
    }

    if (studentResults.isNotEmpty) {
      buffer.writeln('── Hasil Siswa ────────────────────────');
      for (final item in studentResults) {
        final data = item as Map<String, dynamic>;
        final name = data['name'] as String? ?? '-';
        final score = data['score'] as double? ??
            (data['score'] as int?)?.toDouble() ?? 0;
        final status = data['status'] as String? ?? '-';
        final violationCount = data['violation_count'] as int? ?? 0;
        buffer.writeln('$name | Skor: ${score.toStringAsFixed(0)} | Status: $status | Pelanggaran: $violationCount');
      }
    }

    buffer.writeln();
    buffer.writeln('═══════════════════════════════════════');
    buffer.writeln('Dibuat dari aplikasi UjianKu');

    return buffer.toString();
  }

  void _exportPdf() {
    final summary = _buildReportSummaryText();
    Clipboard.setData(ClipboardData(text: summary));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Laporan berhasil disalin ke clipboard'),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _shareReport() {
    final summary = _buildReportSummaryText();
    Share.share(summary, subject: 'Laporan Sesi Ujian - UjianKu');
  }

  Future<void> _endSession() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.stop_circle, color: Colors.red[700], size: 24),
            const SizedBox(width: 8),
            const Text('Akhiri Sesi Pengawasan?',
                style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        content: Text(
          'Sesi akan diakhiri dan semua siswa yang masih mengerjakan ujian '
          'akan dikumpulkan otomatis. Tindakan ini tidak dapat dibatalkan.',
          style: TextStyle(color: Colors.grey[700]),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Batal',
                style: TextStyle(
                    color: Colors.grey[600], fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('Akhiri Sesi',
                style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final success = await context
          .read<ProctorProvider>()
          .endSession(widget.sessionId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                success ? 'Sesi berhasil diakhiri' : 'Gagal mengakhiri sesi'),
            backgroundColor: success ? AppTheme.success : AppTheme.error,
          ),
        );
        if (success) context.go('/pengawas');
      }
    }
  }

  String _getViolationTypeLabel(String type) {
    switch (type.toLowerCase()) {
      case 'app_switch':
        return 'Pindah Aplikasi';
      case 'screenshot':
        return 'Screenshot';
      case 'screen_capture':
        return 'Rekam Layar';
      case 'multiple_devices':
        return 'Perangkat Ganda';
      case 'idle_too_long':
        return 'Tidak Aktif';
      case 'face_not_detected':
        return 'Wajah Tidak Terdeteksi';
      case 'tab_switch':
        return 'Pindah Tab';
      case 'other':
        return 'Lainnya';
      default:
        return type;
    }
  }

  String _getViolationTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'app_switch':
        return '📱';
      case 'screenshot':
        return '📸';
      case 'screen_capture':
        return '🎥';
      case 'multiple_devices':
        return '📲';
      case 'idle_too_long':
        return '⏰';
      case 'face_not_detected':
        return '👤';
      case 'tab_switch':
        return '🔀';
      default:
        return '⚠️';
    }
  }
}

/// Kartu statistik laporan
class _ReportStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _ReportStatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
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
                fontSize: 12,
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

/// Table header cell
class _TableHeaderCell extends StatelessWidget {
  final String text;
  const _TableHeaderCell(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: Text(
        text,
        style: TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 11,
          color: Colors.grey[700],
        ),
      ),
    );
  }
}

/// Table data cell
class _TableDataCell extends StatelessWidget {
  final Widget child;
  const _TableDataCell(this.child);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: child,
    );
  }
}

/// Card for a completed session in the session picker list
class _ReportSessionCard extends StatelessWidget {
  final ProctorSession session;
  final VoidCallback onTap;

  const _ReportSessionCard({required this.session, required this.onTap});

  @override
  Widget build(BuildContext context) {
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
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.secondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.check_circle,
                    color: AppTheme.secondary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        session.examTitle,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: Color(0xFF1A1A2E),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${session.subject} - ${session.className}',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.people_outline,
                              size: 14, color: Colors.grey[500]),
                          const SizedBox(width: 4),
                          Text(
                            '${session.totalStudents} siswa',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Icon(Icons.schedule,
                              size: 14, color: Colors.grey[500]),
                          const SizedBox(width: 4),
                          Text(
                            '${session.startTimeFormatted} - ${session.endTimeFormatted}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppTheme.secondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Selesai',
                    style: TextStyle(
                      color: AppTheme.secondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
