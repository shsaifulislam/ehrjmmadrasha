import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER || "ehrjmadrasha@gmail.com";
const smtpPass = process.env.SMTP_PASS || "";

// Initialize Nodemailer transporter with support for custom SMTP relay or Gmail App Password
const transporter = nodemailer.createTransport(
  smtpHost
    ? {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 15000,
      }
    : {
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 15000,
      }
);

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using institutional SMTP
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

    if (process.env.SMTP_MOCK === "true") {
      const mockId = `mock-test-email-${Date.now()}`;
      console.log(`[SMTP Test Mock] Email to ${to} simulated successfully. ID: ${mockId}`);
      return { success: true, messageId: mockId };
    }

    const defaultFrom = `"ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা" <${smtpUser}>`;
    const fromAddress = process.env.SMTP_FROM || defaultFrom;

    const info = await transporter.sendMail({
      from: fromAddress,
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
  portalUsername,
  defaultPassword,
  guardianPhone,
}: {
  to: string;
  studentName: string;
  studentIdNumber: string;
  className: string;
  rollNumber: number;
  portalUsername?: string;
  defaultPassword?: string;
  guardianPhone?: string;
}) {
  const credentialsHtml = defaultPassword
    ? `
      <div style="background-color: #fefce8; border: 1.5px solid #facc15; border-radius: 6px; padding: 16px; margin: 16px 0; color: #1e293b;">
        <p style="margin: 0 0 8px; font-weight: bold; color: #854d0e;">মাদরাসা অনলাইন পোর্টাল লগইন একাউন্ট তথ্য:</p>
        <p style="margin: 4px 0; font-size: 13px;">লগইন প্রবেশদ্বার: <strong>অভিভাবক ও শিক্ষার্থী পোর্টাল</strong></p>
        <p style="margin: 4px 0; font-size: 13px;">ইউজার আইডি / মোবাইল: <strong style="color: #0D5C3A;">${guardianPhone || portalUsername || to}</strong></p>
        <p style="margin: 4px 0; font-size: 13px;">প্রাথমিক ডিফল্ট পাসওয়ার্ড: <strong style="color: #b91c1c; font-family: monospace; font-size: 15px; background: #fff; padding: 2px 6px; border: 1px solid #fde047; border-radius: 4px;">${defaultPassword}</strong></p>
        <p style="margin: 8px 0 0; font-size: 12px; color: #713f12; line-height: 1.4;">
          * এই অ্যাকাউন্ট ব্যবহার করে আপনি শিক্ষার্থীর পরীক্ষার ফলাফল, উপস্থিতি, ফি পরিশোধের হিসাব এবং মাদরাসার যাবতীয় আপডেট দেখতে পারবেন। প্রথমবার লগইনের পর আপনার সুবিধাজনক নতুন পাসওয়ার্ড পরিবর্তন করে নিন।
        </p>
      </div>
    `
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
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

        ${credentialsHtml}

        <p style="font-size: 13px; color: #475569;">
          ভর্তি সংক্রান্ত যে কোনো তথ্যের জন্য যোগাযোগ করুন: <strong>01845-162664</strong> | ইমেইল: <strong>ehrjmadrasha@gmail.com</strong>
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা | ফোন: 01845-162664, 01826-416696
      </div>
    </div>
  `;

  return sendInstitutionalEmail({
    to,
    subject: `ভর্তি অনুমোদন ও পোর্টাল লগইন তথ্য - ${studentIdNumber} | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা`,
    html,
  });
}

/**
 * Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail({
  to,
  userName,
  otpCode,
  validMinutes = 10,
}: {
  to: string;
  userName: string;
  otpCode: string;
  validMinutes?: number;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0D5C3A; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #C59B27;">
        <h2 style="margin: 0; font-size: 20px;">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #fef08a;">পাসওয়ার্ড রিসেট ওটিপি (OTP Verification)</p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #a7f3d0;">প্রতিষ্ঠাতা ও অধ্যক্ষ: মাওলানা মহা. আবুল কালাম সরকার</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px; margin-top: 0;">মুহতারাম <strong>${userName}</strong>, আসসালামু আলাইকুম।</p>
        <p>আপনার ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করার জন্য একটি অনুরোধ পাওয়া গেছে। নিচে আপনার ৬-সংখ্যার ওটিপি কোডটি প্রদান করা হলো:</p>
        
        <div style="background-color: #f0fdf4; border: 2px dashed #0D5C3A; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 13px; color: #475569; display: block; margin-bottom: 6px;">আপনার ওটিপি ভেরিফিকেশন কোড</span>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0D5C3A; font-family: monospace;">
            ${otpCode}
          </div>
          <span style="font-size: 12px; color: #b91c1c; display: block; margin-top: 8px; font-weight: 600;">
            ⏳ এই কোডটি আগামী ${validMinutes} মিনিট কার্যকর থাকবে
          </span>
        </div>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 13px; color: #92400e;">
          <strong>সতর্কতা:</strong> এই ওটিপি কোডটি অত্যন্ত গোপনীয়। মাদরাসার কোনো প্রতিনিধি বা অন্য কারো সাথে এই কোড শেয়ার করবেন না। আপনি যদি পাসওয়ার্ড রিসেটের অনুরোধ না করে থাকেন, তবে অবিলম্বে মাদরাসা প্রশাসনকে অবহিত করুন।
        </div>

        <p style="font-size: 13px; color: #475569; margin-top: 20px;">
          জরুরি যোগাযোগ: <strong>01845-162664</strong> | ইমেইল: <strong>ehrjmadrasha@gmail.com</strong>
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা অনলাইন ইনফরমেশন সিস্টেম
      </div>
    </div>
  `;

  return sendInstitutionalEmail({
    to,
    subject: `[EHRJ] পাসওয়ার্ড রিসেট ভেরিফিকেশন ওটিপি: ${otpCode} | ইলিয়টগঞ্জ মাদরাসা`,
    html,
  });
}

/**
 * Password Reset Success Confirmation Email
 */
export async function sendPasswordResetSuccessEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0D5C3A; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #C59B27;">
        <h2 style="margin: 0; font-size: 20px;">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #fef08a;">পাসওয়ার্ড পরিবর্তন সফল হয়েছে</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px; margin-top: 0;">মুহতারাম <strong>${userName}</strong>,</p>
        <p>আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে। আপনি এখন আপনার নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।</p>
        
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 13px; color: #065f46;">
          ✓ নতুন পাসওয়ার্ড সফলভাবে সক্রিয় হয়েছে।<br/>
          ✓ নিরাপত্তার স্বার্থে আপনার পূর্ববর্তী সকল লগইন সেশন বন্ধ করে দেওয়া হয়েছে।
        </div>

        <p style="font-size: 13px; color: #475569;">
          যদি আপনি এই পরিবর্তন না করে থাকেন, অনুগ্রহ করে অতি দ্রুত মাদরাসা প্রশাসনের সাথে যোগাযোগ করে অ্যাকাউন্ট সুরক্ষিত করুন।
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা | সাপোর্ট: ehrjmadrasha@gmail.com
      </div>
    </div>
  `;

  return sendInstitutionalEmail({
    to,
    subject: `পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা`,
    html,
  });
}

