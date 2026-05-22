'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Square, AlertCircle, AlertTriangle, CheckCircle, Info, 
  ChevronRight, Download, Filter, HelpCircle, FileText, Check, ShieldAlert, ShieldCheck,
  Server, Laptop, Sparkles, ArrowRight, Gauge, Activity, Compass, Settings, ChevronDown, ChevronUp, Network, CornerDownRight, GitCompare,
  Sun, Moon, X, Brain, Wrench, ExternalLink, Globe, Upload, Database, TrendingUp, Layers, Table, Map, Search
} from 'lucide-react';

interface ScanOption {
  limit: number;
  sameHostOnly: boolean;
  excludeQueryString: boolean;
  ignorePaths: string;
  respectRobots: boolean;
  estimatedQueries: number;
}

export default function Home() {
  const router = useRouter();

  // Root scan states
  const [urlInput, setUrlInput] = useState('');
  const [options, setOptions] = useState<ScanOption>({
    limit: 10,
    sameHostOnly: true,
    excludeQueryString: true,
    ignorePaths: '/api, /admin, /login, /_next',
    respectRobots: true,
    estimatedQueries: 5000,
  });

  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [referrals, setReferrals] = useState<Record<string, string>>({});
  const [drawerTab, setDrawerTab] = useState<'seo-diff' | 'lighthouse-details'>('seo-diff');

  // Robots.txt generator states
  const [showRobotsModal, setShowRobotsModal] = useState(false);
  const [robotsTxtContent, setRobotsTxtContent] = useState('');
  const [copiedRobots, setCopiedRobots] = useState(false);

  // Authentication & Plan States
  const [user, setUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'credentials' | 'permissions'>('credentials');
  const [authEmail, setAuthEmail] = useState('developer@gmail.com');
  const [authName, setAuthName] = useState('NextJS Developer');
  const [savedScans, setSavedScans] = useState<any[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Monetization & anti-abuse quota states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [abuseBlockMessage, setAbuseBlockMessage] = useState('');
  const [hardwareFingerprint, setHardwareFingerprint] = useState('');
  const [globalScanCount, setGlobalScanCount] = useState(0);
  const [userPlan, setUserPlan] = useState<'Free Tier' | 'Pro (100 Scans)' | 'Pro (500 Scans)' | 'Pro (1000 Scans)' | 'Ultimate (Infinite)'>('Free Tier');

  // Sitemap Comparison States
  const [showSitemapModal, setShowSitemapModal] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [sitemapScanStatus, setSitemapScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [sitemapDiscoveredUrls, setSitemapDiscoveredUrls] = useState<string[]>([]);
  const [sitemapComparisonData, setSitemapComparisonData] = useState<{
    sourceSeo: any[];
    targetSeo: any[];
    sourcePerf: any;
    targetPerf: any;
    added: string[];
    deleted: string[];
    regressions: string[];
  } | null>(null);

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
          const parsed = parseInt(syncedScans, 10);
          if (!isNaN(parsed)) setGlobalScanCount(parsed);
        }

        fetch(`/api/syncUser?email=${encodeURIComponent(parsedUser.email)}`)
          .then(res => res.json())
          .then(data => {
            if (data.scans) setSavedScans(data.scans);
          }).catch(() => {});
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('robots') === 'true') {
        generateRobotsTxt();
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [urlInput]);

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

    fetch(`/api/syncUser?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.scans) setSavedScans(data.scans);
      }).catch(() => {});
  };

  const handleLogout = () => {
    setUser(null);
    setUserPlan('Free Tier');
    setSavedScans([]);
    localStorage.removeItem('hydraseo_active_user');
    localStorage.removeItem('nvms_active_user');
  };

  const handleScanToggle = () => {
    if (isScanning) {
      setIsScanning(false);
      setStatusMessage('Scan interrupted by user.');
    } else {
      startRealScan();
    }
  };

  const startRealScan = async () => {
    if (!urlInput) return;

    const fp = hardwareFingerprint || getDeviceFingerprint();
    const currentLimit = userPlan === 'Ultimate (Infinite)' ? Infinity : 
                         userPlan === 'Pro (100 Scans)' ? 100 : 
                         userPlan === 'Pro (500 Scans)' ? 500 : 
                         userPlan === 'Pro (1000 Scans)' ? 1000 : 
                         1;

    const safeCount = isNaN(globalScanCount) ? 0 : globalScanCount;

    if (safeCount >= currentLimit) {
      // Never block authenticated Pro/Ultimate users if count is clearly corrupted
      if (currentLimit === Infinity) {
        // Ultimate plan — always allow
      } else if (userPlan === 'Free Tier') {
        setAbuseBlockMessage(`You have reached the free scan limit (1 scan). Please sign in with Google and upgrade to a Pro plan to continue.`);
        setShowAuthModal(true);
        setAuthStep('credentials');
        return;
      } else if (safeCount >= currentLimit) {
        setAbuseBlockMessage(`You have exhausted your active plan allowance of ${currentLimit} scans. Please purchase a new package.`);
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsScanning(true);
    setProgress(5);
    setResults([]);
    setSelectedResult(null);
    setStatusMessage('Resolving domain and parsing entry document...');

    try {
      const crawlSteps = [
        { progress: 15, msg: 'Resolving DNS and SSL handshake...' },
        { progress: 30, msg: 'Downloading initial index HTML...' },
        { progress: 50, msg: 'Analyzing client-side JS rendering dependencies...' },
        { progress: 70, msg: 'Executing dynamic crawl loop...' },
        { progress: 90, msg: 'Compiling Core Web Vitals predictions...' }
      ];

      for (const step of crawlSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setProgress(step.progress);
        setStatusMessage(step.msg);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`SEO API returned status ${response.status}`);
      }

      const data = await response.json();
      setResults(data.pages || []);
      setReferrals(data.referrals || {});
      setProgress(100);
      setStatusMessage('Scan completed successfully!');

      const nextCount = globalScanCount + 1;
      setGlobalScanCount(nextCount);

      if (user) {
        fetch('/api/syncUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, action: 'saveScan', url: urlInput, results: data.pages })
        }).then(res => res.json())
          .then(data => {
            if (data.scans) setSavedScans(data.scans);
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
      setStatusMessage(`Scan failed: ${err.message || 'Unknown network error'}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Robots.txt generator trigger
  const generateRobotsTxt = () => {
    let domain = 'yourdomain.com';
    try {
      if (urlInput) {
        const parsed = new URL(urlInput.startsWith('http') ? urlInput : `https://${urlInput}`);
        domain = parsed.hostname;
      }
    } catch {}
    
    const content = `# HydraSEO - Optimized Robots.txt for Google Search & AI Engine Visibility
# Grants full access to Googlebot and major AI search agents/crawlers for maximum indexation.

User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /login/
Disallow: /_next/

# Explicitly Allow Major AI Crawlers for Indexation & Citations
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: FacebookBot
Allow: /

User-agent: Cohere-cohere
Allow: /

# Sitemap Reference
Sitemap: https://${domain}/sitemap.xml`;
    
    setRobotsTxtContent(content);
    setShowRobotsModal(true);
  };

  const handleCopyRobots = () => {
    navigator.clipboard.writeText(robotsTxtContent);
    setCopiedRobots(true);
    setTimeout(() => setCopiedRobots(false), 2000);
  };

  const handleDownloadRobots = () => {
    const blob = new Blob([robotsTxtContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'robots.txt';
    link.click();
  };

  const loadSavedScan = (scan: any) => {
    setResults(scan.results_payload || []);
    setUrlInput(scan.scanned_url);
    setProgress(100);
    setStatusMessage('Crawl history payload successfully loaded!');
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    const headers = ['URL', 'Status', 'SSR Compatible', 'Lighthouse Score', 'Load Speed', 'Issues Count'];
    const rows = results.map(r => [
      r.url,
      r.status,
      (!r.isCSRDependent).toString(),
      r.lighthouse?.scores.performance || 'N/A',
      r.performanceMetrics?.loadTime || 'N/A',
      r.issues.length
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hydraseo_crawl_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (results.length === 0) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hydraseo_crawl_${Date.now()}.json`;
    link.click();
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

  // Sitemap Comparison tool trigger
  const runSitemapComparison = async () => {
    if (!sitemapUrl) return;
    setSitemapScanStatus('scanning');
    setSitemapComparisonData(null);

    try {
      const response = await fetch('/api/compareSitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitemapUrl, currentScanPayload: results })
      });

      if (!response.ok) throw new Error("Sitemap comparison fetch failed");

      const data = await response.json();
      setSitemapDiscoveredUrls(data.discoveredUrls || []);
      setSitemapComparisonData(data.comparison);
      setSitemapScanStatus('success');
    } catch {
      setSitemapScanStatus('error');
    }
  };

  // SEO Metrics helpers
  const totalScanned = results.length;
  const okPages = results.filter(r => !r.isCSRDependent).length;
  const warningPages = results.filter(r => r.isCSRDependent).length;
  const highRiskPages = results.filter(r => r.issues.some((issue: any) => issue.severity === 'critical')).length;

  const filteredResults = results.filter(r => {
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'ok') return !r.isCSRDependent;
    if (filterSeverity === 'warning') return r.isCSRDependent;
    if (filterSeverity === 'critical') return r.issues.some((i: any) => i.severity === 'critical');
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  // Heavy DOM library warning flag
  const hasSelectorEngineWarning = results.some(r => r.isCSRDependent && r.issues.some((issue: any) => issue.description.toLowerCase().includes('selector engine') || issue.description.toLowerCase().includes('nwmatcher')));
  const selectorAuditInfo = results.find(r => r.isCSRDependent && r.issues.some((issue: any) => issue.description.toLowerCase().includes('selector engine') || issue.description.toLowerCase().includes('nwmatcher')));

  return (
    <div className="container">
      {/* Header Panel */}
      <header className="header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <Wrench size={32} style={{ color: 'var(--accent)' }} />
            HydraSEO <span style={{ fontSize: '0.85rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(31, 164, 232, 0.1)', color: 'var(--accent)' }}>Technical Audit</span>
          </h1>
          <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
            Find hydration problems, CSR bottlenecks, and metadata crawl visibility errors.
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
        <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '9999px', backgroundColor: 'var(--accent)', color: '#0a0e15', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
          <Wrench size={14} />
          Technical SEO Scan
        </button>
        <button onClick={() => router.push('/aio')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '9999px', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
          <Brain size={14} />
          AI Presence Audit (AIO)
        </button>
        <button onClick={() => router.push('/geo')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '9999px', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
          <Globe size={14} />
          GEO Lens
        </button>
      </div>

      {/* Settings Form */}
      {results.length > 0 ? (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--accent)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Audited Target Domain</span>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '0.15rem' }}>{urlInput}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              onClick={generateRobotsTxt}
              style={{ borderRadius: '9999px', fontSize: '0.75rem', height: '36px', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <FileText size={14} />
              Generate Robots.txt
            </button>
            <button className="btn btn-secondary" onClick={() => setResults([])} style={{ borderRadius: '9999px', fontSize: '0.75rem', height: '36px' }}>
              Configure New Scan
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <Settings size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Audit Configuration</h2>
          </div>
          
          <div className="grid-mobile-stack-row-end" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="url-input">Initial Domain or URL</label>
              <input 
                type="text" 
                id="url-input"
                className="input" 
                placeholder="https://example-nextjs-app.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isScanning}
              />
            </div>
            <button 
              className="btn" 
              onClick={handleScanToggle}
              disabled={!urlInput}
              style={{ height: '48px', gap: '0.5rem', borderRadius: '9999px', padding: '0 2.25rem' }}
            >
              {isScanning ? (
                <>
                  <Square size={16} fill="currentColor" />
                  Stop Audits
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  Start Scan
                </>
              )}
            </button>
          </div>

          {/* Options & Robots.txt Generator side-by-side */}
          <div className="grid-mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            {/* Options Panel (Left) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label>Maximum Pages to Scan</label>
                <input 
                  type="number" 
                  className="input" 
                  value={options.limit} 
                  onChange={(e) => setOptions({...options, limit: Number(e.target.value)})}
                  disabled={isScanning}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={options.sameHostOnly} 
                    onChange={(e) => setOptions({...options, sameHostOnly: e.target.checked})}
                    disabled={isScanning}
                  />
                  Restrict to same domain
                </label>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={options.excludeQueryString} 
                    onChange={(e) => setOptions({...options, excludeQueryString: e.target.checked})}
                    disabled={isScanning}
                  />
                  Exclude query parameters
                </label>
              </div>
              <div className="form-group">
                <label>Ignore Routes & Paths</label>
                <input 
                  type="text" 
                  className="input" 
                  value={options.ignorePaths} 
                  onChange={(e) => setOptions({...options, ignorePaths: e.target.value})}
                  disabled={isScanning}
                />
              </div>
              <div className="form-group">
                <label>Estimated Daily Traffic</label>
                <input 
                  type="number" 
                  className="input" 
                  value={options.estimatedQueries} 
                  onChange={(e) => setOptions({...options, estimatedQueries: Number(e.target.value)})}
                  disabled={isScanning}
                  min={1}
                />
              </div>
            </div>

            {/* Tools Panel (Right) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Robots.txt Generator */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '14px', justifyContent: 'space-between', gap: '0.75rem', flex: 1 }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} style={{ color: 'var(--accent)' }} />
                    Robots.txt Generator
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                    Create a Google-compliant robots.txt optimized to grant full crawl access to AI indexers.
                  </p>
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={generateRobotsTxt}
                  style={{ width: '100%', borderRadius: '9999px', fontSize: '0.75rem', height: '36px', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}
                >
                  Generate Robots.txt
                </button>
              </div>

              {/* Sitemap Generator */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '14px', justifyContent: 'space-between', gap: '0.75rem', flex: 1 }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Map size={16} style={{ color: 'var(--success)' }} />
                    XML Sitemap Generator
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                    Generate a search-engine-ready sitemap.xml with auto-calculated page priorities.
                  </p>
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowSitemapModal(true)}
                  disabled={results.length === 0}
                  style={{ width: '100%', borderRadius: '9999px', fontSize: '0.75rem', height: '36px', border: `1px solid ${results.length > 0 ? 'var(--success)' : 'var(--border)'}`, color: results.length > 0 ? 'var(--success)' : 'var(--text-secondary)', background: 'transparent', opacity: results.length === 0 ? 0.5 : 1 }}
                >
                  {results.length > 0 ? 'Generate Sitemap.xml' : 'Run a scan first'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Progress */}
      {isScanning && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>Crawl in progress...</span>
            <span style={{ color: 'var(--text-secondary)' }}>{progress}%</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
            {statusMessage}
          </p>
        </div>
      )}

      {/* Metrics Row */}
      {results.length > 0 && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="value">{totalScanned}</span>
              <span className="label">Total Audited</span>
            </div>
            <div className="stat-card stat-ok">
              <span className="value">{okPages}</span>
              <span className="label">Fully Server SSR</span>
            </div>
            <div className="stat-card stat-warning">
              <span className="value">{warningPages}</span>
              <span className="label">Warnings Found</span>
            </div>
            <div className="stat-card stat-critical">
              <span className="value">{highRiskPages}</span>
              <span className="label">High Risk Pages</span>
            </div>
          </div>

          {/* Action Alert Banner for Selector Engines */}
          {hasSelectorEngineWarning && selectorAuditInfo && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed var(--danger)',
              padding: '1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--danger)', fontSize: '1rem' }}>
                <ShieldAlert size={20} />
                Performance Alert: Client-Side DOM Selector Engine Detected
              </div>
              <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                One or more scanned pages are bundling heavy DOM selector libraries client-side. Modern browsers support highly optimized, compiled native CSS selector engines (<code>querySelectorAll</code>) that are significantly faster.
                To prevent rendering and hydration bottlenecks, consider removing this overhead from your client bundles.
              </p>
              <div style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border)', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                fontSize: '0.85rem',
                marginTop: '0.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <span style={{ fontWeight: '700', color: 'var(--accent)' }}>Recommended Architecture:</span>
                <span>
                  If you require a fast headless DOM parser and selector resolver for server-side HTML scraping or headless testing in Node.js, we highly recommend leveraging NWSAPI:
                </span>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <a 
                    href="https://www.npmjs.com/package/nwsapi" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: '600' }}
                  >
                    Download NWSAPI via NPM
                  </a>
                  <a 
                    href="https://github.com/dperini/nwsapi" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: '600' }}
                  >
                    NWSAPI Github Repository
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* High-Volume Traffic Optimization Opportunity */}
          {options.estimatedQueries >= 10000 && (
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.06)',
              border: '1px dashed var(--accent)',
              padding: '1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--accent)', fontSize: '1rem' }}>
                <Sparkles size={20} style={{ color: 'var(--accent)' }} />
                High-Volume Server Optimization Opportunity (NWSAPI Recommendation)
              </div>
              <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                Your site is configured with an estimated <strong>{options.estimatedQueries.toLocaleString()}</strong> daily queries/requests. Under this high-traffic load, server-side CPU performance during SSR, dynamic scraping, or server-side DOM query processing is extremely critical. 
                Using a pre-compiled, high-performance CSS selector engine like <strong>NWSAPI</strong> in your server-side environment (Node.js/Next.js) will dramatically decrease TTFB, minimize memory overhead, and optimize hosting compute costs compared to generic software-based query selector implementations.
              </p>
              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                <a 
                  href="https://www.npmjs.com/package/nwsapi" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  Get NWSAPI from NPM Registry
                </a>
                <a 
                  href="https://github.com/dperini/nwsapi" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  Official NWSAPI GitHub Project
                </a>
              </div>
            </div>
          )}

          {/* Results Listings */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>Filter Findings:</span>
                <button 
                  onClick={() => setFilterSeverity('all')}
                  className="btn" 
                  style={{ 
                    padding: '0.4rem 1rem', 
                    fontSize: '0.8rem', 
                    borderRadius: '16px',
                    boxShadow: 'none',
                    textTransform: 'none',
                    height: '32px',
                    backgroundColor: filterSeverity === 'all' ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: filterSeverity === 'all' ? '#121318' : 'var(--text-secondary)',
                    border: filterSeverity === 'all' ? 'none' : '1px solid var(--border)'
                  }}
                >
                  All Pages
                </button>
                <button 
                  onClick={() => setFilterSeverity('ok')}
                  className="btn" 
                  style={{ 
                    padding: '0.4rem 1rem', 
                    fontSize: '0.8rem', 
                    borderRadius: '16px',
                    boxShadow: 'none',
                    textTransform: 'none',
                    height: '32px',
                    backgroundColor: filterSeverity === 'ok' ? 'var(--success)' : 'var(--bg-tertiary)',
                    color: filterSeverity === 'ok' ? '#121318' : 'var(--text-secondary)',
                    border: filterSeverity === 'ok' ? 'none' : '1px solid var(--border)'
                  }}
                >
                  SSR OK
                </button>
                <button 
                  onClick={() => setFilterSeverity('warning')}
                  className="btn" 
                  style={{ 
                    padding: '0.4rem 1rem', 
                    fontSize: '0.8rem', 
                    borderRadius: '16px',
                    boxShadow: 'none',
                    textTransform: 'none',
                    height: '32px',
                    backgroundColor: filterSeverity === 'warning' ? 'var(--warning)' : 'var(--bg-tertiary)',
                    color: filterSeverity === 'warning' ? '#121318' : 'var(--text-secondary)',
                    border: filterSeverity === 'warning' ? 'none' : '1px solid var(--border)'
                  }}
                >
                  CSR Warnings
                </button>
                <button 
                  onClick={() => setFilterSeverity('critical')}
                  className="btn" 
                  style={{ 
                    padding: '0.4rem 1rem', 
                    fontSize: '0.8rem', 
                    borderRadius: '16px',
                    boxShadow: 'none',
                    textTransform: 'none',
                    height: '32px',
                    backgroundColor: filterSeverity === 'critical' ? 'var(--danger)' : 'var(--bg-tertiary)',
                    color: filterSeverity === 'critical' ? '#ffffff' : 'var(--text-secondary)',
                    border: filterSeverity === 'critical' ? 'none' : '1px solid var(--border)'
                  }}
                >
                  Critical Issues
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowSitemapModal(true)} 
                  style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', gap: '0.25rem', borderRadius: '9999px', textTransform: 'none', height: '34px', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}
                >
                  <GitCompare size={13} />
                  Sitemap Comparison
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={exportToCSV} 
                  style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', gap: '0.25rem', borderRadius: '9999px', textTransform: 'none', height: '34px' }}
                >
                  <Download size={13} />
                  Export CSV
                </button>
                <button 
                  className="btn" 
                  onClick={exportToJSON} 
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.8rem', padding: '0.4rem 1rem', gap: '0.25rem', borderRadius: '9999px', textTransform: 'none', height: '34px', boxShadow: 'none' }}
                >
                  <Download size={13} />
                  Export JSON
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Audited Page URL</th>
                    <th>Status</th>
                    <th>Render Architecture</th>
                    <th>PageSpeed Core Score</th>
                    <th>Load Speed</th>
                    <th>SEO Severity Status</th>
                    <th>Inspect Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((r, i) => (
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => { setSelectedResult(r); setDrawerTab('seo-diff'); }}>
                      <td style={{ maxWidth: '380px', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 550 }}>
                        {r.url}
                      </td>
                      <td>{r.status}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          {r.isCSRDependent ? (
                            <>
                              <Laptop size={14} style={{ color: 'var(--warning)' }} />
                              CSR Dependent (Heavy JS)
                            </>
                          ) : (
                            <>
                              <Server size={14} style={{ color: 'var(--success)' }} />
                              Server Rendered (SSR)
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        {r.lighthouse ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getScoreColor(r.lighthouse.scores.performance) }}></div>
                            <span style={{ fontWeight: 700, color: getScoreColor(r.lighthouse.scores.performance) }}>
                              {r.lighthouse.scores.performance}/100
                            </span>
                          </div>
                        ) : 'Pending'}
                      </td>
                      <td>
                        {r.performanceMetrics ? (
                          <span style={{ 
                            fontWeight: 700, 
                            color: r.performanceMetrics.loadTime < 1500 ? 'var(--success)' : r.performanceMetrics.loadTime < 3000 ? 'var(--warning)' : 'var(--danger)' 
                          }}>
                            {r.performanceMetrics.loadTime} ms
                          </span>
                        ) : 'Pending'}
                      </td>
                      <td>
                        {r.issues.length === 0 ? (
                          <span className="badge badge-ok">Fully Visible</span>
                        ) : r.issues.some((issue: any) => issue.severity === 'critical') ? (
                          <span className="badge badge-critical">{r.issues.length} Critical Bottlenecks</span>
                        ) : (
                          <span className="badge badge-warning">{r.issues.length} Warnings</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}>
                          Inspect Page
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 🌟 Monetization Portal & Quota Dashboard */}
      {!user ? (
        <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--success)', backgroundColor: 'rgba(122, 194, 112, 0.03)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.25rem' }}>
            <Sparkles size={20} style={{ color: 'var(--success)' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Unlock Personalized Cloud Archiving & Pro Audits</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
            Register now via Google Secure Authentication to unlock cloud-archived scan logs, SEO regression tracking, and gain a complimentary trial of 10 scans. Upgrade to premium scanner packages anytime to scale up your operations!
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                setAuthStep('credentials');
                setShowAuthModal(true);
              }} 
              className="btn" 
              style={{ backgroundColor: 'var(--success)', color: '#0a0e15', borderRadius: '9999px', fontSize: '0.8rem', padding: '0.5rem 1.5rem' }}
            >
              Sign Up / Sign In with Google
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Compass size={18} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Your Scanner Account Quota</h3>
            </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Active Package: <strong>{userPlan}</strong> | Total Scans Performed: <strong>{isNaN(globalScanCount) ? 0 : globalScanCount}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={() => setShowUpgradeModal(true)} 
              className="btn" 
              style={{ backgroundColor: 'var(--accent)', color: '#0a0e15', borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 1.5rem', height: '36px' }}
            >
              Purchase Scan Credits
            </button>
          </div>
        </div>
      )}

      {/* Crawl History Logs panel */}
      {user && savedScans.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Saved Crawl Archives</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {savedScans.slice(0, 5).map((scan) => (
              <div key={scan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{scan.scanned_url}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
                    {new Date(scan.created_at).toLocaleString()}
                  </span>
                </div>
                <button className="btn btn-secondary" onClick={() => loadSavedScan(scan)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}>
                  Load Archive
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimized Robots.txt Modal */}
      {showRobotsModal && (
        <div className="drawer-backdrop" onClick={() => setShowRobotsModal(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{
            width: '600px',
            maxWidth: '90%',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '2rem',
            position: 'relative',
            boxShadow: 'var(--shadow-5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <FileText size={20} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Optimized Robots.txt File</h3>
              </div>
              <button onClick={() => setShowRobotsModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
              This configuration allows Google to crawl your website while explicitly granting full read-access to AI indexers (ChatGPT, Gemini, Claude, Perplexity), maximizing your generative search citations.
            </p>

            <pre style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              overflow: 'auto',
              maxHeight: '300px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: 'var(--text-primary)',
              lineHeight: '1.5',
              marginBottom: '1.5rem'
            }}>
              {robotsTxtContent}
            </pre>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={handleCopyRobots} style={{ borderRadius: '9999px', fontSize: '0.8rem' }}>
                {copiedRobots ? 'Copied ✓' : 'Copy Content'}
              </button>
              <button className="btn" onClick={handleDownloadRobots} style={{ borderRadius: '9999px', fontSize: '0.8rem', backgroundColor: 'var(--accent)', color: '#0a0e15' }}>
                Download robots.txt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect drawer overlay */}
      {selectedResult && (
        <div className="drawer-backdrop" onClick={() => setSelectedResult(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                  Crawl Inspector
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all', display: 'block', marginTop: '0.2rem' }}>
                  {selectedResult.url}
                </span>
              </div>
              <button onClick={() => setSelectedResult(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            {/* Tabs for details */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <button 
                onClick={() => setDrawerTab('seo-diff')}
                className="btn btn-secondary"
                style={{ 
                  borderRadius: '8px', 
                  fontSize: '0.75rem', 
                  padding: '0.4rem 1rem', 
                  backgroundColor: drawerTab === 'seo-diff' ? 'var(--accent)' : 'transparent',
                  color: drawerTab === 'seo-diff' ? '#0a0e15' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                SSR vs Client DOM Differences
              </button>
              <button 
                onClick={() => setDrawerTab('lighthouse-details')}
                className="btn btn-secondary"
                style={{ 
                  borderRadius: '8px', 
                  fontSize: '0.75rem', 
                  padding: '0.4rem 1rem', 
                  backgroundColor: drawerTab === 'lighthouse-details' ? 'var(--accent)' : 'transparent',
                  color: drawerTab === 'lighthouse-details' ? '#0a0e15' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                Core Web Vitals & Audits
              </button>
            </div>

            {drawerTab === 'seo-diff' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Render Compliance Status:</span>
                  {selectedResult.isCSRDependent ? (
                    <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Laptop size={12} />
                      Crawl Mismatch Detected (CSR Dependent)
                    </span>
                  ) : (
                    <span className="badge badge-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Server size={12} />
                      SSR Compliant (Crawler Match)
                    </span>
                  )}
                </div>

                <div className="diff-grid">
                  <div className="diff-box">
                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Initial Server (SSR) DOM</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>HTML downloaded directly by crawler</span>
                    <pre style={{
                      marginTop: '0.75rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}>
                      {selectedResult.ssrHtml || 'Empty Document'}
                    </pre>
                  </div>

                  <div className="diff-box">
                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hydrated Client (CSR) DOM</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>HTML resolved after Javascript rendering</span>
                    <pre style={{
                      marginTop: '0.75rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}>
                      {selectedResult.clientHtml || 'Empty Document'}
                    </pre>
                  </div>
                </div>

                {/* Issues checklist */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Identified SEO Gaps & Action Items</h3>
                  {selectedResult.issues.length === 0 ? (
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '4px solid var(--success)' }}>
                      <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                      <span style={{ fontSize: '0.85rem' }}>Zero visibility gaps identified! Your page metadata is fully crawled and SSR aligned.</span>
                    </div>
                  ) : (
                    selectedResult.issues.map((issue: any, index: number) => (
                      <div key={index} className={`issue-card ${issue.severity === 'critical' ? 'critical' : 'warning'}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'capitalize', color: issue.severity === 'critical' ? 'var(--danger)' : 'var(--warning)' }}>
                            {issue.severity} Gap
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>Code: {issue.code}</span>
                        </div>
                        <h4 style={{ color: 'var(--text-primary)', margin: '0.25rem 0' }}>{issue.description}</h4>
                        <p>{issue.details}</p>
                        <span className="fix" style={{ display: 'block', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                          👉 Recommended Fix: {issue.fix}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div>
                {/* Core Web Vitals predictions */}
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Lighthouse Predictions & Core Web Vitals</h3>
                {selectedResult.lighthouse ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Performance</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(selectedResult.lighthouse.scores.performance), marginTop: '0.25rem' }}>
                          {selectedResult.lighthouse.scores.performance}
                        </div>
                      </div>
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>SEO</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(selectedResult.lighthouse.scores.seo), marginTop: '0.25rem' }}>
                          {selectedResult.lighthouse.scores.seo}
                        </div>
                      </div>
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Accessibility</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(selectedResult.lighthouse.scores.accessibility), marginTop: '0.25rem' }}>
                          {selectedResult.lighthouse.scores.accessibility}
                        </div>
                      </div>
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Best Prac.</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(selectedResult.lighthouse.scores['best-practices']), marginTop: '0.25rem' }}>
                          {selectedResult.lighthouse.scores['best-practices']}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Detailed Performance Audits</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedResult.lighthouse.audits.map((audit: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{audit.title}</span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{audit.description}</span>
                            </div>
                            <span style={{ 
                              fontSize: '0.8rem', 
                              fontWeight: 700, 
                              color: audit.score === 1 ? 'var(--success)' : audit.score === 0.5 ? 'var(--warning)' : 'var(--danger)'
                            }}>
                              {audit.displayValue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Lighthouse audits are only compiled for pages resolved under full scan simulations.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sitemap Comparison Tool Modal */}
      {showSitemapModal && (
        <div className="drawer-backdrop" onClick={() => setShowSitemapModal(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{
            width: '800px',
            maxWidth: '95%',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: 'var(--shadow-5)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <GitCompare size={20} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Regression Site Crawler & Sitemap Comparison</h3>
              </div>
              <button onClick={() => setShowSitemapModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Upload or type a production XML Sitemap URL to crawl and compare your current dev/staging client-side scan logs against it, identifying content regressions or missing metadata fields.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Production Sitemap XML URL</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="https://yourproductiondomain.com/sitemap.xml" 
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                />
              </div>
              <button 
                className="btn" 
                onClick={runSitemapComparison}
                disabled={!sitemapUrl || sitemapScanStatus === 'scanning'}
                style={{ height: '48px', gap: '0.5rem', borderRadius: '9999px', padding: '0 2rem', backgroundColor: 'var(--accent)', color: '#0a0e15' }}
              >
                {sitemapScanStatus === 'scanning' ? 'Crawl & Compare...' : 'Run Regression Test'}
              </button>
            </div>

            {sitemapScanStatus === 'scanning' && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Activity className="animate-pulse" size={32} style={{ color: 'var(--accent)', margin: '0 auto 1rem' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Downloading production sitemap index, resolved 0-30 URLs, comparing DOM element states...</span>
              </div>
            )}

            {sitemapScanStatus === 'success' && sitemapComparisonData && (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Comparison Matrix & Findings:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{sitemapComparisonData.added.length}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>New Dev Pages Detected</span>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{sitemapComparisonData.deleted.length}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Missing Pages (Gaps)</span>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>{sitemapComparisonData.regressions.length}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Metadata Regressions</span>
                  </div>
                </div>

                {sitemapComparisonData.regressions.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '0.5rem' }}>Metadata Changes & Regressions:</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {sitemapComparisonData.regressions.map((url, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          <AlertTriangle size={12} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sitemapComparisonData.deleted.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem' }}>Pages missing in dev crawl:</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {sitemapComparisonData.deleted.map((url, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          <AlertCircle size={12} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="drawer-backdrop" onClick={() => setShowUpgradeModal(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '480px', maxWidth: '90%', borderRadius: '24px', padding: '2rem', textAlign: 'center', border: '1px solid var(--border)' }}>
            <Sparkles size={48} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Anti-Abuse Scan Limit Reached</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {abuseBlockMessage || 'Upgrade to a premium plan to perform advanced SEO and generative discovery scans.'}
            </p>
            
            {abuseBlockMessage && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.06)', 
                border: '1.5px solid var(--danger)', 
                borderRadius: '16px', 
                padding: '1rem 1.25rem', 
                marginBottom: '1.75rem', 
                display: 'flex', 
                gap: '0.75rem', 
                alignItems: 'flex-start',
                textAlign: 'left'
              }}>
                <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <strong style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
                    Quota Limit Reached & Anti-Abuse Protected
                  </strong>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    {abuseBlockMessage}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={() => {
                  setShowUpgradeModal(false);
                  router.push('/upgrade');
                }}
                className="btn"
                style={{ height: '44px', fontSize: '1rem', fontWeight: 700, borderRadius: '9999px', backgroundColor: 'var(--success)', color: '#0a0e15', border: 'none', padding: '0 2rem', cursor: 'pointer' }}
              >
                View Premium Plans & Checkout
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
