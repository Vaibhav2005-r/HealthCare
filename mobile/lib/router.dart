import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';

import 'screens/login_screen.dart';
import 'screens/home_shell.dart';
import 'screens/report/patient_basics_screen.dart';
import 'screens/report/symptoms_screen.dart';
import 'screens/report/duration_onset_screen.dart';
import 'screens/report/review_screen.dart';
import 'screens/triage_result_screen.dart';
import 'screens/sync_screen.dart';
import 'screens/assistant_screen.dart';
import 'screens/profile_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) {
        return HomeShell(child: child);
      },
      routes: [
        GoRoute(
          path: '/report',
          builder: (context, state) => const PatientBasicsScreen(),
          routes: [
            GoRoute(
              path: 'symptoms',
              builder: (context, state) => const SymptomsScreen(),
            ),
            GoRoute(
              path: 'duration',
              builder: (context, state) => const DurationOnsetScreen(),
            ),
            GoRoute(
              path: 'review',
              builder: (context, state) => const ReviewScreen(),
            ),
          ]
        ),
        GoRoute(
          path: '/assistant',
          builder: (context, state) => const AssistantScreen(),
        ),
        GoRoute(
          path: '/sync',
          builder: (context, state) => const SyncScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),
    GoRoute(
      path: '/triage-result',
      builder: (context, state) => const TriageResultScreen(),
    ),
  ],
);
