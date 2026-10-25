// backend/src/modules/admission/admission.schema.ts

import { z } from 'zod';

export const submitAdmissionSchema = z.object({
  applicantName: z.string().min(2, { message: 'আবেদনকারীর নাম কমপক্ষে ২ অক্ষরের হতে হবে' }),
  applicantNameEn: z.string().optional(),
  fatherName: z.string().optional(),
  fatherNameEn: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherNameEn: z.string().optional(),
  motherPhone: z.string().optional(),
  phone: z.string().min(11, { message: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' }),
  emergencyPhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).default('MALE'),
  studentType: z.enum(['RESIDENTIAL', 'NON_RESIDENTIAL', 'DAY_CARE']).default('RESIDENTIAL').optional(),
  address: z.string().optional(),
  permanentAddress: z.string().optional(),
  brn: z.string().optional(),
  religion: z.string().optional(),
  bloodGroup: z.string().optional(),
  guardianNid: z.string().optional(),
  previousInstitution: z.string().optional(),
  lastClassResult: z.string().optional(),
  quota: z.string().optional(),
  village: z.string().optional(),
  postOffice: z.string().optional(),
  upazila: z.string().optional(),
  district: z.string().optional(),
  classId: z.string().uuid({ error: 'সঠিক শ্রেণী নির্বাচন করুন' }),
  photoUrl: z.string().optional(),
  birthCertUrl: z.string().optional(),
  guardianNidUrl: z.string().optional(),
  testimonialUrl: z.string().optional(),
  paymentMethod: z.string().optional(),
  trxId: z.string().optional(),
  paymentSenderPhone: z.string().optional(),
});

export const rejectAdmissionSchema = z.object({
  reason: z.string().min(3, { message: 'বাতিলকরণের কারণ লিখুন' }),
});

export type SubmitAdmissionInput = z.infer<typeof submitAdmissionSchema>;
export type RejectAdmissionInput = z.infer<typeof rejectAdmissionSchema>;
