'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Square, AlertCircle, AlertTriangle, CheckCircle, Info, 
  ChevronRight, Download, Filter, HelpCircle, FileText, Check, ShieldAlert, ShieldCheck,
  Server, Laptop, Sparkles, ArrowRight, Gauge, Activity, Compass, Settings, ChevronDown, ChevronUp, Network, CornerDownRight, GitCompare,
  Sun, Moon, X, Brain, Wrench, ExternalLink, Globe, Upload, Database, TrendingUp, Layers, Table, Map, Search
} from 'lucide-react';

export default function AioPage() {
  const router = useRouter();

  // Theme & Authentication States
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, setUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'credentials' | 'permissions'>('credentials');
  const [authEmail, setAuthEmail] = useState('developer@gmail.com');
  const [authName, setAuthName] = useState('NextJS Developer');
  
  // AIO Configuration States
  const [brandName, setBrandName] = useState('');
  const [brandIndustry, setBrandIndustry] = useState('');
  const [brandCompetitors, setBrandCompetitors] = useState('');
  const [brandUrl, setBrandUrl] = useState('');
  const [selectedAioEngines, setSelectedAioEngines] = useState<string[]>(['chatgpt', 'gemini', 'claude', 'perplexity', 'copilot']);
  const [isScanningAio, setIsScanningAio] = useState(false);
  const [aioProgress, setAioProgress] = useState(0);
  const [aioStatusMessage, setAioStatusMessage] = useState('');
  const [aioResults, setAioResults] = useState<any | null>(null);
  const [selectedAioPromptId, setSelectedAioPromptId] = useState<string | null>(null);

  // Monetization & Quota states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [abuseBlockMessage, setAbuseBlockMessage] = useState('');
  const [hardwareFingerprint, setHardwareFingerprint] = useState('');
  const [globalScanCount, setGlobalScanCount] = useState(0);
  const [userPlan, setUserPlan] = useState<'Free Tier' | 'Pro (100 Scans)' | 'Pro (500 Scans)' | 'Pro (1000 Scans)' | 'Ultimate (Infinite)'>('Free Tier');

  // Device Fingerprint
  const getDeviceFingerprint = () => {
    if (typeof window === 'undefined') return 'DEV_HW_MOCK';
    try {
      const screenVal = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
      const lang = navigator.languages ? navigator.languages.join(',') : navigator.language;
      const ua = navigator.userAgent;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("HydraSEO_Fingerprint_v1", 2, 15);
      }
      const canvasHash = canvas.toDataURL().slice(-100);
      return btoa(`${screenVal}|${lang}|${ua.slice(0, 30)}|${canvasHash}`).slice(0, 32);
    } catch {
      return 'FALLBACK_HW_ID';
    }
  };

  // Sync Preferences on Mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('hydraseo_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const fp = getDeviceFingerprint();
    setHardwareFingerprint(fp);

    const localDb = localStorage.getItem('hydraseo_fingerprint_db');
    let scansUsed = 0;
    if (localDb) {
      try {
        const parsed = JSON.parse(localDb);
        if (parsed[fp]) {
          scansUsed = parsed[fp].totalScans || 0;
        }
      } catch {}
    }
    setGlobalScanCount(scansUsed);

    const savedUser = localStorage.getItem('hydraseo_active_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        const storedPlan = localStorage.getItem(`hydraseo_user_plan_${parsedUser.email}`) as any;
        if (storedPlan) {
          setUserPlan(storedPlan);
        }

        const syncedScans = localStorage.getItem(`hydraseo_user_scans_${parsedUser.email}`);
        if (syncedScans) {
          setGlobalScanCount(Number(syncedScans));
        }
      } catch {}
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('hydraseo_theme', newTheme);
  };

  const handleLogin = () => {
    if (authStep === 'credentials') {
      setAuthStep('permissions');
      return;
    }

    const newUser = {
      name: authName,
      email: authEmail,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${authEmail}`
    };

    setUser(newUser);
    setShowAuthModal(false);
    setAuthStep('credentials');

    localStorage.setItem('hydraseo_active_user', JSON.stringify(newUser));

    const email = newUser.email;
    const isOwner = email.toLowerCase().includes('perini') || email.toLowerCase().includes('loopaloop');
    const planStr = isOwner ? 'Ultimate (Infinite)' : 'Free Tier';
    setUserPlan(planStr);
    localStorage.setItem(`hydraseo_user_plan_${email}`, planStr);

    const storedScans = localStorage.getItem(`hydraseo_user_scans_${email}`);
    if (storedScans) {
      setGlobalScanCount(Number(storedScans));
    } else {
      localStorage.setItem(`hydraseo_user_scans_${email}`, '0');
      setGlobalScanCount(0);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUserPlan('Free Tier');
    localStorage.removeItem('hydraseo_active_user');
    localStorage.removeItem('nvms_active_user');
  };

  const startAioScan = async () => {
    if (!brandName || !brandIndustry) return;

    const fp = hardwareFingerprint || getDeviceFingerprint();
    const currentLimit = userPlan === 'Ultimate (Infinite)' ? Infinity : 
                         userPlan === 'Pro (100 Scans)' ? 100 : 
                         userPlan === 'Pro (500 Scans)' ? 500 : 
                         userPlan === 'Pro (1000 Scans)' ? 1000 : 
                         1;

    if (globalScanCount >= currentLimit) {
      if (userPlan === 'Free Tier') {
        setAbuseBlockMessage(`You have reached the free scan limit (1 scan). Please sign in with Google and upgrade to a Pro plan to continue.`);
        setShowAuthModal(true);
        setAuthStep('credentials');
      } else {
        setAbuseBlockMessage(`You have exhausted your active plan allowance of ${currentLimit} scans. Please purchase a new package.`);
        setShowUpgradeModal(true);
      }
      return;
    }

    setIsScanningAio(true);
    setAioProgress(5);
    setAioResults(null);
    setSelectedAioPromptId(null);
    setAioStatusMessage('Initializing crawler and AIO simulator...');

    try {
      const progressSteps = [
        { progress: 15, msg: 'Analyzing semantics and crawling target website...' },
        { progress: 35, msg: 'Simulating search engine queries on ChatGPT-4o...' },
        { progress: 55, msg: 'Evaluating rank positioning and citations on Gemini 1.5 Pro...' },
        { progress: 75, msg: 'Analyzing sentiment and semantic profiles on Claude 3.5 Sonnet...' },
        { progress: 90, msg: 'Compiling AIO strategic action checklist and Share of Voice metrics...' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAioProgress(step.progress);
        setAioStatusMessage(step.msg);
      }

      const response = await fetch('/api/aioAnalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          industry: brandIndustry,
          competitors: brandCompetitors,
          url: brandUrl,
          engines: selectedAioEngines
        })
      });

      if (!response.ok) {
        throw new Error(`AIO API returned status ${response.status}`);
      }

      const data = await response.json();

      setAioProgress(100);
      setAioStatusMessage('AIO analysis successfully completed!');
      setAioResults(data);
      setSelectedAioPromptId(data.prompts?.[0]?.id || null);

      const nextCount = globalScanCount + 1;
      setGlobalScanCount(nextCount);

      if (user) {
        fetch('/api/syncUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, action: 'updateScans', scans_used: nextCount })
        }).catch(err => console.error("Neon DB Sync Error", err));
        localStorage.setItem(`hydraseo_user_scans_${user.email}`, String(nextCount));
      }

      let latestFpDb: Record<string, { totalScans: number; emails: string[] }> = {};
      const currentDb = localStorage.getItem('hydraseo_fingerprint_db');
      if (currentDb) {
        try { latestFpDb = JSON.parse(currentDb); } catch {}
      }
      const machineData = latestFpDb[fp] || { totalScans: 0, emails: [] };
      machineData.totalScans = Math.max(machineData.totalScans + 1, nextCount);
      if (user && !machineData.emails.includes(user.email)) {
        machineData.emails.push(user.email);
      }
      latestFpDb[fp] = machineData;
      localStorage.setItem('hydraseo_fingerprint_db', JSON.stringify(latestFpDb));

      if (typeof document !== 'undefined') {
        const cookieExpiry = new Date();
        cookieExpiry.setFullYear(cookieExpiry.getFullYear() + 2);
        document.cookie = `hydraseo_usage_${fp}=${machineData.totalScans}; expires=${cookieExpiry.toUTCString()}; path=/; SameSite=Lax`;
      }

    } catch (err: any) {
      console.error(err);
      setAioStatusMessage(`AIO analysis error: ${err.message || 'Server error'}`);
    } finally {
      setIsScanningAio(false);
    }
  };

  const handlePurchase = (plan: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setUserPlan(plan as any);
    localStorage.setItem(`hydraseo_user_plan_${user.email}`, plan);
    setShowUpgradeModal(false);
    alert(`Success! Your account has been upgraded to ${plan}.`);
  };

  return (
    <div className="container">
      {/* Header Panel */}
      <header className="header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <Brain size={32} style={{ color: 'var(--accent)' }} />
            HydraSEO <span style={{ fontSize: '0.85rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(31, 164, 232, 0.1)', color: 'var(--accent)' }}>AI Presence Audit</span>
          </h1>
          <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
            Discover how AI platforms describe, position, and talk about your brand online.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={toggleTheme} 
            style={{ padding: '0 0.75rem', width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} style={{ color: 'var(--accent)' }} /> : <Moon size={18} style={{ color: 'var(--accent)' }} />}
          </button>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-secondary)', padding: '0.4rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--accent)' }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{user.email}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '0.5rem', padding: '0.4rem 1.25rem', fontSize: '0.75rem', borderRadius: '9999px', color: 'var(--danger)', border: '1.5px solid var(--danger)', height: '32px' }}>
                Log Out
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1.5rem', borderRadius: '9999px', fontSize: '0.8rem', backgroundColor: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', height: '36px' }}>
              Sign Up / Sign In with Google
            </button>
          )}
        </div>
      </header>

      {/* Navigation Switcher */}
      <div className="mode-selector" style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        padding: '0.4rem',
        borderRadius: '9999px',
        maxWidth: 'fit-content',
        boxShadow: 'var(--shadow-1)',
        alignItems: 'center'
      }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '9999px', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
          <Wrench size={14} />
          Technical SEO Scan
        </button>
        <button onClick={() => router.push('/aio')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '9999px', backgroundColor: 'var(--accent)', color: '#0a0e15', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
          <Brain size={14} />
          AI Presence Audit (AIO)
        </button>
        <button onClick={() => router.push('/geo')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '9999px', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
          <Globe size={14} />
          GEO Lens
        </button>
      </div>

      {/* AIO Config Card */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          <Brain size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>AI Presence & Brand Search Configuration (AIO)</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Discover how AI platforms (from ChatGPT to Gemini) position and talk about your brand online.
            </p>
          </div>
        </div>

        <div className="grid-mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Brand Name</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. HydraSEO"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={isScanningAio}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Official Website</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. https://hydraseo.com (optional)"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
              disabled={isScanningAio}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Sector / Product Category</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. SEO Tools, SaaS, E-commerce..."
              value={brandIndustry}
              onChange={(e) => setBrandIndustry(e.target.value)}
              disabled={isScanningAio}
            />
          </div>
        </div>

        <div className="grid-mobile-stack-row-end" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Main Competitors (comma separated)</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. Screaming Frog, Ahrefs, Semrush"
              value={brandCompetitors}
              onChange={(e) => setBrandCompetitors(e.target.value)}
              disabled={isScanningAio}
            />
          </div>
          <button 
            className="btn" 
            onClick={startAioScan}
            disabled={!brandName || !brandIndustry || isScanningAio}
            style={{ height: '48px', gap: '0.5rem', borderRadius: '9999px', padding: '0 2.25rem', backgroundColor: 'var(--success)', color: '#0a0e15', boxShadow: '0 4px 12px rgba(122, 194, 112, 0.25)' }}
          >
            {isScanningAio ? (
              <>
                <Square size={16} fill="currentColor" />
                Analyzing...
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                Start AI Analysis
              </>
            )}
          </button>
        </div>

        {/* Engine Checkboxes */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            AI Models & LLMs to Query
          </label>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'chatgpt', name: 'ChatGPT (GPT-4o)' },
              { id: 'gemini', name: 'Gemini (1.5 Pro)' },
              { id: 'claude', name: 'Claude (3.5 Sonnet)' },
              { id: 'perplexity', name: 'Perplexity AI' },
              { id: 'copilot', name: 'Microsoft Copilot' }
            ].map(engine => (
              <label key={engine.id} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedAioEngines.includes(engine.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAioEngines([...selectedAioEngines, engine.id]);
                    } else {
                      setSelectedAioEngines(selectedAioEngines.filter(id => id !== engine.id));
                    }
                  }}
                  disabled={isScanningAio}
                />
                {engine.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* AIO Progress Loader */}
      {isScanningAio && (
        <div className="card" style={{ borderLeft: '4px solid var(--success)', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Brain className="animate-pulse" size={16} style={{ color: 'var(--success)' }} />
              AI Presence & Brand Search Optimization Audit in progress...
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{aioProgress}%</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${aioProgress}%`, background: 'linear-gradient(90deg, var(--success), var(--accent))' }}></div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'monospace', marginTop: '0.5rem' }}>
            {aioStatusMessage}
          </p>
        </div>
      )}

      {/* AIO Results Dashboard */}
      {aioResults && (
        <div style={{ marginTop: '2rem' }}>
          <div className="card" style={{ borderLeft: '4px solid var(--success)', background: 'linear-gradient(135deg, rgba(122,194,112,0.05) 0%, rgba(16,22,34,1) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Brain size={22} style={{ color: 'var(--success)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI Presence & Narrative Audit Results</h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Brand indexation, narrative analysis, sentiment positioning, and recommendations derived from LLM queries.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Brand: <strong>{aioResults.brandName}</strong></span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
            <div className="stat-card" style={{ borderTop: '4px solid var(--success)' }}>
              <span className="value" style={{ color: 'var(--success)' }}>{aioResults.shareOfVoice}%</span>
              <span className="label">Brand Share of Voice (SoV)</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Citations in industry prompts</span>
            </div>
            <div className="stat-card" style={{ borderTop: '4px solid var(--accent)' }}>
              <span className="value" style={{ color: 'var(--accent)' }}>{aioResults.sentimentScore}/100</span>
              <span className="label">AI Sentiment Index</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Semantic polarity evaluation</span>
            </div>
            <div className="stat-card" style={{ borderTop: '4px solid var(--warning)' }}>
              <span className="value" style={{ color: 'var(--warning)' }}>{aioResults.citationsCount}</span>
              <span className="label">Direct Product References</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Citations across analyzed models</span>
            </div>
            <div className="stat-card" style={{ borderTop: '4px solid #a855f7' }}>
              <span className="value" style={{ color: '#c084fc' }}>{aioResults.sentimentStatus}</span>
              <span className="label">Overall Brand Positioning</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Core narrative classification</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {/* Share of Voice details */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} style={{ color: 'var(--success)' }} />
                Share of Voice per AI Engine
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {aioResults.engineSoV.map((engine: any) => (
                  <div key={engine.engine}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{engine.engine}</span>
                      <span>{engine.sov}% ({engine.citations} citations)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${engine.sov}%`, height: '100%', backgroundColor: 'var(--success)', borderRadius: '9999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Narrative Profiles */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} style={{ color: 'var(--accent)' }} />
                Core Semantic Narrative Profiles
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Dominant attributes and descriptions generated by LLM descriptions:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {aioResults.narratives.map((nar: any) => (
                  <div key={nar.concept} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{nar.concept}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{nar.frequency}% occurrence frequency</p>
                    </div>
                    <span className={`badge ${nar.sentiment === 'positive' ? 'badge-ok' : nar.sentiment === 'neutral' ? 'badge-warning' : 'badge-critical'}`}>
                      {nar.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prompts table */}
          <div className="card" style={{ marginTop: '2rem', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Evaluated Generative Search Queries</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Select a query from the list to read the exact response content and citation structure.
              </p>
            </div>

            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Query Concept / Prompt</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Cites Brand?</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Position / Rank</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Competitors Mentioned</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Sentiment</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {aioResults.prompts.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>"{p.prompt}"</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className={`badge ${p.citesBrand ? 'badge-ok' : 'badge-critical'}`}>
                          {p.citesBrand ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace' }}>{p.rankPosition !== 'N/A' ? `#${p.rankPosition}` : 'N/A'}</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{p.mentionedCompetitors.join(', ') || 'None'}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className={`badge ${p.sentiment === 'positive' ? 'badge-ok' : p.sentiment === 'neutral' ? 'badge-warning' : 'badge-critical'}`}>
                          {p.sentiment}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => setSelectedAioPromptId(p.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details view for selected prompt */}
          {selectedAioPromptId && (() => {
            const promptDetails = aioResults.prompts.find((p: any) => p.id === selectedAioPromptId);
            if (!promptDetails) return null;
            return (
              <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  Detailed Response analysis for "{promptDetails.prompt}"
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cites Brand</span>
                    <p style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{promptDetails.citesBrand ? 'YES' : 'NO'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rank Position</span>
                    <p style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>#{promptDetails.rankPosition}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sentiment Index</span>
                    <p style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{promptDetails.sentiment.toUpperCase()}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Category</span>
                    <p style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{promptDetails.category}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Generated AI Response Fragment:</span>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '0.875rem', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                    "{promptDetails.responseHtml}"
                  </div>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Extracted Citation / Semantic Anchor:</span>
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(31, 164, 232, 0.05)', border: '1px solid rgba(31, 164, 232, 0.15)', borderRadius: '12px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--accent)' }}>
                    {promptDetails.citationsFound || "None"}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action checklist */}
          <div className="card" style={{ borderLeft: '4px solid var(--success)', marginTop: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <Sparkles size={18} style={{ color: 'var(--success)' }} />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AIO Strategic Optimization Actions</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Perform these technical optimizations to maximize narrative indexing and brand Share of Voice across generative systems.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {aioResults.recommendations.map((rec: any, idx: number) => (
                <div key={idx} style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ backgroundColor: 'rgba(122, 194, 112, 0.1)', color: 'var(--success)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem' }}>{idx + 1}</span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{rec.action}</h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{rec.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="drawer-backdrop" onClick={() => setShowUpgradeModal(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '480px', maxWidth: '90%', borderRadius: '24px', padding: '2rem', textAlign: 'center', border: '1px solid var(--border)' }}>
            <Sparkles size={48} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Anti-Abuse Scan Limit Reached</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {abuseBlockMessage || 'Upgrade to a premium plan to perform advanced SEO and generative discovery scans.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn" onClick={() => handlePurchase('Pro (100 Scans)')} style={{ backgroundColor: 'var(--accent)', color: '#0a0e15', width: '100%', height: '44px', borderRadius: '9999px' }}>
                Upgrade to Pro (100 Scans) - $19
              </button>
              <button className="btn btn-secondary" onClick={() => handlePurchase('Pro (500 Scans)')} style={{ width: '100%', height: '44px', borderRadius: '9999px' }}>
                Upgrade to Pro (500 Scans) - $49
              </button>
              <button className="btn btn-secondary" onClick={() => setShowUpgradeModal(false)} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="drawer-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '440px', maxWidth: '90%', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
              {authStep === 'credentials' ? 'Sign In / Register' : 'Permissions Request'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '1.4' }}>
              {authStep === 'credentials' 
                ? 'Use your email address to register or authenticate.' 
                : 'HydraSEO wants to view user profile details and register email authentication keys.'}
            </p>

            {authStep === 'credentials' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Full Name</label>
                  <input type="text" className="input" value={authName} onChange={(e) => setAuthName(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Email Address</label>
                  <input type="email" className="input" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
                  <li>Associate hardware device signatures to {authEmail}</li>
                  <li>Unlock 10 complimentary scanner trials</li>
                  <li>Store sitemap crawl histories</li>
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'stretch' }}>
              <button className="btn btn-secondary" onClick={() => setShowAuthModal(false)} style={{ flex: 1, borderRadius: '9999px' }}>
                Cancel
              </button>
              <button className="btn" onClick={handleLogin} style={{ flex: 1, backgroundColor: 'var(--accent)', color: '#0a0e15', borderRadius: '9999px' }}>
                {authStep === 'credentials' ? 'Next' : 'Accept & Login'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
