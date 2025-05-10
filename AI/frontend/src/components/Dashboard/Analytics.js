import { useEffect, useRef } from 'react';
import { FaChartLine, FaStar, FaHistory } from 'react-icons/fa';
import { Chart } from 'chart.js/auto';

const StatCard = ({ icon, title, value }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="flex items-center">
      <div className="p-3 bg-gray-100 rounded-full mr-4">
        {icon}
      </div>
      <div>
        <p className="text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

export default function Analytics({ evaluations = [] }) {
  const scoreChartRef = useRef(null);
  const progressChartRef = useRef(null);
  const scoreChartInstance = useRef(null);
  const progressChartInstance = useRef(null);

  // Process evaluations with proper validation
  const validEvaluations = evaluations
    .filter(e => e && !isNaN(Number(e.score)))
    .map(e => ({
      ...e,
      score: Math.max(0, Math.min(100, Number(e.score))),
      timestamp: e.timestamp || new Date().toISOString()
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Stats calculation
  const stats = {
    totalEvaluations: validEvaluations.length,
    averageScore: validEvaluations.length > 0
      ? (validEvaluations.reduce((sum, e) => sum + e.score, 0) / validEvaluations.length).toFixed(1)
      : '0.0',
    highestScore: validEvaluations.length > 0
      ? Math.max(...validEvaluations.map(e => e.score)).toFixed(1)
      : '0.0'
  };

  // Initialize or update charts
  useEffect(() => {
    // Destroy existing charts if they exist
    if (scoreChartInstance.current) {
      scoreChartInstance.current.destroy();
    }
    if (progressChartInstance.current) {
      progressChartInstance.current.destroy();
    }

    if (validEvaluations.length === 0 || !scoreChartRef.current || !progressChartRef.current) {
      return;
    }

    // Create Score Chart (Bar)
    scoreChartInstance.current = new Chart(scoreChartRef.current, {
      type: 'bar',
      data: {
        labels: validEvaluations.map((_, i) => `Q${i+1}`),
        datasets: [{
          label: 'Score',
          data: validEvaluations.map(e => e.score),
          backgroundColor: validEvaluations.map(e => 
            e.score >= 80 ? '#10B981' :
            e.score >= 50 ? '#F59E0B' : '#EF4444'
          ),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: value => `${value}%` }
          }
        }
      }
    });

    // Create Progress Chart (Line)
    progressChartInstance.current = new Chart(progressChartRef.current, {
      type: 'line',
      data: {
        labels: validEvaluations.map((_, i) => `Attempt ${i+1}`),
        datasets: [{
          label: 'Score Progress',
          data: validEvaluations.map(e => e.score),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: validEvaluations.map(e => 
            e.score >= 80 ? '#10B981' :
            e.score >= 50 ? '#F59E0B' : '#EF4444'
          ),
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: value => `${value}%` }
          }
        }
      }
    });

    // Cleanup function
    return () => {
      if (scoreChartInstance.current) {
        scoreChartInstance.current.destroy();
      }
      if (progressChartInstance.current) {
        progressChartInstance.current.destroy();
      }
    };
  }, [validEvaluations]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          icon={<FaChartLine className="text-blue-600 text-xl" />}
          title="Average Score"
          value={`${stats.averageScore}%`}
        />
        <StatCard 
          icon={<FaStar className="text-green-600 text-xl" />}
          title="Highest Score"
          value={`${stats.highestScore}%`}
        />
        <StatCard 
          icon={<FaHistory className="text-purple-600 text-xl" />}
          title="Total Evaluations"
          value={stats.totalEvaluations}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-4 rounded-lg h-80">
          <h3 className="font-bold mb-2">Question Scores</h3>
          <canvas ref={scoreChartRef} />
        </div>
        <div className="bg-white p-4 rounded-lg h-80">
          <h3 className="font-bold mb-2">Progress Over Time</h3>
          <canvas ref={progressChartRef} />
        </div>
      </div>

      {/* Recent Evaluations */}
      {validEvaluations.length > 0 && (
        <div className="bg-white p-4 rounded-lg">
          <h3 className="font-bold mb-2">Recent Evaluations</h3>
          <div className="space-y-3">
            {validEvaluations.slice(0, 5).map((e, i) => (
              <div key={`${e.timestamp}-${i}`} className="p-3 border-b last:border-b-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Question {i+1}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    e.score >= 80 ? 'bg-green-100 text-green-800' :
                    e.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {e.score}%
                  </span>
                </div>
                {e.feedback && (
                  <p className="text-sm text-gray-600 mt-1">{e.feedback}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(e.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}