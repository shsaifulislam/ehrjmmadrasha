import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings_bn.dart';

enum BadgeType {
  present,
  absent,
  leave,
  late,
  paid,
  unpaid,
  draft,
  synced,
  pendingSync,
  info,
}

class EhrjStatusBadge extends StatelessWidget {
  final BadgeType type;
  final String? customLabel;

  const EhrjStatusBadge({
    super.key,
    this.type = BadgeType.info,
    this.customLabel,
    String? status,
    String? text,
  }) : _statusString = status,
       _textString = text;

  final String? _statusString;
  final String? _textString;

  BadgeType _resolveType() {
    if (_statusString != null) {
      final s = _statusString.toUpperCase();
      if (s.contains('ACTIVE') || s.contains('PASS') || s.contains('APPROV')) {
        return BadgeType.present;
      }
      if (s.contains('FAIL') || s.contains('REJECT') || s.contains('SUSPEND')) {
        return BadgeType.absent;
      }
      if (s.contains('PENDING') || s.contains('WAIT')) {
        return BadgeType.pendingSync;
      }
    }
    return type;
  }

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;
    IconData icon;

    final resolvedType = _resolveType();
    final effectiveLabel = _textString ?? customLabel;

    switch (resolvedType) {
      case BadgeType.info:
        bg = AppColors.primaryContainer.withValues(alpha: 0.2);
        fg = AppColors.primary;
        label = effectiveLabel ?? 'বিজ্ঞপ্তি';
        icon = Icons.info_outline_rounded;
        break;
      case BadgeType.present:
        bg = AppColors.present.withValues(alpha: 0.12);
        fg = AppColors.present;
        label = effectiveLabel ?? AppStringsBn.statusPresent;
        icon = Icons.check_circle_rounded;
        break;
      case BadgeType.absent:
        bg = AppColors.absent.withValues(alpha: 0.12);
        fg = AppColors.absent;
        label = customLabel ?? AppStringsBn.statusAbsent;
        icon = Icons.cancel_rounded;
        break;
      case BadgeType.leave:
        bg = AppColors.leave.withValues(alpha: 0.12);
        fg = AppColors.leave;
        label = customLabel ?? AppStringsBn.statusLeave;
        icon = Icons.event_busy_rounded;
        break;
      case BadgeType.late:
        bg = AppColors.late.withValues(alpha: 0.12);
        fg = AppColors.late;
        label = customLabel ?? AppStringsBn.statusLate;
        icon = Icons.access_time_filled_rounded;
        break;
      case BadgeType.paid:
        bg = AppColors.paid.withValues(alpha: 0.12);
        fg = AppColors.paid;
        label = customLabel ?? AppStringsBn.statusPaid;
        icon = Icons.verified_rounded;
        break;
      case BadgeType.unpaid:
        bg = AppColors.unpaid.withValues(alpha: 0.12);
        fg = AppColors.unpaid;
        label = customLabel ?? AppStringsBn.statusUnpaid;
        icon = Icons.error_outline_rounded;
        break;
      case BadgeType.draft:
        bg = Colors.grey.withValues(alpha: 0.15);
        fg = Colors.black87;
        label = customLabel ?? AppStringsBn.statusDraft;
        icon = Icons.edit_note_rounded;
        break;
      case BadgeType.synced:
        bg = AppColors.synced.withValues(alpha: 0.12);
        fg = AppColors.synced;
        label = customLabel ?? 'সিঙ্কড';
        icon = Icons.cloud_done_rounded;
        break;
      case BadgeType.pendingSync:
        bg = AppColors.pendingSync.withValues(alpha: 0.12);
        fg = AppColors.pendingSync;
        label = customLabel ?? 'সিঙ্ক বাকি';
        icon = Icons.cloud_upload_rounded;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: fg.withValues(alpha: 0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: fg),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: fg,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
