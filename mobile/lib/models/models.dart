import 'dart:convert';

enum SyncStatus { draft, triaged, savedLocally, queued, syncing, synced, syncFailed }
enum RiskTier { green, amber, red }

class Report {
  final String id;
  final String patientName;
  final int age;
  final String sex;
  final String? contactNumber;
  final String village;
  final List<String> symptoms;
  final int durationDays;
  final double? temperature;
  final String? temperatureUnit;
  final List<String> comorbidities;
  final String? medicationTaken;
  final RiskTier riskTier;
  final SyncStatus syncStatus;
  final DateTime createdAt;

  final double? locationLat;
  final double? locationLng;
  final double? locationAccuracy;
  final String? manualLocationReason;
  final String? imagePath;

  Report({
    required this.id,
    required this.patientName,
    required this.age,
    required this.sex,
    this.contactNumber,
    required this.village,
    required this.symptoms,
    required this.durationDays,
    this.temperature,
    this.temperatureUnit,
    required this.comorbidities,
    this.medicationTaken,
    required this.riskTier,
    required this.syncStatus,
    required this.createdAt,
    this.locationLat,
    this.locationLng,
    this.locationAccuracy,
    this.manualLocationReason,
    this.imagePath,
  });

  Report copyWith({
    String? id,
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
    RiskTier? riskTier,
    SyncStatus? syncStatus,
    DateTime? createdAt,
    double? locationLat,
    double? locationLng,
    double? locationAccuracy,
    String? manualLocationReason,
    String? imagePath,
  }) {
    return Report(
      id: id ?? this.id,
      patientName: patientName ?? this.patientName,
      age: age ?? this.age,
      sex: sex ?? this.sex,
      contactNumber: contactNumber ?? this.contactNumber,
      village: village ?? this.village,
      symptoms: symptoms ?? this.symptoms,
      durationDays: durationDays ?? this.durationDays,
      temperature: temperature ?? this.temperature,
      temperatureUnit: temperatureUnit ?? this.temperatureUnit,
      comorbidities: comorbidities ?? this.comorbidities,
      medicationTaken: medicationTaken ?? this.medicationTaken,
      riskTier: riskTier ?? this.riskTier,
      syncStatus: syncStatus ?? this.syncStatus,
      createdAt: createdAt ?? this.createdAt,
      locationLat: locationLat ?? this.locationLat,
      locationLng: locationLng ?? this.locationLng,
      locationAccuracy: locationAccuracy ?? this.locationAccuracy,
      manualLocationReason: manualLocationReason ?? this.manualLocationReason,
      imagePath: imagePath ?? this.imagePath,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'patientName': patientName,
      'age': age,
      'sex': sex,
      'contactNumber': contactNumber,
      'village': village,
      'symptoms': jsonEncode(symptoms),
      'durationDays': durationDays,
      'temperature': temperature,
      'temperatureUnit': temperatureUnit,
      'comorbidities': jsonEncode(comorbidities),
      'medicationTaken': medicationTaken,
      'riskTier': riskTier.name,
      'syncStatus': syncStatus.name,
      'createdAt': createdAt.toIso8601String(),
      'locationLat': locationLat,
      'locationLng': locationLng,
      'locationAccuracy': locationAccuracy,
      'manualLocationReason': manualLocationReason,
      'imagePath': imagePath,
    };
  }

  factory Report.fromMap(Map<String, dynamic> map) {
    return Report(
      id: map['id'],
      patientName: map['patientName'] ?? 'Unknown',
      age: map['age'],
      sex: map['sex'],
      contactNumber: map['contactNumber'],
      village: map['village'],
      symptoms: List<String>.from(jsonDecode(map['symptoms'] ?? '[]')),
      durationDays: map['durationDays'],
      temperature: map['temperature']?.toDouble(),
      temperatureUnit: map['temperatureUnit'],
      comorbidities: map['comorbidities'] != null ? List<String>.from(jsonDecode(map['comorbidities'])) : [],
      medicationTaken: map['medicationTaken'],
      riskTier: RiskTier.values.firstWhere((e) => e.name == map['riskTier'], orElse: () => RiskTier.amber),
      syncStatus: SyncStatus.values.firstWhere((e) => e.name == map['syncStatus'], orElse: () => SyncStatus.draft),
      createdAt: DateTime.parse(map['createdAt']),
      locationLat: map['locationLat']?.toDouble(),
      locationLng: map['locationLng']?.toDouble(),
      locationAccuracy: map['locationAccuracy']?.toDouble(),
      manualLocationReason: map['manualLocationReason'],
      imagePath: map['imagePath'],
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
