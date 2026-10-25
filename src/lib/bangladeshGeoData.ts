/**
 * BANGLADESH ADMINISTRATIVE GEOGRAPHY & LOCAL VILLAGES DATASET
 * Eliotganj Hazi Rohmatollah Jamiria Madrasha — Digital Campus ERP
 * 
 * Provides:
 * 1. All 8 Divisions of Bangladesh (বিভাগ)
 * 2. All 64 Districts organized by Division (জেলা)
 * 3. Comprehensive Upazilas / Thanas for every District (উপজেলা / থানা)
 * 4. Special Local Village Presets for Eliotganj & Daudkandi, Cumilla (গ্রাম / পাড়া / মহল্লা)
 * 5. Full address formatting utility in standard Bangladesh postal format
 */

export interface DistrictInfo {
  nameBn: string;
  nameEn: string;
  upazilas: { nameBn: string; nameEn: string; postCode?: string }[];
}

export interface DivisionInfo {
  nameBn: string;
  nameEn: string;
  districts: Record<string, DistrictInfo>;
}

/**
 * All 8 Administrative Divisions & 64 Districts with Upazilas
 */
export const BANGLADESH_GEO_DATA: Record<string, DivisionInfo> = {
  chattogram: {
    nameBn: "চট্টগ্রাম",
    nameEn: "Chattogram",
    districts: {
      cumilla: {
        nameBn: "কুমিল্লা",
        nameEn: "Cumilla",
        upazilas: [
          { nameBn: "দাউদকান্দি", nameEn: "Daudkandi", postCode: "৩৫১৬" },
          { nameBn: "চান্দিনা", nameEn: "Chandina", postCode: "৩৫১০" },
          { nameBn: "তিতাস", nameEn: "Titas", postCode: "৩৫২৩" },
          { nameBn: "হোমনা", nameEn: "Homna", postCode: "৩৫১৫" },
          { nameBn: "মেঘনা", nameEn: "Meghna", postCode: "৩৫১৩" },
          { nameBn: "মুরাদনগর", nameEn: "Muradnagar", postCode: "৩৫৪০" },
          { nameBn: "দেবিদ্বার", nameEn: "Debidwar", postCode: "৩৫৩২" },
          { nameBn: "বুড়িচং", nameEn: "Burichang", postCode: "৩৫২০" },
          { nameBn: "ব্রাহ্মণপাড়া", nameEn: "Brahmanpara", postCode: "৩৫২৬" },
          { nameBn: "কুমিল্লা আদর্শ সদর", nameEn: "Cumilla Adarsha Sadar", postCode: "৩৫০০" },
          { nameBn: "কুমিল্লা সদর দক্ষিণ", nameEn: "Cumilla Sadar Dakshin", postCode: "৩৫০১" },
          { nameBn: "বরুড়া", nameEn: "Barura", postCode: "৩৫৬০" },
          { nameBn: "লাকসাম", nameEn: "Laksam", postCode: "৩৫৭০" },
          { nameBn: "মনোহরগঞ্জ", nameEn: "Monohargonj", postCode: "৩৫৭৫" },
          { nameBn: "নাঙ্গলকোট", nameEn: "Nangalkot", postCode: "৩৫৮০" },
          { nameBn: "চৌদ্দগ্রাম", nameEn: "Chauddagram", postCode: "৩৫৩০" },
          { nameBn: "লালমাই", nameEn: "Lalmai", postCode: "৩৫৭২" },
        ],
      },
      brahmanbaria: {
        nameBn: "ব্রাহ্মণবাড়িয়া",
        nameEn: "Brahmanbaria",
        upazilas: [
          { nameBn: "ব্রাহ্মণবাড়িয়া সদর", nameEn: "Brahmanbaria Sadar", postCode: "৩৪০০" },
          { nameBn: "কসবা", nameEn: "Kasba", postCode: "৩৪৪০" },
          { nameBn: "নবীনগর", nameEn: "Nabinagar", postCode: "৩৪১০" },
          { nameBn: "বাঞ্ছারামপুর", nameEn: "Bancharampur", postCode: "৩৪০২" },
          { nameBn: "সরাইল", nameEn: "Sarail", postCode: "৩৪৩০" },
          { nameBn: "আশুগঞ্জ", nameEn: "Ashuganj", postCode: "৩৪০৩" },
          { nameBn: "নাসিরনগর", nameEn: "Nasirnagar", postCode: "৩৪৭০" },
          { nameBn: "আখাউড়া", nameEn: "Akhaura", postCode: "৩৪৫০" },
          { nameBn: "বিজয়নগর", nameEn: "Bijoynagar", postCode: "৩৪০৪" },
        ],
      },
      chandpur: {
        nameBn: "চাঁদপুর",
        nameEn: "Chandpur",
        upazilas: [
          { nameBn: "চাঁদপুর সদর", nameEn: "Chandpur Sadar", postCode: "৩৬০০" },
          { nameBn: "মতলব উত্তর", nameEn: "Matlab Uttar", postCode: "৩৬৪১" },
          { nameBn: "মতলব দক্ষিণ", nameEn: "Matlab Dakshin", postCode: "৩৬৪০" },
          { nameBn: "কচুয়া", nameEn: "Kachua", postCode: "৩৬৩০" },
          { nameBn: "হাজীগঞ্জ", nameEn: "Hajiganj", postCode: "৩৬১০" },
          { nameBn: "শাহরাস্তি", nameEn: "Shahrasti", postCode: "৩৬২০" },
          { nameBn: "ফরিদগঞ্জ", nameEn: "Faridganj", postCode: "৩৬৫০" },
          { nameBn: "হাইমচর", nameEn: "Haimchar", postCode: "৩৬৬০" },
        ],
      },
      chattogram_dist: {
        nameBn: "চট্টগ্রাম",
        nameEn: "Chattogram",
        upazilas: [
          { nameBn: "কোতোয়ালী", nameEn: "Kotwali", postCode: "৪০০০" },
          { nameBn: "পাঁচলাইশ", nameEn: "Panchlaish", postCode: "৪২০০" },
          { nameBn: "পটিয়া", nameEn: "Patiya", postCode: "৪৩৭০" },
          { nameBn: "সীতাকুণ্ড", nameEn: "Sitakunda", postCode: "৪৩১০" },
          { nameBn: "মীরসরাই", nameEn: "Mirsarai", postCode: "৪৩২০" },
          { nameBn: "হাটহাজারী", nameEn: "Hathazari", postCode: "৪৩৩০" },
          { nameBn: "রাঙ্গুনিয়া", nameEn: "Rangunia", postCode: "৪৩৬০" },
          { nameBn: "আনোয়ারা", nameEn: "Anwara", postCode: "৪৩৭৬" },
          { nameBn: "সাতকানিয়া", nameEn: "Satkania", postCode: "৪৩৮৬" },
          { nameBn: "লোহাগাড়া", nameEn: "Lohagara", postCode: "৪৩৯৬" },
          { nameBn: "বাঁশখালী", nameEn: "Banshkhali", postCode: "৪৩৯১" },
          { nameBn: "চন্দনাইশ", nameEn: "Chandanpukuria", postCode: "৪৩৮২" },
          { nameBn: "সন্দ্বীপ", nameEn: "Sandwip", postCode: "৪৩০০" },
          { nameBn: "কর্ণফুলী", nameEn: "Karnafuli", postCode: "৪০০০" },
        ],
      },
      noakhali: {
        nameBn: "নোয়াখালী",
        nameEn: "Noakhali",
        upazilas: [
          { nameBn: "নোয়াখালী সদর (সুধারাম)", nameEn: "Noakhali Sadar", postCode: "৩৮০০" },
          { nameBn: "বেগমগঞ্জ", nameEn: "Begumganj", postCode: "৩৮২১" },
          { nameBn: "চাটখিল", nameEn: "Chatkhil", postCode: "৩৮৭০" },
          { nameBn: "সোনাইমুড়ী", nameEn: "Sonaimuri", postCode: "৩৮২৭" },
          { nameBn: "সেনবাগ", nameEn: "Senbag", postCode: "৩৮৩০" },
          { nameBn: "কোম্পানীগঞ্জ", nameEn: "Companiganj", postCode: "৩৮৫০" },
          { nameBn: "হাতিয়া", nameEn: "Hatiya", postCode: "৩৮৯০" },
          { nameBn: "কবিরহাট", nameEn: "Kabirhat", postCode: "৩৮০৭" },
          { nameBn: "সুবর্ণচর", nameEn: "Subarnachar", postCode: "৩৮০১" },
        ],
      },
      feni: {
        nameBn: "ফেনী",
        nameEn: "Feni",
        upazilas: [
          { nameBn: "ফেনী সদর", nameEn: "Feni Sadar", postCode: "৩৯০০" },
          { nameBn: "দাগনভূঞা", nameEn: "Daganbhuiyan", postCode: "৩৯২০" },
          { nameBn: "সোনাগাজী", nameEn: "Sonagazi", postCode: "৩৯৩০" },
          { nameBn: "ছাগলনাইয়া", nameEn: "Chhagalnaiya", postCode: "৩৯১০" },
          { nameBn: "পরশুরাম", nameEn: "Parshuram", postCode: "৩৯৪০" },
          { nameBn: "ফুলগাজী", nameEn: "Fulgazi", postCode: "৩৯৪২" },
        ],
      },
      lakshmipur: {
        nameBn: "লক্ষ্মীপুর",
        nameEn: "Lakshmipur",
        upazilas: [
          { nameBn: "লক্ষ্মীপুর সদর", nameEn: "Lakshmipur Sadar", postCode: "৩৭০০" },
          { nameBn: "রায়পুর", nameEn: "Raipur", postCode: "৩৭২০" },
          { nameBn: "রামগঞ্জ", nameEn: "Ramganj", postCode: "৩৭১০" },
          { nameBn: "রামগতি", nameEn: "Ramgati", postCode: "৩৭৩০" },
          { nameBn: "কমলনগর", nameEn: "Kamalnagar", postCode: "৩৭৩২" },
        ],
      },
      coxsbazar: {
        nameBn: "কক্সবাজার",
        nameEn: "Cox's Bazar",
        upazilas: [
          { nameBn: "কক্সবাজার সদর", nameEn: "Cox's Bazar Sadar", postCode: "৪৭০০" },
          { nameBn: "চকরিয়া", nameEn: "Chakaria", postCode: "৪৭৪১" },
          { nameBn: "টেকনাফ", nameEn: "Teknaf", postCode: "৪৭৬১" },
          { nameBn: "উখিয়া", nameEn: "Ukhiya", postCode: "৪৭৫১" },
          { nameBn: "রামু", nameEn: "Ramu", postCode: "৪৭৩০" },
          { nameBn: "পেকুয়া", nameEn: "Pekua", postCode: "৪৭২৪" },
          { nameBn: "মহেশখালী", nameEn: "Maheshkhali", postCode: "৪৭৪০" },
          { nameBn: "কুতুবদিয়া", nameEn: "Kutubdia", postCode: "৪৭২১" },
          { nameBn: "ঈদগাঁও", nameEn: "Eidgaon", postCode: "৪৭৩২" },
        ],
      },
      khagrachhari: {
        nameBn: "খাগড়াছড়ি",
        nameEn: "Khagrachhari",
        upazilas: [
          { nameBn: "খাগড়াছড়ি সদর", nameEn: "Khagrachhari Sadar", postCode: "৪৬০০" },
          { nameBn: "দীঘিনালা", nameEn: "Dighinala", postCode: "৪৬১০" },
          { nameBn: "পানছড়ি", nameEn: "Panchhari", postCode: "৪৬২০" },
          { nameBn: "মহালছড়ি", nameEn: "Mahalchhari", postCode: "৪৬৩০" },
          { nameBn: "মাটিরাঙ্গা", nameEn: "Matiranga", postCode: "৪৬৪০" },
          { nameBn: "মানিকছড়ি", nameEn: "Manikchhari", postCode: "৪৬৫০" },
          { nameBn: "রামগড়", nameEn: "Ramgarh", postCode: "৪৬৬০" },
          { nameBn: "গুইমারা", nameEn: "Guimara", postCode: "৪৬৭০" },
        ],
      },
      rangamati: {
        nameBn: "রাঙ্গামাটি",
        nameEn: "Rangamati",
        upazilas: [
          { nameBn: "রাঙ্গামাটি সদর", nameEn: "Rangamati Sadar", postCode: "৪৫০০" },
          { nameBn: "কাপ্তাই", nameEn: "Kaptai", postCode: "৪৫৩০" },
          { nameBn: "বাঘাইছড়ি", nameEn: "Baghaichhari", postCode: "৪৫৬০" },
          { nameBn: "কাউখালী", nameEn: "Kawkhali", postCode: "৪৫১০" },
          { nameBn: "নানিয়ারচর", nameEn: "Naniarchar", postCode: "৪৫২০" },
          { nameBn: "রাজস্থলী", nameEn: "Rajasthali", postCode: "৪৫৪০" },
          { nameBn: "বিলাইছড়ি", nameEn: "Bilaichhari", postCode: "৪৫৫০" },
          { nameBn: "জুরাইছড়ি", nameEn: "Juraichhari", postCode: "৪৫৭০" },
          { nameBn: "বরকল", nameEn: "Barkal", postCode: "৪৫৮০" },
          { nameBn: "লংগদু", nameEn: "Langadu", postCode: "৪৫৯০" },
        ],
      },
      bandarban: {
        nameBn: "বান্দরবান",
        nameEn: "Bandarban",
        upazilas: [
          { nameBn: "বান্দরবান সদর", nameEn: "Bandarban Sadar", postCode: "৪৬০০" },
          { nameBn: "রোয়াংছড়ি", nameEn: "Rowangchhari", postCode: "৪৬১০" },
          { nameBn: "রুমা", nameEn: "Ruma", postCode: "৪৬২০" },
          { nameBn: "থানচি", nameEn: "Thanchi", postCode: "৪৬৩০" },
          { nameBn: "লামা", nameEn: "Lama", postCode: "৪৬৪০" },
          { nameBn: "আলীকদম", nameEn: "Alikadam", postCode: "৪৬৫০" },
          { nameBn: "নাইক্ষ্যংছড়ি", nameEn: "Naikhongchhari", postCode: "৪৬৬০" },
        ],
      },
    },
  },
  dhaka: {
    nameBn: "ঢাকা",
    nameEn: "Dhaka",
    districts: {
      dhaka_dist: {
        nameBn: "ঢাকা",
        nameEn: "Dhaka",
        upazilas: [
          { nameBn: "মিরপুর", nameEn: "Mirpur", postCode: "১২১৬" },
          { nameBn: "ধানমন্ডি", nameEn: "Dhanmondi", postCode: "১২০৯" },
          { nameBn: "মোহাম্মদপুর", nameEn: "Mohammadpur", postCode: "১২০৭" },
          { nameBn: "গুলশান", nameEn: "Gulshan", postCode: "১২১২" },
          { nameBn: "উত্তরা", nameEn: "Uttara", postCode: "১২৩০" },
          { nameBn: "মতিঝিল", nameEn: "Motijheel", postCode: "১০০০" },
          { nameBn: "খিলগাঁও", nameEn: "Khilgaon", postCode: "১২১৯" },
          { nameBn: "পল্টন", nameEn: "Paltan", postCode: "১০০০" },
          { nameBn: "সাভার", nameEn: "Savar", postCode: "১৩৪০" },
          { nameBn: "ধামরাই", nameEn: "Dhamrai", postCode: "১৩৫০" },
          { nameBn: "কেরানীগঞ্জ", nameEn: "Keraniganj", postCode: "১৩১০" },
          { nameBn: "নবাবগঞ্জ", nameEn: "Nawabganj", postCode: "১৩২০" },
          { nameBn: "দোহার", nameEn: "Dohar", postCode: "১৩৩০" },
        ],
      },
      gazipur: {
        nameBn: "গাজীপুর",
        nameEn: "Gazipur",
        upazilas: [
          { nameBn: "গাজীপুর সদর", nameEn: "Gazipur Sadar", postCode: "১৭০০" },
          { nameBn: "কালীগঞ্জ", nameEn: "Kaliganj", postCode: "১৭২০" },
          { nameBn: "কাপাসিয়া", nameEn: "Kapasia", postCode: "১৭৩০" },
          { nameBn: "শ্রীপুর", nameEn: "Sreepur", postCode: "১৭৪০" },
          { nameBn: "কালিয়াকৈর", nameEn: "Kaliakair", postCode: "১৭৫০" },
          { nameBn: "টঙ্গী", nameEn: "Tongi", postCode: "১৭১০" },
        ],
      },
      narayanganj: {
        nameBn: "নারায়ণগঞ্জ",
        nameEn: "Narayanganj",
        upazilas: [
          { nameBn: "নারায়ণগঞ্জ সদর", nameEn: "Narayanganj Sadar", postCode: "১৪০০" },
          { nameBn: "সোনারগাঁও", nameEn: "Sonargaon", postCode: "১৪৪০" },
          { nameBn: "বন্দর", nameEn: "Bandar", postCode: "১৪১০" },
          { nameBn: "আড়াইহাজার", nameEn: "Araihazar", postCode: "১৪৫০" },
          { nameBn: "রূপগঞ্জ", nameEn: "Rupganj", postCode: "১৪৬০" },
        ],
      },
      narsingdi: {
        nameBn: "নরসিংদী",
        nameEn: "Narsingdi",
        upazilas: [
          { nameBn: "নরসিংদী সদর", nameEn: "Narsingdi Sadar", postCode: "১৬০০" },
          { nameBn: "রায়পুরা", nameEn: "Raipura", postCode: "১৬৩০" },
          { nameBn: "বেলাব", nameEn: "Belabo", postCode: "১৬৪০" },
          { nameBn: "মনোহরদী", nameEn: "Monohardi", postCode: "১৬৫০" },
          { nameBn: "শিবপুর", nameEn: "Shibpur", postCode: "১৬২০" },
          { nameBn: "পলাশ", nameEn: "Palash", postCode: "১৬১০" },
        ],
      },
      munshiganj: {
        nameBn: "মুন্সীগঞ্জ",
        nameEn: "Munshiganj",
        upazilas: [
          { nameBn: "মুন্সীগঞ্জ সদর", nameEn: "Munshiganj Sadar", postCode: "১৫০০" },
          { nameBn: "শ্রীনগর", nameEn: "Sreenagar", postCode: "১৫৫০" },
          { nameBn: "সিরাজদিখান", nameEn: "Sirajdikhan", postCode: "১৫৪০" },
          { nameBn: "লৌহজং", nameEn: "Louhajang", postCode: "১৫৩০" },
          { nameBn: "গজারিয়া", nameEn: "Gajaria", postCode: "১৫১০" },
          { nameBn: "টংগিবাড়ী", nameEn: "Tongibari", postCode: "১৫২০" },
        ],
      },
      manikganj: {
        nameBn: "মানিকগঞ্জ",
        nameEn: "Manikganj",
        upazilas: [
          { nameBn: "মানিকগঞ্জ সদর", nameEn: "Manikganj Sadar", postCode: "১৮০০" },
          { nameBn: "সিংগাইর", nameEn: "Singair", postCode: "১৮২০" },
          { nameBn: "শিবালয়", nameEn: "Shibalaya", postCode: "১৮৫০" },
          { nameBn: "ঘিওর", nameEn: "Ghior", postCode: "১৮৪০" },
          { nameBn: "দৌলতপুর", nameEn: "Daulatpur", postCode: "১৮৬০" },
          { nameBn: "সাটুরিয়া", nameEn: "Saturia", postCode: "১৮১০" },
          { nameBn: "হরিরামপুর", nameEn: "Harirampur", postCode: "১৮৩০" },
        ],
      },
      tangail: {
        nameBn: "টাঙ্গাইল",
        nameEn: "Tangail",
        upazilas: [
          { nameBn: "টাঙ্গাইল সদর", nameEn: "Tangail Sadar", postCode: "১৯০০" },
          { nameBn: "মির্জাপুর", nameEn: "Mirzapur", postCode: "১৯৪০" },
          { nameBn: "নাগরপুর", nameEn: "Nagarpur", postCode: "১৯২০" },
          { nameBn: "সখিপুর", nameEn: "Sakhipur", postCode: "১৯৫০" },
          { nameBn: "বাসাইল", nameEn: "Basail", postCode: "১৯১০" },
          { nameBn: "দেলদুয়ার", nameEn: "Delduar", postCode: "১৯৩০" },
          { nameBn: "কালিহাতী", nameEn: "Kalihati", postCode: "১৯৭০" },
          { nameBn: "ঘাটাইল", nameEn: "Ghatail", postCode: "১৯৮০" },
          { nameBn: "মধুপুর", nameEn: "Madhupur", postCode: "১৯৬০" },
          { nameBn: "ভূঞাপুর", nameEn: "Bhuapur", postCode: "১৯৬১" },
          { nameBn: "গোপালপুর", nameEn: "Gopalpur", postCode: "১৯৬২" },
          { nameBn: "ধনবাড়ী", nameEn: "Dhanbari", postCode: "১৯৬৩" },
        ],
      },
      kishoreganj: {
        nameBn: "কিশোরগঞ্জ",
        nameEn: "Kishoreganj",
        upazilas: [
          { nameBn: "কিশোরগঞ্জ সদর", nameEn: "Kishoreganj Sadar", postCode: "২৩০০" },
          { nameBn: "ভৈরব", nameEn: "Bhairab", postCode: "২৩৫০" },
          { nameBn: "বাজিতপুর", nameEn: "Bajitpur", postCode: "২৩২০" },
          { nameBn: "কটিয়াদী", nameEn: "Katiadi", postCode: "২৩১০" },
          { nameBn: "পাকুন্দিয়া", nameEn: "Pakundia", postCode: "২৩৪০" },
          { nameBn: "করিমগঞ্জ", nameEn: "Karimganj", postCode: "২৩৩০" },
          { nameBn: "তাড়াইল", nameEn: "Tarail", postCode: "২৩৭০" },
          { nameBn: "হোসেনপুর", nameEn: "Hossainpur", postCode: "২৩৮০" },
          { nameBn: "নিকলী", nameEn: "Nikli", postCode: "২৩৬০" },
          { nameBn: "কুলিয়ারচর", nameEn: "Kuliarchar", postCode: "২৩৯০" },
          { nameBn: "ইটনা", nameEn: "Itna", postCode: "২৩৯১" },
          { nameBn: "মিঠামইন", nameEn: "Mithamain", postCode: "২৩৯২" },
          { nameBn: "অষ্টগ্রাম", nameEn: "Austagram", postCode: "২৩৯৩" },
        ],
      },
      faridpur: {
        nameBn: "ফরিদপুর",
        nameEn: "Faridpur",
        upazilas: [
          { nameBn: "ফরিদপুর সদর", nameEn: "Faridpur Sadar", postCode: "৭৮০০" },
          { nameBn: "বোয়ালমারী", nameEn: "Boalmari", postCode: "৭৮৬০" },
          { nameBn: "আলফাডাঙ্গা", nameEn: "Alfadanga", postCode: "৭৮৭০" },
          { nameBn: "মধুখালী", nameEn: "Madhukhali", postCode: "৭৮৫০" },
          { nameBn: "ভাঙ্গা", nameEn: "Bhanga", postCode: "৭৮৩০" },
          { nameBn: "নগরকান্দা", nameEn: "Nagarkanda", postCode: "৭৮২০" },
          { nameBn: "চরভদ্রাসন", nameEn: "Charbhadrasan", postCode: "৭৮৪০" },
          { nameBn: "সদরপুর", nameEn: "Sadarpur", postCode: "৭৮৩১" },
          { nameBn: "সালথা", nameEn: "Saltha", postCode: "৭৮২১" },
        ],
      },
      madaripur: {
        nameBn: "মাদারীপুর",
        nameEn: "Madaripur",
        upazilas: [
          { nameBn: "মাদারীপুর সদর", nameEn: "Madaripur Sadar", postCode: "৭৯০০" },
          { nameBn: "শিবচর", nameEn: "Shibchar", postCode: "৭৯২০" },
          { nameBn: "কালকিনি", nameEn: "Kalkini", postCode: "৭৯১০" },
          { nameBn: "রাজৈর", nameEn: "Rajoir", postCode: "৭৯৩০" },
          { nameBn: "ডাসার", nameEn: "Dasar", postCode: "৭৯১১" },
        ],
      },
      gopalganj: {
        nameBn: "গোপালগঞ্জ",
        nameEn: "Gopalganj",
        upazilas: [
          { nameBn: "গোপালগঞ্জ সদর", nameEn: "Gopalganj Sadar", postCode: "৮১০০" },
          { nameBn: "টুঙ্গিপাড়া", nameEn: "Tungipara", postCode: "৮১২০" },
          { nameBn: "কোটালীপাড়া", nameEn: "Kotalipara", postCode: "৮১১০" },
          { nameBn: "কাশিয়ানী", nameEn: "Kashiani", postCode: "৮১৩০" },
          { nameBn: "মুকসুদপুর", nameEn: "Muksudpur", postCode: "৮১৪০" },
        ],
      },
      rajbari: {
        nameBn: "রাজবাড়ী",
        nameEn: "Rajbari",
        upazilas: [
          { nameBn: "রাজবাড়ী সদর", nameEn: "Rajbari Sadar", postCode: "৭৭০০" },
          { nameBn: "পাংশা", nameEn: "Pangsha", postCode: "৭৭২০" },
          { nameBn: "বালিয়াকান্দি", nameEn: "Baliakandi", postCode: "৭৭১০" },
          { nameBn: "গোয়ালন্দ", nameEn: "Goalanda", postCode: "৭৭৩০" },
          { nameBn: "কালুখালী", nameEn: "Kalukhali", postCode: "৭৭২১" },
        ],
      },
      shariatpur: {
        nameBn: "শরীয়তপুর",
        nameEn: "Shariatpur",
        upazilas: [
          { nameBn: "শরীয়তপুর সদর", nameEn: "Shariatpur Sadar", postCode: "৮০০০" },
          { nameBn: "জাজিরা", nameEn: "Zajira", postCode: "৮০১০" },
          { nameBn: "নড়িয়া", nameEn: "Naria", postCode: "৮০২০" },
          { nameBn: "ভেদরগঞ্জ", nameEn: "Bhedarganj", postCode: "৮০৩০" },
          { nameBn: "ডামুড্যা", nameEn: "Damudya", postCode: "৮০৪০" },
          { nameBn: "গোসাইরহাট", nameEn: "Gosairhat", postCode: "৮০৫০" },
        ],
      },
    },
  },
  sylhet: {
    nameBn: "সিলেট",
    nameEn: "Sylhet",
    districts: {
      sylhet_dist: {
        nameBn: "সিলেট",
        nameEn: "Sylhet",
        upazilas: [
          { nameBn: "সিলেট সদর", nameEn: "Sylhet Sadar", postCode: "৩১০০" },
          { nameBn: "গোলাপগঞ্জ", nameEn: "Golapganj", postCode: "৩১৭০" },
          { nameBn: "বিয়ানীবাজার", nameEn: "Beanibazar", postCode: "৩১৮০" },
          { nameBn: "বিশ্বনাথ", nameEn: "Bishwanath", postCode: "৩১৩০" },
          { nameBn: "জৈন্তাপুর", nameEn: "Jaintiapur", postCode: "৩১৫০" },
          { nameBn: "কানাইঘাট", nameEn: "Kanaighat", postCode: "৩১৬০" },
          { nameBn: "কোম্পানীগঞ্জ", nameEn: "Companiganj", postCode: "৩১৪০" },
          { nameBn: "বালাগঞ্জ", nameEn: "Balaganj", postCode: "৩১২০" },
          { nameBn: "ফেঞ্চুগঞ্জ", nameEn: "Fenchuganj", postCode: "৩১১১" },
          { nameBn: "জকিগঞ্জ", nameEn: "Zakiganj", postCode: "৩১৯০" },
          { nameBn: "দক্ষিণ সুরমা", nameEn: "Dakshin Surma", postCode: "৩১০১" },
          { nameBn: "ওসমানী নগর", nameEn: "Osmani Nagar", postCode: "৩১২১" },
          { nameBn: "গোয়াইনঘাট", nameEn: "Gowainghat", postCode: "৩১৫১" },
        ],
      },
      moulvibazar: {
        nameBn: "মৌলভীবাজার",
        nameEn: "Moulvibazar",
        upazilas: [
          { nameBn: "মৌলভীবাজার সদর", nameEn: "Moulvibazar Sadar", postCode: "৩২০০" },
          { nameBn: "শ্রীমঙ্গল", nameEn: "Sreemangal", postCode: "৩২১০" },
          { nameBn: "কমলগঞ্জ", nameEn: "Kamalganj", postCode: "৩২২০" },
          { nameBn: "কুলাউড়া", nameEn: "Kulaura", postCode: "৩২৩০" },
          { nameBn: "বড়লেখা", nameEn: "Barlekha", postCode: "৩২৪০" },
          { nameBn: "রাজনগর", nameEn: "Rajnagar", postCode: "৩২৫০" },
          { nameBn: "জুড়ী", nameEn: "Juri", postCode: "৩২৬০" },
        ],
      },
      habiganj: {
        nameBn: "হবিগঞ্জ",
        nameEn: "Habiganj",
        upazilas: [
          { nameBn: "হবিগঞ্জ সদর", nameEn: "Habiganj Sadar", postCode: "৩৩০০" },
          { nameBn: "নবীগঞ্জ", nameEn: "Nabiganj", postCode: "৩৩১০" },
          { nameBn: "বাহুবল", nameEn: "Bahubal", postCode: "৩৩২০" },
          { nameBn: "মাধবপুর", nameEn: "Madhabpur", postCode: "৩৩৩০" },
          { nameBn: "চুনারুঘাট", nameEn: "Chunarughat", postCode: "৩৩৪০" },
          { nameBn: "লাখাই", nameEn: "Lakhai", postCode: "৩৩৫০" },
          { nameBn: "আজমিরীগঞ্জ", nameEn: "Ajmiriganj", postCode: "৩৩৬০" },
          { nameBn: "বানিয়াচং", nameEn: "Baniachong", postCode: "৩৩৭০" },
          { nameBn: "শায়েস্তাগঞ্জ", nameEn: "Shayestaganj", postCode: "৩৩১১" },
        ],
      },
      sunamganj: {
        nameBn: "সুনামগঞ্জ",
        nameEn: "Sunamganj",
        upazilas: [
          { nameBn: "সুনামগঞ্জ সদর", nameEn: "Sunamganj Sadar", postCode: "৩৪০০" },
          { nameBn: "ছাতক", nameEn: "Chhatak", postCode: "৩৪১০" },
          { nameBn: "জগন্নাথপুর", nameEn: "Jagannathpur", postCode: "৩৪২০" },
          { nameBn: "দিরাই", nameEn: "Dirai", postCode: "৩৪৩০" },
          { nameBn: "তাহিরপুর", nameEn: "Tahirpur", postCode: "৩৪৪০" },
          { nameBn: "ধর্মপাশা", nameEn: "Dharmapasha", postCode: "৩৪৫০" },
          { nameBn: "জামালগঞ্জ", nameEn: "Jamalganj", postCode: "৩৪৬০" },
          { nameBn: "শাল্লা", nameEn: "Shalla", postCode: "৩৪৭০" },
          { nameBn: "বিশ্বম্ভরপুর", nameEn: "Bishwamvarpur", postCode: "৩৪৮০" },
          { nameBn: "দোয়ারাবাজার", nameEn: "Dowarabazar", postCode: "৩৪৯০" },
          { nameBn: "মধ্যনগর", nameEn: "Madhyanagar", postCode: "৩৪৫১" },
          { nameBn: "শান্তিগঞ্জ", nameEn: "Shantiganj", postCode: "৩৪২১" },
        ],
      },
    },
  },
  rajshahi: {
    nameBn: "রাজশাহী",
    nameEn: "Rajshahi",
    districts: {
      rajshahi_dist: {
        nameBn: "রাজশাহী",
        nameEn: "Rajshahi",
        upazilas: [
          { nameBn: "বোয়ালিয়া", nameEn: "Boalia", postCode: "৬০০০" },
          { nameBn: "পবা", nameEn: "Paba", postCode: "৬২০১" },
          { nameBn: "গোদাগাড়ী", nameEn: "Godagari", postCode: "৬২৯০" },
          { nameBn: "তানোর", nameEn: "Tanor", postCode: "৬২৮০" },
          { nameBn: "বাগমারা", nameEn: "Bagmara", postCode: "৬২৫০" },
          { nameBn: "পুঠিয়া", nameEn: "Puthia", postCode: "৬২৪০" },
          { nameBn: "চারঘাট", nameEn: "Charghat", postCode: "৬২৭০" },
          { nameBn: "বাঘা", nameEn: "Bagha", postCode: "৬২৬০" },
          { nameBn: "দুর্গাপুর", nameEn: "Durgapur", postCode: "৬২৩০" },
        ],
      },
      bogura: {
        nameBn: "বগুড়া",
        nameEn: "Bogura",
        upazilas: [
          { nameBn: "বগুড়া সদর", nameEn: "Bogura Sadar", postCode: "৫৮০০" },
          { nameBn: "শেরপুর", nameEn: "Sherpur", postCode: "৫৮৪০" },
          { nameBn: "শিবগঞ্জ", nameEn: "Shibganj", postCode: "৫৮১০" },
          { nameBn: "সারিয়াকান্দি", nameEn: "Sariakandi", postCode: "৫৮৮০" },
          { nameBn: "ধুনট", nameEn: "Dhunat", postCode: "৫৮৫০" },
          { nameBn: "গাবতলী", nameEn: "Gabtali", postCode: "৫৮২০" },
          { nameBn: "শাজাহানপুর", nameEn: "Shajahanpur", postCode: "৫৮০১" },
          { nameBn: "কাহালু", nameEn: "Kahalu", postCode: "৫৮৭০" },
          { nameBn: "নন্দীগ্রাম", nameEn: "Nandigram", postCode: "৫৮৬০" },
          { nameBn: "আদমদীঘি", nameEn: "Adamdighi", postCode: "৫৮৯০" },
          { nameBn: "দুপচাঁচিয়া", nameEn: "Dupchanchia", postCode: "৫৮৩০" },
          { nameBn: "সোনাতলা", nameEn: "Sonatala", postCode: "৫৮৮১" },
        ],
      },
      pabna: {
        nameBn: "পাবনা",
        nameEn: "Pabna",
        upazilas: [
          { nameBn: "পাবনা সদর", nameEn: "Pabna Sadar", postCode: "৬৬০০" },
          { nameBn: "ঈশ্বরদী", nameEn: "Ishwardi", postCode: "৬৬২০" },
          { nameBn: "আটঘরিয়া", nameEn: "Atgharia", postCode: "৬৬১০" },
          { nameBn: "চাটমোহর", nameEn: "Chatmohar", postCode: "৬৬৬০" },
          { nameBn: "ভাঙ্গুড়া", nameEn: "Bhangura", postCode: "৬৬৭০" },
          { nameBn: "ফরিদপুর", nameEn: "Faridpur", postCode: "৬৬৫০" },
          { nameBn: "সাঁথিয়া", nameEn: "Santhia", postCode: "৬৬৪০" },
          { nameBn: "সুজানগর", nameEn: "Sujanagar", postCode: "৬৬৩০" },
          { nameBn: "বেড়া", nameEn: "Bera", postCode: "৬৬৮০" },
        ],
      },
      sirajganj: {
        nameBn: "সিরাজগঞ্জ",
        nameEn: "Sirajganj",
        upazilas: [
          { nameBn: "সিরাজগঞ্জ সদর", nameEn: "Sirajganj Sadar", postCode: "৬৭০০" },
          { nameBn: "শাহজাদপুর", nameEn: "Shahjadpur", postCode: "৬৭৭০" },
          { nameBn: "উল্লাপাড়া", nameEn: "Ullapara", postCode: "৬৭৬০" },
          { nameBn: "বেলকুচি", nameEn: "Belkuchi", postCode: "৬৭৪০" },
          { nameBn: "রায়গঞ্জ", nameEn: "Raiganj", postCode: "৬৭২০" },
          { nameBn: "তাড়াশ", nameEn: "Tarash", postCode: "৬৭৮০" },
          { nameBn: "কাজিপুর", nameEn: "Kazipur", postCode: "৬৭১০" },
          { nameBn: "কামারখন্দ", nameEn: "Kamarkhanda", postCode: "৬৭৩০" },
          { nameBn: "চৌহালী", nameEn: "Chauhali", postCode: "৬৭৫০" },
        ],
      },
      naogaon: {
        nameBn: "নওগাঁ",
        nameEn: "Naogaon",
        upazilas: [
          { nameBn: "নওগাঁ সদর", nameEn: "Naogaon Sadar", postCode: "৬৫০০" },
          { nameBn: "পত্নীতলা", nameEn: "Patnitala", postCode: "৬৫২০" },
          { nameBn: "ধামইরহাট", nameEn: "Dhamoirhat", postCode: "৬৫৩০" },
          { nameBn: "মহাদেবপুর", nameEn: "Mohadevpur", postCode: "৬৫১০" },
          { nameBn: "মান্দা", nameEn: "Manda", postCode: "৬৫৪০" },
          { nameBn: "রানীনগর", nameEn: "Raninagar", postCode: "৬৫৫০" },
          { nameBn: "আত্রাই", nameEn: "Atrai", postCode: "৬৫৬০" },
          { nameBn: "বদলগাছী", nameEn: "Badalgachhi", postCode: "৬৫৭০" },
          { nameBn: "পোরশা", nameEn: "Porsha", postCode: "৬৫৬০" },
          { nameBn: "সাপাহার", nameEn: "Sapahar", postCode: "৬৫৯০" },
          { nameBn: "নিয়ামতপুর", nameEn: "Niamatpur", postCode: "৬৫৭০" },
        ],
      },
      natore: {
        nameBn: "নাটোর",
        nameEn: "Natore",
        upazilas: [
          { nameBn: "নাটোর সদর", nameEn: "Natore Sadar", postCode: "৬৪০০" },
          { nameBn: "সিংড়া", nameEn: "Singra", postCode: "৬৪৩০" },
          { nameBn: "বড়াইগ্রাম", nameEn: "Baraigram", postCode: "৬৪২০" },
          { nameBn: "গুরুদাসপুর", nameEn: "Gurudaspur", postCode: "৬৪১০" },
          { nameBn: "লালপুর", nameEn: "Lalpur", postCode: "৬৪৪০" },
          { nameBn: "বাগাতিপাড়া", nameEn: "Bagatipara", postCode: "৬৪৫০" },
          { nameBn: "নলডাঙ্গা", nameEn: "Naldanga", postCode: "৬৪০১" },
        ],
      },
      chapainawabganj: {
        nameBn: "চাঁপাইনবাবগঞ্জ",
        nameEn: "Chapai Nawabganj",
        upazilas: [
          { nameBn: "চাঁপাইনবাবগঞ্জ সদর", nameEn: "Chapai Nawabganj Sadar", postCode: "৬৩০০" },
          { nameBn: "শিবগঞ্জ", nameEn: "Shibganj", postCode: "৬৩১০" },
          { nameBn: "গোমস্তাপুর", nameEn: "Gomastapur", postCode: "৬৩২০" },
          { nameBn: "নাচোল", nameEn: "Nachol", postCode: "৬৩৩০" },
          { nameBn: "ভোলাহাট", nameEn: "Bholahat", postCode: "৬৩৪০" },
        ],
      },
      joypurhat: {
        nameBn: "জয়পুরহাট",
        nameEn: "Joypurhat",
        upazilas: [
          { nameBn: "জয়পুরহাট সদর", nameEn: "Joypurhat Sadar", postCode: "৫৯০০" },
          { nameBn: "পাঁচবিবি", nameEn: "Panchbibi", postCode: "৫৯১০" },
          { nameBn: "কালাই", nameEn: "Kalai", postCode: "৫৯২০" },
          { nameBn: "ক্ষেতলাল", nameEn: "Khetlal", postCode: "৫৯৩০" },
          { nameBn: "আক্কেলপুর", nameEn: "Akkelpur", postCode: "৫৯৪০" },
        ],
      },
    },
  },
  khulna: {
    nameBn: "খুলনা",
    nameEn: "Khulna",
    districts: {
      khulna_dist: {
        nameBn: "খুলনা",
        nameEn: "Khulna",
        upazilas: [
          { nameBn: "খুলনা সদর", nameEn: "Khulna Sadar", postCode: "৯০০০" },
          { nameBn: "ডুমুরিয়া", nameEn: "Dumuria", postCode: "৯২৫০" },
          { nameBn: "ফুলতলা", nameEn: "Phultala", postCode: "৯২১০" },
          { nameBn: "দিঘলিয়া", nameEn: "Dighalia", postCode: "৯২২০" },
          { nameBn: "তেরখাদা", nameEn: "Terokhada", postCode: "৯২৩০" },
          { nameBn: "রূপসা", nameEn: "Rupsha", postCode: "৯২৪০" },
          { nameBn: "বটিয়াঘাটা", nameEn: "Batiaghata", postCode: "৯২৬০" },
          { nameBn: "দাকোপ", nameEn: "Dacope", postCode: "৯২৭০" },
          { nameBn: "পাইকগাছা", nameEn: "Paikgachha", postCode: "৯২৮০" },
          { nameBn: "কয়রা", nameEn: "Koyra", postCode: "৯২৯০" },
        ],
      },
      jashore: {
        nameBn: "যশোর",
        nameEn: "Jashore",
        upazilas: [
          { nameBn: "যশোর সদর", nameEn: "Jashore Sadar", postCode: "৭৪০০" },
          { nameBn: "ঝিকরগাছা", nameEn: "Jhikargachha", postCode: "৭৪২০" },
          { nameBn: "শার্শা", nameEn: "Sharsha", postCode: "৭৪৩১" },
          { nameBn: "মনিরামপুর", nameEn: "Manirampur", postCode: "৭৪৪০" },
          { nameBn: "কেশবপুর", nameEn: "Keshabpur", postCode: "৭৪৫০" },
          { nameBn: "অভয়নগর", nameEn: "Abhaynagar", postCode: "৭৪৬০" },
          { nameBn: "বাঘারপাড়া", nameEn: "Bagherpara", postCode: "৭৪৭০" },
          { nameBn: "চৌগাছা", nameEn: "Chowgacha", postCode: "৭৪১০" },
        ],
      },
      satkhira: {
        nameBn: "সাতক্ষীরা",
        nameEn: "Satkhira",
        upazilas: [
          { nameBn: "সাতক্ষীরা সদর", nameEn: "Satkhira Sadar", postCode: "৯৪০০" },
          { nameBn: "কলারোয়া", nameEn: "Kalaroa", postCode: "৯৪১০" },
          { nameBn: "তালা", nameEn: "Tala", postCode: "৯৪২০" },
          { nameBn: "দেবহাটা", nameEn: "Debhata", postCode: "৯৪৩০" },
          { nameBn: "কালীগঞ্জ", nameEn: "Kaliganj", postCode: "৯৪৪০" },
          { nameBn: "আশাশুনি", nameEn: "Assasuni", postCode: "৯৪৫০" },
          { nameBn: "শ্যামনগর", nameEn: "Shyamnagar", postCode: "৯৪৬০" },
        ],
      },
      kushtia: {
        nameBn: "কুষ্টিয়া",
        nameEn: "Kushtia",
        upazilas: [
          { nameBn: "কুষ্টিয়া সদর", nameEn: "Kushtia Sadar", postCode: "৭০০০" },
          { nameBn: "কুমারখালী", nameEn: "Kumarkhali", postCode: "৭০১০" },
          { nameBn: "খোকসা", nameEn: "Khoksa", postCode: "৭০২০" },
          { nameBn: "মিরপুর", nameEn: "Mirpur", postCode: "৭০৩০" },
          { nameBn: "ভেড়ামারা", nameEn: "Bheramara", postCode: "৭০৪০" },
          { nameBn: "দৌলতপুর", nameEn: "Daulatpur", postCode: "৭০৫০" },
        ],
      },
      bagerhat: {
        nameBn: "বাগেরহাট",
        nameEn: "Bagerhat",
        upazilas: [
          { nameBn: "বাগেরহাট সদর", nameEn: "Bagerhat Sadar", postCode: "৯৩০০" },
          { nameBn: "ফকিরহাট", nameEn: "Fakirhat", postCode: "৯৩১০" },
          { nameBn: "মোল্লাহাট", nameEn: "Mollahat", postCode: "৯৩২০" },
          { nameBn: "কচুয়া", nameEn: "Kachua", postCode: "৯৩৩০" },
          { nameBn: "মোড়েলগঞ্জ", nameEn: "Morrelganj", postCode: "৯৩৪০" },
          { nameBn: "মোংলা", nameEn: "Mongla", postCode: "৯৩৫০" },
          { nameBn: "রামপাল", nameEn: "Rampal", postCode: "৯৩৬০" },
          { nameBn: "চিতলমারী", nameEn: "Chitalmari", postCode: "৯৩৭০" },
          { nameBn: "শরণখোলা", nameEn: "Sarankhola", postCode: "৯৩৮০" },
        ],
      },
      jhenaidah: {
        nameBn: "ঝিনাইদহ",
        nameEn: "Jhenaidah",
        upazilas: [
          { nameBn: "ঝিনাইদহ সদর", nameEn: "Jhenaidah Sadar", postCode: "৭৩০০" },
          { nameBn: "শৈলকুপা", nameEn: "Shailkupa", postCode: "৭৩১০" },
          { nameBn: "হরিণাকুণ্ডু", nameEn: "Harinakundu", postCode: "৭৩২০" },
          { nameBn: "কালীগঞ্জ", nameEn: "Kaliganj", postCode: "৭৩৩০" },
          { nameBn: "কোটচাঁদপুর", nameEn: "Kotchandpur", postCode: "৭৩৪০" },
          { nameBn: "মহেশপুর", nameEn: "Maheshpur", postCode: "৭৩৫০" },
        ],
      },
      chuadanga: {
        nameBn: "চুয়াডাঙ্গা",
        nameEn: "Chuadanga",
        upazilas: [
          { nameBn: "চুয়াডাঙ্গা সদর", nameEn: "Chuadanga Sadar", postCode: "৭২০০" },
          { nameBn: "আলমডাঙ্গা", nameEn: "Alamdanga", postCode: "৭২১০" },
          { nameBn: "দামুড়হুদা", nameEn: "Damurhuda", postCode: "৭২২০" },
          { nameBn: "জীবননগর", nameEn: "Jibannagar", postCode: "৭২৩০" },
        ],
      },
      magura: {
        nameBn: "মাগুরা",
        nameEn: "Magura",
        upazilas: [
          { nameBn: "মাগুরা সদর", nameEn: "Magura Sadar", postCode: "৭৬০০" },
          { nameBn: "শ্রীপুর", nameEn: "Sreepur", postCode: "৭৬১০" },
          { nameBn: "শালিখা", nameEn: "Shalikha", postCode: "৭৬২০" },
          { nameBn: "মহম্মদপুর", nameEn: "Mohammadpur", postCode: "৭৬৩০" },
        ],
      },
      meherpur: {
        nameBn: "মেহেরপুর",
        nameEn: "Meherpur",
        upazilas: [
          { nameBn: "মেহেরপুর সদর", nameEn: "Meherpur Sadar", postCode: "৭১০০" },
          { nameBn: "গাংনী", nameEn: "Gangni", postCode: "৭১১০" },
          { nameBn: "মুজিবনগর", nameEn: "Mujibnagar", postCode: "৭১২০" },
        ],
      },
      narail: {
        nameBn: "নড়াইল",
        nameEn: "Narail",
        upazilas: [
          { nameBn: "নড়াইল সদর", nameEn: "Narail Sadar", postCode: "৭৫০০" },
          { nameBn: "লোহাগড়া", nameEn: "Lohagara", postCode: "৭৫১০" },
          { nameBn: "কালিয়া", nameEn: "Kalia", postCode: "৭৫২০" },
        ],
      },
    },
  },
  barishal: {
    nameBn: "বরিশাল",
    nameEn: "Barishal",
    districts: {
      barishal_dist: {
        nameBn: "বরিশাল",
        nameEn: "Barishal",
        upazilas: [
          { nameBn: "বরিশাল সদর", nameEn: "Barishal Sadar", postCode: "৮২০০" },
          { nameBn: "বাকেরগঞ্জ", nameEn: "Bakerganj", postCode: "৮২১০" },
          { nameBn: "বাবুগঞ্জ", nameEn: "Babuganj", postCode: "৮২২০" },
          { nameBn: "উজিরপুর", nameEn: "Wazirpur", postCode: "৮২৩০" },
          { nameBn: "গৌরনদী", nameEn: "Gournadi", postCode: "৮২৪০" },
          { nameBn: "আগৈলঝাড়া", nameEn: "Agailjhara", postCode: "৮২৫০" },
          { nameBn: "বানারীপাড়া", nameEn: "Banaripara", postCode: "৮২৬০" },
          { nameBn: "মুলাদী", nameEn: "Muladi", postCode: "৮২৭০" },
          { nameBn: "হিজলা", nameEn: "Hizla", postCode: "৮২৮০" },
          { nameBn: "মেহেন্দিগঞ্জ", nameEn: "Mehendiganj", postCode: "৮২৯০" },
        ],
      },
      patuakhali: {
        nameBn: "পটুয়াখালী",
        nameEn: "Patuakhali",
        upazilas: [
          { nameBn: "পটুয়াখালী সদর", nameEn: "Patuakhali Sadar", postCode: "৮৬০০" },
          { nameBn: "বাউফল", nameEn: "Bauphal", postCode: "৮৬১০" },
          { nameBn: "গলাচিপা", nameEn: "Galachipa", postCode: "৮৬২০" },
          { nameBn: "দশমিনা", nameEn: "Dashmina", postCode: "৮৬৩০" },
          { nameBn: "কলাপাড়া", nameEn: "Kalapara", postCode: "৮৬৪০" },
          { nameBn: "মির্জাগঞ্জ", nameEn: "Mirzaganj", postCode: "৮৬৫০" },
          { nameBn: "দুমকি", nameEn: "Dumki", postCode: "৮৬৬০" },
          { nameBn: "রাঙ্গাবালী", nameEn: "Rangabali", postCode: "৮৬৭০" },
        ],
      },
      bhola: {
        nameBn: "ভোলা",
        nameEn: "Bhola",
        upazilas: [
          { nameBn: "ভোলা সদর", nameEn: "Bhola Sadar", postCode: "৮৩০০" },
          { nameBn: "দৌলতখান", nameEn: "Daulatkhan", postCode: "৮৩১০" },
          { nameBn: "বোরহানউদ্দিন", nameEn: "Borhanuddin", postCode: "৮৩২০" },
          { nameBn: "তজুমদ্দিন", nameEn: "Tazumuddin", postCode: "৮৩৩০" },
          { nameBn: "লালমোহন", nameEn: "Lalmohan", postCode: "৮৩৪০" },
          { nameBn: "চরফ্যাশন", nameEn: "Char Fasson", postCode: "৮৩৫০" },
          { nameBn: "মনপুরা", nameEn: "Monpura", postCode: "৮৩৬০" },
        ],
      },
      pirojpur: {
        nameBn: "পিরোজপুর",
        nameEn: "Pirojpur",
        upazilas: [
          { nameBn: "পিরোজপুর সদর", nameEn: "Pirojpur Sadar", postCode: "৮৫০০" },
          { nameBn: "ভাণ্ডারিয়া", nameEn: "Bhandaria", postCode: "৮৫১০" },
          { nameBn: "মঠবাড়িয়া", nameEn: "Mathbaria", postCode: "৮৫২০" },
          { nameBn: "নাজিরপুর", nameEn: "Nazirpur", postCode: "৮৫৩০" },
          { nameBn: "স্বরূপকাঠি (নেছারাবাদ)", nameEn: "Nesarabad", postCode: "৮৫৪০" },
          { nameBn: "কাউখালী", nameEn: "Kawkhali", postCode: "৮৫৫০" },
          { nameBn: "ইন্দুরকানী", nameEn: "Indurkani", postCode: "৮৫৬০" },
        ],
      },
      barguna: {
        nameBn: "বরগুনা",
        nameEn: "Barguna",
        upazilas: [
          { nameBn: "বরগুনা সদর", nameEn: "Barguna Sadar", postCode: "৮৭০০" },
          { nameBn: "আমতলী", nameEn: "Amtali", postCode: "৮৭১০" },
          { nameBn: "পাথরঘাটা", nameEn: "Patharghata", postCode: "৮৭২০" },
          { nameBn: "বেতাগী", nameEn: "Betagi", postCode: "৮৭৩০" },
          { nameBn: "বামনা", nameEn: "Bamna", postCode: "৮৭৪০" },
          { nameBn: "তালতলী", nameEn: "Taltali", postCode: "৮৭৫০" },
        ],
      },
      jhalokati: {
        nameBn: "ঝালকাঠি",
        nameEn: "Jhalokati",
        upazilas: [
          { nameBn: "ঝালকাঠি সদর", nameEn: "Jhalokati Sadar", postCode: "৮৪০০" },
          { nameBn: "নলছিটি", nameEn: "Nalchity", postCode: "৮৪১০" },
          { nameBn: "রাজাপুর", nameEn: "Rajapur", postCode: "৮৪২০" },
          { nameBn: "কাঁঠালিয়া", nameEn: "Kathalia", postCode: "৮৪৩০" },
        ],
      },
    },
  },
  rangpur: {
    nameBn: "রংপুর",
    nameEn: "Rangpur",
    districts: {
      rangpur_dist: {
        nameBn: "রংপুর",
        nameEn: "Rangpur",
        upazilas: [
          { nameBn: "রংপুর সদর", nameEn: "Rangpur Sadar", postCode: "৫৪০০" },
          { nameBn: "গঙ্গাচড়া", nameEn: "Gangachhara", postCode: "৫৪১০" },
          { nameBn: "বদরগঞ্জ", nameEn: "Badarganj", postCode: "৫৪২০" },
          { nameBn: "মিঠাপুকুর", nameEn: "Mithapukur", postCode: "৫৪৩০" },
          { nameBn: "পীরগাছা", nameEn: "Pirgachha", postCode: "৫৪৪০" },
          { nameBn: "পীরগঞ্জ", nameEn: "Pirganj", postCode: "৫৪৫০" },
          { nameBn: "কাউনিয়া", nameEn: "Kaunia", postCode: "৫৪৬০" },
          { nameBn: "তারাগঞ্জ", nameEn: "Taraganj", postCode: "৫৪৭০" },
        ],
      },
      dinajpur: {
        nameBn: "দিনাজপুর",
        nameEn: "Dinajpur",
        upazilas: [
          { nameBn: "দিনাজপুর সদর", nameEn: "Dinajpur Sadar", postCode: "৫২০০" },
          { nameBn: "বীরগঞ্জ", nameEn: "Birganj", postCode: "৫২১০" },
          { nameBn: "কাহারোল", nameEn: "Kaharole", postCode: "৫২২০" },
          { nameBn: "বোচাগঞ্জ", nameEn: "Bochaganj", postCode: "৫২৩০" },
          { nameBn: "চিরিরবন্দর", nameEn: "Chirirbandar", postCode: "৫২৪০" },
          { nameBn: "ফুলবাড়ী", nameEn: "Fulbari", postCode: "৫২৫০" },
          { nameBn: "পার্বতীপুর", nameEn: "Parbatipur", postCode: "৫২৬০" },
          { nameBn: "বিরামপুর", nameEn: "Birampur", postCode: "৫২৭০" },
          { nameBn: "নবাবগঞ্জ", nameEn: "Nawabganj", postCode: "৫২৮০" },
          { nameBn: "ঘোড়াঘাট", nameEn: "Ghoraghat", postCode: "৫২৯০" },
          { nameBn: "হাকিমপুর", nameEn: "Hakimpur", postCode: "৫২৯১" },
          { nameBn: "খানসামা", nameEn: "Khansama", postCode: "৫২৯২" },
          { nameBn: "বিরল", nameEn: "Birol", postCode: "৫২৯৩" },
        ],
      },
      kurigram: {
        nameBn: "কুড়িগ্রাম",
        nameEn: "Kurigram",
        upazilas: [
          { nameBn: "কুড়িগ্রাম সদর", nameEn: "Kurigram Sadar", postCode: "৫৬০০" },
          { nameBn: "নাগেশ্বরী", nameEn: "Nageshwari", postCode: "৫৬১০" },
          { nameBn: "ভুরুঙ্গামারী", nameEn: "Bhurungamari", postCode: "৫৬২০" },
          { nameBn: "ফুলবাড়ী", nameEn: "Fulbari", postCode: "৫৬৩০" },
          { nameBn: "রাজারহাট", nameEn: "Rajarhat", postCode: "৫৬৪০" },
          { nameBn: "উলিপুর", nameEn: "Ulipur", postCode: "৫৬৫০" },
          { nameBn: "চিলমারী", nameEn: "Chilmari", postCode: "৫৬৬০" },
          { nameBn: "রৌমারী", nameEn: "Roumari", postCode: "৫৬৭০" },
          { nameBn: "রাজিবপুর", nameEn: "Rajibpur", postCode: "৫৬৮০" },
        ],
      },
      gaibandha: {
        nameBn: "গাইবান্ধা",
        nameEn: "Gaibandha",
        upazilas: [
          { nameBn: "গাইবান্ধা সদর", nameEn: "Gaibandha Sadar", postCode: "৫৭০০" },
          { nameBn: "গোবিন্দগঞ্জ", nameEn: "Gobindaganj", postCode: "৫৭১০" },
          { nameBn: "পলাশবাড়ী", nameEn: "Palashbari", postCode: "৫৭২০" },
          { nameBn: "সাদুল্যাপুর", nameEn: "Sadullapur", postCode: "৫৭৩০" },
          { nameBn: "সুন্দরগঞ্জ", nameEn: "Sundarganj", postCode: "৫৭৪০" },
          { nameBn: "সাঘাটা", nameEn: "Saghata", postCode: "৫৭৫০" },
          { nameBn: "ফুলছড়ি", nameEn: "Fulchhari", postCode: "৫৭৬০" },
        ],
      },
      nilphamari: {
        nameBn: "নীলফামারী",
        nameEn: "Nilphamari",
        upazilas: [
          { nameBn: "নীলফামারী সদর", nameEn: "Nilphamari Sadar", postCode: "৫৩০০" },
          { nameBn: "সৈয়দপুর", nameEn: "Saidpur", postCode: "৫৩১০" },
          { nameBn: "ডোমার", nameEn: "Domar", postCode: "৫৩২০" },
          { nameBn: "ডিমলা", nameEn: "Dimla", postCode: "৫৩৩০" },
          { nameBn: "জলঢাকা", nameEn: "Jaldhaka", postCode: "৫৩৪০" },
          { nameBn: "কিশোরগঞ্জ", nameEn: "Kishoreganj", postCode: "৫৩৫০" },
        ],
      },
      panchagarh: {
        nameBn: "পঞ্চগড়",
        nameEn: "Panchagarh",
        upazilas: [
          { nameBn: "পঞ্চগড় সদর", nameEn: "Panchagarh Sadar", postCode: "৫০১০" },
          { nameBn: "তেঁতুলিয়া", nameEn: "Tetulia", postCode: "৫০২০" },
          { nameBn: "বোদা", nameEn: "Boda", postCode: "৫০৩০" },
          { nameBn: "আটোয়ারী", nameEn: "Atwari", postCode: "৫০৪০" },
          { nameBn: "দেবীগঞ্জ", nameEn: "Debiganj", postCode: "৫০৫০" },
        ],
      },
      thakurgaon: {
        nameBn: "ঠাকুরগাঁও",
        nameEn: "Thakurgaon",
        upazilas: [
          { nameBn: "ঠাকুরগাঁও সদর", nameEn: "Thakurgaon Sadar", postCode: "৫১০০" },
          { nameBn: "পীরগঞ্জ", nameEn: "Pirganj", postCode: "৫১১০" },
          { nameBn: "রানীশংকৈল", nameEn: "Ranisankail", postCode: "৫১২০" },
          { nameBn: "বালিয়াডাঙ্গী", nameEn: "Baliadangi", postCode: "৫১৩০" },
          { nameBn: "হরিপুর", nameEn: "Haripur", postCode: "৫১৪০" },
        ],
      },
      lalmonirhat: {
        nameBn: "লালমনিরহাট",
        nameEn: "Lalmonirhat",
        upazilas: [
          { nameBn: "লালমনিরহাট সদর", nameEn: "Lalmonirhat Sadar", postCode: "৫৫০০" },
          { nameBn: "আদিতমারী", nameEn: "Aditmari", postCode: "৫৫১০" },
          { nameBn: "কালীগঞ্জ", nameEn: "Kaliganj", postCode: "৫৫২০" },
          { nameBn: "হাতীবান্ধা", nameEn: "Hatibandha", postCode: "৫৫৩০" },
          { nameBn: "পাটগ্রাম", nameEn: "Patgram", postCode: "৫৫৪০" },
        ],
      },
    },
  },
  mymensingh: {
    nameBn: "ময়মনসিংহ",
    nameEn: "Mymensingh",
    districts: {
      mymensingh_dist: {
        nameBn: "ময়মনসিংহ",
        nameEn: "Mymensingh",
        upazilas: [
          { nameBn: "ময়মনসিংহ সদর", nameEn: "Mymensingh Sadar", postCode: "২২০০" },
          { nameBn: "মুক্তাগাছা", nameEn: "Muktagachha", postCode: "২২৬০" },
          { nameBn: "ফুলবাড়ীয়া", nameEn: "Fulbaria", postCode: "২২৮০" },
          { nameBn: "ত্রিশাল", nameEn: "Trishal", postCode: "২২২০" },
          { nameBn: "ভালুকা", nameEn: "Bhaluka", postCode: "২২৪০" },
          { nameBn: "গফরগাঁও", nameEn: "Gafargaon", postCode: "২২৩০" },
          { nameBn: "নান্দাইল", nameEn: "Nandail", postCode: "২২৯০" },
          { nameBn: "ঈশ্বরগঞ্জ", nameEn: "Ishwarganj", postCode: "২২৭০" },
          { nameBn: "গৌরীপুর", nameEn: "Gouripur", postCode: "২২১০" },
          { nameBn: "ফুলপুর", nameEn: "Phulpur", postCode: "২২৫০" },
          { nameBn: "হালুয়াঘাট", nameEn: "Haluaghat", postCode: "২২৬২" },
          { nameBn: "ধোবাউড়া", nameEn: "Dhobaura", postCode: "২২৬১" },
          { nameBn: "তারাকান্দা", nameEn: "Tarakanda", postCode: "২২৫১" },
        ],
      },
      jamalpur: {
        nameBn: "জামালপুর",
        nameEn: "Jamalpur",
        upazilas: [
          { nameBn: "জামালপুর সদর", nameEn: "Jamalpur Sadar", postCode: "২০০০" },
          { nameBn: "মেলান্দহ", nameEn: "Melandaha", postCode: "২০১২" },
          { nameBn: "ইসলামপুর", nameEn: "Islampur", postCode: "২০১৫" },
          { nameBn: "দেওয়ানগঞ্জ", nameEn: "Dewanganj", postCode: "২০২০" },
          { nameBn: "বকশীগঞ্জ", nameEn: "Bakshiganj", postCode: "২০৩০" },
          { nameBn: "মাদারগঞ্জ", nameEn: "Madarganj", postCode: "২০৪০" },
          { nameBn: "সরিষাবাড়ী", nameEn: "Sarishabari", postCode: "২০৫০" },
        ],
      },
      netrokona: {
        nameBn: "নেত্রকোণা",
        nameEn: "Netrokona",
        upazilas: [
          { nameBn: "নেত্রকোণা সদর", nameEn: "Netrokona Sadar", postCode: "২৪০০" },
          { nameBn: "কেন্দুয়া", nameEn: "Kendua", postCode: "২৪১০" },
          { nameBn: "মদন", nameEn: "Madan", postCode: "২৪২০" },
          { nameBn: "মোহনগঞ্জ", nameEn: "Mohanganj", postCode: "২৪৩০" },
          { nameBn: "বারহাট্টা", nameEn: "Barhatta", postCode: "২৪৪০" },
          { nameBn: "কলমাকান্দা", nameEn: "Kalmakanda", postCode: "২৪৫০" },
          { nameBn: "দুর্গাপুর", nameEn: "Durgapur", postCode: "২৪৬০" },
          { nameBn: "পূর্বধলা", nameEn: "Purbadhala", postCode: "২৪৭০" },
          { nameBn: "খালিয়াজুড়ি", nameEn: "Khaliajuri", postCode: "২৪৮০" },
          { nameBn: "আটপাড়া", nameEn: "Atpara", postCode: "২৪৯০" },
        ],
      },
      sherpur: {
        nameBn: "শেরপুর",
        nameEn: "Sherpur",
        upazilas: [
          { nameBn: "শেরপুর সদর", nameEn: "Sherpur Sadar", postCode: "২১০০" },
          { nameBn: "নকলা", nameEn: "Nakla", postCode: "২১১০" },
          { nameBn: "নালিতাবাড়ী", nameEn: "Nalitabari", postCode: "২১২০" },
          { nameBn: "শ্রীবরদী", nameEn: "Sreebardi", postCode: "২১৩০" },
          { nameBn: "ঝিনাইগাতী", nameEn: "Jhenaigati", postCode: "২১৪০" },
        ],
      },
    },
  },
};

/**
 * LOCAL VILLAGES / MAHALLES PRESETS (DAUDKANDI & ELIOTGANJ SURROUNDING REGION)
 * Immediate one-click presets for students in the Madrasha catchment zone
 */
export const LOCAL_ELIOTGANJ_VILLAGES: string[] = [
  "পূর্ব লক্ষ্মীপুর (মাদরাসা সংলগ্ন)",
  "পশ্চিম লক্ষ্মীপুর",
  "ইলিয়টগঞ্জ বাজার",
  "ইলিয়টগঞ্জ উত্তর",
  "ইলিয়টগঞ্জ দক্ষিণ",
  "রায়পুর",
  "পদুয়া",
  "দৌলতপুর",
  "নোয়াগাঁও",
  "বাশরা",
  "হাসানপুর",
  "বারপাড়া",
  "গোয়ালমারী",
  "মারুকা",
  "পাঁচগাছিয়া",
  "মোহাম্মদপুর",
  "বিটেশ্বর",
  "জিংলাতলী",
  "সাতপাড়া",
  "সুন্দলপুর",
  "দশপাড়া",
  "পিপুড়িয়া",
  "মালাখালা",
  "বলদাখাল",
  "পেন্নাই",
  "গৌরীপুর",
  "চারিপাড়া",
  "বানপাড়া",
  "কান্দারগাঁও",
  "খোশকান্দি",
  "সালাকান্দি",
  "তুলাতলী",
  "তুলাগাঁও",
  "মালিগাঁও",
  "গোপালপুর",
  "আলীনগর",
  "হাসানাবাদ",
  "উজানী",
  "বড়কান্দা",
  "নলচড়া",
];

export const LOCAL_VILLAGES_ELIOTGANJ = LOCAL_ELIOTGANJ_VILLAGES;

export interface StructuredAddress {
  division: string;
  district: string;
  upazila: string;
  postOffice: string;
  postCode: string;
  village: string;
  holdingRoad?: string;
}

/**
 * Formats a structured address object into official Bangladesh postal format
 */
export function formatFullAddress(addr: Partial<StructuredAddress>): string {
  const parts: string[] = [];
  
  if (addr.village && addr.village.trim()) {
    parts.push(`গ্রাম/মহল্লা: ${addr.village.trim()}`);
  }
  if (addr.holdingRoad && addr.holdingRoad.trim()) {
    parts.push(`বাড়ি/সড়ক: ${addr.holdingRoad.trim()}`);
  }
  if (addr.postOffice && addr.postOffice.trim()) {
    const pc = addr.postCode && addr.postCode.trim() ? `-${addr.postCode.trim()}` : "";
    parts.push(`ডাকঘর: ${addr.postOffice.trim()}${pc}`);
  }
  if (addr.upazila && addr.upazila.trim()) {
    parts.push(`উপজেলা: ${addr.upazila.trim()}`);
  }
  if (addr.district && addr.district.trim()) {
    parts.push(`জেলা: ${addr.district.trim()}`);
  }
  if (addr.division && addr.division.trim()) {
    parts.push(`বিভাগ: ${addr.division.trim()}`);
  }

  return parts.join(", ");
}
