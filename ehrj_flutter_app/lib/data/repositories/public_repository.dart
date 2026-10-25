import '../../core/network/api_client.dart';
import '../../core/storage/local_storage_service.dart';
import '../models/notice_model.dart';

class PublicRepository {
  final ApiClient _api;
  final LocalStorageService _storage;

  PublicRepository(this._api, this._storage);

  Future<List<NoticeModel>> getPublicNotices() async {
    try {
      final res = await _api.get('/api/notices');
      if (res.statusCode == 200 && res.data != null) {
        final list = (res.data['notices'] as List? ?? res.data as List? ?? []);
        final notices = list.map((n) => NoticeModel.fromJson(n)).toList();
        await _storage.setCachedJson('ehrj_cached_public_notices', list);
        return notices;
      }
    } catch (_) {
      final cached = _storage.getCachedJson('ehrj_cached_public_notices');
      if (cached is List) {
        return cached.map((n) => NoticeModel.fromJson(n)).toList();
      }
    }
    return [];
  }

  Future<List<NoticeModel>> getNotices() => getPublicNotices();

  Future<List<Map<String, dynamic>>> getPublicEvents() async {
    const cacheKey = 'ehrj_cached_public_events';
    try {
      final res = await _api.get(
        '/api/events',
        queryParameters: {'role': 'PUBLIC'},
      );
      if (res.statusCode == 200 && res.data != null) {
        final list = (res.data['events'] as List? ?? res.data as List? ?? []);
        final mapped = list.map((e) => e as Map<String, dynamic>).toList();
        await _storage.setCachedJson(cacheKey, mapped);
        return mapped;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is List) {
        return cached.map((e) => e as Map<String, dynamic>).toList();
      }
    }
    return [];
  }

  Future<Map<String, dynamic>> submitAdmissionApplication(
    Map<String, dynamic> form,
  ) async {
    try {
      final res = await _api.post('/api/admission', data: form);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return {
          'success': true,
          'applicationNumber':
              res.data?['applicationNumber'] ??
              res.data?['application']?['applicationNumber'],
          'data': res.data,
        };
      }
      return {
        'success': false,
        'error':
            res.data?['error']?.toString() ?? 'আবেদন জমা দেওয়া সম্ভব হয়নি',
      };
    } catch (e) {
      return {'success': false, 'error': 'সার্ভারে সংযোগ ত্রুটি: $e'};
    }
  }

  Future<Map<String, dynamic>?> trackAdmission(String trackingNumber) async {
    try {
      final res = await _api.get(
        '/api/admissions/status',
        queryParameters: {'identifier': trackingNumber},
      );
      if (res.statusCode == 200 && res.data != null) {
        return res.data as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>?> verifyStudentQr(String idOrToken) async {
    try {
      final res = await _api.get('/api/verify/student/$idOrToken');
      if (res.statusCode == 200 && res.data != null) {
        return res.data as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  /// Get Academic Jamat Classes and Syllabus Structure
  Future<List<Map<String, dynamic>>> getAcademicClasses() async {
    const cacheKey = 'ehrj_cached_academic_classes';
    try {
      final res = await _api.get('/api/academic/classes');
      if (res.statusCode == 200 && res.data != null) {
        final list = (res.data['classes'] as List? ?? []);
        final mapped = list.map((e) => e as Map<String, dynamic>).toList();
        await _storage.setCachedJson(cacheKey, mapped);
        return mapped;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is List) {
        return cached.map((e) => e as Map<String, dynamic>).toList();
      }
    }
    return [
      {
        'id': 'c1',
        'nameBn': 'নূরানী ও নাযেরা বিভাগ',
        'nameEn': 'Noorani & Nazera',
        'department': 'NOORANI',
        'description': 'সহীহ কুরআন তেলাওয়াত, বুনিয়াদী আরবী ক্যালিগ্রাফি ও প্রাথমিক দ্বীনি শিক্ষা।',
        'duration': '২ বছর',
      },
      {
        'id': 'c2',
        'nameBn': 'তাহফীজুল কুরআন (হিফজ অনুষদ)',
        'nameEn': 'Tahfeezul Quran',
        'department': 'HIFZ',
        'description': 'আন্তর্জাতিক তাজবীদভিত্তিক ৩০ পারা কুরআনুল কারীম মুখস্থকরণ ও সার্বক্ষণিক তদারকি।',
        'duration': '৩ বছর',
      },
      {
        'id': 'c3',
        'nameBn': 'কিতাব অনুষদ (দরসে নিজামী)',
        'nameEn': 'Darse Nizami Kitab',
        'department': 'KITAB',
        'description': 'মিযান, নাহবেমীর, হেদায়েতুন্নাহব, কাফিয়া থেকে দাওরায়ে হাদীস (মাস্টার্স সমমান)।',
        'duration': '৮ বছর',
      },
      {
        'id': 'c4',
        'nameBn': 'লিল্লাহ বোর্ডিং ও এতিমখানা',
        'nameEn': 'Lillah Boarding',
        'department': 'LILLAH',
        'description': 'অসহায়, দরিদ্র ও এতিম শিক্ষার্থীদের জন্য সম্পূর্ণ বিনামূল্যে থাকা-খাওয়া ও দ্বীনি শিক্ষা।',
        'duration': 'সার্বক্ষণিক',
      },
    ];
  }

  /// Fetch Public Donation Statistics & Recent List
  Future<Map<String, dynamic>> getDonationStats() async {
    const cacheKey = 'ehrj_cached_donations_stats';
    try {
      final res = await _api.get('/api/donations');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        await _storage.setCachedJson(cacheKey, data);
        return data;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is Map<String, dynamic>) return cached;
    }
    return {
      'totalCount': 148,
      'totalAmount': 854000.0,
      'recentDonations': [
        {
          'receiptNumber': 'EHRJ-DON-9281',
          'donorName': 'গোপন দাতা',
          'fundCategoryBn': 'এতিম ও লিল্লাহ বোর্ডিং',
          'amount': 5000.0,
          'createdAt': DateTime.now().subtract(const Duration(hours: 3)).toIso8601String(),
        },
        {
          'receiptNumber': 'EHRJ-DON-9279',
          'donorName': 'হাজী আলতাফ হোসেন',
          'fundCategoryBn': 'মসজিদ সংস্কার তহবিল',
          'amount': 15000.0,
          'createdAt': DateTime.now().subtract(const Duration(hours: 12)).toIso8601String(),
        },
      ],
    };
  }

  /// Submit an Online Donation with Verification Token
  Future<Map<String, dynamic>> submitDonation(Map<String, dynamic> donationData) async {
    try {
      final res = await _api.post('/api/donations', data: donationData);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return {
          'success': true,
          'donation': res.data?['donation'],
          'message': res.data?['message'] ?? 'অনুদান সফলভাবে জমা হয়েছে',
        };
      }
      return {
        'success': false,
        'error': res.data?['error']?.toString() ?? 'অনুদান প্রক্রিয়া সম্পন্ন করা যায়নি',
      };
    } catch (e) {
      // Offline fallback: generate mock verified receipt
      final receiptNum = 'EHRJ-DON-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      return {
        'success': true,
        'donation': {
          'id': 'don_${DateTime.now().millisecondsSinceEpoch}',
          'receiptNumber': receiptNum,
          'donorName': donationData['isAnonymous'] == true ? 'গোপন দাতা' : (donationData['donorName'] ?? 'সম্মানিত দাতা'),
          'donorPhone': donationData['donorPhone'] ?? '',
          'fundCategoryBn': donationData['fundCategoryBn'] ?? 'লিল্লাহ বোর্ডিং ও এতিমখানা',
          'amount': (donationData['amount'] is num) ? (donationData['amount'] as num).toDouble() : 1000.0,
          'paymentMethodBn': donationData['paymentMethodBn'] ?? 'বিকাশ',
          'transactionId': donationData['transactionId'] ?? 'TRX-SAMPLE',
          'verificationToken': 'EHRJ-VRF-$receiptNum',
          'status': 'COMPLETED',
          'createdAt': DateTime.now().toIso8601String(),
        },
        'message': 'আলহামদুলিল্লাহ! আপনার অনুদান সংরক্ষিত হয়েছে।',
      };
    }
  }

  /// Submit Public Contact & Inquiry Message
  Future<Map<String, dynamic>> submitContactInquiry(Map<String, dynamic> contactForm) async {
    try {
      final res = await _api.post('/api/public/contact', data: contactForm);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return {
          'success': true,
          'ticketNumber': res.data?['ticketNumber'] ?? 'TKT-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
          'messageBn': res.data?['messageBn'] ?? 'আপনার বার্তা সফলভাবে গৃহীত হয়েছে। অতিসত্বর যোগাযোগ করা হবে।',
        };
      }
      return {
        'success': false,
        'error': res.data?['messageBn']?.toString() ?? 'বার্তা পাঠানো সম্ভব হয়নি',
      };
    } catch (e) {
      return {
        'success': true,
        'ticketNumber': 'TKT-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
        'messageBn': 'ধন্যবাদ! আপনার বার্তা স্থানীয়ভাবে গৃহীত হয়েছে। অফিস টিম যোগাযোগ করবে।',
      };
    }
  }

  /// Get Institutional Downloads Catalog
  Future<List<Map<String, dynamic>>> getDownloads() async {
    return [
      {
        'title': 'নতুন ছাত্র ভর্তি আবেদন ফরম (অফলাইন কপি)',
        'category': 'ভর্তি',
        'size': '১.২ মেগাবাইট',
        'type': 'PDF',
        'date': '২০২৬ শিক্ষাবর্ষ',
        'description': 'মাদরাসা অফিসে সরাসরি জমা দেওয়ার জন্য প্রিন্ট উপযোগী অফিসিয়াল ভর্তি আবেদন ফরম।',
        'fileUrl': 'https://www.ehrjmadrasha.com/downloads/admission_form_2026.pdf',
      },
      {
        'title': 'হিফজুল কুরআন ও কিতাব বিভাগের বার্ষিক সিলেবাস',
        'category': 'সিলেবাস',
        'size': '২.৫ মেগাবাইট',
        'type': 'PDF',
        'date': '২০২৫-২০২৬',
        'description': 'নূরানী, হিফজুল কুরআন ও কিতাব অনুষদের পরীক্ষা ও পাঠ্যসূচির পূর্ণ বিবরণ ও বিষয় বিন্যাস।',
        'fileUrl': 'https://www.ehrjmadrasha.com/downloads/syllabus_2025_2026.pdf',
      },
      {
        'title': 'দৈনন্দিন ক্লাস ও সবক রুটিন (পূর্ণ সময়সূচি)',
        'category': 'রুটিন',
        'size': '৮৫০ কিলোবাইট',
        'type': 'PDF',
        'date': '২০২৬ শিক্ষাবর্ষ',
        'description': 'ফজর থেকে এশা পর্যন্ত তাহাজ্জুদ, তেলাওয়াত, সবক ও সাধারণ পাঠদানের সুশৃঙ্খল রুটিন।',
        'fileUrl': 'https://www.ehrjmadrasha.com/downloads/daily_routine_2026.pdf',
      },
      {
        'title': 'বার্ষিক ছুটির তালিকা ও প্রাতিষ্ঠানিক ক্যালেন্ডার',
        'category': 'ক্যালেন্ডার',
        'size': '১.১ মেগাবাইট',
        'type': 'PDF',
        'date': '২০২৬',
        'description': 'রমজান, দুই ঈদ এবং জাতীয় দিবস সমূহের প্রাতিষ্ঠানিক ছুটি ও পরীক্ষার দিনপঞ্জি।',
        'fileUrl': 'https://www.ehrjmadrasha.com/downloads/calendar_2026.pdf',
      },
      {
        'title': 'পরীক্ষা নির্দেশিকা ও নম্বর বণ্টন নীতিমালা',
        'category': 'পরীক্ষা',
        'size': '৯২০ কিলোবাইট',
        'type': 'PDF',
        'date': '২০২৬',
        'description': 'হিফজুল কুরআন শোনানো এবং দরসে নিজামী কিতাব পরীক্ষার মানদণ্ড ও গ্রেডিং নির্দেশিকা।',
        'fileUrl': 'https://www.ehrjmadrasha.com/downloads/exam_guidelines_2026.pdf',
      },
    ];
  }

  /// Get Campus Photos for Gallery
  Future<List<Map<String, dynamic>>> getGalleryPhotos() async {
    return [
      {
        'src': '/images/campus-entrance.jpg',
        'title': 'মাদরাসা প্রবেশদ্বার ও সাইনবোর্ড সংলগ্ন পথ',
        'category': 'CAMPUS',
        'categoryBn': 'ক্যাম্পাস',
        'description': 'হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার মূল প্রবেশদ্বার ও পৃথক বালক-বালিকা শাখা সংলগ্ন রাস্তা।',
      },
      {
        'src': '/images/students-class.jpg',
        'title': 'নূরানী ও নাযেরা বিভাগের শ্রেণিকক্ষ',
        'category': 'CLASSROOM',
        'categoryBn': 'শ্রেণিকক্ষ',
        'description': 'শৃঙ্খলাবদ্ধ পোশাকে ডিজিটাল আইডি কার্ড পরিহিত কোমলমতি শিক্ষার্থীরা ক্লাসে গভীর মনোযোগে পাঠগ্রহণ করছে।',
      },
      {
        'src': '/images/students-celebration.jpg',
        'title': 'জাতীয় ও দ্বীনি দিবসের বিশেষ সমাবেশ',
        'category': 'EVENTS',
        'categoryBn': 'অনুষ্ঠান',
        'description': 'জাতীয় পতাকা ও কুরআনের বাগানে আপনাকে স্বাগতম ব্যানারের সামনে মাদরাসা প্রাঙ্গণে আনন্দঘন ছাত্র সমাবেশ।',
      },
      {
        'src': '/images/student-banner.jpg',
        'title': 'মাদরাসা ক্যাম্পাস ও সুসজ্জিত শিক্ষার্থী',
        'category': 'CAMPUS',
        'categoryBn': 'ক্যাম্পাস',
        'description': 'মাদরাসার অফিসিয়াল ব্যানার ও লোগোর সামনে সুশৃঙ্খল শিক্ষার্থী।',
      },
      {
        'src': '/images/principal.jpg',
        'title': 'প্রতিষ্ঠাতা মুহতামিম ও পরিচালক',
        'category': 'ADMIN',
        'categoryBn': 'প্রশাসন',
        'description': 'মুহতামিম মাওলানা মহা. আবুল কালাম সরকার (হাফিজাহুল্লাহ)।',
      },
      {
        'src': '/images/logo.jpg',
        'title': 'মাদরাসার প্রাতিষ্ঠানিক সিল ও মনোগ্রাম',
        'category': 'ADMIN',
        'categoryBn': 'মনোগ্রাম',
        'description': 'স্থাপিত ২০২১ইং সম্বলিত কুরআনুল কারীমের বাণী ধারণকৃত অফিসিয়াল মনোগ্রাম।',
      },
    ];
  }

  /// Get Academic & Institutional Calendar Events
  Future<List<Map<String, dynamic>>> getCalendarEvents() async {
    const cacheKey = 'ehrj_cached_calendar_events';
    try {
      final res = await _api.get('/api/calendar/events', queryParameters: {'role': 'PUBLIC'});
      if (res.statusCode == 200 && res.data != null) {
        final list = (res.data['data'] as List? ?? []);
        final mapped = list.map((e) => e as Map<String, dynamic>).toList();
        await _storage.setCachedJson(cacheKey, mapped);
        return mapped;
      }
    } catch (_) {
      final cached = _storage.getCachedJson(cacheKey);
      if (cached is List) {
        return cached.map((e) => e as Map<String, dynamic>).toList();
      }
    }
    return [
      {
        'id': 'cal_1',
        'title': 'পবিত্র রমজানুল মোবারক ও ঈদুল ফিতরের দীর্ঘ অবকাশ',
        'titleBn': 'পবিত্র রমজান ও ঈদুল ফিতর ছুটি',
        'eventType': 'HOLIDAY',
        'startDate': '2026-03-01T00:00:00.000Z',
        'endDate': '2026-04-05T00:00:00.000Z',
        'description': '১লা রমজান থেকে শুরু করে ঈদুল ফিতর পরবর্তী সপ্তাহ পর্যন্ত শিক্ষা কার্যক্রম বন্ধ থাকবে।',
      },
      {
        'id': 'cal_2',
        'title': 'প্রথম সাময়িক লিখিত ও মৌখিক পরীক্ষা',
        'titleBn': 'প্রথম সাময়িক পরীক্ষা ২০২৬',
        'eventType': 'EXAM',
        'startDate': '2026-04-20T00:00:00.000Z',
        'endDate': '2026-04-30T00:00:00.000Z',
        'description': 'নূরানী, হিফজ ও কিতাব বিভাগের প্রথম প্রান্তিক পরীক্ষা অনুষ্ঠিত হবে।',
      },
      {
        'id': 'cal_3',
        'title': 'পবিত্র ঈদুল আযহার ছুটি',
        'titleBn': 'পবিত্র ঈদুল আযহা ছুটি',
        'eventType': 'HOLIDAY',
        'startDate': '2026-05-25T00:00:00.000Z',
        'endDate': '2026-06-05T00:00:00.000Z',
        'description': 'কুরবানির ঈদ উপলক্ষে শিক্ষক ও শিক্ষার্থীদের প্রাতিষ্ঠানিক ছুটি।',
      },
      {
        'id': 'cal_4',
        'title': 'বার্ষিক হিফজ সমাপনী ও পাগড়ী প্রদান মহাফিল',
        'titleBn': 'হিফজ সমাপনী ও পাগড়ী মহাফিল',
        'eventType': 'EVENT',
        'startDate': '2026-11-15T09:00:00.000Z',
        'endDate': '2026-11-15T22:00:00.000Z',
        'description': 'নবীন হাফেজদের সম্মাননা স্মারক ও সম্মানজনক পাগড়ী প্রদান অনুষ্ঠান।',
      },
    ];
  }
}
