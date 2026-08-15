import 'package:flutter/material.dart';

class AppColors {
  // Primary (Sage Green)
  static const Color primary = Color(0xFF2D4A3E); 
  static const Color primaryLight = Color(0xFF416556);
  static const Color primaryDark = Color(0xFF1E332A);

  // Background (Cream/Beige)
  static const Color background = Color(0xFFF5F0E8); 
  static const Color surface = Color(0xFFFCFBF8); // Soft off-white for cards

  // Text
  static const Color textPrimary = Color(0xFF1A1A1A); 
  static const Color textSecondary = Color(0xFF5C6A64); // Muted gray-green
  static const Color textDisabled = Color(0xFFA3ADAA); 

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
