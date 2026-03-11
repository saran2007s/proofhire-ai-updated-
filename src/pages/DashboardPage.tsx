import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Users, CheckCircle, XCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardStats {
  total: number;
  selected: number;
  rejected: number;
  topSkills: { name: string; count: number }[];
  topCandidates: { name: string; score: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div>Failed to load stats.</div>;
  }

  const statusData = {
    labels: ['Selected', 'Rejected'],
    datasets: [
      {
        data: [stats.selected, stats.rejected],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const skillsData = {
    labels: stats.topSkills.map(s => s.name),
    datasets: [
      {
        label: 'Candidates with skill',
        data: stats.topSkills.map(s => s.count),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
    ],
  };

  const candidatesData = {
    labels: stats.topCandidates.map(c => c.name),
    datasets: [
      {
        label: 'Final Score',
        data: stats.topCandidates.map(c => c.score),
        backgroundColor: stats.topCandidates.map(c => c.score >= 70 ? '#10b981' : '#ef4444'),
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-zinc-500 mt-2">Overview of candidate analysis and recruitment metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Selected</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.selected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Candidate Score Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.topCandidates.length > 0 ? (
              <Bar 
                data={candidatesData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true, max: 100 }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selection Ratio</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center h-[300px]">
            {stats.total > 0 ? (
              <Doughnut 
                data={statusData} 
                options={{ 
                  cutout: '70%',
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400">No data available</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Skills Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.topSkills.length > 0 ? (
              <Bar 
                data={skillsData} 
                options={{
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: { beginAtZero: true, ticks: { stepSize: 1 } }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
