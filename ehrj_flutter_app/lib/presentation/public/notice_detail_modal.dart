import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../data/models/notice_model.dart';

class NoticeDetailModal extends StatelessWidget {
  final NoticeModel notice;

  const NoticeDetailModal({super.key, required this.notice});

  static void show(BuildContext context, NoticeModel notice) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => NoticeDetailModal(notice: notice),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Bottom sheet handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Category & Date Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDC2626).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      notice.category ?? 'জরুরী বিজ্ঞপ্তি',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                  ),
                  const Spacer(),
                  const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.textMutedLight),
                  const SizedBox(width: 4),
                  Text(
                    notice.formattedDate,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryLight),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Title
              Text(
                notice.titleBn,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimaryLight,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 14),
              const Divider(height: 1),
              const SizedBox(height: 14),

              // Notice Body Content
              Text(
                notice.contentBn.isNotEmpty ? notice.contentBn : 'বিজ্ঞপ্তির বিস্তারিত বিবরণ অত্র প্রতিষ্ঠানে সংরক্ষিত রয়েছে।',
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.6,
                  color: AppColors.textPrimaryLight,
                ),
              ),
              const SizedBox(height: 24),

              // Official Institutional Authority Signature Block
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.bgLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cardBorderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: const [
                    Text(
                      'আদেশক্রমে,',
                      style: TextStyle(fontSize: 11, color: AppColors.textMutedLight),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'মাওলানা মহা. আবুল কালাম সরকার',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0D5C3A)),
                    ),
                    Text(
                      'মুহতামিম ও পরিচালক',
                      style: TextStyle(fontSize: 11, color: AppColors.textSecondaryLight),
                    ),
                    Text(
                      AppStringsBn.institutionName,
                      style: TextStyle(fontSize: 10, color: AppColors.textMutedLight),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Close / Share CTA
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.check_rounded),
                  label: const Text('বন্ধ করুন'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0D5C3A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
