import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'services/auth_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/otp_verify_screen.dart';
import 'screens/auth/pin_setup_screen.dart';
import 'screens/auth/unlock_screen.dart';
import 'screens/home_shell.dart';
import 'screens/home_screen.dart';
import 'screens/report/patient_basics_screen.dart';
import 'screens/report/image_capture_screen.dart';
import 'screens/report/symptoms_screen.dart';
import 'screens/report/duration_onset_screen.dart';
import 'screens/report/review_screen.dart';
import 'screens/triage_result_screen.dart';
import 'screens/log_history_screen.dart';
import 'screens/assistant_screen.dart';
import 'screens/profile_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final listenable = ValueNotifier<bool>(false);
  
  ref.listen<AuthState>(authProvider, (previous, next) {
    listenable.value = !listenable.value;
  });

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: listenable,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/otp' ||
          state.matchedLocation == '/pin-setup' ||
          state.matchedLocation == '/unlock';

      if (!authState.isAuthenticated) {
        if (!isAuthRoute) return '/login';
      } else {
        if (!authState.hasPinSetup && state.matchedLocation != '/pin-setup') {
          return '/pin-setup';
        }
        if (authState.hasPinSetup && (state.matchedLocation == '/login' || state.matchedLocation == '/otp')) {
          return '/unlock';
        }
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) => const OtpVerifyScreen(),
      ),
      GoRoute(
        path: '/pin-setup',
        builder: (context, state) => const PinSetupScreen(),
      ),
      GoRoute(
        path: '/unlock',
        builder: (context, state) => const UnlockScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          return HomeShell(child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/report',
            builder: (context, state) => const PatientBasicsScreen(),
            routes: [
              GoRoute(
                path: 'image',
                builder: (context, state) => const ImageCaptureScreen(),
              ),
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
            path: '/logs',
            builder: (context, state) => const LogHistoryScreen(),
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
});
