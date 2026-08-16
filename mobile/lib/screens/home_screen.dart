import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/providers.dart';
import '../models/models.dart';
import 'package:go_router/go_router.dart';
import '../widgets/animated_scale_button.dart' as import_scale_btn;

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  void _showSOSDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFFFFFDF8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.red, size: 32),
              SizedBox(width: 8),
              Text('Emergency SOS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
            ],
          ),
          content: const Text(
            'This will alert supervisors and nearby medical staff. Are you sure you want to trigger an SOS?',
            style: TextStyle(color: Color(0xFF1D2321), fontSize: 16),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Color(0xFF5B6663), fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('SOS Alert Sent!'),
                    backgroundColor: Colors.red,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              child: const Text('Trigger SOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);
    
    final mockData = ref.watch(mockDataProvider);
    final profile = mockData.getWorkerProfile();
    final pendingReports = ref.watch(pendingReportsProvider);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Arogya Prahari', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321))),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: accentColor),
            onPressed: () {},
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Good Morning,\n${profile['name'].split(" ")[0]}',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1D2321),
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 32),
              
              // Quick Stats
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: surfaceColor,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: accentColor.withOpacity(0.1), shape: BoxShape.circle),
                            child: const Icon(Icons.bar_chart, color: accentColor),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            '${profile['reportsThisWeek']}',
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: accentColor),
                          ),
                          const SizedBox(height: 4),
                          const Text('Reports\nThis Week', style: TextStyle(color: Color(0xFF5B6663), fontSize: 14)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: surfaceColor,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), shape: BoxShape.circle),
                            child: const Icon(Icons.sync_problem, color: Colors.orange),
                          ),
                          const SizedBox(height: 16),
                          pendingReports.when(
                            data: (reports) => Text(
                              '${reports.where((r) => r.syncStatus != SyncStatus.synced).length}',
                              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.orange),
                            ),
                            loading: () => const Text('-', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.orange)),
                            error: (_, __) => const Text('!', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.red)),
                          ),
                          const SizedBox(height: 4),
                          const Text('Pending\nSync', style: TextStyle(color: Color(0xFF5B6663), fontSize: 14)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),
              
              import_scale_btn.AnimatedScaleButton(
                onPressed: () {
                  context.push('/report');
                },
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                        child: const Icon(Icons.add, color: Colors.white),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('New Report', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
                            SizedBox(height: 4),
                            Text('Start a new patient triage', style: TextStyle(color: Colors.white70, fontSize: 14)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),
              
              // SOS Button
              import_scale_btn.AnimatedScaleButton(
                onPressed: () => _showSOSDialog(context),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 28),
                      const SizedBox(width: 12),
                      const Text('Emergency SOS', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 18)),
                    ],
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
