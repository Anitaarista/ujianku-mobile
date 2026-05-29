import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

/// Layanan API dasar untuk komunikasi dengan backend UjianKu
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final StorageService _storage = StorageService();

  /// Mendapatkan header umum dengan token autentikasi
  Future<Map<String, String>> _getHeaders({bool isJson = true}) async {
    final token = await _storage.getToken();
    final headers = <String, String>{
      'Accept': 'application/json',
    };
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Permintaan GET
  Future<ApiResponse> get(String endpoint, {Map<String, String>? queryParams}) async {
    try {
      Uri url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      if (queryParams != null && queryParams.isNotEmpty) {
        url = url.replace(queryParameters: queryParams);
      }

      final headers = await _getHeaders(isJson: false);
      final response = await http
          .get(url, headers: headers)
          .timeout(Duration(seconds: ApiConfig.connectTimeout));

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _getErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  /// Permintaan POST
  Future<ApiResponse> post(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders();
      final response = await http
          .post(url, headers: headers, body: jsonEncode(body ?? {}))
          .timeout(Duration(seconds: ApiConfig.receiveTimeout));

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _getErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  /// Permintaan PUT
  Future<ApiResponse> put(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders();
      final response = await http
          .put(url, headers: headers, body: jsonEncode(body ?? {}))
          .timeout(Duration(seconds: ApiConfig.receiveTimeout));

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _getErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  /// Permintaan DELETE
  Future<ApiResponse> delete(String endpoint) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders(isJson: false);
      final response = await http
          .delete(url, headers: headers)
          .timeout(Duration(seconds: ApiConfig.connectTimeout));

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _getErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  /// Permintaan PATCH
  Future<ApiResponse> patch(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders();
      final response = await http
          .patch(url, headers: headers, body: jsonEncode(body ?? {}))
          .timeout(Duration(seconds: ApiConfig.receiveTimeout));

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _getErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  /// Menangani respons HTTP
  ApiResponse _handleResponse(http.Response response) {
    try {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final success = data['success'] == true;

      switch (response.statusCode) {
        case 200:
        case 201:
          return ApiResponse(
            success: success,
            data: data,
            message: data['error']?['message'] as String? ?? 
                     data['message'] as String? ?? 
                     (success ? 'Berhasil' : 'Gagal'),
            statusCode: response.statusCode,
          );
        case 400:
          return ApiResponse(
            success: false,
            data: data,
            message: data['error']?['message'] as String? ?? 'Permintaan tidak valid',
            statusCode: response.statusCode,
          );
        case 401:
          return ApiResponse(
            success: false,
            data: data,
            message: data['error']?['message'] as String? ?? 'Tidak terautentikasi',
            statusCode: response.statusCode,
          );
        case 403:
          return ApiResponse(
            success: false,
            data: data,
            message: data['error']?['message'] as String? ?? 'Akses ditolak',
            statusCode: response.statusCode,
          );
        case 404:
          return ApiResponse(
            success: false,
            data: data,
            message: data['error']?['message'] as String? ?? 'Data tidak ditemukan',
            statusCode: response.statusCode,
          );
        case 422:
          return ApiResponse(
            success: false,
            data: data,
            message: data['error']?['message'] as String? ?? 'Data tidak valid',
            statusCode: response.statusCode,
            errors: data['errors'] as Map<String, dynamic>?,
          );
        case 500:
          return ApiResponse(
            success: false,
            data: data,
            message: data['error']?['message'] as String? ?? 'Kesalahan server',
            statusCode: response.statusCode,
          );
        default:
          return ApiResponse(
            success: false,
            data: data,
            message: data['error']?['message'] as String? ?? 'Terjadi kesalahan',
            statusCode: response.statusCode,
          );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Gagal memproses respons server',
        statusCode: response.statusCode,
      );
    }
  }

  /// Mendapatkan pesan error dari exception
  String _getErrorMessage(dynamic error) {
    if (error.toString().contains('SocketException')) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    }
    if (error.toString().contains('TimeoutException')) {
      return 'Waktu koneksi habis. Silakan coba lagi.';
    }
    return 'Terjadi kesalahan: ${error.toString()}';
  }
}

/// Model respons API
class ApiResponse {
  final bool success;
  final Map<String, dynamic>? data;
  final String message;
  final int statusCode;
  final Map<String, dynamic>? errors;

  const ApiResponse({
    required this.success,
    this.data,
    required this.message,
    required this.statusCode,
    this.errors,
  });

  /// Mendapatkan data dari respons
  dynamic get body => data?['data'];

  /// Mendapatkan daftar dari respons
  List<dynamic>? get listBody {
    final d = data?['data'];
    if (d is List) return d;
    if (d is Map<String, dynamic>) {
      // Paginated response: { data: [...], pagination: {...} }
      return d['data'] as List<dynamic>?;
    }
    return null;
  }

  /// Mendapatkan data pagination dari respons
  Map<String, dynamic>? get pagination {
    final d = data?['data'];
    if (d is Map<String, dynamic>) {
      return d['pagination'] as Map<String, dynamic>?;
    }
    return null;
  }
}
