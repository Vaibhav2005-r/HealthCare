import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';

class HomeShell extends ConsumerWidget {
  final Widget child;

  const HomeShell({super.key, required this.child});

  int _calculateSelectedIndex(BuildContext context) {
    final String location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/report')) return 0;
    if (location.startsWith('/assistant')) return 1;
    if (location.startsWith('/sync')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/report');
        break;
      case 1:
        context.go('/assistant');
        break;
      case 2:
        context.go('/sync');
        break;
      case 3:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingReportsProvider);
    final int pendingCount = pendingAsync.maybeWhen(
      data: (reports) => reports.where((r) => r.syncStatus != SyncStatus.synced).length,
      orElse: () => 0,
    );

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _calculateSelectedIndex(context),
        onTap: (index) => _onItemTapped(index, context),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textDisabled,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.add_circle_outline),
            activeIcon: Icon(Icons.add_circle),
            label: 'Report',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.auto_awesome_outlined),
            activeIcon: Icon(Icons.auto_awesome),
            label: 'Assistant',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              isLabelVisible: pendingCount > 0,
              label: Text(pendingCount.toString()),
              child: const Icon(Icons.sync_outlined),
            ),
            activeIcon: Badge(
              isLabelVisible: pendingCount > 0,
              label: Text(pendingCount.toString()),
              child: const Icon(Icons.sync),
            ),
            label: 'Sync',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
