import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/report_draft_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;

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
    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Step 4 of 5: Duration', style: TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Progress Bar
              Row(
                children: List.generate(5, (index) {
                  return Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 4,
                      decoration: BoxDecoration(
                        color: index <= 3 ? accentColor : Colors.grey.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),
              
              const Text(
                'How long have they felt sick?',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1D2321),
                ),
              ),
              const SizedBox(height: 24),

              Container(
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: accentColor.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.access_time, size: 32, color: accentColor),
                    ),
                    const SizedBox(height: 48),
                    Text(
                      '${_days.toInt()} Day${_days.toInt() == 1 ? '' : 's'}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 48,
                        color: accentColor,
                        fontWeight: FontWeight.bold,
                        height: 1.0,
                      ),
                    ),
                    const SizedBox(height: 48),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: accentColor,
                        inactiveTrackColor: accentColor.withOpacity(0.3),
                        thumbColor: accentColor,
                        overlayColor: accentColor.withOpacity(0.2),
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
                          Text('1', style: TextStyle(color: Color(0xFF5B6663), fontWeight: FontWeight.bold)),
                          Text('14', style: TextStyle(color: Color(0xFF5B6663), fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              import_scale_btn.AnimatedScaleButton(
                onPressed: () {
                  ref.read(reportDraftProvider.notifier).updateDuration(_days.toInt());
                  context.push('/report/review');
                },
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Text('Next: Review', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
