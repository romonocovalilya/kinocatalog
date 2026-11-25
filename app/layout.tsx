import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'KinoCatalog — Каталог фильмов и сериалов',
  description: 'Учебный проект на Next.js, SQLite и Prisma',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      {/* Основной фон страницы с плавным переходом цветов при смене темы */}
      <body
        className="bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100
                   min-h-screen flex flex-col transition-colors duration-200"
      >
        {/* Закреплённая верхняя шапка с навигацией */}
        <header
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b
                     border-gray-200 dark:border-slate-800 sticky top-0 z-10
                     transition-colors"
        >
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-orange-600 dark:text-orange-500"
            >
              KinoCatalog
            </Link>

            {/* Обёртка Navbar в Suspense для асинхронной проверки сессии */}
            <Suspense fallback={<div className="text-sm text-gray-400">Загрузка...</div>}>
              <Navbar />
            </Suspense>
          </div>
        </header>

        {/* Основная область для вывода содержимого страниц */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
