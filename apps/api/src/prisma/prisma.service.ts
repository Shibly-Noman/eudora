import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { createPrismaClient, type PrismaClient } from "@eudora/db";

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private client: PrismaClient | undefined;

  async checkConnection(): Promise<void> {
    await this.db.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async close(): Promise<void> {
    await this.client?.$disconnect();
    this.client = undefined;
  }

  get db(): PrismaClient {
    this.client ??= createPrismaClient();
    return this.client;
  }
}
