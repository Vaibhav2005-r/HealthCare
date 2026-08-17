import '../models/models.dart';

class TriageService {
  RiskTier classify(List<String> symptoms, int durationDays, {double? temperature, String? tempUnit, List<String> comorbidities = const []}) {
    if (symptoms.isEmpty && temperature == null) return RiskTier.green;

    int severityScore = 0;
    for (var symptom in symptoms) {
      switch (symptom.toLowerCase()) {
        case 'fever':
        case 'diarrhea':
        case 'vomiting':
          severityScore += 2;
          break;
        case 'dehydration':
        case 'lethargy':
          severityScore += 3;
          break;
        default:
          severityScore += 1;
      }
    }

    if (durationDays >= 3) severityScore += 2;
    if (durationDays >= 7) severityScore += 2;

    // Evaluate temperature
    if (temperature != null) {
      double cTemp = temperature;
      if (tempUnit == 'F') {
        cTemp = (temperature - 32) * 5 / 9;
      }
      if (cTemp >= 39.0) { // High fever
        severityScore += 3;
      } else if (cTemp >= 38.0) {
        severityScore += 1;
      }
    }

    // Evaluate comorbidities
    for (var condition in comorbidities) {
      if (condition.toLowerCase() != 'none') {
        severityScore += 2;
      }
    }

    if (severityScore >= 6) return RiskTier.red;
    if (severityScore >= 3) return RiskTier.amber;
    return RiskTier.green;
  }
}
