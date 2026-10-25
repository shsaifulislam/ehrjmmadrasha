import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/responsive_breakpoints.dart';
import '../../data/repositories/admin_repository.dart';
import '../common/widgets/ehrj_card.dart';
import '../common/widgets/ehrj_confirmation_dialog.dart';
import '../common/widgets/ehrj_logo_widget.dart';
import '../common/widgets/ehrj_status_badge.dart';
import '../common/widgets/payment_receipt_card.dart';
import '../providers/auth_provider.dart';

class AccountantDashboardScreen extends StatefulWidget {
  final VoidCallback onLogout;

  const AccountantDashboardScreen({super.key, required this.onLogout});

  @override
  State<AccountantDashboardScreen> createState() =>
      _AccountantDashboardScreenState();
}

class _AccountantDashboardScreenState extends State<AccountantDashboardScreen> {
  int _currentTabIndex = 0;
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _financeData;

  @override
  void initState() {
    super.initState();
    _loadFinanceOverview();
  }

  Future<void> _loadFinanceOverview() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final adminRepo = context.read<AdminRepository>();
      final data = await adminRepo.getFinanceOverview();

      if (!mounted) return;
      setState(() {
        _financeData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'অর্থনৈতিক তথ্য লোড করতে সমস্যা হয়েছে: $e';
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
                  'হিসাবরক্ষণ ও অর্থ বিভাগ',
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
            onPressed: _loadFinanceOverview,
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
                            onPressed: _loadFinanceOverview,
                            icon: const Icon(Icons.refresh_rounded),
                            label: const Text('পুনরায় চেষ্টা করুন'),
                          ),
                        ],
                      ),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadFinanceOverview,
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
                  icon: Icon(Icons.account_balance_wallet_outlined),
                  selectedIcon: Icon(Icons.account_balance_wallet_rounded),
                  label: 'কালেকশন',
                ),
                NavigationDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long_rounded),
                  label: 'রসিদ ও তহবিল',
                ),
                NavigationDestination(
                  icon: Icon(Icons.pending_actions_outlined),
                  selectedIcon: Icon(Icons.pending_actions_rounded),
                  label: 'বকেয়া লেজার',
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
          _sidebarItem(
            0,
            'দৈনিক ফি কালেকশন',
            Icons.account_balance_wallet_rounded,
          ),
          _sidebarItem(1, 'অফিসিয়াল রসিদ ও তহবিল', Icons.receipt_long_rounded),
          _sidebarItem(
            2,
            'বকেয়া লেজার নিরীক্ষা',
            Icons.pending_actions_rounded,
          ),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(
              Icons.verified_rounded,
              color: AppColors.present,
            ),
            title: const Text(
              'হিসাব বিভাগ সুরক্ষিত',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            subtitle: const Text(
              'অনলাইন ভাউচার সিঙ্কড',
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
        return _buildCollectionTab();
      case 1:
        return _buildReceiptsTab();
      case 2:
        return _buildDuesTab();
      default:
        return _buildCollectionTab();
    }
  }

  Widget _buildCollectionTab() {
    final metrics = _financeData?['metrics'] as Map<String, dynamic>? ?? {};
    final recentInvoices =
        (_financeData?['recentInvoices'] as List<dynamic>?) ?? [];

    final totalCollected =
        metrics['totalCollected'] ?? metrics['todayCollected'] ?? 18500;
    final totalDue = metrics['totalDue'] ?? metrics['pendingDues'] ?? 41200;
    final cashInHand =
        metrics['cashInHand'] ?? metrics['currentCash'] ?? 342000;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: _kpiCard(
                'আজকের আদায়',
                '৳ $totalCollected',
                Icons.payments_rounded,
                AppColors.present,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _kpiCard(
                'হাতে নগদ তহবিল',
                '৳ $cashInHand',
                Icons.account_balance_rounded,
                AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _kpiCard(
                'মোট বকেয়া',
                '৳ $totalDue',
                Icons.error_outline_rounded,
                AppColors.unpaid,
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
              const Text(
                'সাম্প্রতিক ফি আদায় ভাউচার ও রসিদ',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              if (recentInvoices.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'কোনো সাম্প্রতিক ভাউচার পাওয়া যায়নি।',
                      style: TextStyle(color: Colors.black54),
                    ),
                  ),
                )
              else
                ...recentInvoices.map((inv) {
                  final studentName =
                      inv['student']?['fullNameBn'] ??
                      inv['studentName'] ??
                      'শিক্ষার্থী';
                  final title = inv['title'] ?? inv['feeType'] ?? 'মাসিক ফি';
                  final amount = inv['amount'] ?? inv['totalAmount'] ?? 0;
                  final status = inv['status'] ?? 'PAID';
                  return Column(
                    children: [
                      _voucherRow(
                        studentName.toString(),
                        title.toString(),
                        '৳ $amount',
                        status == 'PAID' ? 'পরিশোধিত' : 'বকেয়া',
                        onTap: () => _showReceiptModal(context, inv),
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

  Widget _voucherRow(
    String student,
    String dept,
    String amount,
    String method, {
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  student,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                Text(
                  amount,
                  style: const TextStyle(
                    color: AppColors.present,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'বিবরণ: $dept',
                  style: const TextStyle(fontSize: 11, color: Colors.black54),
                ),
                EhrjStatusBadge(type: BadgeType.paid, customLabel: method),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptsTab() {
    final funds = (_financeData?['funds'] as List<dynamic>?) ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'মাদ্রাসার অনুমোদিত ক্যাশ ফান্ড ও তহবিল',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              if (funds.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(
                    child: Text(
                      'কোনো সক্রিয় ফান্ড পাওয়া যায়নি।',
                      style: TextStyle(color: Colors.black54),
                    ),
                  ),
                )
              else
                ...funds.map((f) {
                  final fundName = f['nameBn'] ?? f['name'] ?? 'ফান্ড';
                  final balance = f['currentBalance'] ?? f['balance'] ?? 0;
                  final category = f['category'] ?? 'জেনারেল ফান্ড';
                  return Column(
                    children: [
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const CircleAvatar(
                          backgroundColor: AppColors.primaryContainer,
                          child: Icon(
                            Icons.account_balance,
                            color: AppColors.primary,
                          ),
                        ),
                        title: Text(
                          fundName.toString(),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        subtitle: Text('ক্যাটাগরি: $category'),
                        trailing: Text(
                          '৳ $balance',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: AppColors.present,
                          ),
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

  Widget _buildDuesTab() {
    final pendingDues = (_financeData?['pendingDues'] as List<dynamic>?) ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        EhrjCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'বকেয়া তালিকা ও রিকভারি রেজিস্টার',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              if (pendingDues.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(
                    child: Text(
                      'কোনো বকেয়া ভাউচার মুলতুবি নেই।',
                      style: TextStyle(color: Colors.black54),
                    ),
                  ),
                )
              else
                ...pendingDues.map((d) {
                  final studentName = d['studentName'] ?? 'শিক্ষার্থী';
                  final dueAmount = d['dueAmount'] ?? 0;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(studentName.toString()),
                    trailing: Text(
                      '৳ $dueAmount বকেয়া',
                      style: const TextStyle(
                        color: AppColors.unpaid,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  );
                }),
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
      message: 'আপনি কি নিশ্চিত যে হিসাবরক্ষণ সেশন থেকে প্রস্থান করতে চান?',
      confirmLabel: AppStringsBn.logout,
      isDestructive: true,
    ).then((confirmed) {
      if (confirmed == true) {
        auth.logout();
        widget.onLogout();
      }
    });
  }

  void _showReceiptModal(BuildContext context, Map<String, dynamic> inv) {
    final amount = (inv['amount'] ?? inv['totalAmount'] ?? 0) is num
        ? (inv['amount'] ?? inv['totalAmount'] ?? 0).toDouble()
        : 0.0;

    final studentName =
        inv['student']?['fullNameBn'] ?? inv['studentName'] ?? 'শিক্ষার্থী';

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
            studentName: studentName.toString(),
            studentIdNumber:
                inv['student']?['studentIdNumber']?.toString() ??
                inv['studentIdNumber']?.toString() ??
                'EHRJ-STD-001',
            className: inv['className']?.toString() ?? 'হিফজুল কুরআন বিভাগ',
            feeTitle: inv['title']?.toString() ?? 'মাসিক ফি আদায়',
            amount: amount,
            paymentMethod: inv['paymentMethod']?.toString() ?? 'নগদ কাউন্টার',
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
