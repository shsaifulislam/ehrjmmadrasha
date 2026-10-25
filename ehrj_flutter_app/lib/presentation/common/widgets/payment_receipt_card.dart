import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/config/app_config.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings_bn.dart';
import 'ehrj_logo_widget.dart';
import 'ehrj_status_badge.dart';

class PaymentReceiptCard extends StatelessWidget {
  final String receiptNumber;
  final String date;
  final String studentName;
  final String studentIdNumber;
  final String className;
  final String feeTitle;
  final double amount;
  final String paymentMethod;
  final String? qrToken;
  final VoidCallback? onPrint;
  final String? baseUrl;

  const PaymentReceiptCard({
    super.key,
    required this.receiptNumber,
    required this.date,
    required this.studentName,
    required this.studentIdNumber,
    required this.className,
    required this.feeTitle,
    required this.amount,
    required this.paymentMethod,
    this.qrToken,
    this.onPrint,
    this.baseUrl,
  });

  String get verificationUrl {
    final root = (baseUrl != null && baseUrl!.trim().isNotEmpty)
        ? baseUrl!.trim().replaceAll(RegExp(r'/+$'), '')
        : AppConfig.apiBaseUrl;
    final token = qrToken ?? receiptNumber;
    return '$root/api/verify/receipt/$token';
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
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.withValues(alpha: 0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primaryContainer.withValues(alpha: 0.3),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(15),
              ),
            ),
            child: Row(
              children: [
                const EhrjLogoWidget(size: 36, showBorder: false),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        AppStringsBn.institutionName,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      Text(
                        'অফিসিয়াল ফি আদায় রসিদ (Official Receipt)',
                        style: TextStyle(fontSize: 10, color: Colors.black54),
                      ),
                    ],
                  ),
                ),
                const EhrjStatusBadge(
                  type: BadgeType.paid,
                  customLabel: 'পরিশোধিত',
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _metaText('রসিদ নম্বর:', receiptNumber, isBold: true),
                    _metaText('তারিখ:', date),
                  ],
                ),
                const SizedBox(height: 10),
                const Divider(),
                const SizedBox(height: 8),

                _rowItem('শিক্ষার্থীর নাম:', studentName),
                _rowItem('আইডি নম্বর:', studentIdNumber),
                _rowItem('শ্রেণি / জামাত:', className),
                _rowItem('ফি বিবরণ:', feeTitle),
                _rowItem('পরিশোধের মাধ্যম:', paymentMethod),

                const SizedBox(height: 10),
                const Divider(),
                const SizedBox(height: 8),

                // Amount Row
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.present.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.present.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'মোট পরিশোধিত অর্থ:',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      Text(
                        '৳ ${amount.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: AppColors.present,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // QR Code Row
                Row(
                  children: [
                    QrImageView(
                      data: verificationUrl,
                      version: QrVersions.auto,
                      size: 60.0,
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
                            'ডিজিটাল ভেরিফিকেশন কোড',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'রসিদের সত্যতা যাচাই করতে কোডটি স্ক্যান করুন। কোনো ম্যানুয়াল স্বাক্ষরের প্রয়োজন নেই।',
                            style: TextStyle(
                              fontSize: 9.5,
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          if (onPrint != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.05),
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(15),
                ),
              ),
              child: ElevatedButton.icon(
                onPressed: onPrint,
                icon: const Icon(Icons.print_rounded, size: 16),
                label: const Text('রসিদ প্রিন্ট / সংরক্ষণ করুন'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _rowItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11.5, color: Colors.black54),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget _metaText(String label, String value, {bool isBold = false}) {
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.black54),
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: isBold ? AppColors.primary : Colors.black87,
          ),
        ),
      ],
    );
  }
}
