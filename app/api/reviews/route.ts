import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Схема валидации данных отзыва через библиотеку Zod
const reviewSchema = z.object({
  movieId: z.number(),
  rating: z.coerce.number().min(1).max(10),
  text: z.string().min(5, 'Отзыв должен содержать минимум 5 символов').max(1000),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('userId')?.value);
  if (!userId) return NextResponse.json({ error: 'Войдите в аккаунт' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    // Если данные не прошли проверку Zod — возвращает ошибку
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        movieId: parsed.data.movieId,
        rating: parsed.data.rating,
        text: parsed.data.text,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка при сохранении отзыва' }, { status: 500 });
  }
}