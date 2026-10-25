import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../core/utils/responsive_breakpoints.dart';
import '../common/widgets/ehrj_card.dart';
import '../common/widgets/ehrj_confirmation_dialog.dart';
import '../common/widgets/ehrj_status_badge.dart';
import '../common/widgets/offline_banner.dart';
import '../providers/auth_provider.dart';
import '../providers/sync_provider.dart';
import '../providers/teacher_provider.dart';

class TeacherDashboardScreen extends StatefulWidget {
  final VoidCallback? onLogout;

  const TeacherDashboardScreen({super.key, this.onLogout});

  @override
  State<TeacherDashboardScreen> createState() => _TeacherDashboardScreenState();
}

class _TeacherDashboardScreenState extends State<TeacherDashboardScreen> {
  int _currentTabIndex = 0;
  final String _todayDate = DateFormat('yyyy-MM-dd').format(DateTime.now());

  // Leave Form Controllers
  final _leaveReasonController = TextEditingController();
  String _selectedLeaveType = 'CASUAL';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TeacherProvider>().loadAssignedClasses();
      context.read<SyncProvider>().refresh();
    });
  }

  @override
  void dispose() {
    _leaveReasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final teacher = context.watch<TeacherProvider>();
    final sync = context.watch<SyncProvider>();
    final isDesktop = ResponsiveBreakpoints.isDesktop(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(auth.currentUser?.name ?? 'উস্তাদ প্যানেল'),
            Text(
              '${AppStringsBn.institutionShort} • ${AppStringsBn.roleTeacher}',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.normal,
                color: Colors.white70,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'রিফ্রেশ',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              teacher.loadAssignedClasses();
              sync.refresh();
            },
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
          if (isDesktop) _buildDesktopSidebar(sync),
          Expanded(
            child: Column(
              children: [
                // Top Status & Offline Banner
                OfflineBanner(
                  isOnline: sync.isOnline,
                  pendingSyncCount: sync.pendingCount,
                  onSyncTap: () => sync.syncNow(),
                ),

                if (teacher.successMessage != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    color: AppColors.present.withValues(alpha: 0.15),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          color: AppColors.present,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            teacher.successMessage!,
                            style: const TextStyle(
                              color: AppColors.present,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                if (teacher.errorMessage != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    color: AppColors.absent.withValues(alpha: 0.15),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.error_outline_rounded,
                          color: AppColors.absent,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            teacher.errorMessage!,
                            style: const TextStyle(
                              color: AppColors.absent,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Main Tab Views
                Expanded(
                  child: IndexedStack(
                    index: _currentTabIndex,
                    children: [
                      _buildAttendanceTab(teacher),
                      _buildClassesTab(teacher),
                      _buildMarksTab(teacher),
                      _buildLeaveTab(teacher),
                      _buildSyncQueueTab(sync),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: isDesktop
          ? null
          : NavigationBar(
              selectedIndex: _currentTabIndex,
              onDestinationSelected: (idx) =>
                  setState(() => _currentTabIndex = idx),
              destinations: [
                const NavigationDestination(
                  icon: Icon(Icons.how_to_reg_outlined),
                  selectedIcon: Icon(Icons.how_to_reg_rounded),
                  label: AppStringsBn.tabAttendance,
                ),
                const NavigationDestination(
                  icon: Icon(Icons.groups_outlined),
                  selectedIcon: Icon(Icons.groups_rounded),
                  label: AppStringsBn.tabClasses,
                ),
                const NavigationDestination(
                  icon: Icon(Icons.assignment_outlined),
                  selectedIcon: Icon(Icons.assignment_rounded),
                  label: AppStringsBn.tabMarks,
                ),
                const NavigationDestination(
                  icon: Icon(Icons.event_note_outlined),
                  selectedIcon: Icon(Icons.event_note_rounded),
                  label: 'ছুটি',
                ),
                NavigationDestination(
                  icon: Badge(
                    isLabelVisible: sync.pendingCount > 0,
                    label: Text('${sync.pendingCount}'),
                    child: const Icon(Icons.cloud_sync_outlined),
                  ),
                  selectedIcon: const Icon(Icons.cloud_sync_rounded),
                  label: AppStringsBn.tabSync,
                ),
              ],
            ),
    );
  }

  Widget _buildDesktopSidebar(SyncProvider sync) {
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
          _sidebarItem(0, AppStringsBn.tabAttendance, Icons.how_to_reg_rounded),
          _sidebarItem(1, AppStringsBn.tabClasses, Icons.groups_rounded),
          _sidebarItem(2, AppStringsBn.tabMarks, Icons.assignment_rounded),
          _sidebarItem(3, 'ছুটির আবেদন ও ব্যালেন্স', Icons.event_note_rounded),
          _sidebarItem(
            4,
            'সিঙ্ক ও অফলাইন কিউ (${sync.pendingCount})',
            Icons.cloud_sync_rounded,
          ),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: Icon(
              sync.isOnline ? Icons.wifi_rounded : Icons.wifi_off_rounded,
              color: sync.isOnline ? AppColors.present : AppColors.absent,
            ),
            title: Text(
              sync.isOnline ? 'অনলাইন সার্ভার সিঙ্কড' : 'অফলাইন মোড কার্যকর',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              'পেন্ডিং পরিবর্তন: ${sync.pendingCount} টি',
              style: const TextStyle(fontSize: 11),
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

  // -------------------------------------------------------------
  // TAB 1: ATTENDANCE
  // -------------------------------------------------------------
  Widget _buildAttendanceTab(TeacherProvider teacher) {
    return Column(
      children: [
        // Class & Section Selector Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: Colors.white,
          child: Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: teacher.selectedClass?.id,
                  decoration: const InputDecoration(
                    labelText: 'জামাত / শ্রেণি',
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                  items: teacher.classes.map((c) {
                    return DropdownMenuItem(value: c.id, child: Text(c.name));
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      final cls = teacher.classes.firstWhere(
                        (c) => c.id == val,
                      );
                      teacher.selectClass(cls);
                    }
                  },
                ),
              ),
              const SizedBox(width: 10),
              if (teacher.selectedClass?.sections.isNotEmpty ?? false)
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: teacher.selectedSection?.id,
                    decoration: const InputDecoration(
                      labelText: 'শাখা',
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    items: teacher.selectedClass!.sections.map((s) {
                      return DropdownMenuItem(value: s.id, child: Text(s.name));
                    }).toList(),
                    onChanged: (val) {
                      final sec = teacher.selectedClass?.sections.firstWhere(
                        (s) => s.id == val,
                      );
                      teacher.selectSection(sec);
                    },
                  ),
                ),
            ],
          ),
        ),

        // Attendance Metric Totals Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: AppColors.primaryContainer.withValues(alpha: 0.5),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'তারিখ: $_todayDate',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              Row(
                children: [
                  _metricChip(
                    'উপস্থিত',
                    teacher.presentCount,
                    AppColors.present,
                  ),
                  const SizedBox(width: 8),
                  _metricChip(
                    'অনুপস্থিত',
                    teacher.absentCount,
                    AppColors.absent,
                  ),
                  const SizedBox(width: 8),
                  _metricChip('ছুটি', teacher.leaveCount, AppColors.leave),
                ],
              ),
            ],
          ),
        ),

        // Quick Action Bar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'শিক্ষার্থী সংখ্যা: ${teacher.roster.length}',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              TextButton.icon(
                onPressed: () => teacher.markAllPresent(),
                icon: const Icon(Icons.done_all_rounded, size: 16),
                label: const Text(
                  'সকলকে উপস্থিত করুন',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
        ),

        // Student Attendance Roster List
        Expanded(
          child: teacher.isLoading
              ? const Center(child: CircularProgressIndicator())
              : teacher.roster.isEmpty
              ? const Center(
                  child: Text('এই ক্লাসে কোনো শিক্ষার্থী নিবন্ধিত নেই'),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: teacher.roster.length,
                  itemBuilder: (context, index) {
                    final student = teacher.roster[index];
                    final record = teacher.attendanceDraftMap[student.id];
                    final currentStatus = record?.status ?? 'PRESENT';

                    return EhrjCard(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: AppColors.primaryContainer,
                            child: Text(
                              student.rollNumber != null
                                  ? '${student.rollNumber}'
                                  : '${index + 1}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  student.fullNameBn,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  'আইডি: ${student.studentIdNumber}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Quick Status Action Buttons: P / A / L
                          Row(
                            children: [
                              _statusButton(
                                label: 'P',
                                color: AppColors.present,
                                isSelected: currentStatus == 'PRESENT',
                                onTap: () => teacher.setStudentStatus(
                                  student.id,
                                  'PRESENT',
                                ),
                              ),
                              const SizedBox(width: 6),
                              _statusButton(
                                label: 'A',
                                color: AppColors.absent,
                                isSelected: currentStatus == 'ABSENT',
                                onTap: () => teacher.setStudentStatus(
                                  student.id,
                                  'ABSENT',
                                ),
                              ),
                              const SizedBox(width: 6),
                              _statusButton(
                                label: 'L',
                                color: AppColors.leave,
                                isSelected: currentStatus == 'LEAVE',
                                onTap: () => teacher.setStudentStatus(
                                  student.id,
                                  'LEAVE',
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),

        // Action Buttons: Save Draft (Offline) & Submit Online
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 6,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: teacher.isLoading
                      ? null
                      : () => teacher.saveAttendance(
                          date: _todayDate,
                          submitOnline: false,
                        ),
                  icon: const Icon(Icons.save_as_rounded, size: 18),
                  label: const Text(AppStringsBn.saveDraft),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: teacher.isLoading
                      ? null
                      : () => teacher.saveAttendance(
                          date: _todayDate,
                          submitOnline: true,
                        ),
                  icon: const Icon(Icons.cloud_upload_rounded, size: 18),
                  label: const Text('হাজিরা দাখিল'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // -------------------------------------------------------------
  // TAB 2: CLASSES OVERVIEW
  // -------------------------------------------------------------
  Widget _buildClassesTab(TeacherProvider teacher) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: teacher.classes.length,
      itemBuilder: (context, index) {
        final cls = teacher.classes[index];
        return EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    cls.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (cls.department != null)
                    EhrjStatusBadge(
                      type: BadgeType.draft,
                      customLabel: cls.department,
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'শাখা সংখ্যা: ${cls.sections.length} টি (${cls.sections.map((s) => s.name).join(', ')})',
                style: const TextStyle(fontSize: 13, color: Colors.black54),
              ),
            ],
          ),
        );
      },
    );
  }

  // -------------------------------------------------------------
  // TAB 3: EXAM MARKS ENTRY
  // -------------------------------------------------------------
  Widget _buildMarksTab(TeacherProvider teacher) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'পরীক্ষার নম্বর প্রদান ও ড্রাফট সংরক্ষণ',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),

              // Exam Dropdown
              DropdownButtonFormField<String>(
                initialValue: teacher.selectedExam?.id,
                decoration: const InputDecoration(
                  labelText: 'পরীক্ষা নির্বাচন',
                ),
                items: teacher.exams.map((e) {
                  return DropdownMenuItem(value: e.id, child: Text(e.title));
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    final ex = teacher.exams.firstWhere((e) => e.id == val);
                    teacher.selectExam(ex);
                  }
                },
              ),
              const SizedBox(height: 12),

              // Subject Dropdown
              if (teacher.subjects.isNotEmpty)
                DropdownButtonFormField<String>(
                  initialValue: teacher.selectedSubject?.id,
                  decoration: const InputDecoration(
                    labelText: 'বিষয় নির্বাচন',
                  ),
                  items: teacher.subjects.map((sub) {
                    return DropdownMenuItem(
                      value: sub.id,
                      child: Text('${sub.name} (পূর্ণমান: ${sub.totalMarks})'),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      final sub = teacher.subjects.firstWhere(
                        (s) => s.id == val,
                      );
                      teacher.selectSubject(sub);
                    }
                  },
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Action Buttons: Save Marks
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: teacher.isLoading
                    ? null
                    : () => teacher.saveMarks(submitOnline: false),
                icon: const Icon(Icons.save_as_rounded, size: 18),
                label: const Text('নম্বর ড্রাফট সেভ'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: teacher.isLoading
                    ? null
                    : () => teacher.saveMarks(submitOnline: true),
                icon: const Icon(Icons.cloud_upload_rounded, size: 18),
                label: const Text('নম্বর দাখিল'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // -------------------------------------------------------------
  // TAB 4: LEAVE REQUESTS
  // -------------------------------------------------------------
  Widget _buildLeaveTab(TeacherProvider teacher) {
    final leaveBalances = teacher.leaveData['balances'] as List? ?? [];
    final employeeInfo = teacher.leaveData['employee'];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (employeeInfo != null)
          EhrjCard(
            padding: const EdgeInsets.all(16),
            backgroundColor: AppColors.primaryContainer.withValues(alpha: 0.3),
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: AppColors.primary,
                  child: Icon(Icons.person_rounded, color: Colors.white),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'শিক্ষক আইডি: ${employeeInfo['employeeId'] ?? ""}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        'পদবী: ${employeeInfo['designation'] ?? "উস্তাদ"}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.black54,
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => _showLeaveDialog(context, teacher),
                  icon: const Icon(Icons.add_rounded, size: 16),
                  label: const Text('আবেদন'),
                ),
              ],
            ),
          ),
        const SizedBox(height: 16),

        const Text(
          'চলতি বছরের ছুটির ব্যালেন্স',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 10),

        if (leaveBalances.isEmpty)
          const EhrjCard(
            padding: EdgeInsets.all(16),
            child: Text('ছুটির কোনো ব্যালেন্স রেকর্ড পাওয়া যায়নি।'),
          )
        else
          ...leaveBalances.map((b) {
            return EhrjCard(
              padding: const EdgeInsets.all(12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    b['nameBn'] ?? b['nameEn'] ?? 'ছুটি',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'অবশিষ্ট: ${b['remainingDays'] ?? b['allocatedDays']} দিন',
                    style: const TextStyle(
                      color: AppColors.present,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  // -------------------------------------------------------------
  // TAB 5: SYNC QUEUE
  // -------------------------------------------------------------
  Widget _buildSyncQueueTab(SyncProvider sync) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          EhrjCard(
            backgroundColor: AppColors.primaryContainer,
            child: Row(
              children: [
                Icon(
                  sync.isOnline
                      ? Icons.cloud_done_rounded
                      : Icons.cloud_off_rounded,
                  size: 40,
                  color: sync.isOnline ? AppColors.present : AppColors.absent,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        sync.isOnline
                            ? 'ইন্টারনেট সংযুক্ত'
                            : 'ইন্টারনেট বিচ্ছিন্ন',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'অপেক্ষমান সিঙ্ক রেকর্ড: ${sync.pendingCount} টি',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          ElevatedButton.icon(
            onPressed: (sync.isSyncing || sync.pendingCount == 0)
                ? null
                : () => sync.syncNow(),
            icon: sync.isSyncing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.sync_rounded),
            label: Text(
              sync.isSyncing ? 'সিঙ্ক হচ্ছে...' : AppStringsBn.syncNow,
            ),
          ),

          if (sync.lastSyncMessage != null) ...[
            const SizedBox(height: 12),
            Text(
              sync.lastSyncMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _metricChip(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '$label: $count',
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 11,
        ),
      ),
    );
  }

  Widget _statusButton({
    required String label,
    required Color color,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? color : color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color, width: isSelected ? 1.5 : 0.8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : color,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  void _showLeaveDialog(BuildContext context, TeacherProvider teacher) {
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dialogCtx, setDialogState) => AlertDialog(
          title: const Text('ছুটির আবেদন ফরম'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: _selectedLeaveType,
                decoration: const InputDecoration(labelText: 'ছুটির ধরন'),
                items: const [
                  DropdownMenuItem(
                    value: 'CASUAL',
                    child: Text('নৈমিত্তিক ছুটি (Casual)'),
                  ),
                  DropdownMenuItem(
                    value: 'SICK',
                    child: Text('অসুস্থতাজনিত ছুটি (Medical)'),
                  ),
                  DropdownMenuItem(
                    value: 'HAJJ',
                    child: Text('হজ্ব / ওমরাহ ছুটি'),
                  ),
                  DropdownMenuItem(value: 'SPECIAL', child: Text('বিশেষ ছুটি')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setDialogState(() => _selectedLeaveType = val);
                    setState(() => _selectedLeaveType = val);
                  }
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _leaveReasonController,
                decoration: const InputDecoration(labelText: 'ছুটির কারণ'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text(AppStringsBn.cancel),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                teacher.submitLeave(
                  leaveTypeId: _selectedLeaveType,
                  startDate: _todayDate,
                  endDate: _todayDate,
                  reason: _leaveReasonController.text.trim().isEmpty
                      ? 'প্রয়োজনীয় কাজ'
                      : _leaveReasonController.text.trim(),
                );
              },
              child: const Text('দাখিল করুন'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, AuthProvider auth) {
    EhrjConfirmationDialog.show(
      context: context,
      title: AppStringsBn.logout,
      message: 'আপনি কি নিশ্চিত যে শিক্ষক প্যানেল থেকে প্রস্থান করতে চান?',
      confirmLabel: AppStringsBn.logout,
      isDestructive: true,
    ).then((confirmed) {
      if (confirmed == true) {
        auth.logout();
        widget.onLogout?.call();
      }
    });
  }
}
