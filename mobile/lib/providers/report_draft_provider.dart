import 'package:flutter_riverpod/flutter_riverpod.dart';

class ReportDraft {
  final int? age;
  final String? sex;
  final String? village;
  final List<String> symptoms;
  final int? durationDays;
  final double? locationLat;
  final double? locationLng;
  final double? locationAccuracy;
  final String? manualLocationReason;
  final String? imagePath;

  ReportDraft({
    this.age,
    this.sex,
    this.village,
    this.symptoms = const [],
    this.durationDays,
    this.locationLat,
    this.locationLng,
    this.locationAccuracy,
    this.manualLocationReason,
    this.imagePath,
  });

  ReportDraft copyWith({
    int? age,
    String? sex,
    String? village,
    List<String>? symptoms,
    int? durationDays,
    double? locationLat,
    double? locationLng,
    double? locationAccuracy,
    String? manualLocationReason,
    String? imagePath,
  }) {
    return ReportDraft(
      age: age ?? this.age,
      sex: sex ?? this.sex,
      village: village ?? this.village,
      symptoms: symptoms ?? this.symptoms,
      durationDays: durationDays ?? this.durationDays,
      locationLat: locationLat ?? this.locationLat,
      locationLng: locationLng ?? this.locationLng,
      locationAccuracy: locationAccuracy ?? this.locationAccuracy,
      manualLocationReason: manualLocationReason ?? this.manualLocationReason,
      imagePath: imagePath ?? this.imagePath,
    );
  }
}

class ReportDraftNotifier extends StateNotifier<ReportDraft> {
  ReportDraftNotifier() : super(ReportDraft());

  void updateBasics({required int age, required String sex, required String village}) {
    state = state.copyWith(age: age, sex: sex, village: village);
  }

  void updateLocation({double? lat, double? lng, double? accuracy, String? reason}) {
    state = state.copyWith(
      locationLat: lat,
      locationLng: lng,
      locationAccuracy: accuracy,
      manualLocationReason: reason,
    );
  }

  void updateImage(String? path) {
    state = state.copyWith(imagePath: path);
  }

  void toggleSymptom(String symptom) {
    final current = List<String>.from(state.symptoms);
    if (current.contains(symptom)) {
      current.remove(symptom);
    } else {
      current.add(symptom);
    }
    state = state.copyWith(symptoms: current);
  }

  void updateDuration(int days) {
    state = state.copyWith(durationDays: days);
  }

  void clear() {
    state = ReportDraft();
  }
}

final reportDraftProvider = StateNotifierProvider<ReportDraftNotifier, ReportDraft>((ref) {
  return ReportDraftNotifier();
});
