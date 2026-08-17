import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  final _nameController = TextEditingController();
  final _contactController = TextEditingController();
  final _ageController = TextEditingController();
  String? _gender;
  String? _village;
  String? _contactError;
  
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
                isExpanded: true,
                value: selectedReason,
                items: [
                  'GPS Indoor Blindspot',
                  'Sensor Error',
                  'Battery Saver Mode',
                  'Other'
                ].map((s) => DropdownMenuItem(
                  value: s, 
                  child: Text(s, overflow: TextOverflow.ellipsis),
                )).toList(),
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
    _nameController.dispose();
    _contactController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  Widget _buildGpsStatusChip() {
    if (_isGettingLocation) {
      return Chip(
        label: const Text('Acquiring GPS...', overflow: TextOverflow.ellipsis, maxLines: 1),
        avatar: const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
        backgroundColor: Colors.grey.shade200,
      );
    }
    
    if (_manualLocationReason != null) {
      return Chip(
        label: const Text('Manual Location', style: TextStyle(color: Colors.white), overflow: TextOverflow.ellipsis, maxLines: 1),
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
        label: Text(label, style: const TextStyle(color: Colors.white), overflow: TextOverflow.ellipsis, maxLines: 1),
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
        title: const Text('Step 1 of 6: Patient Basics', style: TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
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
                  const SizedBox(width: 16),
                  Expanded(
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: _buildGpsStatusChip(),
                    ),
                  ),
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
                    TextField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        labelText: 'Patient Name (or local ID)',
                        prefixIcon: Icon(Icons.badge, color: accentColor),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        filled: true,
                        fillColor: bgColor,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _ageController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Age',
                              prefixIcon: Icon(Icons.cake, color: accentColor),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              filled: true,
                              fillColor: bgColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            isExpanded: true,
                            value: _gender,
                            hint: Text(
                              'Select Gender',
                              style: TextStyle(color: const Color(0xFF1D2321).withOpacity(0.5)),
                            ),
                            decoration: InputDecoration(
                              labelText: 'Gender',
                              prefixIcon: Icon(Icons.wc, color: accentColor),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              filled: true,
                              fillColor: bgColor,
                            ),
                            items: ['Male', 'Female', 'Other']
                                .map((s) => DropdownMenuItem(
                                  value: s, 
                                  child: Text(s, overflow: TextOverflow.ellipsis),
                                ))
                                .toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _gender = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: _village,
                      decoration: InputDecoration(
                        labelText: 'Village / PHC',
                        prefixIcon: Icon(Icons.location_on, color: accentColor),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        filled: true,
                        fillColor: bgColor,
                      ),
                      items: villages.map((v) => DropdownMenuItem(
                        value: v, 
                        child: Text(v, overflow: TextOverflow.ellipsis),
                      )).toList(),
                      onChanged: (val) => setState(() => _village = val),
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: _contactController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                      onChanged: (val) {
                        if (_contactError != null) setState(() => _contactError = null);
                      },
                      decoration: InputDecoration(
                        labelText: 'Contact Number (Optional)',
                        errorText: _contactError,
                        prefixIcon: Icon(Icons.call, color: accentColor),
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
                  final age = int.tryParse(_ageController.text);
                  final name = _nameController.text.trim();
                  final contact = _contactController.text.trim();
                  
                  if (contact.isNotEmpty && contact.length < 10) {
                    setState(() => _contactError = 'Enter a complete 10-digit number');
                    return;
                  }
                  
                  if (age != null && _village != null && _gender != null && name.isNotEmpty) {
                    ref.read(reportDraftProvider.notifier).updateBasics(
                      patientName: name,
                      age: age,
                      sex: _gender!,
                      contactNumber: contact.isEmpty ? null : contact,
                      village: _village!,
                    );
                    ref.read(reportDraftProvider.notifier).updateLocation(
                      lat: _location?.latitude,
                      lng: _location?.longitude,
                      accuracy: _location?.accuracy,
                      reason: _manualLocationReason,
                    );
                    context.push('/report/medical-background');
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
                    child: Text('Continue to Medical Background', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
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
