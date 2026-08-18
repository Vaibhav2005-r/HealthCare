import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import 'dart:convert';
import 'api_service.dart';

class AuthState {
  final bool isAuthenticated;
  final bool hasPinSetup;
  final String? phoneNumber;
  final String? role;
  final Map<String, dynamic>? workerProfile;

  AuthState({
    this.isAuthenticated = false,
    this.hasPinSetup = false,
    this.phoneNumber,
    this.role,
    this.workerProfile,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? hasPinSetup,
    String? phoneNumber,
    String? role,
    Map<String, dynamic>? workerProfile,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      hasPinSetup: hasPinSetup ?? this.hasPinSetup,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      role: role ?? this.role,
      workerProfile: workerProfile ?? this.workerProfile,
    );
  }
}

class AuthService extends StateNotifier<AuthState> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final LocalAuthentication _localAuth = LocalAuthentication();
  final ApiService _apiService = ApiService();

  AuthService() : super(AuthState()) {
    _init();
  }

  Future<void> _init() async {
    try {
      final sessionData = await _storage.read(key: 'asha_session_token');
      final storedPin = await _storage.read(key: 'user_pin');
      
      if (sessionData != null) {
        final data = jsonDecode(sessionData);
        final phone = data['phone'] as String?;
        Map<String, dynamic>? worker = data['worker'] as Map<String, dynamic>?;

        // Refresh profile from Supabase if online
        if (phone != null && phone.isNotEmpty) {
          try {
            worker = await _apiService.fetchWorkerProfile(phone: phone);
          } catch (_) {}
        }

        state = state.copyWith(
          isAuthenticated: true,
          hasPinSetup: storedPin != null,
          phoneNumber: phone,
          role: worker?['role'] ?? data['role'],
          workerProfile: worker,
        );
      }
    } catch (e) {
      // ignore storage errors on web/desktop
    }
  }

  Future<String?> sendOtp(String phone, String role) async {
    try {
      final res = await _apiService.login(phone);
      final worker = res['worker'] as Map<String, dynamic>?;
      state = state.copyWith(
        phoneNumber: phone,
        role: worker?['role'] ?? role,
        workerProfile: worker,
      );
      return null;
    } on ApiException catch (e) {
      return e.body;
    } catch (e) {
      return 'Unable to verify registration in IDSP database: $e';
    }
  }

  Future<String?> verifyOtp(String otp) async {
    if (otp.length < 4) {
      return 'Please enter a valid 4-6 digit OTP';
    }
    try {
      final phone = state.phoneNumber ?? '';
      final res = await _apiService.verifyOtp(phone, otp);
      final worker = res['worker'] as Map<String, dynamic>? ?? {};
      
      final sessionData = jsonEncode({
        'phone': phone,
        'role': worker['role'] ?? state.role ?? 'asha',
        'token': res['token'] ?? 'token_${DateTime.now().millisecondsSinceEpoch}',
        'worker': worker,
      });

      try {
        await _storage.write(key: 'asha_session_token', value: sessionData);
      } catch (_) {}

      state = state.copyWith(
        isAuthenticated: true,
        workerProfile: worker,
        role: worker['role'] ?? state.role,
      );
      return null;
    } on ApiException catch (e) {
      return e.body;
    } catch (e) {
      return 'Authentication failed: $e';
    }
  }

  Future<void> setupPin(String pin) async {
    try {
      await _storage.write(key: 'user_pin', value: pin);
    } catch (e) {
      // Ignore secure storage errors on some platforms
    }
    state = state.copyWith(hasPinSetup: true);
  }

  Future<bool> verifyPin(String pin) async {
    try {
      final storedPin = await _storage.read(key: 'user_pin');
      return storedPin == pin || storedPin == null;
    } catch (e) {
      return true; // Fallback for platforms where storage throws
    }
  }

  Future<bool> authenticateWithBiometrics() async {
    try {
      final isAvailable = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();

      if (!isAvailable || !isDeviceSupported) {
        return false;
      }

      return await _localAuth.authenticate(
        localizedReason: 'Unlock Arogya Prahari',
      );
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _storage.delete(key: 'asha_session_token');
      await _storage.delete(key: 'user_pin');
    } catch (_) {}
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthService, AuthState>((ref) {
  return AuthService();
});
