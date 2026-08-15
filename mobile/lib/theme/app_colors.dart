import 'package:flutter/material.dart';

class AppColors {
  // Primary
  static const Color primary = Color(0xFF0891B2); // Cyan 600
  static const Color primaryLight = Color(0xFF22D3EE);
  static const Color primaryDark = Color(0xFF155E75);

  // Background
  static const Color background = Color(0xFFF8FAFC); // Slate 50
  static const Color surface = Colors.white;

  // Text
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900
  static const Color textSecondary = Color(0xFF64748B); // Slate 500
  static const Color textDisabled = Color(0xFF94A3B8); // Slate 400

  // Borders
  static const Color border = Color(0xFFE2E8F0); // Slate 200

  // Risk Taxonomy Colors (loaded from shared-spec/design-system.json)
  static const Color riskGreen = Color(0xFF16A34A);
  static const Color riskAmber = Color(0xFFF59E0B);
  static const Color riskRed = Color(0xFFDC2626);

  static Color getRiskTier(double score) {
    if (score >= 0.70) return riskRed;
    if (score >= 0.35) return riskAmber;
    return riskGreen;
  }
}
