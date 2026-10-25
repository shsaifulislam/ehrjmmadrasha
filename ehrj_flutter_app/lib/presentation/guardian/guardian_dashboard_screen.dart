import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../core/network/api_client.dart';
import '../../data/repositories/portal_repository.dart';
import '../common/widgets/ehrj_card.dart';
import '../common/widgets/ehrj_status_badge.dart';
import '../common/widgets/payment_receipt_card.dart';
import '../common/widgets/student_digital_id_card.dart';
import '../portal/student_leave_request_modal.dart';
import '../providers/auth_provider.dart';

class GuardianDashboardScreen extends StatefulWidget {
  final VoidCallback? onLogout;

  const GuardianDashboardScreen({super.key, this.onLogout});

  @override
  State<GuardianDashboardScreen> createState() =>
      _GuardianDashboardScreenState();
}

class _GuardianDashboardScreenState extends State<GuardianDashboardScreen> {
  int _currentTabIndex = 0;
  bool _isLoading = true;
  List<Map<String, dynamic>> _children = [];
  Map<String, dynamic>? _selectedChild;
  List<Map<String, dynamic>> _invoices = [];
  List<Map<String, dynamic>> _results = [];

  Map<String, dynamic>? _attendanceData;

  @override
  void initState() {
    super.initState();
    _loadGuardianData();
  }

  Future<void> _loadGuardianData() async {
    setState(() => _isLoading = true);
    final portalRepo = context.read<PortalRepository>();
    final kids = await portalRepo.getChildren();

    _children = kids;
    if (kids.isNotEmpty) {
      _selectedChild = kids.first;
      await _loadChildDetails(_selectedChild!['id']?.toString() ?? '');
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _loadChildDetails(String studentId) async {
    if (studentId.isEmpty) return;
    final portalRepo = context.read<PortalRepository>();
    final finance = await portalRepo.getFees(studentId);
    final att = await portalRepo.getAttendance(studentId);
    final res = await portalRepo.getResults(studentId);
    if (mounted) {
      setState(() {
        _attendanceData = att;
        _invoices = (finance?['invoices'] as List? ?? [])
            .map((e) => e as Map<String, dynamic>)
            .toList();
        _results = res;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(auth.currentUser?.name ?? 'অভিভাবক পোর্টাল'),
            const Text(
              '${AppStringsBn.institutionShort} • ${AppStringsBn.roleGuardian}',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.normal,
                color: Colors.white70,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: AppStringsBn.logout,
            onPressed: () async {
              await auth.logout();
              widget.onLogout?.call();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Horizontal Multi-Child Selector Chips
                if (_children.length > 1)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    color: Colors.white,
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _children.map((c) {
                          final isSelected = c['id']?.toString() == _selectedChild?['id']?.toString();
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              selected: isSelected,
                              avatar: CircleAvatar(
                                radius: 10,
                                backgroundColor: isSelected ? Colors.white : AppColors.primary,
                                child: Text(
                                  (c['fullNameBn']?.toString() ?? 'শ').characters.first,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: isSelected ? AppColors.primary : Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              label: Text(
                                c['fullNameBn']?.toString() ?? 'শিক্ষার্থী',
                                style: TextStyle(
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                  color: isSelected ? Colors.white : const Color(0xFF1E293B),
                                  fontSize: 12,
                                ),
                              ),
                              selectedColor: AppColors.primary,
                              backgroundColor: const Color(0xFFF1F5F9),
                              onSelected: (val) {
                                if (val) {
                                  setState(() => _selectedChild = c);
                                  _loadChildDetails(c['id']?.toString() ?? '');
                                }
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),

                // Selected Child Summary Card with ID Card & Leave Request CTAs
                if (_selectedChild != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    color: AppColors.primaryContainer.withValues(alpha: 0.45),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: AppColors.primary,
                          child: const Icon(Icons.person_rounded, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _selectedChild!['fullNameBn']?.toString() ?? '',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              Text(
                                'আইডি: ${_selectedChild!['studentIdNumber'] ?? ''} • শ্রেণি: ${_selectedChild!['className'] ?? ''}',
                                style: const TextStyle(fontSize: 11, color: Colors.black87),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'ছুটির আবেদন',
                          icon: const Icon(Icons.event_note, color: AppColors.primary),
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                              ),
                              builder: (_) => StudentLeaveRequestModal(
                                studentName: _selectedChild!['fullNameBn']?.toString() ?? '',
                                studentId: _selectedChild!['id']?.toString() ?? '',
                              ),
                            );
                          },
                        ),
                        IconButton(
                          tooltip: 'ডিজিটাল আইডি কার্ড',
                          icon: const Icon(Icons.badge_rounded, color: AppColors.primary),
                          onPressed: () => _showChildDigitalIdModal(context),
                        ),
                      ],
                    ),
                  ),

                // Content Views
                Expanded(
                  child: _currentTabIndex == 0
                      ? _buildOverviewTab()
                      : _currentTabIndex == 1
                      ? _buildFeesTab()
                      : _buildResultsTab(),
                ),
              ],
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        onDestinationSelected: (idx) => setState(() => _currentTabIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded),
            label: 'ওভারভিউ',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long_rounded),
            label: 'ফি ও বকেয়া',
          ),
          NavigationDestination(
            icon: Icon(Icons.assessment_outlined),
            selectedIcon: Icon(Icons.assessment_rounded),
            label: 'ফলাফল',
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.event_available_rounded, color: AppColors.primary),
                  SizedBox(width: 8),
                  Text(
                    'হাজিরা স্ট্যাটাস',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _statItem(
                    'উপস্থিতি হার',
                    '${_attendanceData?['stats']?['percentage'] ?? _attendanceData?['percentage'] ?? 95}%',
                    AppColors.present,
                  ),
                  _statItem(
                    'উপস্থিত দিন',
                    '${_attendanceData?['stats']?['presentCount'] ?? _attendanceData?['presentCount'] ?? 24} দিন',
                    AppColors.primary,
                  ),
                  _statItem(
                    'অনুপস্থিত',
                    '${_attendanceData?['stats']?['absentCount'] ?? _attendanceData?['absentCount'] ?? 0} দিন',
                    AppColors.absent,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(
                    Icons.notifications_active_rounded,
                    color: AppColors.gold,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'সাম্প্রতিক নোটিশ ও বার্তা',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                'আগামী রবিবার থেকে ১ম সাময়িক পরীক্ষা অনুষ্ঠিত হবে। সকল অভিভাবককে নির্ধারিত সময়ের মধ্যে পরীক্ষার প্রবেশপত্র সংগ্রহ করতে অনুরোধ করা যাচ্ছে।',
                style: TextStyle(fontSize: 13, height: 1.4),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _statItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildFeesTab() {
    if (_invoices.isEmpty) {
      return const Center(child: Text('কোনো বকেয়া ফি নেই।'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _invoices.length,
      itemBuilder: (context, idx) {
        final inv = _invoices[idx];
        final amount = inv['amount'] ?? inv['totalAmount'] ?? 0;
        final status = inv['status']?.toString().toUpperCase() ?? 'UNPAID';
        final isPaid = status == 'PAID';

        return EhrjCard(
          onTap: isPaid ? () => _showReceiptModal(context, inv) : null,
          child: ListTile(
            leading: Icon(
              isPaid
                  ? Icons.check_circle_rounded
                  : Icons.pending_actions_rounded,
              color: isPaid ? AppColors.paid : AppColors.unpaid,
            ),
            title: Text(
              inv['title']?.toString() ??
                  inv['invoiceNumber']?.toString() ??
                  'ফি ইনভয়েস',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              isPaid
                  ? 'পরিশোধিত • ডিজিটাল রসিদ দেখতে ট্যাপ করুন'
                  : 'মেয়াদ: ${inv['dueDate'] ?? 'চলতি মাস'}',
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '৳$amount',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                EhrjStatusBadge(
                  type: isPaid ? BadgeType.paid : BadgeType.unpaid,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildResultsTab() {
    if (_results.isEmpty) {
      return const Center(
        child: Text('কোনো পরীক্ষার ফলাফল এখনও প্রকাশিত হয়নি।'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _results.length,
      itemBuilder: (context, idx) {
        final res = _results[idx];
        return EhrjCard(
          child: ListTile(
            leading: const Icon(
              Icons.military_tech_rounded,
              color: AppColors.gold,
            ),
            title: Text(
              res['examTitle']?.toString() ?? 'পরীক্ষার ফলাফল',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              'প্রাপ্ত জিপিএ / গ্রেড: ${res['grade'] ?? 'মুমতাজ (A+)'}',
            ),
            trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
          ),
        );
      },
    );
  }

  void _showChildDigitalIdModal(BuildContext context) {
    if (_selectedChild == null) return;
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: StudentDigitalIdCard(
            studentId: _selectedChild!['id']?.toString() ?? '',
            fullNameBn:
                _selectedChild!['fullNameBn']?.toString() ?? 'শিক্ষার্থী',
            studentIdNumber:
                _selectedChild!['studentIdNumber']?.toString() ??
                'EHRJ-STD-001',
            className:
                _selectedChild!['className']?.toString() ??
                'হিফজুল কুরআন বিভাগ',
            sectionName: _selectedChild!['sectionName']?.toString() ?? 'ক শাখা',
            rollNumber: _selectedChild!['rollNumber'] as int? ?? 1,
            session: '২০২৬',
            bloodGroup: 'B+',
            baseUrl: context.read<ApiClient>().baseUrl,
          ),
        ),
      ),
    );
  }

  void _showReceiptModal(BuildContext context, Map<String, dynamic> inv) {
    final amount = (inv['amount'] ?? inv['totalAmount'] ?? 0) is num
        ? (inv['amount'] ?? inv['totalAmount'] ?? 0).toDouble()
        : 0.0;

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: PaymentReceiptCard(
            receiptNumber:
                inv['receiptNumber']?.toString() ??
                inv['invoiceNumber']?.toString() ??
                'EHRJ-RCT-2026',
            date: inv['paidAt']?.toString() ?? '১৭ অক্টোবর ২০২৬',
            studentName:
                _selectedChild?['fullNameBn']?.toString() ?? 'শিক্ষার্থী',
            studentIdNumber:
                _selectedChild?['studentIdNumber']?.toString() ??
                'EHRJ-STD-001',
            className:
                _selectedChild?['className']?.toString() ??
                'হিফজুল কুরআন বিভাগ',
            feeTitle: inv['title']?.toString() ?? 'মাসিক বেতন ও বোর্ডিং ফি',
            amount: amount,
            paymentMethod: inv['paymentMethod']?.toString() ?? 'নগদ / বিকাশ',
            qrToken: inv['qrCodeToken']?.toString(),
            baseUrl: context.read<ApiClient>().baseUrl,
            onPrint: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('অফিসিয়াল রসিদ প্রিন্ট কিউতে পাঠানো হয়েছে।'),
                  backgroundColor: AppColors.present,
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
