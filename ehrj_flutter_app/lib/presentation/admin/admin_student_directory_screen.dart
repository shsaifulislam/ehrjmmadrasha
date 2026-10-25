import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../common/widgets/ehrj_status_badge.dart';

class AdminStudentDirectoryScreen extends StatefulWidget {
  const AdminStudentDirectoryScreen({super.key});

  @override
  State<AdminStudentDirectoryScreen> createState() => _AdminStudentDirectoryScreenState();
}

class _AdminStudentDirectoryScreenState extends State<AdminStudentDirectoryScreen> {
  final _searchController = TextEditingController();
  String _selectedClass = 'ALL';
  String _searchQuery = '';

  final List<Map<String, dynamic>> _students = [
    {
      'id': 'std-001',
      'nameBn': 'মুহাম্মদ আব্দুল্লাহ',
      'nameEn': 'Muhammad Abdullah',
      'roll': '১০১',
      'class': 'হিফজুল কুরআন বিভাগ',
      'classCode': 'HIFZ',
      'section': 'ক',
      'guardianName': 'মাওলানা আব্দুল কুদ্দুস',
      'phone': '01819-848220',
      'status': 'ACTIVE',
      'statusText': 'নিয়মিত (Active)',
    },
    {
      'id': 'std-002',
      'nameBn': 'মুহাম্মদ আব্দুর রহমান',
      'nameEn': 'Muhammad Abdur Rahman',
      'roll': '১০২',
      'class': 'হিফজুল কুরআন বিভাগ',
      'classCode': 'HIFZ',
      'section': 'ক',
      'guardianName': 'মোঃ শফিকুল ইসলাম',
      'phone': '01712-345678',
      'status': 'ACTIVE',
      'statusText': 'নিয়মিত (Active)',
    },
    {
      'id': 'std-003',
      'nameBn': 'মুহাম্মদ উবাইদুল্লাহ',
      'nameEn': 'Muhammad Ubaidullah',
      'roll': '২০১',
      'class': 'নূরানী ১ম জামাত',
      'classCode': 'NOORANI_1',
      'section': 'খ',
      'guardianName': 'মোঃ মোস্তাফিজুর রহমান',
      'phone': '01911-223344',
      'status': 'ACTIVE',
      'statusText': 'নিয়মিত (Active)',
    },
    {
      'id': 'std-004',
      'nameBn': 'মুহাম্মদ হাসান মাহমুদ',
      'nameEn': 'Hasan Mahmud',
      'roll': '৩০১',
      'class': 'কিতাব বিভাগ (ইবতিদায়্যাহ)',
      'classCode': 'KITAB',
      'section': 'ক',
      'guardianName': 'মোঃ আবুল কাশেম',
      'phone': '01611-998877',
      'status': 'ACTIVE',
      'statusText': 'নিয়মিত (Active)',
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _students.where((s) {
      final matchesClass = _selectedClass == 'ALL' || s['classCode'] == _selectedClass;
      final matchesQuery = _searchQuery.isEmpty ||
          s['nameBn'].toString().contains(_searchQuery) ||
          s['roll'].toString().contains(_searchQuery) ||
          s['phone'].toString().contains(_searchQuery);
      return matchesClass && matchesQuery;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('শিক্ষার্থী ডিরেক্টরি ও প্রোফাইল'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Filter & Search Header
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'শিক্ষার্থীর নাম, রোল বা মোবাইল দিয়ে খুঁজুন...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
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
                      _buildFilterChip('সকল জামাত', 'ALL'),
                      _buildFilterChip('হিফজুল কুরআন', 'HIFZ'),
                      _buildFilterChip('নূরানী ১ম', 'NOORANI_1'),
                      _buildFilterChip('কিতাব বিভাগ', 'KITAB'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Count Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFFF1F5F9),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'মোট শিক্ষার্থী: ${filtered.length} জন',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primaryDark),
                ),
                const Text('সর্বশেষ আপডেট: অদ্য', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),

          // List of Students
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.person_search, size: 48, color: Color(0xFF94A3B8)),
                        SizedBox(height: 8),
                        Text('কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি', style: TextStyle(color: Color(0xFF64748B))),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (context, idx) {
                      final student = filtered[idx];
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
                            radius: 22,
                            backgroundColor: const Color(0xFFECFDF5),
                            child: Text(
                              (student['nameBn'] as String).characters.first,
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 16),
                            ),
                          ),
                          title: Text(
                            student['nameBn'],
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              'রোল: ${student['roll']} • শ্রেণি: ${student['class']} (শাখা: ${student['section']})',
                              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                            ),
                          ),
                          trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                          onTap: () => _showStudentDetails(student),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedClass == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        selected: isSelected,
        label: Text(label, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : const Color(0xFF334155))),
        selectedColor: AppColors.primary,
        backgroundColor: const Color(0xFFF1F5F9),
        onSelected: (val) {
          if (val) setState(() => _selectedClass = value);
        },
      ),
    );
  }

  void _showStudentDetails(Map<String, dynamic> student) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(student['nameBn'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        Text(student['nameEn'], style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                  EhrjStatusBadge(status: student['status'], text: student['statusText']),
                ],
              ),
              const Divider(height: 20),
              _buildDetail('রোল নম্বর', student['roll']),
              _buildDetail('জামাত / বিভাগ', student['class']),
              _buildDetail('শাখা', student['section']),
              _buildDetail('অভিভাবকের নাম', student['guardianName']),
              _buildDetail('যোগাযোগের ফোন', student['phone']),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.check),
                label: const Text('বন্ধ করুন'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
        ],
      ),
    );
  }
}
