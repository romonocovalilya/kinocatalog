import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import MovieActionsAndReviews from '@/components/MovieActionsAndReviews';

async function MovieContent({ params }: { params: Promise<{ id: string }> }) {
  // --- БЛОК 1: Получение ID фильма из адреса страницы и проверка корректности ---
  const { id } = await params;
  const movieId = Number(id);
  if (isNaN(movieId)) notFound();

  // --- БЛОК 2: Загрузка фильма и всех связанных с ним отзывов из БД ---
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!movie) notFound();

  // --- БЛОК 3: Проверка текущего пользователя и статуса фильма в его библиотеке ---
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('userId')?.value) || null;
  const currentUser = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  const userMovie = userId
    ? await prisma.userMovie.findUnique({
        where: { userId_movieId: { userId, movieId: movie.id } },
      })
    : null;

  // Преобразует дату в строку для безопасной передачи в клиентский компонент
  const serializedReviews = movie.reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      {/* --- БЛОК 4: Основная карточка с постером и описанием фильма --- */}
      <div
        className="flex flex-col md:flex-row gap-8 bg-white dark:bg-slate-900
                   p-6 border border-gray-200 dark:border-slate-800 rounded-xl"
      >
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-60 h-88 object-cover rounded-lg mx-auto md:mx-0 shrink-0"
          />
        ) : (
          <div
            className="w-60 h-88 bg-gray-200 dark:bg-slate-800 rounded-lg
                       flex items-center justify-center shrink-0"
          >
            Нет постера
          </div>
        )}

        <div className="space-y-4 flex-1">
          {/* Тип контента, год выпуска и рейтинг Кинопоиска */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 text-xs font-semibold bg-orange-100
                         dark:bg-orange-950 text-orange-700 dark:text-orange-400 rounded"
            >
              {movie.type === 'TV_SERIES' ? 'Сериал' : 'Фильм'}
            </span>
            {movie.year && (
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {movie.year} г.
              </span>
            )}
            {movie.ratingKp && (
              <span
                className="px-2.5 py-0.5 text-xs font-bold bg-amber-100
                           dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded"
              >
                КП: {movie.ratingKp}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {movie.title}
          </h1>

          {movie.genres && (
            <p className="text-sm text-gray-500 dark:text-slate-400 capitalize">
              Жанры: {movie.genres}
            </p>
          )}

          <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
            {movie.description || 'Описание отсутствует.'}
          </p>

          {/* Кнопка перехода на официальную страницу фильма на Кинопоиске */}
          {movie.webUrl && (
            <div className="pt-2">
              <a
                href={movie.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-2.5 bg-orange-600 text-white
                           font-medium rounded-lg hover:bg-orange-500 transition-colors"
              >
                Смотреть на Кинопоиске ↗
              </a>
            </div>
          )}
        </div>
      </div>

      {/* --- БЛОК 5: Интерактивные кнопки библиотеки и список отзывов --- */}
      <MovieActionsAndReviews
        movieId={movie.id}
        currentUserId={userId}
        isAdmin={currentUser?.role === 'ADMIN'}
        initialStatus={userMovie?.status || null}
        reviews={serializedReviews}
      />
    </div>
  );
}

export default function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">Загрузка фильма...</div>}>
      <MovieContent params={params} />
    </Suspense>
  );
}
