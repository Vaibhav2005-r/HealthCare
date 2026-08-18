import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/report_draft_provider.dart';
import '../../providers/language_provider.dart';
import '../../services/voice_service.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;

class SymptomsScreen extends ConsumerWidget {
  SymptomsScreen({super.key});

  final List<Map<String, dynamic>> availableSymptoms = [
    {'name': 'Fever', 'key': 'sym_fever', 'icon': Icons.thermostat},
    {'name': 'Vomiting', 'key': 'sym_vomiting', 'icon': Icons.medication},
    {'name': 'Diarrhea', 'key': 'sym_diarrhea', 'icon': Icons.water_drop},
    {'name': 'Dehydration', 'key': 'sym_dehydration', 'icon': Icons.water_drop_outlined},
    {'name': 'Lethargy', 'key': 'sym_lethargy', 'icon': Icons.health_and_safety},
    {'name': 'Cough', 'key': 'sym_cough', 'icon': Icons.air},
    {'name': 'Headache', 'key': 'sym_body_ache', 'icon': Icons.sick},
  ];

  void _parseAndApplySymptoms(String speech, WidgetRef ref, BuildContext context) {
    final lower = speech.toLowerCase();
    final List<String> matched = [];

    if (lower.contains('fever') || lower.contains('ताप') || lower.contains('बुखार') || lower.contains('temperature') || lower.contains('hot')) {
      matched.add('Fever');
    }
    if (lower.contains('vomit') || lower.contains('उलटी') || lower.contains('उलट्या') || lower.contains('मळमळ')) {
      matched.add('Vomiting');
    }
    if (lower.contains('diarrhea') || lower.contains('जुलाब') || lower.contains('दस्त') || lower.contains('loose') || lower.contains('motion')) {
      matched.add('Diarrhea');
    }
    if (lower.contains('dehydrat') || lower.contains('तहान') || lower.contains('पाणी कमी') || lower.contains('निर्जलीकरण') || lower.contains('dry')) {
      matched.add('Dehydration');
    }
    if (lower.contains('letharg') || lower.contains('tired') || lower.contains('सुस्ती') || lower.contains('थकवा') || lower.contains('कमजोरी') || lower.contains('drowsy')) {
      matched.add('Lethargy');
    }
    if (lower.contains('cough') || lower.contains('cold') || lower.contains('खोकला') || lower.contains('सर्दी') || lower.contains('खांसी') || lower.contains('कफ')) {
      matched.add('Cough');
    }
    if (lower.contains('headache') || lower.contains('pain') || lower.contains('डोके') || lower.contains('डोकेदुखी') || lower.contains('सिरदर्द') || lower.contains('अंगदुखी') || lower.contains('बदन दर्द')) {
      matched.add('Headache');
    }

    final draft = ref.read(reportDraftProvider);
    for (final sym in matched) {
      if (!draft.symptoms.contains(sym)) {
        ref.read(reportDraftProvider.notifier).toggleSymptom(sym);
      }
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          matched.isNotEmpty
              ? 'Recognized & Added: ${matched.join(", ")}'
              : 'Heard: "$speech". Tap symptoms or speak "Fever, Diarrhea, Vomiting".',
        ),
        backgroundColor: matched.isNotEmpty ? const Color(0xFF1A5F7A) : Colors.orange.shade800,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showDictationModal(BuildContext context, WidgetRef ref, LanguageNotifier lang) {
    final TextEditingController textController = TextEditingController();
    bool isListening = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              decoration: const BoxDecoration(
                color: Color(0xFFFFFDF8),
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
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
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1A5F7A).withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.mic, color: Color(0xFF1A5F7A), size: 24),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        lang.state.languageCode == 'mr'
                            ? 'आवाजाने लक्षणे सांगा'
                            : lang.state.languageCode == 'hi'
                                ? 'बोलकर लक्षण बताएं'
                                : 'Voice Dictate Symptoms',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1D2321),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    lang.state.languageCode == 'mr'
                        ? 'उदा. "ताप आणि उलट्या", "तीव्र जुलाब", "खोकला व डोकेदुखी"'
                        : lang.state.languageCode == 'hi'
                            ? 'उदा. "बुखार और उल्टी", "दस्त और कमजोरी", "खांसी और सिरदर्द"'
                            : 'e.g. "Patient has high fever and diarrhea", "Vomiting and headache"',
                    style: const TextStyle(fontSize: 13, color: Colors.blueGrey),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: textController,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: lang.state.languageCode == 'mr'
                          ? 'येथे बोला किंवा लिहा...'
                          : lang.state.languageCode == 'hi'
                              ? 'यहाँ बोलें या लिखें...'
                              : 'Speak or type symptoms...',
                      filled: true,
                      fillColor: const Color(0xFFF5F0E8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          isListening ? Icons.mic : Icons.mic_none,
                          color: isListening ? Colors.red : const Color(0xFF1A5F7A),
                        ),
                        onPressed: () async {
                          setModalState(() => isListening = true);
                          await ref.read(voiceServiceProvider).startListening(
                            onResult: (spoken) {
                              setModalState(() {
                                isListening = false;
                                textController.text = spoken;
                              });
                            },
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ActionChip(
                        label: const Text('Fever / ताप'),
                        onPressed: () => textController.text = 'Fever ताप',
                      ),
                      ActionChip(
                        label: const Text('Vomiting / उलट्या'),
                        onPressed: () => textController.text = 'Vomiting उलट्या',
                      ),
                      ActionChip(
                        label: const Text('Diarrhea / जुलाब'),
                        onPressed: () => textController.text = 'Diarrhea जुलाब',
                      ),
                      ActionChip(
                        label: const Text('Cough / खोकला'),
                        onPressed: () => textController.text = 'Cough खोकला',
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A5F7A),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: () {
                      final input = textController.text.trim();
                      if (input.isNotEmpty) {
                        Navigator.pop(ctx);
                        _parseAndApplySymptoms(input, ref, context);
                      }
                    },
                    child: Text(
                      lang.state.languageCode == 'mr'
                          ? 'लक्षणे जोडा'
                          : lang.state.languageCode == 'hi'
                              ? 'लक्षण जोड़ें'
                              : 'Apply Symptoms',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(reportDraftProvider);
    final lang = ref.watch(languageProvider.notifier);
    ref.watch(languageProvider);

    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: Text(lang.translate('step_2_title'), style: const TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
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
                children: List.generate(6, (index) {
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
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    lang.translate('step_2_title'),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1D2321),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.volume_up, color: accentColor),
                    onPressed: () {
                      ref.read(voiceServiceProvider).speak('Select symptoms from the list / लक्षणे निवडा', lang.state.languageCode);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              OutlinedButton.icon(
                onPressed: () => _showDictationModal(context, ref, lang),
                icon: const Icon(Icons.mic, color: accentColor),
                label: Text(
                  lang.state.languageCode == 'mr'
                      ? 'आवाजाने लक्षणे सांगा (Voice Dictate)'
                      : lang.state.languageCode == 'hi'
                          ? 'बोलकर लक्षण बताएं (Voice Dictate)'
                          : 'Voice Dictate Symptoms',
                  style: const TextStyle(color: accentColor, fontWeight: FontWeight.bold),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: accentColor, width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
              const SizedBox(height: 24),
              
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 180,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    mainAxisExtent: 140,
                  ),
                  itemCount: availableSymptoms.length,
                  itemBuilder: (context, index) {
                    final symptom = availableSymptoms[index];
                    final isSelected = draft.symptoms.contains(symptom['name']);
                    final localizedLabel = lang.translate(symptom['key'] ?? '');

                    return InkWell(
                      onTap: () {
                        ref.read(reportDraftProvider.notifier).toggleSymptom(symptom['name']);
                      },
                      borderRadius: BorderRadius.circular(24),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        decoration: BoxDecoration(
                          color: isSelected ? accentColor : surfaceColor,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            if (!isSelected)
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                          ],
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.white.withOpacity(0.2) : bgColor,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                symptom['icon'],
                                color: isSelected ? Colors.white : accentColor,
                                size: 28,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              localizedLabel.isNotEmpty ? localizedLabel : symptom['name'],
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                color: isSelected ? Colors.white : const Color(0xFF1D2321),
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              import_scale_btn.AnimatedScaleButton(
                onPressed: () {
                  context.push('/report/duration');
                },
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(lang.translate('next_btn'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
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
