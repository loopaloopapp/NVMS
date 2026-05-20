'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Square, AlertCircle, AlertTriangle, CheckCircle, Info, 
  ChevronRight, Download, Filter, HelpCircle, FileText, Check, ShieldAlert, ShieldCheck,
  Server, Laptop, Sparkles, ArrowRight, Gauge, Activity, Compass, Settings, ChevronDown, ChevronUp, Network, CornerDownRight, GitCompare,
  Sun, Moon, X, Brain, Wrench, ExternalLink, Globe, Upload, Database, TrendingUp, Layers, Table, Map, Search
} from 'lucide-react';

export default function GeoPage() {
  const router = useRouter();

  // Theme & Authentication States
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, setUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'credentials' | 'permissions'>('credentials');
  const [authEmail, setAuthEmail] = useState('developer@gmail.com');
  const [authName, setAuthName] = useState('NextJS Developer');

  // GEO Configuration States
  const [brandName, setBrandName] = useState('HydraSEO');
  const [brandCompetitors, setBrandCompetitors] = useState('Semrush');
  const [geoQueriesInput, setGeoQueriesInput] = useState('');
  const [geoGscFileName, setGeoGscFileName] = useState('');
  const [isScanningGeo, setIsScanningGeo] = useState(false);
  const [geoProgress, setGeoProgress] = useState(0);
  const [geoStatusMessage, setGeoStatusMessage] = useState('');
  const [geoResults, setGeoResults] = useState<any | null>(null);
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [geoFilterGap, setGeoFilterGap] = useState('all');
  const [geoSiteUrl, setGeoSiteUrl] = useState('');
  const [isFetchingKeywords, setIsFetchingKeywords] = useState(false);

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

  const startGeoScan = async () => {
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

    setIsScanningGeo(true);
    setGeoProgress(5);
    setGeoResults(null);
    setGeoStatusMessage('Initializing GSC query mapping and engine crawl...');

    try {
      const progressSteps = [
        { progress: 15, msg: 'Importing queries and matching organic positions...' },
        { progress: 40, msg: 'Crawling Perplexity, ChatGPT, and Gemini for direct citations...' },
        { progress: 65, msg: 'Extracting semantic entities (brands, pricing, authors)...' },
        { progress: 85, msg: 'Calculating GEO Gap Index coefficients and recommended actions...' },
        { progress: 95, msg: 'Finalizing organic vs generative visibility matrix...' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setGeoProgress(step.progress);
        setGeoStatusMessage(step.msg);
      }

      const response = await fetch('/api/geoAnalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: geoQueriesInput,
          brandName: brandName || 'HydraSEO',
          competitor: brandCompetitors.split(',')[0] || 'Semrush'
        })
      });

      if (!response.ok) {
        throw new Error(`GEO API returned status ${response.status}`);
      }

      const data = await response.json();

      setGeoProgress(100);
      setGeoStatusMessage('GEO Lens analysis completed successfully!');
      setGeoResults(data);

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
      setGeoStatusMessage(`GEO analysis error: ${err.message || 'Server error'}`);
    } finally {
      setIsScanningGeo(false);
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

  const exportToPdf = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGeoGscFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split(/\r?\n/);
      let queriesList: string[] = [];
      let queryColIdx = 0;
      
      if (lines.length > 0) {
        const firstLineCells = lines[0].split(',').map(c => c.trim().toLowerCase().replace(/"/g, ''));
        const foundIdx = firstLineCells.findIndex(cell => cell.includes('query') || cell.includes('keyword') || cell.includes('parola'));
        if (foundIdx !== -1) {
          queryColIdx = foundIdx;
        }
      }
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        let cells: string[] = [];
        if (line.includes('"')) {
          cells = (line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []).map(c => c.replace(/"/g, ''));
        } else {
          cells = line.split(',');
        }
        
        const q = cells[queryColIdx]?.trim();
        if (q && q !== '' && isNaN(Number(q))) {
          queriesList.push(q);
        }
      }
      
      if (queriesList.length === 0) {
        queriesList = lines.map(line => {
          const cells = line.split(',');
          return cells[0]?.replace(/"/g, '').trim();
        }).filter(q => q && q.length > 0 && isNaN(Number(q)));
      }
      
      setGeoQueriesInput(queriesList.join('\n'));
    };
    reader.readAsText(file);
  };

  const handleCsvTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleLoadSampleQueries = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGeoGscFileName('sample_queries.csv');
    setGeoQueriesInput(
      'best cloud platform for startup\n' +
      'best edge compute databases\n' +
      'how to optimize metadata for LLM crawlers\n' +
      'hydraseo vs semrush pricing comparison\n' +
      'ai presence search tools review'
    );
  };

  return (
    <div className="container">
      {/* Header Panel */}
      <header className="header print-exclude">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <Globe size={32} style={{ color: 'var(--accent)' }} />
            HydraSEO <span style={{ fontSize: '0.85rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(31, 164, 232, 0.1)', color: 'var(--accent)' }}>GEO Lens</span>
          </h1>
          <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
            Compare organic search visibility with brand citation presence inside Generative Engines.
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
      <div className="mode-selector print-exclude" style={{
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
        <button onClick={() => router.push('/aio')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '9999px', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
          <Brain size={14} />
          AI Presence Audit (AIO)
        </button>
        <button onClick={() => router.push('/geo')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '9999px', backgroundColor: 'var(--accent)', color: '#0a0e15', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
          <Globe size={14} />
          GEO Lens
        </button>
      </div>

      {/* GEO Lens Input Form Card */}
      {geoResults ? (
        <div className="card print-exclude" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--accent)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GEO Lens Target Brand</span>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{brandName || 'Audited Brand'} vs {brandCompetitors || 'Competitors'}</strong>
          </div>
          <button className="btn btn-secondary" onClick={() => setGeoResults(null)} style={{ borderRadius: '9999px', fontSize: '0.75rem', height: '36px' }}>
            Configure New Analysis
          </button>
        </div>
      ) : (
        <div className="card print-exclude" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <Globe size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>GEO Lens: Organic vs AI Visibility Audit</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Map citations, identify informational gaps, and compare Google organic clicks with generative responses.
              </p>
            </div>
          </div>

          {/* Operating Template Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Step 1: Export GSC Data</span>
              <span style={{ color: 'var(--text-secondary)' }}>Download query list and landing pages from Google Search Console.</span>
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Step 2: Input Target Queries</span>
              <span style={{ color: 'var(--text-secondary)' }}>Upload your GSC log file or paste target queries in the field below.</span>
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Step 3: Analyze GEO Gaps</span>
              <span style={{ color: 'var(--text-secondary)' }}>Compute the GEO Gap Index highlighting high-opportunity visibility gaps.</span>
            </div>
          </div>

          {/* URL Keyword Extractor */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'flex-end', padding: '1rem', backgroundColor: 'rgba(31,164,232,0.06)', border: '1px solid rgba(31,164,232,0.2)', borderRadius: '14px' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={13} style={{ color: 'var(--accent)' }} />
                Extract Keywords from Website URL
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. https://poliricambi.com"
                value={geoSiteUrl}
                onChange={(e) => setGeoSiteUrl(e.target.value)}
                disabled={isFetchingKeywords}
              />
            </div>
            <button
              className="btn"
              disabled={!geoSiteUrl || isFetchingKeywords}
              onClick={async () => {
                setIsFetchingKeywords(true);
                try {
                  const urlToFetch = geoSiteUrl.startsWith('http') ? geoSiteUrl : `https://${geoSiteUrl}`;
                  const res = await fetch(`/api/analyze?url=${encodeURIComponent(urlToFetch)}&limit=5&sameHostOnly=true&excludeQueryString=true`);
                  const data = await res.json();
                  const keywords: string[] = [];
                  (data.pages || []).forEach((page: any) => {
                    if (page.ssr?.title && !keywords.includes(page.ssr.title)) keywords.push(page.ssr.title);
                    if (page.ssr?.description) {
                      page.ssr.description.split(/[,.!?]/).map((s: string) => s.trim()).filter((s: string) => s.length > 8 && s.length < 80).forEach((k: string) => { if (!keywords.includes(k)) keywords.push(k); });
                    }
                  });
                  if (keywords.length === 0 && data.pages?.length > 0) {
                    keywords.push(...data.pages.slice(0, 8).map((p: any) => p.url?.replace(/^https?:\/\/[^/]+/, '') || '').filter(Boolean));
                  }
                  if (keywords.length > 0) setGeoQueriesInput(keywords.slice(0, 20).join('\n'));
                  else setGeoQueriesInput('Could not extract keywords — try pasting them manually.');
                } catch {
                  setGeoQueriesInput('Extraction failed — paste your keywords manually.');
                } finally {
                  setIsFetchingKeywords(false);
                }
              }}
              style={{ height: '44px', borderRadius: '9999px', padding: '0 1.5rem', whiteSpace: 'nowrap', backgroundColor: 'var(--accent)', color: '#0a0e15', fontSize: '0.8rem', fontWeight: 700, minWidth: '170px' }}
            >
              {isFetchingKeywords ? 'Extracting...' : '⚡ Extract from Site'}
            </button>
          </div>

          {/* Form Container */}
          <div className="grid-mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Column 1: CSV upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Main Brand</label>
                  <input type="text" className="input" placeholder="e.g. HydraSEO" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Main Competitor</label>
                  <input type="text" className="input" placeholder="e.g. Semrush" value={brandCompetitors} onChange={(e) => setBrandCompetitors(e.target.value)} />
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCsvFileChange} 
                accept=".csv" 
                style={{ display: 'none' }} 
              />
              <div 
                onClick={handleCsvTrigger}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '16px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Upload size={24} style={{ color: 'var(--accent)' }} />
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>
                    {geoGscFileName ? geoGscFileName : 'Click to Upload GSC Queries Export'}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                    Supports GSC exported CSV files. <span onClick={handleLoadSampleQueries} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Or load sample queries</span>.
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Query list textarea */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
              <label>Query List (one per line)</label>
              <textarea
                className="input"
                style={{ flex: 1, minHeight: '140px', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                placeholder="e.g.&#10;best cloud platform for startup&#10;best edge compute databases&#10;how to optimize metadata for LLM crawlers"
                value={geoQueriesInput}
                onChange={(e) => setGeoQueriesInput(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button
              className="btn"
              onClick={startGeoScan}
              disabled={!geoQueriesInput || isScanningGeo}
              style={{ height: '48px', gap: '0.5rem', borderRadius: '9999px', padding: '0 2.25rem', backgroundColor: 'var(--accent)', color: '#0a0e15', boxShadow: '0 4px 12px rgba(31, 164, 232, 0.25)' }}
            >
              {isScanningGeo ? (
                <>
                  <Square size={16} fill="currentColor" />
                  Analyzing GEO gap metrics...
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  Run GEO Lens Analysis
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* GEO Progress loader */}
      {isScanningGeo && (
        <div className="card print-exclude" style={{ borderLeft: '4px solid var(--accent)', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe className="animate-pulse" size={16} style={{ color: 'var(--accent)' }} />
              Running comparative visibility audits across AI Engines...
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{geoProgress}%</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${geoProgress}%`, background: 'linear-gradient(90deg, var(--accent), var(--success))' }}></div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'monospace', marginTop: '0.5rem' }}>
            {geoStatusMessage}
          </p>
        </div>
      )}

      {/* GEO Dashboard View */}
      {geoResults && (
        <div style={{ marginTop: '2rem' }}>
          {/* Dashboard Header Bar */}
          <div className="card print-include" style={{ borderLeft: '4px solid var(--accent)', background: 'linear-gradient(135deg, rgba(31,164,232,0.05) 0%, rgba(16,22,34,1) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Globe size={22} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>GEO Lens: Organic vs AI Visibility Dashboard</h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Operational template comparing Google Search Console organic visibility with presence across generative search answer models.
              </p>
            </div>
            <button 
              className="btn btn-secondary print-exclude"
              onClick={exportToPdf}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '9999px', fontSize: '0.8rem', border: '1.5px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}
            >
              <Download size={14} />
              Export PDF Report
            </button>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid print-include" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ borderTop: '4px solid var(--accent)', display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span className="value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>{geoResults.overallStats.totalQueries}</span>
              <span className="label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem' }}>Organic Queries Analyzed</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>+14% vs previous period</span>
            </div>
            
            <div className="stat-card" style={{ borderTop: '4px solid var(--success)', display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span className="value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>{geoResults.overallStats.queriesWithAiCitations}%</span>
              <span className="label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem' }}>Queries with AI Citation</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Generative answer coverage rate</span>
            </div>

            <div className="stat-card" style={{ borderTop: '4px solid var(--danger)', display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span className="value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger)' }}>{geoResults.overallStats.queriesWithHighGap}%</span>
              <span className="label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem' }}>Queries with High GEO Gap</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Priority optimization target</span>
            </div>

            <div className="stat-card" style={{ borderTop: '4px solid #c084fc', display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span className="value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c084fc' }}>{geoResults.overallStats.totalEntitiesCited}</span>
              <span className="label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem' }}>Unique Entities Cited</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Products, authors, brand entities</span>
            </div>
          </div>

          {/* Engine Domain Coverage rate & Gap per cluster */}
          <div className="diff-grid print-include" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Engine citations card */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                AI Search Engine Domain Coverage
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Rate of queries where your domain is cited in generative model results.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {geoResults.engineCoverage.map((engine: any) => (
                  <div key={engine.engine}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{engine.engine}</span>
                      <span>{engine.coverage}% ({engine.citationsCount} queries)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${engine.coverage}%`, height: '100%', backgroundColor: 'var(--accent)', borderRadius: '9999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gap per query cluster */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                <Layers size={16} style={{ color: 'var(--success)' }} />
                Gap per Query Cluster
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Transactional and comparison query categories show the widest gap between SEO position and AI search indexation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {geoResults.clusters.map((cluster: any) => (
                  <div key={cluster.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cluster.name}</span>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        <span>Google Position: <strong>{cluster.avgPosition}</strong></span>
                        <span>AI Citation: <strong>{cluster.aiCitationRate}%</strong></span>
                      </div>
                    </div>
                    <span className={`badge ${cluster.gapLevel === 'HIGH' ? 'badge-critical' : cluster.gapLevel === 'MEDIUM' ? 'badge-warning' : 'badge-ok'}`}>
                      {cluster.gapLevel} GAP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table comparison Matrix */}
          <div className="card print-include" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>GEO & SEO Comparative Query Matrix</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Analyze search console parameters alongside AI response indexation status to prioritize optimization.
                </p>
              </div>

              {/* Filtering layout */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search queries..."
                    value={geoSearchQuery}
                    onChange={(e) => setGeoSearchQuery(e.target.value)}
                    style={{ height: '34px', fontSize: '0.75rem', paddingLeft: '2rem', width: '180px', borderRadius: '8px' }}
                  />
                  <Search size={12} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>

                <select
                  className="input"
                  value={geoFilterGap}
                  onChange={(e) => setGeoFilterGap(e.target.value)}
                  style={{ height: '34px', fontSize: '0.75rem', width: '130px', padding: '0 0.5rem', borderRadius: '8px' }}
                >
                  <option value="all">All Gaps</option>
                  <option value="HIGH">High Gaps Only</option>
                  <option value="MEDIUM">Medium Gaps</option>
                  <option value="LOW">Low Gaps</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Target Query</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', width: '90px' }}>Google Pos.</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', width: '100px' }}>Organic Clicks</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Citations Found</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', width: '85px' }}>Gap Index</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', width: '85px' }}>Gap Level</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Strategic Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {geoResults.matrix
                    .filter((row: any) => {
                      const matchesSearch = row.query.toLowerCase().includes(geoSearchQuery.toLowerCase());
                      const matchesGap = geoFilterGap === 'all' || row.gapLevel === geoFilterGap;
                      return matchesSearch && matchesGap;
                    })
                    .map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>"{row.query}"</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{row.gscPosition}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{row.gscClicks}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {row.citations.map((c: string) => (
                              <span key={c} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'rgba(31,164,232,0.1)', color: 'var(--accent)', fontWeight: 600 }}>
                                {c}
                              </span>
                            ))}
                            {row.citations.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>None</span>}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: row.gapScore > 70 ? 'var(--danger)' : row.gapScore > 40 ? 'var(--warning)' : 'var(--success)' }}>
                          {row.gapScore}/100
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${row.gapLevel === 'HIGH' ? 'badge-critical' : row.gapLevel === 'MEDIUM' ? 'badge-warning' : 'badge-ok'}`}>
                            {row.gapLevel}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {row.recommendation}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mathematical formula description */}
          <div className="card print-include" style={{ borderLeft: '4px solid var(--accent)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Info size={16} style={{ color: 'var(--accent)' }} />
              The GEO Gap Mathematical Model
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Prioritization indexes are calculated using:
              <strong style={{ color: 'var(--text-primary)', display: 'block', margin: '0.35rem 0', fontFamily: 'monospace' }}>
                GEO Gap Index = ((SEO Opportunity Score × Organic Demand) - AI Citation Score)
              </strong>
              Where <em>SEO Opportunity Score</em> is inversely scaled with Google ranking position (11 - position), 
              <em>Organic Demand</em> uses logarithmic scaling of Search Console impressions, and <em>AI Citation Score</em> scales domain citation density (from 0 to 100).
              High scores flag keywords with heavy Search Console traction that are totally ignored in generative answers.
            </p>
          </div>

          {/* Site Entities Cited */}
          <div className="card print-include" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              <Database size={16} style={{ color: 'var(--accent)' }} />
              Site Informational Entities Cited
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Audit mapping showing which structural elements of your site are extracted by LLM engines.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {geoResults.entitiesMapping.map((entity: any, idx: number) => (
                <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{entity.name}</span>
                    <span className={`badge ${
                      entity.frequency === 'Critical' ? 'badge-critical' :
                      entity.frequency === 'Low' ? 'badge-warning' :
                      entity.frequency === 'Medium' ? 'badge-warning' :
                      'badge-ok'
                    }`}>
                      {entity.frequency}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{entity.description}</p>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color:
                    entity.status === 'stable' ? 'var(--success)' :
                    entity.status === 'warning' ? 'var(--warning)' :
                    entity.status === 'opportunity' ? 'var(--accent)' :
                    'var(--danger)',
                    marginTop: '0.5rem'
                  }}>
                    STATUS: {entity.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic actions checklist */}
          <div className="card print-include" style={{ borderLeft: '4px solid var(--success)', marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <Sparkles size={18} style={{ color: 'var(--success)' }} />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>GEO Strategic Action Checklist</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Execute these actionable technical improvements to bridge the gap between organic traffic and AI discovery.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ backgroundColor: 'rgba(122,194,112,0.1)', color: 'var(--success)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem' }}>1</span>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Build Native Comparison Pages</h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Queries like "alternative to", "vs", and "best-in-class" are frequently searched but poorly served by AI search engines. Publish comparative grids highlighting neutral specifications, features, and direct pricing schemas.
                </p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ backgroundColor: 'rgba(122,194,112,0.1)', color: 'var(--success)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem' }}>2</span>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Strengthen Entities & Schema Markup</h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Inject clean, comprehensive JSON-LD schemas (such as Product, FAQPage, and Organization) into your page headers to allow LLM crawlers to map properties (pricing, features, reviews) directly to your brand entity.
                </p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ backgroundColor: 'rgba(122,194,112,0.1)', color: 'var(--success)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem' }}>3</span>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Prioritize High-Yield Content Formats</h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Structure pricing details and features clearly using tables, short bullet lists, and answer-first headers. This formatting matches the extraction patterns used by Perplexity, ChatGPT, and Gemini.
                </p>
              </div>
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
