import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';
import '../services/sync_service.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../widgets/animated_scale_button.dart' as import_scale_btn;

class LogHistoryScreen extends ConsumerWidget {
  const LogHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingReportsProvider);
    final isOnline = ref.watch(syncServiceProvider);

    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Log History', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321))),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isOnline ? Colors.green.withOpacity(0.1) : Colors.grey.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isOnline ? Colors.green : Colors.grey,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isOnline ? 'Online' : 'Offline', 
                      style: TextStyle(
                        fontSize: 12, 
                        fontWeight: FontWeight.bold,
                        color: isOnline ? Colors.green : Colors.grey.shade700,
                      )
                    ),
                  ],
                ),
              ),
              Switch(
                value: isOnline,
                activeColor: accentColor,
                activeTrackColor: accentColor.withOpacity(0.5),
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
          final pendingReports = reports.where((r) => r.syncStatus != SyncStatus.synced).toList();
          final syncedReports = reports.where((r) => r.syncStatus == SyncStatus.synced).toList();

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  children: [
                    if (pendingReports.isNotEmpty) ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                        child: Text('Pending Sync', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF5B6663))),
                      ),
                      ...pendingReports.map((report) => _buildReportCard(report, accentColor, surfaceColor)),
                    ],
                    if (syncedReports.isNotEmpty) ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                        child: Text('Synced', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF5B6663))),
                      ),
                      ...syncedReports.map((report) => _buildReportCard(report, accentColor, surfaceColor)),
                    ],
                    if (reports.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(48.0),
                          child: Column(
                            children: [
                              Icon(Icons.inbox_outlined, size: 64, color: Colors.grey.withOpacity(0.5)),
                              const SizedBox(height: 16),
                              const Text('No logs found', style: TextStyle(color: Colors.grey, fontSize: 18, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (pendingReports.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(24.0),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
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
                              backgroundColor: isOnline ? Colors.green : Colors.red,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      },
                      child: Container(
                        height: 56,
                        decoration: BoxDecoration(
                          color: accentColor,
                          borderRadius: BorderRadius.circular(16),
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

  Widget _buildReportCard(Report report, Color accentColor, Color surfaceColor) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      elevation: 0,
      color: surfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
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
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1D2321)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${report.symptoms.take(3).join(", ")}${report.symptoms.length > 3 ? "..." : ""}',
                    style: const TextStyle(color: Color(0xFF5B6663), fontSize: 14),
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
  }

  Color _getRiskColor(RiskTier tier) {
    switch (tier) {
      case RiskTier.green: return Colors.green;
      case RiskTier.amber: return Colors.orange;
      case RiskTier.red: return Colors.red;
    }
  }

  Widget _getStatusBadge(SyncStatus status) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case SyncStatus.syncing:
        bgColor = Colors.blue.withOpacity(0.2);
        textColor = Colors.blue;
        label = 'Syncing';
        break;
      case SyncStatus.syncFailed:
        bgColor = Colors.red.withOpacity(0.2);
        textColor = Colors.red;
        label = 'Failed';
        break;
      case SyncStatus.synced:
        bgColor = Colors.green.withOpacity(0.2);
        textColor = Colors.green;
        label = 'Synced';
        break;
      default:
        bgColor = Colors.orange.withOpacity(0.2);
        textColor = Colors.orange;
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
