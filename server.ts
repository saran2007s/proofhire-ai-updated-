import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { initDb, getCandidates, getDashboardStats, addCandidate } from './src/lib/db.js';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize DB
initDb();

const upload = multer({ dest: 'uploads/' });

// Initialize Gemini
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
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
  console.log('Received /api/analyze request');
  try {
    const { jobDescription } = req.body;
    const files = req.files as Express.Multer.File[];
    
    console.log('Job Description:', jobDescription ? 'Provided' : 'Missing');
    console.log('Files:', files ? files.length : 0);

    if (!jobDescription || !files || files.length === 0) {
      console.log('Validation failed');
      return res.status(400).json({ error: 'Job description and at least one resume file are required.' });
    }

    const results = [];

    const processFile = async (file: Express.Multer.File) => {
      console.log(`Processing file: ${file.originalname}`);
      try {
        const resumeText = fs.readFileSync(file.path, 'utf-8');
        console.log(`Read file ${file.originalname}, length: ${resumeText.length}`);
        
        const prompt = `
        You are an expert technical recruiter and AI hiring assistant.
        Analyze the following resume text against the provided job description.
        The text may contain ONE OR MORE resumes. Extract the information for EACH candidate found in the text.
        
        Job Description:
        ${jobDescription}
        
        Resume Text:
        ${resumeText}
        
        Extract the following information and return it strictly as a JSON array of objects (no markdown formatting, just the raw JSON array).
        Each object should have:
        {
          "name": "Candidate's full name",
          "skills": ["skill1", "skill2", ...],
          "githubUsername": "Candidate's GitHub username if found, otherwise an empty string",
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
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Candidate's full name" },
                skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of skills" },
                githubUsername: { type: Type.STRING, description: "GitHub username if found, otherwise empty string" },
                projects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of projects" },
                resumeMatchScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
                projectQualityScore: { type: Type.NUMBER, description: "Score from 0 to 100" }
              },
              required: ["name", "skills", "projects", "resumeMatchScore", "projectQualityScore"]
            }
          }
        }
      });

      let jsonText = response.text || '[]';
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const extractedCandidates = JSON.parse(jsonText);
      
      if (!Array.isArray(extractedCandidates)) {
        console.error('Expected an array of candidates, got:', typeof extractedCandidates);
        return;
      }

      for (const extractedData of extractedCandidates) {
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
      }
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
      } finally {
        // Clean up uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    };

    await Promise.all(files.map(processFile));

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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler to ensure JSON responses for API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Express error:', err);
    if (req.path.startsWith('/api/')) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    } else {
      next(err);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
