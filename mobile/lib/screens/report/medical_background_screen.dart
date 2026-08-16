import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/report_draft_provider.dart';
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
    'None',
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
      if (condition == 'None') {
        _selectedConditions.clear();
        _selectedConditions.add('None');
        _hasOther = false;
        _otherConditionController.clear();
      } else {
        _selectedConditions.remove('None');
        if (_selectedConditions.contains(condition)) {
          _selectedConditions.remove(condition);
        } else {
          _selectedConditions.add(condition);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Step 2 of 6: Medical Background', style: TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
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
                        color: index <= 1 ? accentColor : Colors.grey.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),
              
              const Text(
                'Medical Background',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1D2321),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'All fields in this section are optional.',
                style: TextStyle(fontSize: 14, color: Colors.blueGrey),
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
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Temperature
                    const Text('Body Temperature', style: TextStyle(fontWeight: FontWeight.bold, color: accentColor)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextField(
                            controller: _tempController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: InputDecoration(
                              labelText: 'Temp (Optional)',
                              prefixIcon: Icon(Icons.thermostat, color: accentColor),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              filled: true,
                              fillColor: bgColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 1,
                          child: DropdownButtonFormField<String>(
                            value: _tempUnit,
                            decoration: InputDecoration(
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              filled: true,
                              fillColor: bgColor,
                            ),
                            items: ['C', 'F']
                                .map((s) => DropdownMenuItem(value: s, child: Text('°$s')))
                                .toList(),
                            onChanged: (val) => setState(() => _tempUnit = val!),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Comorbidities
                    const Text('Pre-existing Conditions', style: TextStyle(fontWeight: FontWeight.bold, color: accentColor)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _availableConditions.map((condition) {
                        final isSelected = _selectedConditions.contains(condition);
                        return FilterChip(
                          label: Text(condition),
                          selected: isSelected,
                          onSelected: (_) => _toggleCondition(condition),
                          selectedColor: accentColor.withOpacity(0.2),
                          checkmarkColor: accentColor,
                        );
                      }).toList()..add(
                        FilterChip(
                          label: const Text('Other'),
                          selected: _hasOther,
                          onSelected: (val) {
                            setState(() {
                              _hasOther = val;
                              if (val) _selectedConditions.remove('None');
                              if (!val) _otherConditionController.clear();
                            });
                          },
                          selectedColor: accentColor.withOpacity(0.2),
                          checkmarkColor: accentColor,
                        )
                      ),
                    ),
                    if (_hasOther) ...[
                      const SizedBox(height: 12),
                      TextField(
                        controller: _otherConditionController,
                        decoration: InputDecoration(
                          labelText: 'Other condition(s)',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          filled: true,
                          fillColor: bgColor,
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),

                    // Medications
                    const Text('Medication Already Given', style: TextStyle(fontWeight: FontWeight.bold, color: accentColor)),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _medsController,
                      decoration: InputDecoration(
                        labelText: 'Any medicine already given? (Optional)',
                        prefixIcon: Icon(Icons.medication, color: accentColor),
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
                  child: const Center(
                    child: Text('Continue to Image Capture', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
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
