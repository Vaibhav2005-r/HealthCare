import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/providers.dart';
import '../theme/app_colors.dart';
import '../widgets/animated_scale_button.dart' as import_scale_btn;

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mockData = ref.watch(mockDataProvider);
    final profile = mockData.getWorkerProfile();

    const bgColor = Color(0xFFF5F0E8);
    const accentColor = Color(0xFF1A5F7A);
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D2321))),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
        children: [
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: bgColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: accentColor.withOpacity(0.2), width: 3),
                  ),
                  child: const CircleAvatar(
                    radius: 48,
                    backgroundColor: accentColor,
                    child: Icon(Icons.person, size: 48, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  profile['name'],
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1D2321)),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.bolt, size: 16, color: Colors.orange),
                    const SizedBox(width: 4),
                    const Text('88% Efficiency', style: TextStyle(color: Color(0xFF5B6663), fontWeight: FontWeight.w600)),
                    const SizedBox(width: 8),
                    Container(width: 1, height: 12, color: Colors.black12),
                    const SizedBox(width: 8),
                    const Text('Pro Member', style: TextStyle(color: Color(0xFF5B6663), fontWeight: FontWeight.w600)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 48),
          const Text(
            'Account Details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1D2321),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            margin: EdgeInsets.zero,
            elevation: 0,
            color: surfaceColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Column(
                children: [
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: accentColor.withOpacity(0.1), shape: BoxShape.circle),
                      child: const Icon(Icons.badge_outlined, color: accentColor),
                    ),
                    title: const Text('Worker ID', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(profile['id']),
                  ),
                  const Divider(color: Colors.black12, indent: 64),
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: accentColor.withOpacity(0.1), shape: BoxShape.circle),
                      child: const Icon(Icons.location_on_outlined, color: accentColor),
                    ),
                    title: const Text('Primary Health Center', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${profile['phc']}, ${profile['district']}'),
                  ),
                  const Divider(color: Colors.black12, indent: 64),
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: accentColor.withOpacity(0.1), shape: BoxShape.circle),
                      child: const Icon(Icons.bar_chart_outlined, color: accentColor),
                    ),
                    title: const Text('Reports This Week', style: TextStyle(fontWeight: FontWeight.bold)),
                    trailing: Text(
                      '${profile['reportsThisWeek']}',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: accentColor),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Card(
            margin: EdgeInsets.zero,
            elevation: 0,
            color: surfaceColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: accentColor.withOpacity(0.1), shape: BoxShape.circle),
                  child: const Icon(Icons.language, color: accentColor),
                ),
                title: const Text('Language', style: TextStyle(fontWeight: FontWeight.bold)),
                trailing: DropdownButton<String>(
                  value: 'English',
                  underline: const SizedBox(),
                  icon: const Icon(Icons.expand_more, color: Color(0xFF5B6663)),
                  items: const [
                    DropdownMenuItem(value: 'English', child: Text('English', style: TextStyle(fontWeight: FontWeight.w600))),
                    DropdownMenuItem(value: 'Hindi', child: Text('Hindi', style: TextStyle(fontWeight: FontWeight.w600))),
                  ],
                  onChanged: (_) {},
                ),
              ),
            ),
          ),
          const SizedBox(height: 48),
          import_scale_btn.AnimatedScaleButton(
            onPressed: () {
              context.go('/login');
            },
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF5B6663).withOpacity(0.3), width: 1.5),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout, color: Color(0xFF5B6663)),
                  const SizedBox(width: 8),
                  Text('Logout', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF5B6663))),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
