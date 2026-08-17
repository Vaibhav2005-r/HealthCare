import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../providers/report_draft_provider.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;

class ReviewScreen extends ConsumerWidget {
  const ReviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(reportDraftProvider);

    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Step 6 of 6: Review Report', style: TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
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
                              const Text('Patient Info', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text('Name: ${draft.patientName ?? '-'}', style: const TextStyle(fontSize: 15)),
                          Text('Age: ${draft.age ?? '-'} yrs, Sex: ${draft.sex ?? '-'}', style: const TextStyle(fontSize: 15)),
                          if (draft.contactNumber != null) Text('Contact: ${draft.contactNumber}', style: const TextStyle(fontSize: 15)),
                          
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16.0),
                            child: Divider(color: Colors.black12),
                          ),
                          
                          // 2. Location
                          Row(
                            children: [
                              Icon(Icons.location_on, color: accentColor, size: 20),
                              const SizedBox(width: 8),
                              const Text('Location', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text('Village / PHC: ${draft.village ?? '-'}', style: const TextStyle(fontSize: 15)),
                          
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16.0),
                            child: Divider(color: Colors.black12),
                          ),

                          // 3. Medical Background
                          Row(
                            children: [
                              Icon(Icons.assignment, color: accentColor, size: 20),
                              const SizedBox(width: 8),
                              const Text('Medical Background', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (draft.temperature != null) Text('Temperature: ${draft.temperature}°${draft.temperatureUnit}', style: const TextStyle(fontSize: 15)),
                          if (draft.comorbidities.isNotEmpty) Text('Conditions: ${draft.comorbidities.join(', ')}', style: const TextStyle(fontSize: 15)),
                          if (draft.medicationTaken != null) Text('Medication: ${draft.medicationTaken}', style: const TextStyle(fontSize: 15)),
                          if (draft.temperature == null && draft.comorbidities.isEmpty && draft.medicationTaken == null)
                            const Text('No additional medical background provided', style: TextStyle(fontSize: 15, color: Colors.grey)),

                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16.0),
                            child: Divider(color: Colors.black12),
                          ),

                          // 4. Symptoms
                          Row(
                            children: [
                              Icon(Icons.medical_services, color: accentColor, size: 20),
                              const SizedBox(width: 8),
                              const Text('Symptoms', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: draft.symptoms.map((s) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: accentColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(s, style: const TextStyle(color: accentColor, fontWeight: FontWeight.bold, fontSize: 13)),
                            )).toList(),
                          ),
                          const SizedBox(height: 12),
                          Text('Duration: ${draft.durationDays ?? '-'} day${(draft.durationDays ?? 1) == 1 ? '' : 's'}', style: const TextStyle(fontSize: 15)),
                          
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16.0),
                            child: Divider(color: Colors.black12),
                          ),
                          
                          // 5. Photo
                          Row(
                            children: [
                              Icon(Icons.camera_alt, color: accentColor, size: 20),
                              const SizedBox(width: 8),
                              const Text('Clinical Image', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(draft.imagePath != null ? 'Image captured and attached' : 'No image attached', style: const TextStyle(fontSize: 15)),
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
                  child: const Center(
                    child: Text('Submit & Triage', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
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
