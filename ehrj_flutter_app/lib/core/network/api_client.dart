import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/local_storage_service.dart';

class ApiClient {
  final Dio _dio;
  final LocalStorageService _storage;

  ApiClient(this._storage)
    : _dio = Dio(
        BaseOptions(
          baseUrl:
              _storage.getString(AppConfig.keyCustomApiBaseUrl) ??
              AppConfig.apiBaseUrl,
          connectTimeout: AppConfig.connectTimeout,
          receiveTimeout: AppConfig.receiveTimeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-client-platform': 'flutter-app',
          },
        ),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _storage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          // Detect unauthorized status (401)
          if (error.response?.statusCode == 401) {
            // Token expired or invalid
          }
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;
  String get baseUrl => _dio.options.baseUrl;

  Future<void> updateBaseUrl(String newUrl) async {
    var trimmed = newUrl.trim();
    if (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    _dio.options.baseUrl = trimmed;
    await _storage.setString(AppConfig.keyCustomApiBaseUrl, trimmed);
  }

  // Generic Helpers
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
}
