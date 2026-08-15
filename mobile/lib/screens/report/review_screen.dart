import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../providers/report_draft_provider.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';

class ReviewScreen extends ConsumerWidget {
  const ReviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(reportDraftProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Report', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                margin: EdgeInsets.zero,
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
                              color: AppColors.primaryLight.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.person_outline, color: AppColors.primary),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${draft.age ?? '-'} yrs, ${draft.sex ?? '-'}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Village: ${draft.village ?? '-'}',
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24.0),
                        child: Divider(color: AppColors.border),
                      ),
                      const Text('Symptoms', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 16)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: draft.symptoms.map((s) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.pillLow.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.pillLow.withOpacity(0.3)),
                          ),
                          child: Text(
                            s,
                            style: const TextStyle(
                              color: AppColors.pillLow,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        )).toList(),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24.0),
                        child: Divider(color: AppColors.border),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Duration', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 16)),
                          Text(
                            '${draft.durationDays ?? '-'} day${(draft.durationDays ?? 1) == 1 ? '' : 's'}',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 16),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(56),
                ),
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
                  );

                  // Pass the report to the triage result screen
                  context.go('/triage-result', extra: report);
                },
                child: const Text('Submit & Triage', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
