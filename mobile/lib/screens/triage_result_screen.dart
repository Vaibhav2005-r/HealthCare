import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../models/models.dart';
import '../providers/providers.dart';
import '../providers/report_draft_provider.dart';
import '../providers/language_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/animated_scale_button.dart' as import_scale_btn;

class TriageResultScreen extends ConsumerStatefulWidget {
  const TriageResultScreen({super.key});

  @override
  ConsumerState<TriageResultScreen> createState() => _TriageResultScreenState();
}

class _TriageResultScreenState extends ConsumerState<TriageResultScreen> {
  bool _isAnalyzing = true;
  bool _isSaved = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 900), () async {
      if (mounted) {
        setState(() {
          _isAnalyzing = false;
        });
        _autoSaveReport();
      }
    });
  }

  Future<void> _autoSaveReport() async {
    final report = GoRouterState.of(context).extra as Report?;
    if (report != null && !_isSaved) {
      try {
        final db = ref.read(localDbProvider);
        await db.insertReport(report);
        _isSaved = true;
        ref.invalidate(pendingReportsProvider);
        ref.invalidate(reportsProvider);
      } catch (_) {}
    }
  }

  void _showClinicalGuidanceSheet(BuildContext context, Report report, LanguageNotifier lang) {
    final isRed = report.riskTier == RiskTier.red;
    final isAmber = report.riskTier == RiskTier.amber;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.75,
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
                  Icon(
                    isRed ? Icons.warning_amber : Icons.verified,
                    color: isRed ? Colors.red : (isAmber ? Colors.amber.shade800 : Colors.green),
                    size: 28,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      isRed ? 'High Risk Directives (Red Tier)' : (isAmber ? 'Moderate Risk Management (Amber Tier)' : 'Low Risk Home Protocol (Green Tier)'),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1D2321)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: Colors.black12),
              const SizedBox(height: 12),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isRed
                            ? '1. IMMEDIATE REFERRAL: Alert Primary Health Centre (PHC) Medical Officer.\n\n2. HYDRATION: Administer continuous Oral Rehydration Solution (ORS) during transport.\n\n3. VITALS: Monitor pulse rate and skin turgor every 15 minutes.\n\n4. CONTACT TRACING: Inquire about other family or village members with identical symptoms within the last 48 hours.'
                            : isAmber
                                ? '1. PHC VISIT: Schedule patient examination at the sub-center within 24 hours.\n\n2. FLUID THERAPY: Instruct family to give 1 liter of boiled drinking water with ORS.\n\n3. TEMPERATURE: Maintain tepid sponging if temperature exceeds 101°F.\n\n4. DANGER SIGNS: Educate caregiver to return immediately if vomiting prevents oral fluid intake.'
                                : '1. HOME CARE: Provide 2 ORS packets with proper mixing instructions (1 liter clean water).\n\n2. DIET: Continue light, easily digestible meals (khichdi, coconut water).\n\n3. HYGIENE: Advise handwashing with soap before meals and after sanitation.',
                        style: const TextStyle(fontSize: 15, height: 1.6, color: Color(0xFF2C3E50)),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1A5F7A).withOpacity(0.08),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.support_agent, color: Color(0xFF1A5F7A)),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Text(
                                'Need more clinical advice? You can also ask our AI Assistant anytime from the Guide tab.',
                                style: TextStyle(fontSize: 13, color: Color(0xFF1A5F7A)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A5F7A),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Understood / समजले', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider.notifier);
    ref.watch(languageProvider);
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
                lang.translate('triage_result_title'),
                style: const TextStyle(
                  fontSize: 22,
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
                      child: Icon(Icons.monitor_heart, size: 80, color: AppColors.primary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              const Text(
                'Evaluating protocol / मूल्यांकन सुरू आहे...',
                style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    final Color bgColor = _getRiskColor(report.riskTier);
    final String title = _getRiskTitle(report.riskTier, lang);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                report.riskTier == RiskTier.red ? Icons.warning_amber : Icons.verified,
                color: Colors.white,
                size: 64,
              ),
              const SizedBox(height: 16),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 22,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${report.patientName} (${report.age} yrs, ${report.village})',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 16),
              ),
              const SizedBox(height: 24),
              
              // Clinical Actions Card
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.medical_services, color: bgColor),
                            const SizedBox(width: 8),
                            Text(
                              lang.translate('view_guidance_btn'),
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                                color: bgColor,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ...report.symptoms.map((s) => Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_outline, color: Colors.grey, size: 18),
                              const SizedBox(width: 8),
                              Expanded(child: Text(s, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
                            ],
                          ),
                        )),
                      ],
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 20),
              import_scale_btn.AnimatedScaleButton(
                onPressed: () => _showClinicalGuidanceSheet(context, report, lang),
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFDF8),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.library_books, color: Color(0xFF1A5F7A)),
                      const SizedBox(width: 8),
                      Text(lang.translate('view_guidance_btn'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1D2321))),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              import_scale_btn.AnimatedScaleButton(
                onPressed: () async {
                  final db = ref.read(localDbProvider);
                  await db.insertReport(report);
                  
                  try {
                    ref.read(syncServiceProvider.notifier).syncReports();
                  } catch (_) {}
                  
                  ref.read(reportDraftProvider.notifier).clear();
                  ref.invalidate(pendingReportsProvider);
                  ref.invalidate(reportsProvider);

                  if (context.mounted) {
                    context.go('/logs');
                  }
                },
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    border: Border.all(color: Colors.white, width: 2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.save, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(lang.translate('save_report_btn'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
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

  String _getRiskTitle(RiskTier tier, LanguageNotifier lang) {
    switch (tier) {
      case RiskTier.green:
        return lang.translate('risk_low');
      case RiskTier.amber:
        return lang.translate('risk_mod');
      case RiskTier.red:
        return lang.translate('risk_high');
    }
  }
}
