import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../data/repositories/public_repository.dart';
import '../common/widgets/ehrj_empty_state.dart';

class AcademicCalendarScreen extends StatefulWidget {
  const AcademicCalendarScreen({super.key});

  @override
  State<AcademicCalendarScreen> createState() => _AcademicCalendarScreenState();
}

class _AcademicCalendarScreenState extends State<AcademicCalendarScreen> {
  String _filterType = 'ALL';
  List<Map<String, dynamic>> _events = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCalendar();
  }

  Future<void> _loadCalendar() async {
    setState(() => _isLoading = true);
    final repo = context.read<PublicRepository>();
    final data = await repo.getCalendarEvents();
    if (mounted) {
      setState(() {
        _events = data;
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredEvents {
    if (_filterType == 'ALL') return _events;
    return _events.where((e) => e['eventType'] == _filterType).toList();
  }

  @override
  Widget build(BuildContext context) {
    final list = _filteredEvents;

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('একাডেমিক ও ছুটির ক্যালেন্ডার ২০২৬'),
      ),
      body: Column(
        children: [
          // Header Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF041F14), Color(0xFF0D5C3A)],
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_month_rounded, color: AppColors.accent, size: 36),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'বার্ষিক দিনপঞ্জি • শিক্ষাবর্ষ ২০২৬',
                        style: TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'পরীক্ষা, সরকারি ও ধর্মীয় ছুটির সময়সূচি',
                        style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '১৪৪৭-১৪৪৮ হিজরী • ইলিয়টগঞ্জ, দাউদকান্দি',
                        style: TextStyle(color: Colors.white70, fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Filter Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: Row(
              children: [
                _buildFilterChip('ALL', 'সকল সূচি'),
                const SizedBox(width: 8),
                _buildFilterChip('HOLIDAY', 'প্রাতিষ্ঠানিক ছুটি'),
                const SizedBox(width: 8),
                _buildFilterChip('EXAM', 'পরীক্ষাসমূহ'),
                const SizedBox(width: 8),
                _buildFilterChip('EVENT', 'মহাফিল ও অনুষ্ঠান'),
              ],
            ),
          ),
          const Divider(height: 1),

          // Events Timeline List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : list.isEmpty
                    ? const EhrjEmptyState(
                        title: 'কোনো সূচি নেই',
                        subtitle: 'এই মুহূর্তে প্রদর্শনের জন্য কোনো ক্যালেন্ডার সূচি নেই।',
                        icon: Icons.event_busy_rounded,
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: list.length,
                        itemBuilder: (ctx, idx) {
                          final event = list[idx];
                          final type = event['eventType'] ?? 'INSTITUTIONAL';

                          Color badgeColor = const Color(0xFF0D5C3A);
                          String typeLabel = 'প্রাতিষ্ঠানিক';
                          IconData typeIcon = Icons.event_note_rounded;

                          if (type == 'HOLIDAY') {
                            badgeColor = const Color(0xFFDC2626);
                            typeLabel = 'ছুটির দিন';
                            typeIcon = Icons.beach_access_rounded;
                          } else if (type == 'EXAM') {
                            badgeColor = const Color(0xFFD97706);
                            typeLabel = 'টার্ম পরীক্ষা';
                            typeIcon = Icons.assignment_turned_in_rounded;
                          } else if (type == 'EVENT') {
                            badgeColor = const Color(0xFF2563EB);
                            typeLabel = 'মহাফিল / সমাবেশ';
                            typeIcon = Icons.celebration_rounded;
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.cardBorderLight),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.03),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: badgeColor.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Icon(typeIcon, color: badgeColor, size: 20),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              event['titleBn'] ?? event['title'] ?? '',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                                color: AppColors.textPrimaryLight,
                                              ),
                                            ),
                                            Text(
                                              typeLabel,
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: badgeColor,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    event['description'] ?? '',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryLight, height: 1.4),
                                  ),
                                  const SizedBox(height: 10),
                                  const Divider(height: 1),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(Icons.date_range_rounded, size: 14, color: AppColors.textMutedLight),
                                      const SizedBox(width: 6),
                                      Text(
                                        _formatEventDate(event['startDate']),
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textPrimaryLight),
                                      ),
                                      if (event['endDate'] != null) ...[
                                        const Text(' হতে ', style: TextStyle(fontSize: 11, color: AppColors.textMutedLight)),
                                        Text(
                                          _formatEventDate(event['endDate']),
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textPrimaryLight),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String type, String label) {
    final isSelected = _filterType == type;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: const Color(0xFF0D5C3A),
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.textPrimaryLight,
        fontWeight: FontWeight.bold,
        fontSize: 11,
      ),
      onSelected: (_) => setState(() => _filterType = type),
    );
  }

  String _formatEventDate(dynamic raw) {
    if (raw == null) return '';
    try {
      final dt = DateTime.parse(raw.toString());
      final months = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      final dayBn = dt.day.toString().split('').map((c) => _toBn(c)).join('');
      return '$dayBn ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return raw.toString().substring(0, 10);
    }
  }

  String _toBn(String d) {
    final map = {'0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'};
    return map[d] ?? d;
  }
}
