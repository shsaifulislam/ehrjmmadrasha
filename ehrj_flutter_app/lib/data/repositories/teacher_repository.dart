import '../../core/network/api_client.dart';
import '../../core/storage/local_storage_service.dart';
import '../models/academic_models.dart';
import '../models/attendance_model.dart';
import '../models/exam_model.dart';

class TeacherRepository {
  final ApiClient _api;
  final LocalStorageService _storage;

  TeacherRepository(this._api, this._storage);

  // -------------------------------------------------------------
  // 1. SESSION & ASSIGNMENTS
  // -------------------------------------------------------------
  Future<Map<String, dynamic>> getAssignmentsAndSession() async {
    try {
      final res = await _api.get('/api/teacher/attendance/assignments');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final sessionId = data['currentSession']?['id']?.toString();
        if (sessionId != null) {
          await _storage.setString('ehrj_current_session_id', sessionId);
        }
        await _storage.setCachedJson('ehrj_cached_teacher_assignments', data);
        return data;
      }
    } catch (_) {
      final cached = _storage.getCachedJson('ehrj_cached_teacher_assignments');
      if (cached is Map<String, dynamic>) {
        return cached;
      }
    }
    return {};
  }

  // -------------------------------------------------------------
  // 2. CLASSES & ROSTERS (WITH LOCAL CACHING)
  // -------------------------------------------------------------
  Future<List<AcademicClassModel>> getAssignedClasses() async {
    try {
      final response = await _api.get('/api/teacher/classes');
      if (response.statusCode == 200 && response.data != null) {
        final list =
            (response.data['classes'] as List? ?? response.data as List? ?? []);
        final classes = list
            .map((c) => AcademicClassModel.fromJson(c))
            .toList();
        await _storage.setCachedJson('ehrj_cached_teacher_classes', list);
        return classes;
      }
    } catch (_) {
      // Offline fallback: load from cache
      final cached = _storage.getCachedJson('ehrj_cached_teacher_classes');
      if (cached is List) {
        return cached.map((c) => AcademicClassModel.fromJson(c)).toList();
      }
    }
    return [];
  }

  Future<List<SubjectModel>> getSubjects(String classId) async {
    final cacheKey = 'ehrj_cached_subjects_$classId';
    try {
      final res = await _api.get(
        '/api/teacher/subjects',
        queryParameters: {'classId': classId},
      );
      if (res.statusCode == 200 && res.data != null) {
        final list = (res.data['subjects'] as List? ?? res.data as List? ?? []);
        final subjects = list.map((s) => SubjectModel.fromJson(s)).toList();
        await _storage.setCachedJson(cacheKey, list);
        return subjects;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is List) {
        return cached.map((s) => SubjectModel.fromJson(s)).toList();
      }
    }
    return [];
  }

  Future<List<StudentRosterItem>> getClassRoster(
    String classId, {
    String? sectionId,
    String? sessionId,
    String? date,
  }) async {
    final cacheKey = 'ehrj_cached_roster_${classId}_${sectionId ?? "all"}';
    final effectiveSessionId =
        sessionId ?? _storage.getString('ehrj_current_session_id');

    // Strategy 1: Try /api/teacher/attendance if session & date are available
    if (effectiveSessionId != null && date != null) {
      try {
        final params = <String, dynamic>{
          'sessionId': effectiveSessionId,
          'classId': classId,
          'date': date,
        };
        if (sectionId != null) params['sectionId'] = sectionId;

        final response = await _api.get(
          '/api/teacher/attendance',
          queryParameters: params,
        );
        if (response.statusCode == 200 && response.data != null) {
          final list = (response.data['students'] as List? ?? []);
          if (list.isNotEmpty) {
            final students = list
                .map((s) => StudentRosterItem.fromJson(s))
                .toList();
            await _storage.setCachedJson(cacheKey, list);
            return students;
          }
        }
      } catch (_) {}
    }

    // Strategy 2: Fall back to /api/teacher/classes?classId=...
    try {
      final response = await _api.get(
        '/api/teacher/classes',
        queryParameters: {'classId': classId},
      );
      if (response.statusCode == 200 && response.data != null) {
        final list = (response.data['students'] as List? ?? []);
        if (list.isNotEmpty) {
          final students = list
              .map((s) => StudentRosterItem.fromJson(s))
              .toList();
          await _storage.setCachedJson(cacheKey, list);
          return students;
        }
      }
    } catch (_) {}

    // Strategy 3: Offline fallback to local cache
    final cached = _storage.getCachedJson(cacheKey);
    if (cached is List) {
      return cached.map((s) => StudentRosterItem.fromJson(s)).toList();
    }

    return [];
  }

  // -------------------------------------------------------------
  // 3. DAILY ATTENDANCE & DURABLE OFFLINE QUEUE
  // -------------------------------------------------------------
  Future<DailyAttendanceSheet> recordAttendance({
    required DailyAttendanceSheet sheet,
    required bool submitOnlineImmediately,
    String? sessionId,
  }) async {
    final effectiveSessionId =
        sessionId ?? _storage.getString('ehrj_current_session_id') ?? '';

    if (submitOnlineImmediately && effectiveSessionId.isNotEmpty) {
      try {
        final payload = {
          'sessionId': effectiveSessionId,
          'classId': sheet.classId,
          'date': sheet.date,
          'records': sheet.records
              .map(
                (r) => {
                  'studentId': r.studentId,
                  'status': r.status,
                  'leaveReason': r.status == 'LEAVE' ? 'ছুটি' : null,
                  'remarks': null,
                },
              )
              .toList(),
          'clientUuid': sheet.clientUuid,
        };
        if (sheet.sectionId != null && sheet.sectionId!.isNotEmpty) {
          payload['sectionId'] = sheet.sectionId!;
        }

        final response = await _api.post(
          '/api/teacher/attendance',
          data: payload,
        );
        if (response.statusCode == 200 || response.statusCode == 201) {
          return DailyAttendanceSheet(
            clientUuid: sheet.clientUuid,
            classId: sheet.classId,
            className: sheet.className,
            sectionId: sheet.sectionId,
            sectionName: sheet.sectionName,
            date: sheet.date,
            records: sheet.records,
            isDraft: false,
            isSynced: true,
            createdAt: sheet.createdAt,
          );
        }
      } catch (_) {
        // Fallback to offline queue
      }
    }

    // Save as local pending offline draft
    final draft = DailyAttendanceSheet(
      clientUuid: sheet.clientUuid,
      classId: sheet.classId,
      className: sheet.className,
      sectionId: sheet.sectionId,
      sectionName: sheet.sectionName,
      date: sheet.date,
      records: sheet.records,
      isDraft: true,
      isSynced: false,
      createdAt: sheet.createdAt,
    );

    final queue = _storage.getPendingAttendanceQueue();
    queue.removeWhere((item) => item['clientUuid'] == sheet.clientUuid);
    queue.add(draft.toJson());
    await _storage.savePendingAttendanceQueue(queue);

    return draft;
  }

  List<DailyAttendanceSheet> getPendingAttendanceDrafts() {
    final queue = _storage.getPendingAttendanceQueue();
    return queue.map((json) => DailyAttendanceSheet.fromJson(json)).toList();
  }

  Future<int> syncPendingAttendanceQueue() async {
    final queue = _storage.getPendingAttendanceQueue();
    if (queue.isEmpty) return 0;

    int syncedCount = 0;
    final remaining = <Map<String, dynamic>>[];
    final effectiveSessionId =
        _storage.getString('ehrj_current_session_id') ?? '';

    for (final item in queue) {
      try {
        final recordsList = (item['records'] as List? ?? []);
        final payload = {
          'sessionId': effectiveSessionId,
          'classId': item['classId'],
          'date': item['date'],
          'records': recordsList
              .map(
                (r) => {
                  'studentId': r['studentId'],
                  'status': r['status'],
                  'leaveReason': r['status'] == 'LEAVE' ? 'ছুটি' : null,
                  'remarks': null,
                },
              )
              .toList(),
          'clientUuid': item['clientUuid'],
        };
        if (item['sectionId'] != null) {
          payload['sectionId'] = item['sectionId'];
        }

        final res = await _api.post('/api/teacher/attendance', data: payload);
        if (res.statusCode == 200 || res.statusCode == 201) {
          syncedCount++;
        } else {
          remaining.add(item);
        }
      } catch (_) {
        remaining.add(item);
      }
    }

    await _storage.savePendingAttendanceQueue(remaining);
    return syncedCount;
  }

  // -------------------------------------------------------------
  // 4. EXAMS & MARKS ENTRY
  // -------------------------------------------------------------
  Future<List<ExamSessionModel>> getExams({String? sessionId}) async {
    try {
      final params = <String, dynamic>{};
      if (sessionId != null) params['sessionId'] = sessionId;
      final response = await _api.get(
        '/api/teacher/exams',
        queryParameters: params,
      );
      if (response.statusCode == 200 && response.data != null) {
        final list =
            (response.data['exams'] as List? ?? response.data as List? ?? []);
        final exams = list.map((e) => ExamSessionModel.fromJson(e)).toList();
        await _storage.setCachedJson('ehrj_cached_exams', list);
        return exams;
      }
    } catch (_) {
      final cached = _storage.getCachedJson('ehrj_cached_exams');
      if (cached is List) {
        return cached.map((e) => ExamSessionModel.fromJson(e)).toList();
      }
    }
    return [];
  }

  Future<ExamMarksSheetDraft> saveMarksDraft({
    required ExamMarksSheetDraft draft,
    required bool submitOnline,
  }) async {
    if (submitOnline) {
      try {
        final res = await _api.post(
          '/api/teacher/results',
          data: {
            'examId': draft.examId,
            'classId': draft.classId,
            'subjectId': draft.subjectId,
            'entries': draft.entries.map((e) => e.toJson()).toList(),
            'action': 'SUBMIT',
            'clientUuid': draft.clientUuid,
          },
        );
        if (res.statusCode == 200 || res.statusCode == 201) {
          return ExamMarksSheetDraft(
            clientUuid: draft.clientUuid,
            examId: draft.examId,
            examTitle: draft.examTitle,
            classId: draft.classId,
            className: draft.className,
            subjectId: draft.subjectId,
            subjectName: draft.subjectName,
            totalMarks: draft.totalMarks,
            entries: draft.entries,
            isDraft: false,
            isSynced: true,
            updatedAt: draft.updatedAt,
          );
        }
      } catch (_) {
        // Fallback to queue
      }
    }

    // Save draft locally
    final queue = _storage.getPendingMarksQueue();
    queue.removeWhere((item) => item['clientUuid'] == draft.clientUuid);
    queue.add(draft.toJson());
    await _storage.savePendingMarksQueue(queue);

    return draft;
  }

  List<ExamMarksSheetDraft> getPendingMarksDrafts() {
    final queue = _storage.getPendingMarksQueue();
    return queue.map((json) => ExamMarksSheetDraft.fromJson(json)).toList();
  }

  Future<int> syncPendingMarksQueue() async {
    final queue = _storage.getPendingMarksQueue();
    if (queue.isEmpty) return 0;

    int syncedCount = 0;
    final remaining = <Map<String, dynamic>>[];

    for (final item in queue) {
      try {
        final res = await _api.post(
          '/api/teacher/results',
          data: {
            'examId': item['examId'],
            'classId': item['classId'],
            'subjectId': item['subjectId'],
            'entries': item['entries'],
            'action': 'SUBMIT',
            'clientUuid': item['clientUuid'],
          },
        );
        if (res.statusCode == 200 || res.statusCode == 201) {
          syncedCount++;
        } else {
          remaining.add(item);
        }
      } catch (_) {
        remaining.add(item);
      }
    }

    await _storage.savePendingMarksQueue(remaining);
    return syncedCount;
  }

  // -------------------------------------------------------------
  // 5. LEAVE & PROFILE
  // -------------------------------------------------------------
  Future<Map<String, dynamic>> getTeacherLeave() async {
    try {
      final res = await _api.get('/api/teacher/leave');
      if (res.statusCode == 200 && res.data != null) {
        return res.data as Map<String, dynamic>;
      }
    } catch (_) {}
    return {};
  }

  Future<bool> submitTeacherLeave({
    required String leaveTypeId,
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    try {
      final res = await _api.post(
        '/api/teacher/leave',
        data: {
          'leaveTypeId': leaveTypeId,
          'startDate': startDate,
          'endDate': endDate,
          'reason': reason,
        },
      );
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }
}
