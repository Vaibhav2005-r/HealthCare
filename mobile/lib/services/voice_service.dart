import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';

final voiceServiceProvider = Provider<VoiceService>((ref) {
  return VoiceService();
});

class VoiceService {
  final stt.SpeechToText _speech = stt.SpeechToText();
  final FlutterTts _tts = FlutterTts();
  bool _isSttInitialized = false;

  Future<bool> initSpeech() async {
    if (!_isSttInitialized) {
      _isSttInitialized = await _speech.initialize(
        onError: (error) => print('Speech to text error: $error'),
        onStatus: (status) => print('Speech to text status: $status'),
      );
    }
    return _isSttInitialized;
  }

  Future<void> startListening({required Function(String) onResult}) async {
    bool available = await initSpeech();
    if (available) {
      _speech.listen(
        onResult: (result) {
          onResult(result.recognizedWords);
        },
      );
    } else {
      // Mock for web or unavailable permissions
      onResult("This is a mocked dictated sentence.");
    }
  }

  Future<void> stopListening() async {
    if (_speech.isListening) {
      await _speech.stop();
    }
  }

  Future<void> speak(String text) async {
    await _tts.speak(text);
  }

  Future<void> stopSpeaking() async {
    await _tts.stop();
  }
}
