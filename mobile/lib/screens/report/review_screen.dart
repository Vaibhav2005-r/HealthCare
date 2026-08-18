import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../providers/report_draft_provider.dart';
import '../../providers/providers.dart';
import '../../providers/language_provider.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;

class ReviewScreen extends ConsumerWidget {
  const ReviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(reportDraftProvider);
    final lang = ref.watch(languageProvider.notifier);
    ref.watch(languageProvider);

    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: Text(lang.translate('step_6_title'), style: const TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Progress Bar
              Row(
                children: List.generate(6, (index) {
                  return Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 4,
                      decoration: BoxDecoration(
                        color: index <= 5 ? accentColor : Colors.grey.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),

              Expanded(
                child: SingleChildScrollView(
                  child: Card(
                    margin: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    color: surfaceColor,
                    elevation: 0,
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Patient Info
                          Row(
                            children: [
                              Icon(Icons.badge, color: accentColor, size: 20),
                              const SizedBox(width: 8),
                              Text(lang.translate('patient_name'), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text('${lang.translate("patient_name")}: ${draft.patientName ?? '-'}', style: const TextStyle(fontSize: 15)),
                          Text('${lang.translate("age")}: ${draft.age ?? '-'}, ${lang.translate("gender")}: ${draft.sex ?? '-'}', style: const TextStyle(fontSize: 15)),
                          if (draft.contactNumber != null) Text('${lang.translate("contact_number")}: ${draft.contactNumber}', style: const TextStyle(fontSize: 15)),
                          
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16.0),
                            child: Divider(color: Colors.black12),
                          ),
                          
                          // 2. Symptoms
                          Row(
                            children: [
                              Icon(Icons.sick, color: accentColor, size: 20),
                              const SizedBox(width: 8),
                              Text(lang.translate('step_2_title'), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: draft.symptoms.map((s) => Chip(
                              label: Text(s, style: const TextStyle(color: Colors.white, fontSize: 12)),
                              backgroundColor: accentColor,
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                            )).toList(),
                          ),
                          
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16.0),
                            child: Divider(color: Colors.black12),
                          ),

                          // 3. Duration & Vitals
                          Row(
                            children: [
                              Icon(Icons.schedule, color: accentColor, size: 20),
                              const SizedBox(width: 8),
                              Text(lang.translate('duration_days'), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text('${lang.translate("duration_days")}: ${draft.durationDays ?? 1} Days / दिवस', style: const TextStyle(fontSize: 15)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              import_scale_btn.AnimatedScaleButton(
                onPressed: () async {
                  final triage = ref.read(triageProvider);
                  final riskTier = triage.classify(
                    draft.symptoms, 
                    draft.durationDays ?? 1,
                    temperature: draft.temperature,
                    tempUnit: draft.temperatureUnit,
                    comorbidities: draft.comorbidities,
                  );

                  final report = Report(
                    id: const Uuid().v4(),
                    patientName: draft.patientName ?? 'Unknown',
                    age: draft.age ?? 0,
                    sex: draft.sex ?? 'Unknown',
                    contactNumber: draft.contactNumber,
                    village: draft.village ?? 'Unknown',
                    symptoms: draft.symptoms,
                    durationDays: draft.durationDays ?? 1,
                    temperature: draft.temperature,
                    temperatureUnit: draft.temperatureUnit,
                    comorbidities: draft.comorbidities,
                    medicationTaken: draft.medicationTaken,
                    riskTier: riskTier,
                    syncStatus: SyncStatus.draft,
                    createdAt: DateTime.now(),
                    locationLat: draft.locationLat,
                    locationLng: draft.locationLng,
                    locationAccuracy: draft.locationAccuracy,
                    manualLocationReason: draft.manualLocationReason,
                    imagePath: draft.imagePath,
                  );

                  // Pass the report to the triage result screen
                  context.go('/triage-result', extra: report);
                },
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(lang.translate('submit_triage_btn'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
