import 'package:flutter/material.dart';

import '../../data/models/academic_models.dart';
import '../../data/models/attendance_model.dart';
import '../../data/models/exam_model.dart';
import '../../data/repositories/teacher_repository.dart';

class TeacherProvider extends ChangeNotifier {
  final TeacherRepository _repo;

  // Session & Classes
  String? _currentSessionId;
  List<AcademicClassModel> _classes = [];
  AcademicClassModel? _selectedClass;
  SectionModel? _selectedSection;

  // Attendance
  List<StudentRosterItem> _roster = [];
  Map<String, AttendanceSubmissionItem> _attendanceDraftMap = {};

  // Exams & Marks
  List<ExamSessionModel> _exams = [];
  ExamSessionModel? _selectedExam;
  List<SubjectModel> _subjects = [];
  SubjectModel? _selectedSubject;
  Map<String, StudentMarksEntryItem> _marksDraftMap = {};

  // Leave & Profile
  Map<String, dynamic> _leaveData = {};

  // Status
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  TeacherProvider(this._repo);

  String? get currentSessionId => _currentSessionId;
  List<AcademicClassModel> get classes => _classes;
  AcademicClassModel? get selectedClass => _selectedClass;
  SectionModel? get selectedSection => _selectedSection;
  List<StudentRosterItem> get roster => _roster;
  Map<String, AttendanceSubmissionItem> get attendanceDraftMap =>
      _attendanceDraftMap;
  List<ExamSessionModel> get exams => _exams;
  ExamSessionModel? get selectedExam => _selectedExam;
  List<SubjectModel> get subjects => _subjects;
  SubjectModel? get selectedSubject => _selectedSubject;
  Map<String, StudentMarksEntryItem> get marksDraftMap => _marksDraftMap;
  Map<String, dynamic> get leaveData => _leaveData;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;

  // Attendance Metrics
  int get presentCount =>
      _attendanceDraftMap.values.where((r) => r.status == 'PRESENT').length;
  int get absentCount =>
      _attendanceDraftMap.values.where((r) => r.status == 'ABSENT').length;
  int get leaveCount =>
      _attendanceDraftMap.values.where((r) => r.status == 'LEAVE').length;
  int get lateCount =>
      _attendanceDraftMap.values.where((r) => r.status == 'LATE').length;

  // -------------------------------------------------------------
  // 1. CLASS & ROSTER SELECTION
  // -------------------------------------------------------------
  Future<void> loadAssignedClasses() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // 1. Fetch Session and assignments first
      final assignmentData = await _repo.getAssignmentsAndSession();
      if (assignmentData['currentSession'] != null) {
        _currentSessionId = assignmentData['currentSession']['id']?.toString();
      }

      // 2. Fetch Classes
      _classes = await _repo.getAssignedClasses();
      if (_classes.isNotEmpty) {
        _selectedClass = _classes.first;
        if (_selectedClass!.sections.isNotEmpty) {
          _selectedSection = _selectedClass!.sections.first;
        }
        await loadClassRoster();
        await loadSubjectsForClass(_selectedClass!.id);
      }
      await loadExams();
      await loadTeacherLeave();
    } catch (e) {
      _errorMessage = 'ক্লাসের তথ্য লোড করা যায়নি: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectClass(AcademicClassModel cls) {
    _selectedClass = cls;
    _selectedSection = cls.sections.isNotEmpty ? cls.sections.first : null;
    notifyListeners();
    loadClassRoster();
    loadSubjectsForClass(cls.id);
  }

  void selectSection(SectionModel? sec) {
    _selectedSection = sec;
    notifyListeners();
    loadClassRoster();
  }

  Future<void> loadClassRoster({String? date}) async {
    if (_selectedClass == null) return;
    _isLoading = true;
    notifyListeners();

    try {
      _roster = await _repo.getClassRoster(
        _selectedClass!.id,
        sectionId: _selectedSection?.id,
        sessionId: _currentSessionId,
        date: date ?? DateTime.now().toIso8601String().split('T').first,
      );

      // Initialize default attendance map
      _attendanceDraftMap = {};
      _marksDraftMap = {};

      for (final s in _roster) {
        _attendanceDraftMap[s.id] = AttendanceSubmissionItem(
          studentId: s.id,
          studentName: s.fullNameBn,
          rollNumber: s.rollNumber,
          status: 'PRESENT',
        );

        _marksDraftMap[s.id] = StudentMarksEntryItem(
          studentId: s.id,
          studentName: s.fullNameBn,
          rollNumber: s.rollNumber,
          marksObtained: null,
          totalMarks: _selectedSubject?.totalMarks.toDouble() ?? 100.0,
        );
      }
    } catch (e) {
      _errorMessage = 'শিক্ষার্থীদের তালিকা লোড করা যায়নি';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // -------------------------------------------------------------
  // 2. ATTENDANCE ACTIONS
  // -------------------------------------------------------------
  void setStudentStatus(String studentId, String status) {
    if (_attendanceDraftMap.containsKey(studentId)) {
      _attendanceDraftMap[studentId]!.status = status;
      notifyListeners();
    }
  }

  void markAllPresent() {
    for (final item in _attendanceDraftMap.values) {
      item.status = 'PRESENT';
    }
    notifyListeners();
  }

  Future<bool> saveAttendance({
    required String date,
    required bool submitOnline,
  }) async {
    if (_selectedClass == null || _attendanceDraftMap.isEmpty) return false;
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final clientUuid =
          'att_${_selectedClass!.id}_${date}_${DateTime.now().millisecondsSinceEpoch}';
      final sheet = DailyAttendanceSheet(
        clientUuid: clientUuid,
        classId: _selectedClass!.id,
        className: _selectedClass!.name,
        sectionId: _selectedSection?.id,
        sectionName: _selectedSection?.name,
        date: date,
        records: _attendanceDraftMap.values.toList(),
        isDraft: !submitOnline,
        isSynced: submitOnline,
        createdAt: DateTime.now().toIso8601String(),
      );

      final result = await _repo.recordAttendance(
        sheet: sheet,
        submitOnlineImmediately: submitOnline,
        sessionId: _currentSessionId,
      );

      _successMessage = result.isSynced
          ? 'হাজিরা সফলভাবে সার্ভারে সংরক্ষিত হয়েছে।'
          : 'অফলাইন খসড়া সংরক্ষিত হয়েছে। ইন্টারনেট সংযোগ পেলে সিঙ্ক হবে।';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'সংরক্ষণ ব্যর্থ হয়েছে: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // -------------------------------------------------------------
  // 3. SUBJECTS & MARKS
  // -------------------------------------------------------------
  Future<void> loadSubjectsForClass(String classId) async {
    try {
      _subjects = await _repo.getSubjects(classId);
      if (_subjects.isNotEmpty) {
        _selectedSubject = _subjects.first;
      } else {
        _selectedSubject = null;
      }
      notifyListeners();
    } catch (_) {}
  }

  void selectSubject(SubjectModel? sub) {
    _selectedSubject = sub;
    notifyListeners();
  }

  Future<void> loadExams() async {
    try {
      _exams = await _repo.getExams(sessionId: _currentSessionId);
      if (_exams.isNotEmpty) {
        _selectedExam = _exams.first;
      }
      notifyListeners();
    } catch (_) {}
  }

  void selectExam(ExamSessionModel? exam) {
    _selectedExam = exam;
    notifyListeners();
  }

  void setStudentMark(String studentId, double? marks) {
    if (_marksDraftMap.containsKey(studentId)) {
      _marksDraftMap[studentId]!.marksObtained = marks;
      _marksDraftMap[studentId]!.isAbsent = marks == null;
      notifyListeners();
    }
  }

  Future<bool> saveMarks({required bool submitOnline}) async {
    if (_selectedExam == null ||
        _selectedClass == null ||
        _selectedSubject == null) {
      _errorMessage = 'পরীক্ষা, জামাত এবং বিষয় নির্বাচন আবশ্যক।';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final clientUuid =
          'marks_${_selectedExam!.id}_${_selectedClass!.id}_${_selectedSubject!.id}_${DateTime.now().millisecondsSinceEpoch}';

      final draft = ExamMarksSheetDraft(
        clientUuid: clientUuid,
        examId: _selectedExam!.id,
        examTitle: _selectedExam!.title,
        classId: _selectedClass!.id,
        className: _selectedClass!.name,
        subjectId: _selectedSubject!.id,
        subjectName: _selectedSubject!.name,
        totalMarks: _selectedSubject!.totalMarks.toDouble(),
        entries: _marksDraftMap.values.toList(),
        isDraft: !submitOnline,
        isSynced: submitOnline,
        updatedAt: DateTime.now().toIso8601String(),
      );

      final res = await _repo.saveMarksDraft(
        draft: draft,
        submitOnline: submitOnline,
      );
      _successMessage = res.isSynced
          ? 'নম্বর সফলভাবে সার্ভারে জমা দেওয়া হয়েছে।'
          : 'নম্বরের খসড়া স্থানীয়ভাবে সংরক্ষিত হয়েছে। সিঙ্ক বাকি।';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'নম্বর সংরক্ষণ ব্যর্থ হয়েছে: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // -------------------------------------------------------------
  // 4. LEAVE & PROFILE
  // -------------------------------------------------------------
  Future<void> loadTeacherLeave() async {
    try {
      _leaveData = await _repo.getTeacherLeave();
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> submitLeave({
    required String leaveTypeId,
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final success = await _repo.submitTeacherLeave(
        leaveTypeId: leaveTypeId,
        startDate: startDate,
        endDate: endDate,
        reason: reason,
      );

      if (success) {
        _successMessage = 'ছুটির আবেদন সফলভাবে দাখিল করা হয়েছে।';
        await loadTeacherLeave();
      } else {
        _errorMessage = 'ছুটির আবেদন দাখিল করা যায়নি।';
      }
      _isLoading = false;
      notifyListeners();
      return success;
    } catch (e) {
      _errorMessage = 'ছুটির আবেদন ব্যর্থ হয়েছে: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}

extension DateIsoExtension on DateTime {
  String toIsoString() => toIso8601String();
}
