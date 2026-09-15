import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  // ================================
  // RESUME + JOB ANALYSIS
  // ================================

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingApplication, setSavingApplication] = useState(false);
const [coverLetter, setCoverLetter] = useState("");
const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // ================================
  // APPLICATION TRACKER
  // ================================

  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // ================================
  // APPLICATION DASHBOARD STATISTICS
  // ================================
  const totalApplications = applications.length;

  const appliedApplications = applications.filter(
    (app) => app.status === "Applied",
  ).length;

  const interviewApplications = applications.filter(
    (app) => app.status === "Interview",
  ).length;

  const offerApplications = applications.filter(
    (app) => app.status === "Offer",
  ).length;

  const rejectedApplications = applications.filter(
    (app) => app.status === "Rejected",
  ).length;

  const averageMatchScore =
    applications.length > 0
      ? Math.round(
          applications.reduce(
            (total, app) => total + Number(app.match_score || 0),
            0,
          ) / applications.length,
        )
      : 0;
// =========================================
// SEARCH / FILTER / SORT
// =========================================
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [sortOption, setSortOption] = useState("Newest");

const filteredApplications = [...applications]
  .filter((app) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      app.job_title?.toLowerCase().includes(search) ||
      app.company?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  })
  .sort((a, b) => {
    if (sortOption === "Highest Match") {
      return Number(b.match_score || 0) - Number(a.match_score || 0);
    }

    if (sortOption === "Lowest Match") {
      return Number(a.match_score || 0) - Number(b.match_score || 0);
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
  // ================================
  // LOAD APPLICATIONS
  // ================================

  const loadApplications = async () => {
    setLoadingApplications(true);

    try {
      const response = await fetch(`${API}/api/applications`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load applications");
      }

      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Application loading error:", err);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // ================================
  // RESUME UPLOAD
  // ================================

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setResumeFile(file);
    setError("");
    setResult(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API}/api/upload-resume`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload and read the resume.");
      }

      setResumeText(data.text || "");

      if (!data.text) {
        setError(
          "Resume uploaded, but no readable text was found in the file.",
        );
      }
    } catch (err) {
      setError(err.message);
      setResumeText("");
    } finally {
      setUploading(false);
    }
  };

  // ================================
  // ANALYZE JOB
  // ================================

  const handleAnalyze = async () => {
    setError("");
    setResult(null);

    if (!resumeText.trim()) {
      setError("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setAnalyzing(true);

    try {
      const response = await fetch(`${API}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: resumeText,
          job_description: jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "AI analysis failed. Please try again.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };
const handleGenerateCoverLetter = async () => {
  setError("");

  if (!resumeText) {
    setError("Please upload your resume first.");
    return;
  }

  if (!jobDescription.trim()) {
    setError("Please enter a job description first.");
    return;
  }

  setGeneratingCoverLetter(true);
  setCoverLetter("");

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/generate-cover-letter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: resumeText,
          job_description: jobDescription,
          job_title: jobTitle,
          company_name: companyName,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to generate cover letter.");
    }

    setCoverLetter(data.cover_letter);
  } catch (err) {
    setError(err.message);
  } finally {
    setGeneratingCoverLetter(false);
  }
};
  // ================================
  // SAVE ANALYZED JOB
  // ================================

  const saveToTracker = async () => {
    setError("");

    if (!result) {
      setError("Please analyze the job first.");
      return;
    }

    if (!jobTitle.trim()) {
      setError("Please enter the job title.");
      return;
    }

    if (!companyName.trim()) {
      setError("Please enter the company name.");
      return;
    }

    setSavingApplication(true);

    try {
      const response = await fetch(`${API}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_title: jobTitle,
          company: companyName,
          status: "Applied",
          match_score: Number(result.match_score) || 0,
          job_url: "",
          notes: result.summary || "Saved from AI Job Hunter analysis.",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save application.");
      }

      await loadApplications();

      alert("✅ Job saved to your Application Tracker!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingApplication(false);
    }
  };

  // ================================
  // UPDATE APPLICATION STATUS
  // ================================

  const updateStatus = async (applicationId, newStatus) => {
    try {
      const currentApplication = applications.find(
        (application) => application.id === applicationId,
      );

      if (!currentApplication) return;

      const response = await fetch(`${API}/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_title: currentApplication.job_title,
          company: currentApplication.company,
          status: newStatus,
          match_score: currentApplication.match_score,
          job_url: currentApplication.job_url || "",
          notes: currentApplication.notes || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update application.");
      }

      setApplications((previous) =>
        previous.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status: newStatus,
              }
            : application,
        ),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // ================================
  // DELETE APPLICATION
  // ================================

  const deleteApplication = async (applicationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/api/applications/${applicationId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete application.");
      }

      setApplications((previous) =>
        previous.filter((application) => application.id !== applicationId),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // ================================
  // SCORE LABEL
  // ================================

  const getScoreLabel = (score) => {
    const value = Number(score) || 0;

    if (value >= 85) return "Excellent Match";
    if (value >= 70) return "Strong Match";
    if (value >= 50) return "Moderate Match";
    return "Low Match";
  };

  // ================================
  // SAFE ARRAY
  // ================================

  const safeArray = (value) => {
    return Array.isArray(value) ? value : [];
  };

  // ================================
  // UI
  // ================================

  return (
    <div className="app">
      {/* =================================
          HEADER
      ================================= */}

      <header className="header">
        <div>
          <h1>AI Job Hunter</h1>

          <p>Turn your resume into a smarter job application.</p>
        </div>
      </header>

      <main className="container">
        {/* =================================
            INPUT SECTION
        ================================= */}

        <section className="input-grid">
          {/* RESUME */}

          <div className="card">
            <h2>📄 Your Resume</h2>

            <p className="card-description">Upload your PDF or DOCX resume.</p>

            <label className="upload-box">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleResumeUpload}
              />

              {uploading ? (
                <span>⏳ Reading your resume...</span>
              ) : resumeFile ? (
                <span>✅ {resumeFile.name}</span>
              ) : (
                <span>Click to upload PDF or DOCX</span>
              )}
            </label>

            {resumeText && (
              <div className="success-message">
                ✓ Resume successfully extracted
                <span>
                  {resumeText.length.toLocaleString()} characters detected
                </span>
              </div>
            )}
          </div>

          {/* JOB DESCRIPTION */}

          <div className="card">
            <h2>💼 Job Description</h2>

            <p className="card-description">
              Enter the job details and paste the job description.
            </p>

            <div className="job-details-inputs">
              <input
                type="text"
                placeholder="Job Title (e.g. AI/ML Engineer Intern)"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
              />

              <input
                type="text"
                placeholder="Company (e.g. Google)"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </div>

            <textarea
              className="job-input"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
            />

            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={analyzing || uploading || generatingCoverLetter}
            >
              {analyzing ? "⏳ Analyzing..." : "Analyze My Match →"}
            </button>
          </div>
        </section>

        {/* =================================
            ERROR
        ================================= */}

        {error && <div className="error-message">⚠️ {error}</div>}

        {/* =================================
            AI RESULTS
        ================================= */}

        {result && (
          <section className="results">
            <div className="result-header">
              <div>
                <h2>Job Match Analysis</h2>

                <p className="card-description">
                  AI-powered analysis of your resume against this job.
                </p>
              </div>

              <div className="score">
                <span>{result.match_score ?? 0}</span>

                <small>/ 100</small>

                <strong>{getScoreLabel(result.match_score)}</strong>
              </div>
            </div>

            <div className="result-grid">
              {/* SUMMARY */}

              <div className="result-card summary-card">
                <h3>📝 Summary</h3>

                <p>{result.summary || "No summary was returned by the AI."}</p>
              </div>

              {/* MATCHED SKILLS */}

              <div className="result-card">
                <h3>💪 Matched Skills</h3>

                {safeArray(result.matched_skills || result.strengths).length >
                0 ? (
                  <ul>
                    {safeArray(result.matched_skills || result.strengths).map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p>No matched skills listed.</p>
                )}
              </div>

              {/* MISSING SKILLS */}

              <div className="result-card">
                <h3>⚠️ Missing Skills</h3>

                {safeArray(result.missing_skills).length > 0 ? (
                  <ul>
                    {safeArray(result.missing_skills).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>🎉 No major missing skills identified.</p>
                )}
              </div>

              {/* ATS KEYWORDS */}

              <div className="result-card">
                <h3>🔑 ATS Keywords</h3>

                {safeArray(result.ats_keywords).length > 0 ? (
                  <ul>
                    {safeArray(result.ats_keywords).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No ATS keywords returned.</p>
                )}
              </div>

              {/* RESUME IMPROVEMENTS */}

              <div className="result-card">
                <h3>📄 Resume Improvements</h3>

                {safeArray(result.resume_improvements || result.improvements)
                  .length > 0 ? (
                  <ul>
                    {safeArray(
                      result.resume_improvements || result.improvements,
                    ).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No resume improvements returned.</p>
                )}
              </div>

              {/* SUGGESTIONS */}

              <div className="result-card">
                <h3>🚀 Suggestions</h3>

                {safeArray(result.suggestions).length > 0 ? (
                  <ul>
                    {safeArray(result.suggestions).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No additional suggestions returned.</p>
                )}
              </div>
            </div>

            {/* SAVE TO TRACKER */}

            <div className="save-tracker-box">
              <button
                className="save-tracker-button"
                onClick={saveToTracker}
                disabled={savingApplication}
              >
                {savingApplication
                  ? "⏳ Saving..."
                  : "📋 Save This Job to Tracker"}
              </button>
            </div>
          </section>
        )}
<div className="cover-letter-box">
  <button
    className="cover-letter-button"
    onClick={handleGenerateCoverLetter}
    disabled={generatingCoverLetter || analyzing}
  >
    {generatingCoverLetter
      ? "✍️ Generating..."
      : "✍️ Generate Cover Letter"}
  </button>

  {coverLetter && (
    <div className="cover-letter-result">
      <h3>✉️ Your Personalized Cover Letter</h3>

      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        className="cover-letter-text"
      />

      <button
        className="copy-cover-letter"
        onClick={() => navigator.clipboard.writeText(coverLetter)}
      >
        📋 Copy Cover Letter
      </button>
    </div>
  )}
</div>
        {/* =================================
            APPLICATION TRACKER
        ================================= */}

        <section className="tracker">
          <div className="tracker-header">
            <div>
              <h2>📋 Application Tracker</h2>

              <p className="card-description">
                Keep track of every job application in one place.
              </p>
              {/* ================================
    APPLICATION DASHBOARD
================================ */}
<div className="dashboard-stats">

    <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-value">{totalApplications}</div>
        <div className="stat-label">Total Applications</div>
    </div>

    <div className="stat-card">
        <div className="stat-icon">📝</div>
        <div className="stat-value">{appliedApplications}</div>
        <div className="stat-label">Applied</div>
    </div>

    <div className="stat-card">
        <div className="stat-icon">🎤</div>
        <div className="stat-value">{interviewApplications}</div>
        <div className="stat-label">Interviews</div>
    </div>

    <div className="stat-card">
        <div className="stat-icon">🎉</div>
        <div className="stat-value">{offerApplications}</div>
        <div className="stat-label">Offers</div>
    </div>

    <div className="stat-card">
        <div className="stat-icon">🎯</div>
        <div className="stat-value">{averageMatchScore}%</div>
        <div className="stat-label">Average Match</div>
    </div>

</div>
            </div>

            <div className="application-count">
              {applications.length}{" "}
              {applications.length === 1 ? "Application" : "Applications"}
            </div>
          </div>

          {/* =================================
              APPLICATION LIST
          ================================= */}

          <div className="applications-list">
            <div className="applications-list-header">
              <h3>Your Applications</h3>
{/* =========================================
    SEARCH / FILTER / SORT CONTROLS
========================================= */}
<div className="application-controls">

  <input
    type="text"
    className="application-search"
    placeholder="🔎 Search company or job title..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <select
    className="application-filter"
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="All">All Statuses</option>
    <option value="Applied">Applied</option>
    <option value="Interview">Interview</option>
    <option value="Offer">Offer</option>
    <option value="Rejected">Rejected</option>
  </select>

  <select
    className="application-filter"
    value={sortOption}
    onChange={(e) => setSortOption(e.target.value)}
  >
    <option value="Newest">Newest</option>
    <option value="Highest Match">Highest Match</option>
    <option value="Lowest Match">Lowest Match</option>
  </select>

</div>
              <button
                className="refresh-button"
                onClick={loadApplications}
                disabled={loadingApplications}
              >
                {loadingApplications ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            {loadingApplications ? (
              <div className="empty-state">
                <div className="empty-icon">⏳</div>

                <h3>Loading applications...</h3>
              </div>
            ) : applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>

                <h3>No applications yet</h3>

                <p>Analyze a job and save it here.</p>
              </div>
            ) : (
              <div className="applications-grid">
                {filteredApplications.map((application) => (
                  <div className="application-card" key={application.id}>
                    {/* TOP */}

                    <div className="application-top">
                      <div>
                        <h3>{application.job_title}</h3>

                        <p className="company-name">{application.company}</p>
                      </div>

                      <div className="mini-score">
                        {application.match_score ?? 0}%
                      </div>
                    </div>

                    {/* DETAILS */}

                    <div className="application-details">
                      {/* STATUS */}

                      <div>
                        <span>Status</span>

                        <select
                          value={application.status || "Applied"}
                          onChange={(event) =>
                            updateStatus(application.id, event.target.value)
                          }
                        >
                          <option value="Wishlist">Wishlist</option>

                          <option value="Applied">Applied</option>

                          <option value="Interview">Interview</option>

                          <option value="Offer">Offer</option>

                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      {/* JOB LINK */}

                      <div>
                        <span>Job Link</span>

                        {application.job_url ? (
                          <a
                            href={application.job_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Job →
                          </a>
                        ) : (
                          <span>No link</span>
                        )}
                      </div>
                    </div>

                    {/* NOTES */}

                    <div className="application-notes">
                      <span>Notes</span>

                      <p>{application.notes || "No notes added."}</p>
                    </div>

                    {/* DELETE */}

                    <button
                      className="delete-button"
                      onClick={() => deleteApplication(application.id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
