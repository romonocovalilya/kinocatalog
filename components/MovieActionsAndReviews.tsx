'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewItem {
  id: number;
  text: string;
  rating: number;
  createdAt: string;
  userId: number;
  user: { name: string };
}

interface Props {
  movieId: number;
  currentUserId: number | null;
  isAdmin: boolean;
  initialStatus: string | null;
  reviews: ReviewItem[];
}

export default function MovieActionsAndReviews({
  movieId,
  currentUserId,
  isAdmin,
  initialStatus,
  reviews,
}: Props) {
  const router = useRouter();

  // --- БЛОК 1: Состояния статуса библиотеки, формы нового отзыва и режима редактирования ---
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [rating, setRating] = useState(10);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- БЛОК 2: Изменение статуса фильма в личной библиотеке (PLANNED / WATCHED / REMOVE) ---
  const handleLibrary = async (newStatus: string) => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId, status: newStatus }),
    });

    if (res.ok) {
      setStatus(newStatus === 'REMOVE' ? null : newStatus);
      router.refresh();
    }
  };

  // --- БЛОК 3: Отправка нового отзыва (POST /api/reviews) ---
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, rating, text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка');
      } else {
        setText('');
        setRating(10);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // --- БЛОК 4: Сохранение отредактированного отзыва (PATCH /api/reviews/[id]) ---
  const handleUpdateReview = async (id: number) => {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText, rating: editRating }),
    });

    if (res.ok) {
      setEditingId(null);
      router.refresh();
    }
  };

  // --- БЛОК 5: Удаление отзыва автором или администратором (DELETE /api/reviews/[id]) ---
  const handleDeleteReview = async (id: number) => {
    const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  };
  return (
    <div className="space-y-8">
      {/* --- БЛОК 6: Кнопки управления статусом просмотра в библиотеке --- */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleLibrary('PLANNED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            status === 'PLANNED'
              ? 'bg-orange-600 text-white border-orange-600'
              : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 hover:border-orange-500'
          }`}
        >
          {status === 'PLANNED' ? '✓ В списке «Не просмотрено»' : '+ Буду смотреть'}
        </button>

        <button
          onClick={() => handleLibrary('WATCHED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            status === 'WATCHED'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 hover:border-emerald-500'
          }`}
        >
          {status === 'WATCHED' ? '✓ Просмотрено' : 'Отметить просмотренным'}
        </button>

        {status && (
          <button
            onClick={() => handleLibrary('REMOVE')}
            className="px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            Убрать из библиотеки
          </button>
        )}
      </div>

      {/* --- БЛОК 7: Форма добавления нового отзыва --- */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-slate-800">
        <h2 className="text-xl font-bold">Отзывы зрителей ({reviews.length})</h2>

        {currentUserId ? (
          <form
            onSubmit={handleCreateReview}
            className="bg-white dark:bg-slate-900 p-4 border border-gray-200
                       dark:border-slate-800 rounded-xl space-y-3"
          >
            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Ваша оценка (1–10):</label>
              <input
                type="number"
                min={1}
                max={10}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-20 px-3 py-1.5 border border-gray-300 dark:border-slate-700
                           rounded-lg bg-white dark:bg-slate-950"
              />
            </div>

            <textarea
              rows={3}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Напишите ваше впечатление о фильме или сериале..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700
                         rounded-lg bg-white dark:bg-slate-950"
            />

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm
                         font-medium hover:bg-orange-500 disabled:opacity-50"
            >
              {loading ? 'Публикация...' : 'Опубликовать отзыв'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Войдите в аккаунт, чтобы добавить в библиотеку или оставить отзыв.
          </p>
        )}

        {/* --- БЛОК 8: Список отзывов и рецензий с кнопками редактирования и удаления --- */}
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 bg-white dark:bg-slate-900 border border-gray-200
                         dark:border-slate-800 rounded-xl space-y-2"
            >
              {/* Шапка отзыва: имя автора, оценка и кнопки управления */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{rev.user.name}</span>
                  <span
                    className="px-2 py-0.5 text-xs font-bold bg-orange-100
                               dark:bg-orange-950 text-orange-700 dark:text-orange-400 rounded"
                  >
                    Оценка: {rev.rating}/10
                  </span>
                </div>

                {(currentUserId === rev.userId || isAdmin) && (
                  <div className="flex gap-2 text-xs">
                    {currentUserId === rev.userId && (
                      <button
                        onClick={() => {
                          setEditingId(rev.id);
                          setEditText(rev.text);
                          setEditRating(rev.rating);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Редактировать
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>

              {/* Режим редактирования отзыва или обычный вывод текста */}
              {editingId === rev.id ? (
                <div className="space-y-2 pt-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editRating}
                    onChange={(e) => setEditRating(Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-slate-700
                               rounded bg-white dark:bg-slate-950"
                  />
                  <textarea
                    rows={2}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300
                               dark:border-slate-700 rounded bg-white dark:bg-slate-950"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateReview(rev.id)}
                      className="px-3 py-1 bg-orange-600 text-white text-xs rounded"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 border border-gray-300 dark:border-slate-700
                                 text-xs rounded"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-slate-300">{rev.text}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
