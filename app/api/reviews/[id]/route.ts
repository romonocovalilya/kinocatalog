import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('userId')?.value);
  if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  // Редактировать отзыв разрешено только его автору
  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.userId !== userId) {
    return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 });
  }

  const { text, rating } = await request.json();
  const updated = await prisma.review.update({
    where: { id: Number(id) },
    data: { text, rating: Number(rating) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('userId')?.value);
  if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  // Удалять отзыв разрешено либо автору, либо пользователю с ролью ADMIN
  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!review || (review.userId !== userId && user?.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
}