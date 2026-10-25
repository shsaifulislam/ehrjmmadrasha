import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../core/utils/responsive_breakpoints.dart';
import '../../data/repositories/admin_repository.dart';
import '../common/widgets/ehrj_card.dart';
import '../common/widgets/ehrj_confirmation_dialog.dart';
import '../common/widgets/ehrj_logo_widget.dart';
import '../common/widgets/ehrj_status_badge.dart';
import '../providers/auth_provider.dart';

class PrincipalDashboardScreen extends StatefulWidget {
  final VoidCallback onLogout;

  const PrincipalDashboardScreen({super.key, required this.onLogout});

  @override
  State<PrincipalDashboardScreen> createState() =>
      _PrincipalDashboardScreenState();
}

class _PrincipalDashboardScreenState extends State<PrincipalDashboardScreen> {
  int _currentTabIndex = 0;
  bool _isLoading = true;
  Map<String, dynamic>? _reportsData;
  Map<String, dynamic>? _commandData;

  @override
  void initState() {
    super.initState();
    _loadPrincipalData();
  }

  Future<void> _loadPrincipalData() async {
    setState(() => _isLoading = true);
    final repo = context.read<AdminRepository>();
    final rep = await repo.getPrincipalReports(type: 'CASHBOOK');
    final cmd = await repo.getCommandCenter();
    if (mounted) {
      setState(() {
        _reportsData = rep;
        _commandData = cmd;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isDesktop = ResponsiveBreakpoints.isDesktop(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const EhrjLogoWidget(size: 32, showBorder: false),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'অধ্যক্ষ মহোদয়ের পর্যবেক্ষণ কেন্দ্র',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  auth.displayName,
                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'রিফ্রেশ',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadPrincipalData,
          ),
          IconButton(
            tooltip: AppStringsBn.logout,
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => _confirmLogout(context, auth),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Row(
              children: [
                if (isDesktop) _buildSidebar(),
                Expanded(child: _buildCurrentTab()),
              ],
            ),
      bottomNavigationBar: isDesktop
          ? null
          : NavigationBar(
              selectedIndex: _currentTabIndex,
              onDestinationSelected: (i) =>
                  setState(() => _currentTabIndex = i),
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard_rounded),
                  label: 'একনজরে',
                ),
                NavigationDestination(
                  icon: Icon(Icons.auto_stories_outlined),
                  selectedIcon: Icon(Icons.auto_stories_rounded),
                  label: 'একাডেমিক',
                ),
                NavigationDestination(
                  icon: Icon(Icons.verified_user_outlined),
                  selectedIcon: Icon(Icons.verified_user_rounded),
                  label: 'অনুমোদন',
                ),
              ],
            ),
    );
  }

  Widget _buildSidebar() {
    return Container(
      width: 240,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          right: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 16),
          _sidebarItem(0, 'সার্বিক তত্ত্বাবধান', Icons.dashboard_rounded),
          _sidebarItem(
            1,
            'একাডেমিক রুটিন ও সিলেবাস',
            Icons.auto_stories_rounded,
          ),
          _sidebarItem(2, 'অনুমোদন ও পর্যালোচনা', Icons.verified_user_rounded),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.info_outline_rounded, size: 20),
            title: const Text(
              'শিক্ষা সচিবালয়',
              style: TextStyle(fontSize: 12),
            ),
            subtitle: const Text(
              'ভার্সন ১.০.০',
              style: TextStyle(fontSize: 11),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _sidebarItem(int index, String label, IconData icon) {
    final isSelected = _currentTabIndex == index;
    return ListTile(
      selected: isSelected,
      selectedTileColor: AppColors.primaryContainer.withValues(alpha: 0.3),
      leading: Icon(
        icon,
        color: isSelected ? AppColors.primary : Colors.black87,
      ),
      title: Text(
        label,
        style: TextStyle(
          color: isSelected ? AppColors.primary : Colors.black87,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 13,
        ),
      ),
      onTap: () => setState(() => _currentTabIndex = index),
    );
  }

  Widget _buildCurrentTab() {
    switch (_currentTabIndex) {
      case 0:
        return _buildOverviewTab();
      case 1:
        return _buildAcademicTab();
      case 2:
        return _buildApprovalTab();
      default:
        return _buildOverviewTab();
    }
  }

  Widget _buildOverviewTab() {
    final pendingCount = (_commandData?['pendingTasks'] as List? ?? [])
        .fold<int>(0, (sum, item) => sum + (item['count'] as int? ?? 0));
    final fundCount = (_reportsData?['funds'] as List? ?? []).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // KPI Cards Row
        Row(
          children: [
            Expanded(
              child: _kpiCard(
                'প্রতিষ্ঠান তহবিল',
                '$fundCount টি ফান্ড',
                Icons.account_balance_rounded,
                AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _kpiCard(
                'অনুমোদন কিউ',
                '$pendingCount টি',
                Icons.pending_actions_rounded,
                AppColors.pendingSync,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _kpiCard(
                'চলমান সেশন',
                '২০২৬',
                Icons.calendar_month_rounded,
                AppColors.present,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Department Summary
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'বিভাগীয় অগ্রগতি ও উপস্থিতি সংক্ষিপ্তসার',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              _deptRow(
                'হিফজুল কুরআন বিভাগ',
                '৯৮% উপস্থিতি',
                '৭ টি হালকায় নিয়মিত তিলাওয়াত',
              ),
              const Divider(),
              _deptRow(
                'কিতাব ও দাওরায়ে হাদীস',
                '৯২% উপস্থিতি',
                'দরসে নেজামী সিলেবাস সম্পন্ন: ৬২%',
              ),
              const Divider(),
              _deptRow(
                'নূরানী ও সাধারণ বিভাগ',
                '৯৫% উপস্থিতি',
                'প্রথম সাময়িক মূল্যায়ন চলমান',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _deptRow(String title, String badge, String subtitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              EhrjStatusBadge(type: BadgeType.present, customLabel: badge),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 12, color: Colors.black54),
          ),
        ],
      ),
    );
  }

  Widget _buildAcademicTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'একাডেমিক ক্যালেন্ডার ও ক্লাস রুটিন সমন্বয়',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              SizedBox(height: 12),
              Text(
                'সকল জামাতের সময়সূচী এবং উস্তাদগণের ক্লাসের বণ্টন কেন্দ্রীয়ভাবে নিরীক্ষিত হচ্ছে। মূল Next.js ডাটাবেজ থেকে সরাসরি হালনাগাদ পাঠ্যসূচী প্রতিফলিত হয়।',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildApprovalTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'শিক্ষা প্রশাসনিক অনুমোদন ও ফলাফল প্রকাশ',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              SizedBox(height: 12),
              Text(
                'পরীক্ষার নম্বর নিরীক্ষণ ও আনুষ্ঠানিক ফলাফল প্রকাশের অনুমোদন অধ্যক্ষ ও শিক্ষা সচিবের সরাসরি স্বাক্ষরে অনুমোদিত হয়। কোনো ফলাফল শিক্ষক কর্তৃক একতরফাভাবে সরাসরি প্রকাশ করা যায় না।',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _kpiCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: Colors.black54),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, AuthProvider auth) {
    EhrjConfirmationDialog.show(
      context: context,
      title: AppStringsBn.logout,
      message: 'আপনি কি নিশ্চিত যে অধ্যক্ষের পর্যবেক্ষণ সেশন থেকে প্রস্থান করতে চান?',
      confirmLabel: AppStringsBn.logout,
      isDestructive: true,
    ).then((confirmed) {
      if (confirmed == true) {
        auth.logout();
        widget.onLogout();
      }
    });
  }
}
