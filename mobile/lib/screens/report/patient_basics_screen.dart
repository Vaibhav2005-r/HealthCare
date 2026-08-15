import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';
import '../../providers/report_draft_provider.dart';

class PatientBasicsScreen extends ConsumerStatefulWidget {
  const PatientBasicsScreen({super.key});

  @override
  ConsumerState<PatientBasicsScreen> createState() => _PatientBasicsScreenState();
}

class _PatientBasicsScreenState extends ConsumerState<PatientBasicsScreen> {
  final _ageController = TextEditingController();
  String _sex = 'Male';
  String? _village;

  @override
  Widget build(BuildContext context) {
    final mockData = ref.watch(mockDataProvider);
    final villages = mockData.getVillages();

    return Scaffold(
      appBar: AppBar(title: const Text('Patient Basics')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _ageController,
              decoration: const InputDecoration(labelText: 'Age (Years)'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _sex,
              decoration: const InputDecoration(labelText: 'Sex'),
              items: ['Male', 'Female', 'Other']
                  .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                  .toList(),
              onChanged: (val) {
                setState(() => _sex = val!);
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _village,
              decoration: const InputDecoration(labelText: 'Village / PHC'),
              items: villages
                  .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                  .toList(),
              onChanged: (val) {
                setState(() => _village = val);
              },
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                final age = int.tryParse(_ageController.text);
                if (age != null && _village != null) {
                  ref.read(reportDraftProvider.notifier).updateBasics(
                    age: age,
                    sex: _sex,
                    village: _village!,
                  );
                  context.go('/report/symptoms');
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please fill all fields')),
                  );
                }
              },
              child: const Text('Next: Symptoms'),
            ),
          ],
        ),
      ),
    );
  }
}
