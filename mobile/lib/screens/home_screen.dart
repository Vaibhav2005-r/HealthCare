import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/providers.dart';
import '../models/models.dart';

import 'package:go_router/go_router.dart';

import '../widgets/animated_scale_button.dart' as import_scale_btn;
import '../widgets/streak_calendar.dart';
import '../widgets/weekly_activity_chart.dart';
import '../widgets/risk_distribution_chart.dart';
import '../theme/app_colors.dart';
import '../widgets/coach_mark.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  void _showSOSDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFFFFFDF8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: Row(
            children: [
              Icon(Icons.emergency, color: Colors.red, size: 32),
              SizedBox(width: 8),
              Text(
                'Emergency SOS',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
            ],
          ),
          content: const Text(
            'This will alert supervisors and nearby medical staff. Are you sure you want to trigger an SOS?',
            style: TextStyle(color: Color(0xFF1D2321), fontSize: 16),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancel',
                style: TextStyle(
                  color: Color(0xFF5B6663),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('SOS Alert Sent!'),
                    backgroundColor: Colors.red,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              child: const Text(
                'Trigger SOS',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final profileAsync = ref.watch(workerProfileProvider);
    final profile = authState.workerProfile ?? profileAsync.valueOrNull ?? {
      'name': 'Sunita Gaikwad',
      'full_name': 'Sunita Gaikwad',
      'role': 'ASHA Lead',
      'district': 'Pune',
    };
    final displayName = profile['full_name'] ?? profile['name'] ?? 'Healthcare Worker';
    final firstName = displayName.toString().split(' ').first;
    final pendingReports = ref.watch(pendingReportsProvider);
    final allReportsAsync = ref.watch(reportsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.health_and_safety, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Arogya Prahari',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications),
            onPressed: () {},
          ),
        ],
      ),
      // Removed FAB to replace with a massive button in the body
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Good Morning,\n$firstName',
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimary,
                            height: 1.2,
                          ),
                    ),
                    Icon(
                      Icons.monitor_heart,
                      size: 64,
                      color: AppColors.primary.withOpacity(0.15),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Status Strip
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Row(
                  children: [
                    _buildStatusChip(
                      icon: Icons.cloud_upload,
                      label: pendingReports.maybeWhen(
                        data: (r) =>
                            '${r.where((rep) => rep.syncStatus != SyncStatus.synced).length} Pending',
                        orElse: () => 'Syncing...',
                      ),
                      color: AppColors.riskAmber,
                    ),
                    const SizedBox(width: 8),
                    _buildStatusChip(
                      icon: Icons.location_on,
                      label: 'GPS Active',
                      color: AppColors.riskGreen,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // New Report CTA
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: import_scale_btn.AnimatedScaleButton(
                  onPressed: () {
                    context.push('/report');
                  },
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.assignment,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                        const SizedBox(width: 16),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'New Report',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 22,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Start a new patient triage',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              const SizedBox(height: 24),

              // Big SOS Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: import_scale_btn.AnimatedScaleButton(
                  onPressed: () => _showSOSDialog(context),
                  child: CoachMark(
                    id: 'home_sos_banner',
                    title: 'Emergency SOS',
                    message: 'Use this button to immediately alert supervisors in an emergency.',
                    icon: Icons.emergency,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: 20,
                        horizontal: 24,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red.shade600,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withOpacity(0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.emergency,
                            color: Colors.white,
                            size: 36,
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'EMERGENCY SOS',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 22,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              allReportsAsync.when(
                data: (reports) {
                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24.0,
                          vertical: 8,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.assignment,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Pending Risk Assessment',
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      RiskDistributionChart(reports: reports),
                    ],
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(child: Text('Error: $err')),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
