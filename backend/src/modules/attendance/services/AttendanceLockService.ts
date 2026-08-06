import { AppError } from "../../../utils/AppError";

export class AttendanceLockService {
  private static LOCK_DAYS_LIMIT = 7; // Attendance cannot be edited after 7 days

  static checkDateLock(dateStr: string) {
    const targetDate = new Date(dateStr);
    const currentDate = new Date();

    const diffInTime = currentDate.getTime() - targetDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);

    if (diffInDays > this.LOCK_DAYS_LIMIT) {
      throw new AppError(
        `অ্যাটেনডেন্স সংশোধন সময়সীমা অতিক্রম করেছে! ${this.LOCK_DAYS_LIMIT} দিনের পুরানো অ্যাটেনডেন্স পরিবর্তন করা লক করা রয়েছে।`,
        400
      );
    }

    return true;
  }
}
