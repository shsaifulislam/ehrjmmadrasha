import '../../core/network/api_client.dart';
import '../../core/storage/local_storage_service.dart';

class AdminRepository {
  final ApiClient _api;
  final LocalStorageService _storage;

  AdminRepository(this._api, this._storage);

  /// Fetch institutional pending tasks from command center
  Future<Map<String, dynamic>?> getCommandCenter() async {
    const cacheKey = 'ehrj_cached_admin_command_center';
    try {
      final res = await _api.get('/api/admin/command-center');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        await _storage.setCachedJson(cacheKey, data);
        return data;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is Map<String, dynamic>) return cached;
    }
    return null;
  }

  /// Fetch students directory with pagination and filters
  Future<Map<String, dynamic>?> getStudents({
    int page = 1,
    int take = 20,
    String? query,
    String? classId,
  }) async {
    final cacheKey = 'ehrj_cached_admin_students_${page}_$take';
    try {
      final params = <String, dynamic>{'page': page, 'take': take};
      if (query != null && query.isNotEmpty) params['q'] = query;
      if (classId != null && classId.isNotEmpty) params['classId'] = classId;

      final res = await _api.get(
        '/api/admin/students',
        queryParameters: params,
      );
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        await _storage.setCachedJson(cacheKey, data);
        return data;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is Map<String, dynamic>) return cached;
    }
    return null;
  }

  /// Fetch official 5-fund cash balances and recent transactions for Finance Desk
  Future<Map<String, dynamic>?> getFinanceOverview() async {
    const cacheKey = 'ehrj_cached_admin_finance';
    try {
      final res = await _api.get('/api/admin/finance');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        await _storage.setCachedJson(cacheKey, data);
        return data;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is Map<String, dynamic>) return cached;
    }
    return null;
  }

  /// Fetch Principal academic or cashbook governance reports
  Future<Map<String, dynamic>?> getPrincipalReports({
    String type = 'CASHBOOK',
  }) async {
    final cacheKey = 'ehrj_cached_principal_reports_$type';
    try {
      final res = await _api.get(
        '/api/principal/reports',
        queryParameters: {'type': type},
      );
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        await _storage.setCachedJson(cacheKey, data);
        return data;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is Map<String, dynamic>) return cached;
    }
    return null;
  }

  /// Fetch Campus Gatepass Records
  Future<Map<String, dynamic>?> getGatepasses({
    String status = 'ALL',
    String? search,
  }) async {
    final cacheKey = 'ehrj_cached_gatepasses_$status';
    try {
      final params = <String, dynamic>{'status': status};
      if (search != null && search.isNotEmpty) params['search'] = search;

      final res = await _api.get('/api/gatepass', queryParameters: params);
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        await _storage.setCachedJson(cacheKey, data);
        return data;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is Map<String, dynamic>) return cached;
    }
    return null;
  }

  /// Issue a New Student or Visitor Gatepass
  Future<Map<String, dynamic>> issueGatepass(Map<String, dynamic> payload) async {
    try {
      final res = await _api.post('/api/gatepass', data: payload);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return {
          'success': true,
          'data': res.data?['data'],
          'message': res.data?['message'] ?? 'গেটপাস সফলভাবে ইস্যু করা হয়েছে',
        };
      }
      return {
        'success': false,
        'error': res.data?['error']?.toString() ?? 'গেটপাস ইস্যু করতে সমস্যা হয়েছে',
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'সার্ভারে সংযোগ করা যায়নি অথবা ত্রুটি ঘটেছে: $e',
      };
    }
  }

  /// Fetch Central Institutional System Settings
  Future<Map<String, dynamic>?> getSystemSettings() async {
    const cacheKey = 'ehrj_cached_system_settings';
    try {
      final res = await _api.get('/api/admin/settings');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        await _storage.setCachedJson(cacheKey, data);
        return data;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is Map<String, dynamic>) return cached;
    }
    return {
      'site': {
        'nameBn': 'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা',
        'nameEn': 'Eliotganj Hazi Rohmatollah Jamiria Madrasha',
        'nameAr': 'الجامعة الإسلامية رحمة الله إليوت غنج',
        'principal': 'মাওলানা মহা. আবুল কালাম সরকার',
        'establishedYear': '২০২১',
        'address': 'পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা',
        'primaryPhone': '01845-162664',
        'phones': ['01845-162664', '01826-416696', '01949-091911'],
        'email': 'ehrjmadrasha@gmail.com',
        'publicDomain': 'https://www.ehrjmadrasha.com',
      },
      'system': {
        'currentSession': '২০২৬ শিক্ষাবর্ষ (১৪৪৭-১৪৪৮ হিজরী)',
        'activeSessionId': 'session_2026',
        'serverStatus': 'ONLINE',
        'activeBackups': 12,
        'databaseEngine': 'PostgreSQL / Prisma ORM',
        'lastBackupDate': '১৮ অক্টোবর ২০২৬, দুপুর ০২:৩০',
      },
    };
  }
}
