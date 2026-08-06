import prisma from "../../config/prisma";

export class PermissionService {
  /**
   * Verifies if a role has a specific permission name (e.g. 'student.create').
   */
  static async hasPermission(roleId: string, permissionName: string): Promise<boolean> {
    try {
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId,
          permission: {
            name: permissionName,
          },
        },
      });
      return !!rolePermission;
    } catch (error) {
      console.error(`[PermissionService] Error checking permission ${permissionName} for role ${roleId}:`, error);
      return false;
    }
  }

  /**
   * Retrieves all permissions assigned to a given role ID.
   */
  static async getRolePermissions(roleId: string): Promise<string[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });
    return rolePermissions.map((rp) => rp.permission.name);
  }
}

export default PermissionService;
