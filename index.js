const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { simplify, parse } = require('mathjs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: 'replace-with-your-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Load problems from JSON
const problemsPath = path.join(__dirname, 'problems.json');
const problems = JSON.parse(fs.readFileSync(problemsPath, 'utf8'));

/**
 * Choose today's problem by date (rotates through list).
 */
function todaysProblem() {
  if (!problems || problems.length === 0) return null;
  const start = new Date(2026, 0, 1); // fixed anchor to ensure stable rotation
  const now = new Date();
  const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const idx = days % problems.length;
  return problems[idx];
}

/**
 * Verification helpers
 */
function isNumericString(s) {
  if (s == null) return false;
  return !Number.isNaN(Number(s.trim()));
}

function verifyAnswer(problem, userAnswer) {
  const mode = problem.answerType || 'exact';
  const correct = problem.answer;
  try {
    if (mode === 'exact') {
      return userAnswer.trim().toLowerCase() === String(correct).trim().toLowerCase();
    }
    if (mode === 'regex') {
      const re = new RegExp(correct);
      return re.test(userAnswer);
    }
    if (mode === 'numeric') {
      // correct can be a number or an object {value, tolerance}
      let value, tol;
      if (typeof correct === 'object') {
        value = Number(correct.value);
        tol = Number(correct.tolerance || 1e-9);
      } else {
        value = Number(correct);
        tol = 1e-9;
      }
      if (!isNumericString(userAnswer)) return false;
      return Math.abs(Number(userAnswer) - value) <= tol;
    }
    if (mode === 'symbolic') {
      // Attempt to parse and simplify difference
      const a = parse(String(userAnswer));
      const b = parse(String(correct));
      // Create an expression that is a - b
      const diff = simplify(`${a.toString()} - (${b.toString()})`);
      const simplified = diff.toString();
      return simplified === '0';
    }
  } catch (e) {
    return false;
  }
  return false;
}

// API: get today's problem (with no answer)
app.get('/api/problem', (req, res) => {
  const p = todaysProblem();
  if (!p) return res.status(404).json({ error: 'No problems available' });
  const { id, title, statement, answerType } = p;
  res.json({
    id, title, statement, answerType,
    submitted: req.session.submittedProblems && req.session.submittedProblems.includes(id)
  });
});

// API: submit an answer
app.post('/api/submit', (req, res) => {
  const { problemId, answer } = req.body;
  const p = problems.find(x => x.id === problemId);
  if (!p) return res.status(404).json({ error: 'Problem not found' });

  const correct = verifyAnswer(p, String(answer || '').trim());
  if (!req.session.submittedProblems) req.session.submittedProblems = [];
  if (!req.session.submittedProblems.includes(problemId)) {
    req.session.submittedProblems.push(problemId);
  }
  res.json({
    correct,
    allowSolution: true,
    message: correct ? 'Correct!' : 'Incorrect. You may view the official solution now.'
  });
});

// API: get solution (only if session indicates submission)
app.get('/api/solution/:id', (req, res) => {
  const id = req.params.id;
  const p = problems.find(x => x.id === id);
  if (!p) return res.status(404).json({ error: 'Problem not found' });
  if (!req.session.submittedProblems || !req.session.submittedProblems.includes(id)) {
    return res.status(403).json({ error: 'Submit an answer before viewing the solution.' });
  }
  res.json({ solution: p.solution });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
