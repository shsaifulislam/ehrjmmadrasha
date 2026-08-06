import { AppError } from "../../../utils/AppError";
import { CreateGuardianInput, UpdateGuardianInput } from "../guardian.schema";
import { GuardianRepository } from "../repositories/GuardianRepository";

export class GuardianService {
  static async createGuardian(input: CreateGuardianInput) {
    const existing = await GuardianRepository.findByPhone(input.phone);
    if (existing) {
      throw new AppError("এই মোবাইল নম্বর দিয়ে ইতিমধ্যেই অভিভাবক নিবন্ধিত আছেন", 400);
    }
    return GuardianRepository.create(input);
  }

  static async getGuardianById(id: string) {
    const guardian = await GuardianRepository.findById(id);
    if (!guardian) {
      throw new AppError("অভিভাবকের তথ্য পাওয়া যায়নি", 404);
    }
    return guardian;
  }

  static async listGuardians(query?: { search?: string; page?: number; limit?: number }) {
    return GuardianRepository.findAll(query);
  }

  static async updateGuardian(id: string, input: UpdateGuardianInput) {
    await this.getGuardianById(id);
    return GuardianRepository.update(id, input);
  }

  static async linkWardToGuardian(guardianId: string, studentId: string) {
    await this.getGuardianById(guardianId);
    return GuardianRepository.linkWard(guardianId, studentId);
  }

  static async unlinkWardFromGuardian(studentId: string) {
    return GuardianRepository.unlinkWard(studentId);
  }

  static async deleteGuardian(id: string) {
    await this.getGuardianById(id);
    return GuardianRepository.softDelete(id);
  }
}
