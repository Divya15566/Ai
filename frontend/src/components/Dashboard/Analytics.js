import { Chart } from 'chart.js';
import { useEffect, useRef } from 'react';

export default function Analytics({ pdfs }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (pdfs.length > 0 && chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: pdfs.map(pdf => pdf.name),
          datasets: [{
            label: 'Pages Processed',
            data: pdfs.map(pdf => pdf.pageCount),
            backgroundColor: '#4F46E5'
          }]
        }
      });
    }
  }, [pdfs]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Learning Analytics</h2>
      <div className="bg-gray-50 p-4 rounded-lg">
        <canvas ref={chartRef} height="300"></canvas>
      </div>
    </div>
  );
}