import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings_bn.dart';

class OfflineBanner extends StatelessWidget {
  final bool isOnline;
  final int pendingSyncCount;
  final VoidCallback? onSyncTap;

  const OfflineBanner({
    super.key,
    required this.isOnline,
    this.pendingSyncCount = 0,
    this.onSyncTap,
  });

  @override
  Widget build(BuildContext context) {
    if (isOnline && pendingSyncCount == 0) {
      return const SizedBox.shrink();
    }

    final isOfflineOnly = !isOnline;
    final color = isOfflineOnly ? AppColors.absent : AppColors.pendingSync;
    final icon = isOfflineOnly
        ? Icons.wifi_off_rounded
        : Icons.sync_problem_rounded;

    return Container(
      width: double.infinity,
      color: color,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SafeArea(
        bottom: false,
        top: false,
        child: Row(
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                isOfflineOnly
                    ? AppStringsBn.offline
                    : '$pendingSyncCount ${AppStringsBn.pendingSyncCount}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (onSyncTap != null && isOnline && pendingSyncCount > 0)
              TextButton(
                onPressed: onSyncTap,
                style: TextButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: color,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  AppStringsBn.syncNow,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
