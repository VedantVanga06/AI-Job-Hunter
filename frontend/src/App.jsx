import { useState } from "react";
import "./App.css";

function App() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeJob = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      setError("Please enter both your resume and the job description.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: resume,
          job_description: jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze the job.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        "Could not connect to the backend. Make sure FastAPI is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>AI Job Hunter</h1>
        <p>Resume → Job Match → Career Insights</p>
      </header>

      <main className="container">
        <section className="input-section">
          <div className="input-card">
            <h2>Your Resume</h2>
            <p>Paste your resume below</p>

            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume here..."
            />
          </div>

          <div className="input-card">
            <h2>Job Description</h2>
            <p>Paste the job description below</p>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
            />
          </div>
        </section>

        <button
          className="analyze-button"
          onClick={analyzeJob}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze My Match"}
        </button>

        {error && <div className="error">{error}</div>}

        {result && (
          <section className="results">
            <h2>Job Match Result</h2>

            <div className="score">
              <span>{result.match_score}</span>
              <small>/ 100</small>
            </div>

            <div className="result-card">
              <h3>Summary</h3>
              <p>{result.summary}</p>
            </div>

            <div className="result-card">
              <h3>💪 Strengths</h3>
              <ul>
                {result.strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="result-card">
              <h3>⚠️ Missing Skills</h3>
              <ul>
                {result.missing_skills.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="result-card">
              <h3>💡 Suggestions</h3>
              <ul>
                {result.suggestions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
