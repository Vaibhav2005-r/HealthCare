import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/providers.dart';
import '../providers/language_provider.dart';
import '../models/models.dart';
import '../services/api_service.dart';

import 'package:go_router/go_router.dart';

import '../widgets/animated_scale_button.dart' as import_scale_btn;
import '../widgets/risk_distribution_chart.dart';
import '../theme/app_colors.dart';
import '../widgets/coach_mark.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  void _showSOSDialog(BuildContext context, WidgetRef ref) {
    final lang = ref.read(languageProvider.notifier);
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
              const Icon(Icons.emergency, color: Colors.red, size: 32),
              const SizedBox(width: 8),
              Text(
                lang.translate('sos_banner_title'),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
            ],
          ),
          content: Text(
            lang.translate('sos_banner_desc'),
            style: const TextStyle(color: Color(0xFF1D2321), fontSize: 16),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                lang.translate('back_btn'),
                style: const TextStyle(
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
              onPressed: () async {
                Navigator.pop(context);
                final authState = ref.read(authProvider);
                final workerId = authState.workerProfile?['worker_id'] ?? 'ASHA-4029';
                final district = authState.workerProfile?['district'] ?? 'Pune';
                
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(lang.translate('trigger_sos')),
                    backgroundColor: Colors.red,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
                
                await ApiService().triggerSOS(
                  workerId: workerId,
                  district: district,
                  cases: 5,
                  severity: 'CRITICAL',
                );
              },
              child: Text(
                lang.translate('trigger_sos'),
                style: const TextStyle(
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
    final lang = ref.read(languageProvider.notifier);
    final profileAsync = ref.watch(workerProfileProvider);
    final profile = authState.workerProfile ?? profileAsync.valueOrNull ?? const <String, dynamic>{};
    final String rawName = (profile['full_name'] ?? profile['name'] ?? 'Healthcare Worker').toString();
    final String firstName = rawName.trim().isNotEmpty ? rawName.trim().split(' ').first : 'Worker';
    final pendingReports = ref.watch(pendingReportsProvider);
    final allReportsAsync = ref.watch(reportsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.health_and_safety, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              lang.translate('app_title'),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {},
          ),
        ],
      ),
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
                      '${lang.translate("greeting_morning")}\n$firstName',
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
                      color: AppColors.primary.withValues(alpha: 0.15),
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
                            '${r.where((rep) => rep.syncStatus != SyncStatus.synced).length} ${lang.translate("pending_sync")}',
                        orElse: () => 'Syncing...',
                      ),
                      color: AppColors.riskAmber,
                    ),
                    const SizedBox(width: 8),
                    _buildStatusChip(
                      icon: Icons.location_on,
                      label: lang.translate('gps_active'),
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
                          color: AppColors.primary.withValues(alpha: 0.3),
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
                            color: Colors.white.withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.assignment,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                lang.translate('start_screening_title'),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                lang.translate('start_screening_desc'),
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 13,
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

              // Big SOS Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: import_scale_btn.AnimatedScaleButton(
                  onPressed: () => _showSOSDialog(context, ref),
                  child: CoachMark(
                    id: 'home_sos_banner',
                    title: lang.translate('sos_banner_title'),
                    message: lang.translate('sos_banner_desc'),
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
                            color: Colors.red.withValues(alpha: 0.3),
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
                              color: Colors.white.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.emergency,
                              color: Colors.white,
                              size: 32,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  lang.translate('sos_banner_title'),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  lang.translate('sos_banner_desc'),
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 13,
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
        color: color.withValues(alpha: 0.1),
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
