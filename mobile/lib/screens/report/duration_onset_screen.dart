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
      appBar: AppBar(title: const Text('Duration & Onset')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'How long have the symptoms been present?',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),
            Text(
              '${_days.toInt()} Day(s)',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, color: AppColors.primary, fontWeight: FontWeight.bold),
            ),
            Slider(
              value: _days,
              min: 1,
              max: 14,
              divisions: 13,
              label: _days.toInt().toString(),
              activeColor: AppColors.primary,
              onChanged: (val) {
                setState(() => _days = val);
              },
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                ref.read(reportDraftProvider.notifier).updateDuration(_days.toInt());
                context.go('/report/review');
              },
              child: const Text('Next: Review'),
            ),
          ],
        ),
      ),
    );
  }
}
