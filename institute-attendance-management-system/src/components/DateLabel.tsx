import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDateInPeru, getWeekdayInPeru } from '../utils/dateUtils';

type DateLabelFormat = 'iso' | 'short' | 'long';

interface DateLabelProps {
  date: string;
  format?: DateLabelFormat;
  className?: string;
  weekdayClassName?: string;
  dateClassName?: string;
}

const getFormattedDate = (date: string, format: DateLabelFormat) => {
  if (format === 'iso') return date.slice(0, 10);
  if (format === 'long') {
    return formatDateInPeru(date, { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return formatDateInPeru(date);
};

const DateLabel: React.FC<DateLabelProps> = ({
  date,
  format = 'iso',
  className = '',
  weekdayClassName = '',
  dateClassName = '',
}) => {
  const { showWeekdayLabels } = useApp();
  const formattedDate = getFormattedDate(date, format);

  if (!showWeekdayLabels) {
    return <span className={className}>{formattedDate}</span>;
  }

  return (
    <span className={`inline-flex flex-col leading-tight ${className}`}>
      <span className={`text-[10px] font-semibold uppercase tracking-wide text-muted-foreground capitalize ${weekdayClassName}`}>
        {getWeekdayInPeru(date)}
      </span>
      <span className={dateClassName}>{formattedDate}</span>
    </span>
  );
};

export default DateLabel;
