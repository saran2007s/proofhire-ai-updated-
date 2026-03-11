ProofHire AI – Intelligent Skill-Based Hiring System

ProofHire AI is an AI-powered recruitment platform that evaluates candidates based on real skill evidence instead of keyword-based resume filtering.

Traditional Applicant Tracking Systems (ATS) rely heavily on keyword matching, which often rejects skilled candidates simply because their resumes do not contain specific keywords. ProofHire AI solves this by analyzing resumes, GitHub activity, and job requirements using AI models to produce a data-driven candidate ranking.

Problem Statement

Modern recruitment systems rely on keyword-based Applicant Tracking Systems (ATS).

This creates several major problems:

Skilled candidates get rejected due to missing keywords

Recruiters cannot verify whether listed skills are real

Manual screening of GitHub and portfolios takes hours

Hiring decisions become slow and unreliable

There is a need for a system that evaluates actual technical ability instead of resume keywords.

Our Solution

ProofHire AI analyzes candidates using AI-based skill verification.

The system combines:

Resume skill extraction using NLP

GitHub developer activity analysis

Semantic matching with job descriptions

Candidate scoring and ranking

The result is an automated hiring intelligence platform that helps recruiters quickly identify the most capable candidates.

Key Features
Multi Resume Upload

Recruiters can upload multiple candidate resumes simultaneously.

AI Resume Parsing

Extracts candidate information including:

Name

Skills

GitHub username

Projects

Job Description Matching

Uses NLP and semantic similarity models to compare candidate skills with job requirements.

GitHub Developer Analysis

Fetches developer activity using the GitHub API:

Repository count

Stars

Languages used

Open-source contributions

Candidate Scoring Engine

Candidates are scored using multiple signals:

Resume skill match

GitHub activity

Coding platform performance (simulated)

Project relevance

Candidate Ranking

Candidates are automatically classified into:

Selected candidates

Rejected candidates

Analytics Dashboard

Recruiters can visualize candidate performance using graphs and score comparisons.

System Workflow

Recruiter uploads multiple resumes

Recruiter enters a job description

System extracts skills from resumes

GitHub developer activity is analyzed

AI compares candidate skills with job requirements

A scoring engine evaluates each candidate

Candidates are ranked automatically

Recruiter views results in a dashboard

Architecture Overview
Recruiter Dashboard
        │
        ▼
Resume Upload + Job Description
        │
        ▼
Resume Parsing (NLP)
        │
        ├── Skill Extraction
        ├── GitHub Data Fetch
        └── Coding Platform Data
        │
        ▼
Skill Matching Engine
        │
        ▼
Candidate Scoring System
        │
        ▼
Ranking & Classification
        │
        ▼
Visualization Dashboard
Tech Stack
Frontend

React.js

Tailwind CSS

Chart.js

Backend

Python

FastAPI

AI / NLP

spaCy

Sentence Transformers

Scikit-learn

External APIs

GitHub API

Storage

JSON / SQLite

Scoring Method

Candidate scores are calculated using weighted signals:

Final Score =
0.4 × Resume Skill Match
+ 0.3 × GitHub Activity
+ 0.2 × Coding Platform Score
+ 0.1 × Project Quality

Candidates with scores above the threshold are classified as selected.

Project Structure
proofhire-ai
│
├── backend
│   ├── main.py
│   ├── resume_parser.py
│   ├── github_analyzer.py
│   ├── skill_matcher.py
│   ├── scoring_engine.py
│
├── frontend
│   ├── dashboard
│   ├── upload page
│   └── visualization components
│
├── data
│   └── coding_profiles.csv
│
└── resumes
Installation
Prerequisites

Python 3.9+

Node.js

Clone the Repository
git clone https://github.com/yourusername/proofhire-ai.git
cd proofhire-ai
Install Backend Dependencies
pip install -r requirements.txt
Download NLP Model
python -m spacy download en_core_web_sm
Run Backend Server
uvicorn main:app --reload
Open API Documentation
http://127.0.0.1:8000/docs
Demo Workflow

Upload multiple resumes

Enter a job description

Click Analyze Candidates

System processes resumes using AI

View ranked candidates and analytics dashboard

Example Job Description
Looking for a Python developer with experience in Machine Learning,
NLP, TensorFlow, and backend API development.
Future Improvements

Integrate HackerRank / LeetCode APIs

Add real GitHub repository analysis

Improve AI skill extraction models

Add recruiter feedback learning loop

Deploy as a scalable SaaS platform

License

This project is built for hackathon demonstration and educational purposes.

Authors

Developed as part of a hackathon project.

ProofHire AI – Redefining developer hiring through AI-driven skill intelligence.
