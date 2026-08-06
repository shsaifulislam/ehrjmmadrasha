import AdmissionCreateService, { CreateAdmissionInput } from "./AdmissionCreateService";

export class AdmissionImportService {
  /**
   * Processes batch CSV / JSON import of admission records.
   */
  static async importBatch(records: CreateAdmissionInput[]) {
    const results = {
      total: records.length,
      successCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < records.length; i++) {
      try {
        await AdmissionCreateService.execute(records[i]);
        results.successCount++;
      } catch (err: any) {
        results.failedCount++;
        results.errors.push(`Row ${i + 1} failed: ${err.message}`);
      }
    }

    return results;
  }
}

export default AdmissionImportService;
