import '../models/models.dart';

class TriageService {
  RiskTier classify(List<String> symptoms, int durationDays) {
    if (symptoms.isEmpty) return RiskTier.green;

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

    if (severityScore >= 6) return RiskTier.red;
    if (severityScore >= 3) return RiskTier.amber;
    return RiskTier.green;
  }
}
