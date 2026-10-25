import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/storage/local_storage_service.dart';
import '../../data/repositories/teacher_repository.dart';

class SyncProvider extends ChangeNotifier {
  final LocalStorageService _storage;
  final TeacherRepository _teacherRepo;

  bool _isOnline = true;
  bool _isSyncing = false;
  int _pendingCount = 0;
  String? _lastSyncMessage;

  SyncProvider(this._storage, this._teacherRepo) {
    _refreshPendingCount();
  }

  bool get isOnline => _isOnline;
  bool get isSyncing => _isSyncing;
  int get pendingCount => _pendingCount;
  String? get lastSyncMessage => _lastSyncMessage;

  void setConnectivity(bool online) {
    if (_isOnline != online) {
      _isOnline = online;
      notifyListeners();
      if (_isOnline && _pendingCount > 0) {
        syncNow();
      }
    }
  }

  void _refreshPendingCount() {
    final attQueue = _storage.getPendingAttendanceQueue().length;
    final marksQueue = _storage.getPendingMarksQueue().length;
    _pendingCount = attQueue + marksQueue;
    notifyListeners();
  }

  Future<void> refresh() async {
    _refreshPendingCount();
  }

  Future<void> syncNow() async {
    if (_isSyncing) return;
    _isSyncing = true;
    _lastSyncMessage = null;
    notifyListeners();

    try {
      final attSynced = await _teacherRepo.syncPendingAttendanceQueue();
      final marksSynced = await _teacherRepo.syncPendingMarksQueue();
      final total = attSynced + marksSynced;

      _refreshPendingCount();
      _lastSyncMessage = total > 0
          ? '$total টি রেকর্ড সফলভাবে সিঙ্ক হয়েছে।'
          : 'নতুন কোনো পেন্ডিং রেকর্ড নেই।';
    } catch (e) {
      _lastSyncMessage = 'সিঙ্ক করতে সমস্যা হয়েছে: $e';
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }
}
