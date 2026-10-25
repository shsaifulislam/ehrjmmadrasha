import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../data/repositories/public_repository.dart';
import '../common/widgets/ehrj_card.dart';

class ContactUsScreen extends StatefulWidget {
  const ContactUsScreen({super.key});

  @override
  State<ContactUsScreen> createState() => _ContactUsScreenState();
}

class _ContactUsScreenState extends State<ContactUsScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();

  String _selectedCategory = 'GENERAL';
  bool _isSubmitting = false;

  final List<Map<String, String>> _categories = [
    {'id': 'GENERAL', 'title': 'সাধারণ অনুসন্ধান'},
    {'id': 'ADMISSION', 'title': 'ভর্তি সংক্রান্ত তথ্য'},
    {'id': 'ACADEMIC', 'title': 'শিক্ষা কার্যক্রম ও ফলাফল'},
    {'id': 'DONATION', 'title': 'দান ও অনুদান সংক্রান্ত'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _makeCall(String phone) async {
    await Clipboard.setData(ClipboardData(text: phone));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('নম্বর কপি করা হয়েছে: $phone (ডায়ালারে পেস্ট করুন)'),
          backgroundColor: const Color(0xFF0D5C3A),
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _openWhatsApp() async {
    const waNumber = '+8801845162664';
    await Clipboard.setData(const ClipboardData(text: waNumber));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('হোয়াটসঅ্যাপ নম্বর কপি করা হয়েছে: $waNumber'),
          backgroundColor: Color(0xFF25D366),
          duration: Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final repo = context.read<PublicRepository>();
    final payload = {
      'name': _nameController.text.trim(),
      'phone': _phoneController.text.trim(),
      'email': _emailController.text.trim(),
      'subject': _subjectController.text.trim(),
      'category': _selectedCategory,
      'message': _messageController.text.trim(),
      'honeypot': '',
    };

    final result = await repo.submitContactInquiry(payload);

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result['success'] == true) {
      final ticketNum = result['ticketNumber'] ?? 'TKT-001';
      final msg = result['messageBn'] ?? 'আপনার বার্তা গৃহীত হয়েছে।';
      _showSuccessDialog(ticketNum, msg);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['error']?.toString() ?? 'বার্তা পাঠানো সম্ভব হয়নি'),
          backgroundColor: AppColors.absent,
        ),
      );
    }
  }

  void _showSuccessDialog(String ticketNum, String msg) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: const [
            Icon(Icons.mark_email_read_rounded, color: Color(0xFF0D5C3A), size: 28),
            SizedBox(width: 8),
            Expanded(
              child: Text('বার্তা সফলভাবে গৃহীত', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(msg, style: const TextStyle(fontSize: 13, height: 1.4)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFE6F4ED),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Text('ট্র্যাকিং টিকিট নম্বর: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  Text(
                    ticketNum,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0D5C3A)),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _nameController.clear();
              _phoneController.clear();
              _emailController.clear();
              _subjectController.clear();
              _messageController.clear();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('ঠিক আছে'),
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
        title: const Text('যোগাযোগ ও হেল্পডেস্ক'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Campus Address Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF041F14), Color(0xFF0D5C3A)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.accent, width: 1.2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.location_on_rounded, color: AppColors.accent, size: 24),
                      SizedBox(width: 8),
                      Text(
                        'মাদরাসা ক্যাম্পাস ও ঠিকানা',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    AppStringsBn.institutionName,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.accentLight),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ',
                    style: TextStyle(fontSize: 12, color: Colors.white, height: 1.4),
                  ),
                  const SizedBox(height: 10),
                  const Divider(color: Colors.white24, height: 1),
                  const SizedBox(height: 8),
                  Row(
                    children: const [
                      Icon(Icons.schedule_rounded, color: AppColors.accent, size: 16),
                      SizedBox(width: 6),
                      Text(
                        'অফিস সময়: শনি - বৃহস্পতি (সকাল ৮:০০ - বিকাল ৫:০০)',
                        style: TextStyle(fontSize: 11, color: Colors.white70),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // One-Tap Direct Helplines
            EhrjCard(
              title: 'জরুরি হেল্পলাইন নম্বরসমূহ',
              icon: Icons.phone_in_talk_rounded,
              child: Column(
                children: [
                  _buildPhoneAction(
                    'প্রধান প্রশাসনিক হেল্পলাইন',
                    AppStringsBn.primaryPhone,
                    'ভর্তি ও সার্বিক তথ্য অনুসন্ধান',
                    Icons.call_rounded,
                    const Color(0xFF0D5C3A),
                  ),
                  const Divider(height: 16),
                  _buildPhoneAction(
                    'সহকারী শিক্ষা সচিব',
                    AppStringsBn.helplineSecondary,
                    'একাডেমিক ও পরীক্ষা সংক্রান্ত',
                    Icons.school_rounded,
                    const Color(0xFFD97706),
                  ),
                  const Divider(height: 16),
                  _buildPhoneAction(
                    'অফিস ও হিসাব শাখা',
                    AppStringsBn.helplineTertiary,
                    'ফি পরিশোধ ও অনুদান তথ্য',
                    Icons.account_balance_rounded,
                    const Color(0xFF2563EB),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _openWhatsApp,
                      icon: const Icon(Icons.chat_bubble_rounded, color: Color(0xFF10B981)),
                      label: const Text(
                        'হোয়াটসঅ্যাপে সরাসরি চ্যাট করুন (WhatsApp Chat)',
                        style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Interactive Inquiry Form
            EhrjCard(
              title: 'বার্তা পাঠান বা অনুসন্ধান দাখিল করুন',
              icon: Icons.edit_note_rounded,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('অনুসন্ধানের বিষয়শ্রেণি:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedCategory,
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    items: _categories.map((c) => DropdownMenuItem(
                      value: c['id'],
                      child: Text(c['title']!, style: const TextStyle(fontSize: 13)),
                    )).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedCategory = val);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'আপনার পূর্ণ নাম *',
                      prefixIcon: Icon(Icons.person_outline_rounded),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length < 2) return 'আপনার নাম লিখুন';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'মোবাইল নম্বর *',
                      hintText: '018XXXXXXXX',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length < 11) return 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'ইমেইল এড্রেস (ঐচ্ছিক)',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _subjectController,
                    decoration: const InputDecoration(
                      labelText: 'বার্তার শিরোনাম *',
                      prefixIcon: Icon(Icons.title_rounded),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'শিরোনাম লিখুন';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _messageController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'আপনার বিস্তারিত বার্তা বা প্রশ্ন *',
                      alignLabelWithHint: true,
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length < 10) return 'কমপক্ষে ১০ অক্ষরে বার্তা লিখুন';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _handleSubmit,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Icon(Icons.send_rounded),
                      label: Text(
                        _isSubmitting ? 'দাখিল হচ্ছে...' : 'বার্তা দাখিল করুন',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0D5C3A),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildPhoneAction(
    String label,
    String phone,
    String role,
    IconData icon,
    Color color,
  ) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text(role, style: const TextStyle(fontSize: 11, color: AppColors.textMutedLight)),
              Text(
                phone,
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color),
              ),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(Icons.phone_forwarded_rounded, color: Color(0xFF0D5C3A)),
          tooltip: 'কল করুন',
          onPressed: () => _makeCall(phone),
        ),
      ],
    );
  }
}
