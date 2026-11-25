import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Удаление сессионного cookie, завершая сеанс пользователя
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  return NextResponse.json({ success: true });
}
