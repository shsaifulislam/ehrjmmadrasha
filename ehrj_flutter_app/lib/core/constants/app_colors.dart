import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary Islamic Forest Green Brand Palette
  static const Color primary = Color(0xFF0D5C3A);
  static const Color primaryDark = Color(0xFF083D26);
  static const Color primaryLight = Color(0xFF167C50);
  static const Color primaryContainer = Color(0xFFE6F4ED);

  // Gold / Amber Islamic Accents
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldDark = Color(0xFFB89320);
  static const Color goldLight = Color(0xFFFBF4DC);

  // Modern Accent Aliases
  static const Color accent = gold;
  static const Color accentDark = goldDark;
  static const Color accentLight = goldLight;

  // Background & Neutral Surfaces
  static const Color bgLight = Color(0xFFF9F8F3); // Warm ivory
  static const Color bgDark = Color(0xFF111714); // Deep forest midnight
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1A2420);
  static const Color cardBorderLight = Color(0xFFE2E8F0);
  static const Color cardBorderDark = Color(0xFF2C3B34);

  // Text Colors
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF475569);
  static const Color textMutedLight = Color(0xFF64748B);
  static const Color textMuted = textMutedLight;
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFFCBD5E1);
  static const Color textMutedDark = Color(0xFF94A3B8);

  // Academic Status Indicators
  static const Color present = Color(0xFF15803D); // Green
  static const Color absent = Color(0xFFDC2626); // Red
  static const Color leave = Color(0xFFD97706); // Amber/Orange
  static const Color late = Color(0xFF2563EB); // Blue
  static const Color halfDay = Color(0xFF7C3AED); // Purple

  // Financial & Sync Indicators
  static const Color paid = Color(0xFF15803D);
  static const Color unpaid = Color(0xFFDC2626);
  static const Color partial = Color(0xFFD97706);
  static const Color synced = Color(0xFF10B981);
  static const Color pendingSync = Color(0xFFF59E0B);
  static const Color syncFailed = Color(0xFFEF4444);
}
