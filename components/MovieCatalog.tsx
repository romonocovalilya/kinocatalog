'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Описание полей карточки фильма
interface MovieItem {
  id?: number;
  kinopoiskId: number;
  title?: string;
  nameRu?: string;
  nameOriginal?: string;
  type: string;
  year?: number | null;
  genres?: string | { genre: string }[] | null;
  ratingKp?: number | null;
  ratingKinopoisk?: number | null;
  posterUrl?: string | null;
  posterUrlPreview?: string | null;
}

// Список жанров для выпадающего фильтра
const GENRES = [
  'Все жанры',
  'фантастика',
  'драма',
  'боевик',
  'триллер',
  'комедия',
  'криминал',
  'приключения',
  'фэнтези',
];

export default function MovieCatalog({
  initialMovies,
  isGuest = true,
}: {
  initialMovies: MovieItem[];
  isGuest?: boolean;
}) {
  const router = useRouter();

  // --- БЛОК 1: Состояния поиска, фильтров и списка карточек ---
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('ALL');
  const [selectedGenre, setSelectedGenre] = useState('Все жанры');
  const [films, setFilms] = useState<MovieItem[]>(initialMovies);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Обновление списка карточек при входе или выходе из аккаунта
  useEffect(() => {
    setFilms(initialMovies);
    setIsSearchMode(false);
    setSelectedGenre('Все жанры');
    setQuery('');
  }, [initialMovies, isGuest]);

  // --- БЛОК 2: Поиск фильмов через серверный маршрут /api/movies/search ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !year.trim()) {
      handleReset();
      return;
    }

    setLoading(true);
    setError('');
    setIsSearchMode(true);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (year.trim()) params.set('year', year.trim());
      if (type !== 'ALL') params.set('type', type);

      const res = await fetch('/api/movies/search?' + params.toString());
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка поиска');
        setFilms([]);
      } else {
        setFilms(data);
      }
    } catch {
      setError('Ошибка сети при выполнении поиска');
    } finally {
      setLoading(false);
    }
  };

  // --- БЛОК 3: Сброс поиска и возврат к витрине или личному каталогу ---
  const handleReset = () => {
    setQuery('');
    setYear('');
    setType('ALL');
    setSelectedGenre('Все жанры');
    setFilms(initialMovies);
    setIsSearchMode(false);
    setError('');
  };

  // --- БЛОК 4: Сохранение выбранного фильма в БД и переход на его страницу ---
  const handleOpenMovie = async (movie: MovieItem) => {
    setOpeningId(movie.kinopoiskId);
    try {
      const res = await fetch('/api/movies/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kinopoiskId: movie.kinopoiskId }),
      });
      const saved = await res.json();
      if (res.ok && saved.id) {
        router.push('/movies/' + saved.id);
        router.refresh();
      } else {
        setError(saved.error || 'Не удалось открыть фильм');
      }
    } catch {
      setError('Ошибка сети при загрузке фильма');
    } finally {
      setOpeningId(null);
    }
  };

  // --- БЛОК 5: Удаление карточки из личного каталога пользователя ---
  const handleRemoveFromCatalog = async (e: React.MouseEvent, movieId: number) => {
    e.stopPropagation(); // Остановка клика, чтобы не открывалась страница фильма
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId, status: 'REMOVE' }),
    });
    if (res.ok) {
      setFilms((prev) => prev.filter((f) => f.id !== movieId));
      router.refresh();
    }
  };

  // --- БЛОК 6: Приведение жанров к строке и фильтрация карточек на экране ---
  const getGenresText = (g: MovieItem['genres']) => {
    if (!g) return '';
    if (typeof g === 'string') return g;
    if (Array.isArray(g)) return g.map((x) => x.genre).join(', ');
    return '';
  };

  const filteredFilms = films.filter((film) => {
    const genresStr = getGenresText(film.genres).toLowerCase();
    const matchGenre =
      selectedGenre === 'Все жанры' || genresStr.includes(selectedGenre.toLowerCase());
    const matchType = type === 'ALL' || film.type === type;
    return matchGenre && matchType;
  });
  return (
    <div className="space-y-6">
      {/* --- БЛОК 7: Заголовок страницы и кнопка возврата из поиска --- */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isSearchMode
            ? 'Результаты поиска (нажмите на карточку, чтобы добавить в каталог)'
            : isGuest
            ? 'Популярные фильмы и сериалы'
            : 'Мой каталог фильмов и сериалов'}
        </h1>

        {isSearchMode && (
          <button
            onClick={handleReset}
            className="text-sm text-orange-600 dark:text-orange-400
                       hover:underline cursor-pointer shrink-0 ml-4"
          >
            {isGuest ? '← Вернуться к популярным' : '← Вернуться в мой каталог'}
          </button>
        )}
      </div>

      {/* --- БЛОК 8: Форма поиска и выпадающие фильтры по типу и жанрам --- */}
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти и добавить фильм через API Кинопоиска..."
          className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-700
                     rounded-lg bg-white dark:bg-slate-900 text-gray-900
                     dark:text-white focus:outline-none focus:border-orange-500"
        />

        <input
          type="number"
          min={1900}
          max={2030}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Год"
          className="w-full md:w-24 px-3 py-2.5 border border-gray-300
                     dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900
                     text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full md:w-36 px-3 py-2.5 border border-gray-300
                     dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900
                     text-gray-900 dark:text-white focus:outline-none
                     focus:border-orange-500 cursor-pointer"
        >
          <option value="ALL">Все типы</option>
          <option value="FILM">Фильмы</option>
          <option value="TV_SERIES">Сериалы</option>
        </select>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="w-full md:w-40 px-3 py-2.5 border border-gray-300
                     dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900
                     text-gray-900 dark:text-white capitalize focus:outline-none
                     focus:border-orange-500 cursor-pointer"
        >
          {GENRES.map((genre) => (
            <option key={genre} value={genre} className="capitalize">
              {genre}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium
                     hover:bg-orange-500 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {loading ? 'Ищем...' : 'Найти'}
        </button>
      </form>

      {/* Вывод сообщения об ошибке, если запрос не удался */}
      {error && (
        <div
          className="p-4 bg-red-50 dark:bg-red-950/50 text-red-600
                     dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* --- БЛОК 9: Сетка карточек фильмов и сериалов --- */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Ищем фильмы...</div>
      ) : filteredFilms.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-slate-800
                     bg-white/50 dark:bg-slate-900/40 rounded-xl p-12 text-center
                     text-gray-500 dark:text-slate-400"
        >
          {!isGuest && !isSearchMode
            ? 'Ваш личный каталог пока пуст. Найдите любой фильм или сериал через поиск выше и нажмите на карточку — он сохранится здесь.'
            : 'По выбранным фильтрам ничего не найдено.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredFilms.map((film) => {
            const title = film.title || film.nameRu || film.nameOriginal || 'Без названия';
            const poster = film.posterUrl || film.posterUrlPreview;
            const rating = film.ratingKp || film.ratingKinopoisk;
            const genresText = getGenresText(film.genres);

            return (
              <div
                key={film.kinopoiskId}
                onClick={() => handleOpenMovie(film)}
                className="cursor-pointer bg-white dark:bg-slate-900 border
                           border-gray-200 dark:border-slate-800 rounded-xl
                           overflow-hidden shadow-sm hover:shadow-md
                           hover:border-orange-500 transition-all flex flex-col relative group"
              >
                {/* Крестик удаления карточки из личного каталога */}
                {!isGuest && !isSearchMode && film.id && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveFromCatalog(e, film.id!)}
                    title="Убрать из моего каталога"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70
                               text-white text-sm flex items-center justify-center
                               opacity-0 group-hover:opacity-100 hover:bg-red-600
                               transition-opacity cursor-pointer z-10"
                  >
                    ×
                  </button>
                )}

                {/* Затемнение при загрузке страницы фильма */}
                {openingId === film.kinopoiskId && (
                  <div
                    className="absolute inset-0 bg-black/60 flex items-center
                               justify-center text-white font-medium text-sm z-20"
                  >
                    Открываем...
                  </div>
                )}

                {/* Постер фильма */}
                {poster ? (
                  <img src={poster} alt={title} className="w-full h-72 object-cover" />
                ) : (
                  <div
                    className="w-full h-72 bg-gray-200 dark:bg-slate-800
                               flex items-center justify-center text-gray-400"
                  >
                    Нет постера
                  </div>
                )}

                {/* Описание карточки: тип, год, название, жанры и рейтинг */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-semibold text-orange-600
                                   dark:text-orange-500 uppercase"
                      >
                        {film.type === 'TV_SERIES' ? 'Сериал' : 'Фильм'}
                      </span>
                      <span className="text-xs text-gray-400">{film.year || ''}</span>
                    </div>
                    <h2
                      className="font-bold text-base text-gray-900
                                 dark:text-slate-100 line-clamp-2 mt-1"
                    >
                      {title}
                    </h2>
                    {genresText && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 mt-1">
                        {genresText}
                      </p>
                    )}
                  </div>

                  {rating && (
                    <div
                      className="text-sm font-medium text-gray-700 dark:text-slate-300
                                 pt-2 border-t border-gray-100 dark:border-slate-800"
                    >
                      Рейтинг КП:{' '}
                      <span className="text-orange-600 dark:text-orange-400 font-bold">
                        {rating}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
