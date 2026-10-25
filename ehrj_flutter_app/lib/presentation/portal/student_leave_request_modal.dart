import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class StudentLeaveRequestModal extends StatefulWidget {
  final String studentName;
  final String studentId;

  const StudentLeaveRequestModal({
    super.key,
    required this.studentName,
    required this.studentId,
  });

  @override
  State<StudentLeaveRequestModal> createState() => _StudentLeaveRequestModalState();
}

class _StudentLeaveRequestModalState extends State<StudentLeaveRequestModal> {
  final _reasonController = TextEditingController();
  final _emergencyPhoneController = TextEditingController();
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 1));
  String _leaveType = 'SICK';
  bool _isSubmitting = false;
  String? _successMessage;

  final List<Map<String, String>> _leaveTypes = [
    {'id': 'SICK', 'name': 'অসুস্থতাজনিত ছুটি (Medical)'},
    {'id': 'CASUAL', 'name': 'পারিবারিক প্রয়োজন (Family)'},
    {'id': 'EMERGENCY', 'name': 'জরুরি বিশেষ ছুটি (Emergency)'},
  ];

  @override
  void dispose() {
    _reasonController.dispose();
    _emergencyPhoneController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('দয়া করে ছুটির কারণ বিস্তারিত লিখুন')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _successMessage = 'ছুটির আবেদন সফলভাবে দাখিল হয়েছে! মাদরাসা কর্তৃপক্ষের অনুমোদনের অপেক্ষায় রয়েছে।';
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        top: 20,
        left: 20,
        right: 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.event_note, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'ছুটির আবেদন: ${widget.studentName}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primaryDark),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const Divider(),
            if (_successMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.check_circle, color: AppColors.primary, size: 40),
                    const SizedBox(height: 8),
                    Text(
                      _successMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryDark, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                child: const Text('ঠিক আছে'),
              ),
            ] else ...[
              DropdownButtonFormField<String>(
                initialValue: _leaveType,
                decoration: const InputDecoration(labelText: 'ছুটির ধরন', border: OutlineInputBorder()),
                items: _leaveTypes.map((t) => DropdownMenuItem(value: t['id'], child: Text(t['name']!))).toList(),
                onChanged: (v) => setState(() => _leaveType = v!),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _startDate,
                          firstDate: DateTime.now().subtract(const Duration(days: 7)),
                          lastDate: DateTime.now().add(const Duration(days: 60)),
                        );
                        if (picked != null) setState(() => _startDate = picked);
                      },
                      icon: const Icon(Icons.calendar_month, size: 16),
                      label: Text('শুরু: ${_startDate.toString().split(' ')[0]}', style: const TextStyle(fontSize: 11)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _endDate,
                          firstDate: _startDate,
                          lastDate: DateTime.now().add(const Duration(days: 60)),
                        );
                        if (picked != null) setState(() => _endDate = picked);
                      },
                      icon: const Icon(Icons.calendar_month, size: 16),
                      label: Text('শেষ: ${_endDate.toString().split(' ')[0]}', style: const TextStyle(fontSize: 11)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _reasonController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'ছুটির সুনির্দিষ্ট কারণ *',
                  hintText: 'উদা: হঠাৎ শারীরিক অসুস্থতা বা ডাক্তারের পরামর্শ...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _emergencyPhoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'জরুরী যোগাযোগের মোবাইল নম্বর',
                  hintText: '01XXXXXXXXX',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.phone, color: AppColors.primary),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
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
                    : const Text('আবেদন জমা দিন'),
              ),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
