import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Сохранение подключения в глобальной области памяти, чтобы при hot-reload в Next.js
// не создавались десятки лишних соединений к базе данных
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Создание адаптера для работы с локальным файлом базы данных SQLite
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

// Экспорт единого экземпляра PrismaClient для использования во всех файлах проекта
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
