import 'package:flutter_riverpod/flutter_riverpod.dart';

class ReportDraft {
  final int? age;
  final String? sex;
  final String? village;
  final List<String> symptoms;
  final int? durationDays;

  ReportDraft({
    this.age,
    this.sex,
    this.village,
    this.symptoms = const [],
    this.durationDays,
  });

  ReportDraft copyWith({
    int? age,
    String? sex,
    String? village,
    List<String>? symptoms,
    int? durationDays,
  }) {
    return ReportDraft(
      age: age ?? this.age,
      sex: sex ?? this.sex,
      village: village ?? this.village,
      symptoms: symptoms ?? this.symptoms,
      durationDays: durationDays ?? this.durationDays,
    );
  }
}

class ReportDraftNotifier extends StateNotifier<ReportDraft> {
  ReportDraftNotifier() : super(ReportDraft());

  void updateBasics({required int age, required String sex, required String village}) {
    state = state.copyWith(age: age, sex: sex, village: village);
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
