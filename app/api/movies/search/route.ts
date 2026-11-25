import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Извлечение параметров поиска из адресной строки (название, год, тип)
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const year = searchParams.get('year')?.trim() || '';
  const type = searchParams.get('type')?.trim() || 'ALL';

  // Если ничего не введено, возвращает пустой массив
  if (!query && !year) {
    return NextResponse.json([]);
  }

  try {
    // 2. Составление параметра для запроса к внешнему Kinopoisk API Unofficial
    const apiParams = new URLSearchParams();
    if (query) apiParams.set('keyword', query);
    if (year) {
      apiParams.set('yearFrom', year);
      apiParams.set('yearTo', year);
    }
    if (type !== 'ALL') {
      apiParams.set('type', type);
    }
    apiParams.set('order', 'NUM_VOTE');
    apiParams.set('page', '1');

    // 3. Отправка запроса на Кинопоиск с сервера, скрывая секретный ключ в заголовке
    const res = await fetch( `https://kinopoiskapiunofficial.tech/api/v2.2/films?${apiParams.toString()}`,
      {
        headers: {
          'X-API-KEY': process.env.KINOPOISK_API_KEY || '',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Ошибка при обращении к API Кинопоиска' },
        { status: res.status }
      );
    }

    // 4. Фильтрация карточки без постера и возвращение результата клиенту
    const data = await res.json();
    const items = (data.items || []).filter(
      (item: { posterUrlPreview?: string }) =>
        item.posterUrlPreview && !item.posterUrlPreview.includes('no-poster')
    );

    return NextResponse.json(items);
  } catch (err) {
    console.error('ОШИБКА ПОИСКА:', err);
    return NextResponse.json({ error: 'Не удалось выполнить поиск' }, { status: 500 });
  }
}
