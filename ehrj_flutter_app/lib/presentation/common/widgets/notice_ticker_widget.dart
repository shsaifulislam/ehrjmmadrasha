import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class NoticeTickerWidget extends StatelessWidget {
  final List<String> notices;
  final VoidCallback? onNoticeTap;

  const NoticeTickerWidget({
    super.key,
    required this.notices,
    this.onNoticeTap,
  });

  @override
  Widget build(BuildContext context) {
    final displayList = notices.isNotEmpty
        ? notices
        : [
            '২০২৬ শিক্ষাবর্ষে নূরানী, নাজেরা, হিফজ ও কিতাব বিভাগে নতুন ভর্তি চলছে',
            'আসন্ন সাময়িক ও বার্ষিক পরীক্ষার চূড়ান্ত সময়সূচি প্রকাশিত হয়েছে',
          ];

    final fullNoticeString = displayList.join('   ॥   📢 ');

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(10),
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          // Red Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            color: const Color(0xFFB91C1C),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.campaign, color: AppColors.accentLight, size: 16),
                SizedBox(width: 4),
                Text(
                  'জরুরী নোটিশঃ',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          // Marquee / Single Line Scrollable Notice
          Expanded(
            child: InkWell(
              onTap: onNoticeTap,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                color: const Color(0xFFFEF2F2),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Text(
                    '📢 $fullNoticeString',
                    style: const TextStyle(
                      color: Color(0xFF991B1B),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
