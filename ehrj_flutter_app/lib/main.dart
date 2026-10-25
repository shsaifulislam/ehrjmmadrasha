import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/network/api_client.dart';
import 'core/services/notification_service.dart';
import 'core/storage/local_storage_service.dart';
import 'data/repositories/admin_repository.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/portal_repository.dart';
import 'data/repositories/public_repository.dart';
import 'data/repositories/teacher_repository.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/sync_provider.dart';
import 'presentation/providers/teacher_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Top-level error safety: Never let uncaught framework errors freeze the app
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('FLUTTER_TOP_LEVEL_ERROR: ${details.exception}');
  };

  // Safe Google Fonts configuration: allow runtime fetching, with system fallback
  GoogleFonts.config.allowRuntimeFetching = true;

  // Resilient Local Storage initialization (with in-memory fallback on platform error)
  final storage = await LocalStorageService.init();

  // Initialize Network API Client
  final api = ApiClient(storage);

  // Initialize Repositories
  final authRepo = AuthRepository(api, storage);
  final teacherRepo = TeacherRepository(api, storage);
  final portalRepo = PortalRepository(api, storage);
  final publicRepo = PublicRepository(api, storage);
  final adminRepo = AdminRepository(api, storage);

  // Initialize Providers
  final authProvider = AuthProvider(authRepo);
  final syncProvider = SyncProvider(storage, teacherRepo);
  final teacherProvider = TeacherProvider(teacherRepo);
  final notificationService = NotificationService(api, storage);

  // Mount UI immediately so the first frame renders and Android removes the splash screen!
  runApp(
    MultiProvider(
      providers: [
        Provider<LocalStorageService>.value(value: storage),
        Provider<ApiClient>.value(value: api),
        Provider<AuthRepository>.value(value: authRepo),
        Provider<TeacherRepository>.value(value: teacherRepo),
        Provider<PortalRepository>.value(value: portalRepo),
        Provider<PublicRepository>.value(value: publicRepo),
        Provider<AdminRepository>.value(value: adminRepo),
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        ChangeNotifierProvider<SyncProvider>.value(value: syncProvider),
        ChangeNotifierProvider<TeacherProvider>.value(value: teacherProvider),
        ChangeNotifierProvider<NotificationService>.value(
          value: notificationService,
        ),
      ],
      child: const EhrjApp(),
    ),
  );

  // Restore cached session in background without blocking initial frame
  authProvider.init().catchError((e) {
    debugPrint('Background session restore caught: $e');
  });
}
