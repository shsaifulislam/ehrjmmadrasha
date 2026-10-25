class ExamSessionModel {
  final String id;
  final String title;
  final String academicYear;
  final String? startDate;
  final String? endDate;
  final String status; // UPCOMING, ACTIVE, COMPLETED, PUBLISHED

  ExamSessionModel({
    required this.id,
    required this.title,
    required this.academicYear,
    this.startDate,
    this.endDate,
    required this.status,
  });

  factory ExamSessionModel.fromJson(Map<String, dynamic> json) {
    return ExamSessionModel(
      id: json['id']?.toString() ?? '',
      title: json['name']?.toString() ?? json['title']?.toString() ?? '',
      academicYear: json['academicYear']?.toString() ?? '2026',
      startDate: json['startDate']?.toString(),
      endDate: json['endDate']?.toString(),
      status: json['status']?.toString() ?? 'ACTIVE',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'academicYear': academicYear,
    'startDate': startDate,
    'endDate': endDate,
    'status': status,
  };
}

class StudentMarksEntryItem {
  final String studentId;
  final String studentName;
  final int? rollNumber;
  double? marksObtained;
  final double totalMarks;
  final String? grade;
  bool isAbsent;
  String? remarks;

  StudentMarksEntryItem({
    required this.studentId,
    required this.studentName,
    this.rollNumber,
    this.marksObtained,
    this.totalMarks = 100.0,
    this.grade,
    this.isAbsent = false,
    this.remarks,
  });

  factory StudentMarksEntryItem.fromJson(Map<String, dynamic> json) {
    return StudentMarksEntryItem(
      studentId: json['studentId']?.toString() ?? '',
      studentName: json['studentName']?.toString() ?? '',
      rollNumber: json['rollNumber'] is int
          ? json['rollNumber']
          : int.tryParse(json['rollNumber']?.toString() ?? ''),
      marksObtained: json['marksObtained'] is num
          ? (json['marksObtained'] as num).toDouble()
          : double.tryParse(json['marksObtained']?.toString() ?? ''),
      totalMarks: json['totalMarks'] is num
          ? (json['totalMarks'] as num).toDouble()
          : 100.0,
      grade: json['grade']?.toString(),
      isAbsent: json['isAbsent'] == true,
      remarks: json['remarks']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'studentId': studentId,
    'studentName': studentName,
    'rollNumber': rollNumber,
    'marksObtained': marksObtained,
    'totalMarks': totalMarks,
    'grade': grade,
    'isAbsent': isAbsent,
    'remarks': remarks,
  };
}

class ExamMarksSheetDraft {
  final String clientUuid;
  final String examId;
  final String examTitle;
  final String classId;
  final String className;
  final String subjectId;
  final String subjectName;
  final double totalMarks;
  final List<StudentMarksEntryItem> entries;
  final bool isDraft;
  final bool isSynced;
  final String updatedAt;

  ExamMarksSheetDraft({
    required this.clientUuid,
    required this.examId,
    required this.examTitle,
    required this.classId,
    required this.className,
    required this.subjectId,
    required this.subjectName,
    this.totalMarks = 100.0,
    required this.entries,
    this.isDraft = true,
    this.isSynced = false,
    required this.updatedAt,
  });

  factory ExamMarksSheetDraft.fromJson(Map<String, dynamic> json) {
    var rawEntries = json['entries'] as List? ?? [];
    return ExamMarksSheetDraft(
      clientUuid: json['clientUuid']?.toString() ?? '',
      examId: json['examId']?.toString() ?? '',
      examTitle: json['examTitle']?.toString() ?? '',
      classId: json['classId']?.toString() ?? '',
      className: json['className']?.toString() ?? '',
      subjectId: json['subjectId']?.toString() ?? '',
      subjectName: json['subjectName']?.toString() ?? '',
      totalMarks: json['totalMarks'] is num
          ? (json['totalMarks'] as num).toDouble()
          : 100.0,
      entries: rawEntries
          .map((e) => StudentMarksEntryItem.fromJson(e))
          .toList(),
      isDraft: json['isDraft'] != false,
      isSynced: json['isSynced'] == true,
      updatedAt:
          json['updatedAt']?.toString() ?? DateTime.now().toIso8601String(),
    );
  }

  Map<String, dynamic> toJson() => {
    'clientUuid': clientUuid,
    'examId': examId,
    'examTitle': examTitle,
    'classId': classId,
    'className': className,
    'subjectId': subjectId,
    'subjectName': subjectName,
    'totalMarks': totalMarks,
    'entries': entries.map((e) => e.toJson()).toList(),
    'isDraft': isDraft,
    'isSynced': isSynced,
    'updatedAt': updatedAt,
  };
}
