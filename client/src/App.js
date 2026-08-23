import React, { useEffect, useState } from 'react';
import './styles.css';

function App() {
  const [problem, setProblem] = useState(null);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [allowView, setAllowView] = useState(false);
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/problem', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        setProblem(j);
        setAllowView(!!j.submitted);
        setLoading(false);
      })
      .catch(e => {
        setMessage('Failed to load problem');
        setLoading(false);
      });
  }, []);

  function submitAnswer(e) {
    e.preventDefault();
    if (!problem) return;
    fetch('http://localhost:4000/api/submit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId: problem.id, answer })
    }).then(r => r.json())
      .then(j => {
        setMessage(j.message || '');
        if (j.allowSolution) setAllowView(true);
      }).catch(() => setMessage('Submission failed'));
  }

  function viewSolution() {
    if (!problem) return;
    fetch(`http://localhost:4000/api/solution/${problem.id}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) return r.json().then(j => { throw new Error(j.error || 'Forbidden'); });
        return r.json();
      })
      .then(j => setSolution(j.solution))
      .catch(e => setMessage(e.message || 'Could not fetch solution'));
  }

  if (loading) return <div className="container">Loading...</div>;
  if (!problem) return <div className="container">No problem available.</div>;

  return (
    <div className="container">
      <h1>{problem.title}</h1>
      <div className="statement">{problem.statement}</div>

      <form onSubmit={submitAnswer} className="answer-form">
        <label>
          Your answer:
          <input value={answer} onChange={e => setAnswer(e.target.value)} />
        </label>
        <button type="submit">Submit Answer</button>
      </form>

      {message && <div className="message">{message}</div>}

      <div className="controls">
        <button onClick={viewSolution} disabled={!allowView}>
          View solution
        </button>
      </div>

      {solution && (
        <div className="solution">
          <h2>Official solution</h2>
          <div>{solution}</div>
        </div>
      )}
    </div>
  );
}

export default App;
