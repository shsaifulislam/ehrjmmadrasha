import prisma from "../../config/prisma";

export class SettingsService {
  /**
   * Retrieves a setting value by key.
   */
  static async getSetting(key: string, defaultValue = ""): Promise<string> {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key },
      });
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error(`[SettingsService] Failed to fetch setting for key: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * Sets or updates a setting key-value pair.
   */
  static async setSetting(key: string, value: string): Promise<void> {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  /**
   * Retrieves all system settings as a key-value object.
   */
  static async getAllSettings(): Promise<Record<string, string>> {
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }
}

export default SettingsService;
