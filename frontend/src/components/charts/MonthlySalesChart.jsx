import React from 'react';
import './ChartSetup';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';

export default function MonthlySalesChart({ chartData }) {
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return <div className="text-center text-muted p-4">No sales history available</div>;
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Closed Won Revenue',
        data: chartData.amounts,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
        pointRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (item) => ` Won Revenue: ${formatCurrency(item.raw)}` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (value) => `$${value >= 1000 ? value / 1000 + 'k' : value}`,
          font: { family: 'Plus Jakarta Sans', size: 11 }
        }
      }
    }
  };

  return (
    <div style={{ height: '240px' }}>
      <Line data={data} options={options} />
    </div>
  );
}
