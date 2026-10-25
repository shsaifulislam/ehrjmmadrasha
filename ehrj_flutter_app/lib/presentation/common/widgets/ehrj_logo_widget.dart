import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';

class EhrjLogoWidget extends StatelessWidget {
  final double size;
  final bool showBorder;

  const EhrjLogoWidget({super.key, this.size = 64.0, this.showBorder = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        border: showBorder
            ? Border.all(color: AppColors.gold, width: 2.5)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipOval(
        child: Image.asset(
          'assets/images/logo.jpg',
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              color: AppColors.primary,
              alignment: Alignment.center,
              child: Text(
                'EHRJ',
                style: TextStyle(
                  color: AppColors.gold,
                  fontWeight: FontWeight.bold,
                  fontSize: size * 0.28,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
