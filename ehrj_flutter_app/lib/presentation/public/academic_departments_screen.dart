import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../common/widgets/ehrj_card.dart';
import 'admission_apply_screen.dart';

class AcademicDepartmentsScreen extends StatefulWidget {
  const AcademicDepartmentsScreen({super.key});

  @override
  State<AcademicDepartmentsScreen> createState() =>
      _AcademicDepartmentsScreenState();
}

class _AcademicDepartmentsScreenState extends State<AcademicDepartmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, dynamic>> _departments = [
    {
      'title': 'নূরানী ও নাযেরা বিভাগ',
      'arabic': 'قسم النوراني والناظرة',
      'icon': Icons.menu_book_rounded,
      'color': const Color(0xFF0D5C3A),
      'duration': '২ বছর মেয়াদী',
      'eligibility': 'বয়স: ৫ থেকে ৮ বছর',
      'description':
          'সহীহ কুরআন তেলাওয়াত, মাখরাজ ও সিফাত শিক্ষা, বুনিয়াদী আরবী, বাংলা, ইংরেজি, গণিত এবং দৈনন্দিন জীবনের জরুরী মাসনূন দুআ ও মাসায়েল পাঠদান।',
      'features': [
        'তাজবীদভিত্তিক বিশুদ্ধ হরফ উচ্চারণ প্রশিক্ষণ',
        'সহজ পদ্ধতিতে নাযেরা খতম',
        'শিশুদের উপযোগী ইসলামী আদব ও চরিত্র গঠন',
        'সাধারণ প্রাথমিক শিক্ষার সমন্বিত পাঠক্রম',
      ],
      'classes': ['নূরানী প্রথম শ্রেণি', 'নূরানী দ্বিতীয় শ্রেণি', 'নাযেরা কুরআন ক্লাস'],
    },
    {
      'title': 'তাহফীজুল কুরআন (হিফজ অনুষদ)',
      'arabic': 'قسم تحفيظ القرآن الكريم',
      'icon': Icons.auto_stories_rounded,
      'color': const Color(0xFFD97706),
      'duration': '২ থেকে ৩ বছর',
      'eligibility': 'নাযেরা উত্তীর্ণ ছাত্রবৃন্দ',
      'description':
          'আন্তর্জাতিক মানসম্পন্ন তাজবীদের সাথে পবিত্র ৩০ পারা কুরআনুল কারীম হিফজ সমাপ্তকরণ, সার্বক্ষণিক মুখস্থ তদারকি এবং হুসনে সওত (মধুর কণ্ঠ) প্রশিক্ষণ।',
      'features': [
        'আন্তর্জাতিক ক্বেরাত ও তাজবীদ প্রশিক্ষণ',
        'প্রতিদিন নতুন ছবক, সাত ছবক ও আমোখতা শ্রবণ',
        'সিসিটিভি নিয়ন্ত্রিত আধুনিক নিবিড় পরিবেশ',
        'জাতীয় ও আন্তর্জাতিক হিফজ প্রতিযোগিতায় অংশগ্রহণ',
      ],
      'classes': ['হিফজ প্রাথমিক স্তর (১ম ১০ পারা)', 'হিফজ মধ্যম স্তর (২০ পারা)', 'হিফজ সমাপনী ও দাওর'],
    },
    {
      'title': 'কিতাব অনুষদ (দরসে নিজামী)',
      'arabic': 'قسم الكتب والحديث الشريف',
      'icon': Icons.school_rounded,
      'color': const Color(0xFF2563EB),
      'duration': '৮ বছর মেয়াদী',
      'eligibility': 'হিফজ অথবা নূরানী উত্তীর্ণ শিক্ষার্থী',
      'description':
          'বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশের অনুমোদিত পাঠ্যক্রম অনুযায়ী নাহব, ছরফ, ফিকাহ, উসুল, তাফসীর, মানতিক এবং সিহাহ সিত্তাহ হাদীস পাঠদান।',
      'features': [
        'দরসে নিজামী ধারার প্রামাণ্য কিতাবাদি পাঠ',
        'আরবী ও উর্দু ভাষায় প্রাঞ্জল কথোপকথন ও লিখন চর্চা',
        'দাওরায়ে হাদীস (মাস্টার্স সমমান ইসলামিক স্টাডিজ)',
        'সুদক্ষ ও প্রাজ্ঞ মুফাসসির ও মুহাদ্দিসগণের সার্বক্ষণিক পাঠদান',
      ],
      'classes': [
        'মিযান ও মুনশাইব',
        'নাহবেমীর জামাত',
        'হেদায়েতুন্নাহব জামাত',
        'কাফিয়া জামাত',
        'শরহে বেকায়া জামাত',
        'জালালাইন জামাত',
        'মেশকাত শরীফ জামাত',
        'দাওরায়ে হাদীস (তাকমীল)',
      ],
    },
    {
      'title': 'লিল্লাহ বোর্ডিং ও এতিমখানা',
      'arabic': 'قسم دار الإيتام والضيافة',
      'icon': Icons.volunteer_activism_rounded,
      'color': const Color(0xFF7C3AED),
      'duration': 'সার্বক্ষণিক দ্বীনি সেবা',
      'eligibility': 'এতিম, অসহায় ও দুস্থ ছাত্রবৃন্দ',
      'description':
          'পবিত্র কুরআনুল কারীমের শিক্ষার্থী ও এতিম শিশুদের সার্বক্ষণিক থাকা-খাওয়া, চিকিৎসা, পোশাক এবং সম্পূর্ণ বিনামূল্যে শিক্ষা প্রদান করা হয়।',
      'features': [
        '১০০% বিনামূল্যে পুষ্টিকর খাবার ও বাসস্থান',
        'অভিভাবকহীন শিশুদের মমতা ও স্নেহে লালন-পালন',
        'চিকিৎসা ও প্রাতিষ্ঠানিক পোশাকের পূর্ণ দায়িত্ব গ্রহণ',
        'উন্নত দ্বীনি শিক্ষা ও কর্মসংস্থান উপযোগী পথনির্দেশনা',
      ],
      'classes': ['আবাসিক ছাত্রাবাস', 'দৈনিক লঙ্গরখানা', 'বিনামূল্যে কিতাব বিতরণ'],
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _departments.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('শিক্ষা কার্যক্রম ও অনুষদসমূহ'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppColors.accent,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: _departments.map((d) => Tab(text: d['title'])).toList(),
        ),
      ),
      body: Column(
        children: [
          // Hadith Header Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF041F14), Color(0xFF0D5C3A)],
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_stories, color: AppColors.accent, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَىٰ كُلِّ مُسْلِمٍ',
                        style: TextStyle(
                          color: AppColors.accent,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        '"দ্বীনি ইলম অন্বেষণ করা প্রত্যেক মুসলমানের উপর ফরজ।" — (সূনান ইবনে মাজাহ: ২২৪)',
                        style: TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Department Tab Views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _departments.map((dept) => _buildDepartmentView(dept)).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDepartmentView(Map<String, dynamic> dept) {
    final List<String> features = dept['features'] as List<String>;
    final List<String> classes = dept['classes'] as List<String>;
    final Color deptColor = dept['color'] as Color;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Department Hero Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.cardBorderLight),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: deptColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(dept['icon'] as IconData, color: deptColor, size: 28),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          dept['arabic'],
                          style: TextStyle(
                            color: deptColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          dept['title'],
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimaryLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                dept['description'],
                style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.textSecondaryLight),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  _buildBadge(Icons.timer_outlined, dept['duration'], deptColor),
                  _buildBadge(Icons.how_to_reg_outlined, dept['eligibility'], const Color(0xFF0D5C3A)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Key Department Features
        EhrjCard(
          title: 'পাঠ্যক্রম ও বিশেষ বৈশিষ্ট্যাবলী',
          icon: Icons.verified_outlined,
          child: Column(
            children: features.map((f) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle_rounded, color: Color(0xFF0D5C3A), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      f,
                      style: const TextStyle(fontSize: 13, height: 1.4, color: AppColors.textPrimaryLight),
                    ),
                  ),
                ],
              ),
            )).toList(),
          ),
        ),
        const SizedBox(height: 16),

        // Jamat Classes Directory
        EhrjCard(
          title: 'অনুষদভুক্ত জামাত ও স্তরসমূহ',
          icon: Icons.layers_outlined,
          child: Column(
            children: classes.asMap().entries.map((entry) {
              final idx = entry.key + 1;
              final clsName = entry.value;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.bgLight,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.cardBorderLight),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 26,
                      height: 26,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: deptColor.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$idx',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: deptColor),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        clsName,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppColors.textMutedLight),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 20),

        // Admission Apply Action
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AdmissionApplyScreen()),
              );
            },
            icon: const Icon(Icons.app_registration_rounded),
            label: const Text('এই বিভাগে অনলাইনে ভর্তি আবেদন করুন'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildBadge(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(
            text,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }
}
