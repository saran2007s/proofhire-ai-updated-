import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../database.sqlite');

let db: Database.Database;

export function initDb() {
  db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      skills TEXT,
      githubUsername TEXT,
      projects TEXT,
      resumeMatchScore INTEGER,
      githubScore INTEGER,
      codingScore INTEGER,
      projectQualityScore INTEGER,
      finalScore INTEGER,
      status TEXT,
      githubData TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function addCandidate(candidate: any) {
  const stmt = db.prepare(`
    INSERT INTO candidates (
      name, skills, githubUsername, projects, resumeMatchScore, 
      githubScore, codingScore, projectQualityScore, finalScore, status, githubData
    ) VALUES (
      @name, @skills, @githubUsername, @projects, @resumeMatchScore,
      @githubScore, @codingScore, @projectQualityScore, @finalScore, @status, @githubData
    )
  `);
  
  const info = stmt.run(candidate);
  return { id: info.lastInsertRowid, ...candidate };
}

export function getCandidates() {
  const stmt = db.prepare('SELECT * FROM candidates ORDER BY finalScore DESC');
  return stmt.all().map((c: any) => ({
    ...c,
    skills: JSON.parse(c.skills || '[]'),
    projects: JSON.parse(c.projects || '[]'),
    githubData: JSON.parse(c.githubData || '{}')
  }));
}

export function getDashboardStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM candidates').get() as { count: number };
  const selected = db.prepare('SELECT COUNT(*) as count FROM candidates WHERE status = ?').get('Selected') as { count: number };
  const rejected = db.prepare('SELECT COUNT(*) as count FROM candidates WHERE status = ?').get('Rejected') as { count: number };
  
  // Get all skills for distribution
  const allCandidates = getCandidates();
  const skillCounts: Record<string, number> = {};
  
  allCandidates.forEach(c => {
    c.skills.forEach((skill: string) => {
      const s = skill.toLowerCase().trim();
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    });
  });
  
  // Sort and get top 10 skills
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topCandidates = allCandidates.slice(0, 10).map(c => ({
    name: c.name,
    score: c.finalScore
  }));

  return {
    total: total.count,
    selected: selected.count,
    rejected: rejected.count,
    topSkills,
    topCandidates
  };
}
