import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../models/models.dart';
import '../providers/providers.dart';
import '../providers/report_draft_provider.dart';
import '../theme/app_colors.dart';

class TriageResultScreen extends ConsumerStatefulWidget {
  const TriageResultScreen({super.key});

  @override
  ConsumerState<TriageResultScreen> createState() => _TriageResultScreenState();
}

class _TriageResultScreenState extends ConsumerState<TriageResultScreen> {
  bool _isAnalyzing = true;

  @override
  void initState() {
    super.initState();
    // Simulate reading in progress
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isAnalyzing = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // The report was passed as extra to the router.
    final report = GoRouterState.of(context).extra as Report?;

    if (report == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error', style: TextStyle(fontWeight: FontWeight.bold))),
        body: const Center(child: Text('No report data found')),
      );
    }

    if (_isAnalyzing) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Analyzing Report',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: 200,
                height: 200,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                      strokeWidth: 8,
                      backgroundColor: AppColors.border,
                    ),
                    Center(
                      child: Icon(Icons.favorite, size: 80, color: AppColors.primary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              Text(
                'Just a moment...',
                style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    final Color bgColor = _getRiskColor(report.riskTier);
    final String title = _getRiskTitle(report.riskTier);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.warning_amber_rounded, size: 80, color: Colors.white),
              ),
              const SizedBox(height: 32),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 32),
              Card(
                color: AppColors.surface,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Detected Indicators', 
                        style: TextStyle(
                          fontSize: 18, 
                          fontWeight: FontWeight.bold, 
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: report.symptoms.map((s) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            s,
                            style: TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w600),
                          ),
                        )).toList(),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.timer_outlined, color: AppColors.textSecondary, size: 20),
                            const SizedBox(width: 12),
                            Text(
                              'Duration: ${report.durationDays} days',
                              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.surface,
                  foregroundColor: AppColors.textPrimary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0,
                ),
                icon: Icon(Icons.auto_awesome, color: AppColors.primary),
                label: const Text('View Clinical Guidance', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                onPressed: () {
                  context.go('/assistant');
                },
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white, width: 2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0,
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
                child: const Text('Save Report', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
