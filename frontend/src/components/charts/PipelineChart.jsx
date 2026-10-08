import React from 'react';
import './ChartSetup';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';

export default function PipelineChart({ chartData }) {
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return <div className="text-center text-muted p-4">No pipeline data available</div>;
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Pipeline Value',
        data: chartData.amounts,
        backgroundColor: ['#60a5fa', '#3b82f6', '#1d4ed8', '#10b981', '#f87171'],
        borderRadius: 6,
        barPercentage: 0.6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (item) => ` Value: ${formatCurrency(item.raw)}` } }
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
    <div style={{ height: '260px' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
