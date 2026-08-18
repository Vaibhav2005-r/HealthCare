import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/models.dart';

/// API bridge for the FastAPI & Supabase backend.
/// Automatically detects Web / Desktop (127.0.0.1:8001) vs Android Emulator (10.0.2.2:8001).
class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  static const String _configuredUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static const _demoWorkerId = 'ASHA-4029';
  final http.Client _client;

  List<String> get _candidateUrls {
    if (_configuredUrl.isNotEmpty) return [_configuredUrl];
    if (kIsWeb) return ['http://127.0.0.1:8001', 'http://localhost:8001'];
    return ['http://127.0.0.1:8001', 'http://10.0.2.2:8001', 'http://localhost:8001'];
  }

  Future<http.Response> _postWithFallback(String path, Map<String, dynamic> body) async {
    Exception? lastException;
    for (final base in _candidateUrls) {
      try {
        final uri = Uri.parse('$base$path');
        final response = await _client.post(
          uri,
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 8));
        return response;
      } catch (e) {
        lastException = e is Exception ? e : Exception(e.toString());
      }
    }
    throw lastException ?? Exception('All candidate URLs failed for $path');
  }

  Future<http.Response> _getWithFallback(String path, [Map<String, String>? queryParams]) async {
    Exception? lastException;
    for (final base in _candidateUrls) {
      try {
        var uri = Uri.parse('$base$path');
        if (queryParams != null && queryParams.isNotEmpty) {
          uri = uri.replace(queryParameters: queryParams);
        }
        final response = await _client.get(uri).timeout(const Duration(seconds: 8));
        return response;
      } catch (e) {
        lastException = e is Exception ? e : Exception(e.toString());
      }
    }
    throw lastException ?? Exception('All candidate URLs failed for $path');
  }

  // --- WORKER PROFILE & AUTH (SUPABASE) ---
  Future<Map<String, dynamic>> fetchWorkerProfile({String phone = '9876543210'}) async {
    try {
      final response = await _getWithFallback('/api/v1/mobile/profile', {'phone': phone});
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['profile'] as Map<String, dynamic>;
      } else {
        final err = jsonDecode(response.body);
        throw ApiException(response.statusCode, err['detail'] ?? 'Worker not found');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(500, 'Unable to connect to Health Worker Directory: $e');
    }
  }

  Future<Map<String, dynamic>> login(String phoneNumber) async {
    final response = await _postWithFallback('/api/v1/mobile/auth/login', {
      'phone_number': phoneNumber,
    });
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final err = jsonDecode(response.body);
      throw ApiException(response.statusCode, err['detail'] ?? 'Phone number not registered');
    }
  }

  Future<Map<String, dynamic>> verifyOtp(String phoneNumber, String otp) async {
    final response = await _postWithFallback('/api/v1/mobile/auth/verify-otp', {
      'phone_number': phoneNumber,
      'otp': otp,
    });
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final err = jsonDecode(response.body);
      throw ApiException(response.statusCode, err['detail'] ?? 'Invalid verification code');
    }
  }

  // --- VILLAGES (SUPABASE) ---
  Future<List<String>> fetchVillages({String? district, String? block}) async {
    try {
      final queryParams = <String, String>{};
      if (district != null) queryParams['district'] = district;
      if (block != null) queryParams['block'] = block;

      final response = await _getWithFallback('/api/v1/mobile/villages', queryParams);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['villages'] as List<dynamic>? ?? [];
        return list.map((v) => v['village_name'] as String).toList();
      }
    } catch (_) {}
    return [
      'Khed', 'Manchar', 'Junnar', 'Shirur', 'Ambegaon',
      'Wagholi', 'Hadapsar Rural', 'Trimbak Rural', 'Igatpuri',
      'Sinnar', 'Kalyan Rural', 'Karveer Rural', 'Ramtek', 'Paithan Rural', 'Pandharpur Rural'
    ];
  }

  // --- CLINICAL GUIDANCE & RAG (SUPABASE + QDRANT + LLAMA) ---
  Future<String> askAssistant(String query) async {
    try {
      final response = await _postWithFallback('/api/v1/ask', {'query': query});
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final answer = data['answer'] as String?;
        if (answer != null && answer.isNotEmpty && !answer.contains('Error querying')) {
          return answer;
        }
      }
    } catch (_) {}

    // Fallback directly to Supabase guidance protocols
    try {
      final protocols = await fetchClinicalGuidance(query: query);
      if (protocols.isNotEmpty) {
        final p = protocols.first;
        return '**Clinical Guidance: ${p['condition']} (${p['category']})**\n\n'
            '**Immediate Action:**\n${p['immediate_action']}\n\n'
            '**Standard Dosage:**\n${p['standard_dosage'] ?? 'Refer to PHC Medical Officer'}\n\n'
            '**Red Flag Warning Signs:**\n- ${(p['red_flags'] as List<dynamic>? ?? []).join('\n- ')}\n\n'
            '**Source:** ${p['source_document']} (Page ${p['page_number']})';
      }
    } catch (_) {}

    return '**Standard Clinical Protocol:**\n'
        '1. Assess vital signs and hydration status immediately.\n'
        '2. For diarrhea/vomiting: Administer ORS aggressively.\n'
        '3. For fever with rash/joint pain: Prescribe Paracetamol only; avoid NSAIDs (Aspirin/Ibuprofen).\n'
        '4. Notify PHC Medical Officer if red flag danger signs appear.\n\n'
        '*Source: IDSP National Guidelines & WHO Outbreak Directives*';
  }

  Future<List<Map<String, dynamic>>> fetchClinicalGuidance({String? query, String? category}) async {
    try {
      final queryParams = <String, String>{};
      if (query != null && query.isNotEmpty) queryParams['query'] = query;
      if (category != null && category.isNotEmpty) queryParams['category'] = category;

      final response = await _getWithFallback('/api/v1/mobile/guidance', queryParams);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['protocols'] as List<dynamic>? ?? [];
        return list.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [];
  }

  // --- REPORT SYNC (SUPABASE) ---
  Future<String?> syncReport(Report report) async {
    final response = await _postWithFallback('/api/v1/reports', {
      'worker_id': _demoWorkerId,
      'patient_name': report.patientName,
      'patient_age': report.age,
      'patient_gender': _genderCode(report.sex),
      'village': report.village,
      'symptoms': report.symptoms,
      'duration_days': report.durationDays,
      'temperature': report.temperature,
      'temperature_unit': report.temperatureUnit ?? 'F',
      'comorbidities': report.comorbidities,
      'medication_taken': report.medicationTaken,
      'severity': report.riskTier.name.toUpperCase(),
      'disease_type': 'UNKNOWN',
      'location_lat': report.locationLat,
      'location_lng': report.locationLng,
      'location_accuracy': report.locationAccuracy,
      'manual_location_reason': report.manualLocationReason,
      'client_report_id': report.id,
    });
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw ApiException(response.statusCode, response.body);
    }
    final data = jsonDecode(response.body);
    return data['report_id'] as String?;
  }

  Future<int> syncReportsBatch(List<Report> reports) async {
    if (reports.isEmpty) return 0;
    
    final payload = reports.map((r) => {
      'worker_id': _demoWorkerId,
      'patient_name': r.patientName,
      'patient_age': r.age,
      'patient_gender': _genderCode(r.sex),
      'village': r.village,
      'symptoms': r.symptoms,
      'duration_days': r.durationDays,
      'temperature': r.temperature,
      'temperature_unit': r.temperatureUnit ?? 'F',
      'comorbidities': r.comorbidities,
      'medication_taken': r.medicationTaken,
      'severity': r.riskTier.name.toUpperCase(),
      'disease_type': 'UNKNOWN',
      'location_lat': r.locationLat,
      'location_lng': r.locationLng,
      'location_accuracy': r.locationAccuracy,
      'manual_location_reason': r.manualLocationReason,
      'client_report_id': r.id,
    }).toList();

    final response = await _postWithFallback('/api/v1/reports/sync', {'reports': payload});

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['synced'] as int? ?? 0;
    } else {
      throw ApiException(response.statusCode, response.body);
    }
  }

  Future<bool> triggerSOS({
    required String workerId,
    required String district,
    int cases = 5,
    String severity = 'CRITICAL',
    String? summary,
  }) async {
    try {
      final response = await _postWithFallback('/api/v1/alerts/sos', {
        'worker_id': workerId,
        'district': district,
        'cases': cases,
        'severity': severity,
        'summary': summary ?? 'Manual Emergency SOS triggered by field healthcare worker in $district',
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> fetchTelemetryLogs({String? district}) async {
    try {
      final queryParams = district != null ? {'district': district} : null;
      final response = await _getWithFallback('/api/v1/telemetry/logs', queryParams);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final logs = data['logs'] as List<dynamic>? ?? [];
        return logs.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [];
  }

  String _genderCode(String value) {
    switch (value.toLowerCase()) {
      case 'male': return 'M';
      case 'female': return 'F';
      default: return 'O';
    }
  }
}

class ApiException implements Exception {
  ApiException(this.statusCode, this.body);
  final int statusCode;
  final String body;

  @override
  String toString() => 'Server error $statusCode: $body';
}
