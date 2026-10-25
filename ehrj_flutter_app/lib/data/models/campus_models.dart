class DonationRecordModel {
  final String id;
  final String receiptNumber;
  final String donorName;
  final String donorPhone;
  final String? donorEmail;
  final String? donorAddress;
  final String fundCategory;
  final String fundCategoryBn;
  final double amount;
  final String paymentMethod;
  final String paymentMethodBn;
  final String transactionId;
  final bool isAnonymous;
  final String? notes;
  final String status;
  final String verificationToken;
  final DateTime createdAt;

  DonationRecordModel({
    required this.id,
    required this.receiptNumber,
    required this.donorName,
    required this.donorPhone,
    this.donorEmail,
    this.donorAddress,
    required this.fundCategory,
    required this.fundCategoryBn,
    required this.amount,
    required this.paymentMethod,
    required this.paymentMethodBn,
    required this.transactionId,
    this.isAnonymous = false,
    this.notes,
    required this.status,
    required this.verificationToken,
    required this.createdAt,
  });

  factory DonationRecordModel.fromJson(Map<String, dynamic> json) {
    return DonationRecordModel(
      id: json['id']?.toString() ?? '',
      receiptNumber: json['receiptNumber']?.toString() ?? '',
      donorName: json['donorName']?.toString() ?? 'সম্মানিত দাতা',
      donorPhone: json['donorPhone']?.toString() ?? '',
      donorEmail: json['donorEmail']?.toString(),
      donorAddress: json['donorAddress']?.toString(),
      fundCategory: json['fundCategory']?.toString() ?? 'ORPHAN_LILLAH',
      fundCategoryBn: json['fundCategoryBn']?.toString() ?? 'লিল্লাহ বোর্ডিং ও এতিমখানা',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      paymentMethod: json['paymentMethod']?.toString() ?? 'BKASH',
      paymentMethodBn: json['paymentMethodBn']?.toString() ?? 'বিকাশ',
      transactionId: json['transactionId']?.toString() ?? '',
      isAnonymous: json['isAnonymous'] == true,
      notes: json['notes']?.toString(),
      status: json['status']?.toString() ?? 'COMPLETED',
      verificationToken: json['verificationToken']?.toString() ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'receiptNumber': receiptNumber,
    'donorName': donorName,
    'donorPhone': donorPhone,
    'donorEmail': donorEmail,
    'donorAddress': donorAddress,
    'fundCategory': fundCategory,
    'fundCategoryBn': fundCategoryBn,
    'amount': amount,
    'paymentMethod': paymentMethod,
    'paymentMethodBn': paymentMethodBn,
    'transactionId': transactionId,
    'isAnonymous': isAnonymous,
    'notes': notes,
    'status': status,
    'verificationToken': verificationToken,
    'createdAt': createdAt.toIso8601String(),
  };
}

class GatePassRecordModel {
  final String id;
  final String passNumber;
  final String studentId;
  final String studentNameBn;
  final String studentIdNumber;
  final String className;
  final int rollNumber;
  final String residentialStatus;
  final String? roomOrSeat;
  final String purpose;
  final String purposeLabelBn;
  final String purposeDescription;
  final String escortName;
  final String escortPhone;
  final String escortRelation;
  final DateTime departureExpected;
  final DateTime returnExpected;
  final DateTime? actualExitTime;
  final DateTime? actualReturnTime;
  final String status;
  final String? securityNotes;
  final String approvedBy;
  final DateTime issuedAt;
  final String qrToken;

  GatePassRecordModel({
    required this.id,
    required this.passNumber,
    required this.studentId,
    required this.studentNameBn,
    required this.studentIdNumber,
    required this.className,
    required this.rollNumber,
    required this.residentialStatus,
    this.roomOrSeat,
    required this.purpose,
    required this.purposeLabelBn,
    required this.purposeDescription,
    required this.escortName,
    required this.escortPhone,
    required this.escortRelation,
    required this.departureExpected,
    required this.returnExpected,
    this.actualExitTime,
    this.actualReturnTime,
    required this.status,
    this.securityNotes,
    required this.approvedBy,
    required this.issuedAt,
    required this.qrToken,
  });

  factory GatePassRecordModel.fromJson(Map<String, dynamic> json) {
    return GatePassRecordModel(
      id: json['id']?.toString() ?? '',
      passNumber: json['passNumber']?.toString() ?? '',
      studentId: json['studentId']?.toString() ?? '',
      studentNameBn: json['studentNameBn']?.toString() ?? 'শিক্ষার্থী',
      studentIdNumber: json['studentIdNumber']?.toString() ?? '',
      className: json['className']?.toString() ?? '',
      rollNumber: json['rollNumber'] is num ? (json['rollNumber'] as num).toInt() : 0,
      residentialStatus: json['residentialStatus']?.toString() ?? 'RESIDENTIAL',
      roomOrSeat: json['roomOrSeat']?.toString(),
      purpose: json['purpose']?.toString() ?? 'OTHER',
      purposeLabelBn: json['purposeLabelBn']?.toString() ?? 'বিশেষ প্রয়োজন',
      purposeDescription: json['purposeDescription']?.toString() ?? '',
      escortName: json['escortName']?.toString() ?? 'অভিভাবক',
      escortPhone: json['escortPhone']?.toString() ?? '',
      escortRelation: json['escortRelation']?.toString() ?? 'অভিভাবক',
      departureExpected: json['departureExpected'] != null
          ? DateTime.tryParse(json['departureExpected'].toString()) ?? DateTime.now()
          : DateTime.now(),
      returnExpected: json['returnExpected'] != null
          ? DateTime.tryParse(json['returnExpected'].toString()) ?? DateTime.now().add(const Duration(days: 1))
          : DateTime.now().add(const Duration(days: 1)),
      actualExitTime: json['actualExitTime'] != null
          ? DateTime.tryParse(json['actualExitTime'].toString())
          : null,
      actualReturnTime: json['actualReturnTime'] != null
          ? DateTime.tryParse(json['actualReturnTime'].toString())
          : null,
      status: json['status']?.toString() ?? 'APPROVED',
      securityNotes: json['securityNotes']?.toString(),
      approvedBy: json['approvedBy']?.toString() ?? 'মুহতামিম অফিস',
      issuedAt: json['issuedAt'] != null
          ? DateTime.tryParse(json['issuedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      qrToken: json['qrToken']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'passNumber': passNumber,
    'studentId': studentId,
    'studentNameBn': studentNameBn,
    'studentIdNumber': studentIdNumber,
    'className': className,
    'rollNumber': rollNumber,
    'residentialStatus': residentialStatus,
    'roomOrSeat': roomOrSeat,
    'purpose': purpose,
    'purposeLabelBn': purposeLabelBn,
    'purposeDescription': purposeDescription,
    'escortName': escortName,
    'escortPhone': escortPhone,
    'escortRelation': escortRelation,
    'departureExpected': departureExpected.toIso8601String(),
    'returnExpected': returnExpected.toIso8601String(),
    'actualExitTime': actualExitTime?.toIso8601String(),
    'actualReturnTime': actualReturnTime?.toIso8601String(),
    'status': status,
    'securityNotes': securityNotes,
    'approvedBy': approvedBy,
    'issuedAt': issuedAt.toIso8601String(),
    'qrToken': qrToken,
  };
}

class CalendarItemModel {
  final String id;
  final String title;
  final String? titleBn;
  final String? description;
  final String eventType; // INSTITUTIONAL, ACADEMIC, EXAM, HOLIDAY
  final DateTime startDate;
  final DateTime endDate;
  final bool allDay;
  final String? location;

  CalendarItemModel({
    required this.id,
    required this.title,
    this.titleBn,
    this.description,
    required this.eventType,
    required this.startDate,
    required this.endDate,
    this.allDay = true,
    this.location,
  });

  factory CalendarItemModel.fromJson(Map<String, dynamic> json) {
    return CalendarItemModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      titleBn: json['titleBn']?.toString() ?? json['title']?.toString(),
      description: json['description']?.toString(),
      eventType: json['eventType']?.toString() ?? 'INSTITUTIONAL',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      allDay: json['allDay'] != false,
      location: json['location']?.toString(),
    );
  }
}

class DownloadDocumentModel {
  final String title;
  final String category;
  final String size;
  final String type;
  final String sessionYear;
  final String description;
  final String fileUrl;

  const DownloadDocumentModel({
    required this.title,
    required this.category,
    required this.size,
    required this.type,
    required this.sessionYear,
    required this.description,
    required this.fileUrl,
  });

  factory DownloadDocumentModel.fromJson(Map<String, dynamic> json) {
    return DownloadDocumentModel(
      title: json['title']?.toString() ?? '',
      category: json['category']?.toString() ?? 'সাধারণ',
      size: json['size']?.toString() ?? '১.০ মেগাবাইট',
      type: json['type']?.toString() ?? 'PDF',
      sessionYear: json['date']?.toString() ?? json['sessionYear']?.toString() ?? '২০২৬',
      description: json['description']?.toString() ?? '',
      fileUrl: json['fileUrl']?.toString() ?? '',
    );
  }
}

class GalleryPhotoModel {
  final String src;
  final String title;
  final String category;
  final String categoryBn;
  final String description;

  const GalleryPhotoModel({
    required this.src,
    required this.title,
    required this.category,
    required this.categoryBn,
    required this.description,
  });

  factory GalleryPhotoModel.fromJson(Map<String, dynamic> json) {
    return GalleryPhotoModel(
      src: json['src']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      category: json['category']?.toString() ?? 'CAMPUS',
      categoryBn: json['categoryBn']?.toString() ?? 'ক্যাম্পাস',
      description: json['description']?.toString() ?? '',
    );
  }
}
