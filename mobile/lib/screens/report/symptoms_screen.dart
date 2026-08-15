import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/report_draft_provider.dart';
import '../../theme/app_colors.dart';

class SymptomsScreen extends ConsumerWidget {
  const SymptomsScreen({super.key});

  final List<Map<String, dynamic>> availableSymptoms = const [
    {'name': 'Fever', 'icon': Icons.thermostat},
    {'name': 'Vomiting', 'icon': Icons.sick_outlined},
    {'name': 'Diarrhea', 'icon': Icons.water_drop_outlined},
    {'name': 'Dehydration', 'icon': Icons.opacity},
    {'name': 'Lethargy', 'icon': Icons.airline_seat_flat},
    {'name': 'Cough', 'icon': Icons.masks_outlined},
    {'name': 'Headache', 'icon': Icons.sentiment_dissatisfied},
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(reportDraftProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Symptoms', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.1,
                ),
                itemCount: availableSymptoms.length,
                itemBuilder: (context, index) {
                  final symptom = availableSymptoms[index];
                  final isSelected = draft.symptoms.contains(symptom['name']);

                  return InkWell(
                    onTap: () {
                      ref.read(reportDraftProvider.notifier).toggleSymptom(symptom['name']);
                    },
                    borderRadius: BorderRadius.circular(24),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : AppColors.surface,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          if (!isSelected)
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                        ],
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isSelected ? Colors.white.withOpacity(0.2) : AppColors.background,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              symptom['icon'],
                              color: isSelected ? Colors.white : AppColors.primary,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            symptom['name'],
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                context.go('/report/duration');
              },
              child: const Text('Next: Duration', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
