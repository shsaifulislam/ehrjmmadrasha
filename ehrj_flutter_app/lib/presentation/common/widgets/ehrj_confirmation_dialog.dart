import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings_bn.dart';

class EhrjConfirmationDialog extends StatelessWidget {
  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final bool isDestructive;
  final VoidCallback onConfirm;

  const EhrjConfirmationDialog({
    super.key,
    required this.title,
    required this.message,
    this.confirmLabel = AppStringsBn.confirm,
    this.cancelLabel = AppStringsBn.cancel,
    this.isDestructive = false,
    required this.onConfirm,
  });

  static Future<bool?> show({
    required BuildContext context,
    required String title,
    required String message,
    String confirmLabel = AppStringsBn.confirm,
    String cancelLabel = AppStringsBn.cancel,
    bool isDestructive = false,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => EhrjConfirmationDialog(
        title: title,
        message: message,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        isDestructive: isDestructive,
        onConfirm: () => Navigator.of(ctx).pop(true),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(
            isDestructive
                ? Icons.warning_amber_rounded
                : Icons.help_outline_rounded,
            color: isDestructive ? AppColors.absent : AppColors.primary,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      content: Text(message, style: const TextStyle(fontSize: 14, height: 1.5)),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(cancelLabel, style: const TextStyle(color: Colors.grey)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: isDestructive
                ? AppColors.absent
                : AppColors.primary,
            foregroundColor: Colors.white,
          ),
          onPressed: () {
            onConfirm();
          },
          child: Text(confirmLabel),
        ),
      ],
    );
  }
}
