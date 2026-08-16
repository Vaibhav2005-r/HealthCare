import 'package:flutter_riverpod/flutter_riverpod.dart';

class ReportDraft {
  final String? patientName;
  final int? age;
  final String? sex;
  final String? contactNumber;
  final String? village;
  final List<String> symptoms;
  final int? durationDays;
  final double? temperature;
  final String? temperatureUnit;
  final List<String> comorbidities;
  final String? medicationTaken;
  final double? locationLat;
  final double? locationLng;
  final double? locationAccuracy;
  final String? manualLocationReason;
  final String? imagePath;

  ReportDraft({
    this.patientName,
    this.age,
    this.sex,
    this.contactNumber,
    this.village,
    this.symptoms = const [],
    this.durationDays,
    this.temperature,
    this.temperatureUnit = 'C',
    this.comorbidities = const [],
    this.medicationTaken,
    this.locationLat,
    this.locationLng,
    this.locationAccuracy,
    this.manualLocationReason,
    this.imagePath,
  });

  ReportDraft copyWith({
    String? patientName,
    int? age,
    String? sex,
    String? contactNumber,
    String? village,
    List<String>? symptoms,
    int? durationDays,
    double? temperature,
    String? temperatureUnit,
    List<String>? comorbidities,
    String? medicationTaken,
    double? locationLat,
    double? locationLng,
    double? locationAccuracy,
    String? manualLocationReason,
    String? imagePath,
  }) {
    return ReportDraft(
      patientName: patientName ?? this.patientName,
      age: age ?? this.age,
      sex: sex ?? this.sex,
      contactNumber: contactNumber ?? this.contactNumber,
      village: village ?? this.village,
      symptoms: symptoms ?? this.symptoms,
      durationDays: durationDays ?? this.durationDays,
      temperature: temperature != null ? (temperature == -1 ? null : temperature) : this.temperature,
      temperatureUnit: temperatureUnit ?? this.temperatureUnit,
      comorbidities: comorbidities ?? this.comorbidities,
      medicationTaken: medicationTaken ?? this.medicationTaken,
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

  void updateBasics({
    required String patientName,
    required int age,
    required String sex,
    String? contactNumber,
    required String village,
  }) {
    state = state.copyWith(
      patientName: patientName,
      age: age,
      sex: sex,
      contactNumber: contactNumber,
      village: village,
    );
  }

  void updateMedicalBackground({
    double? temperature,
    String? temperatureUnit,
    List<String>? comorbidities,
    String? medicationTaken,
  }) {
    state = state.copyWith(
      temperature: temperature ?? -1, // Use -1 to indicate clearing if null
      temperatureUnit: temperatureUnit,
      comorbidities: comorbidities,
      medicationTaken: medicationTaken,
    );
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
