class NoticeModel {
  final String id;
  final String title;
  final String content;
  final String? category;
  final String? publishedAt;
  final String? priority; // NORMAL, URGENT
  final bool isPublic;

  NoticeModel({
    required this.id,
    required this.title,
    required this.content,
    this.category,
    this.publishedAt,
    this.priority,
    this.isPublic = true,
  });

  String get titleBn => title;
  String get contentBn => content;
  String get formattedDate => publishedAt?.split('T').first ?? '';
  bool get isImportant => priority == 'URGENT' || priority == 'IMPORTANT';

  factory NoticeModel.fromJson(Map<String, dynamic> json) {
    return NoticeModel(
      id: json['id']?.toString() ?? '',
      title:
          json['titleBn']?.toString() ??
          json['titleEn']?.toString() ??
          json['title']?.toString() ??
          '',
      content:
          json['contentBn']?.toString() ??
          json['contentEn']?.toString() ??
          json['content']?.toString() ??
          '',
      category: json['category']?.toString(),
      publishedAt:
          json['publishedAt']?.toString() ?? json['createdAt']?.toString(),
      priority: json['priority']?.toString() ?? 'NORMAL',
      isPublic: json['isPublic'] != false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'content': content,
    'category': category,
    'publishedAt': publishedAt,
    'priority': priority,
    'isPublic': isPublic,
  };
}
