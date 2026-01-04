export const CHART_COLORS = {
  income: {
    background: 'rgba(16, 185, 129, 0.5)',
    border: 'rgba(16, 185, 129, 1)',
  },
  expense: {
    background: 'rgba(239, 68, 68, 0.5)',
    border: 'rgba(239, 68, 68, 1)',
  },
  savings: {
    background: 'rgba(59, 130, 246, 0.5)',
    border: 'rgba(59, 130, 246, 1)',
  },
  budget: {
    background: 'rgba(245, 158, 11, 0.5)',
    border: 'rgba(245, 158, 11, 1)',
  },
};

export const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'rgb(209, 213, 219)',
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      titleColor: 'rgb(243, 244, 246)',
      bodyColor: 'rgb(209, 213, 219)',
      borderColor: 'rgb(75, 85, 99)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(75, 85, 99, 0.2)',
      },
      ticks: {
        color: 'rgb(156, 163, 175)',
      },
    },
    y: {
      grid: {
        color: 'rgba(75, 85, 99, 0.2)',
      },
      ticks: {
        color: 'rgb(156, 163, 175)',
        callback: function(value: any) {
          return '$' + value.toLocaleString();
        },
      },
      beginAtZero: true,
    },
  },
};
