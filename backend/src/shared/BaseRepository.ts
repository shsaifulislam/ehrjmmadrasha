import { PrismaClient } from "@prisma/client";

export class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  protected get delegate() {
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: string): Promise<T | null> {
    return this.delegate.findUnique({
      where: { id },
    });
  }

  async findMany(where = {}, skip = 0, take = 20, orderBy = { createdAt: "desc" }): Promise<T[]> {
    return this.delegate.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  async count(where = {}): Promise<number> {
    return this.delegate.count({ where });
  }

  async create(data: any): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return this.delegate.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, deletedBy?: string): Promise<T> {
    return this.delegate.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
      },
    });
  }
}

export default BaseRepository;
