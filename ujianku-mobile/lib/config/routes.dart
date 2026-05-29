import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/siswa/home_screen.dart';
import '../screens/siswa/exam_list_screen.dart';
import '../screens/siswa/exam_detail_screen.dart';
import '../screens/siswa/exam_take_screen.dart';
import '../screens/siswa/exam_result_screen.dart';
import '../screens/siswa/exam_results_list_screen.dart';
import '../screens/siswa/profile_screen.dart';
import '../screens/pengawas/home_screen.dart';
import '../screens/pengawas/monitoring_screen.dart';
import '../screens/pengawas/violation_list_screen.dart';
import '../screens/pengawas/student_detail_screen.dart';
import '../screens/pengawas/report_screen.dart';

/// Konfigurasi rute navigasi aplikasi UjianKu
class AppRoutes {
  // Nama rute
  static const String splash = '/';
  static const String login = '/login';

  // Rute Siswa
  static const String siswaHome = '/siswa';
  static const String siswaExamList = '/siswa/exams';
  static const String siswaExamDetail = '/siswa/exams/:id';
  static const String siswaExamTake = '/siswa/exams/:id/take';
  static const String siswaExamResult = '/siswa/exams/:id/result';
  static const String siswaProfile = '/siswa/profile';

  // Rute Pengawas
  static const String pengawasHome = '/pengawas';
  static const String pengawasMonitoring = '/pengawas/monitoring';
  static const String pengawasViolations = '/pengawas/violations';
  static const String pengawasStudentDetail =
      '/pengawas/sessions/:sessionId/students/:studentId';
  static const String pengawasReport = '/pengawas/sessions/:sessionId/report';

  /// Membuat GoRouter dengan semua rute terdefinisi
  static GoRouter createRouter({required String initialLocation}) {
    return GoRouter(
      initialLocation: initialLocation,
      debugLogDiagnostics: true,
      routes: [
        GoRoute(
          path: splash,
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: login,
          builder: (context, state) => const LoginScreen(),
        ),

        // === Rute Siswa ===
        ShellRoute(
          builder: (context, state, child) {
            return SiswaShell(child: child);
          },
          routes: [
            GoRoute(
              path: '/siswa',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: SiswaHomeScreen(),
              ),
            ),
            GoRoute(
              path: '/siswa/exams',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: ExamListScreen(),
              ),
            ),
            GoRoute(
              path: '/siswa/results',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: ExamResultsListScreen(),
              ),
            ),
            GoRoute(
              path: '/siswa/profile',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: ProfileScreen(),
              ),
            ),
          ],
        ),

        // Rute ujian siswa tanpa shell (layar penuh)
        GoRoute(
          path: '/siswa/exams/:id',
          builder: (context, state) {
            final examId = state.pathParameters['id']!;
            return ExamDetailScreen(examId: examId);
          },
        ),
        GoRoute(
          path: '/siswa/exams/:id/take',
          builder: (context, state) {
            final examId = state.pathParameters['id']!;
            return ExamTakeScreen(examId: examId);
          },
        ),
        GoRoute(
          path: '/siswa/exams/:id/result',
          builder: (context, state) {
            final examId = state.pathParameters['id']!;
            return ExamResultScreen(examId: examId);
          },
        ),

        // === Rute Pengawas ===
        ShellRoute(
          builder: (context, state, child) {
            return PengawasShell(child: child);
          },
          routes: [
            GoRoute(
              path: '/pengawas',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: PengawasHomeScreen(),
              ),
            ),
            GoRoute(
              path: '/pengawas/monitoring',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: MonitoringScreen(),
              ),
            ),
            GoRoute(
              path: '/pengawas/violations',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: ViolationListScreen(),
              ),
            ),
            GoRoute(
              path: '/pengawas/reports',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: ReportScreen(sessionId: ''),
              ),
            ),
          ],
        ),

        // Rute pengawas tanpa shell
        GoRoute(
          path: '/pengawas/sessions/:sessionId/students/:studentId',
          builder: (context, state) {
            final sessionId = state.pathParameters['sessionId']!;
            final studentId = state.pathParameters['studentId']!;
            return StudentDetailScreen(
              sessionId: sessionId,
              studentId: studentId,
            );
          },
        ),
        GoRoute(
          path: '/pengawas/sessions/:sessionId/report',
          builder: (context, state) {
            final sessionId = state.pathParameters['sessionId']!;
            return ReportScreen(sessionId: sessionId);
          },
        ),
      ],
    );
  }
}

/// Shell navigasi untuk Siswa dengan bottom navigation bar
class SiswaShell extends StatelessWidget {
  final Widget child;
  const SiswaShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex(context),
        onTap: (index) => _onTap(context, index),
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Beranda',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment),
            label: 'Ujian',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bar_chart_outlined),
            activeIcon: Icon(Icons.bar_chart),
            label: 'Hasil',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location == '/siswa') return 0;
    if (location.contains('/siswa/exams')) return 1;
    if (location.contains('/siswa/results')) return 2;
    if (location.contains('/siswa/profile')) return 3;
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/siswa');
        break;
      case 1:
        context.go('/siswa/exams');
        break;
      case 2:
        context.go('/siswa/results');
        break;
      case 3:
        context.go('/siswa/profile');
        break;
    }
  }
}

/// Shell navigasi untuk Pengawas dengan bottom navigation bar
class PengawasShell extends StatelessWidget {
  final Widget child;
  const PengawasShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex(context),
        onTap: (index) => _onTap(context, index),
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Beranda',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.monitor_outlined),
            activeIcon: Icon(Icons.monitor),
            label: 'Monitoring',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.warning_amber_outlined),
            activeIcon: Icon(Icons.warning),
            label: 'Pelanggaran',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assessment_outlined),
            activeIcon: Icon(Icons.assessment),
            label: 'Laporan',
          ),
        ],
      ),
    );
  }

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location == '/pengawas') return 0;
    if (location.contains('/pengawas/monitoring')) return 1;
    if (location.contains('/pengawas/violations')) return 2;
    if (location.contains('/pengawas/reports')) return 3;
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/pengawas');
        break;
      case 1:
        context.go('/pengawas/monitoring');
        break;
      case 2:
        context.go('/pengawas/violations');
        break;
      case 3:
        context.go('/pengawas/reports');
        break;
    }
  }
}
