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
        title: const Text('Step 5 of 5: Review Report', style: TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
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
                children: List.generate(5, (index) {
                  return Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 4,
                      decoration: BoxDecoration(
                        color: index <= 4 ? accentColor : Colors.grey.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),

              Card(
                margin: EdgeInsets.zero,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                color: surfaceColor,
                elevation: 0,
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: accentColor.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.person_outline, color: accentColor),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${draft.age ?? '-'} yrs, ${draft.sex ?? '-'}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1D2321)),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Village: ${draft.village ?? '-'}',
                                  style: const TextStyle(color: Color(0xFF5B6663), fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24.0),
                        child: Divider(color: Colors.black12),
                      ),
                      const Text('Symptoms', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: draft.symptoms.map((s) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: accentColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: accentColor.withOpacity(0.3)),
                          ),
                          child: Text(
                            s,
                            style: const TextStyle(
                              color: accentColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        )).toList(),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24.0),
                        child: Divider(color: Colors.black12),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Duration', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321), fontSize: 16)),
                          Text(
                            '${draft.durationDays ?? '-'} day${(draft.durationDays ?? 1) == 1 ? '' : 's'}',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: accentColor, fontSize: 16),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              import_scale_btn.AnimatedScaleButton(
                onPressed: () async {
                  final triage = ref.read(triageProvider);
                  final riskTier = triage.classify(draft.symptoms, draft.durationDays ?? 1);

                  final report = Report(
                    id: const Uuid().v4(),
                    age: draft.age ?? 0,
                    sex: draft.sex ?? 'Unknown',
                    village: draft.village ?? 'Unknown',
                    symptoms: draft.symptoms,
                    durationDays: draft.durationDays ?? 1,
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
