import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('userId')?.value);
  if (!userId) return NextResponse.json({ error: 'Войдите в аккаунт' }, { status: 401 });

  const { movieId, status } = await request.json();

  // Если передан статус REMOVE — удаляет фильм из списка пользователя
  if (status === 'REMOVE') {
    await prisma.userMovie.deleteMany({
      where: { userId, movieId: Number(movieId) },
    });
    return NextResponse.json({ removed: true });
  }

  // Иначе обновляет статус (PLANNED / WATCHED) или создаёт новую связь
  const record = await prisma.userMovie.upsert({
    where: { userId_movieId: { userId, movieId: Number(movieId) } },
    update: { status },
    create: { userId, movieId: Number(movieId), status },
  });

  return NextResponse.json(record);
}
