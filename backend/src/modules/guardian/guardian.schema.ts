import { z } from "zod";

export const createGuardianSchema = z.object({
  name: z.string().min(2, "অভিভাবকের নাম আবশ্যক"),
  phone: z.string().min(11, "সঠিক মোবাইল নম্বর (১১ ডিজিট) দিন"),
  relation: z.string().min(2, "সম্পর্ক উল্লেখ করুন (যেমন: পিতা/মাতা/ভাই)"),
  address: z.string().optional(),
});

export const updateGuardianSchema = createGuardianSchema.partial();

export const linkWardSchema = z.object({
  studentId: z.string().min(1, "শিক্ষার্থীর ID আবশ্যক"),
});

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;
export type LinkWardInput = z.infer<typeof linkWardSchema>;
