import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../models/models.dart';
import '../providers/providers.dart';
import '../providers/report_draft_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/animated_scale_button.dart' as import_scale_btn;

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
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
          child: CustomScrollView(
            slivers: [
              SliverFillRemaining(
                hasScrollBody: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 8),
                    // Main Risk Card
              Card(
                color: Colors.white.withOpacity(0.15),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(40.0),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          report.riskTier == RiskTier.green ? Icons.check_circle_outline :
                          report.riskTier == RiskTier.amber ? Icons.warning_amber_rounded :
                          Icons.emergency_outlined, 
                          size: 80, 
                          color: Colors.white
                        ),
                      ),
                      const SizedBox(height: 32),
                      Text(
                        title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -1),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Based on reported indicators',
                        style: TextStyle(fontSize: 15, color: Colors.white.withOpacity(0.8), fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
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
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            s,
                            style: TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                        )).toList(),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.timer_outlined, color: AppColors.textSecondary, size: 24),
                            const SizedBox(width: 12),
                            Text(
                              'Duration: ${report.durationDays} days',
                              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              import_scale_btn.AnimatedScaleButton(
                onPressed: () {
                  context.go('/assistant');
                },
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.auto_awesome, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text('View Clinical Guidance', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              import_scale_btn.AnimatedScaleButton(
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
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    border: Border.all(color: Colors.white, width: 2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Text('Save Report', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
              ),
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
