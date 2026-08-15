import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/report_draft_provider.dart';
import '../../theme/app_colors.dart';

class SymptomsScreen extends ConsumerWidget {
  const SymptomsScreen({super.key});

  final List<String> availableSymptoms = const [
    'Fever',
    'Vomiting',
    'Diarrhea',
    'Dehydration',
    'Lethargy',
    'Cough',
    'Headache'
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(reportDraftProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Select Symptoms')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 2.5,
                ),
                itemCount: availableSymptoms.length,
                itemBuilder: (context, index) {
                  final symptom = availableSymptoms[index];
                  final isSelected = draft.symptoms.contains(symptom);

                  return InkWell(
                    onTap: () {
                      ref.read(reportDraftProvider.notifier).toggleSymptom(symptom);
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primaryLight.withOpacity(0.2) : AppColors.surface,
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.border,
                          width: isSelected ? 2 : 1,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        symptom,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            ElevatedButton(
              onPressed: () {
                context.go('/report/duration');
              },
              child: const Text('Next: Duration'),
            ),
          ],
        ),
      ),
    );
  }
}
