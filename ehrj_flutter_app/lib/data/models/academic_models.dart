class AcademicClassModel {
  final String id;
  final String name;
  final String? code;
  final String? department; // GENERAL, HIFZ, KITAB
  final List<SectionModel> sections;

  AcademicClassModel({
    required this.id,
    required this.name,
    this.code,
    this.department,
    this.sections = const [],
  });

  factory AcademicClassModel.fromJson(Map<String, dynamic> json) {
    var rawSections = json['sections'] as List? ?? [];
    return AcademicClassModel(
      id: json['id']?.toString() ?? '',
      name:
          json['nameBn']?.toString() ??
          json['name']?.toString() ??
          json['className']?.toString() ??
          '',
      code: json['code']?.toString(),
      department: json['department']?.toString(),
      sections: rawSections.map((s) => SectionModel.fromJson(s)).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'code': code,
    'department': department,
    'sections': sections.map((s) => s.toJson()).toList(),
  };
}

class SectionModel {
  final String id;
  final String name;
  final String? capacity;

  SectionModel({required this.id, required this.name, this.capacity});

  factory SectionModel.fromJson(Map<String, dynamic> json) {
    return SectionModel(
      id: json['id']?.toString() ?? '',
      name:
          json['nameBn']?.toString() ??
          json['name']?.toString() ??
          json['sectionName']?.toString() ??
          '',
      capacity: json['capacity']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'capacity': capacity,
  };
}

class SubjectModel {
  final String id;
  final String name;
  final String? code;
  final int totalMarks;

  SubjectModel({
    required this.id,
    required this.name,
    this.code,
    this.totalMarks = 100,
  });

  factory SubjectModel.fromJson(Map<String, dynamic> json) {
    return SubjectModel(
      id: json['id']?.toString() ?? '',
      name:
          json['nameBn']?.toString() ??
          json['name']?.toString() ??
          json['subjectName']?.toString() ??
          '',
      code: json['code']?.toString(),
      totalMarks: json['totalMarks'] is int ? json['totalMarks'] : 100,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'code': code,
    'totalMarks': totalMarks,
  };
}

class StudentRosterItem {
  final String id;
  final String studentIdNumber;
  final String fullNameBn;
  final String? fullNameEn;
  final int? rollNumber;
  final String? className;
  final String? sectionName;
  final String? residentialStatus;
  final String? photoUrl;

  StudentRosterItem({
    required this.id,
    required this.studentIdNumber,
    required this.fullNameBn,
    this.fullNameEn,
    this.rollNumber,
    this.className,
    this.sectionName,
    this.residentialStatus,
    this.photoUrl,
  });

  factory StudentRosterItem.fromJson(Map<String, dynamic> json) {
    return StudentRosterItem(
      id: json['studentId']?.toString() ?? json['id']?.toString() ?? '',
      studentIdNumber: json['studentIdNumber']?.toString() ?? '',
      fullNameBn:
          json['fullNameBn']?.toString() ??
          json['nameBn']?.toString() ??
          json['studentNameBn']?.toString() ??
          json['name']?.toString() ??
          '',
      fullNameEn: json['fullNameEn']?.toString(),
      rollNumber: json['rollNumber'] is int
          ? json['rollNumber']
          : int.tryParse(json['rollNumber']?.toString() ?? ''),
      className: json['className']?.toString(),
      sectionName: json['sectionName']?.toString(),
      residentialStatus: json['residentialStatus']?.toString(),
      photoUrl: json['photoUrl']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'studentIdNumber': studentIdNumber,
    'fullNameBn': fullNameBn,
    'fullNameEn': fullNameEn,
    'rollNumber': rollNumber,
    'className': className,
    'sectionName': sectionName,
    'residentialStatus': residentialStatus,
    'photoUrl': photoUrl,
  };
}
