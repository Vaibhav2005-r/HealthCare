import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import 'dart:convert';

class AuthState {
  final bool isAuthenticated;
  final bool hasPinSetup;
  final String? phoneNumber;
  final String? role;

  AuthState({
    this.isAuthenticated = false,
    this.hasPinSetup = false,
    this.phoneNumber,
    this.role,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? hasPinSetup,
    String? phoneNumber,
    String? role,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      hasPinSetup: hasPinSetup ?? this.hasPinSetup,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      role: role ?? this.role,
    );
  }
}

class AuthService extends StateNotifier<AuthState> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final LocalAuthentication _localAuth = LocalAuthentication();

  AuthService() : super(AuthState()) {
    _init();
  }

  Future<void> _init() async {
    final sessionData = await _storage.read(key: 'mock_session');
    final storedPin = await _storage.read(key: 'user_pin');
    
    if (sessionData != null) {
      try {
        final data = jsonDecode(sessionData);
        state = state.copyWith(
          isAuthenticated: true,
          hasPinSetup: storedPin != null,
          phoneNumber: data['phone'],
          role: data['role'],
        );
      } catch (e) {
        // ignore JSON errors
      }
    }
  }

  Future<void> sendOtp(String phone, String role) async {
    // Mock network delay
    await Future.delayed(const Duration(seconds: 1));
    state = state.copyWith(phoneNumber: phone, role: role);
  }

  Future<bool> verifyOtp(String otp) async {
    // Mock verify
    await Future.delayed(const Duration(seconds: 1));
    if (otp.length >= 4 && otp.length <= 6) {
      // Save session
      final sessionData = jsonEncode({
        'phone': state.phoneNumber,
        'role': state.role,
        'token': 'mock_token_${DateTime.now().millisecondsSinceEpoch}'
      });
      await _storage.write(key: 'mock_session', value: sessionData);
      state = state.copyWith(isAuthenticated: true);
      return true;
    }
    return false;
  }

  Future<void> setupPin(String pin) async {
    await _storage.write(key: 'user_pin', value: pin);
    state = state.copyWith(hasPinSetup: true);
  }

  Future<bool> verifyPin(String pin) async {
    final storedPin = await _storage.read(key: 'user_pin');
    return storedPin == pin;
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
        // Fallback for different local_auth versions
      );
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'mock_session');
    await _storage.delete(key: 'user_pin');
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthService, AuthState>((ref) {
  return AuthService();
});
