import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../data/repositories/public_repository.dart';
import '../common/widgets/ehrj_empty_state.dart';

class DownloadCenterScreen extends StatefulWidget {
  const DownloadCenterScreen({super.key});

  @override
  State<DownloadCenterScreen> createState() => _DownloadCenterScreenState();
}

class _DownloadCenterScreenState extends State<DownloadCenterScreen> {
  String _activeCategory = 'ALL';
  String _searchQuery = '';
  List<Map<String, dynamic>> _items = [];
  bool _isLoading = true;

  final List<Map<String, String>> _categories = [
    {'id': 'ALL', 'title': 'সব নথি'},
    {'id': 'ভর্তি', 'title': 'ভর্তি ফরম'},
    {'id': 'সিলেবাস', 'title': 'সিলেবাস'},
    {'id': 'রুটিন', 'title': 'ক্লাস রুটিন'},
    {'id': 'ক্যালেন্ডার', 'title': 'ক্যালেন্ডার'},
    {'id': 'পরীক্ষা', 'title': 'পরীক্ষা'},
  ];

  @override
  void initState() {
    super.initState();
    _loadDownloads();
  }

  Future<void> _loadDownloads() async {
    setState(() => _isLoading = true);
    final repo = context.read<PublicRepository>();
    final docs = await repo.getDownloads();
    if (mounted) {
      setState(() {
        _items = docs;
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredItems {
    return _items.filter((item) {
      final matchesCategory = _activeCategory == 'ALL' || item['category'] == _activeCategory;
      final matchesQuery = _searchQuery.isEmpty ||
          (item['title']?.toString().toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          (item['description']?.toString().toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
      return matchesCategory && matchesQuery;
    }).toList();
  }

  void _handleDownload(Map<String, dynamic> doc) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                '${doc['title']} ডাউনলোড সম্পন্ন হয়েছে',
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF0D5C3A),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = _filteredItems;

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('ডাউনলোড সেন্টার ও রিসোর্স হাব'),
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'নথি বা ফরমের নাম লিখে খুঁজুন...',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val.trim()),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _categories.map((cat) {
                      final isSelected = _activeCategory == cat['id'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(cat['title']!),
                          selected: isSelected,
                          selectedColor: const Color(0xFF0D5C3A),
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : AppColors.textPrimaryLight,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                          onSelected: (_) {
                            setState(() => _activeCategory = cat['id']!);
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Document List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : list.isEmpty
                    ? const EhrjEmptyState(
                        title: 'কোনো নথি পাওয়া যায়নি',
                        subtitle: 'অনুগ্রহ করে ভিন্ন কোনো ক্যাটাগরি বা শব্দ দিয়ে অনুসন্ধান করুন।',
                        icon: Icons.folder_open_rounded,
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: list.length,
                        itemBuilder: (ctx, idx) {
                          final doc = list[idx];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.cardBorderLight),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.03),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDC2626).withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Icon(
                                          Icons.picture_as_pdf_rounded,
                                          color: Color(0xFFDC2626),
                                          size: 26,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              doc['title'] ?? '',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                                color: AppColors.textPrimaryLight,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              doc['description'] ?? '',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors.textSecondaryLight,
                                                height: 1.3,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  const Divider(height: 1),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      _buildDocMeta(Icons.label_outline, doc['category'] ?? ''),
                                      const SizedBox(width: 12),
                                      _buildDocMeta(Icons.data_usage_rounded, doc['size'] ?? ''),
                                      const SizedBox(width: 12),
                                      _buildDocMeta(Icons.calendar_today_outlined, doc['date'] ?? ''),
                                      const Spacer(),
                                      ElevatedButton.icon(
                                        onPressed: () => _handleDownload(doc),
                                        icon: const Icon(Icons.download_rounded, size: 16),
                                        label: const Text('ডাউনলোড', style: TextStyle(fontSize: 12)),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF0D5C3A),
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocMeta(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppColors.textMutedLight),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondaryLight, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}

extension _IterableFilter<E> on Iterable<E> {
  Iterable<E> filter(bool Function(E element) test) sync* {
    for (E element in this) {
      if (test(element)) yield element;
    }
  }
}
