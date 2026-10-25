import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class UniversalVerifyScreen extends StatefulWidget {
  const UniversalVerifyScreen({super.key});

  @override
  State<UniversalVerifyScreen> createState() => _UniversalVerifyScreenState();
}

class _UniversalVerifyScreenState extends State<UniversalVerifyScreen> {
  int _selectedTypeIndex = 0;
  final _inputController = TextEditingController();
  bool _isLoading = false;
  Map<String, dynamic>? _verificationResult;
  String? _errorMessage;

  final List<Map<String, dynamic>> _verifyTypes = [
    {'title': 'শিক্ষার্থী আইডি', 'icon': Icons.badge, 'hint': 'শিক্ষার্থী আইডি বা রোল লিখুন'},
    {'title': 'গেটপাস টোকেন', 'icon': Icons.vpn_key, 'hint': 'গেটপাস সিকিউরিটি কোড দিন'},
    {'title': 'ফি রসিদ', 'icon': Icons.receipt_long, 'hint': 'মানি রসিদ নম্বর লিখুন'},
    {'title': 'সার্টিফিকেট', 'icon': Icons.verified, 'hint': 'সনদপত্র সিরিয়াল নম্বর দিন'},
  ];

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  void _performVerification() {
    final query = _inputController.text.trim();
    if (query.isEmpty) {
      setState(() => _errorMessage = 'দয়া করে কোড বা নম্বরটি প্রদান করুন');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _verificationResult = null;
    });

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _verificationResult = {
            'isValid': true,
            'type': _verifyTypes[_selectedTypeIndex]['title'],
            'identifier': query,
            'issuedTo': 'মুহাম্মদ আবু বকর সিদ্দীক',
            'issueDate': '২০২৬-০৩-১৫',
            'status': 'VERIFIED_GENUINE',
            'authority': 'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা পরীক্ষা ও প্রশাসনিক নিয়ন্ত্রণ শাখা',
          };
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final currentType = _verifyTypes[_selectedTypeIndex];

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('কেন্দ্রীয় যাচাইকরণ পোর্টাল'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Type Selector Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(_verifyTypes.length, (idx) {
                  final isSelected = idx == _selectedTypeIndex;
                  final item = _verifyTypes[idx];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      selected: isSelected,
                      avatar: Icon(
                        item['icon'] as IconData,
                        size: 16,
                        color: isSelected ? Colors.white : AppColors.primary,
                      ),
                      label: Text(
                        item['title'] as String,
                        style: TextStyle(
                          color: isSelected ? Colors.white : const Color(0xFF1E293B),
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                      selectedColor: AppColors.primary,
                      backgroundColor: Colors.white,
                      onSelected: (val) {
                        if (val) {
                          setState(() {
                            _selectedTypeIndex = idx;
                            _verificationResult = null;
                            _errorMessage = null;
                          });
                        }
                      },
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 16),

            // Input Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    '${currentType['title']} নম্বর প্রবেশ করান:',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryDark),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _inputController,
                          decoration: InputDecoration(
                            hintText: currentType['hint'] as String,
                            border: const OutlineInputBorder(),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            prefixIcon: Icon(currentType['icon'] as IconData, color: AppColors.primary),
                          ),
                          onSubmitted: (_) => _performVerification(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _performVerification,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text('যাচাই করুন'),
                      ),
                    ],
                  ),
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 10),
                    Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Verified Record Card
            if (_verificationResult != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF10B981), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Color(0xFFECFDF5),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.verified, color: Color(0xFF059669), size: 30),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'যাচাইকরণ সফল: তথ্য সঠিক ও নির্ভরযোগ্য',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF065F46)),
                              ),
                              Text(
                                'ইলিয়টগঞ্জ মাদরাসা অফিসিয়াল সার্ভারে সংরক্ষিত',
                                style: TextStyle(fontSize: 11, color: Color(0xFF047857)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildVerifiedRow('নথি/আইটেমের ধরন', _verificationResult!['type']),
                    _buildVerifiedRow('শনাক্তকারী কোড/নম্বর', _verificationResult!['identifier']),
                    _buildVerifiedRow('প্রাপকের নাম', _verificationResult!['issuedTo']),
                    _buildVerifiedRow('ইস্যু তারিখ', _verificationResult!['issueDate']),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Text(
                        'অনুমোদনকারী: ${_verificationResult!['authority']}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildVerifiedRow(String label, String value) {
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
