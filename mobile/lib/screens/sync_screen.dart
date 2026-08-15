import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';
import '../services/sync_service.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';

class SyncScreen extends ConsumerWidget {
  const SyncScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingReportsProvider);
    final isOnline = ref.watch(syncServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sync Queue'),
        actions: [
          Row(
            children: [
              Text(isOnline ? 'Online' : 'Offline', style: const TextStyle(fontSize: 12)),
              Switch(
                value: isOnline,
                activeColor: Colors.white,
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
            return const Center(
              child: Text('All reports synced!', style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: reports.length,
                  itemBuilder: (context, index) {
                    final report = reports[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _getRiskColor(report.riskTier),
                        radius: 8,
                      ),
                      title: Text('${report.age}y ${report.sex} • ${report.village}'),
                      subtitle: Text('Symptoms: ${report.symptoms.join(", ")}'),
                      trailing: _getStatusIcon(report.syncStatus),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.sync),
                  label: const Text('Sync Now'),
                  onPressed: () async {
                    await ref.read(syncServiceProvider.notifier).syncReports();
                    ref.invalidate(pendingReportsProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(isOnline ? 'Sync Complete' : 'Sync Failed: Offline')),
                      );
                    }
                  },
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

  Widget _getStatusIcon(SyncStatus status) {
    switch (status) {
      case SyncStatus.syncing:
        return const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2));
      case SyncStatus.syncFailed:
        return const Icon(Icons.error, color: AppColors.riskRed);
      default:
        return const Icon(Icons.cloud_upload_outlined, color: AppColors.textSecondary);
    }
  }
}
