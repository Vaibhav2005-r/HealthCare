import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/report_draft_provider.dart';
import '../../services/voice_service.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;

class SymptomsScreen extends ConsumerStatefulWidget {
  const SymptomsScreen({super.key});

  @override
  ConsumerState<SymptomsScreen> createState() => _SymptomsScreenState();
}

class _SymptomsScreenState extends ConsumerState<SymptomsScreen> {
  final TextEditingController _customSymptomController = TextEditingController();

  final List<Map<String, dynamic>> availableSymptoms = [
    {'name': 'Fever', 'icon': Icons.thermostat},
    {'name': 'Vomiting', 'icon': Icons.medication},
    {'name': 'Diarrhea', 'icon': Icons.water_drop},
    {'name': 'Dehydration', 'icon': Icons.water_drop_outlined},
    {'name': 'Lethargy', 'icon': Icons.health_and_safety},
    {'name': 'Cough', 'icon': Icons.air},
    {'name': 'Headache', 'icon': Icons.sick},
  ];

  @override
  void dispose() {
    _customSymptomController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(reportDraftProvider);

    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Step 4 of 6: Symptoms', style: TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
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
                        color: index <= 3 ? accentColor : Colors.grey.withValues(alpha: 0.3),
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
                  const Text(
                    'Select Symptoms',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1D2321),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.volume_up, color: accentColor),
                    onPressed: () {
                      ref.read(voiceServiceProvider).speak('Select Symptoms from the list or press the microphone to dictate.');
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(voiceServiceProvider).startListening(
                    onResult: (result) {
                      // Process voice result
                      final words = result.toLowerCase().split(RegExp(r'\s+'));
                      final predefinedNames = availableSymptoms.map((e) => e['name'].toString().toLowerCase()).toList();
                      
                      for (var word in words) {
                        word = word.replaceAll(RegExp(r'[^\w\s]'), ''); // remove punctuation
                        if (word.isEmpty) continue;
                        
                        if (predefinedNames.contains(word)) {
                          final matchingPredefined = availableSymptoms.firstWhere((e) => e['name'].toString().toLowerCase() == word)['name'];
                          
                          // Only toggle on, not off, if dictated
                          if (!ref.read(reportDraftProvider).symptoms.contains(matchingPredefined)) {
                            ref.read(reportDraftProvider.notifier).toggleSymptom(matchingPredefined);
                          }
                        } else {
                          ref.read(reportDraftProvider.notifier).addCustomSymptom(word);
                        }
                      }
                    },
                  );
                },
                icon: Icon(Icons.mic, color: accentColor),
                label: const Text('Dictate Symptoms', style: TextStyle(color: accentColor, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: accentColor),
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
                    mainAxisExtent: 140, // Height enough for 2 lines
                  ),
                  itemCount: availableSymptoms.length,
                  itemBuilder: (context, index) {
                    final symptom = availableSymptoms[index];
                    final isSelected = draft.symptoms.contains(symptom['name']);

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
                                color: Colors.black.withValues(alpha: 0.02),
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
                                color: isSelected ? Colors.white.withValues(alpha: 0.2) : bgColor,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                symptom['icon'],
                                color: isSelected ? Colors.white : accentColor,
                                size: 28,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              symptom['name'],
                              style: TextStyle(
                                fontSize: 16,
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
              const Divider(color: Colors.black12),
              const SizedBox(height: 8),
              const Text(
                'Don\'t see the symptom you need? Add it here',
                style: TextStyle(color: Color(0xFF5B6663), fontSize: 14),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _customSymptomController,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.edit_note, color: Color(0xFF1A5F7A)),
                  hintText: 'Type any other symptoms...',
                  filled: true,
                  fillColor: const Color(0xFFFFFDF8),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.add_circle, color: Color(0xFF1A5F7A)),
                    onPressed: () {
                      if (_customSymptomController.text.isNotEmpty) {
                        ref.read(reportDraftProvider.notifier).addCustomSymptom(_customSymptomController.text);
                        _customSymptomController.clear();
                      }
                    },
                  ),
                ),
                onSubmitted: (val) {
                  if (val.isNotEmpty) {
                    ref.read(reportDraftProvider.notifier).addCustomSymptom(val);
                    _customSymptomController.clear();
                  }
                },
              ),
              if (draft.customSymptoms.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: draft.customSymptoms.map((symptom) {
                    return InputChip(
                      label: Text(symptom, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1A5F7A))),
                      backgroundColor: const Color(0xFF1A5F7A).withValues(alpha: 0.1),
                      deleteIcon: const Icon(Icons.close, size: 16, color: Color(0xFF1A5F7A)),
                      onDeleted: () {
                        ref.read(reportDraftProvider.notifier).removeCustomSymptom(symptom);
                      },
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      side: BorderSide.none,
                    );
                  }).toList(),
                ),
              ],
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
                  child: const Center(
                    child: Text('Next: Duration', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
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
