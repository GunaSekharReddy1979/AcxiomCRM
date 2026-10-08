import React from 'react';
import './ChartSetup';
import { Doughnut } from 'react-chartjs-2';

export default function LeadStatusChart({ chartData }) {
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return <div className="text-center text-muted p-4">No lead data available</div>;
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.data,
        backgroundColor: ['#f59e0b', '#0ea5e9', '#3b82f6', '#64748b', '#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 12 }, padding: 14 }
      }
    },
    cutout: '68%'
  };

  return (
    <div style={{ height: '260px' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
