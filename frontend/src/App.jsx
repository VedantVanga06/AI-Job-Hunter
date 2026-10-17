import { useEffect, useState } from "react";
import "./App.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

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
  const [interviewPrep, setInterviewPrep] = useState(null);
  const [generatingInterviewPrep, setGeneratingInterviewPrep] = useState(false);
  const [showManualApplication, setShowManualApplication] = useState(false);
  const [manualCompany, setManualCompany] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualStatus, setManualStatus] = useState("Wishlist");
  const [manualNotes, setManualNotes] = useState("");
  const [savingManualApplication, setSavingManualApplication] = useState(false);
  const [editingNotes, setEditingNotes] = useState({});
  const [resumeImprovement, setResumeImprovement] = useState(null);
  const [improvingResume, setImprovingResume] = useState(false);
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
const handleImproveResume = async () => {
  setError("");
  setResumeImprovement(null);
  if (!resumeText.trim()) { setError("Please upload your resume first."); return; }
  setImprovingResume(true);
  try {
    const response = await fetch(API + "/api/improve-resume", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: resumeText }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Resume improvement failed.");
    setResumeImprovement(data);
  } catch (err) {
    setError(err.message || "Could not improve the resume. Check that the API is running.");
  } finally { setImprovingResume(false); }
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
      API + "/api/generate-cover-letter",
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

  const handleGenerateInterviewPrep = async () => {
    setError("");
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Upload your resume and enter a job description before generating interview prep.");
      return;
    }
    setGeneratingInterviewPrep(true);
    setInterviewPrep(null);
    try {
      const response = await fetch(API + "/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: resumeText, job_description: jobDescription, job_title: jobTitle, company_name: companyName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Interview preparation failed.");
      setInterviewPrep(data);
    } catch (err) { setError(err.message || "Could not generate interview preparation."); }
    finally { setGeneratingInterviewPrep(false); }
  };

  const handleManualApplicationSave = async (event) => {
    event.preventDefault();
    if (!manualCompany.trim() || !manualTitle.trim()) { setError("Company and job title are required."); return; }
    setSavingManualApplication(true); setError("");
    try {
      const response = await fetch(API + "/api/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: manualCompany.trim(), job_title: manualTitle.trim(), job_url: manualUrl.trim(), status: manualStatus, notes: manualNotes.trim(), match_score: 0 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not add application.");
      setApplications((items) => [data, ...items]);
      setManualCompany(""); setManualTitle(""); setManualUrl(""); setManualStatus("Wishlist"); setManualNotes(""); setShowManualApplication(false);
    } catch (err) { setError(err.message || "Could not add application."); }
    finally { setSavingManualApplication(false); }
  };

  const saveApplicationDetails = async (applicationId) => {
    const draft = editingNotes[applicationId];
    if (!draft) return;
    try {
      const response = await fetch(API + "/api/applications/" + applicationId, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draft.notes, job_url: draft.job_url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not save application details.");
      setApplications((items) => items.map((item) => item.id === applicationId ? data : item));
      setEditingNotes((items) => { const next = { ...items }; delete next[applicationId]; return next; });
    } catch (err) { setError(err.message || "Could not save application details."); }
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
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">J<span>H</span></div>
          <div className="brand-copy">
            <span className="brand-kicker">PERSONAL CAREER OS</span>
            <h1>AI Job Hunter</h1>
          </div>
          <div className="header-status"><span className="status-dot" /> AI WORKSPACE</div>
        </div>
        <div className="hero-copy">
          <p className="hero-overline">YOUR NEXT CHAPTER STARTS HERE</p>
          <h2>Make your next move<br /><span>your best one.</span></h2>
          <p className="hero-description">Understand your fit. Sharpen your story. Keep every opportunity moving forward.</p>
          <div className="hero-proof">
            <span><b>01</b> Resume intelligence</span>
            <span><b>02</b> Role matching</span>
            <span><b>03</b> Application tracking</span>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-ring orbit-ring-one" />
          <div className="orbit-ring orbit-ring-two" />
          <div className="orbit-core"><span>AI</span><small>CAREER<br />ENGINE</small></div>
          <span className="orbit-node orbit-node-one">CV</span>
          <span className="orbit-node orbit-node-two">↗</span>
          <span className="orbit-node orbit-node-three">✳</span>
        </div>
      </header>

      <main className="container">
        <div className="section-intro">
          <div><span className="section-index">01 / ANALYZE</span><h2>Start with your next opportunity</h2><p>Bring your resume and a role. We’ll help you see the match clearly.</p></div>
          <span className="private-note"><span>●</span> Your workspace</span>
        </div>
        <section className="input-grid">
          <div className="card resume-card">
            <div className="card-topline"><span className="step-number">01</span><span className="card-tag">YOUR STORY</span></div>
            <h2>Your resume</h2>
            <p className="card-description">Start with the experience and skills that make you, you.</p>
            <label className="upload-box">
              <input type="file" accept=".pdf,.docx" onChange={handleResumeUpload} />
              <span className="upload-symbol" aria-hidden="true">↑</span>
              <strong>{uploading ? "Reading your resume…" : resumeFile ? resumeFile.name : "Drop your resume here"}</strong>
              <span className="upload-hint">{resumeFile ? "Choose another file to replace it" : "or click to browse your files"}</span>
              <span className="file-format">PDF <i /> DOCX <i /> UP TO 10 MB</span>
            </label>
            {resumeText && <div className="success-message"><span className="success-dot">✓</span><div><strong>Resume ready to analyze</strong><span>{resumeText.length.toLocaleString()} characters extracted</span></div></div>}
          </div>
          <div className="card job-card">
            <div className="card-topline"><span className="step-number">02</span><span className="card-tag">THE OPPORTUNITY</span></div>
            <h2>Where do you want to go?</h2>
            <p className="card-description">Add the role details so we can compare what they need with what you bring.</p>
            <div className="job-details-inputs">
              <label><span>ROLE TITLE</span><input type="text" aria-label="Job title" placeholder="e.g. AI Engineer Intern" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} /></label>
              <label><span>COMPANY</span><input type="text" aria-label="Company name" placeholder="e.g. a team you admire" value={companyName} onChange={(event) => setCompanyName(event.target.value)} /></label>
            </div>
            <label className="description-label"><span>JOB DESCRIPTION</span><textarea className="job-input" aria-label="Job description" placeholder="Paste the job description here. Include responsibilities, skills, and qualifications…" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} /></label>
            <button className="analyze-button" onClick={handleAnalyze} disabled={analyzing || uploading || generatingCoverLetter}>
              <span>{analyzing ? "Analyzing your fit…" : "Analyze my match"}</span><span className="button-arrow">↗</span>
            </button>
            <p className="button-footnote">Thoughtful insights, not automated hiring decisions.</p>
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
{resumeText && (
  <section className="resume-improver-section">
    <div className="resume-improver-header">
      <div>
        <span className="resume-eyebrow">AI RESUME STUDIO</span>
        <h2>Improve your resume</h2>
        <p>Get practical, ATS-aware feedback grounded in your actual resume.</p>
      </div>
      <button className="improve-resume-button" onClick={handleImproveResume} disabled={improvingResume || uploading}>
        {improvingResume ? "Improving resume…" : "✨ Improve my resume"}
      </button>
    </div>
    {resumeImprovement && (
      <div className="resume-improvement-grid">
        <article className="improvement-card improvement-featured">
          <span className="improvement-label">PROFESSIONAL SUMMARY</span>
          <h3>Suggested summary</h3>
          <p>{resumeImprovement.professional_summary}</p>
          <button className="secondary-action" onClick={() => navigator.clipboard.writeText(resumeImprovement.professional_summary || "")}>Copy summary</button>
        </article>
        {[
          ["Skills to highlight", "skills_to_highlight"],
          ["Stronger bullet points", "improved_bullet_points"],
          ["Keywords to consider", "missing_keywords"],
          ["ATS improvements", "ats_improvements"],
          ["Project improvements", "project_improvements"],
          ["Priority recommendations", "recommendations"],
        ].map(([title, key]) => (
          <article className="improvement-card" key={key}>
            <h3>{title}</h3>
            {Array.isArray(resumeImprovement[key]) && resumeImprovement[key].length ? (
              <ul>{resumeImprovement[key].map((item, index) => <li key={index}>{item}</li>)}</ul>
            ) : <p className="muted-copy">No specific items returned.</p>}
          </article>
        ))}
      </div>
    )}
    <p className="resume-disclaimer">Review every suggestion before using it. Never add skills, experience, or achievements that are not true.</p>
  </section>
)}

<section className="interview-prep-panel">
  <div className="interview-prep-heading">
    <div><span className="resume-eyebrow">NEXT-ROUND READY</span><h2>Interview prep, tailored to this role</h2><p>Turn your resume and the job description into a focused practice plan.</p></div>
    <button className="improve-resume-button" onClick={handleGenerateInterviewPrep} disabled={generatingInterviewPrep || analyzing || uploading}>{generatingInterviewPrep ? "Building your prep…" : "Generate interview prep ↗"}</button>
  </div>
  {interviewPrep && <div className="interview-prep-grid">
    <article className="interview-prep-card interview-intro-card"><span className="improvement-label">YOUR 60-SECOND INTRO</span><p>{interviewPrep.introduction}</p><button className="secondary-action" onClick={() => navigator.clipboard.writeText(interviewPrep.introduction || "")}>Copy introduction</button></article>
    <article className="interview-prep-card"><h3>Technical practice</h3><ol>{(interviewPrep.technical_questions || []).map((item, index) => <li key={index}>{item}</li>)}</ol></article>
    <article className="interview-prep-card"><h3>HR & behavioural questions</h3><ol>{(interviewPrep.hr_questions || []).map((item, index) => <li key={index}>{item}</li>)}</ol></article>
    <article className="interview-prep-card"><h3>Preparation checklist</h3><ul>{(interviewPrep.preparation_tips || []).map((item, index) => <li key={index}>{item}</li>)}</ul></article>
  </div>}
</section>

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

          <div className="tracker-actions">
            <p className="tracker-helper">Track saved roles from your analysis or add opportunities you found elsewhere.</p>
            <button className="add-application-button" onClick={() => setShowManualApplication((value) => !value)}>{showManualApplication ? "− Close form" : "+ Add application"}</button>
          </div>
          {showManualApplication && <form className="manual-application-form" onSubmit={handleManualApplicationSave}>
            <div className="manual-form-heading"><span className="section-index">QUICK ADD</span><h3>Add an opportunity</h3><p>No AI analysis needed — save a job now and update it as you progress.</p></div>
            <div className="manual-form-grid">
              <label>Company<input value={manualCompany} onChange={(e) => setManualCompany(e.target.value)} placeholder="Company name" required /></label>
              <label>Job title<input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="e.g. Data Science Intern" required /></label>
              <label>Job URL<input type="url" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://…" /></label>
              <label>Current status<select value={manualStatus} onChange={(e) => setManualStatus(e.target.value)}><option>Wishlist</option><option>Saved</option><option>Applied</option><option>Assessment</option><option>Interview</option><option>Offer</option><option>Rejected</option><option>Withdrawn</option></select></label>
              <label className="manual-notes-field">Notes<textarea value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} placeholder="Deadline, contact person, follow-up date, or notes…" rows={3} /></label>
            </div>
            <button className="save-tracker-button" type="submit" disabled={savingManualApplication}>{savingManualApplication ? "Saving…" : "Save application"}</button>
          </form>}
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
    <option value="Wishlist">Wishlist</option>
    <option value="Saved">Saved</option>
    <option value="Applied">Applied</option>
    <option value="Assessment">Assessment</option>
    <option value="Interview">Interview</option>
    <option value="Offer">Offer</option>
    <option value="Rejected">Rejected</option>
    <option value="Withdrawn">Withdrawn</option>
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

                    {/* EDITABLE NOTES AND JOB LINK */}
                    <div className="application-notes application-edit-details">
                      {editingNotes[application.id] ? (
                        <>
                          <label>Job URL<input type="url" value={editingNotes[application.id].job_url} onChange={(e) => setEditingNotes((items) => ({ ...items, [application.id]: { ...items[application.id], job_url: e.target.value } }))} placeholder="https://…" /></label>
                          <label>Notes<textarea rows={3} value={editingNotes[application.id].notes} onChange={(e) => setEditingNotes((items) => ({ ...items, [application.id]: { ...items[application.id], notes: e.target.value } }))} placeholder="Follow-up date, recruiter, next steps…" /></label>
                          <div className="edit-actions"><button className="secondary-action" onClick={() => saveApplicationDetails(application.id)}>Save details</button><button className="secondary-action" onClick={() => setEditingNotes((items) => { const next = { ...items }; delete next[application.id]; return next; })}>Cancel</button></div>
                        </>
                      ) : (
                        <>
                          <span>Notes</span>
                          <p>{application.notes || "No notes added yet."}</p>
                          <button className="secondary-action" onClick={() => setEditingNotes((items) => ({ ...items, [application.id]: { notes: application.notes || "", job_url: application.job_url || "" } }))}>Edit notes & link</button>
                        </>
                      )}
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
