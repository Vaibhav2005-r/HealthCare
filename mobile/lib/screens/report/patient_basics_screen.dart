import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';
import '../../providers/report_draft_provider.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';

class PatientBasicsScreen extends ConsumerStatefulWidget {
  const PatientBasicsScreen({super.key});

  @override
  ConsumerState<PatientBasicsScreen> createState() => _PatientBasicsScreenState();
}

class _PatientBasicsScreenState extends ConsumerState<PatientBasicsScreen> {
  final _ageController = TextEditingController();
  String _sex = 'Male';
  String? _village;

  @override
  Widget build(BuildContext context) {
    final mockData = ref.watch(mockDataProvider);
    final villages = mockData.getVillages();
    
    // Using pending async to drive a "metric"
    final pendingAsync = ref.watch(pendingReportsProvider);
    final int pendingCount = pendingAsync.maybeWhen(
      data: (reports) => reports.where((r) => r.syncStatus != SyncStatus.synced).length,
      orElse: () => 0,
    );

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Greeting Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 24,
                        backgroundColor: AppColors.primaryLight,
                        child: Icon(Icons.person, color: Colors.white),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Hey, Medic 👋',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            'Ready for today\'s rounds?',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.more_horiz),
                    onPressed: () {},
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Score-style summary card
              const Text(
                'System Status',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Sync Health',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              pendingCount == 0 
                                ? 'All data is synced and up to date.'
                                : 'You have $pendingCount pending reports to sync.',
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: pendingCount == 0 ? AppColors.riskGreen.withOpacity(0.1) : AppColors.riskAmber.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          pendingCount == 0 ? 'OK' : '$pendingCount',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: pendingCount == 0 ? AppColors.riskGreen : AppColors.riskAmber,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // "Smart Health Metrics" / Form Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'New Report Basics',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: () {},
                    child: const Text('See All', style: TextStyle(color: AppColors.textSecondary)),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextField(
                        controller: _ageController,
                        decoration: const InputDecoration(
                          labelText: 'Age (Years)',
                          prefixIcon: Icon(Icons.cake_outlined, color: AppColors.primary),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _sex,
                        decoration: const InputDecoration(
                          labelText: 'Sex',
                          prefixIcon: Icon(Icons.people_outline, color: AppColors.primary),
                        ),
                        items: ['Male', 'Female', 'Other']
                            .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                            .toList(),
                        onChanged: (val) {
                          setState(() => _sex = val!);
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _village,
                        decoration: const InputDecoration(
                          labelText: 'Village / PHC',
                          prefixIcon: Icon(Icons.location_on_outlined, color: AppColors.primary),
                        ),
                        items: villages
                            .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                            .toList(),
                        onChanged: (val) {
                          setState(() => _village = val);
                        },
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          final age = int.tryParse(_ageController.text);
                          if (age != null && _village != null) {
                            ref.read(reportDraftProvider.notifier).updateBasics(
                              age: age,
                              sex: _sex,
                              village: _village!,
                            );
                            context.go('/report/symptoms');
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text('Please fill all fields'),
                                backgroundColor: AppColors.primary,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            );
                          }
                        },
                        child: const Text('Continue to Symptoms', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
