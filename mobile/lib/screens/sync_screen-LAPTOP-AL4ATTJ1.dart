import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';
import '../services/sync_service.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../widgets/animated_scale_button.dart' as import_scale_btn;

class SyncScreen extends ConsumerWidget {
  const SyncScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingReportsProvider);
    final isOnline = ref.watch(syncServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sync Queue', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isOnline ? AppColors.riskGreen.withOpacity(0.1) : AppColors.textDisabled.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isOnline ? AppColors.riskGreen : AppColors.textDisabled,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isOnline ? 'Online' : 'Offline', 
                      style: TextStyle(
                        fontSize: 12, 
                        fontWeight: FontWeight.bold,
                        color: isOnline ? AppColors.riskGreen : AppColors.textSecondary,
                      )
                    ),
                  ],
                ),
              ),
              Switch(
                value: isOnline,
                activeColor: AppColors.primary,
                activeTrackColor: AppColors.primaryLight.withOpacity(0.5),
                onChanged: (val) {
                  ref.read(syncServiceProvider.notifier).toggleOnline();
                },
              ),
            ],
          ),
        ],
      ),
      body: pendingAsync.when(
        data: (reports) {
          if (reports.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.cloud_done_outlined, size: 64, color: AppColors.riskGreen.withOpacity(0.5)),
                  const SizedBox(height: 16),
                  const Text('All reports synced!', style: TextStyle(color: AppColors.textSecondary, fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  itemCount: reports.length,
                  itemBuilder: (context, index) {
                    final report = reports[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(color: AppColors.border.withOpacity(0.5)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _getRiskColor(report.riskTier),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${report.age}y ${report.sex} • ${report.village}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${report.symptoms.take(3).join(", ")}${report.symptoms.length > 3 ? "..." : ""}',
                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            _getStatusBadge(report.syncStatus),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              Container(
                padding: const EdgeInsets.all(24.0),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.05),
                      offset: const Offset(0, -8),
                      blurRadius: 24,
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: import_scale_btn.AnimatedScaleButton(
                    onPressed: () async {
                      await ref.read(syncServiceProvider.notifier).syncReports();
                      ref.invalidate(pendingReportsProvider);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(isOnline ? 'Sync Complete' : 'Sync Failed: Offline'),
                            backgroundColor: isOnline ? AppColors.riskGreen : AppColors.riskRed,
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
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.sync, color: Colors.white),
                          const SizedBox(width: 8),
                          const Text('Sync Now', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                ),
              )
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Color _getRiskColor(RiskTier tier) {
    switch (tier) {
      case RiskTier.green: return AppColors.riskGreen;
      case RiskTier.amber: return AppColors.riskAmber;
      case RiskTier.red: return AppColors.riskRed;
    }
  }

  Widget _getStatusBadge(SyncStatus status) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case SyncStatus.syncing:
        bgColor = AppColors.pillLow.withOpacity(0.2);
        textColor = AppColors.pillLow;
        label = 'Syncing';
        break;
      case SyncStatus.syncFailed:
        bgColor = AppColors.riskRed.withOpacity(0.2);
        textColor = AppColors.riskRed;
        label = 'Failed';
        break;
      case SyncStatus.synced:
        bgColor = AppColors.riskGreen.withOpacity(0.2);
        textColor = AppColors.riskGreen;
        label = 'Synced';
        break;
      default:
        bgColor = AppColors.pillRem.withOpacity(0.2);
        textColor = AppColors.pillRem;
        label = 'Pending';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
