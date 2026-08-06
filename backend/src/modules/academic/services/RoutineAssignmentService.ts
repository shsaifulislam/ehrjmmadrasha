import { RoutineRepository, CreateRoutineData } from "../repositories/RoutineRepository";
import { RoutineConflictService } from "./RoutineConflictService";

export class RoutineAssignmentService {
  static async assignRoutineSlot(data: CreateRoutineData) {
    // Perform strict conflict detection first
    await RoutineConflictService.validateConflicts(data);
    return RoutineRepository.create(data);
  }

  static async getClassRoutineGrid(classId: string) {
    return RoutineRepository.findByClass(classId);
  }

  static async getTeacherRoutineGrid(teacherId: string) {
    return RoutineRepository.findByTeacher(teacherId);
  }

  static async removeRoutineSlot(id: string) {
    return RoutineRepository.softDelete(id);
  }
}
