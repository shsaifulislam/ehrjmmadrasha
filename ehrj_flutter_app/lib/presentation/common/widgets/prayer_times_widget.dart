import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class PrayerTimesWidget extends StatefulWidget {
  const PrayerTimesWidget({super.key});

  @override
  State<PrayerTimesWidget> createState() => _PrayerTimesWidgetState();
}

class _PrayerTimesWidgetState extends State<PrayerTimesWidget> {
  late Timer _timer;
  String _currentTime = '';

  final List<Map<String, dynamic>> _prayers = [
    {'name': 'ফজর', 'time': '০৪:২৫ AM', 'icon': Icons.wb_twilight},
    {'name': 'যোহর', 'time': '১২:০৫ PM', 'icon': Icons.wb_sunny},
    {'name': 'আসর', 'time': '০৪:৩০ PM', 'icon': Icons.sunny_snowing},
    {'name': 'মাগরিব', 'time': '০৬:১৮ PM', 'icon': Icons.nights_stay},
    {'name': 'এশা', 'time': '০৭:৪০ PM', 'icon': Icons.bedtime},
    {'name': "জুমু'আ", 'time': '০১:১৫ PM', 'icon': Icons.access_time_filled},
  ];

  @override
  void initState() {
    super.initState();
    _updateClock();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateClock());
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _updateClock() {
    final now = DateTime.now();
    final hour = now.hour % 12 == 0 ? 12 : now.hour % 12;
    final minute = now.minute.toString().padLeft(2, '0');
    final second = now.second.toString().padLeft(2, '0');
    final period = now.hour >= 12 ? 'PM' : 'AM';

    final bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    final timeEn = '$hour:$minute:$second $period';
    final timeBn = timeEn.split('').map((char) {
      final code = char.codeUnitAt(0);
      if (code >= 48 && code <= 57) {
        return bnDigits[code - 48];
      }
      return char;
    }).join('');

    if (mounted) {
      setState(() {
        _currentTime = timeBn;
      });
    }
  }

  int _getActivePrayerIndex() {
    final now = DateTime.now();
    final minutes = now.hour * 60 + now.minute;
    // 04:25 = 265, 12:05 = 725, 16:30 = 990, 18:18 = 1098, 19:40 = 1180
    if (minutes >= 265 && minutes < 725) return 0; // Fajr
    if (minutes >= 725 && minutes < 990) return 1; // Dhuhr
    if (minutes >= 990 && minutes < 1098) return 2; // Asr
    if (minutes >= 1098 && minutes < 1180) return 3; // Maghrib
    return 4; // Isha
  }

  @override
  Widget build(BuildContext context) {
    final activeIndex = _getActivePrayerIndex();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: AppColors.primary,
              border: Border(
                bottom: BorderSide(color: AppColors.accent, width: 2),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.access_time, color: AppColors.accent, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'নামাজের স্থায়ী সময়সূচী',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF073622),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _currentTime.isNotEmpty ? _currentTime : '১০:৪৫:০০ PM',
                    style: const TextStyle(
                      color: AppColors.accentLight,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 6-Prayer Grid
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 1.6,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: _prayers.length,
                  itemBuilder: (context, index) {
                    final item = _prayers[index];
                    final isActive = index == activeIndex;

                    return Container(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                      decoration: BoxDecoration(
                        color: isActive
                            ? const Color(0xFFECFDF5)
                            : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isActive
                              ? const Color(0xFF6EE7B7)
                              : const Color(0xFFE2E8F0),
                          width: isActive ? 1.5 : 1,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                item['icon'] as IconData,
                                size: 14,
                                color: isActive
                                    ? AppColors.primary
                                    : const Color(0xFF64748B),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                item['name'] as String,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: isActive
                                      ? FontWeight.bold
                                      : FontWeight.w600,
                                  color: isActive
                                      ? AppColors.primary
                                      : const Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item['time'] as String,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isActive
                                  ? AppColors.primaryDark
                                  : const Color(0xFF334155),
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 8),
                const Text(
                  'কুমিল্লা জোন • ইসলামিক ফাউন্ডেশন বাংলাদেশ অনুকরণে',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 10,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
