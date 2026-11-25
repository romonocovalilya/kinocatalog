import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import MovieCatalog from '@/components/MovieCatalog';

async function HomeContent() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('userId')?.value);

  // Для неавторизованного гостя вывод витрины из 12 самых рейтинговых фильмов
  if (!userId) {
    const popularMovies = await prisma.movie.findMany({
      orderBy: [{ ratingKp: 'desc' }, { id: 'asc' }],
      take: 12,
    });
    return <MovieCatalog initialMovies={popularMovies} isGuest={true} />;
  }

  // Для вошедшего пользователя загрузка его личного накопительного каталога
  const userRecords = await prisma.userMovie.findMany({
    where: { userId },
    include: { movie: true },
    orderBy: { updatedAt: 'desc' },
  });

  const userCatalogMovies = userRecords.map((item) => item.movie);

  return <MovieCatalog initialMovies={userCatalogMovies} isGuest={false} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">Загрузка каталога...</div>}>
      <HomeContent />
    </Suspense>
  );
}
