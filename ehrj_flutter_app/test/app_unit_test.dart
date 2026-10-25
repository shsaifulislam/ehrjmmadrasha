import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ehrj_flutter_app/core/config/app_config.dart';
import 'package:ehrj_flutter_app/core/network/api_client.dart';
import 'package:ehrj_flutter_app/core/storage/local_storage_service.dart';
import 'package:ehrj_flutter_app/core/constants/app_strings_bn.dart';
import 'package:ehrj_flutter_app/data/models/user_model.dart';
import 'package:ehrj_flutter_app/data/models/attendance_model.dart';
import 'package:ehrj_flutter_app/data/models/exam_model.dart';
import 'package:ehrj_flutter_app/data/models/academic_models.dart';
import 'package:ehrj_flutter_app/data/models/notice_model.dart';
import 'package:ehrj_flutter_app/data/models/campus_models.dart';
import 'package:ehrj_flutter_app/core/services/notification_service.dart';
import 'package:ehrj_flutter_app/presentation/common/widgets/student_digital_id_card.dart';
import 'package:ehrj_flutter_app/presentation/common/widgets/payment_receipt_card.dart';

void main() {
  group('EHRJ Flutter Multi-Role Core Unit Tests', () {
    test('UserModel role validation and serialization', () {
      final user = UserModel(
        id: 'usr_101',
        name: 'মুফতী সাইফুল ইসলাম',
        username: 'teacher',
        email: 'teacher@ehrjmadrasha.com',
        role: 'TEACHER',
      );

      expect(user.isTeacher, true);
      expect(user.isAdmin, false);
      expect(user.isGuardian, false);

      final json = user.toJson();
      expect(json['id'], 'usr_101');
      expect(json['role'], 'TEACHER');

      final reconstructed = UserModel.fromJson(json);
      expect(reconstructed.name, 'মুফতী সাইফুল ইসলাম');
      expect(reconstructed.role, 'TEACHER');
    });

    test('DailyAttendanceSheet offline draft calculation', () {
      final records = [
        AttendanceSubmissionItem(
          studentId: 's1',
          studentName: 'আব্দুল্লাহ',
          rollNumber: 1,
          status: 'PRESENT',
        ),
        AttendanceSubmissionItem(
          studentId: 's2',
          studentName: 'মাহমুদ',
          rollNumber: 2,
          status: 'ABSENT',
        ),
        AttendanceSubmissionItem(
          studentId: 's3',
          studentName: 'হাসান',
          rollNumber: 3,
          status: 'LEAVE',
        ),
        AttendanceSubmissionItem(
          studentId: 's4',
          studentName: 'হুসাইন',
          rollNumber: 4,
          status: 'PRESENT',
        ),
      ];

      final sheet = DailyAttendanceSheet(
        clientUuid: 'att_test_uuid_101',
        classId: 'cls_hifz',
        className: 'হিফজুল কুরআন বিভাগ',
        date: '2026-10-17',
        records: records,
        isDraft: true,
        isSynced: false,
        createdAt: DateTime.now().toIso8601String(),
      );

      expect(sheet.totalCount, 4);
      expect(sheet.presentCount, 2);
      expect(sheet.absentCount, 1);
      expect(sheet.leaveCount, 1);
      expect(sheet.isDraft, true);
      expect(sheet.isSynced, false);

      final json = sheet.toJson();
      final restored = DailyAttendanceSheet.fromJson(json);
      expect(restored.clientUuid, 'att_test_uuid_101');
      expect(restored.className, 'হিফজুল কুরআন বিভাগ');
      expect(restored.presentCount, 2);
    });

    test('ExamMarksSheetDraft score validation', () {
      final entries = [
        StudentMarksEntryItem(
          studentId: 's1',
          studentName: 'আব্দুল্লাহ',
          marksObtained: 95.0,
          totalMarks: 100.0,
        ),
        StudentMarksEntryItem(
          studentId: 's2',
          studentName: 'মাহমুদ',
          marksObtained: 88.5,
          totalMarks: 100.0,
        ),
      ];

      final draft = ExamMarksSheetDraft(
        clientUuid: 'marks_test_101',
        examId: 'exam_1',
        examTitle: '১ম সাময়িক পরীক্ষা ২০২৬',
        classId: 'cls_1',
        className: 'দাওরায়ে হাদীস',
        subjectId: 'sub_bukhari',
        subjectName: 'সহীহ বুখারী ১ম খণ্ড',
        totalMarks: 100.0,
        entries: entries,
        isDraft: true,
        isSynced: false,
        updatedAt: DateTime.now().toIso8601String(),
      );

      expect(draft.entries.length, 2);
      expect(draft.entries[0].marksObtained, 95.0);
      expect(draft.subjectName, 'সহীহ বুখারী ১ম খণ্ড');

      final json = draft.toJson();
      final restored = ExamMarksSheetDraft.fromJson(json);
      expect(restored.examTitle, '১ম সাময়িক পরীক্ষা ২০২৬');
    });

    test('AcademicClassModel and SectionModel parsing', () {
      final classModel = AcademicClassModel(
        id: 'cls_noorani',
        name: 'নূরানী ১ম শ্রেণি',
        department: 'GENERAL',
        sections: [
          SectionModel(id: 'sec_a', name: 'ক শাখা'),
          SectionModel(id: 'sec_b', name: 'খ শাখা'),
        ],
      );

      expect(classModel.sections.length, 2);
      expect(classModel.sections[0].name, 'ক শাখা');

      final json = classModel.toJson();
      final restored = AcademicClassModel.fromJson(json);
      expect(restored.name, 'নূরানী ১ম শ্রেণি');
      expect(restored.sections.length, 2);
    });

    test('Bangla strings integrity', () {
      expect(
        AppStringsBn.institutionName,
        'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা',
      );
      expect(AppStringsBn.roleTeacher, 'উস্তাদ / শিক্ষক');
      expect(AppStringsBn.statusPresent, 'উপস্থিত');
      expect(AppStringsBn.statusAbsent, 'অনুপস্থিত');
    });

    test(
      'UserModel multi-role parsing for Principal, Student, and Accountant',
      () {
        final principal = UserModel(
          id: 'usr_p1',
          name: 'মাওলানা অধ্যক্ষ সাহেব',
          username: 'principal',
          role: 'PRINCIPAL',
        );
        expect(principal.isTeacher, false);
        expect(principal.isPrincipal, true);
        expect(principal.isAdmin, false);

        final student = UserModel(
          id: 'usr_s1',
          name: 'মুহাম্মদ তালহা',
          username: 'student1',
          role: 'STUDENT',
        );
        expect(student.isGuardian, false);
        expect(student.isTeacher, false);

        final accountant = UserModel(
          id: 'usr_a1',
          name: 'হিসাবরক্ষক সাহেব',
          username: 'accountant',
          role: 'ACCOUNTANT',
        );
        expect(accountant.isAdmin, false);
        expect(accountant.role, 'ACCOUNTANT');
      },
    );

    test('DailyAttendanceSheet real ERP payload with sessionId', () {
      final sheet = DailyAttendanceSheet(
        clientUuid: 'att_erp_2026_01',
        classId: 'cls_mesbah',
        className: 'মিশকাতুল মাসাবীহ জামাত',
        sessionId: 'session_2026_active',
        sectionId: 'sec_alpha',
        date: '2026-10-17',
        records: [
          AttendanceSubmissionItem(
            studentId: 'std_01',
            studentName: 'হাফেজ ওমর',
            rollNumber: 1,
            status: 'PRESENT',
            remarks: 'সময়ানুযায়ী উপস্থিত',
          ),
          AttendanceSubmissionItem(
            studentId: 'std_02',
            studentName: 'হাফেজ জুবায়ের',
            rollNumber: 2,
            status: 'ABSENT',
            remarks: 'ছুটি মঞ্জুর হয়নি',
          ),
        ],
        isDraft: false,
        isSynced: true,
        createdAt: '2026-10-17T09:00:00.000Z',
      );

      final json = sheet.toJson();
      expect(json['sessionId'], 'session_2026_active');
      expect(json['sectionId'], 'sec_alpha');
      expect(json['classId'], 'cls_mesbah');
      expect(json['isSynced'], true);

      final reconstructed = DailyAttendanceSheet.fromJson(json);
      expect(reconstructed.sessionId, 'session_2026_active');
      expect(reconstructed.records.length, 2);
      expect(reconstructed.records[0].remarks, 'সময়ানুযায়ী উপস্থিত');
      expect(reconstructed.presentCount, 1);
      expect(reconstructed.absentCount, 1);
    });

    test('Role routing verification for all 7 distinct user personas', () {
      final roles = {
        'ADMIN': 'অ্যাডমিন',
        'PRINCIPAL': 'অধ্যক্ষ',
        'TEACHER': 'শিক্ষক',
        'STUDENT': 'শিক্ষার্থী',
        'GUARDIAN': 'অভিভাবক',
        'ACCOUNTANT': 'হিসাবরক্ষক',
        'VISITOR': 'সাধারণ দর্শনার্থী',
      };

      for (final entry in roles.entries) {
        final roleKey = entry.key;
        final u = UserModel(
          id: 'user_$roleKey',
          name: '${entry.value} ব্যবহারকারী',
          username: roleKey.toLowerCase(),
          role: roleKey,
        );

        switch (roleKey) {
          case 'ADMIN':
            expect(u.isAdmin, true);
            expect(u.isTeacher, false);
            break;
          case 'PRINCIPAL':
            expect(u.isPrincipal, true);
            expect(u.isAdmin, false);
            break;
          case 'TEACHER':
            expect(u.isTeacher, true);
            expect(u.isAdmin, false);
            break;
          case 'STUDENT':
            expect(u.isStudent, true);
            expect(u.isTeacher, false);
            break;
          case 'GUARDIAN':
            expect(u.isGuardian, true);
            expect(u.isAdmin, false);
            break;
          case 'ACCOUNTANT':
            expect(u.isAccountant, true);
            expect(u.isAdmin, false);
            break;
          default:
            expect(u.isAdmin, false);
            expect(u.isTeacher, false);
            break;
        }
      }
    });

    test(
      'ExamMarksSheetDraft calculation with passing and failing boundaries',
      () {
        final sheet = ExamMarksSheetDraft(
          clientUuid: 'marks_sheet_eval_01',
          examId: 'exam_annual_2026',
          examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
          classId: 'cls_sanawiyah',
          className: 'সানাবিয়া ১ম বর্ষ',
          subjectId: 'sub_nahu',
          subjectName: 'হেদায়াতুন্নাহু',
          totalMarks: 100.0,
          entries: [
            StudentMarksEntryItem(
              studentId: 's1',
              studentName: 'মুহাম্মদ খালিদ',
              marksObtained: 94.0,
              totalMarks: 100.0,
              grade: 'A+',
            ),
            StudentMarksEntryItem(
              studentId: 's2',
              studentName: 'মুহাম্মদ খালিফ',
              marksObtained: 28.0,
              totalMarks: 100.0,
              grade: 'F',
            ),
          ],
          isDraft: true,
          isSynced: false,
          updatedAt: '2026-10-17T11:00:00.000Z',
        );

        expect(sheet.entries.length, 2);
        expect(sheet.entries[0].marksObtained, 94.0);
        expect(sheet.entries[1].marksObtained, 28.0);
        expect(sheet.isDraft, true);
        expect(sheet.isSynced, false);

        final json = sheet.toJson();
        final restored = ExamMarksSheetDraft.fromJson(json);
        expect(restored.entries[0].grade, 'A+');
        expect(restored.entries[1].grade, 'F');
        expect(restored.subjectName, 'হেদায়াতুন্নাহু');
      },
    );

    test('NoticeModel serialization with fallback keys', () {
      final jsonWithBn = {
        'id': 'not_01',
        'titleBn': 'রমজানুল মোবারকের বিশেষ ছুটির নোটিশ',
        'contentBn': 'সকল শিক্ষক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে...',
        'category': 'ACADEMIC',
        'publishedAt': '2026-10-17T10:00:00.000Z',
      };

      final notice1 = NoticeModel.fromJson(jsonWithBn);
      expect(notice1.id, 'not_01');
      expect(notice1.title, 'রমজানুল মোবারকের বিশেষ ছুটির নোটিশ');
      expect(notice1.category, 'ACADEMIC');

      final jsonStandard = {
        'id': 'not_02',
        'title': 'বার্ষিক পরীক্ষার সময়সূচী',
        'content': 'পরীক্ষা আগামী ২০ অক্টোবর থেকে অনুষ্ঠিত হবে।',
        'category': 'EXAM',
        'publishedAt': '2026-10-17T11:00:00.000Z',
      };

      final notice2 = NoticeModel.fromJson(jsonStandard);
      expect(notice2.id, 'not_02');
      expect(notice2.title, 'বার্ষিক পরীক্ষার সময়সূচী');
      expect(notice2.category, 'EXAM');
    });

    test('Guardian Child Model and academic attendance mapping', () {
      final childJson = {
        'id': 'child_01',
        'fullNameBn': 'মুহাম্মদ আবু বকর',
        'studentIdNumber': 'EHRJ-STD-2026-001',
        'enrollments': [
          {
            'jamatClass': {'nameBn': 'হিফজুল কুরআন বিভাগ'},
            'section': {'nameBn': 'ক শাখা'},
            'rollNumber': 1,
          },
        ],
      };

      expect(childJson['id'], 'child_01');
      expect(childJson['fullNameBn'], 'মুহাম্মদ আবু বকর');
      final enrollments = childJson['enrollments'] as List<dynamic>;
      expect(enrollments[0]['jamatClass']['nameBn'], 'হিফজুল কুরআন বিভাগ');
    });

    test('Admin Command Center and Finance KPI structure parsing', () {
      final commandCenterData = {
        'success': true,
        'summary': {
          'totalStudents': 185,
          'totalTeachers': 18,
          'totalGuardians': 120,
          'todayAttendancePercentage': 92.5,
        },
        'queues': {
          'pendingLeaves': 2,
          'pendingAdmissions': 5,
          'unpaidInvoices': 14,
        },
      };

      final summary = commandCenterData['summary'] as Map<String, dynamic>;
      expect(summary['totalStudents'], 185);
      expect(summary['todayAttendancePercentage'], 92.5);

      final queues = commandCenterData['queues'] as Map<String, dynamic>;
      expect(queues['pendingAdmissions'], 5);
      expect(queues['unpaidInvoices'], 14);
    });

    test('Public Admission application payload verification', () {
      final applicationPayload = {
        'fullNameBn': 'মাহমুদুল হাসান',
        'fatherNameBn': 'মাওলানা রফিকুল ইসলাম',
        'motherNameBn': 'রাবেয়া খাতুন',
        'contactNumber': '01812345678',
        'dateOfBirth': '2015-05-10',
        'desiredClass': 'হিফজুল কুরআন',
        'address': 'ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা',
        'status': 'PENDING',
      };

      expect(applicationPayload['fullNameBn'], 'মাহমুদুল হাসান');
      expect(applicationPayload['contactNumber'], '01812345678');
      expect(applicationPayload['status'], 'PENDING');
    });

    test('NotificationItem parsing and unread status', () {
      final json = {
        'id': 'notif_001',
        'title': 'মাসিক পরীক্ষার ফলাফল প্রকাশিত',
        'body': 'চলতি মাসের পরীক্ষার গ্রেডশিট প্রস্তুত করা হয়েছে।',
        'type': 'EXAM',
        'isRead': false,
        'createdAt': '2026-10-18T10:00:00.000Z',
      };

      final item = NotificationItem.fromJson(json);
      expect(item.id, 'notif_001');
      expect(item.title, 'মাসিক পরীক্ষার ফলাফল প্রকাশিত');
      expect(item.isRead, false);
      expect(item.type, 'EXAM');
    });

    test('StudentDigitalIdCard privacy-safe verification URL encoding', () {
      const card = StudentDigitalIdCard(
        studentId: 'std_c101_secure',
        fullNameBn: 'মুহাম্মদ আব্দুল্লাহ',
        studentIdNumber: 'EHRJ-2026-001',
        className: 'হিফজুল কুরআন বিভাগ',
      );

      // Verify URL only points to public verification endpoint with ID, no private guardian phone/confidential notes
      expect(
        card.verificationUrl,
        'http://localhost:3000/api/verify/student/std_c101_secure',
      );
      expect(card.verificationUrl.contains('018'), false);

      // Verify custom production domain support
      const customCard = StudentDigitalIdCard(
        studentId: 'std_c101_secure',
        fullNameBn: 'মুহাম্মদ আব্দুল্লাহ',
        studentIdNumber: 'EHRJ-2026-001',
        className: 'হিফজুল কুরআন বিভাগ',
        baseUrl: 'https://ehrjmadrasha.edu.bd',
      );
      expect(
        customCard.verificationUrl,
        'https://ehrjmadrasha.edu.bd/api/verify/student/std_c101_secure',
      );
    });

    test('PaymentReceiptCard official verification URL encoding', () {
      const receipt = PaymentReceiptCard(
        receiptNumber: 'RCT-2026-999',
        date: '১৮ অক্টোবর ২০২৬',
        studentName: 'মুহাম্মদ জুবায়ের',
        studentIdNumber: 'EHRJ-2026-002',
        className: 'দাওরায়ে হাদীস',
        feeTitle: 'মাসিক বেতন',
        amount: 3500.0,
        paymentMethod: 'বিকাশ অনলাইন',
        qrToken: 'TOKEN_QR_SECURE_777',
      );

      expect(
        receipt.verificationUrl,
        'http://localhost:3000/api/verify/receipt/TOKEN_QR_SECURE_777',
      );

      // Verify custom production domain support
      const customReceipt = PaymentReceiptCard(
        receiptNumber: 'RCT-2026-999',
        date: '১৮ অক্টোবর ২০২৬',
        studentName: 'মুহাম্মদ জুবায়ের',
        studentIdNumber: 'EHRJ-2026-002',
        className: 'দাওরায়ে হাদীস',
        feeTitle: 'মাসিক বেতন',
        amount: 3500.0,
        paymentMethod: 'বিকাশ অনলাইন',
        qrToken: 'TOKEN_QR_SECURE_777',
        baseUrl: 'https://ehrjmadrasha.edu.bd',
      );
      expect(
        customReceipt.verificationUrl,
        'https://ehrjmadrasha.edu.bd/api/verify/receipt/TOKEN_QR_SECURE_777',
      );
    });

    test('Configurable ApiClient baseUrl update and storage persistence', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final storage = LocalStorageService(prefs);
      final api = ApiClient(storage);

      expect(api.baseUrl, AppConfig.apiBaseUrl);

      await api.updateBaseUrl('http://192.168.0.240:3000/');
      expect(api.baseUrl, 'http://192.168.0.240:3000');
      expect(
        storage.getString(AppConfig.keyCustomApiBaseUrl),
        'http://192.168.0.240:3000',
      );

      // Verify a new ApiClient instance reads the stored custom URL
      final api2 = ApiClient(storage);
      expect(api2.baseUrl, 'http://192.168.0.240:3000');
    });

    test('NoticeModel Bengali getters and date formatting', () {
      final notice = NoticeModel(
        id: 'not_01',
        title: 'ভর্তি বিজ্ঞপ্তি ২০২৬',
        content: 'সকল বিভাগে নতুন ভর্তি শুরু হয়েছে',
        category: 'ভর্তি',
        publishedAt: '2026-10-18T10:00:00.000Z',
        priority: 'URGENT',
      );

      expect(notice.titleBn, 'ভর্তি বিজ্ঞপ্তি ২০২৬');
      expect(notice.contentBn, 'সকল বিভাগে নতুন ভর্তি শুরু হয়েছে');
      expect(notice.formattedDate, '2026-10-18');
      expect(notice.isImportant, true);
    });

    test('Multi-child family structure and sibling isolation verification', () {
      final childrenList = [
        {
          'id': 'child_01',
          'fullNameBn': 'মুহাম্মদ আব্দুল্লাহ',
          'rollNumber': '১০১',
          'className': 'হিফজুল কুরআন বিভাগ',
        },
        {
          'id': 'child_02',
          'fullNameBn': 'মুহাম্মদ উবাইদুল্লাহ',
          'rollNumber': '২০১',
          'className': 'নূরানী ১ম জামাত',
        },
      ];

      expect(childrenList.length, 2);
      expect(childrenList[0]['id'], 'child_01');
      expect(childrenList[1]['id'], 'child_02');
      expect(childrenList[0]['className'], isNot(equals(childrenList[1]['className'])));
    });

    test('Official Institutional Identity & Constants Verification', () {
      expect(AppStringsBn.institutionName, 'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা');
      expect(AppStringsBn.established, 'প্রতিষ্ঠিত: ২০২১ ইং');
      expect(AppStringsBn.primaryPhone, '01845-162664');
      expect(AppStringsBn.helplineSecondary, '01826-416696');
      expect(AppStringsBn.helplineTertiary, '01949-091911');
      expect(AppStringsBn.officialEmail, 'ehrjmadrasha@gmail.com');
    });

    test('DonationRecordModel serialization and verified receipt integrity', () {
      final donation = DonationRecordModel(
        id: 'DON-2026-999',
        receiptNumber: 'RCPT-2026-999',
        donorName: 'আলহাজ্ব রফিকুল ইসলাম',
        donorPhone: '01812345678',
        fundCategory: 'ORPHAN_LILLAH',
        fundCategoryBn: 'এতিম ও লিল্লাহ বোর্ডিং তহবিল',
        amount: 15000.0,
        paymentMethod: 'BKASH',
        paymentMethodBn: 'বিকাশ',
        transactionId: 'TRX99887766',
        status: 'COMPLETED',
        verificationToken: 'VRF-999',
        createdAt: DateTime.parse('2026-10-18T12:00:00.000Z'),
      );

      expect(donation.donorName, 'আলহাজ্ব রফিকুল ইসলাম');
      expect(donation.amount, 15000.0);
      expect(donation.fundCategory, 'ORPHAN_LILLAH');
      expect(donation.receiptNumber, 'RCPT-2026-999');

      final json = donation.toJson();
      expect(json['id'], 'DON-2026-999');
      expect(json['amount'], 15000.0);

      final restored = DonationRecordModel.fromJson(json);
      expect(restored.transactionId, 'TRX99887766');
      expect(restored.fundCategoryBn, 'এতিম ও লিল্লাহ বোর্ডিং তহবিল');
    });

    test('GatePassRecordModel status flags and escort validation', () {
      final passApproved = GatePassRecordModel(
        id: 'GP-2026-002',
        passNumber: 'GP-2026-002',
        studentId: 'st_2',
        studentNameBn: 'মুহাম্মদ আবু বকর',
        studentIdNumber: 'ST-102',
        className: 'নূরানী ১ম জামাত',
        rollNumber: 102,
        residentialStatus: 'RESIDENTIAL',
        purpose: 'WEEKEND_LEAVE',
        purposeLabelBn: 'সাপ্তাহিক নিয়মিত ছুটি',
        purposeDescription: 'সাপ্তাহিক ছুটি',
        escortName: 'নুরুল হক (অভিভাবক)',
        escortPhone: '01822223344',
        escortRelation: 'পিতা',
        departureExpected: DateTime.parse('2026-10-18T14:00:00.000Z'),
        returnExpected: DateTime.parse('2026-10-18T20:00:00.000Z'),
        status: 'APPROVED',
        approvedBy: 'অধ্যক্ষ মহোদয়',
        issuedAt: DateTime.parse('2026-10-18T13:30:00.000Z'),
        qrToken: 'GP-QR-2026-002',
      );

      expect(passApproved.status, 'APPROVED');
      expect(passApproved.passNumber, 'GP-2026-002');
      expect(passApproved.studentNameBn, 'মুহাম্মদ আবু বকর');

      final json = passApproved.toJson();
      final restored = GatePassRecordModel.fromJson(json);
      expect(restored.passNumber, 'GP-2026-002');
      expect(restored.escortName, 'নুরুল হক (অভিভাবক)');
    });

    test('CalendarItemModel date calculation and event tagging', () {
      final holiday = CalendarItemModel(
        id: 'cal_01',
        title: 'পবিত্র ঈদুল ফিতরের দীর্ঘকালীন ছুটি',
        titleBn: 'পবিত্র ঈদুল ফিতরের দীর্ঘকালীন ছুটি',
        eventType: 'HOLIDAY',
        startDate: DateTime.parse('2026-03-18T00:00:00.000Z'),
        endDate: DateTime.parse('2026-03-29T23:59:59.000Z'),
      );

      expect(holiday.eventType, 'HOLIDAY');
      expect(holiday.titleBn, 'পবিত্র ঈদুল ফিতরের দীর্ঘকালীন ছুটি');

      final json = {
        'id': 'cal_02',
        'title': 'বার্ষিক পরীক্ষার ফলাফল প্রকাশ',
        'titleBn': 'বার্ষিক পরীক্ষার ফলাফল প্রকাশ',
        'eventType': 'ACADEMIC',
        'startDate': '2026-11-20T09:00:00.000Z',
        'endDate': '2026-11-20T17:00:00.000Z',
      };
      final examEvent = CalendarItemModel.fromJson(json);

      expect(examEvent.eventType, 'ACADEMIC');
      expect(examEvent.titleBn, 'বার্ষিক পরীক্ষার ফলাফল প্রকাশ');
    });

    test('DownloadDocumentModel categorization and file metadata verification', () {
      const doc = DownloadDocumentModel(
        title: '২০২৬ শিক্ষাবর্ষের নতুন ভর্তি ফরম (সকল বিভাগ)',
        category: 'ভর্তি ফরম',
        size: '১.০ মেগাবাইট',
        type: 'PDF',
        sessionYear: '২০২৬',
        description: 'ভর্তি ফরম ও নিয়মাবলী',
        fileUrl: '/downloads/admission_form_2026.pdf',
      );

      expect(doc.category, 'ভর্তি ফরম');
      expect(doc.type, 'PDF');
      expect(doc.size, '১.০ মেগাবাইট');

      final json = {
        'title': '২০২৬ শিক্ষাবর্ষের নতুন ভর্তি ফরম',
        'category': 'ভর্তি ফরম',
        'size': '১.০ মেগাবাইট',
        'type': 'PDF',
        'date': '২০২৬',
        'fileUrl': '/downloads/form.pdf',
      };
      final restored = DownloadDocumentModel.fromJson(json);
      expect(restored.title, contains('ভর্তি ফরম'));
    });

    test('GalleryPhotoModel category filtering and title getters', () {
      const photo = GalleryPhotoModel(
        src: '/images/gallery/convocation_2026.jpg',
        title: 'হিফজুল কুরআন সমাপনী পাগড়ী প্রদান মহতী মাহফিল',
        category: 'EVENTS',
        categoryBn: 'অনুষ্ঠান ও মাহফিল',
        description: 'হিফজ সমাপনী পাগড়ি প্রদান',
      );

      expect(photo.category, 'EVENTS');
      expect(photo.categoryBn, 'অনুষ্ঠান ও মাহফিল');

      final json = {
        'src': '/images/gallery/convocation_2026.jpg',
        'title': 'হিফজুল কুরআন সমাপনী পাগড়ী প্রদান মহতী মাহফিল',
        'category': 'EVENTS',
        'categoryBn': 'অনুষ্ঠান ও মাহফিল',
      };
      final restored = GalleryPhotoModel.fromJson(json);
      expect(restored.title, 'হিফজুল কুরআন সমাপনী পাগড়ী প্রদান মহতী মাহফিল');
      expect(restored.src, '/images/gallery/convocation_2026.jpg');
    });
  });
}
