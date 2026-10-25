import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../data/repositories/admin_repository.dart';
import '../common/widgets/ehrj_empty_state.dart';

class AdminGatepassScreen extends StatefulWidget {
  const AdminGatepassScreen({super.key});

  @override
  State<AdminGatepassScreen> createState() => _AdminGatepassScreenState();
}

class _AdminGatepassScreenState extends State<AdminGatepassScreen> {
  String _activeStatus = 'ALL';
  String _searchQuery = '';
  List<Map<String, dynamic>> _records = [];
  List<Map<String, dynamic>> _residentialStudents = [];
  bool _isLoading = true;

  final List<Map<String, String>> _statusFilters = [
    {'id': 'ALL', 'label': 'সকল গেটপাস'},
    {'id': 'APPROVED', 'label': 'অনুমোদিত'},
    {'id': 'EXITED', 'label': 'ক্যাম্পাসের বাহিরে'},
    {'id': 'RETURNED', 'label': 'প্রত্যাবর্তিত'},
  ];

  @override
  void initState() {
    super.initState();
    _loadGatepasses();
  }

  Future<void> _loadGatepasses() async {
    setState(() => _isLoading = true);
    final repo = context.read<AdminRepository>();
    final res = await repo.getGatepasses(status: _activeStatus, search: _searchQuery);
    if (mounted) {
      final list = (res?['data']?['records'] as List? ?? []);
      final resStudents = (res?['data']?['residentialStudents'] as List? ?? []);
      setState(() {
        _records = list.map((e) => e as Map<String, dynamic>).toList();
        if (resStudents.isNotEmpty) {
          _residentialStudents = resStudents.map((e) => e as Map<String, dynamic>).toList();
        }
        _isLoading = false;
      });
    }
  }

  void _openIssueModal() {
    final formKey = GlobalKey<FormState>();
    final nameCtrl = TextEditingController();
    final rollCtrl = TextEditingController();
    final classCtrl = TextEditingController(text: 'হিফজুল কুরআন বিভাগ');
    final escortNameCtrl = TextEditingController();
    final escortPhoneCtrl = TextEditingController();
    final escortRelCtrl = TextEditingController(text: 'পিতা');
    final descCtrl = TextEditingController();

    String purpose = 'TREATMENT';
    String purposeLabel = 'জরুরি চিকিৎসা / ডাক্তারের পরামর্শ';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            left: 20,
            right: 20,
            top: 20,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.badge_rounded, color: Color(0xFF0D5C3A)),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'নতুন শিক্ষার্থী গেটপাস ইস্যু',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ],
                  ),
                  const Divider(),
                  TextFormField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(labelText: 'শিক্ষার্থীর নাম *'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'নাম আবশ্যক' : null,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: rollCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'রোল নম্বর *'),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'রোল আবশ্যক' : null,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          controller: classCtrl,
                          decoration: const InputDecoration(labelText: 'শ্রেণি / জামাত'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    initialValue: purpose,
                    decoration: const InputDecoration(labelText: 'ছুটি বা প্রস্থানের কারণ *'),
                    items: const [
                      DropdownMenuItem(value: 'TREATMENT', child: Text('জরুরি চিকিৎসা / ডাক্তারের পরামর্শ')),
                      DropdownMenuItem(value: 'EMERGENCY_FAMILY', child: Text('জরুরি পারিবারিক কারণ')),
                      DropdownMenuItem(value: 'WEEKEND_LEAVE', child: Text('সাপ্তাহিক নিয়মিত ছুটি')),
                      DropdownMenuItem(value: 'OFFICIAL_LEAVE', child: Text('অনুমোদিত প্রাতিষ্ঠানিক ছুটি')),
                      DropdownMenuItem(value: 'OTHER', child: Text('অন্যান্য বিশেষ প্রয়োজন')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setModalState(() {
                          purpose = val;
                          if (val == 'TREATMENT') purposeLabel = 'জরুরি চিকিৎসা / ডাক্তারের পরামর্শ';
                          if (val == 'EMERGENCY_FAMILY') purposeLabel = 'জরুরি পারিবারিক কারণ';
                          if (val == 'WEEKEND_LEAVE') purposeLabel = 'সাপ্তাহিক নিয়মিত ছুটি';
                          if (val == 'OFFICIAL_LEAVE') purposeLabel = 'অনুমোদিত প্রাতিষ্ঠানিক ছুটি';
                          if (val == 'OTHER') purposeLabel = 'অন্যান্য বিশেষ প্রয়োজন';
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: escortNameCtrl,
                          decoration: const InputDecoration(labelText: 'অভিভাবক / সাথে যাবেন *'),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'নাম আবশ্যক' : null,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          controller: escortPhoneCtrl,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(labelText: 'অভিভাবক ফোন *'),
                          validator: (v) => (v == null || v.trim().length < 11) ? '১১ ডিজিটের ফোন আবশ্যক' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: descCtrl,
                    decoration: const InputDecoration(labelText: 'বিশেষ মন্তব্য / ফেরত আসার সম্ভাব্য সময়'),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        if (!formKey.currentState!.validate()) return;
                        final nav = Navigator.of(ctx);
                        final messenger = ScaffoldMessenger.of(context);
                        final repo = context.read<AdminRepository>();

                        // Find matching residential student if available
                        String? studentId;
                        for (final s in _residentialStudents) {
                          if (s['fullNameBn'] == nameCtrl.text.trim() ||
                              s['rollNumber']?.toString() == rollCtrl.text.trim()) {
                            studentId = s['id']?.toString();
                            break;
                          }
                        }
                        studentId ??= _residentialStudents.isNotEmpty
                            ? _residentialStudents.first['id']?.toString()
                            : 'student_1';

                        final res = await repo.issueGatepass({
                          'studentId': studentId,
                          'studentNameBn': nameCtrl.text.trim(),
                          'rollNumber': int.tryParse(rollCtrl.text) ?? 1,
                          'className': classCtrl.text.trim(),
                          'purpose': purpose,
                          'purposeLabelBn': purposeLabel,
                          'escortName': escortNameCtrl.text.trim(),
                          'escortPhone': escortPhoneCtrl.text.trim(),
                          'escortRelation': escortRelCtrl.text.trim(),
                          'departureExpected': DateTime.now().toIso8601String(),
                          'returnExpected': DateTime.now().add(const Duration(hours: 6)).toIso8601String(),
                        });

                        if (res['success'] == true) {
                          nav.pop();
                          if (mounted) {
                            _loadGatepasses();
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text(res['message']?.toString() ?? 'গেটপাস সফলভাবে ইস্যু করা হয়েছে'),
                                backgroundColor: const Color(0xFF0D5C3A),
                              ),
                            );
                          }
                        } else {
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(res['error']?.toString() ?? 'গেটপাস তৈরিতে সমস্যা হয়েছে'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      },
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text('গেটপাস অনুমোদন ও প্রিন্ট প্রস্তুত করুন'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0D5C3A),
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('ক্যাম্পাস গেটপাস ব্যবস্থাপনা'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openIssueModal,
        backgroundColor: const Color(0xFF0D5C3A),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_task_rounded),
        label: const Text('নতুন গেটপাস'),
      ),
      body: Column(
        children: [
          // Filter Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _statusFilters.map((f) {
                  final isSel = _activeStatus == f['id'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(f['label']!),
                      selected: isSel,
                      selectedColor: const Color(0xFF0D5C3A),
                      labelStyle: TextStyle(
                        color: isSel ? Colors.white : AppColors.textPrimaryLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      onSelected: (_) {
                        setState(() => _activeStatus = f['id']!);
                        _loadGatepasses();
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const Divider(height: 1),

          // Search
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'শিক্ষার্থীর নাম বা রোল দিয়ে খুঁজুন...',
                prefixIcon: const Icon(Icons.search_rounded),
                contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onChanged: (v) {
                _searchQuery = v.trim();
                _loadGatepasses();
              },
            ),
          ),

          // List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _records.isEmpty
                    ? const EhrjEmptyState(
                        title: 'কোনো গেটপাস রেকর্ড নেই',
                        subtitle: 'এই ফিল্টারে বর্তমানে কোনো ইস্যুকৃত গেটপাস পাওয়া যায়নি।',
                        icon: Icons.badge_outlined,
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _records.length,
                        itemBuilder: (ctx, idx) {
                          final gp = _records[idx];
                          final status = gp['status'] ?? 'APPROVED';

                          Color statusColor = const Color(0xFF0D5C3A);
                          String statusText = 'অনুমোদিত';
                          if (status == 'EXITED') {
                            statusColor = const Color(0xFFD97706);
                            statusText = 'ক্যাম্পাসের বাহিরে';
                          } else if (status == 'RETURNED') {
                            statusColor = const Color(0xFF2563EB);
                            statusText = 'প্রত্যাবর্তিত';
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
                                          color: statusColor.withValues(alpha: 0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(Icons.badge_rounded, color: statusColor, size: 22),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              gp['studentNameBn'] ?? '',
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                            ),
                                            Text(
                                              '${gp['className'] ?? ''} • রোল: ${gp['rollNumber'] ?? ''}',
                                              style: const TextStyle(fontSize: 12, color: AppColors.textMutedLight),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: statusColor.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          statusText,
                                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: statusColor),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  const Divider(height: 1),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(Icons.help_outline_rounded, size: 14, color: AppColors.textMutedLight),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          'কারণ: ${gp['purposeLabelBn'] ?? gp['purpose'] ?? ''}',
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.person_pin_circle_rounded, size: 14, color: AppColors.textMutedLight),
                                      const SizedBox(width: 6),
                                      Text(
                                        'সাথে আছেন: ${gp['escortName'] ?? 'অভিভাবক'} (${gp['escortPhone'] ?? ''})',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondaryLight),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.qr_code_rounded, size: 14, color: Color(0xFF0D5C3A)),
                                      const SizedBox(width: 6),
                                      Text(
                                        'পাস নম্বর: ${gp['passNumber'] ?? ''}',
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0D5C3A)),
                                      ),
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
}
