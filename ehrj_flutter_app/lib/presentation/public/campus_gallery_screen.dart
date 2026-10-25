import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../data/repositories/public_repository.dart';
import '../common/widgets/ehrj_empty_state.dart';

class CampusGalleryScreen extends StatefulWidget {
  const CampusGalleryScreen({super.key});

  @override
  State<CampusGalleryScreen> createState() => _CampusGalleryScreenState();
}

class _CampusGalleryScreenState extends State<CampusGalleryScreen> {
  String _activeCategory = 'ALL';
  List<Map<String, dynamic>> _photos = [];
  bool _isLoading = true;

  final List<Map<String, String>> _categories = [
    {'id': 'ALL', 'title': 'সকল ছবি'},
    {'id': 'CAMPUS', 'title': 'ক্যাম্পাস'},
    {'id': 'CLASSROOM', 'title': 'শ্রেণিকক্ষ'},
    {'id': 'EVENTS', 'title': 'অনুষ্ঠানমালা'},
    {'id': 'ADMIN', 'title': 'প্রশাসন'},
  ];

  @override
  void initState() {
    super.initState();
    _loadPhotos();
  }

  Future<void> _loadPhotos() async {
    setState(() => _isLoading = true);
    final repo = context.read<PublicRepository>();
    final items = await repo.getGalleryPhotos();
    if (mounted) {
      setState(() {
        _photos = items;
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredPhotos {
    if (_activeCategory == 'ALL') return _photos;
    return _photos.where((p) => p['category'] == _activeCategory).toList();
  }

  void _openLightbox(Map<String, dynamic> photo) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF111714),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.gold, width: 1.5),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header with Title & Close
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        photo['categoryBn'] ?? 'ক্যাম্পাস',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.gold),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        photo['title'] ?? '',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
              ),

              // Image Canvas Placeholder / Fallback
              Container(
                height: 220,
                color: Colors.black26,
                alignment: Alignment.center,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.photo_library_outlined, size: 54, color: AppColors.accent),
                    const SizedBox(height: 8),
                    Text(
                      photo['title'] ?? '',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা আর্কাইভ',
                      style: TextStyle(color: Colors.white38, fontSize: 10),
                    ),
                  ],
                ),
              ),

              // Description Footer
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  photo['description'] ?? '',
                  style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = _filteredPhotos;

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('ক্যাম্পাস ফটো ও স্মৃতি গ্যালারি'),
      ),
      body: Column(
        children: [
          // Category Selector
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _categories.map((cat) {
                  final isSel = _activeCategory == cat['id'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(cat['title']!),
                      selected: isSel,
                      selectedColor: const Color(0xFF0D5C3A),
                      labelStyle: TextStyle(
                        color: isSel ? Colors.white : AppColors.textPrimaryLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      onSelected: (_) => setState(() => _activeCategory = cat['id']!),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const Divider(height: 1),

          // Photos Grid
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : list.isEmpty
                    ? const EhrjEmptyState(
                        title: 'কোনো ছবি পাওয়া যায়নি',
                        subtitle: 'এই বিভাগে বর্তমানে কোনো সংরক্ষিত ছবি নেই।',
                        icon: Icons.image_not_supported_outlined,
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.88,
                        ),
                        itemCount: list.length,
                        itemBuilder: (ctx, idx) {
                          final photo = list[idx];
                          return InkWell(
                            onTap: () => _openLightbox(photo),
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
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
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Photo Container
                                  Expanded(
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFE6F4ED),
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                                      ),
                                      alignment: Alignment.center,
                                      child: Stack(
                                        children: [
                                          Center(
                                            child: Icon(
                                              Icons.image_outlined,
                                              size: 40,
                                              color: const Color(0xFF0D5C3A).withValues(alpha: 0.6),
                                            ),
                                          ),
                                          Positioned(
                                            top: 8,
                                            left: 8,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF0D5C3A),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                photo['categoryBn'] ?? 'ক্যাম্পাস',
                                                style: const TextStyle(
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.white,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),

                                  // Caption
                                  Padding(
                                    padding: const EdgeInsets.all(10),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          photo['title'] ?? '',
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                            color: AppColors.textPrimaryLight,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: const [
                                            Text('বিস্তারিত দেখুন', style: TextStyle(fontSize: 10, color: Color(0xFF0D5C3A), fontWeight: FontWeight.bold)),
                                            SizedBox(width: 2),
                                            Icon(Icons.arrow_forward_ios_rounded, size: 9, color: Color(0xFF0D5C3A)),
                                          ],
                                        ),
                                      ],
                                    ),
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
}
