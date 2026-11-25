'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LibraryItem {
  id: number;
  status: string;
  movie: {
    id: number;
    title: string;
    type: string;
    year: number | null;
    posterUrl: string | null;
  };
}

export default function LibraryTabs({ items }: { items: LibraryItem[] }) {
  // --- БЛОК 1: Состояние активной вкладки и разделение фильмов по статусам ---
  const [activeTab, setActiveTab] = useState<'PLANNED' | 'WATCHED'>('PLANNED');

  const planned = items.filter((item) => item.status === 'PLANNED');
  const watched = items.filter((item) => item.status === 'WATCHED');
  const currentList = activeTab === 'PLANNED' ? planned : watched;

  return (
    <div className="space-y-6">
      {/* --- БЛОК 2: Кнопки переключения вкладок со счётчиками --- */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('PLANNED')}
          className={`pb-2.5 font-semibold transition-colors cursor-pointer ${
            activeTab === 'PLANNED'
              ? 'text-orange-600 dark:text-orange-500 border-b-2 border-orange-600 dark:border-orange-500'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          Не просмотрено ({planned.length})
        </button>

        <button
          onClick={() => setActiveTab('WATCHED')}
          className={`pb-2.5 font-semibold transition-colors cursor-pointer ${
            activeTab === 'WATCHED'
              ? 'text-orange-600 dark:text-orange-500 border-b-2 border-orange-600 dark:border-orange-500'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          Просмотрено ({watched.length})
        </button>
      </div>

      {/* --- БЛОК 3: Вывод пустого состояния или сетки карточек выбранной вкладки --- */}
      {currentList.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-slate-800
                     bg-white/50 dark:bg-slate-900/40 rounded-xl p-12 text-center
                     text-gray-500 dark:text-slate-400"
        >
          В этом списке пока пусто. Откройте любой фильм через поиск и добавьте его в библиотеку.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {currentList.map(({ id, movie }) => (
            <Link
              key={id}
              href={'/movies/' + movie.id}
              className="bg-white dark:bg-slate-900 border border-gray-200
                         dark:border-slate-800 rounded-xl overflow-hidden shadow-sm
                         hover:border-orange-500 transition-all flex flex-col"
            >
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-72 object-cover"
                />
              ) : (
                <div
                  className="w-full h-72 bg-gray-200 dark:bg-slate-800
                             flex items-center justify-center text-gray-400"
                >
                  Нет постера
                </div>
              )}

              <div className="p-4">
                <span
                  className="text-xs font-semibold text-orange-600
                             dark:text-orange-500 uppercase"
                >
                  {movie.type === 'TV_SERIES' ? 'Сериал' : 'Фильм'}
                </span>
                <h2
                  className="font-bold text-base text-gray-900
                             dark:text-slate-100 line-clamp-2 mt-0.5"
                >
                  {movie.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {movie.year || 'Год не указан'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
