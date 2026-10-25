import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../data/repositories/public_repository.dart';
import '../common/widgets/ehrj_card.dart';
import '../common/widgets/ehrj_status_badge.dart';

class AdmissionTrackScreen extends StatefulWidget {
  const AdmissionTrackScreen({super.key});

  @override
  State<AdmissionTrackScreen> createState() => _AdmissionTrackScreenState();
}

class _AdmissionTrackScreenState extends State<AdmissionTrackScreen> {
  final _trackIdController = TextEditingController();
  bool _isLoading = false;
  Map<String, dynamic>? _result;
  String? _errorMessage;

  @override
  void dispose() {
    _trackIdController.dispose();
    super.dispose();
  }

  Future<void> _handleSearch() async {
    final query = _trackIdController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _result = null;
    });

    final repo = context.read<PublicRepository>();
    final res = await repo.trackAdmission(query);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res != null && res['found'] == true) {
          _result = res;
        } else {
          _errorMessage = 'প্রদত্ত ট্র্যাকিং নম্বরে কোনো আবেদন খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক নম্বর দিন।';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('আবেদনের অবস্থা অনুসন্ধান'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Search Input Box
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
                  const Text(
                    'অনলাইনে আবেদনের ট্র্যাকিং নম্বরটি প্রবেশ করান:',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _trackIdController,
                          decoration: const InputDecoration(
                            hintText: 'উদা: EHRJ-ADM-171234',
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            prefixIcon: Icon(Icons.search, color: AppColors.primary),
                          ),
                          onSubmitted: (_) => _handleSearch(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _handleSearch,
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
                            : const Text('অনুসন্ধান'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Error display
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFFDC2626)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Color(0xFF991B1B), fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),

            // Results Card
            if (_result != null) ...[
              EhrjCard(
                title: 'আবেদনের বিবরণ ও অগ্রগতি',
                icon: Icons.assignment_turned_in,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('বর্তমান অবস্থা:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        EhrjStatusBadge(
                          status: _result!['status']?.toString() ?? 'PENDING',
                          text: _result!['statusText']?.toString() ?? 'অপেক্ষমান (Pending)',
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    _buildDetailRow('ট্র্যাকিং আইডি', _result!['trackingId']?.toString() ?? '-'),
                    _buildDetailRow('শিক্ষার্থীর নাম', _result!['studentNameBn']?.toString() ?? '-'),
                    _buildDetailRow('আবেদিত বিভাগ', _result!['department']?.toString() ?? '-'),
                    _buildDetailRow('আবেদনের তারিখ', _result!['appliedDate']?.toString() ?? '-'),
                    if (_result!['interviewDate'] != null)
                      _buildDetailRow('সাক্ষাৎকারের তারিখ', _result!['interviewDate']?.toString() ?? '-'),
                    if (_result!['remarks'] != null)
                      _buildDetailRow('কর্তৃপক্ষের মন্তব্য', _result!['remarks']?.toString() ?? '-'),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
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
