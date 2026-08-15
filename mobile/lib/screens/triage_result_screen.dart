import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../providers/providers.dart';
import '../providers/report_draft_provider.dart';
import '../theme/app_colors.dart';

class TriageResultScreen extends ConsumerWidget {
  const TriageResultScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // The report was passed as extra to the router.
    final report = GoRouterState.of(context).extra as Report?;

    if (report == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('No report data found')),
      );
    }

    final Color bgColor = _getRiskColor(report.riskTier);
    final String title = _getRiskTitle(report.riskTier);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              const Icon(Icons.warning_amber_rounded, size: 80, color: Colors.white),
              const SizedBox(height: 24),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 16),
              Card(
                color: Colors.white.withOpacity(0.9),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      const Text('Detected Indicators', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ...report.symptoms.map((s) => Text('• $s')).toList(),
                      const SizedBox(height: 8),
                      Text('• Duration: ${report.durationDays} days'),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: bgColor,
                ),
                icon: const Icon(Icons.auto_awesome),
                label: const Text('View Clinical Guidance'),
                onPressed: () {
                  // Normally this would navigate to assistant with a prefilled query
                  // We'll just go back and then to assistant
                  context.go('/assistant');
                },
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white, width: 2),
                ),
                onPressed: () async {
                  // Save report to local db
                  final db = ref.read(localDbProvider);
                  await db.insertReport(report);
                  
                  // Clear draft
                  ref.read(reportDraftProvider.notifier).clear();
                  
                  // Invalidate lists
                  ref.invalidate(pendingReportsProvider);
                  ref.invalidate(reportsProvider);

                  if (context.mounted) {
                    context.go('/report');
                  }
                },
                child: const Text('Save Report'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Color _getRiskColor(RiskTier tier) {
    switch (tier) {
      case RiskTier.green:
        return AppColors.riskGreen;
      case RiskTier.amber:
        return AppColors.riskAmber;
      case RiskTier.red:
        return AppColors.riskRed;
    }
  }

  String _getRiskTitle(RiskTier tier) {
    switch (tier) {
      case RiskTier.green:
        return 'Low Risk';
      case RiskTier.amber:
        return 'Moderate Risk';
      case RiskTier.red:
        return 'High Risk';
    }
  }
}
