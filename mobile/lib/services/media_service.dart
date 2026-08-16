import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

class MediaService {
  final ImagePicker _picker = ImagePicker();

  Future<String?> captureImage() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 100, // We will compress manually
      );

      if (photo == null) return null;

      final dir = await getTemporaryDirectory();
      final targetPath = p.join(dir.absolute.path, "temp_${DateTime.now().millisecondsSinceEpoch}.jpg");

      // Compress and resize
      var result = await FlutterImageCompress.compressAndGetFile(
        photo.path, 
        targetPath,
        quality: 70,
        minWidth: 800,
        minHeight: 800,
      );

      if (result != null) {
        return result.path;
      }
      return photo.path;
    } catch (e) {
      return null;
    }
  }
}

final mediaServiceProvider = Provider<MediaService>((ref) {
  return MediaService();
});
