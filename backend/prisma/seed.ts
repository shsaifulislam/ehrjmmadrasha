// backend/prisma/seed.ts
import prisma from '../src/config/prisma';

async function main() {
  console.log('🌱 Seeding Eliyetganj Madrasha initial data from repository baseline...');

  // 1. Seed Notices if empty
  const noticeCount = await prisma.notice.count();
  if (noticeCount === 0) {
    await prisma.notice.createMany({
      data: [
        {
          title: 'নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম চলছে',
          content: 'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসায় নতুন শিক্ষাবর্ষের নূরানী, হিফজ ও কিতাব বিভাগে ভর্তি কার্যক্রম চলছে। আগ্রহী অভিভাবকগণ দ্রুত যোগাযোগের জন্য অনুরোধ করা যাচ্ছে।',
          type: 'ADMISSION',
          isPublished: true,
        },
        {
          title: 'অর্ধবার্ষিক পরীক্ষার সময়সূচী ও দিকনির্দেশনা',
          content: 'আগামী ১৫ তারিখ থেকে অর্ধবার্ষিক পরীক্ষা শুরু হবে। সকল শিক্ষার্থীকে সিলেবাস অনুযায়ী নিয়মিত প্রস্তুতি নেওয়ার নির্দেশ দেয়া হলো।',
          type: 'EXAM',
          isPublished: true,
        },
        {
          title: 'মাসিক অভিভাবক সভা ও পরামর্শ কর্মসূচি',
          content: 'আগামী শুক্রবার বাদ জোহর মাদ্রাসা মিলনায়তনে মাসিক অভিভাবক সভা অনুষ্ঠিত হবে। উপস্থিত থাকার জন্য বিনীত অনুরোধ রইল।',
          type: 'GENERAL',
          isPublished: true,
        },
        {
          title: 'রমজান মাস উপলক্ষে মাদ্রাসা বন্ধের জরুরি বিজ্ঞপ্তি',
          content: '১ রমজান থেকে ৩০ রমজান পর্যন্ত ক্লাস কার্যক্রম স্থগিত থাকবে। ঈদের পর যথারীতি ক্লাস পুনরায় শুরু হবে।',
          type: 'URGENT',
          isPublished: true,
        },
      ],
    });
    console.log('✅ Notices seeded');
  }

  // 2. Seed Gallery if empty or add event photos
  const galleryCount = await prisma.gallery.count();
  if (galleryCount < 5) {
    await prisma.gallery.deleteMany(); // Reset to fresh rich list
    await prisma.gallery.createMany({
      data: [
        {
          title: 'মহান বিজয় দিবস উদ্যাপনে জাতীয় পতাকা হাতে শিক্ষার্থীবৃন্দ',
          imageUrl: '/images/event-victory-day.jpg',
          category: 'EVENT',
        },
        {
          title: 'বিজয় দিবস শোভাযাত্রায় সম্মানিত শিক্ষকমণ্ডলী ও ছাত্রবৃন্দ',
          imageUrl: '/images/event-teachers-group.jpg',
          category: 'EVENT',
        },
        {
          title: 'অধ্যক্ষ মহোদয়ের উপস্থিতি ও নসিহত প্রদান',
          imageUrl: '/images/principal.jpg',
          category: 'CAMPUS',
        },
        {
          title: 'হিফজ বিভাগের পাঠদান ও তিলাওয়াত',
          imageUrl: '/images/teacher.jpg',
          category: 'CLASSROOM',
        },
        {
          title: 'আমাদের কৃতী শিক্ষার্থীদের সম্মাননা',
          imageUrl: '/images/student-001.jpg',
          category: 'AWARD',
        },
      ],
    });
    console.log('✅ Gallery items seeded with real event photos');
  }

  // 3. Seed Downloads if empty
  const downloadCount = await prisma.download.count();
  if (downloadCount === 0) {
    await prisma.download.createMany({
      data: [
        {
          title: 'অনলাইন ভর্তি আবেদন ফরম',
          fileUrl: '/uploads/downloads/admission_form.pdf',
          category: 'ADMISSION',
        },
        {
          title: 'বার্ষিক পরীক্ষা সময়সূচী ও রুটিন',
          fileUrl: '/uploads/downloads/exam_schedule.pdf',
          category: 'ROUTINE',
        },
        {
          title: 'নূরানী ও কিতাব বিভাগ সিলেবাস',
          fileUrl: '/uploads/downloads/syllabus.pdf',
          category: 'SYLLABUS',
        },
      ],
    });
    console.log('✅ Download Center files seeded');
  }

  // 4. Seed Academic Departments & Classes if missing
  const deptsToSeed = [
    { name: 'নূরানী / মক্তব বিভাগ', type: 'NURANI' },
    { name: 'নাযেরা বিভাগ', type: 'NAZERA' },
    { name: 'হিফজ বিভাগ', type: 'HIFZ' },
    { name: 'কিতাব বিভাগ', type: 'KITAB' },
    { name: 'তাখাস্সুস / উচ্চতর বিভাগ', type: 'TAKHASSUS' },
  ];

  for (const d of deptsToSeed) {
    const existingDept = await prisma.department.findFirst({ where: { name: d.name } });
    if (!existingDept) {
      await prisma.department.create({ data: d });
    }
  }

  const academicClasses = [
    { name: 'শিশু শ্রেণী (Nursery)', numericValue: 0 },
    { name: '১ম শ্রেণী (Class 1)', numericValue: 1 },
    { name: '২য় শ্রেণী (Class 2)', numericValue: 2 },
    { name: '৩য় শ্রেণী (Class 3)', numericValue: 3 },
    { name: 'নাযেরা (Nazera)', numericValue: 4 },
    { name: 'হিফজ (Hifz)', numericValue: 5 },
    { name: 'মিযান (Mizan)', numericValue: 6 },
    { name: 'নাহবেমীর (Nahvemeer)', numericValue: 7 },
    { name: 'হেদায়েতুন্নাহু (Hidayatunnahu)', numericValue: 8 },
    { name: 'কাফিয়া (Kafiyah)', numericValue: 9 },
    { name: 'শরহে বেকায়া (Sharhe Beqayah)', numericValue: 10 },
    { name: 'জালালাইন (Jalalayn)', numericValue: 11 },
    { name: 'মেশকাত (Mishkat)', numericValue: 12 },
    { name: 'দাওরায়ে হাদীস (Dawra-e-Hadith)', numericValue: 13 },
    { name: 'ইফতা (Ifta)', numericValue: 14 },
    { name: 'তাখাস্সুস ফিল হাদীস (Takhassus Hadith)', numericValue: 15 },
    { name: 'তাখাস্সুস ফিল আদাব (Takhassus Adab)', numericValue: 16 },
  ];

  for (const cls of academicClasses) {
    const existing = await prisma.class.findFirst({ where: { name: cls.name } });
    if (!existing) {
      await prisma.class.create({ data: cls });
    }
  }
  console.log('✅ Academic Departments & 17 Classes verified and seeded');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
