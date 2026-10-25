import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/constants/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'presentation/accountant/accountant_dashboard_screen.dart';
import 'presentation/admin/admin_dashboard_screen.dart';
import 'presentation/auth/login_screen.dart';
import 'presentation/common/widgets/ehrj_logo_widget.dart';
import 'presentation/guardian/guardian_dashboard_screen.dart';
import 'presentation/principal/principal_dashboard_screen.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/public/public_home_screen.dart';
import 'presentation/student/student_dashboard_screen.dart';
import 'presentation/teacher/teacher_dashboard_screen.dart';

class EhrjApp extends StatefulWidget {
  const EhrjApp({super.key});

  @override
  State<EhrjApp> createState() => _EhrjAppState();
}

class _EhrjAppState extends State<EhrjApp> {
  bool _isBrowsingPublic = false;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return MaterialApp(
      title: 'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: _buildRoot(auth),
    );
  }

  Widget _buildRoot(AuthProvider auth) {
    // 1. Initial Session Loading (Branded fallback with logo)
    if (auth.isLoading && auth.currentUser == null) {
      return const Scaffold(
        backgroundColor: AppColors.bgLight,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              EhrjLogoWidget(size: 72),
              SizedBox(height: 24),
              CircularProgressIndicator(strokeWidth: 2.5),
            ],
          ),
        ),
      );
    }

    // 2. Unauthenticated: Public Visitor vs Login Screen
    if (!auth.isAuthenticated) {
      if (_isBrowsingPublic) {
        return PublicHomeScreen(
          onNavigateToLogin: () => setState(() => _isBrowsingPublic = false),
        );
      }
      return LoginScreen(
        onLoginSuccess: () => setState(() => _isBrowsingPublic = false),
        onBrowsePublic: () => setState(() => _isBrowsingPublic = true),
      );
    }

    // 3. Authenticated: Dedicated Role-Based Dashboard
    final role = auth.role;

    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return AdminDashboardScreen(
          onLogout: () => setState(() => _isBrowsingPublic = false),
        );
      case 'PRINCIPAL':
      case 'HEAD_OF_MADRASHA':
        return PrincipalDashboardScreen(
          onLogout: () => setState(() => _isBrowsingPublic = false),
        );
      case 'TEACHER':
        return TeacherDashboardScreen(
          onLogout: () => setState(() => _isBrowsingPublic = false),
        );
      case 'STUDENT':
        return StudentDashboardScreen(
          onLogout: () => setState(() => _isBrowsingPublic = false),
        );
      case 'GUARDIAN':
      case 'PARENT':
        return GuardianDashboardScreen(
          onLogout: () => setState(() => _isBrowsingPublic = false),
        );
      case 'ACCOUNTANT':
      case 'FINANCE':
        return AccountantDashboardScreen(
          onLogout: () => setState(() => _isBrowsingPublic = false),
        );
      default:
        return TeacherDashboardScreen(
          onLogout: () => setState(() => _isBrowsingPublic = false),
        );
    }
  }
}
