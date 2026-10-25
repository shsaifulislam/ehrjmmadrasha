import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:ehrj_flutter_app/app.dart';
import 'package:ehrj_flutter_app/core/network/api_client.dart';
import 'package:ehrj_flutter_app/core/services/notification_service.dart';
import 'package:ehrj_flutter_app/core/storage/local_storage_service.dart';
import 'package:ehrj_flutter_app/data/repositories/admin_repository.dart';
import 'package:ehrj_flutter_app/data/repositories/auth_repository.dart';
import 'package:ehrj_flutter_app/data/repositories/portal_repository.dart';
import 'package:ehrj_flutter_app/data/repositories/public_repository.dart';
import 'package:ehrj_flutter_app/data/repositories/teacher_repository.dart';
import 'package:ehrj_flutter_app/presentation/providers/auth_provider.dart';
import 'package:ehrj_flutter_app/presentation/providers/sync_provider.dart';
import 'package:ehrj_flutter_app/presentation/providers/teacher_provider.dart';

void main() {
  testWidgets('EhrjApp startup and LoginScreen pump test', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final storage = await LocalStorageService.init();
    final api = ApiClient(storage);

    final authRepo = AuthRepository(api, storage);
    final teacherRepo = TeacherRepository(api, storage);
    final portalRepo = PortalRepository(api, storage);
    final publicRepo = PublicRepository(api, storage);
    final adminRepo = AdminRepository(api, storage);

    final authProvider = AuthProvider(authRepo);
    final syncProvider = SyncProvider(storage, teacherRepo);
    final teacherProvider = TeacherProvider(teacherRepo);
    final notificationService = NotificationService(api, storage);

    await authProvider.init();

    await tester.pumpWidget(
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

    // Initial frame
    await tester.pump();

    // Verify whether LoginScreen is rendered
    expect(find.byType(MaterialApp), findsOneWidget);
    debugPrint('Pump completed successfully');
  });
}
