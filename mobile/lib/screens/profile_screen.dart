import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/providers.dart';
import '../theme/app_colors.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mockData = ref.watch(mockDataProvider);
    final profile = mockData.getWorkerProfile();

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          const CircleAvatar(
            radius: 40,
            backgroundColor: AppColors.primary,
            child: Icon(Icons.person, size: 40, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            profile['name'],
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          Text(
            profile['id'],
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 32),
          Card(
            child: ListTile(
              leading: const Icon(Icons.location_on, color: AppColors.primary),
              title: const Text('Primary Health Center'),
              subtitle: Text('${profile['phc']}, ${profile['district']}'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.bar_chart, color: AppColors.primary),
              title: const Text('Reports This Week'),
              trailing: Text(
                '${profile['reportsThisWeek']}',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.language, color: AppColors.primary),
              title: const Text('Language'),
              trailing: DropdownButton<String>(
                value: 'English',
                items: const [
                  DropdownMenuItem(value: 'English', child: Text('English')),
                  DropdownMenuItem(value: 'Hindi', child: Text('Hindi')),
                ],
                onChanged: (_) {},
              ),
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.surface,
              foregroundColor: AppColors.riskRed,
              side: const BorderSide(color: AppColors.riskRed),
            ),
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
            onPressed: () {
              context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}
