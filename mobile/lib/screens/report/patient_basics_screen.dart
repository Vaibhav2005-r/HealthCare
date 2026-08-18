import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';
import '../../providers/report_draft_provider.dart';
import '../../providers/language_provider.dart';
import '../../services/location_service.dart';
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
    try {
      final locService = ref.read(locationServiceProvider);
      final loc = await locService.getCurrentLocation();
      
      if (mounted) {
        setState(() {
          _location = loc ?? LocationData(
            latitude: 18.5204,
            longitude: 73.8567,
            accuracy: 12.0,
          );
          _isGettingLocation = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _location = LocationData(
            latitude: 18.5204,
            longitude: 73.8567,
            accuracy: 12.0,
          );
          _isGettingLocation = false;
        });
      }
    }
  }

  void _promptManualLocation() {
    final lang = ref.read(languageProvider.notifier);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        String selectedReason = 'GPS Indoor Blindspot';
        return AlertDialog(
          title: Text(lang.translate('gps_active')),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                lang.translate('archive_desc'),
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedReason,
                items: const [
                  DropdownMenuItem(value: 'GPS Indoor Blindspot', child: Text('Indoor Blindspot / घरामध्ये')),
                  DropdownMenuItem(value: 'Heavy Tree Canopy / Valley', child: Text('Canopy/Valley / डोंगराळ भाग')),
                  DropdownMenuItem(value: 'Device Sensor Timeout', child: Text('Sensor Timeout / वेळ संपला')),
                  DropdownMenuItem(value: 'User Denied Fine Permission', child: Text('Permission Denied / परवानगी नाही')),
                ],
                onChanged: (val) => selectedReason = val!,
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                setState(() => _manualLocationReason = selectedReason);
                Navigator.pop(ctx);
              },
              child: Text(lang.translate('next_btn')),
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
    final lang = ref.read(languageProvider.notifier);
    if (_isGettingLocation) {
      return Chip(
        label: const Text('GPS...', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.grey,
        avatar: const SizedBox(
          width: 16,
          height: 16,
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
        ),
      );
    }
    
    if (_manualLocationReason != null) {
      return ActionChip(
        onPressed: _promptManualLocation,
        label: const Text('Manual GPS', style: TextStyle(color: Colors.white), overflow: TextOverflow.ellipsis, maxLines: 1),
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
        label = lang.translate('gps_active');
      } else if (acc <= 30) {
        color = Colors.orange;
        label = lang.translate('gps_active');
      } else {
        color = Colors.blueGrey;
        label = lang.translate('gps_active');
      }
      return ActionChip(
        onPressed: _promptManualLocation,
        label: Text(label, style: const TextStyle(color: Colors.white), overflow: TextOverflow.ellipsis, maxLines: 1),
        backgroundColor: color,
        avatar: const Icon(Icons.location_on, color: Colors.white, size: 16),
      );
    }
    
    return ActionChip(
      onPressed: _promptManualLocation,
      label: const Text('Offline Loc', style: TextStyle(color: Colors.white), overflow: TextOverflow.ellipsis, maxLines: 1),
      backgroundColor: Colors.grey,
      avatar: const Icon(Icons.location_off, color: Colors.white, size: 16),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider.notifier);
    ref.watch(languageProvider);
    final villagesAsync = ref.watch(villagesProvider);
    final villages = villagesAsync.maybeWhen(
      data: (v) => v,
      orElse: () => [
        'Khed', 'Manchar', 'Junnar', 'Shirur', 'Ambegaon',
        'Wagholi', 'Hadapsar Rural', 'Trimbak Rural', 'Igatpuri',
        'Sinnar', 'Kalyan Rural', 'Karveer Rural', 'Ramtek', 'Paithan Rural', 'Pandharpur Rural'
      ],
    );
    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: Text(lang.translate('step_1_title'), style: const TextStyle(fontSize: 16, color: Color(0xFF5B6663))),
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
                        color: index == 0 ? accentColor : Colors.grey.withValues(alpha: 0.3),
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
                    lang.translate('step_1_title'),
                    style: const TextStyle(
                      fontSize: 20,
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
                      color: Colors.black.withValues(alpha: 0.02),
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
                        labelText: lang.translate('patient_name'),
                        prefixIcon: const Icon(Icons.badge, color: accentColor),
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
                              labelText: lang.translate('age'),
                              prefixIcon: const Icon(Icons.cake, color: accentColor),
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
                            value: _sex,
                            decoration: InputDecoration(
                              labelText: lang.translate('gender'),
                              prefixIcon: const Icon(Icons.wc, color: accentColor),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              filled: true,
                              fillColor: bgColor,
                            ),
                            items: [
                              DropdownMenuItem(value: 'Male', child: Text(lang.translate('male'), overflow: TextOverflow.ellipsis)),
                              DropdownMenuItem(value: 'Female', child: Text(lang.translate('female'), overflow: TextOverflow.ellipsis)),
                              DropdownMenuItem(value: 'Other', child: Text(lang.translate('other'), overflow: TextOverflow.ellipsis)),
                            ],
                            onChanged: (val) => setState(() => _sex = val!),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: _village,
                      decoration: InputDecoration(
                        labelText: lang.translate('village_phc'),
                        prefixIcon: const Icon(Icons.location_on, color: accentColor),
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
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: lang.translate('contact_number'),
                        prefixIcon: const Icon(Icons.call, color: accentColor),
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
                  if (age != null && _village != null && name.isNotEmpty) {
                    ref.read(reportDraftProvider.notifier).updateBasics(
                      patientName: name,
                      age: age,
                      sex: _sex,
                      contactNumber: _contactController.text.trim().isEmpty ? null : _contactController.text.trim(),
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
                      const SnackBar(
                        content: Text('Please fill all required fields / सर्व आवश्यक माहिती भरा'),
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
                  child: Center(
                    child: Text(
                      lang.translate('next_btn'),
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
