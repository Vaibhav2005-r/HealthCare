import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/models.dart';

/// API bridge for the FastAPI service. For an Android emulator the default
/// address (10.0.2.2) points back to the computer running the backend.
class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  static const _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );
  static const _demoWorkerId = 'ASHA-4029';
  final http.Client _client;

  Future<void> syncReport(Report report) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/v1/reports'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'worker_id': _demoWorkerId,
        'village_id': report.village,
        'patient_age': report.age,
        'patient_gender': _genderCode(report.sex),
        'symptoms': report.symptoms,
        'duration_days': report.durationDays,
        'disease_type': 'UNKNOWN',
        'client_report_id': report.id,
      }),
    );
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw ApiException(response.statusCode, response.body);
    }
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
