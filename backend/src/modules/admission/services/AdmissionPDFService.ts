import prisma from "../../../config/prisma";

export class AdmissionPDFService {
  /**
   * Generates admission application slip / receipt HTML for PDF rendering.
   */
  static async generateReceiptHtml(admissionId: string): Promise<string> {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        class: true,
        session: true,
        invoice: { include: { payments: true } },
      },
    });

    if (!admission) {
      throw new Error("ভর্তি আবেদন পাওয়া যায়নি।");
    }

    const html = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>ভর্তি আবেদন রসিদ - ${admission.verificationToken || admission.id}</title>
        <style>
          body { font-family: 'SolaimanLipi', Arial, sans-serif; padding: 30px; line-height: 1.6; }
          .header { text-align: center; border-b: 2px solid #1e293b; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #1e3a8a; }
          .subtitle { font-size: 13px; color: #475569; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .table th, .table td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
          .table th { background-color: #f1f5f9; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
          .badge-approved { background-color: #dcfce7; color: #166534; }
          .badge-pending { background-color: #fef3c7; color: #92400e; }
          .footer { margin-top: 40px; text-align: right; font-size: 12px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">মাদরাসা ইএইচআরজে - ভর্তি আবেদন রসিদ</div>
          <div class="subtitle">অনলাইন ভর্তি তথ্য ও ফি বিবরণী</div>
        </div>

        <table class="table">
          <tr>
            <th>আবেদন ভেরিফিকেশন টোকেন</th>
            <td><strong>${admission.verificationToken || admission.id}</strong></td>
          </tr>
          <tr>
            <th>আবেদনকারীর নাম</th>
            <td>${admission.applicantName} ${admission.applicantNameEn ? `(${admission.applicantNameEn})` : ""}</td>
          </tr>
          <tr>
            <th>মোবাইল নম্বর</th>
            <td>${admission.phone}</td>
          </tr>
          <tr>
            <th>শ্রেণী</th>
            <td>${admission.class?.name || "N/A"}</td>
          </tr>
          <tr>
            <th>পিতার নাম</th>
            <td>${admission.fatherName || "N/A"}</td>
          </tr>
          <tr>
            <th>আবেদনের তারিখ</th>
            <td>${new Date(admission.createdAt).toLocaleDateString("bn-BD")}</td>
          </tr>
          <tr>
            <th>আবেদনের অবস্থা</th>
            <td>
              <span class="badge ${admission.status === "APPROVED" ? "badge-approved" : "badge-pending"}">
                ${admission.status === "APPROVED" ? "অনুমোদিত" : "অপেক্ষমান"}
              </span>
            </td>
          </tr>
          ${
            admission.invoice
              ? `
          <tr>
            <th>ভর্তি ফি ইনভয়েস</th>
            <td>৳ ${admission.invoice.totalAmount} (স্ট্যাটাস: ${admission.invoice.status})</td>
          </tr>
          `
              : ""
          }
        </table>

        <div class="footer">
          <p>স্বাক্ষর ও সিল: ____________________</p>
          <p>প্রিন্ট তারিখ: ${new Date().toLocaleDateString("bn-BD")}</p>
        </div>
      </body>
      </html>
    `;

    return html;
  }
}

export default AdmissionPDFService;
