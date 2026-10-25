import 'package:dio/dio.dart';

import '../../core/network/api_client.dart';
import '../../core/storage/local_storage_service.dart';
import '../models/user_model.dart';

class AuthRepository {
  final ApiClient _api;
  final LocalStorageService _storage;

  AuthRepository(this._api, this._storage);

  UserModel? get cachedUser {
    final map = _storage.getUser();
    if (map != null) return UserModel.fromJson(map);
    return null;
  }

  bool get isAuthenticated => _storage.getToken() != null;

  Future<UserModel> login(String identifier, String password) async {
    try {
      final response = await _api.post(
        '/api/auth/login',
        data: {'identifier': identifier.trim(), 'password': password},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;

        // Extract token: either from JSON body or from Set-Cookie headers
        String? token = data['token']?.toString();
        if (token == null && response.headers.map.containsKey('set-cookie')) {
          final cookies = response.headers.map['set-cookie'] ?? [];
          for (final c in cookies) {
            final match = RegExp(r'ehrj_session_token=([^;]+)').firstMatch(c);
            if (match != null) {
              token = match.group(1);
              break;
            }
          }
        }

        if (token != null && token.isNotEmpty) {
          await _storage.saveToken(token);
        }

        final userMap = data['user'] as Map<String, dynamic>;
        final user = UserModel.fromJson(userMap);
        await _storage.saveUser(user.toJson());
        return user;
      } else {
        final msg = response.data?['error']?.toString() ?? 'লগইন ব্যর্থ হয়েছে';
        throw Exception(msg);
      }
    } on DioException catch (e) {
      final msg =
          e.response?.data?['error']?.toString() ??
          'সার্ভারে সংযোগ করা যাচ্ছে না। অনুগ্রহ করে নেটওয়ার্ক চেক করুন।';
      throw Exception(msg);
    }
  }

  Future<UserModel?> restoreSession() async {
    final token = _storage.getToken();
    if (token == null || token.isEmpty) return null;

    try {
      final response = await _api.get('/api/auth/me');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        if (data['authenticated'] == true && data['user'] != null) {
          final userMap = data['user'] as Map<String, dynamic>;
          final user = UserModel(
            id:
                userMap['userId']?.toString() ??
                userMap['id']?.toString() ??
                '',
            name: userMap['name']?.toString() ?? '',
            username: userMap['username']?.toString() ?? '',
            email: userMap['email']?.toString(),
            role: userMap['role']?.toString().toUpperCase() ?? 'GUARDIAN',
          );
          await _storage.saveUser(user.toJson());
          return user;
        }
      }
    } catch (_) {
      // In offline mode, return cached user
      return cachedUser;
    }
    return cachedUser;
  }

  Future<void> logout() async {
    try {
      await _api.post('/api/auth/logout');
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      await _storage.clearAllSession();
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final res = await _api.post(
        '/api/auth/change-password',
        data: {'currentPassword': currentPassword, 'newPassword': newPassword},
      );
      if (res.statusCode != 200) {
        throw Exception(
          res.data?['error']?.toString() ?? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ',
        );
      }
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['error']?.toString() ?? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ',
      );
    }
  }
}
