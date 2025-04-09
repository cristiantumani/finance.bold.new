import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSwitcherProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export default function MonthSwitcher({ selectedDate, onChange }: MonthSwitcherProps) {
  const handlePreviousMonth = () => {
    onChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    onChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePreviousMonth}
        className="p-2 text-dark-400 hover:text-dark-200 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-dark-100 font-medium">
        {formatMonthYear(selectedDate)}
      </span>
      <button
        onClick={handleNextMonth}
        className="p-2 text-dark-400 hover:text-dark-200 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}