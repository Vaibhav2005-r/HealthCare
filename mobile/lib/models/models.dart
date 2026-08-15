import 'dart:convert';

enum SyncStatus { draft, triaged, savedLocally, queued, syncing, synced, syncFailed }
enum RiskTier { green, amber, red }

class Report {
  final String id;
  final int age;
  final String sex;
  final String village;
  final List<String> symptoms;
  final int durationDays;
  final RiskTier riskTier;
  final SyncStatus syncStatus;
  final DateTime createdAt;

  Report({
    required this.id,
    required this.age,
    required this.sex,
    required this.village,
    required this.symptoms,
    required this.durationDays,
    required this.riskTier,
    required this.syncStatus,
    required this.createdAt,
  });

  Report copyWith({
    String? id,
    int? age,
    String? sex,
    String? village,
    List<String>? symptoms,
    int? durationDays,
    RiskTier? riskTier,
    SyncStatus? syncStatus,
    DateTime? createdAt,
  }) {
    return Report(
      id: id ?? this.id,
      age: age ?? this.age,
      sex: sex ?? this.sex,
      village: village ?? this.village,
      symptoms: symptoms ?? this.symptoms,
      durationDays: durationDays ?? this.durationDays,
      riskTier: riskTier ?? this.riskTier,
      syncStatus: syncStatus ?? this.syncStatus,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'age': age,
      'sex': sex,
      'village': village,
      'symptoms': jsonEncode(symptoms),
      'durationDays': durationDays,
      'riskTier': riskTier.name,
      'syncStatus': syncStatus.name,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory Report.fromMap(Map<String, dynamic> map) {
    return Report(
      id: map['id'],
      age: map['age'],
      sex: map['sex'],
      village: map['village'],
      symptoms: List<String>.from(jsonDecode(map['symptoms'])),
      durationDays: map['durationDays'],
      riskTier: RiskTier.values.firstWhere((e) => e.name == map['riskTier']),
      syncStatus: SyncStatus.values.firstWhere((e) => e.name == map['syncStatus']),
      createdAt: DateTime.parse(map['createdAt']),
    );
  }
}

class AssistantMessage {
  final String id;
  final String text;
  final bool isUser;
  final String? citation;

  AssistantMessage({
    required this.id,
    required this.text,
    required this.isUser,
    this.citation,
  });
}
