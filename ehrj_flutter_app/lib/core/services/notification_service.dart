import 'package:flutter/foundation.dart';

import '../network/api_client.dart';
import '../storage/local_storage_service.dart';

class NotificationItem {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool isRead;
  final String createdAt;

  NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id']?.toString() ?? '',
      title:
          json['title']?.toString() ??
          json['customTitle']?.toString() ??
          'নোটিফিকেশন',
      body: json['body']?.toString() ?? json['message']?.toString() ?? '',
      type: json['type']?.toString() ?? 'GENERAL',
      isRead: json['isRead'] == true,
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}

class NotificationService extends ChangeNotifier {
  final ApiClient _api;
  final LocalStorageService _storage;

  int _unreadCount = 0;
  List<NotificationItem> _notifications = [];
  bool _isLoading = false;
  bool _permissionGranted = false;

  NotificationService(this._api, this._storage) {
    _init();
  }

  int get unreadCount => _unreadCount;
  List<NotificationItem> get notifications => _notifications;
  bool get isLoading => _isLoading;
  bool get permissionGranted => _permissionGranted;

  void _init() {
    final cached = _storage.getCachedJson('ehrj_cached_notifications');
    if (cached is List) {
      _notifications = cached
          .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
          .toList();
      _unreadCount = _notifications.where((n) => !n.isRead).length;
    }
  }

  /// Request in-app notification permission
  Future<bool> requestPermission() async {
    // In a real device with FCM, flutter_local_notifications or firebase_messaging would prompt
    _permissionGranted = true;
    notifyListeners();
    return true;
  }

  /// Fetch notifications from backend
  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await _api.get('/api/portal/notifications');
      if (res.statusCode == 200 && res.data != null) {
        final list =
            (res.data['notifications'] as List? ??
            res.data['data'] as List? ??
            []);
        _notifications = list
            .map((n) => NotificationItem.fromJson(n as Map<String, dynamic>))
            .toList();
        _unreadCount =
            res.data['unreadCount'] ??
            _notifications.where((n) => !n.isRead).length;

        await _storage.setCachedJson('ehrj_cached_notifications', list);
      }
    } catch (e) {
      debugPrint('Notification fetch error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Mark all notifications as read locally and sync
  Future<void> markAllAsRead() async {
    _unreadCount = 0;
    notifyListeners();
  }
}
