import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/report_draft_provider.dart';
import '../../providers/language_provider.dart';
import '../../services/media_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;
import '../../widgets/coach_mark.dart';

class ImageCaptureScreen extends ConsumerStatefulWidget {
  const ImageCaptureScreen({super.key});

  @override
  ConsumerState<ImageCaptureScreen> createState() => _ImageCaptureScreenState();
}

class _ImageCaptureScreenState extends ConsumerState<ImageCaptureScreen> {
  String? _imagePath;
  bool _isCapturing = false;

  Future<void> _capture() async {
    setState(() => _isCapturing = true);
    final mediaService = ref.read(mediaServiceProvider);
    final path = await mediaService.captureImage();
    if (mounted) {
      setState(() {
        if (path != null) {
          _imagePath = path;
        }
        _isCapturing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider.notifier);
    ref.watch(languageProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          lang.translate('step_5_title'),
          style: const TextStyle(fontSize: 16, color: AppColors.textSecondary),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Progress Bar
              Row(
                children: List.generate(6, (index) {
                  return Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 4,
                      decoration: BoxDecoration(
                        color: index <= 2
                            ? AppColors.primary
                            : Colors.grey.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),

              Text(
                lang.translate('step_5_title'),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                lang.currentLanguageCode == 'mr'
                    ? 'रुग्णाचा किंवा आजाराच्या भागाचा फोटो घ्या (पर्यायी).'
                    : lang.currentLanguageCode == 'hi'
                        ? 'मरीज़ या प्रभावित क्षेत्र का फोटो लें (वैकल्पिक).'
                        : 'Take a clear photo of patient or symptoms (optional).',
                style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),

              Container(
                height: 260,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: _imagePath != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(
                          File(_imagePath!),
                          fit: BoxFit.cover,
                          width: double.infinity,
                        ),
                      )
                    : Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.camera_alt_outlined,
                              size: 64,
                              color: AppColors.primary.withValues(alpha: 0.4),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              lang.currentLanguageCode == 'mr' ? 'फोटो घेतलेला नाही' : lang.currentLanguageCode == 'hi' ? 'कोई फोटो नहीं ली गई' : 'No photo captured',
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
              ),
              const SizedBox(height: 24),

              CoachMark(
                id: 'camera_capture_button',
                title: 'Capture Image',
                message: 'Tap here to open the camera and take a clinical photo.',
                icon: Icons.camera_alt,
                child: SizedBox(
                  height: 56,
                  child: OutlinedButton.icon(
                    onPressed: _isCapturing ? null : _capture,
                    icon: _isCapturing
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.camera_alt),
                    label: Text(
                      _imagePath == null
                          ? (lang.currentLanguageCode == 'mr' ? 'फोटो काढा' : lang.currentLanguageCode == 'hi' ? 'फोटो लें' : 'Capture Photo')
                          : (lang.currentLanguageCode == 'mr' ? 'पुन्हा फोटो काढा' : lang.currentLanguageCode == 'hi' ? 'दोबारा फोटो लें' : 'Retake Photo'),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      side: const BorderSide(
                        color: AppColors.primary,
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              import_scale_btn.AnimatedScaleButton(
                onPressed: () {
                  ref
                      .read(reportDraftProvider.notifier)
                      .updateImage(_imagePath);
                  context.push('/report/review');
                },
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      _imagePath == null
                          ? (lang.currentLanguageCode == 'mr' ? 'पुढे जा (पर्यायी)' : lang.currentLanguageCode == 'hi' ? 'आगे बढ़ें (वैकल्पिक)' : 'Skip / Continue')
                          : lang.translate('next_btn'),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
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
