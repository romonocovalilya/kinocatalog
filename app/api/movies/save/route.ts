import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const API_HEADERS = {
  'X-API-KEY': process.env.KINOPOISK_API_KEY || '',
  'Content-Type': 'application/json',
};

export async function POST(request: Request) {
  try {
    const { kinopoiskId } = await request.json();
    const kpId = Number(kinopoiskId);

    if (!kpId) {
      return NextResponse.json({ error: 'Некорректный ID фильма' }, { status: 400 });
    }

    // 1. Проверка, есть ли фильм уже в локальной базе SQLite
    let movie = await prisma.movie.findUnique({ where: { kinopoiskId: kpId } });

    // 2. Если фильма в БД нет — загрузка полной информации с Кинопоиска и сохранение
    if (!movie) {
      const res = await fetch( 
        'https://kinopoiskapiunofficial.tech/api/v2.2/films/' + kpId, 
        { headers: API_HEADERS } 
      );

      if (!res.ok) {
        return NextResponse.json({ error: 'Не удалось получить данные о фильме' }, { status: 502 });
      }

      const details = await res.json();
      const genresList = Array.isArray(details.genres)
        ? details.genres.map((g: { genre: string }) => g.genre).join(', ')
        : null;

      movie = await prisma.movie.create({
        data: {
          kinopoiskId: kpId,
          title: details.nameRu || details.nameOriginal || 'Без названия',
          type: details.type || 'FILM',
          year: details.year || null,
          genres: genresList,
          ratingKp: details.ratingKinopoisk || null,
          posterUrl: details.posterUrlPreview || details.posterUrl || null,
          description: details.description || details.shortDescription || null,
          webUrl: details.webUrl || `https://kinopoisk.ru/film/${kpId}/`, 
        },
      });
    }

    // 3. Привязка открытого фильма к личному каталогу текущего пользователя (статус CATALOG)
    const cookieStore = await cookies();
    const userId = Number(cookieStore.get('userId')?.value);
    if (userId) {
      const existingLink = await prisma.userMovie.findUnique({
        where: { userId_movieId: { userId, movieId: movie.id } },
      });
      if (!existingLink) {
        await prisma.userMovie.create({
          data: { userId, movieId: movie.id, status: 'CATALOG' },
        });
      }
    }

    // 4. Если у фильма ещё нет отзывов — создаёт паузу 350 мс
    // и импортирует 2 свежие рецензии зрителей с Кинопоиска
    const existingReviewsCount = await prisma.review.count({
      where: { movieId: movie.id },
    });

    if (existingReviewsCount === 0) {
      await new Promise((r) => setTimeout(r, 350));

      const revRes = await fetch( 
        `https://kinopoiskapiunofficial.tech/api/v2.2/films/${kpId}/reviews?page=1&order=DATE_DESC`, 
        { headers: API_HEADERS } 
      ); 

      if (revRes.ok) {
        const revData = await revRes.json();
        const kpReviews = (revData.items || []).slice(0, 2);

        if (kpReviews.length > 0) {
          const kpBotHash = await bcrypt.hash('kp_reviews_system', 10);
          const kpUser = await prisma.user.upsert({
            where: { email: 'kinopoisk@import.local' },
            update: {},
            create: {
              email: 'kinopoisk@import.local',
              name: 'Кинопоиск',
              passwordHash: kpBotHash,
              role: 'USER',
            },
          });

          for (const item of kpReviews) {
            const score = item.type === 'POSITIVE' ? 9 : item.type === 'NEGATIVE' ? 3 : 6;
            const authorPrefix = item.author ? `[${item.author}]: ` : '';
            const cleanText = (authorPrefix + (item.description || '')).slice(0, 950);

            if (cleanText.trim()) {
              await prisma.review.create({
                data: {
                  userId: kpUser.id,
                  movieId: movie.id,
                  rating: score,
                  text: cleanText,
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json(movie);
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера при сохранении фильма' }, { status: 500 });
  }
}
