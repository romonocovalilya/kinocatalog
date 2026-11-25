import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Поиск пользователя по Email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Неверный Email или пароль' }, { status: 401 });
    }

    // 2. Сравнение введённого пароля с зашифрованным хешем в БД
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Неверный Email или пароль' }, { status: 401 });
    }

    // 3. Установка сессионного httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('userId', String(user.id), { httpOnly: true, path: '/' });

    return NextResponse.json({ id: user.id, name: user.name, role: user.role });
  } catch {
    return NextResponse.json({ error: 'Ошибка при входе' }, { status: 500 });
  }
}
