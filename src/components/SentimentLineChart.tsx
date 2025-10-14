import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface SentimentDay {
  date: string;
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export default function SentimentLineChart({ data }: { data: SentimentDay[] }) {
  const labels = data.map(d => d.date);
  const scores = data.map(d => d.score);
  const colors = data.map(d =>
    d.sentiment === 'positive' ? 'rgba(16,185,129,0.8)' :
    d.sentiment === 'negative' ? 'rgba(239,68,68,0.8)' :
    'rgba(100,116,139,0.7)'
  );
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'Score',
            data: scores,
            borderColor: colors,
            backgroundColor: colors,
            pointBackgroundColor: colors,
            pointBorderColor: colors,
            fill: false,
            tension: 0.3,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Score: ${ctx.parsed.y}`,
            },
          },
        },
        scales: {
          x: { title: { display: true, text: 'Date' } },
          y: { title: { display: true, text: 'Score' }, beginAtZero: true },
        },
      }}
    />
  );
}
