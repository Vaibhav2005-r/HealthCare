import '../models/models.dart';

class MockDataService {
  Future<List<AssistantMessage>> getAssistantResponses(String query) async {
    await Future.delayed(const Duration(seconds: 1)); // Mock latency
    
    // Canned RAG responses matching the web dashboard's RAG Playground citation pattern
    if (query.toLowerCase().contains("fever") || query.toLowerCase().contains("dengue")) {
      return [
        AssistantMessage(id: 'u1', text: query, isUser: true),
        AssistantMessage(
          id: 'a1', 
          text: 'High fever with severe joint pain in this region often indicates Dengue fever. Recommend immediate paracetamol and oral rehydration.', 
          isUser: false,
          citation: 'Vector-Borne Disease Protocol.pdf (p. 14)',
        ),
      ];
    } else if (query.toLowerCase().contains("cholera") || query.toLowerCase().contains("diarrhea")) {
       return [
        AssistantMessage(id: 'u2', text: query, isUser: true),
        AssistantMessage(
          id: 'a2', 
          text: 'Severe acute watery diarrhea may indicate Cholera. Initiate ORS immediately and refer to the nearest PHC if signs of severe dehydration are present.', 
          isUser: false,
          citation: 'Waterborne Disease Guidelines.pdf (p. 22)',
        ),
      ];
    } else {
      return [
        AssistantMessage(id: 'u3', text: query, isUser: true),
        AssistantMessage(
          id: 'a3', 
          text: 'Please monitor the patient and refer to the district hospital if symptoms worsen or last beyond 48 hours.', 
          isUser: false,
          citation: 'General Triage Manual.pdf (p. 5)',
        ),
      ];
    }
  }

  Map<String, dynamic> getWorkerProfile() {
    return {
      'id': 'ASHA-4029',
      'name': 'Sunita Devi',
      'phc': 'Rampur PHC',
      'district': 'Patna',
      'reportsThisWeek': 14,
    };
  }

  List<String> getVillages() {
    return ['Rampur', 'Madhopur', 'Bishunpur', 'Kalyanpur', 'Chandipur'];
  }
}
