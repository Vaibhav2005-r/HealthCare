import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../models/models.dart';
import '../providers/report_draft_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/animated_scale_button.dart' as scale_btn;

class SavedReportDetailScreen extends ConsumerWidget {
  final Report report;

  const SavedReportDetailScreen({super.key, required this.report});

  void _showShareSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Text(
                'Share Report Summary',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _ShareOption(
                    icon: Icons.chat,
                    label: 'WhatsApp',
                    color: Colors.green,
                    onTap: () => Navigator.pop(context),
                  ),
                  _ShareOption(
                    icon: Icons.mail,
                    label: 'Email',
                    color: Colors.red,
                    onTap: () => Navigator.pop(context),
                  ),
                  _ShareOption(
                    icon: Icons.copy,
                    label: 'Copy',
                    color: Colors.blue,
                    onTap: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Color _getRiskColor(RiskTier tier) {
    switch (tier) {
      case RiskTier.red:
        return AppColors.riskRed;
      case RiskTier.amber:
        return AppColors.riskAmber;
      case RiskTier.green:
        return AppColors.riskGreen;
    }
  }

  String _getRiskText(RiskTier tier) {
    switch (tier) {
      case RiskTier.red:
        return 'CRITICAL RISK';
      case RiskTier.amber:
        return 'MODERATE RISK';
      case RiskTier.green:
        return 'LOW RISK';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final riskColor = _getRiskColor(report.riskTier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Saved Report',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share, color: AppColors.textPrimary),
            onPressed: () => _showShareSheet(context),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Registration Date
                    Center(
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.calendar_month, size: 18, color: AppColors.primary),
                            const SizedBox(width: 8),
                            Text(
                              'Registered: ${DateFormat('d MMM yyyy, h:mm a').format(report.createdAt)}',
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Triage Badge
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                      decoration: BoxDecoration(
                        color: riskColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: riskColor.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            report.riskTier == RiskTier.green
                                ? Icons.check_circle
                                : report.riskTier == RiskTier.amber
                                    ? Icons.warning
                                    : Icons.report,
                            color: riskColor,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _getRiskText(report.riskTier),
                            style: TextStyle(
                              color: riskColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Detail Card
                    Card(
                      margin: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      color: AppColors.surface,
                      elevation: 0,
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildSectionHeader(Icons.badge, 'Patient Info'),
                            const SizedBox(height: 12),
                            Text('Name: ${report.patientName}', style: const TextStyle(fontSize: 15)),
                            Text('Age: ${report.age} yrs, Gender: ${report.sex}', style: const TextStyle(fontSize: 15)),
                            if (report.contactNumber != null && report.contactNumber!.isNotEmpty)
                              Text('Contact: ${report.contactNumber}', style: const TextStyle(fontSize: 15)),
                            const _Divider(),

                            _buildSectionHeader(Icons.location_on, 'Location'),
                            const SizedBox(height: 12),
                            Text('Village / PHC: ${report.village}', style: const TextStyle(fontSize: 15)),
                            const _Divider(),

                            _buildSectionHeader(Icons.assignment, 'Medical Background'),
                            const SizedBox(height: 12),
                            if (report.temperature != null)
                              Text('Temperature: ${report.temperature}°${report.temperatureUnit}', style: const TextStyle(fontSize: 15)),
                            if (report.comorbidities.isNotEmpty)
                              Text('Conditions: ${report.comorbidities.join(', ')}', style: const TextStyle(fontSize: 15)),
                            if (report.medicationTaken != null && report.medicationTaken!.isNotEmpty)
                              Text('Medication: ${report.medicationTaken}', style: const TextStyle(fontSize: 15)),
                            if (report.temperature == null && report.comorbidities.isEmpty && (report.medicationTaken == null || report.medicationTaken!.isEmpty))
                              const Text('No additional medical background provided', style: TextStyle(fontSize: 15, color: Colors.grey)),
                            const _Divider(),

                            _buildSectionHeader(Icons.medical_services, 'Symptoms'),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                ...report.symptoms.map((s) => Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(s, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
                                )),
                                ...report.customSymptoms.map((s) => Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                                  ),
                                  child: Text(s, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
                                )),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text('Duration: ${report.durationDays} day${report.durationDays == 1 ? '' : 's'}', style: const TextStyle(fontSize: 15)),
                            const _Divider(),

                            _buildSectionHeader(Icons.camera_alt, 'Clinical Image'),
                            const SizedBox(height: 12),
                            Text(report.imagePath != null ? 'Image captured and attached' : 'No image attached', style: const TextStyle(fontSize: 15)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // Bottom Action
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: scale_btn.AnimatedScaleButton(
                onPressed: () {
                  // Pre-fill a new report draft with this patient's info
                  ref.read(reportDraftProvider.notifier).clear(); // Clear old draft
                  
                  final notifier = ref.read(reportDraftProvider.notifier);
                  notifier.updateBasics(
                    patientName: report.patientName,
                    age: report.age,
                    sex: report.sex,
                    contactNumber: report.contactNumber,
                    village: report.village,
                  );

                  // Navigate to basics
                  context.go('/patient-basics');
                },
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Text(
                      'Re-Triage / Follow-up Visit',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
            fontSize: 16,
          ),
        ),
      ],
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 16.0),
      child: Divider(color: Colors.black12),
    );
  }
}

class _ShareOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ShareOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
