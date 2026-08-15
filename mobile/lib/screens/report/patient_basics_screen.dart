import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';
import '../../providers/report_draft_provider.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;

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
    
    // Metrics
    final reportsAsync = ref.watch(pendingReportsProvider);
    final int pendingCount = reportsAsync.maybeWhen(
      data: (reports) => reports.where((r) => r.syncStatus != SyncStatus.synced).length,
      orElse: () => 0,
    );
    final int todayCount = reportsAsync.maybeWhen(
      data: (reports) => reports.where((r) => r.createdAt.day == DateTime.now().day).length,
      orElse: () => 0,
    );

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Greeting Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.primary.withOpacity(0.2), width: 2),
                        ),
                        child: const CircleAvatar(
                          radius: 26,
                          backgroundColor: AppColors.primaryLight,
                          child: Icon(Icons.person, color: Colors.white, size: 28),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Hello, Medic 👋',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.5,
                            ),
                          ),
                          Text(
                            'Ready for today\'s rounds?',
                            style: TextStyle(
                              fontSize: 15,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Summary Cards Row
              Row(
                children: [
                  // Sync Health Card
                  Expanded(
                    child: Card(
                      margin: EdgeInsets.zero,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: pendingCount == 0 ? AppColors.riskGreen.withOpacity(0.1) : AppColors.riskAmber.withOpacity(0.1),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: pendingCount == 0 ? AppColors.riskGreen.withOpacity(0.3) : AppColors.riskAmber.withOpacity(0.3),
                                  width: 4,
                                ),
                              ),
                              child: Icon(
                                pendingCount == 0 ? Icons.cloud_done : Icons.cloud_sync,
                                color: pendingCount == 0 ? AppColors.riskGreen : AppColors.riskAmber,
                                size: 28,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              pendingCount == 0 ? 'OK' : '$pendingCount',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const Text(
                              'Sync Health',
                              style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Today's Reports Card
                  Expanded(
                    child: Card(
                      margin: EdgeInsets.zero,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.primary.withOpacity(0.2),
                                  width: 4,
                                ),
                              ),
                              child: const Icon(
                                Icons.assignment_turned_in,
                                color: AppColors.primary,
                                size: 28,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              '$todayCount',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const Text(
                              'Today\'s Reports',
                              style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // "New Report Basics" Section
              const Text(
                'New Report Basics',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 16),

              Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Progress Bar
                      Row(
                        children: List.generate(4, (index) {
                          return Expanded(
                            child: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              height: 6,
                              decoration: BoxDecoration(
                                color: index == 0 ? AppColors.primary : AppColors.border,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                          );
                        }),
                      ),
                      const SizedBox(height: 32),

                      TextField(
                        controller: _ageController,
                        decoration: const InputDecoration(
                          labelText: 'Age (Years)',
                          prefixIcon: Icon(Icons.cake_outlined, color: AppColors.primary),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 20),
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
                      const SizedBox(height: 20),
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
                      const SizedBox(height: 32),
                      import_scale_btn.AnimatedScaleButton(
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
                        child: Container(
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.2),
                                blurRadius: 16,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Text('Continue to Symptoms', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
