import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'theme/app_theme.dart';
import 'router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  runApp(
    const ProviderScope(
      child: SmartHealthApp(),
    ),
  );
}

class SmartHealthApp extends ConsumerWidget {
  const SmartHealthApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Smart Health',
      theme: appTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        if (kIsWeb) {
          return Container(
            color: const Color(0xFFE5E5E5), // Neutral outer background
            child: Center(
              child: Container(
                width: 430,
                height: 900,
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  color: appTheme.scaffoldBackgroundColor,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: child!,
              ),
            ),
          );
        }
        return child!;
      },
    );
  }
}
