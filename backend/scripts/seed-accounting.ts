import prisma from '../src/config/prisma';

async function seedChartOfAccounts() {
  console.log('🌱 Seeding Chart of Accounts (COA)...');

  const accounts = [
    // Assets (1000)
    { code: '1010', name: 'ক্যাশ অ্যাকাউন্ট (Cash in Hand)', type: 'ASSET', isSystem: true, description: 'মাদ্রাসার নগদ ক্যাশ অ্যাকাউন্ট' },
    { code: '1020', name: 'ব্যাংক অ্যাকাউন্ট (Main Bank Account)', type: 'ASSET', isSystem: true, description: 'মূল ব্যাংক অ্যাকাউন্ট' },
    { code: '1030', name: 'বিকাশ মার্চেন্ট (bKash Account)', type: 'ASSET', isSystem: true, description: 'বিকাশ মার্চেন্ট পেমেন্ট' },
    { code: '1040', name: 'নগদ মার্চেন্ট (Nagad Account)', type: 'ASSET', isSystem: true, description: 'নগদ মার্চেন্ট পেমেন্ট' },
    { code: '1050', name: 'স্টাফ এডভান্স রিসিভেবল (Staff Advance Receivable)', type: 'ASSET', isSystem: true, description: 'শিক্ষক ও কর্মীদের প্রদত্ত অগ্রিম টাকা' },
    { code: '1060', name: 'স্থায়ী সম্পদ ও আসবাবপত্র (Fixed Assets)', type: 'ASSET', isSystem: true, description: 'কম্পিউটার, আসবাবপত্র, ফ্যান, জেনারেটর, ভবন' },

    // Liabilities (2000)
    { code: '2010', name: 'ভেন্ডর পেয়েবল (Vendor Payables)', type: 'LIABILITY', isSystem: true, description: 'বাজার ও সাপ্লায়ারদের বকেয়া' },
    { code: '2020', name: 'স্যালারি পেয়েবল (Salary Payables)', type: 'LIABILITY', isSystem: true, description: 'শিক্ষক ও কর্মীদের বকেয়া বেতন' },

    // Income (3000)
    { code: '3010', name: 'ছাত্র ফি আয় (Student Fee Income)', type: 'INCOME', isSystem: true, description: 'টিউশন ও মাসিক ফি' },
    { code: '3020', name: 'ভর্তি ফি আয় (Admission Fee Income)', type: 'INCOME', isSystem: true, description: 'অনলাইন ও অফলাইন ভর্তি ফি' },
    { code: '3030', name: 'আবাসিক ও খাবার ফি (Hostel & Food Fee)', type: 'INCOME', isSystem: true, description: 'আবাসিক ছাত্র ফি' },
    { code: '3040', name: 'দান ও অনুদান (Donation Income)', type: 'INCOME', isSystem: true, description: 'সাধারণ ও বিশেষ দান' },
    { code: '3050', name: 'লাইব্রেরি জরিমানা আয় (Library Fine Income)', type: 'INCOME', isSystem: true, description: 'বই দেরিতে ফেরত বা হারানোর জরিমানা' },

    // Expenses (4000)
    { code: '4010', name: 'শিক্ষকদের বেতন (Teacher Salary Expense)', type: 'EXPENSE', isSystem: true, description: 'শিক্ষকদের মাসিক বেতন' },
    { code: '4020', name: 'স্টাফ বেতন (Staff Salary Expense)', type: 'EXPENSE', isSystem: true, description: 'কর্মচারীদের মাসিক বেতন' },
    { code: '4030', name: 'হোস্টেল খাবার ও বাজার খরচ (Food & Bazar Expense)', type: 'EXPENSE', isSystem: true, description: 'দৈনিক বাজার ও খাদ্য সামগ্রী' },
    { code: '4040', name: 'ইউটিলিটি খরচ (Electricity, Gas, Water)', type: 'EXPENSE', isSystem: true, description: 'বিদ্যুৎ, গ্যাস ও পানি বিল' },
    { code: '4050', name: 'রক্ষণাবেক্ষণ খরচ (Maintenance Expense)', type: 'EXPENSE', isSystem: true, description: 'বিল্ডিং ও ফ্যান/লাইটস মেরামত' },
    { code: '4060', name: 'স্টেশনারি ও খাতা (Stationery & Supplies)', type: 'EXPENSE', isSystem: true, description: 'অফিস ও পরীক্ষার খাতা/কলম' },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: { name: acc.name, description: acc.description },
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        isSystem: acc.isSystem,
        description: acc.description,
        balance: 0.00
      }
    });
  }

  console.log('✅ Chart of Accounts (COA) seeded successfully!');
}

seedChartOfAccounts()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
