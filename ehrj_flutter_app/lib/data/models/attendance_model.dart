class AttendanceSubmissionItem {
  final String studentId;
  final String studentName;
  final int? rollNumber;
  String status; // PRESENT, ABSENT, LEAVE, LATE
  String? remarks;

  AttendanceSubmissionItem({
    required this.studentId,
    required this.studentName,
    this.rollNumber,
    this.status = 'PRESENT',
    this.remarks,
  });

  factory AttendanceSubmissionItem.fromJson(Map<String, dynamic> json) {
    return AttendanceSubmissionItem(
      studentId: json['studentId']?.toString() ?? '',
      studentName: json['studentName']?.toString() ?? '',
      rollNumber: json['rollNumber'] is int
          ? json['rollNumber']
          : int.tryParse(json['rollNumber']?.toString() ?? ''),
      status: json['status']?.toString() ?? 'PRESENT',
      remarks: json['remarks']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'studentId': studentId,
    'studentName': studentName,
    'rollNumber': rollNumber,
    'status': status,
    'remarks': remarks,
  };
}

class DailyAttendanceSheet {
  final String clientUuid;
  final String classId;
  final String className;
  final String? sessionId;
  final String? sectionId;
  final String? sectionName;
  final String date; // YYYY-MM-DD
  final List<AttendanceSubmissionItem> records;
  final bool isDraft;
  final bool isSynced;
  final String createdAt;

  DailyAttendanceSheet({
    required this.clientUuid,
    required this.classId,
    required this.className,
    this.sessionId,
    this.sectionId,
    this.sectionName,
    required this.date,
    required this.records,
    this.isDraft = false,
    this.isSynced = false,
    required this.createdAt,
  });

  int get presentCount => records.where((r) => r.status == 'PRESENT').length;
  int get absentCount => records.where((r) => r.status == 'ABSENT').length;
  int get leaveCount => records.where((r) => r.status == 'LEAVE').length;
  int get lateCount => records.where((r) => r.status == 'LATE').length;
  int get totalCount => records.length;

  factory DailyAttendanceSheet.fromJson(Map<String, dynamic> json) {
    var rawRecords = json['records'] as List? ?? [];
    return DailyAttendanceSheet(
      clientUuid: json['clientUuid']?.toString() ?? '',
      classId: json['classId']?.toString() ?? '',
      className: json['className']?.toString() ?? '',
      sessionId: json['sessionId']?.toString(),
      sectionId: json['sectionId']?.toString(),
      sectionName: json['sectionName']?.toString(),
      date: json['date']?.toString() ?? '',
      records: rawRecords
          .map((r) => AttendanceSubmissionItem.fromJson(r))
          .toList(),
      isDraft: json['isDraft'] == true,
      isSynced: json['isSynced'] == true,
      createdAt:
          json['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
    );
  }

  Map<String, dynamic> toJson() => {
    'clientUuid': clientUuid,
    'classId': classId,
    'className': className,
    'sessionId': sessionId,
    'sectionId': sectionId,
    'sectionName': sectionName,
    'date': date,
    'records': records.map((r) => r.toJson()).toList(),
    'isDraft': isDraft,
    'isSynced': isSynced,
    'createdAt': createdAt,
  };
}
