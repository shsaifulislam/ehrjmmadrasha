import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class PublicResultsScreen extends StatefulWidget {
  const PublicResultsScreen({super.key});

  @override
  State<PublicResultsScreen> createState() => _PublicResultsScreenState();
}

class _PublicResultsScreenState extends State<PublicResultsScreen> {
  final _rollController = TextEditingController();
  String _selectedYear = '২০২৬';
  String _selectedTerm = 'বার্ষিক পরীক্ষা';
  String _selectedClass = 'হিফজুল কুরআন বিভাগ';
  bool _isLoading = false;
  Map<String, dynamic>? _marksheetData;
  String? _errorMessage;

  final List<String> _years = ['২০২৬', '২০২৫', '২০২৪'];
  final List<String> _terms = ['প্রথম সাময়িক পরীক্ষা', 'অর্ধবার্ষিক পরীক্ষা', 'বার্ষিক পরীক্ষা'];
  final List<String> _classes = [
    'নূরানী ১ম জামাত',
    'নূরানী ২য় জামাত',
    'নাজেরা বিভাগ',
    'হিফজুল কুরআন বিভাগ',
    'ইবতিদায়্যাহ ১ম',
    'ইবতিদায়্যাহ ২য়',
  ];

  @override
  void dispose() {
    _rollController.dispose();
    super.dispose();
  }

  void _searchResult() {
    final roll = _rollController.text.trim();
    if (roll.isEmpty) {
      setState(() => _errorMessage = 'দয়া করে শিক্ষার্থীর রোল নম্বর লিখুন');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _marksheetData = null;
    });

    // Simulated verified lookup or backend verification
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _marksheetData = {
            'studentName': 'আব্দুল্লাহ ইবনে মাসউদ',
            'roll': roll,
            'class': _selectedClass,
            'term': _selectedTerm,
            'year': _selectedYear,
            'gpa': '৪.৮৫',
            'grade': 'A+',
            'totalMarks': '৪৮৫/৫০০',
            'subjects': [
              {'name': 'হিফজ ও তাজবীদ', 'marks': 98, 'grade': 'A+'},
              {'name': 'ফিকহ ও উসূল', 'marks': 92, 'grade': 'A+'},
              {'name': 'আরবি সাহিত্য', 'marks': 88, 'grade': 'A'},
              {'name': 'বাংলা ও সাধারণ জ্ঞান', 'marks': 94, 'grade': 'A+'},
              {'name': 'ইংরেজি', 'marks': 85, 'grade': 'A'},
            ],
          };
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('ফলাফল অনুসন্ধান ও যাচাই'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Search Form
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
                    'পরীক্ষার বিবরণ নির্বাচন করুন:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryDark),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _selectedYear,
                          decoration: const InputDecoration(labelText: 'শিক্ষাবর্ষ', border: OutlineInputBorder()),
                          items: _years.map((y) => DropdownMenuItem(value: y, child: Text(y))).toList(),
                          onChanged: (v) => setState(() => _selectedYear = v!),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _selectedTerm,
                          decoration: const InputDecoration(labelText: 'পরীক্ষা', border: OutlineInputBorder()),
                          items: _terms.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                          onChanged: (v) => setState(() => _selectedTerm = v!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedClass,
                    decoration: const InputDecoration(labelText: 'জামাত / বিভাগ', border: OutlineInputBorder()),
                    items: _classes.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                    onChanged: (v) => setState(() => _selectedClass = v!),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _rollController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'শিক্ষার্থীর রোল নম্বর *',
                            hintText: 'উদা: ১০১',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.pin, color: AppColors.primary),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _searchResult,
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
                            : const Text('ফলাফল দেখুন'),
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

            // Result Display Card
            if (_marksheetData != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD4AF37), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Header Certificate Banner
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _marksheetData!['studentName'],
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.primaryDark),
                              ),
                              Text(
                                'রোল: ${_marksheetData!['roll']} • বিভাগ: ${_marksheetData!['class']}',
                                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'GPA: ${_marksheetData!['gpa']} (${_marksheetData!['grade']})',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Subject Marks Table
                    Table(
                      border: TableBorder.all(color: const Color(0xFFE2E8F0)),
                      columnWidths: const {
                        0: FlexColumnWidth(3),
                        1: FlexColumnWidth(1.5),
                        2: FlexColumnWidth(1),
                      },
                      children: [
                        TableRow(
                          decoration: const BoxDecoration(color: Color(0xFFF1F5F9)),
                          children: const [
                            Padding(padding: EdgeInsets.all(8), child: Text('বিষয়', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12))),
                            Padding(padding: EdgeInsets.all(8), child: Text('নম্বর', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12))),
                            Padding(padding: EdgeInsets.all(8), child: Text('গ্রেড', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12))),
                          ],
                        ),
                        ...(_marksheetData!['subjects'] as List).map((s) {
                          return TableRow(
                            children: [
                              Padding(padding: const EdgeInsets.all(8), child: Text(s['name'], style: const TextStyle(fontSize: 12))),
                              Padding(padding: const EdgeInsets.all(8), child: Text('${s['marks']}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                              Padding(padding: const EdgeInsets.all(8), child: Text(s['grade'], textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.bold))),
                            ],
                          );
                        }),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('মোট প্রাপ্ত নম্বর: ৪৮৫/৫০০', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primary)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: const Text('✓ ফলাফল উত্তীর্ণ (Passed)', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      ],
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
}
