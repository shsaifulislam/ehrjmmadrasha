import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/responsive_breakpoints.dart';
import '../../data/models/notice_model.dart';
import '../../data/repositories/portal_repository.dart';
import '../../data/repositories/public_repository.dart';
import '../common/widgets/ehrj_card.dart';
import '../common/widgets/ehrj_confirmation_dialog.dart';
import '../common/widgets/ehrj_logo_widget.dart';
import '../common/widgets/ehrj_status_badge.dart';
import '../common/widgets/student_digital_id_card.dart';
import '../providers/auth_provider.dart';

class StudentDashboardScreen extends StatefulWidget {
  final VoidCallback onLogout;

  const StudentDashboardScreen({super.key, required this.onLogout});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  int _currentTabIndex = 0;
  bool _isLoading = true;
  String? _errorMessage;

  Map<String, dynamic>? _routineData;
  Map<String, dynamic>? _attendanceData;
  List<dynamic> _resultsList = [];
  List<NoticeModel> _notices = [];

  @override
  void initState() {
    super.initState();
    _loadStudentData();
  }

  Future<void> _loadStudentData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final auth = context.read<AuthProvider>();
    final portalRepo = context.read<PortalRepository>();
    final publicRepo = context.read<PublicRepository>();

    try {
      final studentId = auth.currentUser?.id ?? '';

      // Load routine, attendance, results, notices concurrently
      final routineFuture = portalRepo.getRoutine(studentId);
      final attendanceFuture = portalRepo.getAttendance(studentId);
      final resultsFuture = portalRepo.getResults(studentId);
      final noticesFuture = publicRepo.getNotices();

      final results = await Future.wait([
        routineFuture,
        attendanceFuture,
        resultsFuture,
        noticesFuture,
      ]);

      if (!mounted) return;

      setState(() {
        _routineData = results[0] as Map<String, dynamic>?;
        _attendanceData = results[1] as Map<String, dynamic>?;
        _resultsList = (results[2] as List<dynamic>?) ?? [];
        _notices = (results[3] as List<NoticeModel>?) ?? [];
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'তথ্য লোড করতে সমস্যা হয়েছে: $e';
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
                  'শিক্ষার্থী পোর্টাল',
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
            tooltip: 'ডিজিটাল আইডি কার্ড',
            icon: const Icon(Icons.badge_rounded),
            onPressed: () => _showDigitalIdModal(context, auth),
          ),
          IconButton(
            tooltip: 'রিফ্রেশ',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadStudentData,
          ),
          IconButton(
            tooltip: AppStringsBn.logout,
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => _confirmLogout(context, auth),
          ),
        ],
      ),
      body: Row(
        children: [
          if (isDesktop) _buildSidebar(),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : _errorMessage != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.info_outline,
                            size: 48,
                            color: Colors.orange,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _errorMessage!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.black87),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: _loadStudentData,
                            icon: const Icon(Icons.refresh_rounded),
                            label: const Text('পুনরায় চেষ্টা করুন'),
                          ),
                        ],
                      ),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadStudentData,
                    child: _buildCurrentTab(),
                  ),
          ),
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
                  icon: Icon(Icons.schedule_outlined),
                  selectedIcon: Icon(Icons.schedule_rounded),
                  label: 'রুটিন',
                ),
                NavigationDestination(
                  icon: Icon(Icons.check_circle_outline_rounded),
                  selectedIcon: Icon(Icons.check_circle_rounded),
                  label: 'উপস্থিতি',
                ),
                NavigationDestination(
                  icon: Icon(Icons.fact_check_outlined),
                  selectedIcon: Icon(Icons.fact_check_rounded),
                  label: 'ফলাফল',
                ),
                NavigationDestination(
                  icon: Icon(Icons.menu_book_outlined),
                  selectedIcon: Icon(Icons.menu_book_rounded),
                  label: 'নোটিশ ও পাঠ',
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
          _sidebarItem(0, 'দৈনিক ক্লাসের রুটিন', Icons.schedule_rounded),
          _sidebarItem(1, 'উপস্থিতি বিবরণী', Icons.check_circle_rounded),
          _sidebarItem(2, 'পরীক্ষার ফল ও মূল্যায়ন', Icons.fact_check_rounded),
          _sidebarItem(3, 'নোটিশ ও পাঠ্যসূচী', Icons.menu_book_rounded),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.school_rounded, color: AppColors.primary),
            title: const Text(
              'ইলম ও আমল',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            subtitle: const Text(
              'EHRJ মাদ্রাসা শিক্ষার্থী',
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
        return _buildRoutineTab();
      case 1:
        return _buildAttendanceTab();
      case 2:
        return _buildResultsTab();
      case 3:
        return _buildNoticesAndSyllabusTab();
      default:
        return _buildRoutineTab();
    }
  }

  Widget _buildRoutineTab() {
    final todaySlots = (_routineData?['todaySlots'] as List<dynamic>?) ?? [];
    final weeklySlots = (_routineData?['weeklySlots'] as List<dynamic>?) ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'আজকের দরস ও সময়সূচী',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  EhrjStatusBadge(
                    type: BadgeType.present,
                    customLabel: 'মোট ${todaySlots.length}টি ক্লাস',
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (todaySlots.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'আজকের কোনো ক্লাস শিডিউল নির্ধারিত নেই অথবা ছুটির দিন।',
                      style: TextStyle(color: Colors.black54),
                    ),
                  ),
                )
              else
                ...todaySlots.map((slot) {
                  final subject =
                      slot['subject']?['nameBn'] ??
                      slot['subjectName'] ??
                      'পাঠ্য নির্ধারণাধীন';
                  final teacher =
                      slot['teacher']?['fullNameBn'] ??
                      slot['teacherName'] ??
                      'উস্তাদ নির্ধারিত';
                  final time =
                      '${slot['startTime'] ?? ''} - ${slot['endTime'] ?? ''}';
                  return Column(
                    children: [
                      _routineRow(time, subject.toString(), teacher.toString()),
                      const Divider(),
                    ],
                  );
                }),
            ],
          ),
        ),
        const SizedBox(height: 16),
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'সাপ্তাহিক ক্লাসের পূর্ণাঙ্গ তালিকা',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'মোট সাপ্তাহিক স্লট: ${weeklySlots.length} টি নির্ধারিত',
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _routineRow(String time, String subject, String teacher) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                subject,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              Text(
                time,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            'উস্তাদ: $teacher',
            style: const TextStyle(fontSize: 12, color: Colors.black54),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceTab() {
    final stats = _attendanceData?['stats'] as Map<String, dynamic>?;
    final totalDays = stats?['totalDays'] ?? 0;
    final presentDays = stats?['presentDays'] ?? 0;
    final absentDays = stats?['absentDays'] ?? 0;
    final percentage = stats?['percentage'] ?? 0;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: _summaryCard(
                'মোট কার্যদিবস',
                '$totalDays দিন',
                Icons.calendar_month,
                AppColors.primary,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _summaryCard(
                'উপস্থিতি',
                '$presentDays দিন',
                Icons.check_circle_rounded,
                AppColors.present,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _summaryCard(
                'অনুপস্থিতি',
                '$absentDays দিন',
                Icons.cancel_rounded,
                AppColors.absent,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'মাসিক উপস্থিতি শতকরা হার',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    '$percentage%',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              LinearProgressIndicator(
                value: (percentage is num ? percentage / 100 : 0.0).clamp(
                  0.0,
                  1.0,
                ),
                backgroundColor: Colors.grey.withValues(alpha: 0.2),
                color: percentage > 75 ? AppColors.present : AppColors.unpaid,
                minHeight: 8,
              ),
              const SizedBox(height: 12),
              const Text(
                'নিয়মিত মাদ্রাসায় উপস্থিতি ইলমি তরক্কির পূর্বশর্ত। অসুস্থতা বা বিশেষ কারণে ছুটির প্রয়োজন হলে দরখাস্ত জমা দিন।',
                style: TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildResultsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'পরীক্ষার আনুষ্ঠানিক ফলাফল ও মার্কশীট',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              if (_resultsList.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'চলতি টার্মের কোনো প্রকাশিত ফলাফল পাওয়া যায়নি।',
                      style: TextStyle(color: Colors.black54),
                    ),
                  ),
                )
              else
                ..._resultsList.map((res) {
                  final examName =
                      res['exam']?['nameBn'] ??
                      res['examTitle'] ??
                      'সাময়িক পরীক্ষা';
                  final gpa = res['gpa'] ?? res['grade'] ?? 'A';
                  final marks = res['totalMarks'] ?? 'উত্তীর্ণ';
                  return Column(
                    children: [
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const CircleAvatar(
                          backgroundColor: AppColors.primaryContainer,
                          child: Icon(
                            Icons.star_rounded,
                            color: AppColors.primary,
                          ),
                        ),
                        title: Text(
                          examName.toString(),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        subtitle: Text('মোট প্রাপ্ত নম্বর: $marks'),
                        trailing: EhrjStatusBadge(
                          type: BadgeType.present,
                          customLabel: 'গ্রেড: $gpa',
                        ),
                      ),
                      const Divider(),
                    ],
                  );
                }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildNoticesAndSyllabusTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'মাদ্রাসার প্রকাশিত নোটিশ ও নির্দেশনাবলী',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              if (_notices.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(
                    child: Text(
                      'কোনো নোটিশ পাওয়া যায়নি।',
                      style: TextStyle(color: Colors.black54),
                    ),
                  ),
                )
              else
                ..._notices.take(5).map((n) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                n.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            EhrjStatusBadge(
                              type: BadgeType.info,
                              customLabel: n.category,
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          n.content,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.black87,
                          ),
                        ),
                        const Divider(),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _summaryCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
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
      message: 'আপনি কি নিশ্চিত যে শিক্ষার্থী পোর্টাল থেকে প্রস্থান করতে চান?',
      confirmLabel: AppStringsBn.logout,
      isDestructive: true,
    ).then((confirmed) {
      if (confirmed == true) {
        auth.logout();
        widget.onLogout();
      }
    });
  }

  void _showDigitalIdModal(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: StudentDigitalIdCard(
            studentId: auth.currentUser?.id ?? 'EHRJ-STD-2026',
            fullNameBn: auth.currentUser?.name ?? 'শিক্ষার্থী',
            studentIdNumber: auth.currentUser?.username ?? 'EHRJ-STD-001',
            className:
                _routineData?['enrollment']?['classNameBn']?.toString() ??
                'তাহফীজুল কুরআন বিভাগ',
            sectionName:
                _routineData?['enrollment']?['sectionNameBn']?.toString() ??
                'ক শাখা',
            rollNumber: _routineData?['enrollment']?['rollNumber'] as int? ?? 1,
            session:
                _routineData?['enrollment']?['sessionName']?.toString() ??
                '২০২৬',
            bloodGroup: 'B+',
            baseUrl: context.read<ApiClient>().baseUrl,
          ),
        ),
      ),
    );
  }
}
