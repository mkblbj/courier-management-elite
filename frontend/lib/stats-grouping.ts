export type StatisticsGroupBy = 'day' | 'week' | 'month' | 'year';

const ENGLISH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const isEnglishLocale = (locale?: string): boolean => {
  return locale === 'en' || locale === 'English';
};

const isJapaneseLocale = (locale?: string): boolean => {
  return locale === 'ja' || locale === '日本語';
};

export const getGroupedDateSortValue = (dateLabel: string, groupBy: StatisticsGroupBy): number => {
  switch (groupBy) {
    case 'week': {
      const [year, week] = dateLabel.split('-').map(Number);
      return year * 100 + week;
    }
    case 'month': {
      const [year, month] = dateLabel.split('-').map(Number);
      return year * 100 + month;
    }
    case 'year':
      return Number(dateLabel);
    case 'day':
    default:
      return new Date(`${dateLabel}T00:00:00`).getTime();
  }
};

export const formatGroupedDateLabel = (
  dateLabel: string,
  groupBy: StatisticsGroupBy,
  options?: {
    compact?: boolean;
    locale?: string;
  }
): string => {
  const compact = options?.compact ?? false;
  const locale = options?.locale;

  switch (groupBy) {
    case 'week': {
      const [year, week] = dateLabel.split('-');

      if (isEnglishLocale(locale)) {
        return compact ? `W${week}` : `Week ${week}, ${year}`;
      }

      if (isJapaneseLocale(locale)) {
        return compact ? `${week}週` : `${year}年第${week}週`;
      }

      return compact ? `第${week}周` : `${year}年第${week}周`;
    }
    case 'month': {
      const [year, month] = dateLabel.split('-');
      const monthIndex = Math.max(0, Number(month) - 1);

      if (isEnglishLocale(locale)) {
        const monthLabel = ENGLISH_MONTHS[monthIndex] || month;
        return compact ? monthLabel : `${monthLabel} ${year}`;
      }

      if (isJapaneseLocale(locale)) {
        return compact ? `${month}月` : `${year}年${month}月`;
      }

      return compact ? `${month}月` : `${year}年${month}月`;
    }
    case 'year':
      return isEnglishLocale(locale) ? dateLabel : `${dateLabel}年`;
    case 'day':
    default: {
      if (!compact) {
        return dateLabel;
      }

      const [, month, day] = dateLabel.split('-');
      return month && day ? `${month}-${day}` : dateLabel;
    }
  }
};

export const getGroupedDateSecondaryLabel = (
  dateLabel: string,
  groupBy: StatisticsGroupBy
): string | undefined => {
  if (groupBy === 'week' || groupBy === 'month') {
    return dateLabel.split('-')[0];
  }

  return undefined;
};

export const getWeekdayKey = (dateLabel: string): string | null => {
  if (!dateLabel) {
    return null;
  }

  const date = new Date(`${dateLabel}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return weekdays[date.getDay()] || null;
};
