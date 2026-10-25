import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../data/repositories/public_repository.dart';

class AdmissionApplyScreen extends StatefulWidget {
  const AdmissionApplyScreen({super.key});

  @override
  State<AdmissionApplyScreen> createState() => _AdmissionApplyScreenState();
}

class _AdmissionApplyScreenState extends State<AdmissionApplyScreen> {
  int _currentStep = 0;
  final _formKeyStep1 = GlobalKey<FormState>();
  final _formKeyStep2 = GlobalKey<FormState>();

  // Controllers
  final _studentNameBnController = TextEditingController();
  final _studentNameEnController = TextEditingController();
  final _dobController = TextEditingController();
  final _guardianNameController = TextEditingController();
  final _guardianPhoneController = TextEditingController();
  final _guardianRelationController = TextEditingController(text: 'পিতা');
  final _addressController = TextEditingController();

  String _selectedDepartment = 'NOORANI';
  String _selectedBloodGroup = 'A+';
  bool _isSubmitting = false;
  String? _trackingId;
  String? _errorMessage;

  final List<Map<String, String>> _departments = [
    {'id': 'NOORANI', 'name': 'নূরানী ও নাজেরা বিভাগ'},
    {'id': 'HIFZ', 'name': 'তাহফিজুল কুরআন (হিফজ)'},
    {'id': 'KITAB', 'name': 'কিতাব বিভাগ'},
  ];

  final List<String> _bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  @override
  void dispose() {
    _studentNameBnController.dispose();
    _studentNameEnController.dispose();
    _dobController.dispose();
    _guardianNameController.dispose();
    _guardianPhoneController.dispose();
    _guardianRelationController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submitApplication() async {
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final repo = context.read<PublicRepository>();
    final payload = {
      'studentNameBn': _studentNameBnController.text.trim(),
      'studentNameEn': _studentNameEnController.text.trim(),
      'dateOfBirth': _dobController.text.trim(),
      'department': _selectedDepartment,
      'bloodGroup': _selectedBloodGroup,
      'fatherNameBn': _guardianNameController.text.trim(),
      'guardianPhone': _guardianPhoneController.text.trim(),
      'guardianRelation': _guardianRelationController.text.trim(),
      'presentAddress': _addressController.text.trim(),
      'source': 'MOBILE_APP',
    };

    final result = await repo.submitAdmissionApplication(payload);

    if (mounted) {
      setState(() {
        _isSubmitting = false;
        if (result['success'] == true) {
          _trackingId = result['applicationNumber'] ?? 'EHRJ-ADM-${DateTime.now().millisecondsSinceEpoch}';
          _currentStep = 2; // Jump to success step
        } else {
          _errorMessage = result['error']?.toString() ?? 'আবেদন সম্পন্ন করা সম্ভব হয়নি।';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('অনলাইনে ভর্তি আবেদন'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _trackingId != null ? _buildSuccessCard() : _buildStepper(),
    );
  }

  Widget _buildStepper() {
    return Theme(
      data: Theme.of(context).copyWith(
        colorScheme: Theme.of(context).colorScheme.copyWith(
          primary: AppColors.primary,
        ),
      ),
      child: Stepper(
        type: StepperType.horizontal,
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep == 0) {
            if (_formKeyStep1.currentState!.validate()) {
              setState(() => _currentStep = 1);
            }
          } else if (_currentStep == 1) {
            if (_formKeyStep2.currentState!.validate()) {
              _submitApplication();
            }
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep -= 1);
          }
        },
        controlsBuilder: (context, details) {
          return Padding(
            padding: const EdgeInsets.only(top: 20),
            child: Row(
              children: [
                if (_currentStep > 0)
                  OutlinedButton(
                    onPressed: details.onStepCancel,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textMuted,
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                    child: const Text('পূর্ববর্তী'),
                  ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : details.onStepContinue,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text(_currentStep == 1 ? 'আবেদন দাখিল করুন' : 'পরবর্তী ধাপ'),
                  ),
                ),
              ],
            ),
          );
        },
        steps: [
          // Step 1: Student Info
          Step(
            title: const Text('শিক্ষার্থী'),
            isActive: _currentStep >= 0,
            state: _currentStep > 0 ? StepState.complete : StepState.indexed,
            content: Form(
              key: _formKeyStep1,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _studentNameBnController,
                    decoration: const InputDecoration(
                      labelText: 'শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person, color: AppColors.primary),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'শিক্ষার্থীর নাম লিখুন' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _studentNameEnController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name in English',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.badge, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedDepartment,
                    decoration: const InputDecoration(
                      labelText: 'আবেদিত বিভাগ *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.school, color: AppColors.primary),
                    ),
                    items: _departments.map((d) {
                      return DropdownMenuItem(value: d['id'], child: Text(d['name']!));
                    }).toList(),
                    onChanged: (v) => setState(() => _selectedDepartment = v!),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _dobController,
                          decoration: const InputDecoration(
                            labelText: 'জন্ম তারিখ (YYYY-MM-DD)',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.calendar_today, color: AppColors.primary),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      SizedBox(
                        width: 110,
                        child: DropdownButtonFormField<String>(
                          initialValue: _selectedBloodGroup,
                          decoration: const InputDecoration(
                            labelText: 'রক্তের গ্রুপ',
                            border: OutlineInputBorder(),
                          ),
                          items: _bloodGroups.map((bg) {
                            return DropdownMenuItem(value: bg, child: Text(bg));
                          }).toList(),
                          onChanged: (v) => setState(() => _selectedBloodGroup = v!),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Step 2: Guardian Details
          Step(
            title: const Text('অভিভাবক'),
            isActive: _currentStep >= 1,
            state: _currentStep > 1 ? StepState.complete : StepState.indexed,
            content: Form(
              key: _formKeyStep2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _guardianNameController,
                    decoration: const InputDecoration(
                      labelText: 'পিতা বা অভিভাবকের নাম *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.family_restroom, color: AppColors.primary),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'অভিভাবকের নাম লিখুন' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _guardianPhoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'যোগাযোগের মোবাইল নম্বর (১১ ডিজিট) *',
                      hintText: '018XXXXXXXX',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone, color: AppColors.primary),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'মোবাইল নম্বর প্রদান করুন';
                      if (v.trim().length != 11) return 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _addressController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'বর্তমান ঠিকানা (গ্রাম, ডাকঘর, থানা, জেলা) *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.home, color: AppColors.primary),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'ঠিকানা লিখুন' : null,
                  ),
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      color: const Color(0xFFFEE2E2),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessCard() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFA7F3D0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFFECFDF5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, color: AppColors.primary, size: 54),
              ),
              const SizedBox(height: 16),
              const Text(
                'ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryDark,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'আপনার ট্র্যাকিং নম্বরটি সংরক্ষণ করুন:',
                style: TextStyle(fontSize: 13, color: AppColors.textMuted),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: SelectableText(
                  _trackingId!,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                    color: Color(0xFF92400E),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'মাদরাসা কর্তৃপক্ষ আপনার আবেদন পর্যালোচনা করে অতিসত্বর মৌখিক পরীক্ষা ও সাক্ষাৎকারের তারিখ অবহিত করবে।',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.5),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.home),
                  label: const Text('হোমে ফিরে যান'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
