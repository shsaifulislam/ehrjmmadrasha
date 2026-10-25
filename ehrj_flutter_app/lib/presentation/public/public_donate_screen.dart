import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../data/repositories/public_repository.dart';
import '../common/widgets/ehrj_card.dart';

class PublicDonateScreen extends StatefulWidget {
  const PublicDonateScreen({super.key});

  @override
  State<PublicDonateScreen> createState() => _PublicDonateScreenState();
}

class _PublicDonateScreenState extends State<PublicDonateScreen> {
  final _formKey = GlobalKey<FormState>();

  String _selectedCategory = 'ORPHAN_LILLAH';
  String _selectedCategoryBn = 'এতিম ও লিল্লাহ বোর্ডিং তহবিল';
  double? _selectedAmount = 1000.0;
  final TextEditingController _customAmountController = TextEditingController(text: '1000');

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _trxIdController = TextEditingController();

  bool _isAnonymous = false;
  String _selectedPaymentMethod = 'BKASH';
  String _selectedPaymentMethodBn = 'বিকাশ (পার্সোনাল/মার্চেন্ট)';
  bool _isSubmitting = false;

  final List<Map<String, String>> _categories = [
    {
      'id': 'ORPHAN_LILLAH',
      'title': 'লিল্লাহ বোর্ডিং ও এতিমখানা',
      'desc': 'অসহায় ও এতিম শিশুদের তিনবেলা পুষ্টিকর খাদ্য ও আবাসন ব্যয়',
    },
    {
      'id': 'ZAKAT',
      'title': 'সাধারণ যাকাত তহবিল',
      'desc': 'শরীয়তসম্মতভাবে যাকাত গ্রহণ ও উপযুক্ত হকদারদের মাঝে ব্যয়',
    },
    {
      'id': 'HIFZ_SPONSOR',
      'title': 'হিফজুল কুরআন স্পনসরশিপ',
      'desc': 'একজন কুরআনের হাফেজের মাসিক বা বার্ষিক শিক্ষার সম্পূর্ণ দায়িত্ব গ্রহণ',
    },
    {
      'id': 'CONSTRUCTION',
      'title': 'মসজিদ ও ক্যাম্পাস উন্নয়ন',
      'desc': 'মাদরাসার বহুতল ভবন নির্মাণ, আধুনিক ক্লাসরুম ও মসজিদ সম্প্রসারণ',
    },
  ];

  final List<double> _presetAmounts = [500, 1000, 2500, 5000, 10000, 20000];

  final List<Map<String, String>> _paymentChannels = [
    {
      'id': 'BKASH',
      'name': 'বিকাশ (পার্সোনাল)',
      'number': AppStringsBn.primaryPhone,
      'instructions': 'Send Money করুন এবং Transaction ID টি নিচে লিখুন।',
    },
    {
      'id': 'NAGAD',
      'name': 'নগদ (পার্সোনাল)',
      'number': AppStringsBn.primaryPhone,
      'instructions': 'Send Money করুন এবং TrxID টি নিচে লিখুন।',
    },
    {
      'id': 'BANK',
      'name': 'ব্যাংক একাউন্ট (আল-আরাফাহ্)',
      'number': 'A/C: 1041220000000 (ইলিয়টগঞ্জ শাখা)',
      'instructions': 'সরাসরি ব্যাংক ডিপোজিট বা অনলাইন ফান্ড ট্রান্সফার করুন।',
    },
  ];

  @override
  void dispose() {
    _customAmountController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    _trxIdController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final amount = double.tryParse(_customAmountController.text) ?? 0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('অনুগ্রহ করে সঠিক অনুদানের পরিমাণ লিখুন')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final repo = context.read<PublicRepository>();
    final payload = {
      'donorName': _isAnonymous ? 'গোপন দাতা' : _nameController.text.trim(),
      'donorPhone': _phoneController.text.trim(),
      'donorAddress': _addressController.text.trim(),
      'fundCategory': _selectedCategory,
      'fundCategoryBn': _selectedCategoryBn,
      'amount': amount,
      'paymentMethod': _selectedPaymentMethod,
      'paymentMethodBn': _selectedPaymentMethodBn,
      'transactionId': _trxIdController.text.trim(),
      'isAnonymous': _isAnonymous,
      'notes': _notesController.text.trim(),
    };

    final result = await repo.submitDonation(payload);

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result['success'] == true) {
      final donation = result['donation'] as Map<String, dynamic>;
      _showReceiptDialog(donation);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['error']?.toString() ?? 'অনুদান প্রক্রিয়ায় সমস্যা হয়েছে'),
          backgroundColor: AppColors.absent,
        ),
      );
    }
  }

  void _showReceiptDialog(Map<String, dynamic> donation) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: const [
            Icon(Icons.check_circle, color: Color(0xFF0D5C3A), size: 28),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'দান সফল ও রশিদ প্রস্তুত',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFE6F4ED),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    const Text(
                      'অফিসিয়াল ডিজিটাল মানি রিসিট',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0D5C3A)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      donation['receiptNumber']?.toString() ?? 'EHRJ-DON-xxxx',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '৳ ${(donation['amount'] ?? 0).toString()}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0D5C3A)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _buildReceiptRow('দাতার নাম:', donation['donorName']?.toString() ?? 'গোপন দাতা'),
              _buildReceiptRow('তহবিল খাত:', donation['fundCategoryBn']?.toString() ?? ''),
              _buildReceiptRow('পেমেন্ট মেথড:', donation['paymentMethodBn']?.toString() ?? ''),
              _buildReceiptRow('ট্রানজেকশন আইডি:', donation['transactionId']?.toString() ?? ''),
              _buildReceiptRow('যাচাইকরণ টোকেন:', donation['verificationToken']?.toString() ?? ''),
              const Divider(height: 20),
              const Text(
                'আল্লাহ তায়ালা আপনার এই দানকে কবুল করুন এবং উভয় জাহানে উত্তম প্রতিদান দান করুন। আমীন।',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.textSecondaryLight),
              ),
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pop(); // Back to campus hub
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('সম্পন্ন করুন'),
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMutedLight)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimaryLight),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('দান ও যাকাত তহবিল'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Quranic Hadith Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF041F14), Color(0xFF0D5C3A)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.accent, width: 1.5),
              ),
              child: Column(
                children: const [
                  Text(
                    'مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.accent,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    '"যারা আল্লাহর রাস্তায় নিজেদের সম্পদ ব্যয় করে, তাদের উপমা একটি শস্যবীজের মতো, যা থেকে সাতটি শীষ জন্মায় এবং প্রতিটি শীষে থাকে একশত দানা।" — (সূরা আল-বাকারা: ২৬১)',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: Colors.white, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 1. Fund Selection
            EhrjCard(
              title: 'দানের খাত নির্বাচন করুন',
              icon: Icons.volunteer_activism_rounded,
              child: Column(
                children: _categories.map((cat) {
                  final isSelected = _selectedCategory == cat['id'];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFE6F4ED) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF0D5C3A) : AppColors.cardBorderLight,
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () {
                        setState(() {
                          _selectedCategory = cat['id']!;
                          _selectedCategoryBn = cat['title']!;
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Row(
                          children: [
                            Icon(
                              isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded,
                              color: isSelected ? const Color(0xFF0D5C3A) : Colors.grey.shade400,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    cat['title']!,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: isSelected ? const Color(0xFF0D5C3A) : AppColors.textPrimaryLight,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    cat['desc']!,
                                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondaryLight),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // 2. Amount Selection
            EhrjCard(
              title: 'দানের পরিমাণ (টাকা)',
              icon: Icons.monetization_on_rounded,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _presetAmounts.map((amt) {
                      final isSelected = _selectedAmount == amt;
                      return ChoiceChip(
                        label: Text('৳ ${amt.toInt()}'),
                        selected: isSelected,
                        selectedColor: const Color(0xFF0D5C3A),
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textPrimaryLight,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                        onSelected: (sel) {
                          if (sel) {
                            setState(() {
                              _selectedAmount = amt;
                              _customAmountController.text = amt.toInt().toString();
                            });
                          }
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _customAmountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'কাস্টম টাকার পরিমাণ',
                      prefixText: '৳ ',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (val) {
                      final parsed = double.tryParse(val);
                      setState(() {
                        _selectedAmount = parsed;
                      });
                    },
                    validator: (val) {
                      final n = double.tryParse(val ?? '');
                      if (n == null || n <= 0) return 'সঠিক পরিমাণ লিখুন';
                      return null;
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3. Payment Method & Channel
            EhrjCard(
              title: 'পেমেন্ট মাধ্যম ও একাউন্ট নম্বর',
              icon: Icons.account_balance_wallet_rounded,
              child: Column(
                children: [
                  ..._paymentChannels.map((ch) {
                    final isSel = _selectedPaymentMethod == ch['id'];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isSel ? const Color(0xFFFBF4DC) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSel ? AppColors.gold : AppColors.cardBorderLight,
                          width: isSel ? 1.5 : 1,
                        ),
                      ),
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            _selectedPaymentMethod = ch['id']!;
                            _selectedPaymentMethodBn = ch['name']!;
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                isSel ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded,
                                color: isSel ? const Color(0xFF0D5C3A) : Colors.grey.shade400,
                                size: 20,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(ch['name']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                    const SizedBox(height: 2),
                                    Text(
                                      ch['number']!,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF0D5C3A),
                                        fontSize: 14,
                                      ),
                                    ),
                                    Text(ch['instructions']!, style: const TextStyle(fontSize: 11, color: AppColors.textMutedLight)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _trxIdController,
                    decoration: const InputDecoration(
                      labelText: 'ট্রানজেকশন আইডি (TrxID) *',
                      hintText: 'উদাঃ 8N6A7D91ZX অথবা ব্যাংক রেফারেন্স',
                      prefixIcon: Icon(Icons.receipt_long_rounded),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length < 3) {
                        return 'পেমেন্ট ট্রানজেকশন আইডি আবশ্যক';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 4. Donor Information
            EhrjCard(
              title: 'দাতার পরিচিতি ও দোয়া',
              icon: Icons.person_outline_rounded,
              child: Column(
                children: [
                  CheckboxListTile(
                    value: _isAnonymous,
                    activeColor: const Color(0xFF0D5C3A),
                    contentPadding: EdgeInsets.zero,
                    title: const Text('নাম প্রকাশে অনিচ্ছুক (গোপন দাতা হিসেবে দান করুন)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    onChanged: (val) => setState(() => _isAnonymous = val ?? false),
                  ),
                  if (!_isAnonymous) ...[
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'দাতার পূর্ণ নাম *',
                        prefixIcon: Icon(Icons.badge_outlined),
                      ),
                      validator: (val) {
                        if (!_isAnonymous && (val == null || val.trim().length < 2)) {
                          return 'দাতার নাম লিখুন';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                  ],
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'মোবাইল নম্বর * (রশিদ পাঠানোর জন্য)',
                      hintText: '018XXXXXXXX',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length < 11) {
                        return '১১ ডিজিটের মোবাইল নম্বর আবশ্যক';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: _addressController,
                    decoration: const InputDecoration(
                      labelText: 'ঠিকানা (ঐচ্ছিক)',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: _notesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'বিশেষ দোয়ার উদ্দেশ্য বা মন্তব্য (ঐচ্ছিক)',
                      prefixIcon: Icon(Icons.notes_rounded),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Submit Action
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _handleSubmit,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.volunteer_activism_rounded),
                label: Text(
                  _isSubmitting ? 'অনুদান প্রক্রিয়াধীন...' : 'অনুদানের তথ্য সাবমিট ও রশিদ নিন',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0D5C3A),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
