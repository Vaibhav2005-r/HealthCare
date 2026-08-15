import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/report_draft_provider.dart';
import '../../theme/app_colors.dart';

class DurationOnsetScreen extends ConsumerStatefulWidget {
  const DurationOnsetScreen({super.key});

  @override
  ConsumerState<DurationOnsetScreen> createState() => _DurationOnsetScreenState();
}

class _DurationOnsetScreenState extends ConsumerState<DurationOnsetScreen> {
  double _days = 1.0;

  @override
  void initState() {
    super.initState();
    final draft = ref.read(reportDraftProvider);
    if (draft.durationDays != null) {
      _days = draft.durationDays!.toDouble();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Duration & Onset', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.access_time, size: 32, color: AppColors.primary),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'How long have the\nsymptoms been present?',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 48),
                      Text(
                        '${_days.toInt()} Day${_days.toInt() == 1 ? '' : 's'}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 48,
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                          height: 1.0,
                        ),
                      ),
                      const SizedBox(height: 48),
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          activeTrackColor: AppColors.primary,
                          inactiveTrackColor: AppColors.primaryLight.withOpacity(0.3),
                          thumbColor: AppColors.primaryDark,
                          overlayColor: AppColors.primary.withOpacity(0.2),
                          trackHeight: 8.0,
                          thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14.0),
                          overlayShape: const RoundSliderOverlayShape(overlayRadius: 28.0),
                        ),
                        child: Slider(
                          value: _days,
                          min: 1,
                          max: 14,
                          divisions: 13,
                          onChanged: (val) {
                            setState(() => _days = val);
                          },
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('1', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                            Text('14', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(56),
                ),
                onPressed: () {
                  ref.read(reportDraftProvider.notifier).updateDuration(_days.toInt());
                  context.go('/report/review');
                },
                child: const Text('Next: Review', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
