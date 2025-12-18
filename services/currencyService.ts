/**
 * Конвертація валют за курсом НБУ.
 */

/**
 * Отримати курс валюти до гривні на конкретну дату.
 * @param currency Код валюти: 'USD' або 'EUR'
 * @param date Дата у форматі YYYY-MM-DD
 */
export const getNbuRateToUah = async (currency: 'USD' | 'EUR', date: string): Promise<number> => {
  const compactDate = date.replace(/-/g, '');
  const url = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${currency}&date=${compactDate}&json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('NBU API error');
  }

  const data = await res.json();
  if (!Array.isArray(data) || !data[0]?.rate) {
    throw new Error('NBU rate not found');
  }

  return data[0].rate as number;
};

export interface NbuRate {
  code: 'USD' | 'EUR';
  rate: number;
  date: string;
}

/**
 * Отримати поточні курси НБУ для кількох валют (сьогодні).
 */
export const getTodayNbuRates = async (codes: ('USD' | 'EUR')[]): Promise<NbuRate[]> => {
  const results: NbuRate[] = [];

  for (const code of codes) {
    const url = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${code}&json`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]?.rate) continue;

    results.push({
      code,
      rate: data[0].rate as number,
      date: data[0].exchangedate as string,
    });
  }

  return results;
};



