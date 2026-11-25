import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 1. Получает данные из формы регистрации
    const { name, email, password } = await request.json();

    // 2. Проверка заполнения полей и длину пароля
    if (!name || !email || !password || password.length < 4) {
      return NextResponse.json(
        { error: 'Заполните все поля (пароль минимум 4 символа)' },
        { status: 400 }
      );
    }

    // 3. Проверка, что такой Email ещё не зарегистрирован
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Этот Email уже занят' }, { status: 400 });
    }

    // 4. Шифровка пароля и создание пользователя с ролью USER
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'USER' },
    });

    // 5. Сохранение ID пользователя в защищённый httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('userId', String(user.id), { httpOnly: true, path: '/' });

    return NextResponse.json({ id: user.id, name: user.name, role: user.role });
  } catch {
    return NextResponse.json({ error: 'Ошибка при регистрации' }, { status: 500 });
  }
}

