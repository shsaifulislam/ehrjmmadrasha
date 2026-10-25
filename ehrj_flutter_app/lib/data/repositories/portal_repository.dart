import '../../core/network/api_client.dart';
import '../../core/storage/local_storage_service.dart';

class PortalRepository {
  final ApiClient _api;
  final LocalStorageService _storage;

  PortalRepository(this._api, this._storage);

  /// Fetch children list for the authenticated Guardian or active enrollments for Admin/Teacher
  Future<List<Map<String, dynamic>>> getChildren() async {
    try {
      final res = await _api.get('/api/portal/children');
      if (res.statusCode == 200 && res.data != null) {
        final list = (res.data['children'] as List? ?? []);
        final mapped = list.map((c) => c as Map<String, dynamic>).toList();
        await _storage.setCachedJson('ehrj_cached_portal_children', mapped);
        return mapped;
      }
    } catch (_) {
      final cached = _storage.getCachedJson('ehrj_cached_portal_children');
      if (cached is List) {
        return cached.map((c) => c as Map<String, dynamic>).toList();
      }
    }
    return [];
  }

  /// Fetch attendance history for a specific student with optional month and year filters
  Future<Map<String, dynamic>?> getAttendance(
    String studentId, {
    int? month,
    int? year,
  }) async {
    final cacheKey = 'ehrj_cached_att_${studentId}_${month ?? 0}_${year ?? 0}';
    try {
      final params = <String, dynamic>{'studentId': studentId};
      if (month != null) params['month'] = month;
      if (year != null) params['year'] = year;
      final res = await _api.get(
        '/api/portal/attendance',
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

  /// Fetch published academic results for a specific student
  Future<List<Map<String, dynamic>>> getResults(String studentId) async {
    final cacheKey = 'ehrj_cached_results_$studentId';
    try {
      final res = await _api.get(
        '/api/portal/results',
        queryParameters: {'studentId': studentId},
      );
      if (res.statusCode == 200 && res.data != null) {
        final list = (res.data['results'] as List? ?? res.data as List? ?? []);
        final mapped = list.map((r) => r as Map<String, dynamic>).toList();
        await _storage.setCachedJson(cacheKey, mapped);
        return mapped;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is List) {
        return cached.map((r) => r as Map<String, dynamic>).toList();
      }
    }
    return [];
  }

  /// Fetch class routine and timetable for a student
  Future<List<Map<String, dynamic>>> getRoutine(String studentId) async {
    final cacheKey = 'ehrj_cached_routine_$studentId';
    try {
      final res = await _api.get(
        '/api/portal/routine',
        queryParameters: {'studentId': studentId},
      );
      if (res.statusCode == 200 && res.data != null) {
        final list = (res.data['routine'] as List? ?? res.data as List? ?? []);
        final mapped = list.map((r) => r as Map<String, dynamic>).toList();
        await _storage.setCachedJson(cacheKey, mapped);
        return mapped;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is List) {
        return cached.map((r) => r as Map<String, dynamic>).toList();
      }
    }
    return [];
  }

  /// Fetch financial overview and fee invoices for a student (/api/portal/finance)
  Future<Map<String, dynamic>?> getFees(String studentId) async {
    final cacheKey = 'ehrj_cached_finance_$studentId';
    try {
      final res = await _api.get(
        '/api/portal/finance',
        queryParameters: {'studentId': studentId},
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

  /// Submit leave request for student with IDOR server verification
  Future<bool> submitLeaveRequest({
    required String studentId,
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    try {
      final res = await _api.post(
        '/api/portal/leave-requests',
        data: {
          'studentId': studentId,
          'startDate': startDate,
          'endDate': endDate,
          'reason': reason,
        },
      );
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }
}
