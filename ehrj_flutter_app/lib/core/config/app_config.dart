class AppConfig {
  AppConfig._();

  // API Base URL - Configurable via --dart-define=API_BASE_URL=...
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 20);

  // Storage Keys
  static const String keyCustomApiBaseUrl = 'ehrj_custom_api_base_url';
  static const String keyAuthToken = 'ehrj_auth_token';
  static const String keyAuthUser = 'ehrj_auth_user';
  static const String keyPendingAttendance = 'ehrj_pending_attendance_queue';
  static const String keyPendingMarks = 'ehrj_pending_marks_queue';
  static const String keyCachedClasses = 'ehrj_cached_classes';
  static const String keyCachedRosters = 'ehrj_cached_rosters';
  static const String keyThemeMode = 'ehrj_theme_mode';
}
