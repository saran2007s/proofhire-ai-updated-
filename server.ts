import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { initDb, getCandidates, getDashboardStats, addCandidate } from './src/lib/db.js';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize DB
initDb();

const upload = multer({ dest: 'uploads/' });

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/dashboard', (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/candidates', (req, res) => {
  try {
    const candidates = getCandidates();
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

app.post('/api/analyze', upload.array('resumes'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!jobDescription || !files || files.length === 0) {
      return res.status(400).json({ error: 'Job description and at least one resume file are required.' });
    }

    const results = [];

    for (const file of files) {
      try {
        const resumeText = fs.readFileSync(file.path, 'utf-8');
        
        // 1. Analyze with Gemini
        const prompt = `
        You are an expert technical recruiter and AI hiring assistant.
        Analyze the following resume against the provided job description.
        
        Job Description:
        ${jobDescription}
        
        Resume:
        ${resumeText}
        
        Extract the following information and return it strictly as a JSON object (no markdown formatting, just the raw JSON):
        {
          "name": "Candidate's full name",
          "skills": ["skill1", "skill2", ...],
          "githubUsername": "Candidate's GitHub username if found, otherwise null",
          "projects": ["Project 1 name/description", "Project 2 name/description", ...],
          "resumeMatchScore": A number from 0 to 100 representing how well the resume matches the job description,
          "projectQualityScore": A number from 0 to 100 representing the quality and relevance of the projects
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Candidate's full name" },
              skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of skills" },
              githubUsername: { type: Type.STRING, description: "GitHub username if found, otherwise empty string" },
              projects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of projects" },
              resumeMatchScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
              projectQualityScore: { type: Type.NUMBER, description: "Score from 0 to 100" }
            }
          }
        }
      });

      let jsonText = response.text || '{}';
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const extractedData = JSON.parse(jsonText);
      
      // 2. Fetch GitHub Data (if username exists)
      let githubScore = 0;
      let githubData = { repos: 0, stars: 0, languages: [] as string[] };
      
      if (extractedData.githubUsername && extractedData.githubUsername !== 'null' && extractedData.githubUsername.trim() !== '') {
        try {
          const userRes = await fetch(`https://api.github.com/users/${extractedData.githubUsername}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            const reposRes = await fetch(`https://api.github.com/users/${extractedData.githubUsername}/repos?per_page=100`);
            let stars = 0;
            const languages = new Set<string>();
            
            if (reposRes.ok) {
              const reposData = await reposRes.json();
              reposData.forEach((repo: any) => {
                stars += repo.stargazers_count;
                if (repo.language) languages.add(repo.language);
              });
            }
            
            githubData = {
              repos: userData.public_repos,
              stars,
              languages: Array.from(languages)
            };
            
            // Calculate GitHub score (simplified heuristic)
            githubScore = Math.min(100, (userData.public_repos * 2) + (stars * 5));
          }
        } catch (error) {
          console.error('Error fetching GitHub data:', error);
        }
      }

      // 3. Coding Platform Score (Simulated for hackathon)
      const codingScore = Math.floor(Math.random() * 41) + 60; // Random between 60-100

      // 4. Calculate Final Score
      // 0.4 × Resume Skill Match + 0.3 × GitHub Score + 0.2 × Coding Platform Score + 0.1 × Project Quality
      const resumeScore = extractedData.resumeMatchScore || 0;
      const projectScore = extractedData.projectQualityScore || 0;
      
      const finalScore = Math.round(
        (0.4 * resumeScore) +
        (0.3 * githubScore) +
        (0.2 * codingScore) +
        (0.1 * projectScore)
      );

      const status = finalScore >= 70 ? 'Selected' : 'Rejected';

      const candidate = {
        name: extractedData.name || 'Unknown',
        skills: JSON.stringify(extractedData.skills || []),
        githubUsername: extractedData.githubUsername,
        projects: JSON.stringify(extractedData.projects || []),
        resumeMatchScore: resumeScore,
        githubScore,
        codingScore,
        projectQualityScore: projectScore,
        finalScore,
        status,
        githubData: JSON.stringify(githubData)
      };

      // Save to DB
      const savedCandidate = addCandidate(candidate);
      results.push(savedCandidate);
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
      } finally {
        // Clean up uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({ success: true, candidates: results });
  } catch (error) {
    console.error('Error analyzing resumes:', error);
    res.status(500).json({ error: 'An error occurred during analysis.' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
