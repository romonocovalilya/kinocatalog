'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // При загрузке страницы считывает сохранённую тему из localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  // Переключение класса dark на теге <html> и запись выбора в localStorage
  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className="p-2 rounded-lg border border-gray-200 dark:border-slate-700
                 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200
                 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
    >
      {isDark ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
