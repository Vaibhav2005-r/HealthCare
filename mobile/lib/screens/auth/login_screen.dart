import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../services/auth_service.dart';
import '../../widgets/animated_scale_button.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController();
  String? _selectedRole;
  String? _phoneError;
  bool _isLoading = false;

  final List<String> _roles = [
    'ASHA Worker',
    'ANM',
    'PHC Supervisor'
  ];

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) return;
    if (phone.length < 10) {
      setState(() => _phoneError = 'Enter a valid 10-digit phone number');
      return;
    }
    setState(() {
      _phoneError = null;
      _isLoading = true;
    });

    final error = await ref.read(authProvider.notifier).sendOtp(phone, _selectedRole ?? 'ASHA Worker');
    if (!mounted) return;

    setState(() => _isLoading = false);

    if (error != null) {
      setState(() => _phoneError = error);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    context.push('/otp');
  }

  @override
  Widget build(BuildContext context) {
    const bgColor = Color(0xFFF5F0E8); // Cream background
    const accentColor = Color(0xFF1A5F7A); // Medical Blue
    const surfaceColor = Color(0xFFFFFDF8);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 48.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              // Logo Badge
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: accentColor.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.health_and_safety,
                    size: 40,
                    color: accentColor,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Welcome to\nArogya Prahari',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1D2321),
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Enter your details to continue',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xFF5B6663),
                ),
              ),
              const SizedBox(height: 48),
              
              // Phone Input
              Container(
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(10),
                  ],
                  onChanged: (val) {
                    if (_phoneError != null) setState(() => _phoneError = null);
                  },
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  decoration: InputDecoration(
                    labelText: 'Phone Number',
                    labelStyle: TextStyle(color: const Color(0xFF1D2321).withOpacity(0.5)),
                    errorText: _phoneError,
                    prefixIcon: Icon(Icons.phone, color: accentColor),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: surfaceColor,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              
              // Role Dropdown
              Container(
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedRole,
                    hint: Text(
                      'Select Your Role',
                      style: TextStyle(
                        fontSize: 16,
                        color: const Color(0xFF1D2321).withOpacity(0.5),
                        fontWeight: FontWeight.normal,
                      ),
                    ),
                    isExpanded: true,
                    icon: const Icon(Icons.arrow_drop_down, color: accentColor),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF1D2321)),
                    items: _roles.map((role) {
                      return DropdownMenuItem(
                        value: role,
                        child: Row(
                          children: [
                            const Icon(Icons.badge, color: accentColor, size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                role,
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _selectedRole = val);
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(height: 48),
              
              AnimatedScaleButton(
                onPressed: _isLoading ? () {} : _handleLogin,
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text(
                            'Send OTP',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock, size: 14, color: const Color(0xFF5B6663).withOpacity(0.8)),
                  const SizedBox(width: 6),
                  Text(
                    'Secure · Works Offline',
                    style: TextStyle(
                      fontSize: 14,
                      color: const Color(0xFF5B6663).withOpacity(0.8),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
