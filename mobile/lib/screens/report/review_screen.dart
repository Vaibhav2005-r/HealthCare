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
      appBar: AppBar(title: const Text('Review Report')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Patient: ${draft.age ?? '-'} yrs, ${draft.sex ?? '-'}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 4),
                    Text('Village: ${draft.village ?? '-'}', style: const TextStyle(color: AppColors.textSecondary)),
                    const Divider(height: 24),
                    const Text('Symptoms:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: draft.symptoms.map((s) => Chip(label: Text(s))).toList(),
                    ),
                    const Divider(height: 24),
                    Text('Duration: ${draft.durationDays ?? '-'} day(s)', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            const Spacer(),
            ElevatedButton(
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
              child: const Text('Submit & Triage'),
            ),
          ],
        ),
      ),
    );
  }
}
