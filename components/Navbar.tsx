import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import ThemeToggle from './ThemeToggle';
import LogoutButton from './LogoutButton';

export default async function Navbar() {
  // Проверка сессии пользователя на сервере
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('userId')?.value);
  const currentUser = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  return (
    <nav className="flex items-center gap-5 text-sm font-medium text-gray-700 dark:text-slate-300">
      <Link
        href="/"
        className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
      >
        Поиск
      </Link>

      {/* Ссылка «Библиотека» доступна только вошедшим пользователям */}
      {currentUser && (
        <Link
          href="/library"
          className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          Библиотека
        </Link>
      )}

      {/* Ссылка «Админка» видна только пользователям с ролью ADMIN */}
      {currentUser?.role === 'ADMIN' && (
        <Link
          href="/admin"
          className="text-orange-600 dark:text-orange-400 font-semibold"
        >
          Админка
        </Link>
      )}

      <ThemeToggle />

      {/* Блок профиля: имя + выход для вошедших или кнопка входа для гостей */}
      {currentUser ? (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {currentUser.name}
          </span>
          <LogoutButton />
        </div>
      ) : (
        <Link
          href="/login"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg
                     hover:bg-orange-500 transition-colors"
        >
          Войти
        </Link>
      )}
    </nav>
  );
}
