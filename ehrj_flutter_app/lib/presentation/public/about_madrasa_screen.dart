import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../common/widgets/ehrj_card.dart';
import '../common/widgets/ehrj_logo_widget.dart';

class AboutMadrasaScreen extends StatelessWidget {
  const AboutMadrasaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('পরিচিতি ও ইতিহাস'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Grand Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const EhrjLogoWidget(size: 80),
                  const SizedBox(height: 12),
                  const Text(
                    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                    style: TextStyle(
                      color: AppColors.accent,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryDark,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Eliotgonj Hazi Rohmatollah Jamiria Madrasha',
                    style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: const Text(
                      'স্থাপিত: ২০২১ ইং • কুমিল্লা, বাংলাদেশ',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // History & Objectives
            EhrjCard(
              title: 'মাদরাসার ইতিহাস ও লক্ষ্য',
              icon: Icons.history_edu,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা ২০২১ সালে প্রতিষ্ঠিত একটি আদর্শ দ্বীনি শিক্ষাপ্রতিষ্ঠান। কুরআন ও সুন্নাহর বিশুদ্ধ শিক্ষা প্রচার, চরিত্র গঠন, এবং আধুনিক দ্বীনি শিক্ষার সমন্বয়ে সুযোগ্য আলেম ও হাফেজে কুরআন গড়ে তোলাই আমাদের প্রধান লক্ষ্য।',
                    style: TextStyle(fontSize: 13, height: 1.6, color: Color(0xFF334155)),
                  ),
                  SizedBox(height: 10),
                  Text(
                    'আমাদের প্রধান বিভাগসমূহ:',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                  SizedBox(height: 6),
                  Text('• নূরানী ও নাজেরা বিভাগ (সহজ পদ্ধতিতে বিশুদ্ধ কুরআন তিলাওয়াত)'),
                  Text('• তাহফিজুল কুরআন বিভাগ (আন্তর্জাতিক মানসম্পন্ন হিফজ)'),
                  Text('• কিতাব বিভাগ (ইবতিদায়্যাহ হতে দাওরায়ে হাদিস)'),
                  Text('• লিল্লাহ বোর্ডিং ও এতিমখানা (অসহায় শিক্ষার্থীদের সম্পূর্ণ ফ্রি আবাসন ও খাবার)'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Principal Message Card
            EhrjCard(
              title: 'অধ্যক্ষের বাণী',
              icon: Icons.record_voice_over,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    '“দ্বীনি শিক্ষার আলো ছড়িয়ে দিতে এবং পরবর্তী প্রজন্মকে নৈতিক ও যোগ্য নাগরিক হিসেবে গড়ে তুলতে ইলিয়টগঞ্জ মাদরাসা নিরলসভাবে কাজ করে যাচ্ছে। আমাদের এই দ্বীনি যাত্রায় সকল অভিভাবক ও শুভাকাঙ্ক্ষীদের আন্তরিক দোয়া ও সহযোগিতা কামনা করছি।”',
                    style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, height: 1.6, color: Color(0xFF1E293B)),
                  ),
                  SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      '— অধ্যক্ষ ও মুহতামিম',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Managing Committee Card
            EhrjCard(
              title: 'পরিচালনা পর্ষদ ও কর্তৃপক্ষ',
              icon: Icons.groups,
              child: Column(
                children: [
                  _buildCommitteeRow('সভাপতি', 'বিশিষ্ট শিক্ষানুরাগী ও সমাজসেবক'),
                  const Divider(height: 16),
                  _buildCommitteeRow('সাধারণ সম্পাদক', 'মাদরাসা পরিচালনা পরিষদ'),
                  const Divider(height: 16),
                  _buildCommitteeRow('কোষাধ্যক্ষ', 'হিসাব ও অডিট কমিটি'),
                  const Divider(height: 16),
                  _buildCommitteeRow('মুহতামিম', 'একাডেমিক ও প্রশাসনিক প্রধান'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Contact Info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0D5C3A),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'যোগাযোগের ঠিকানা:',
                    style: TextStyle(color: AppColors.accentLight, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা\nমোবাইল: 01819-848220\nইমেইল: info@ehrjmadrasha.edu.bd',
                    style: TextStyle(color: Colors.white, fontSize: 12, height: 1.5),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _buildCommitteeRow(String title, String subtitle) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryDark)),
        Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
      ],
    );
  }
}
