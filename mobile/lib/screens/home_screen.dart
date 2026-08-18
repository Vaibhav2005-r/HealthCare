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

  void _showNotificationsSheet(BuildContext context, LanguageNotifier lang) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.72,
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Color(0xFFFFFDF8),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.notifications_active, color: AppColors.primary, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Outbreak Alerts & Advisories\nआरोग्य सूचना आणि इशारे',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF1D2321)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: Colors.black12),
              const SizedBox(height: 8),
              Expanded(
                child: ListView(
                  children: [
                    // 1. High Risk Outbreak Alert
                    _buildAlertCard(
                      icon: Icons.warning_amber_rounded,
                      iconColor: Colors.red,
                      title: 'Pune District Alert: Dengue Surge',
                      subtitle: '84 active cases detected across Khed, Manchar, Junnar clusters. Vector control teams deployed.',
                      time: '12 min ago (Live)',
                      severity: 'CRITICAL',
                    ),
                    const SizedBox(height: 12),
                    // 2. Weather Advisory
                    _buildAlertCard(
                      icon: Icons.thunderstorm_outlined,
                      iconColor: Colors.orange.shade800,
                      title: 'IMD Rain Advisory: Stagnant Water Risk',
                      subtitle: 'Heavy rainfall (>45mm) recorded in Pune & Nashik. Intensify anti-larval door-to-door checks.',
                      time: '1 hour ago',
                      severity: 'HIGH RISK',
                    ),
                    const SizedBox(height: 12),
                    // 3. Clinical Guidelines Advisory
                    _buildAlertCard(
                      icon: Icons.health_and_safety_outlined,
                      iconColor: AppColors.primary,
                      title: 'ASHA Clinical Directive',
                      subtitle: 'Distribute ORS and Zinc packets for any acute gastroenteritis cases within 2 hours of symptom onset.',
                      time: 'Today',
                      severity: 'PROTOCOL',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close / बंद करा', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAlertCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String time,
    required String severity,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: iconColor.withValues(alpha: 0.25), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: iconColor),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  severity,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: iconColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(subtitle, style: const TextStyle(fontSize: 13, color: Color(0xFF4A5568), height: 1.4)),
          const SizedBox(height: 6),
          Text(time, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
        ],
      ),
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
            icon: const Icon(Icons.notifications_active_outlined),
            tooltip: 'Alerts & Advisories',
            onPressed: () => _showNotificationsSheet(context, lang),
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
