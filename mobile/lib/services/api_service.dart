import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/models.dart';

/// API bridge for the FastAPI service.
/// For Android Emulator: 10.0.2.2:8001
/// For Physical Device / Localhost: configured via --dart-define=API_BASE_URL=...
class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  static const _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8001',
  );
  static const _demoWorkerId = 'ASHA-4029';
  final http.Client _client;

  Future<String?> syncReport(Report report) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/v1/reports'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'worker_id': _demoWorkerId,
        'patient_name': report.patientName,
        'patient_age': report.age,
        'patient_gender': _genderCode(report.sex),
        'village': report.village,
        'symptoms': report.symptoms,
        'duration_days': report.durationDays,
        'temperature': report.temperature,
        'severity': report.riskTier.name.toUpperCase(),
        'disease_type': 'UNKNOWN',
        'location_lat': report.locationLat,
        'location_lng': report.locationLng,
        'client_report_id': report.id,
      }),
    );
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw ApiException(response.statusCode, response.body);
    }
    final data = jsonDecode(response.body);
    return data['report_id'] as String?;
  }

  Future<String> askAssistant(String query) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/v1/ask'),
        headers: const {'Content-Type': 'application/json'},
        body: jsonEncode({'query': query}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['answer'] ?? data['response'] ?? 'Guidance received.';
      }
    } catch (_) {}
    return 'Unable to reach central AI assistant. Please consult standard offline clinical protocol.';
  }

  Future<List<Map<String, dynamic>>> fetchTelemetryLogs({String? district}) async {
    final uri = Uri.parse('$_baseUrl/api/v1/telemetry/logs')
        .replace(queryParameters: district != null ? {'district': district} : null);
    final response = await _client.get(uri);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final logs = data['logs'] as List<dynamic>? ?? [];
      return logs.cast<Map<String, dynamic>>();
    }
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
