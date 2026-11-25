import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LibraryTabs from '@/components/LibraryTabs';

async function LibraryContent() {
  // --- БЛОК 1: Проверка авторизации; гостей перенаправляет на /login ---
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('userId')?.value);

  if (!userId) {
    redirect('/login');
  }

  // --- БЛОК 2: Загрузка всех фильмов пользователя из связующей таблицы UserMovie ---
  const items = await prisma.userMovie.findMany({
    where: { userId },
    include: {
      movie: {
        select: { id: true, title: true, type: true, year: true, posterUrl: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Передача списка в клиентский компонент с вкладками
  return <LibraryTabs items={items} />;
}

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Моя библиотека</h1>
      <Suspense fallback={<div className="text-center py-12 text-gray-400">Загрузка библиотеки...</div>}>
        <LibraryContent />
      </Suspense>
    </div>
  );
}
