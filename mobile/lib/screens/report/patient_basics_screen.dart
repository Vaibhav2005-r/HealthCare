import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';
import '../../providers/report_draft_provider.dart';
import '../../services/location_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/animated_scale_button.dart' as import_scale_btn;

class PatientBasicsScreen extends ConsumerStatefulWidget {
  const PatientBasicsScreen({super.key});

  @override
  ConsumerState<PatientBasicsScreen> createState() => _PatientBasicsScreenState();
}

class _PatientBasicsScreenState extends ConsumerState<PatientBasicsScreen> {
  final _ageController = TextEditingController();
  String _sex = 'Male';
  String? _village;
  
  bool _isGettingLocation = true;
  LocationData? _location;
  String? _manualLocationReason;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchLocation();
    });
  }

  Future<void> _fetchLocation() async {
    setState(() => _isGettingLocation = true);
    final locService = ref.read(locationServiceProvider);
    final loc = await locService.getCurrentLocation();
    
    if (mounted) {
      setState(() {
        _location = loc;
        _isGettingLocation = false;
        
        if (loc == null || loc.accuracy > 50) {
          _promptManualLocation();
        }
      });
    }
  }

  void _promptManualLocation() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        String selectedReason = 'GPS Indoor Blindspot';
        return AlertDialog(
          title: const Text('Location Unavailable'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('We could not get a high-accuracy GPS fix. Please select a reason for manual entry:'),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedReason,
                items: [
                  'GPS Indoor Blindspot',
                  'Sensor Error',
                  'Battery Saver Mode',
                  'Other'
                ].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (val) {
                  if (val != null) selectedReason = val;
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                setState(() {
                  _manualLocationReason = selectedReason;
                });
                Navigator.pop(ctx);
              },
              child: const Text('Confirm'),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _ageController.dispose();
    super.dispose();
  }

  Widget _buildGpsStatusChip() {
    if (_isGettingLocation) {
      return Chip(
        label: const Text('Acquiring GPS...'),
        avatar: const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
        backgroundColor: Colors.grey.shade200,
      );
    }
    
    if (_manualLocationReason != null) {
      return Chip(
        label: const Text('Manual Location', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.blueGrey,
        avatar: const Icon(Icons.edit_location_alt, color: Colors.white, size: 16),
      );
    }
    
    if (_location != null) {
      final acc = _location!.accuracy;
      Color color;
      String label;
      if (acc < 10) {
        color = Colors.green;
        label = 'GPS High Accuracy';
      } else if (acc <= 30) {
        color = Colors.orange;
        label = 'GPS Med Accuracy';
      } else {
        color = Colors.red;
        label = 'GPS Low Accuracy';
      }
      return Chip(
        label: Text(label, style: const TextStyle(color: Colors.white)),
        backgroundColor: color,
        avatar: const Icon(Icons.gps_fixed, color: Colors.white, size: 16),
      );
    }
    
    return const SizedBox();
  }

  @override
  Widget build(BuildContext context) {
    final mockData = ref.watch(mockDataProvider);
    final villages = mockData.getVillages();
    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Step 1 of 5: Patient Basics', style: TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
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
                        color: index == 0 ? accentColor : Colors.grey.withOpacity(0.3),
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
                    'Patient Details',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1D2321),
                    ),
                  ),
                  _buildGpsStatusChip(),
                ],
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
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _ageController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Age',
                              prefixIcon: const Icon(Icons.cake_outlined, color: accentColor),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              filled: true,
                              fillColor: bgColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _sex,
                            decoration: InputDecoration(
                              labelText: 'Sex',
                              prefixIcon: const Icon(Icons.people_outline, color: accentColor),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              filled: true,
                              fillColor: bgColor,
                            ),
                            items: ['Male', 'Female', 'Other']
                                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                                .toList(),
                            onChanged: (val) => setState(() => _sex = val!),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    DropdownButtonFormField<String>(
                      value: _village,
                      decoration: InputDecoration(
                        labelText: 'Village / PHC',
                        prefixIcon: const Icon(Icons.location_on_outlined, color: accentColor),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        filled: true,
                        fillColor: bgColor,
                      ),
                      items: villages.map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
                      onChanged: (val) => setState(() => _village = val),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              import_scale_btn.AnimatedScaleButton(
                onPressed: () {
                  final age = int.tryParse(_ageController.text);
                  if (age != null && _village != null) {
                    ref.read(reportDraftProvider.notifier).updateBasics(
                      age: age,
                      sex: _sex,
                      village: _village!,
                    );
                    ref.read(reportDraftProvider.notifier).updateLocation(
                      lat: _location?.latitude,
                      lng: _location?.longitude,
                      accuracy: _location?.accuracy,
                      reason: _manualLocationReason,
                    );
                    context.push('/report/image');
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Please fill all fields'),
                        backgroundColor: accentColor,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
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
