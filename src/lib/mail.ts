import nodemailer from "nodemailer";

// Initialize Nodemailer transporter with institution Gmail App Password credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "ehrjmadrasha@gmail.com",
    pass: process.env.SMTP_PASS || "mepz imnw lfly lxvo",
  },
});

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using institutional Gmail SMTP
 */
export async function sendInstitutionalEmail({
  to,
  subject,
  html,
  text,
}: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!to || !to.includes("@")) {
      return { success: false, error: "Invalid recipient email" };
    }

    const info = await transporter.sendMail({
      from: `"ইলিয়টগঞ্জ হাজী রহমত উল্লাহ জামিয়া মাদ্রাসা" <${process.env.SMTP_USER || "ehrjmadrasha@gmail.com"}>`,
      to,
      subject,
      text: text || "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা নোটিফিকেশন",
      html,
    });

    console.log(`[SMTP Email Sent] To: ${to}, ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[SMTP Error] Failed to send email:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Admission Application Confirmation Email Template
 */
export async function sendAdmissionConfirmationEmail({
  to,
  studentName,
  applicationNumber,
  className,
  guardianPhone,
}: {
  to: string;
  studentName: string;
  applicationNumber: string;
  className: string;
  guardianPhone: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0D5C3A; color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #fef08a;">Eliotganj Hazi Rohmatollah Jamiria Madrasha</p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #a7f3d0;">প্রতিষ্ঠাতা ও অধ্যক্ষ: মাওলানা মহা. আবুল কালাম সরকার | স্থাপিত: ২০২১ইং</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 16px; font-weight: bold; color: #0D5C3A; margin-top: 0;">মুহতারাম অভিভাবক, আসসালামু আলাইকুম।</p>
        <p>আপনার সন্তানের নতুন শিক্ষাবর্ষের প্রাথমিক ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে। মাদরাসা কর্তৃপক্ষ আবেদনটি যাচাইপূর্বক চূড়ান্ত সিদ্ধান্ত জানাবে।</p>
        
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px;">ট্র্যাকিং নম্বর:</td>
              <td style="padding: 4px 0; font-weight: bold; color: #0D5C3A; font-family: monospace;">${applicationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">শিক্ষার্থীর নাম:</td>
              <td style="padding: 4px 0; font-weight: bold;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">আবেদনকৃত জামাত:</td>
              <td style="padding: 4px 0;">${className}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">যোগাযোগ মোবাইল:</td>
              <td style="padding: 4px 0;">${guardianPhone}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #475569;">
          ভর্তি সংক্রান্ত যে কোনো তথ্যের জন্য যোগাযোগ করুন: <strong>01845-162664</strong> অথবা <strong>01826-416696</strong>।
        </p>
        <p style="font-size: 13px; color: #475569;">
          ঠিকানা: পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ।
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা ডিজিটাল ক্যাম্পাস পোর্টাল | সাপোর্ট: ehrjmadrasha@gmail.com
      </div>
    </div>
  `;

  return sendInstitutionalEmail({
    to,
    subject: `ভর্তি আবেদন নিশ্চিতকরণ - ${applicationNumber} | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা`,
    html,
  });
}

/**
 * Admission Approval & Permanent Student ID Issuance Email
 */
export async function sendAdmissionApprovalEmail({
  to,
  studentName,
  studentIdNumber,
  className,
  rollNumber,
}: {
  to: string;
  studentName: string;
  studentIdNumber: string;
  className: string;
  rollNumber: number;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0D5C3A; color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">ভর্তি আবেদন অনুমোদিত হয়েছে! (মোবারকবাদ)</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #fef08a;">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px; margin-top: 0;">মুহতারাম অভিভাবক,</p>
        <p>আলহামদুলিল্লাহ, আপনার সন্তান <strong>${studentName}</strong>-এর ভর্তি আবেদন ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় অনুমোদিত হয়েছে এবং স্থায়ী ছাত্র তালিকাভুক্ত করা হয়েছে।</p>
        
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #065f46;">স্থায়ী শিক্ষার্থী পরিচিতি:</p>
          <p style="margin: 4px 0; font-size: 14px;">স্থায়ী ছাত্র আইডি: <strong style="color: #0D5C3A; font-family: monospace;">${studentIdNumber}</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">জামাত / শ্রেণি: <strong>${className}</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">ক্লাস রোল: <strong>${rollNumber}</strong></p>
        </div>

        <p style="font-size: 13px; color: #475569;">
          অভিভাবক বা শিক্ষার্থী যে কোনো সময় অনলাইন পোর্টাল থেকে কোনো পাসওয়ার্ড ছাড়াই শুধুমাত্র জামাত ও রোল নম্বর প্রদান করে পরীক্ষার ফলাফল ও ফি বিবরণী দেখতে পারবেন।
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা | ফোন: 01845-162664, 01826-416696
      </div>
    </div>
  `;

  return sendInstitutionalEmail({
    to,
    subject: `ভর্তি অনুমোদন ও স্থায়ী আইডি প্রদান - ${studentIdNumber} | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা`,
    html,
  });
}
