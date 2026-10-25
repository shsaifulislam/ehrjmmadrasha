import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../common/widgets/ehrj_status_badge.dart';

class AdminTeacherDirectoryScreen extends StatefulWidget {
  const AdminTeacherDirectoryScreen({super.key});

  @override
  State<AdminTeacherDirectoryScreen> createState() => _AdminTeacherDirectoryScreenState();
}

class _AdminTeacherDirectoryScreenState extends State<AdminTeacherDirectoryScreen> {
  final _searchController = TextEditingController();
  String _selectedDept = 'ALL';
  String _searchQuery = '';

  final List<Map<String, dynamic>> _teachers = [
    {
      'id': 'tch-01',
      'name': 'মুফতি আব্দুর রউফ কাসেমী',
      'designation': 'প্রধান মুহাদ্দিস ও শায়খুল হাদিস',
      'dept': 'KITAB',
      'deptName': 'কিতাব বিভাগ',
      'phone': '01819-848220',
      'status': 'ACTIVE',
      'classes': 'দাওরায়ে হাদিস, বুখারী শরীফ',
    },
    {
      'id': 'tch-02',
      'name': 'হাফেজ ক্বারী মুহাম্মদ ইসমাইল',
      'designation': 'প্রধান ক্বারী ও হিফজ প্রধান',
      'dept': 'HIFZ',
      'deptName': 'তাহফিজুল কুরআন',
      'phone': '01711-223344',
      'status': 'ACTIVE',
      'classes': 'হিফজ ১ম ও ২য় গ্রুপ',
    },
    {
      'id': 'tch-03',
      'name': 'মাওলানা মাহমুদুল হাসান',
      'designation': 'মুশরিফ ও নূরানী প্রশিক্ষক',
      'dept': 'NOORANI',
      'deptName': 'নূরানী ও নাজেরা',
      'phone': '01912-334455',
      'status': 'ACTIVE',
      'classes': 'নূরানী ১ম জামাত',
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _teachers.where((t) {
      final matchesDept = _selectedDept == 'ALL' || t['dept'] == _selectedDept;
      final matchesQuery = _searchQuery.isEmpty ||
          t['name'].toString().contains(_searchQuery) ||
          t['phone'].toString().contains(_searchQuery);
      return matchesDept && matchesQuery;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('শিক্ষক ও ওলামা পরিষদ'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Filter Header
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'উস্তাদের নাম বা মোবাইল দিয়ে খুঁজুন...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val.trim()),
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildChip('সকল বিভাগ', 'ALL'),
                      _buildChip('কিতাব বিভাগ', 'KITAB'),
                      _buildChip('তাহফিজুল কুরআন', 'HIFZ'),
                      _buildChip('নূরানী বিভাগ', 'NOORANI'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Count
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFFF1F5F9),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'নিবন্ধিত উস্তাদ: ${filtered.length} জন',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primaryDark),
                ),
                const Text('সকল তথ্য পরীক্ষিত', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),

          // List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              itemBuilder: (context, idx) {
                final teacher = filtered[idx];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 20,
                            backgroundColor: const Color(0xFFECFDF5),
                            child: const Icon(Icons.school, color: AppColors.primary, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  teacher['name'],
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primaryDark),
                                ),
                                Text(
                                  teacher['designation'],
                                  style: const TextStyle(fontSize: 12, color: AppColors.accentDark, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                          EhrjStatusBadge(status: teacher['status'], text: 'সক্রিয় (Active)'),
                        ],
                      ),
                      const Divider(height: 20),
                      Text('বিভাগ: ${teacher['deptName']} • পাঠদান: ${teacher['classes']}', style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.phone, size: 14, color: AppColors.primary),
                          const SizedBox(width: 6),
                          Text(teacher['phone'], style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String value) {
    final isSelected = _selectedDept == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        selected: isSelected,
        label: Text(label, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : const Color(0xFF334155))),
        selectedColor: AppColors.primary,
        backgroundColor: const Color(0xFFF1F5F9),
        onSelected: (val) {
          if (val) setState(() => _selectedDept = value);
        },
      ),
    );
  }
}
