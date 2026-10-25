import 'package:flutter/material.dart';

class EhrjLoadingSkeleton extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const EhrjLoadingSkeleton({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8.0,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.08)
            : Colors.black.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

class EhrjCardSkeleton extends StatelessWidget {
  const EhrjCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const EhrjLoadingSkeleton(
                width: 40,
                height: 40,
                borderRadius: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    EhrjLoadingSkeleton(width: 140, height: 14),
                    SizedBox(height: 6),
                    EhrjLoadingSkeleton(width: 90, height: 10),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const EhrjLoadingSkeleton(width: double.infinity, height: 12),
          const SizedBox(height: 6),
          const EhrjLoadingSkeleton(width: 200, height: 12),
        ],
      ),
    );
  }
}
