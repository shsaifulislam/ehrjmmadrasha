import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';

class LocalStorageService {
  final SharedPreferences? _prefs;
  final Map<String, String> _memoryFallback = {};

  LocalStorageService(this._prefs);

  static Future<LocalStorageService> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return LocalStorageService(prefs);
    } catch (e, stack) {
      debugPrint('WARNING: SharedPreferences initialization failed: $e\n$stack');
      return LocalStorageService(null);
    }
  }

  // Auth Token
  Future<bool> saveToken(String token) async {
    if (_prefs != null) {
      try {
        return await _prefs.setString(AppConfig.keyAuthToken, token);
      } catch (_) {}
    }
    _memoryFallback[AppConfig.keyAuthToken] = token;
    return true;
  }

  String? getToken() {
    if (_prefs != null) {
      try {
        return _prefs.getString(AppConfig.keyAuthToken);
      } catch (_) {}
    }
    return _memoryFallback[AppConfig.keyAuthToken];
  }

  Future<bool> clearToken() async {
    if (_prefs != null) {
      try {
        await _prefs.remove(AppConfig.keyAuthToken);
      } catch (_) {}
    }
    _memoryFallback.remove(AppConfig.keyAuthToken);
    return true;
  }

  // Auth User
  Future<bool> saveUser(Map<String, dynamic> userMap) async {
    final encoded = jsonEncode(userMap);
    if (_prefs != null) {
      try {
        return await _prefs.setString(AppConfig.keyAuthUser, encoded);
      } catch (_) {}
    }
    _memoryFallback[AppConfig.keyAuthUser] = encoded;
    return true;
  }

  Map<String, dynamic>? getUser() {
    String? raw;
    if (_prefs != null) {
      try {
        raw = _prefs.getString(AppConfig.keyAuthUser);
      } catch (_) {}
    }
    raw ??= _memoryFallback[AppConfig.keyAuthUser];
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<bool> clearUser() async {
    if (_prefs != null) {
      try {
        await _prefs.remove(AppConfig.keyAuthUser);
      } catch (_) {}
    }
    _memoryFallback.remove(AppConfig.keyAuthUser);
    return true;
  }

  // Pending Attendance Queue
  List<Map<String, dynamic>> getPendingAttendanceQueue() {
    String? raw;
    if (_prefs != null) {
      try {
        raw = _prefs.getString(AppConfig.keyPendingAttendance);
      } catch (_) {}
    }
    raw ??= _memoryFallback[AppConfig.keyPendingAttendance];
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  }

  Future<bool> savePendingAttendanceQueue(
    List<Map<String, dynamic>> queue,
  ) async {
    final encoded = jsonEncode(queue);
    if (_prefs != null) {
      try {
        return await _prefs.setString(AppConfig.keyPendingAttendance, encoded);
      } catch (_) {}
    }
    _memoryFallback[AppConfig.keyPendingAttendance] = encoded;
    return true;
  }

  Future<bool> appendPendingAttendance(Map<String, dynamic> item) async {
    final queue = getPendingAttendanceQueue();
    queue.add(item);
    return savePendingAttendanceQueue(queue);
  }

  // Pending Marks Queue
  List<Map<String, dynamic>> getPendingMarksQueue() {
    String? raw;
    if (_prefs != null) {
      try {
        raw = _prefs.getString(AppConfig.keyPendingMarks);
      } catch (_) {}
    }
    raw ??= _memoryFallback[AppConfig.keyPendingMarks];
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  }

  Future<bool> savePendingMarksQueue(List<Map<String, dynamic>> queue) async {
    final encoded = jsonEncode(queue);
    if (_prefs != null) {
      try {
        return await _prefs.setString(AppConfig.keyPendingMarks, encoded);
      } catch (_) {}
    }
    _memoryFallback[AppConfig.keyPendingMarks] = encoded;
    return true;
  }

  Future<bool> appendPendingMarks(Map<String, dynamic> item) async {
    final queue = getPendingMarksQueue();
    queue.add(item);
    return savePendingMarksQueue(queue);
  }

  // Generic Cache Storage
  Future<bool> setCachedJson(String key, dynamic data) async {
    final encoded = jsonEncode(data);
    if (_prefs != null) {
      try {
        return await _prefs.setString(key, encoded);
      } catch (_) {}
    }
    _memoryFallback[key] = encoded;
    return true;
  }

  dynamic getCachedJson(String key) {
    String? raw;
    if (_prefs != null) {
      try {
        raw = _prefs.getString(key);
      } catch (_) {}
    }
    raw ??= _memoryFallback[key];
    if (raw == null) return null;
    try {
      return jsonDecode(raw);
    } catch (_) {
      return null;
    }
  }

  Future<bool> setString(String key, String value) async {
    if (_prefs != null) {
      try {
        return await _prefs.setString(key, value);
      } catch (_) {}
    }
    _memoryFallback[key] = value;
    return true;
  }

  String? getString(String key) {
    if (_prefs != null) {
      try {
        return _prefs.getString(key);
      } catch (_) {}
    }
    return _memoryFallback[key];
  }

  // Clear Session
  Future<void> clearAllSession() async {
    await clearToken();
    await clearUser();
  }
}
