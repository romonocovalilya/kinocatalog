'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // --- БЛОК 1: Состояния режима формы (вход/регистрация), полей ввода и загрузки ---
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- БЛОК 2: Отправка данных на сервер (/api/auth/login или /api/auth/register) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // В зависимости от режима выбирает нужный адрес и набор полей
    const url = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка авторизации');
      } else {
        // При успешном входе переход на главную и обновление шапки сайта
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-w-md mx-auto bg-white dark:bg-slate-900 p-6
                 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4"
    >
      <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white">
        {isRegister ? 'Регистрация аккаунта' : 'Вход в аккаунт'}
      </h1>

      {/* Блок вывода сообщения об ошибке от сервера */}
      {error && (
        <div
          className="p-3 text-sm bg-red-50 dark:bg-red-950/50 text-red-600
                     dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* --- БЛОК 3: Форма ввода данных --- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Поле «Имя» показывается только в режиме регистрации */}
        {isRegister && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Имя
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван"
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-300
                         dark:border-slate-700 rounded-lg text-gray-900 dark:text-white
                         focus:outline-none focus:border-orange-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-300
                       dark:border-slate-700 rounded-lg text-gray-900 dark:text-white
                       focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Пароль
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-300
                       dark:border-slate-700 rounded-lg text-gray-900 dark:text-white
                       focus:outline-none focus:border-orange-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium
                     hover:bg-orange-500 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {loading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      {/* --- БЛОК 4: Кнопка переключения между входом и регистрацией --- */}
      <div className="text-center pt-2 border-t border-gray-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setIsRegister((prev) => !prev);
            setError('');
          }}
          className="text-sm text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
}
