import 'dart:math' as dart_math;
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

  List<Report> generateHistoricalReports() {
    final List<Report> reports = [];
    final now = DateTime.now();
    final random = dart_math.Random(42); // deterministic

    final symptomSets = [
      ['Fever', 'Cough'],
      ['Headache', 'Nausea', 'Vomiting'],
      ['Diarrhea', 'Dehydration'],
      ['Shortness of breath', 'Chest pain'],
      ['Rash', 'Itching'],
      ['Fatigue', 'Muscle aches'],
      ['Loss of taste', 'Loss of smell'],
      ['Sore throat', 'Runny nose'],
    ];

    for (int i = 0; i < 45; i++) { // Last 45 days
      final date = now.subtract(Duration(days: i));
      
      // Randomly generate 0 to 4 reports per day
      int reportsToday = 0;
      double chance = random.nextDouble();
      if (chance > 0.8) { reportsToday = 3; }
      else if (chance > 0.5) { reportsToday = 2; }
      else if (chance > 0.2) { reportsToday = 1; }

      for (int j = 0; j < reportsToday; j++) {
        final r = random.nextDouble();
        RiskTier tier = RiskTier.green;
        if (r > 0.85) { tier = RiskTier.red; }
        else if (r > 0.5) { tier = RiskTier.amber; }

        final symptoms = symptomSets[random.nextInt(symptomSets.length)];
        
        final reportDate = date.subtract(Duration(hours: random.nextInt(8)));

        reports.add(
          Report(
            id: 'mock_${i}_$j',
            patientName: 'Patient ${random.nextInt(1000)}',
            age: 18 + random.nextInt(50),
            sex: random.nextBool() ? 'Male' : 'Female',
            village: getVillages()[random.nextInt(getVillages().length)],
            symptoms: symptoms,
            comorbidities: const [],
            durationDays: 1 + random.nextInt(5),
            riskTier: tier,
            syncStatus: SyncStatus.synced,
            createdAt: reportDate,
          )
        );
      }
    }

    return reports;
  }
}
