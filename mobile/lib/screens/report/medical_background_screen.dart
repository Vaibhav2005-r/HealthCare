import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/report_draft_provider.dart';
import '../../providers/language_provider.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;

class MedicalBackgroundScreen extends ConsumerStatefulWidget {
  const MedicalBackgroundScreen({super.key});

  @override
  ConsumerState<MedicalBackgroundScreen> createState() => _MedicalBackgroundScreenState();
}

class _MedicalBackgroundScreenState extends ConsumerState<MedicalBackgroundScreen> {
  final _tempController = TextEditingController();
  String _tempUnit = 'C';
  final _medsController = TextEditingController();

  final List<String> _availableConditions = [
    'Diabetes',
    'Hypertension',
    'Heart Disease',
    'Asthma/Respiratory',
    'Pregnancy',
  ];
  final Set<String> _selectedConditions = {};
  final _otherConditionController = TextEditingController();
  bool _hasOther = false;

  @override
  void dispose() {
    _tempController.dispose();
    _medsController.dispose();
    _otherConditionController.dispose();
    super.dispose();
  }

  void _toggleCondition(String condition) {
    setState(() {
      if (_selectedConditions.contains(condition)) {
        _selectedConditions.remove(condition);
      } else {
        _selectedConditions.add(condition);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider.notifier);
    ref.watch(languageProvider);

    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: Text(
          lang.translate('step_4_title'),
          style: const TextStyle(fontSize: 16, color: Color(0xFF5B6663)),
        ),
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
                children: List.generate(6, (index) {
                  return Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 4,
                      decoration: BoxDecoration(
                        color: index <= 1 ? accentColor : Colors.grey.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),
              
              Text(
                lang.translate('step_4_title'),
                style: const TextStyle(
                  fontSize: 20,
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
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Temperature
                    Text(lang.translate('body_temperature'), style: const TextStyle(fontWeight: FontWeight.bold, color: accentColor)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextField(
                            controller: _tempController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: InputDecoration(
                              labelText: '°${_tempUnit}',
                              prefixIcon: const Icon(Icons.thermostat, color: accentColor),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              filled: true,
                              fillColor: bgColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ToggleButtons(
                          isSelected: [_tempUnit == 'C', _tempUnit == 'F'],
                          onPressed: (index) {
                            setState(() {
                              _tempUnit = index == 0 ? 'C' : 'F';
                            });
                          },
                          borderRadius: BorderRadius.circular(12),
                          selectedColor: Colors.white,
                          fillColor: accentColor,
                          children: const [
                            Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('°C')),
                            Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('°F')),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Conditions
                    Text(lang.translate('comorbidities'), style: const TextStyle(fontWeight: FontWeight.bold, color: accentColor)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _availableConditions.map((condition) {
                        final isSelected = _selectedConditions.contains(condition);
                        return ChoiceChip(
                          label: Text(condition),
                          selected: isSelected,
                          selectedColor: accentColor,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : const Color(0xFF1D2321),
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                          onSelected: (selected) => _toggleCondition(condition),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Checkbox(
                          value: _hasOther,
                          activeColor: accentColor,
                          onChanged: (val) {
                            setState(() {
                              _hasOther = val ?? false;
                              if (!_hasOther) _otherConditionController.clear();
                            });
                          },
                        ),
                        const Text('Other / इतर आजार', style: TextStyle(color: Color(0xFF1D2321))),
                      ],
                    ),
                    if (_hasOther) ...[
                      const SizedBox(height: 12),
                      TextField(
                        controller: _otherConditionController,
                        decoration: InputDecoration(
                          labelText: 'Other condition(s) / इतर आजार',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          filled: true,
                          fillColor: bgColor,
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),

                    // Medications
                    const Text('Medication / आधी दिलेली औषधे', style: TextStyle(fontWeight: FontWeight.bold, color: accentColor)),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _medsController,
                      decoration: InputDecoration(
                        labelText: 'Any medicine already given? (Optional)',
                        prefixIcon: const Icon(Icons.medication, color: accentColor),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        filled: true,
                        fillColor: bgColor,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              import_scale_btn.AnimatedScaleButton(
                onPressed: () {
                  final temp = double.tryParse(_tempController.text);
                  
                  final List<String> conditions = _selectedConditions.toList();
                  if (_hasOther && _otherConditionController.text.isNotEmpty) {
                    conditions.add(_otherConditionController.text.trim());
                  }

                  ref.read(reportDraftProvider.notifier).updateMedicalBackground(
                    temperature: temp,
                    temperatureUnit: _tempUnit,
                    comorbidities: conditions,
                    medicationTaken: _medsController.text.isEmpty ? null : _medsController.text,
                  );
                  context.push('/report/image');
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
