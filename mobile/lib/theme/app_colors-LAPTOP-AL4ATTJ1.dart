import 'package:flutter/material.dart';

class AppColors {
  // Primary (Deep Teal / Blue)
  static const Color primary = Color(0xFF1A5F7A); 
  static const Color primaryLight = Color(0xFF2C7D9E);
  static const Color primaryDark = Color(0xFF104052);

  // Background (Soft blue-gray / pale mint)
  static const Color background = Color(0xFFF2F6F7); // Soft blue-gray
  static const Color surface = Color(0xFFFFFFFF); // Clean white for cards

  // Text
  static const Color textPrimary = Color(0xFF1E293B); 
  static const Color textSecondary = Color(0xFF64748B); // Muted slate gray
  static const Color textDisabled = Color(0xFF94A3B8); 

  // Borders
  static const Color border = Color(0xFFE2DFD8);

  // Status/Pill Colors from reference
  static const Color pillLow = Color(0xFF83A697);
  static const Color pillRem = Color(0xFFD9936B);
  static const Color pillInsomniac = Color(0xFF2E2E2E);
  
  // Risk Taxonomy Colors (loaded from shared-spec/design-system.json - UNCHANGED)
  static const Color riskGreen = Color(0xFF16A34A);
  static const Color riskAmber = Color(0xFFF59E0B);
  static const Color riskRed = Color(0xFFDC2626);

  static Color getRiskTier(double score) {
    if (score >= 0.70) return riskRed;
    if (score >= 0.35) return riskAmber;
    return riskGreen;
  }
}
