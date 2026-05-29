import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/proctor_provider.dart';
import '../../models/violation.dart';
import '../../widgets/custom_button.dart';

/// Halaman daftar pelanggaran — PRO-MAX UI/UX
class ViolationListScreen extends StatefulWidget {
  const ViolationListScreen({super.key});

  @override
  State<ViolationListScreen> createState() => _ViolationListScreenState();
}

class _ViolationListScreenState extends State<ViolationListScreen> {
  ViolationType? _selectedType;
  ViolationSeverity? _selectedSeverity;
  String? _selectedSessionId;
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final proctor = context.read<ProctorProvider>();
      proctor.loadViolations();
      if (proctor.sessions.isEmpty) {
        proctor.loadSessions();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applyFilters() {
    context.read<ProctorProvider>().loadViolations(
          type: _selectedType,
          search: _searchQuery.isNotEmpty ? _searchQuery : null,
          sessionId: _selectedSessionId,
        );
  }

  void _clearFilters() {
    setState(() {
      _selectedType = null;
      _selectedSeverity = null;
      _selectedSessionId = null;
      _searchQuery = '';
    });
    _searchController.clear();
    context.read<ProctorProvider>().loadViolations();
  }

  bool get _hasActiveFilters =>
      _selectedType != null ||
      _selectedSeverity != null ||
      _selectedSessionId != null ||
      _searchQuery.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final proctorProvider = context.watch<ProctorProvider>();

    final filteredViolations = _selectedSeverity != null
        ? proctorProvider.violations
            .where((v) => v.severity == _selectedSeverity)
            .toList()
        : proctorProvider.violations;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Daftar Pelanggaran',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A2E),
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.filter_list, color: Colors.grey[700]),
            onPressed: _showFilterSheet,
            tooltip: 'Filter',
          ),
          if (_hasActiveFilters)
            IconButton(
              icon: Icon(Icons.filter_list_off, color: Colors.grey[700]),
              onPressed: _clearFilters,
              tooltip: 'Hapus Filter',
            ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(
                color: Color(0xFF1A1A2E),
                fontWeight: FontWeight.w500,
              ),
              decoration: InputDecoration(
                hintText: 'Cari nama siswa...',
                prefixIcon: Icon(Icons.search, color: Colors.grey[500]),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(Icons.clear, color: Colors.grey[600]),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                          _applyFilters();
                        },
                      )
                    : null,
              ),
              onChanged: (value) {
                setState(() => _searchQuery = value);
              },
              onSubmitted: (value) {
                _applyFilters();
              },
            ),
          ),

          // Active filter chips
          if (_hasActiveFilters)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
              child: Wrap(
                spacing: 8,
                runSpacing: 4,
                children: [
                  if (_selectedType != null)
                    Chip(
                      label: Text(_getViolationTypeLabel(_selectedType!)),
                      onDeleted: () {
                        setState(() => _selectedType = null);
                        _applyFilters();
                      },
                      deleteIconColor: AppTheme.primary,
                      visualDensity: VisualDensity.compact,
                    ),
                  if (_selectedSeverity != null)
                    Chip(
                      label: Text(_getSeverityLabel(_selectedSeverity!)),
                      onDeleted: () {
                        setState(() => _selectedSeverity = null);
                      },
                      deleteIconColor: AppTheme.primary,
                      visualDensity: VisualDensity.compact,
                    ),
                  if (_selectedSessionId != null)
                    Chip(
                      label: const Text('Sesi dipilih'),
                      onDeleted: () {
                        setState(() => _selectedSessionId = null);
                        _applyFilters();
                      },
                      deleteIconColor: AppTheme.primary,
                      visualDensity: VisualDensity.compact,
                    ),
                  if (_searchQuery.isNotEmpty)
                    Chip(
                      label: Text('"$_searchQuery"'),
                      onDeleted: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                        _applyFilters();
                      },
                      deleteIconColor: AppTheme.primary,
                      visualDensity: VisualDensity.compact,
                    ),
                ],
              ),
            ),

          // Summary bar
          if (filteredViolations.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              color: Colors.grey[100],
              child: Row(
                children: [
                  Text(
                    '${filteredViolations.length} pelanggaran ditemukan',
                    style: TextStyle(
                      color: Colors.grey[700],
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  _MiniSeverityBadge(
                    label: 'Ringan',
                    count: filteredViolations
                        .where((v) => v.severity == ViolationSeverity.low)
                        .length,
                    color: const Color(0xFFf59e0b),
                  ),
                  const SizedBox(width: 8),
                  _MiniSeverityBadge(
                    label: 'Sedang',
                    count: filteredViolations
                        .where((v) => v.severity == ViolationSeverity.medium)
                        .length,
                    color: const Color(0xFFf97316),
                  ),
                  const SizedBox(width: 8),
                  _MiniSeverityBadge(
                    label: 'Berat',
                    count: filteredViolations
                        .where((v) => v.severity == ViolationSeverity.high)
                        .length,
                    color: const Color(0xFFef4444),
                  ),
                ],
              ),
            ),

          // Daftar pelanggaran
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => context.read<ProctorProvider>().loadViolations(
                    type: _selectedType,
                    search:
                        _searchQuery.isNotEmpty ? _searchQuery : null,
                    sessionId: _selectedSessionId,
                  ),
              color: AppTheme.primary,
              child: proctorProvider.isLoading
                  ? const Center(
                      child:
                          CircularProgressIndicator(color: AppTheme.primary),
                    )
                  : filteredViolations.isEmpty
                      ? _EmptyViolations(hasFilters: _hasActiveFilters)
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                          itemCount: filteredViolations.length,
                          itemBuilder: (context, index) {
                            final violation = filteredViolations[index];
                            return _EnhancedViolationCard(
                              violation: violation,
                              onTap: () =>
                                  _showViolationDetail(violation),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }

  /// Bottom sheet filter
  void _showFilterSheet() {
    final proctor = context.read<ProctorProvider>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => DraggableScrollableSheet(
          initialChildSize: 0.65,
          minChildSize: 0.3,
          maxChildSize: 0.85,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Filter Pelanggaran',
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1A1A2E)),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Tingkat Keparahan',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[700],
                        fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: ViolationSeverity.values.map((severity) {
                      final isSelected = _selectedSeverity == severity;
                      return ChoiceChip(
                        label: Text(_getSeverityLabel(severity)),
                        selected: isSelected,
                        onSelected: (selected) {
                          setSheetState(() {
                            _selectedSeverity = selected ? severity : null;
                          });
                        },
                        selectedColor: _getSeverityColor(severity)
                            .withValues(alpha: 0.2),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Tipe Pelanggaran',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[700],
                        fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: ViolationType.values.map((type) {
                      final isSelected = _selectedType == type;
                      return ChoiceChip(
                        label: Text(
                          '${_getViolationTypeIcon(type)} ${_getViolationTypeLabel(type)}',
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          setSheetState(() {
                            _selectedType = selected ? type : null;
                          });
                        },
                        selectedColor:
                            AppTheme.primary.withValues(alpha: 0.2),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Sesi Ujian',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[700],
                        fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedSessionId,
                    decoration: const InputDecoration(
                      hintText: 'Semua sesi',
                      prefixIcon: Icon(Icons.assignment_outlined),
                    ),
                    items: [
                      const DropdownMenuItem<String>(
                        value: null,
                        child: Text('Semua sesi'),
                      ),
                      ...proctor.sessions.map((s) => DropdownMenuItem(
                            value: s.id,
                            child: Text(
                              s.examTitle,
                              overflow: TextOverflow.ellipsis,
                            ),
                          )),
                    ],
                    onChanged: (value) {
                      setSheetState(() {
                        _selectedSessionId = value;
                      });
                    },
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setSheetState(() {
                              _selectedType = null;
                              _selectedSeverity = null;
                              _selectedSessionId = null;
                            });
                          },
                          child: const Text('Reset Filter'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _applyFilters();
                          },
                          style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary),
                          child: const Text('Terapkan',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  /// Detail pelanggaran bottom sheet
  void _showViolationDetail(Violation violation) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) {
          final severityColor = Color(violation.severityColor);

          return SingleChildScrollView(
            controller: scrollController,
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: severityColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(
                          violation.typeIcon,
                          style: const TextStyle(fontSize: 28),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            violation.typeLabel,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1A1A2E),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: severityColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              violation.severityLabel,
                              style: TextStyle(
                                color: severityColor,
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _DetailRow(
                  icon: Icons.person_outline,
                  label: 'Siswa',
                  value: violation.studentName,
                ),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.description_outlined,
                  label: 'Deskripsi',
                  value: violation.description,
                ),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.access_time,
                  label: 'Waktu',
                  value: violation.timeFormatted,
                ),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.assignment_outlined,
                  label: 'Sesi',
                  value: violation.sessionId,
                ),
                if (violation.isResolved) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle,
                            color: AppTheme.success, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Ditangani oleh ${violation.resolvedBy ?? "pengawas"}',
                          style: const TextStyle(
                              color: AppTheme.success,
                              fontSize: 13,
                              fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                CustomButton(
                  text: 'Lihat Detail Siswa',
                  icon: Icons.person,
                  variant: CustomButtonVariant.outline,
                  isFullWidth: true,
                  onPressed: () {
                    Navigator.pop(context);
                    context.push(
                      '/pengawas/sessions/${violation.sessionId}/students/${violation.studentId}',
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  String _getViolationTypeLabel(ViolationType type) {
    switch (type) {
      case ViolationType.appSwitch:
        return 'Pindah Aplikasi';
      case ViolationType.screenshot:
        return 'Screenshot';
      case ViolationType.screenCapture:
        return 'Rekam Layar';
      case ViolationType.multipleDevices:
        return 'Perangkat Ganda';
      case ViolationType.idleTooLong:
        return 'Tidak Aktif';
      case ViolationType.faceNotDetected:
        return 'Wajah Tidak Terdeteksi';
      case ViolationType.tabSwitch:
        return 'Pindah Tab';
      case ViolationType.other:
        return 'Lainnya';
    }
  }

  String _getViolationTypeIcon(ViolationType type) {
    switch (type) {
      case ViolationType.appSwitch:
        return '📱';
      case ViolationType.screenshot:
        return '📸';
      case ViolationType.screenCapture:
        return '🎥';
      case ViolationType.multipleDevices:
        return '📲';
      case ViolationType.idleTooLong:
        return '⏰';
      case ViolationType.faceNotDetected:
        return '👤';
      case ViolationType.tabSwitch:
        return '🔀';
      case ViolationType.other:
        return '⚠️';
    }
  }

  String _getSeverityLabel(ViolationSeverity severity) {
    switch (severity) {
      case ViolationSeverity.low:
        return 'Ringan';
      case ViolationSeverity.medium:
        return 'Sedang';
      case ViolationSeverity.high:
        return 'Berat';
    }
  }

  Color _getSeverityColor(ViolationSeverity severity) {
    switch (severity) {
      case ViolationSeverity.low:
        return const Color(0xFFf59e0b);
      case ViolationSeverity.medium:
        return const Color(0xFFf97316);
      case ViolationSeverity.high:
        return const Color(0xFFef4444);
    }
  }
}

/// Detail row widget
class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: Colors.grey[500]),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF1A1A2E)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Mini severity badge
class _MiniSeverityBadge extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _MiniSeverityBadge({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 3),
        Text(
          '$count $label',
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

/// Enhanced violation card
class _EnhancedViolationCard extends StatelessWidget {
  final Violation violation;
  final VoidCallback? onTap;

  const _EnhancedViolationCard({
    required this.violation,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final severityColor = Color(violation.severityColor);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: severityColor.withValues(alpha: 0.2),
          ),
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
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: severityColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  violation.typeIcon,
                  style: const TextStyle(fontSize: 22),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          violation.studentName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                            color: Color(0xFF1A1A2E),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
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
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    violation.typeLabel,
                    style: TextStyle(
                      color: severityColor,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    violation.description,
                    style: TextStyle(
                        color: Colors.grey[600], fontSize: 12, fontWeight: FontWeight.w400),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  violation.timeFormatted,
                  style: TextStyle(
                      color: Colors.grey[500], fontSize: 11),
                ),
                const SizedBox(height: 6),
                if (violation.isResolved)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle,
                            color: AppTheme.success, size: 10),
                        SizedBox(width: 3),
                        Text(
                          'Ditangani',
                          style: TextStyle(
                            color: AppTheme.success,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.pending,
                            color: AppTheme.warning, size: 10),
                        SizedBox(width: 3),
                        Text(
                          'Peringatan',
                          style: TextStyle(
                            color: AppTheme.warning,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// State kosong
class _EmptyViolations extends StatelessWidget {
  final bool hasFilters;
  const _EmptyViolations({this.hasFilters = false});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              hasFilters ? Icons.search_off : Icons.check_circle_outline,
              size: 64,
              color: hasFilters ? Colors.grey[400] : AppTheme.success,
            ),
            const SizedBox(height: 16),
            Text(
              hasFilters
                  ? 'Tidak Ditemukan'
                  : 'Tidak Ada Pelanggaran',
              style: TextStyle(
                color: hasFilters ? Colors.grey[700] : AppTheme.success,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              hasFilters
                  ? 'Coba ubah filter pencarian Anda'
                  : 'Semua siswa mengerjakan ujian dengan jujur',
              style: TextStyle(
                  color: Colors.grey[500], fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
