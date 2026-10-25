import 'package:flutter/material.dart';

class ResponsiveBreakpoints {
  static const double mobileMax = 640.0;
  static const double tabletMax = 1024.0;

  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < mobileMax;

  static bool isTablet(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    return w >= mobileMax && w < tabletMax;
  }

  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= tabletMax;

  static bool isWide(BuildContext context) =>
      MediaQuery.of(context).size.width >= 1280.0;
}
