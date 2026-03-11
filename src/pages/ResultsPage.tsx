import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { Github, Code, FileText, Trophy, ExternalLink, Star, GitBranch } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Candidate {
  id: number;
  name: string;
  skills: string[];
  githubUsername: string | null;
  projects: string[];
  resumeMatchScore: number;
  githubScore: number;
  codingScore: number;
  projectQualityScore: number;
  finalScore: number;
  status: 'Selected' | 'Rejected';
  githubData: {
    repos: number;
    stars: number;
    languages: string[];
  };
}

export default function ResultsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/candidates')
      .then(res => res.json())
      .then(data => {
        setCandidates(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading candidates...</div>;
  }

  const selected = candidates.filter(c => c.status === 'Selected');
  const rejected = candidates.filter(c => c.status === 'Rejected');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Candidate Results</h2>
        <p className="text-zinc-500 mt-2">Ranked candidates based on AI analysis and skill verification.</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white">Selected</Badge>
            <span className="text-zinc-500 text-sm font-normal">({selected.length} candidates)</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selected.map(c => <CandidateCard key={c.id} candidate={c} />)}
            {selected.length === 0 && <p className="text-zinc-400 text-sm">No selected candidates.</p>}
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Badge variant="destructive">Rejected</Badge>
            <span className="text-zinc-500 text-sm font-normal">({rejected.length} candidates)</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rejected.map(c => <CandidateCard key={c.id} candidate={c} />)}
            {rejected.length === 0 && <p className="text-zinc-400 text-sm">No rejected candidates.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const scoreData = {
    labels: ['Resume (40%)', 'GitHub (30%)', 'Coding (20%)', 'Projects (10%)'],
    datasets: [
      {
        data: [
          candidate.resumeMatchScore * 0.4,
          candidate.githubScore * 0.3,
          candidate.codingScore * 0.2,
          candidate.projectQualityScore * 0.1
        ],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-zinc-300 transition-colors group">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg group-hover:text-emerald-600 transition-colors">
                {candidate.name}
              </CardTitle>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-zinc-900">{candidate.finalScore}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Score</span>
              </div>
            </div>
            {candidate.githubUsername && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <Github className="w-3 h-3" /> {candidate.githubUsername}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.skills.slice(0, 4).map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 4 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-zinc-400 border-zinc-200">
                  +{candidate.skills.length - 4}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-start pr-8">
            <div>
              <DialogTitle className="text-2xl">{candidate.name}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2">
                {candidate.githubUsername && (
                  <a 
                    href={`https://github.com/${candidate.githubUsername}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:underline"
                  >
                    <Github className="w-4 h-4" /> {candidate.githubUsername} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </DialogDescription>
            </div>
            <div className="text-center bg-zinc-50 rounded-lg p-3 border border-zinc-100">
              <div className="text-3xl font-bold text-zinc-900">{candidate.finalScore}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mt-1">Final Score</div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-zinc-500" /> Score Breakdown
              </h4>
              <div className="space-y-3">
                <ScoreBar label="Resume Match" score={candidate.resumeMatchScore} weight="40%" icon={<FileText className="w-4 h-4" />} color="bg-blue-500" />
                <ScoreBar label="GitHub Activity" score={candidate.githubScore} weight="30%" icon={<Github className="w-4 h-4" />} color="bg-emerald-500" />
                <ScoreBar label="Coding Platform" score={candidate.codingScore} weight="20%" icon={<Code className="w-4 h-4" />} color="bg-amber-500" />
                <ScoreBar label="Project Quality" score={candidate.projectQualityScore} weight="10%" icon={<Trophy className="w-4 h-4" />} color="bg-purple-500" />
              </div>
            </div>

            {candidate.githubData && candidate.githubData.repos !== undefined && (
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                  <Github className="w-4 h-4 text-zinc-500" /> GitHub Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                      {candidate.githubData.repos} <GitBranch className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="text-xs text-zinc-500">Repositories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                      {candidate.githubData.stars} <Star className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xs text-zinc-500">Total Stars</div>
                  </div>
                </div>
                {candidate.githubData.languages && candidate.githubData.languages.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-200">
                    <div className="text-xs text-zinc-500 mb-1.5">Top Languages</div>
                    <div className="flex flex-wrap gap-1">
                      {candidate.githubData.languages.slice(0, 5).map(lang => (
                        <Badge key={lang} variant="outline" className="text-[10px] py-0">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-3">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="font-medium text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-3">Projects</h4>
              <ul className="space-y-2">
                {candidate.projects.map((project, i) => (
                  <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
                    <span>{project}</span>
                  </li>
                ))}
                {candidate.projects.length === 0 && (
                  <p className="text-sm text-zinc-400 italic">No projects extracted.</p>
                )}
              </ul>
            </div>
            
            <div className="h-40 flex justify-center items-center">
              <Pie 
                data={scoreData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScoreBar({ label, score, weight, icon, color }: { label: string, score: number, weight: string, icon: React.ReactNode, color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
          {icon} {label} <span className="text-xs text-zinc-400 font-normal">({weight})</span>
        </div>
        <div className="text-sm font-bold">{score}/100</div>
      </div>
      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
