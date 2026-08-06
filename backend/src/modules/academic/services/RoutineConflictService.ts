import { AppError } from "../../../utils/AppError";
import { RoutineRepository, CreateRoutineData } from "../repositories/RoutineRepository";

export class RoutineConflictService {
  static async validateConflicts(data: CreateRoutineData, excludeId?: string) {
    // 1. Check Teacher Slot Clash
    const teacherClashes = await RoutineRepository.findTeacherTimeSlotClashes(
      data.teacherId,
      data.dayOfWeek,
      data.startTime,
      data.endTime,
      excludeId
    );

    if (teacherClashes.length > 0) {
      const clash = teacherClashes[0];
      throw new AppError(
        `শিক্ষক ডাবল-বুকিং সংঘাত! উক্ত শিক্ষক ইতিমধ্যে ${clash.class?.name || "অন্য ক্লাসে"} (${clash.startTime} - ${clash.endTime}) সময়সূচীতে অ্যাসাইন করা আছেন।`,
        400
      );
    }

    // 2. Check Class/Section Slot Clash
    const classClashes = await RoutineRepository.findClassTimeSlotClashes(
      data.classId,
      data.dayOfWeek,
      data.startTime,
      data.endTime,
      excludeId
    );

    if (classClashes.length > 0) {
      const clash = classClashes[0];
      throw new AppError(
        `শ্রেণি সময়সূচী সংঘাত! উক্ত শ্রেণিতে ইতিমধ্যেই (${clash.startTime} - ${clash.endTime}) সময়সূচীতে ${clash.subject?.name || "বিষয়"} ক্লাস নির্ধারিত আছে।`,
        400
      );
    }

    // 3. Check Room Slot Clash (if room specified)
    if (data.roomNo) {
      const roomClashes = await RoutineRepository.findRoomTimeSlotClashes(
        data.roomNo,
        data.dayOfWeek,
        data.startTime,
        data.endTime,
        excludeId
      );

      if (roomClashes.length > 0) {
        throw new AppError(
          `কক্ষ (Room) সংঘাত! কক্ষ নম্বর ${data.roomNo} উক্ত সময়সূচীতে ব্যস্ত রয়েছে।`,
          400
        );
      }
    }

    return true;
  }
}
