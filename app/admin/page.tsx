import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function AdminContent() {
  // 1. Проверка сессии и роль администратора; остальных направляет на /login
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('userId')?.value);
  const currentUser = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  // 2. Параллельно сообщает общую статистику по таблицам БД и топ-10 фильмов
  const [usersCount, moviesCount, reviewsCount, watchedCount, topMovies] = await Promise.all([
    prisma.user.count(),
    prisma.movie.count(),
    prisma.review.count(),
    prisma.userMovie.count({ where: { status: 'WATCHED' } }),
    prisma.movie.findMany({
      take: 10,
      include: { _count: { select: { inLibraries: true, reviews: true } } },
      orderBy: [{ inLibraries: { _count: 'desc' } }, { ratingKp: 'desc' }],
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Карточки сводной статистики по базе данных */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-4 bg-white dark:bg-slate-900 border border-gray-200
                     dark:border-slate-800 rounded-xl"
        >
          <p className="text-sm text-gray-500 dark:text-slate-400">Пользователей</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{usersCount}</p>
        </div>

        <div
          className="p-4 bg-white dark:bg-slate-900 border border-gray-200
                     dark:border-slate-800 rounded-xl"
        >
          <p className="text-sm text-gray-500 dark:text-slate-400">Фильмов в БД</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{moviesCount}</p>
        </div>

        <div
          className="p-4 bg-white dark:bg-slate-900 border border-gray-200
                     dark:border-slate-800 rounded-xl"
        >
          <p className="text-sm text-gray-500 dark:text-slate-400">Отзывов на сайте</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{reviewsCount}</p>
        </div>

        <div
          className="p-4 bg-white dark:bg-slate-900 border border-gray-200
                     dark:border-slate-800 rounded-xl"
        >
          <p className="text-sm text-gray-500 dark:text-slate-400">Просмотрено</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{watchedCount}</p>
        </div>
      </div>

      {/* Таблица самых популярных произведений в каталоге */}
      <div
        className="bg-white dark:bg-slate-900 border border-gray-200
                   dark:border-slate-800 rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Популярные фильмы и сериалы в каталоге
        </h2>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr
              className="border-b border-gray-200 dark:border-slate-800
                         text-gray-500 dark:text-slate-400"
            >
              <th className="py-2">Название</th>
              <th className="py-2">Тип</th>
              <th className="py-2">Жанры</th>
              <th className="py-2">В библиотеках</th>
              <th className="py-2">Отзывов</th>
            </tr>
          </thead>
          <tbody>
            {topMovies.map((m) => (
              <tr
                key={m.id}
                className="border-b border-gray-100 dark:border-slate-800/60 last:border-0"
              >
                <td className="py-2.5 font-medium">{m.title}</td>
                <td className="py-2.5">{m.type === 'TV_SERIES' ? 'Сериал' : 'Фильм'}</td>
                <td className="py-2.5 text-gray-500 dark:text-slate-400">{m.genres || '—'}</td>
                <td className="py-2.5">{m._count.inLibraries}</td>
                <td className="py-2.5">{m._count.reviews}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Панель администратора и аналитика
      </h1>
      <Suspense fallback={<div className="text-center py-12 text-gray-400">Загрузка аналитики...</div>}>
        <AdminContent />
      </Suspense>
    </div>
  );
}
