import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/config/app_config.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings_bn.dart';
import 'ehrj_logo_widget.dart';

class StudentDigitalIdCard extends StatelessWidget {
  final String studentId;
  final String fullNameBn;
  final String? fullNameEn;
  final String studentIdNumber;
  final String className;
  final String? sectionName;
  final int? rollNumber;
  final String session;
  final String? bloodGroup;
  final String? validTill;
  final bool isResidential;
  final String? baseUrl;

  const StudentDigitalIdCard({
    super.key,
    required this.studentId,
    required this.fullNameBn,
    this.fullNameEn,
    required this.studentIdNumber,
    required this.className,
    this.sectionName,
    this.rollNumber,
    this.session = '২০২৬',
    this.bloodGroup,
    this.validTill = '৩১ ডিসেম্বর ২০২৬',
    this.isResidential = true,
    this.baseUrl,
  });

  /// Generates the official, privacy-safe public verification URL
  String get verificationUrl {
    final root = (baseUrl != null && baseUrl!.trim().isNotEmpty)
        ? baseUrl!.trim().replaceAll(RegExp(r'/+$'), '')
        : AppConfig.apiBaseUrl;
    return '$root/api/verify/student/$studentId';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 360,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.4),
          width: 1.5,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Institutional Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Row(
              children: [
                const EhrjLogoWidget(size: 40, showBorder: false),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        AppStringsBn.institutionName,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'ডিজিটাল শিক্ষার্থী পরিচয়পত্র ($session)',
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Student Photo and Core Details
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Photo Placeholder with Islamic Motif
                    Container(
                      width: 80,
                      height: 95,
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer.withValues(
                          alpha: 0.3,
                        ),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.primary, width: 1),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(
                            Icons.person,
                            size: 48,
                            color: AppColors.primary,
                          ),
                          SizedBox(height: 2),
                          Text(
                            'ছবি',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            fullNameBn,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                          if (fullNameEn != null && fullNameEn!.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              fullNameEn!,
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.black54,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                          const SizedBox(height: 6),
                          _infoLine(
                            'আইডি নম্বর:',
                            studentIdNumber,
                            isBold: true,
                          ),
                          _infoLine('জামাত / শ্রেণি:', className),
                          if (sectionName != null && sectionName!.isNotEmpty)
                            _infoLine('শাখা:', sectionName!),
                          if (rollNumber != null)
                            _infoLine('রোল নম্বর:', rollNumber.toString()),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),

                // Meta Info Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _metaChip('রক্তের গ্রুপ', bloodGroup ?? 'N/A'),
                    _metaChip('আবাসন', isResidential ? 'আবাসিক' : 'অনাবাসিক'),
                    _metaChip('মেয়াদ', validTill ?? '২০২৬'),
                  ],
                ),
                const SizedBox(height: 14),

                // Official QR Code for Public Verification
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: Colors.grey.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    children: [
                      QrImageView(
                        data: verificationUrl,
                        version: QrVersions.auto,
                        size: 64.0,
                        eyeStyle: const QrEyeStyle(
                          eyeShape: QrEyeShape.square,
                          color: AppColors.primary,
                        ),
                        dataModuleStyle: const QrDataModuleStyle(
                          dataModuleShape: QrDataModuleShape.square,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'অফিসিয়াল কিউআর যাচাই',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'ক্যামেরা দিয়ে স্ক্যান করে প্রাতিষ্ঠানিক ডাটাবেজে শিক্ষার্থীর বৈধতা নিশ্চিত করুন।',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Footer Notice
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(14),
              ),
            ),
            child: const Center(
              child: Text(
                'হারিয়ে গেলে অবিলম্বে মাদ্রাসা অফিসে যোগাযোগ করুন • ইলিয়টগঞ্জ, কুমিল্লা',
                style: TextStyle(fontSize: 10, color: Colors.black54),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoLine(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1.5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 75,
            child: Text(
              label,
              style: const TextStyle(fontSize: 11, color: Colors.black54),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
                color: isBold ? AppColors.primary : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _metaChip(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: Colors.black54),
        ),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.primaryContainer.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
        ),
      ],
    );
  }
}
