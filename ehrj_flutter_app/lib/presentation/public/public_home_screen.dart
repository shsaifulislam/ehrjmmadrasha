import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../data/models/notice_model.dart';
import '../../data/repositories/public_repository.dart';
import '../common/widgets/ehrj_card.dart';
import '../common/widgets/ehrj_logo_widget.dart';
import '../common/widgets/notice_ticker_widget.dart';
import '../common/widgets/prayer_times_widget.dart';
import 'about_madrasa_screen.dart';
import 'academic_calendar_screen.dart';
import 'academic_departments_screen.dart';
import 'admission_apply_screen.dart';
import 'admission_track_screen.dart';
import 'campus_gallery_screen.dart';
import 'contact_us_screen.dart';
import 'download_center_screen.dart';
import 'notice_detail_modal.dart';
import 'public_donate_screen.dart';
import 'public_results_screen.dart';
import 'universal_verify_screen.dart';

class PublicHomeScreen extends StatefulWidget {
  final VoidCallback? onNavigateToLogin;

  const PublicHomeScreen({super.key, this.onNavigateToLogin});

  @override
  State<PublicHomeScreen> createState() => _PublicHomeScreenState();
}

class _PublicHomeScreenState extends State<PublicHomeScreen> {
  int _currentTabIndex = 0;
  List<NoticeModel> _notices = [];
  List<Map<String, dynamic>> _events = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPublicData();
    });
  }

  Future<void> _loadPublicData() async {
    setState(() => _isLoading = true);
    final repo = context.read<PublicRepository>();
    final notices = await repo.getPublicNotices();
    final events = await repo.getPublicEvents();
    if (mounted) {
      setState(() {
        _notices = notices;
        _events = events;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 1,
        title: Row(
          children: [
            const EhrjLogoWidget(size: 34, showBorder: false),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    AppStringsBn.institutionShort,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  Text(
                    '${AppStringsBn.established} • ${AppStringsBn.address}',
                    style: TextStyle(fontSize: 10, color: Colors.white70),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
            child: ElevatedButton.icon(
              onPressed: widget.onNavigateToLogin,
              icon: const Icon(Icons.login_rounded, size: 16),
              label: const Text('লগইন', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
            ),
          ),
        ],
      ),
      body: _currentTabIndex == 0
          ? _buildHomeTab()
          : _currentTabIndex == 1
              ? _buildNoticesTab()
              : _buildEventsTab(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        onDestinationSelected: (idx) => setState(() => _currentTabIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'হোম',
          ),
          NavigationDestination(
            icon: Icon(Icons.campaign_outlined),
            selectedIcon: Icon(Icons.campaign_rounded),
            label: 'বিজ্ঞপ্তি',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event_rounded),
            label: 'অনুষ্ঠানমালা',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    final noticeTitles = _notices.map((n) => n.titleBn).toList();

    return RefreshIndicator(
      onRefresh: _loadPublicData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Notice Ticker Marquee
          NoticeTickerWidget(
            notices: noticeTitles,
            onNoticeTap: () => setState(() => _currentTabIndex = 1),
          ),
          const SizedBox(height: 16),

          // Prestigious Institutional Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF041F14), Color(0xFF0D5C3A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                const Text(
                  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                  style: TextStyle(
                    color: AppColors.accent,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  AppStringsBn.institutionName,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'নূরানী, হিফজুল কুরআন ও কিতাব বিভাগ • লিল্লাহ বোর্ডিং ও এতিমখানা',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: AppColors.accentLight),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  alignment: WrapAlignment.center,
                  children: [
                    _buildPillTag('স্থাপিত: ২০২১ ইং'),
                    _buildPillTag('দাউদকান্দি, কুমিল্লা'),
                    _buildPillTag('ইআরপি ডিজিটাল ক্যাম্পাস'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Live Prayer Times Widget
          const PrayerTimesWidget(),
          const SizedBox(height: 16),

          // Institutional Quick Services Hub Grid
          EhrjCard(
            title: 'প্রাতিষ্ঠানিক সেবা ও পোর্টাল লিংক',
            icon: Icons.grid_view_rounded,
            child: GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 10,
              childAspectRatio: 0.98,
              children: [
                _buildQuickAction(
                  icon: Icons.history_edu,
                  color: const Color(0xFF0D5C3A),
                  title: 'পরিচিতি ও ইতিহাস',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AboutMadrasaScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.school_rounded,
                  color: const Color(0xFF059669),
                  title: 'অনুষদ ও বিভাগ',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AcademicDepartmentsScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.app_registration,
                  color: const Color(0xFFD97706),
                  title: 'অনলাইনে ভর্তি',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AdmissionApplyScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.track_changes,
                  color: const Color(0xFF2563EB),
                  title: 'আবেদন ট্র্যাকিং',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AdmissionTrackScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.emoji_events,
                  color: const Color(0xFF7C3AED),
                  title: 'ফলাফল যাচাই',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const PublicResultsScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.qr_code_scanner,
                  color: const Color(0xFF0D9488),
                  title: 'কেন্দ্রীয় যাচাই',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const UniversalVerifyScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.volunteer_activism_rounded,
                  color: const Color(0xFFEA580C),
                  title: 'দান ও যাকাত',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const PublicDonateScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.download_for_offline_rounded,
                  color: const Color(0xFF4F46E5),
                  title: 'ডাউনলোড সেন্টার',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const DownloadCenterScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.calendar_month_rounded,
                  color: const Color(0xFF0284C7),
                  title: 'ক্যালেন্ডার ও ছুটি',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AcademicCalendarScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.photo_library_rounded,
                  color: const Color(0xFFCA8A04),
                  title: 'ফটো গ্যালারি',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const CampusGalleryScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.contact_support_rounded,
                  color: const Color(0xFF0D5C3A),
                  title: 'যোগাযোগ ও সহায়তা',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const ContactUsScreen()),
                  ),
                ),
                _buildQuickAction(
                  icon: Icons.login_rounded,
                  color: const Color(0xFFDC2626),
                  title: 'ইআরপি লগইন',
                  onTap: widget.onNavigateToLogin,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Latest Notices Card
          EhrjCard(
            title: 'সাম্প্রতিক নোটিশসমূহ',
            icon: Icons.notifications_active,
            trailing: TextButton(
              onPressed: () => setState(() => _currentTabIndex = 1),
              child: const Text('সকল নোটিশ'),
            ),
            child: _isLoading
                ? const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
                : _notices.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('বর্তমানে কোনো নতুন নোটিশ নেই', textAlign: TextAlign.center),
                      )
                    : Column(
                        children: _notices.take(4).map((notice) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: ListTile(
                              leading: const CircleAvatar(
                                radius: 16,
                                backgroundColor: Color(0xFFECFDF5),
                                child: Icon(Icons.campaign, color: AppColors.primary, size: 16),
                              ),
                              title: Text(
                                notice.titleBn,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              subtitle: Text(
                                '${notice.category ?? "সাধারণ"} • ${notice.formattedDate}',
                                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                              ),
                              trailing: const Icon(Icons.chevron_right, size: 18),
                              onTap: () => NoticeDetailModal.show(context, notice),
                            ),
                          );
                        }).toList(),
                      ),
          ),
          const SizedBox(height: 16),

          // Admission Helpline Footer
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFEF3C7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.phone_in_talk, color: Color(0xFFD97706)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('ভর্তি ও প্রাতিষ্ঠানিক তথ্য হেল্পলাইন:', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      Text('${AppStringsBn.primaryPhone} (সকাল ৮টা হতে বিকাল ৫টা)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryDark)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _noticeFilterCategory = 'ALL';

  Widget _buildNoticesTab() {
    final filtered = _notices.where((n) {
      if (_noticeFilterCategory == 'ALL') return true;
      return (n.category ?? 'সাধারণ') == _noticeFilterCategory;
    }).toList();

    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: Colors.white,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildNoticeFilterChip('ALL', 'সকল বিজ্ঞপ্তি'),
                      const SizedBox(width: 8),
                      _buildNoticeFilterChip('ভর্তি', 'ভর্তি বিজ্ঞপ্তি'),
                      const SizedBox(width: 8),
                      _buildNoticeFilterChip('পরীক্ষা', 'পরীক্ষা সংক্রান্ত'),
                      const SizedBox(width: 8),
                      _buildNoticeFilterChip('ছুটি', 'ছুটির বিজ্ঞপ্তি'),
                      const SizedBox(width: 8),
                      _buildNoticeFilterChip('সাধারণ', 'সাধারণ'),
                    ],
                  ),
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: filtered.isEmpty
                    ? const Center(
                        child: Text('এই ক্যাটাগরিতে কোনো বিজ্ঞপ্তি নেই'),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (context, idx) {
                          final notice = filtered[idx];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(12),
                              leading: CircleAvatar(
                                backgroundColor: const Color(0xFFECFDF5),
                                child: Icon(
                                  notice.isImportant ? Icons.notification_important : Icons.article,
                                  color: notice.isImportant ? Colors.red : AppColors.primary,
                                ),
                              ),
                              title: Text(
                                notice.titleBn,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  'বিভাগ: ${notice.category ?? "সাধারণ"} • তারিখ: ${notice.formattedDate}',
                                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                ),
                              ),
                              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                              onTap: () => NoticeDetailModal.show(context, notice),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
  }

  Widget _buildNoticeFilterChip(String cat, String label) {
    final isSel = _noticeFilterCategory == cat;
    return FilterChip(
      label: Text(label),
      selected: isSel,
      selectedColor: const Color(0xFF0D5C3A),
      labelStyle: TextStyle(
        color: isSel ? Colors.white : AppColors.textPrimaryLight,
        fontWeight: FontWeight.bold,
        fontSize: 11,
      ),
      onSelected: (_) => setState(() => _noticeFilterCategory = cat),
    );
  }

  Widget _buildEventsTab() {
    return _events.isEmpty
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.event_busy, size: 48, color: Color(0xFF94A3B8)),
                SizedBox(height: 10),
                Text('বর্তমানে কোনো নির্ধারিত অনুষ্ঠান নেই', style: TextStyle(color: Color(0xFF64748B))),
              ],
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _events.length,
            itemBuilder: (context, idx) {
              final event = _events[idx];
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event['titleBn'] ?? event['title'] ?? 'মাদরাসা অনুষ্ঠান',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      event['descriptionBn'] ?? event['description'] ?? '',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'স্থান: ${event['location'] ?? 'মাদরাসা প্রাঙ্গণ'} • তারিখ: ${event['date'] ?? 'আসন্ন'}',
                      style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              );
            },
          );
  }

  Widget _buildQuickAction({
    required IconData icon,
    required Color color,
    required String title,
    required VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 6),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPillTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
      ),
      child: Text(
        text,
        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
      ),
    );
  }
}
