import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/report_draft_provider.dart';
import '../../services/media_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;

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
    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Step 2 of 5: Clinical Image', style: TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
        backgroundColor: Colors.transparent,
        elevation: 0,
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
                children: List.generate(5, (index) {
                  return Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 4,
                      decoration: BoxDecoration(
                        color: index <= 1 ? accentColor : Colors.grey.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),
              
              const Text(
                'Capture Image',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1D2321),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Please take a clear photo of the patient or the affected area if visible. This helps with remote triage.',
                style: TextStyle(fontSize: 15, color: Color(0xFF5B6663)),
              ),
              const SizedBox(height: 24),

              Container(
                height: 300,
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
                child: _imagePath != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(
                          File(_imagePath!),
                          fit: BoxFit.cover,
                        ),
                      )
                    : Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.camera_alt_outlined, size: 64, color: Colors.grey.withOpacity(0.5)),
                            const SizedBox(height: 16),
                            const Text('No Image Captured', style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      ),
              ),
              const SizedBox(height: 24),
              
              OutlinedButton.icon(
                onPressed: _isCapturing ? null : _capture,
                icon: _isCapturing
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.camera),
                label: Text(_imagePath == null ? 'Take Photo' : 'Retake Photo'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: accentColor,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              
              const SizedBox(height: 32),
              
              import_scale_btn.AnimatedScaleButton(
                onPressed: () {
                  ref.read(reportDraftProvider.notifier).updateImage(_imagePath);
                  context.push('/report/symptoms');
                },
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      _imagePath == null ? 'Skip for now' : 'Continue to Symptoms',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)
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
