import '../models/models.dart';
import 'api_service.dart';

/// Legacy bridge redirecting to live Supabase / FastAPI endpoints.
class MockDataService {
  final ApiService _apiService = ApiService();

  Future<List<AssistantMessage>> getAssistantResponses(String query) async {
    final answer = await _apiService.askAssistant(query);
    return [
      AssistantMessage(
        id: 'u_${DateTime.now().millisecondsSinceEpoch}',
        text: query,
        isUser: true,
      ),
      AssistantMessage(
        id: 'a_${DateTime.now().millisecondsSinceEpoch}',
        text: answer,
        isUser: false,
        citation: 'IDSP & WHO Clinical Guidelines',
      ),
    ];
  }

  Map<String, dynamic> getWorkerProfile() {
    return {
      'id': 'ASHA-4029',
      'name': 'Sunita Gaikwad',
      'full_name': 'Sunita Gaikwad',
      'role': 'ASHA Lead',
      'phc': 'Haveli PHC',
      'district': 'Pune',
      'block': 'Haveli',
      'state': 'Maharashtra',
      'reportsThisWeek': 18,
    };
  }

  List<String> getVillages() {
    return [
      'Khed', 'Manchar', 'Junnar', 'Shirur', 'Ambegaon',
      'Wagholi', 'Hadapsar Rural', 'Trimbak Rural', 'Igatpuri',
      'Sinnar', 'Kalyan Rural', 'Karveer Rural', 'Ramtek', 'Paithan Rural', 'Pandharpur Rural'
    ];
  }

  List<Report> generateHistoricalReports() {
    return [];
  }
}
