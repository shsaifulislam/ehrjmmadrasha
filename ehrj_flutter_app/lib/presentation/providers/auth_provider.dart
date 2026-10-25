import 'package:flutter/material.dart';

import '../../data/models/user_model.dart';
import '../../data/repositories/auth_repository.dart';

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repo;

  UserModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  AuthProvider(this._repo);

  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  String get role => _currentUser?.role ?? 'PUBLIC';
  String get displayName =>
      _currentUser?.name ?? _currentUser?.username ?? 'ব্যবহারকারী';

  Future<void> init() async {
    // 1. Immediately read cached user from local storage (0 ms)
    final localUser = _repo.cachedUser;
    if (localUser != null) {
      _currentUser = localUser;
      _isLoading = false;
      notifyListeners();
    } else if (!_repo.isAuthenticated) {
      // If no token exists at all, we are immediately unauthenticated (0 ms)
      _currentUser = null;
      _isLoading = false;
      notifyListeners();
      return;
    } else {
      _isLoading = true;
      notifyListeners();
    }

    try {
      // 2. Validate/refresh session with server with a strict 3-second timeout
      final remoteUser = await _repo.restoreSession().timeout(
        const Duration(seconds: 3),
        onTimeout: () => localUser,
      );

      if (remoteUser != null) {
        _currentUser = remoteUser;
      } else if (localUser == null) {
        _currentUser = null;
      }
    } catch (_) {
      // Network failure or timeout: retain localUser if available, else null
      _currentUser = localUser ?? _repo.cachedUser;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentUser = await _repo.login(identifier, password);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    await _repo.logout();
    _currentUser = null;
    _isLoading = false;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
