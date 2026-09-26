export const USER_ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const RESIDENTIAL_STATUS = {
  RESIDENTIAL: "RESIDENTIAL",
  NON_RESIDENTIAL: "NON_RESIDENTIAL",
  DAY_CARE: "DAY_CARE",
} as const;

export const STUDENT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  TRANSFERRED: "TRANSFERRED",
  COMPLETED: "COMPLETED",
  WITHDRAWN: "WITHDRAWN",
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  LEAVE: "LEAVE",
} as const;

export const GRADES = {
  MUMTAZ: {
    bn: "মুমতাজ (Mumtaz)",
    en: "Excellent / A+",
    min: 80,
    max: 100,
  },
  JAYYID_JIDDAN: {
    bn: "জায়্যিদ জিদ্দান (Jayyid Jiddan)",
    en: "Very Good / A",
    min: 65,
    max: 79.99,
  },
  JAYYID: {
    bn: "জায়্যিদ (Jayyid)",
    en: "Good / B",
    min: 50,
    max: 64.99,
  },
  MAQBOOL: {
    bn: "মাকবুল (Maqbool)",
    en: "Pass / C",
    min: 33,
    max: 49.99,
  },
  RASIB: {
    bn: "রাসিব (Rasib)",
    en: "Fail / F",
    min: 0,
    max: 32.99,
  },
} as const;

export function calculateGrade(marks: number, fullMarks: number = 100) {
  const percentage = (marks / fullMarks) * 100;
  if (percentage >= 80) return GRADES.MUMTAZ;
  if (percentage >= 65) return GRADES.JAYYID_JIDDAN;
  if (percentage >= 50) return GRADES.JAYYID;
  if (percentage >= 33) return GRADES.MAQBOOL;
  return GRADES.RASIB;
}

export const INSTITUTION_INFO = {
  nameBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
  nameEn: "Eliotganj Hazi Rohmatollah Jamiria Madrasha",
  nameAr: "الجامعة الإسلامية رحمة الله إليوت غنج",
  code: "EHRJ",
  principal: "মাওলানা মহা. আবুল কালাম সরকার",
  established: "২০২১",
  establishedEn: "2021",
  addressBn: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ",
  addressEn: "East Lakshmipur, Eliotganj, Daudkandi, Comilla, Bangladesh",
  phones: ["01845-162664", "01826-416696", "01949-091911"],
  primaryPhone: "01845-162664",
  email: "ehrjmadrasha@gmail.com",
  adminEmail: "adminehrjmadrasha@gmail.com",
  facebook: "https://www.facebook.com/ehrjmadrasda",
  youtube: "https://www.youtube.com/@ehrjmadrasha",
  whatsappChannel: "https://whatsapp.com/channel/0029VbC30aF6buMF0LGPMp3F",
  logoUrl: "/images/logo.jpg",
  principalPhotoUrl: "/images/principal.jpg",
};
