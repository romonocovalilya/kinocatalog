import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

const POPULAR_KP_IDS = [
  301,
  447301,
  258687,
  464963,
  404900,
  326,
  435,
  535341,
  42664,
  1143242,
  79848,
  685246,
];

const API_HEADERS = {
  'X-API-KEY': process.env.KINOPOISK_API_KEY || '',
  'Content-Type': 'application/json',
};

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const kpBotHash = await bcrypt.hash('kp_reviews_system', 10);

  await prisma.user.upsert({
    where: { email: 'admin@test.ru' },
    update: {},
    create: {
      email: 'admin@test.ru',
      name: 'Администратор',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

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

  for (const kpId of POPULAR_KP_IDS) {
    const filmRes = await fetch(
      `https://kinopoiskapiunofficial.tech/api/v2.2/films/${kpId}`,
      { headers: API_HEADERS }
    );

    if (!filmRes.ok) continue;
    const d = await filmRes.json();

    const genresList = Array.isArray(d.genres)
      ? d.genres.map((g: { genre: string }) => g.genre).join(', ')
      : null;

    const movie = await prisma.movie.upsert({
      where: { kinopoiskId: kpId },
      update: {},
      create: {
        kinopoiskId: kpId,
        title: d.nameRu || d.nameOriginal || 'Без названия',
        type: d.type || 'FILM',
        year: d.year || null,
        genres: genresList,
        ratingKp: d.ratingKinopoisk || null,
        posterUrl: d.posterUrlPreview || d.posterUrl || null,
        description: d.description || d.shortDescription || null,
        webUrl: d.webUrl || `https://kinopoisk.ru/film/${kpId}/`,
      },
    });

    const revRes = await fetch(
      `https://kinopoiskapiunofficial.tech/api/v2.2/films/${kpId}/reviews?page=1&order=DATE_DESC`,
      { headers: API_HEADERS }
    );

    if (revRes.ok) {
      const revData = await revRes.json();
      const kpReviews = (revData.items || []).slice(0, 2); 

      for (const item of kpReviews) {
        const score =
          item.type === 'POSITIVE' ? 9 : item.type === 'NEGATIVE' ? 3 : 6;
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

  console.log('Загрузка прошла успешно!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
