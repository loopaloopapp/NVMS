'use client';

import React, { useState } from 'react';
import { 
  Play, Square, AlertCircle, AlertTriangle, CheckCircle, Info, 
  ChevronRight, Download, Filter, HelpCircle, FileText, Check, ShieldAlert, ShieldCheck,
  Server, Laptop, Sparkles, ArrowRight, Gauge, Activity, Compass, Settings, ChevronDown, ChevronUp, Network, CornerDownRight, GitCompare,
  Sun, Moon
} from 'lucide-react';


interface ScanOption {
  limit: number;
  sameHostOnly: boolean;
  excludeQueryString: boolean;
  ignorePaths: string;
  respectRobots: boolean;
  estimatedQueries: number; // Estimated daily queries/requests
}

export default function Home() {
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
  
  // Authentication & Saved Scans States
  const [user, setUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'credentials' | 'permissions'>('credentials');
  const [authEmail, setAuthEmail] = useState('developer@gmail.com');
  const [authName, setAuthName] = useState('NextJS Developer');
  const [savedScans, setSavedScans] = useState<any[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load theme, user session and saved scans on mount
  React.useEffect(() => {
    // 🌓 Initialize Theme
    const savedTheme = localStorage.getItem('hydraseo_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const savedUser = localStorage.getItem('hydraseo_active_user') || localStorage.getItem('nvms_active_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        const scans = localStorage.getItem(`hydraseo_user_scans_${parsedUser.email}`) || localStorage.getItem(`nvms_user_scans_${parsedUser.email}`);
        if (scans) {
          const parsedScans = JSON.parse(scans);
          setSavedScans(parsedScans);
          
          // Perform dynamic brand migration on active browser
          localStorage.setItem('hydraseo_active_user', savedUser);
          localStorage.setItem(`hydraseo_user_scans_${parsedUser.email}`, scans);
        }
      } catch {}
    }
  }, []);

  // Audits Accordion State
  const [openAudits, setOpenAudits] = useState<Record<string, boolean>>({});

  // Tabs inside Drawer
  const [drawerTab, setDrawerTab] = useState<'seo-diff' | 'pagespeed' | 'audits'>('seo-diff');


  // Auth Functions
  const handleLogin = (email: string, name: string) => {
    const newUser = { email, name, avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${name}` };
    setUser(newUser);
    localStorage.setItem('hydraseo_active_user', JSON.stringify(newUser));
    setShowAuthModal(false);
    setAuthStep('credentials');
    
    // Load scans for this user with legacy fallback
    const scans = localStorage.getItem(`hydraseo_user_scans_${email}`) || localStorage.getItem(`nvms_user_scans_${email}`);
    if (scans) {
      setSavedScans(JSON.parse(scans));
    } else {
      setSavedScans([]);
    }
  };

  const handleAuthSubmit = () => {
    if (!authEmail || !authName) return;
    const scans = localStorage.getItem(`hydraseo_user_scans_${authEmail}`) || localStorage.getItem(`nvms_user_scans_${authEmail}`);
    if (scans || authStep === 'permissions') {
      // Existing user or permissions granted
      handleLogin(authEmail, authName);
    } else {
      // New user signup - ask for Google Account Permissions
      setAuthStep('permissions');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSavedScans([]);
    localStorage.removeItem('hydraseo_active_user');
    localStorage.removeItem('nvms_active_user');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('hydraseo_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const saveScanReport = (scanResults: any[], startUrl: string) => {
    const newScan = {
      id: Date.now().toString(),
      url: startUrl,
      date: new Date().toLocaleString(),
      results: scanResults,
      referralsMap: referrals
    };
    setSavedScans(prev => {
      const updated = [newScan, ...prev];
      if (user) {
        localStorage.setItem(`hydraseo_user_scans_${user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const deleteSavedScan = (id: string) => {
    setSavedScans(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (user) {
        localStorage.setItem(`hydraseo_user_scans_${user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const loadSavedScan = (scan: any) => {
    setResults(scan.results);
    setUrlInput(scan.url);
    if (scan.referralsMap) {
      setReferrals(scan.referralsMap);
    }
    setStatusMessage(`Loaded cached audit from ${scan.date}`);
  };

  // Comparison States
  const [compareSourceId, setCompareSourceId] = useState<string>('');
  const [compareTargetId, setCompareTargetId] = useState<string>('');
  const [compareResult, setCompareResult] = useState<any | null>(null);

  const handleCompare = () => {
    if (!compareSourceId || !compareTargetId) return;
    const source = savedScans.find(s => s.id === compareSourceId);
    const target = savedScans.find(s => s.id === compareTargetId);
    if (!source || !target) return;

    // Calculate score averages
    const avgScore = (resultsList: any[], category: string) => {
      if (!resultsList || resultsList.length === 0) return 0;
      const valid = resultsList.filter(r => r.lighthouseScores && r.lighthouseScores[category] !== undefined);
      if (valid.length === 0) return 0;
      return Math.round((valid.reduce((acc, curr) => acc + curr.lighthouseScores[category], 0) / valid.length) * 100);
    };

    const sourceSeo = avgScore(source.results, 'seo');
    const targetSeo = avgScore(target.results, 'seo');
    const sourcePerf = avgScore(source.results, 'performance');
    const targetPerf = avgScore(target.results, 'performance');

    // Path deltas
    const sourceUrls = new Set(source.results.map((r: any) => r.url));
    const targetUrls = new Set(target.results.map((r: any) => r.url));

    const added = target.results.filter((r: any) => !sourceUrls.has(r.url)).map((r: any) => r.url);
    const deleted = source.results.filter((r: any) => !targetUrls.has(r.url)).map((r: any) => r.url);
    
    // Regressions: paths that are in both but target has higher risk score or lower seo score
    const regressions: any[] = [];
    target.results.forEach((tarPage: any) => {
      const srcPage = source.results.find((s: any) => s.url === tarPage.url);
      if (srcPage) {
        const srcRisk = srcPage.riskScore || 0;
        const tarRisk = tarPage.riskScore || 0;
        if (tarRisk > srcRisk) {
          regressions.push({
            url: tarPage.url,
            srcRisk,
            tarRisk,
            delta: Number((tarRisk - srcRisk).toFixed(1))
          });
        }
      }
    });

    setCompareResult({
      sourceUrl: source.url,
      targetUrl: target.url,
      sourceDate: source.date,
      targetDate: target.date,
      sourceCount: source.results.length,
      targetCount: target.results.length,
      sourceSeo,
      targetSeo,
      sourcePerf,
      targetPerf,
      added,
      deleted,
      regressions
    });
  };

  const startRealScan = async () => {
    if (!urlInput) return;
    
    setIsScanning(true);
    setProgress(0);
    setResults([]);
    setSelectedResult(null);
    setReferrals({});
    setStatusMessage('Bootstrapping crawler instance...');

    let resolvedStartUrl = urlInput;
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      resolvedStartUrl = 'https://' + urlInput;
    }

    const initialQueue = [resolvedStartUrl];
    const initialVisited = new Set<string>();
    initialVisited.add(resolvedStartUrl);
    
    let count = 0;
    const finalResults: any[] = [];
    const limit = options.limit;

    const processQueue = async (currentQueue: string[], currentVisited: Set<string>) => {
      if (currentQueue.length === 0 || count >= limit) {
        setIsScanning(false);
        setStatusMessage(`Scan complete! Analysed ${count} pages with full Core Web Vitals.`);
        saveScanReport(finalResults, resolvedStartUrl);
        return;
      }

      const currentUrl = currentQueue[0];
      const remainingQueue = currentQueue.slice(1);
      
      setStatusMessage(`Auditing PageSpeed & SEO for URL (${count + 1}/${limit}): ${currentUrl}`);
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: currentUrl,
            options: {
              excludeQueryString: options.excludeQueryString,
              ignorePaths: options.ignorePaths.split(',').map(s => s.trim()).filter(Boolean),
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        
        finalResults.push(data);
        setResults([...finalResults]);
        count++;
        setProgress(Math.round((count / limit) * 100));

        const discovered = data.discoveredLinks || [];
        const nextQueue = [...remainingQueue];
        
        discovered.forEach((link: string) => {
          if (!currentVisited.has(link) && nextQueue.length + count < limit) {
            if (options.sameHostOnly) {
              try {
                const originHost = new URL(resolvedStartUrl).host;
                const linkHost = new URL(link).host;
                if (originHost !== linkHost) return;
              } catch { return; }
            }
            
            currentVisited.add(link);
            nextQueue.push(link);
            setReferrals(prev => ({ ...prev, [link]: currentUrl }));
          }
        });

        setTimeout(() => {
          processQueue(nextQueue, currentVisited);
        }, 500);

      } catch (err: any) {
        console.error(err);
        finalResults.push({
          url: currentUrl,
          status: 500,
          severity: 'critical',
          score: 10,
          issues: [{
            severity: 'critical',
            message: `Failed to analyze page: ${err.message}`,
            probableCause: 'Server block or engine timeout.',
            recommendedFix: 'Verify the browser engine is allowed by the target host.'
          }],
          diffs: [],
          initialMetadata: {},
          renderedMetadata: {},
          performanceMetrics: { ttfb: 500, domContentLoaded: 2000, loadTime: 3000, fcp: 1500, cls: 0.1 },
          lighthouse: {
            scores: { performance: 30, accessibility: 50, bestPractices: 50, seo: 30 },
            audits: []
          }
        });
        setResults([...finalResults]);
        count++;
        setProgress(Math.round((count / limit) * 100));
        
        setTimeout(() => {
          processQueue(remainingQueue, currentVisited);
        }, 500);
      }
    };

    processQueue(initialQueue, initialVisited);
  };

  const handleScanToggle = () => {
    if (isScanning) {
      setIsScanning(false);
      setStatusMessage('Scan stopped.');
    } else {
      startRealScan();
    }
  };

  const toggleAudit = (auditId: string) => {
    setOpenAudits(prev => ({ ...prev, [auditId]: !prev[auditId] }));
  };

  // Diagnostic helper functions
  const getMetricClass = (val: number, type: 'ttfb' | 'fcp' | 'dom' | 'load' | 'cls') => {
    if (type === 'ttfb') {
      return val < 200 ? 'pass' : val < 600 ? 'warn' : 'fail';
    }
    if (type === 'fcp') {
      return val < 1000 ? 'pass' : val < 3000 ? 'warn' : 'fail';
    }
    if (type === 'dom') {
      return val < 1500 ? 'pass' : val < 3500 ? 'warn' : 'fail';
    }
    if (type === 'load') {
      return val < 2000 ? 'pass' : val < 4000 ? 'warn' : 'fail';
    }
    if (type === 'cls') {
      return val < 0.1 ? 'pass' : val < 0.25 ? 'warn' : 'fail';
    }
    return 'pass';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'OK': return 'badge badge-ok';
      case 'warning': return 'badge badge-warning';
      case 'high risk': return 'badge badge-high-risk';
      case 'critical': return 'badge badge-critical';
      default: return 'badge';
    }
  };

  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hydraseo_report_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "URL,Status,Severity,Score,CSR Dependent?,Issues Count\n";
    
    results.forEach(r => {
      csvContent += `"${r.url}",${r.status},"${r.severity}",${r.score},${r.isCSRDependent ? 'YES' : 'NO'},${r.issues?.length || 0}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `hydraseo_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToSitemapXML = () => {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    results.forEach(r => {
      const escapedUrl = r.url.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
      const dateStr = new Date().toISOString().slice(0, 10);
      let priority = '0.5';
      if (r.severity === 'OK') priority = '1.0';
      else if (r.severity === 'warning') priority = '0.7';
      
      xmlContent += '  <url>\n';
      xmlContent += `    <loc>${escapedUrl}</loc>\n`;
      xmlContent += `    <lastmod>${dateStr}</lastmod>\n`;
      xmlContent += '    <changefreq>daily</changefreq>\n';
      xmlContent += `    <priority>${priority}</priority>\n`;
      xmlContent += '  </url>\n';
    });
    
    xmlContent += '</urlset>';
    
    const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sitemap.xml`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Metrics calculations
  const totalScanned = results.length;
  const okPages = results.filter(r => r.severity === 'OK').length;
  const warningPages = results.filter(r => r.severity === 'warning').length;
  const highRiskPages = results.filter(r => r.severity === 'high risk' || r.severity === 'critical').length;
  const clientRenderedMetaCount = results.filter(r => r.diffs?.some((d: any) => d.status === 'missing_initially')).length;
  const clientMetaPercent = totalScanned > 0 ? Math.round((clientRenderedMetaCount / totalScanned) * 100) : 0;

  // Check if any audited page has bundled heavy DOM libraries
  const detectedSelectorEngineResult = results.find(r => {
    const selectorAudit = r.lighthouse?.audits?.find((a: any) => a.id === 'selector-engine');
    return selectorAudit && selectorAudit.score < 1.0;
  });
  const selectorAuditInfo = detectedSelectorEngineResult?.lighthouse?.audits?.find((a: any) => a.id === 'selector-engine');
  const hasSelectorEngineWarning = !!detectedSelectorEngineResult;

  const filteredResults = results.filter(r => {
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'ok') return r.severity === 'OK';
    if (filterSeverity === 'warning') return r.severity === 'warning';
    if (filterSeverity === 'critical') return r.severity === 'high risk' || r.severity === 'critical';
    return true;
  });

  return (
    <div className="container">
      {/* Header */}
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src="/hydraseo-logo.png" 
            alt="HydraSEO Logo" 
            style={{ width: '56px', height: '56px', objectFit: 'contain' }} 
          />
          <div>
            <h1 style={{ background: 'linear-gradient(135deg, #7dd3fc, var(--accent), var(--success))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.75rem', fontWeight: 800 }}>HydraSEO</h1>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>Enterprise Technical SEO Auditor & Core Web Vitals Suite</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Empowering engineering teams with high-speed SSR diagnostics, hydration mismatch audits, and cross-environment comparative insights.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* 🌓 Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.25s',
              boxShadow: 'var(--shadow-1)'
            }}
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
              <button 
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ 
                  marginLeft: '0.5rem',
                  padding: '0.4rem 1.25rem', 
                  fontSize: '0.75rem', 
                  borderRadius: '9999px', 
                  color: 'var(--danger)', 
                  border: '1.5px solid var(--danger)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  textTransform: 'none',
                  height: '32px'
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="btn btn-secondary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.4rem 1.5rem', 
                borderRadius: '9999px', 
                fontSize: '0.8rem',
                backgroundColor: 'transparent',
                color: 'var(--accent)',
                border: '1.5px solid var(--accent)',
                boxShadow: 'none',
                textTransform: 'none',
                height: '36px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#b6c4ff"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34d399"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#fbbf24"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#f87171"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      {/* Settings Form */}
      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          <Settings size={18} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Audit Configuration</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
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
            <label>Estimated Daily Queries / Traffic</label>
            <input 
              type="number" 
              className="input" 
              value={options.estimatedQueries} 
              onChange={(e) => setOptions({...options, estimatedQueries: Number(e.target.value)})}
              disabled={isScanning}
              min={1}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              Evaluates server-side CPU performance requirements for NWSAPI optimization.
            </span>
          </div>
        </div>
      </div>

      {/* 🌟 Guest CTA - Create New Account Option */}
      {!user && (
        <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--success)', backgroundColor: 'rgba(122, 194, 112, 0.03)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
            <Sparkles size={20} style={{ color: 'var(--success)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Unlock Personalized Cloud Archiving</h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Sign up for a free HydraSEO account using Google Secure Auth. You will unlock cloud-saved audits, SEO risk change tracking over time, and side-by-side Staging vs Production comparison features.
          </p>
          <button 
            onClick={() => {
              setAuthStep('credentials');
              setShowAuthModal(true);
            }}
            className="btn"
            style={{ 
              backgroundColor: 'var(--success)', 
              color: '#0a0e15',
              padding: '0.6rem 1.5rem', 
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '9999px',
              border: 'none',
              boxShadow: 'none',
              textTransform: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Create New Account (Google Sign Up)
          </button>
        </div>
      )}

      {/* User Saved Audits History (Only for Logged-In Users) */}
      {user && (
        <>
          <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <FileText size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Saved Audits Index ({user.name})</h2>
          </div>
          
          {savedScans.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No saved scans found. Run a new audit above and it will be archived automatically under your Google Workspace.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {savedScans.map((scan) => (
                <div 
                  key={scan.id} 
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '10px', 
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    transition: 'border-color 0.2s',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '75%'
                      }}>
                        {scan.url}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {scan.results?.length || 0} pages
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Crawled: {scan.date}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => loadSavedScan(scan)}
                      className="btn" 
                      style={{ 
                        flex: 1, 
                        padding: '0.4rem 1rem', 
                        fontSize: '0.75rem', 
                        borderRadius: '9999px', 
                        border: 'none', 
                        cursor: 'pointer',
                        textTransform: 'none',
                        boxShadow: 'none',
                        height: '32px'
                      }}
                    >
                      Restore Report
                    </button>
                    <button 
                      onClick={() => deleteSavedScan(scan.id)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.4rem 1rem', 
                        fontSize: '0.75rem', 
                        borderRadius: '9999px', 
                        color: 'var(--danger)',
                        border: '1.5px solid var(--danger)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        textTransform: 'none',
                        boxShadow: 'none',
                        height: '32px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparative Staging vs Production SEO Auditor */}
        {savedScans.length >= 2 && (
          <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <GitCompare size={18} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Staging vs Production Technical Compare</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Baseline / Production Audit</label>
                <select 
                  className="input" 
                  value={compareSourceId} 
                  onChange={(e) => setCompareSourceId(e.target.value)}
                >
                  <option value="">Select baseline audit...</option>
                  {savedScans.map(s => (
                    <option key={s.id} value={s.id}>{s.url} ({s.date})</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Compare / Staging Audit</label>
                <select 
                  className="input" 
                  value={compareTargetId} 
                  onChange={(e) => setCompareTargetId(e.target.value)}
                >
                  <option value="">Select staging audit...</option>
                  {savedScans.map(s => (
                    <option key={s.id} value={s.id}>{s.url} ({s.date})</option>
                  ))}
                </select>
              </div>
              
              <button 
                className="btn" 
                onClick={handleCompare}
                disabled={!compareSourceId || !compareTargetId}
                style={{ height: '42px', borderRadius: '9999px', textTransform: 'none', padding: '0 1.5rem', boxShadow: 'none' }}
              >
                Analyze Differences
              </button>
            </div>
            
            {compareResult && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Audited Routes Count</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                      {compareResult.sourceCount} vs {compareResult.targetCount}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: compareResult.targetCount >= compareResult.sourceCount ? 'var(--success)' : 'var(--warning)' }}>
                      {compareResult.targetCount - compareResult.sourceCount >= 0 ? `+${compareResult.targetCount - compareResult.sourceCount} pages` : `${compareResult.targetCount - compareResult.sourceCount} pages`}
                    </span>
                  </div>
                  
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Average SEO Quality</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--success)' }}>
                      {compareResult.sourceSeo}% vs {compareResult.targetSeo}%
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: compareResult.targetSeo >= compareResult.sourceSeo ? 'var(--success)' : 'var(--danger)' }}>
                      {compareResult.targetSeo - compareResult.sourceSeo >= 0 ? `+${compareResult.targetSeo - compareResult.sourceSeo}% improvement` : `${compareResult.targetSeo - compareResult.sourceSeo}% regression`}
                    </span>
                  </div>
                  
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Average Performance Speed</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--success)' }}>
                      {compareResult.sourcePerf}% vs {compareResult.targetPerf}%
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: compareResult.targetPerf >= compareResult.sourcePerf ? 'var(--success)' : 'var(--danger)' }}>
                      {compareResult.targetPerf - compareResult.sourcePerf >= 0 ? `+${compareResult.targetPerf - compareResult.sourcePerf}% speedup` : `${compareResult.targetPerf - compareResult.sourcePerf}% slowdown`}
                    </span>
                  </div>
                </div>
                
                {/* Regressions alert */}
                {compareResult.regressions.length > 0 && (
                  <div style={{ backgroundColor: 'rgba(250, 82, 82, 0.03)', border: '1px solid rgba(250, 82, 82, 0.15)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Technical SEO Risk Regressions Detected
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      The following pages show an elevated SEO risk index in the staging environment. This is typically due to new heavy CSR hydration reliance or missing canonical/meta tags:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {compareResult.regressions.map((reg: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{reg.url}</span>
                          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>+{reg.delta} risk index increase ({reg.srcRisk} to {reg.tarRisk})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                      New Discovered Paths ({compareResult.added.length})
                    </h4>
                    {compareResult.added.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No new paths discovered in comparison scan.</span>
                    ) : (
                      <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '0.25rem', listStyleType: 'none' }}>
                        {compareResult.added.map((path: string, i: number) => <li key={i}>{path}</li>)}
                      </ul>
                    )}
                  </div>
                  
                  <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                      Removed / Missing Paths ({compareResult.deleted.length})
                    </h4>
                    {compareResult.deleted.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No paths removed in comparison scan.</span>
                    ) : (
                      <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '0.25rem', listStyleType: 'none' }}>
                        {compareResult.deleted.map((path: string, i: number) => <li key={i}>{path}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </>
      )}

      {/* Progress */}
      {isScanning && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity className="animate-pulse" size={16} style={{ color: 'var(--accent)' }} />
              Running Technical Audits...
            </span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                    backgroundColor: filterSeverity === 'ok' ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-tertiary)',
                    color: filterSeverity === 'ok' ? 'var(--success)' : 'var(--text-secondary)',
                    border: filterSeverity === 'ok' ? '1px solid var(--success)' : '1px solid var(--border)'
                  }}
                >
                  SSR Perfect
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
                    backgroundColor: filterSeverity === 'warning' ? 'rgba(251, 191, 36, 0.15)' : 'var(--bg-tertiary)',
                    color: filterSeverity === 'warning' ? 'var(--warning)' : 'var(--text-secondary)',
                    border: filterSeverity === 'warning' ? '1px solid var(--warning)' : '1px solid var(--border)'
                  }}
                >
                  Warnings
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
                    backgroundColor: filterSeverity === 'critical' ? 'rgba(248, 113, 113, 0.15)' : 'var(--bg-tertiary)',
                    color: filterSeverity === 'critical' ? 'var(--danger)' : 'var(--text-secondary)',
                    border: filterSeverity === 'critical' ? '1px solid var(--danger)' : '1px solid var(--border)'
                  }}
                >
                  Critical CSR
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn" 
                  onClick={exportToSitemapXML} 
                  style={{ 
                    backgroundColor: 'var(--accent-container)', 
                    border: '1px solid rgba(182, 196, 255, 0.2)', 
                    color: 'var(--on-accent-container)', 
                    fontSize: '0.8rem', 
                    padding: '0.4rem 1rem', 
                    gap: '0.25rem', 
                    fontWeight: '700',
                    borderRadius: '9999px',
                    textTransform: 'none',
                    height: '34px',
                    boxShadow: 'none'
                  }}
                >
                  <Sparkles size={13} style={{ color: 'var(--accent)' }} />
                  Generate Sitemap.xml
                </button>
                <button 
                  className="btn" 
                  onClick={exportToCSV} 
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border)', 
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem', 
                    padding: '0.4rem 1rem', 
                    gap: '0.25rem',
                    borderRadius: '9999px',
                    textTransform: 'none',
                    height: '34px',
                    boxShadow: 'none'
                  }}
                >
                  <Download size={13} />
                  Export CSV
                </button>
                <button 
                  className="btn" 
                  onClick={exportToJSON} 
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border)', 
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem', 
                    padding: '0.4rem 1rem', 
                    gap: '0.25rem',
                    borderRadius: '9999px',
                    textTransform: 'none',
                    height: '34px',
                    boxShadow: 'none'
                  }}
                >
                  <Download size={13} />
                  Export JSON
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
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
                            {(r.performanceMetrics.loadTime / 1000).toFixed(2)}s
                          </span>
                        ) : 'Pending'}
                      </td>
                      <td>
                        <span className={getSeverityBadgeClass(r.severity)}>{r.severity}</span>
                      </td>
                      <td>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '0.4rem 1rem', 
                            fontSize: '0.75rem', 
                            borderRadius: '9999px',
                            border: r.lighthouse ? `1.5px solid ${getScoreColor(r.lighthouse.scores.performance)}` : '1px solid var(--border)',
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                            color: r.lighthouse ? getScoreColor(r.lighthouse.scores.performance) : 'var(--text-secondary)',
                            boxShadow: 'none',
                            textTransform: 'none',
                            height: '30px',
                            fontWeight: '700'
                          }}
                        >
                          View Audit Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 🌐 Interactive Visual Crawl Hierarchy Map */}
          <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Network size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Interactive Crawl Hierarchy Map</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                Visualizes site structure and internal link pathway discoveries
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem', 
              maxHeight: '400px', 
              overflowY: 'auto', 
              padding: '0.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}>
              {results.map((r, i) => {
                const parent = referrals[r.url];
                const hasParent = !!parent;
                
                let statusBadge = (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <Server size={12} /> SSR
                  </span>
                );
                
                const robotsAudit = r.lighthouse?.audits?.find((a: any) => a.id === 'seo-robots');
                const isDisallowed = robotsAudit && robotsAudit.score < 1.0;
                
                if (isDisallowed) {
                  statusBadge = (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      <ShieldAlert size={12} /> BLOCKED (robots.txt)
                    </span>
                  );
                } else if (r.status === 404) {
                  statusBadge = (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      <AlertTriangle size={12} /> 404 BROKEN
                    </span>
                  );
                } else if (r.isCSRDependent) {
                  statusBadge = (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      <Laptop size={12} /> CSR (Heavy JS)
                    </span>
                  );
                }

                return (
                  <div 
                    key={i} 
                    onClick={() => { setSelectedResult(r); setDrawerTab('seo-diff'); }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginLeft: hasParent ? '1.5rem' : '0px',
                      borderLeft: isDisallowed || r.status === 404 ? '4px solid var(--danger)' : r.isCSRDependent ? '4px solid var(--warning)' : '4px solid var(--success)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {hasParent && (
                      <div style={{
                        position: 'absolute',
                        left: '-1rem',
                        top: '50%',
                        width: '1rem',
                        height: '1px',
                        backgroundColor: 'var(--border)',
                        borderLeft: '1px solid var(--border)',
                        transform: 'translateY(-50%)'
                      }} />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.url}
                      </span>
                      {statusBadge}
                    </div>
                    
                    {hasParent && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CornerDownRight size={10} style={{ color: 'var(--accent)' }} />
                        Discovered on: <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{parent}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Inspect drawer drawer */}
      {selectedResult && (
        <div className="drawer-backdrop" onClick={() => setSelectedResult(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass style={{ color: 'var(--accent)' }} />
                  Page Auditor Report
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedResult.url}
                </span>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedResult(null)} 
                style={{ 
                  padding: '0.4rem 1.25rem', 
                  backgroundColor: 'transparent', 
                  border: '1.5px solid var(--accent)', 
                  color: 'var(--accent)', 
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
              >
                Close Audit
              </button>
            </div>

            {/* Custom Tab Selectors - Pagespeed Style */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setDrawerTab('seo-diff')} 
                className="btn" 
                style={{ 
                  flex: 1, 
                  fontSize: '0.8rem', 
                  padding: '0.5rem', 
                  borderRadius: '9999px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  backgroundColor: drawerTab === 'seo-diff' ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: drawerTab === 'seo-diff' ? '#121318' : 'var(--text-secondary)',
                  border: drawerTab === 'seo-diff' ? 'none' : '1px solid var(--border)'
                }}
              >
                SEO Visibility Diff
              </button>
              <button 
                onClick={() => setDrawerTab('pagespeed')} 
                className="btn" 
                style={{ 
                  flex: 1, 
                  fontSize: '0.8rem', 
                  padding: '0.5rem', 
                  borderRadius: '9999px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  backgroundColor: drawerTab === 'pagespeed' ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: drawerTab === 'pagespeed' ? '#121318' : 'var(--text-secondary)',
                  border: drawerTab === 'pagespeed' ? 'none' : '1px solid var(--border)'
                }}
              >
                Lighthouse Scores
              </button>
              <button 
                onClick={() => setDrawerTab('audits')} 
                className="btn" 
                style={{ 
                  flex: 1, 
                  fontSize: '0.8rem', 
                  padding: '0.5rem', 
                  borderRadius: '9999px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  backgroundColor: drawerTab === 'audits' ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: drawerTab === 'audits' ? '#121318' : 'var(--text-secondary)',
                  border: drawerTab === 'audits' ? 'none' : '1px solid var(--border)'
                }}
              >
                Passed & Failed Audits
              </button>
            </div>

            {/* TAB 1: SEO Visibility Head Diff */}
            {drawerTab === 'seo-diff' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div className="stat-card" style={{ padding: '1rem' }}>
                    <span className="value" style={{ fontSize: '1.75rem' }}>{selectedResult.score}</span>
                    <span className="label">SEO Risk Index</span>
                  </div>
                  <div className="stat-card" style={{ padding: '1rem' }}>
                    <span className={getSeverityBadgeClass(selectedResult.severity)} style={{ fontSize: '0.85rem' }}>
                      {selectedResult.severity}
                    </span>
                    <span className="label" style={{ marginTop: '0.5rem' }}>Risk Level</span>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Detected Hydration Mismatch Issues</h4>
                  {selectedResult.issues && selectedResult.issues.length > 0 ? (
                    selectedResult.issues.map((issue: any, idx: number) => (
                      <div key={idx} className={`issue-card ${issue.severity === 'warning' ? 'warning' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                          {issue.severity === 'warning' ? (
                            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                          ) : (
                            <ShieldAlert size={16} style={{ color: 'var(--danger)' }} />
                          )}
                          <span>{issue.message}</span>
                        </div>
                        <p style={{ margin: '0.5rem 0' }}>
                          <strong>Vulnerability Cause:</strong> {issue.probableCause}
                        </p>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          <Sparkles size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                          <span className="fix" style={{ fontSize: '0.85rem' }}>
                            <strong>NextJS Fix:</strong> {issue.recommendedFix}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle size={18} />
                      <span>Perfect server SEO setup! Safe from search engine index parsing delays.</span>
                    </div>
                  )}
                </div>

                {/* Head Tag Comparison Diffs */}
                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Before/After JS Comparison</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Highlighting differences between the server HTML raw payload and Playwright hydrated client DOM representation.
                </p>

                {/* Title */}
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Title Meta Tag</span>
                    {selectedResult.initialMetadata?.title?.value !== selectedResult.renderedMetadata?.title?.value && (
                      <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>CSR Hydrated Only</span>
                    )}
                  </div>
                  <div className="diff-grid">
                    <div className="diff-box">
                      <h4>Server (Initial HTML)</h4>
                      <div className="diff-value" style={{ color: selectedResult.initialMetadata?.title?.value ? 'inherit' : 'var(--danger)' }}>
                        {selectedResult.initialMetadata?.title?.value || '[Not Found on Server]'}
                      </div>
                    </div>
                    <div className="diff-box">
                      <h4>Client (Post JS Render)</h4>
                      <div className="diff-value">
                        {selectedResult.renderedMetadata?.title?.value || '[Not Found]'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Description Meta Tag</span>
                    {selectedResult.initialMetadata?.description?.value !== selectedResult.renderedMetadata?.description?.value && (
                      <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>CSR Hydrated Only</span>
                    )}
                  </div>
                  <div className="diff-grid">
                    <div className="diff-box">
                      <h4>Server (Initial HTML)</h4>
                      <div className="diff-value" style={{ color: selectedResult.initialMetadata?.description?.value ? 'inherit' : 'var(--danger)' }}>
                        {selectedResult.initialMetadata?.description?.value || '[Not Found on Server]'}
                      </div>
                    </div>
                    <div className="diff-box">
                      <h4>Client (Post JS Render)</h4>
                      <div className="diff-value">
                        {selectedResult.renderedMetadata?.description?.value || '[Not Found]'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canonical */}
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Canonical Link Tag</span>
                    {selectedResult.initialMetadata?.canonical?.value !== selectedResult.renderedMetadata?.canonical?.value && (
                      <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>CSR Hydrated Only</span>
                    )}
                  </div>
                  <div className="diff-grid">
                    <div className="diff-box">
                      <h4>Server (Initial HTML)</h4>
                      <div className="diff-value" style={{ color: selectedResult.initialMetadata?.canonical?.value ? 'inherit' : 'var(--danger)' }}>
                        {selectedResult.initialMetadata?.canonical?.value || '[Not Found on Server]'}
                      </div>
                    </div>
                    <div className="diff-box">
                      <h4>Client (Post JS Render)</h4>
                      <div className="diff-value">
                        {selectedResult.renderedMetadata?.canonical?.value || '[Not Found]'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PageSpeed Scores & timings */}
            {drawerTab === 'pagespeed' && (
              <div>
                {/* Circular Gauges */}
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Lighthouse PageSpeed Categories</h4>
                {selectedResult.lighthouse ? (
                  <div className="score-circles-container">
                    <div className="score-circle-wrapper">
                      <div 
                        className="score-circle" 
                        style={{ 
                          '--score-color': getScoreColor(selectedResult.lighthouse.scores.performance),
                          '--score-val': selectedResult.lighthouse.scores.performance 
                        } as any}
                      >
                        <span className="score-circle-value">{selectedResult.lighthouse.scores.performance}</span>
                      </div>
                      <span className="score-circle-label">Performance</span>
                    </div>

                    <div className="score-circle-wrapper">
                      <div 
                        className="score-circle" 
                        style={{ 
                          '--score-color': getScoreColor(selectedResult.lighthouse.scores.accessibility),
                          '--score-val': selectedResult.lighthouse.scores.accessibility 
                        } as any}
                      >
                        <span className="score-circle-value">{selectedResult.lighthouse.scores.accessibility}</span>
                      </div>
                      <span className="score-circle-label">Accessibility</span>
                    </div>

                    <div className="score-circle-wrapper">
                      <div 
                        className="score-circle" 
                        style={{ 
                          '--score-color': getScoreColor(selectedResult.lighthouse.scores.bestPractices),
                          '--score-val': selectedResult.lighthouse.scores.bestPractices 
                        } as any}
                      >
                        <span className="score-circle-value">{selectedResult.lighthouse.scores.bestPractices}</span>
                      </div>
                      <span className="score-circle-label">Best Practices</span>
                    </div>

                    <div className="score-circle-wrapper">
                      <div 
                        className="score-circle" 
                        style={{ 
                          '--score-color': getScoreColor(selectedResult.lighthouse.scores.seo),
                          '--score-val': selectedResult.lighthouse.scores.seo 
                        } as any}
                      >
                        <span className="score-circle-value">{selectedResult.lighthouse.scores.seo}</span>
                      </div>
                      <span className="score-circle-label">SEO Suite</span>
                    </div>
                  </div>
                ) : (
                  <p>Lighthouse data unavailable.</p>
                )}

                {/* Core Web Vitals timings */}
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Simulated Real-User Experience Timings</h4>
                {selectedResult.performanceMetrics ? (
                  <div className="performance-metrics-row">
                    <div className={`metric-item ${getMetricClass(selectedResult.performanceMetrics.ttfb, 'ttfb')}`}>
                      <span className="metric-item-name">Time to First Byte (TTFB)</span>
                      <span className="metric-item-value">{selectedResult.performanceMetrics.ttfb} ms</span>
                    </div>
                    <div className={`metric-item ${getMetricClass(selectedResult.performanceMetrics.fcp, 'fcp')}`}>
                      <span className="metric-item-name">First Contentful Paint</span>
                      <span className="metric-item-value">{(selectedResult.performanceMetrics.fcp / 1000).toFixed(2)} s</span>
                    </div>
                    <div className={`metric-item ${getMetricClass(selectedResult.performanceMetrics.domContentLoaded, 'dom')}`}>
                      <span className="metric-item-name">DOM Interactive Time</span>
                      <span className="metric-item-value">{(selectedResult.performanceMetrics.domContentLoaded / 1000).toFixed(2)} s</span>
                    </div>
                    <div className={`metric-item ${getMetricClass(selectedResult.performanceMetrics.cls, 'cls')}`}>
                      <span className="metric-item-name">Cumulative Layout Shift</span>
                      <span className="metric-item-value">{selectedResult.performanceMetrics.cls}</span>
                    </div>
                  </div>
                ) : (
                  <p>Performance timings unavailable.</p>
                )}
              </div>
            )}

            {/* TAB 3: Passed & Failed checklist Audits */}
            {drawerTab === 'audits' && (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Technical Diagnostics & Audits</h4>
                {selectedResult.lighthouse?.audits ? (
                  <div>
                    {/* Categories Filter in Audits tab */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedResult.lighthouse.audits.map((audit: any, aIdx: number) => {
                        const isExpanded = !!openAudits[audit.id];
                        const isPass = audit.score >= 0.9;
                        const isWarn = audit.score >= 0.5 && audit.score < 0.9;
                        
                        return (
                          <div key={aIdx} className="audit-list-item">
                            <div className="audit-header" onClick={() => toggleAudit(audit.id)}>
                              <div className="audit-title-section">
                                <div className={`audit-indicator ${isPass ? 'pass' : isWarn ? 'warn' : 'fail'}`}></div>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{audit.title}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                  {audit.displayValue}
                                </span>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="audit-details-panel">
                                <p style={{ marginBottom: '0.75rem' }}>{audit.description}</p>
                                
                                {audit.recommendedFix && (
                                  <div style={{ 
                                    backgroundColor: 'rgba(59, 130, 246, 0.06)', 
                                    border: '1px solid rgba(59, 130, 246, 0.2)', 
                                    padding: '0.75rem 1rem', 
                                    borderRadius: '8px', 
                                    marginBottom: '0.75rem',
                                    fontSize: '0.85rem',
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem'
                                  }}>
                                    <span style={{ fontWeight: '700', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <Sparkles size={14} />
                                      Recommended Fix / Opportunity:
                                    </span>
                                    <span>{audit.recommendedFix}</span>
                                  </div>
                                )}

                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                  <span><strong>Audit Category:</strong> {audit.category.toUpperCase()}</span>
                                  <span><strong>Score Index:</strong> {audit.score * 100}/100</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p>Audit log unavailable.</p>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* 🔐 Google OAuth Login Modal Simulation */}
      {showAuthModal && (
        <div className="drawer-backdrop" onClick={() => setShowAuthModal(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              border: '1px solid var(--border)', 
              borderRadius: '24px', 
              padding: '2.5rem', 
              width: '100%', 
              maxWidth: '440px', 
              boxShadow: 'var(--shadow-5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {authStep === 'credentials' ? (
              <>
                {/* Google Logo Brand Icon */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--accent)"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--success)"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="var(--warning)"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="var(--danger)"/>
                  </svg>
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Sign in to HydraSEO</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  to continue to your Technical SEO & simulated Core Web Vitals Auditor dashboard.
                </p>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
                  <div className="form-group" style={{ textAlign: 'left', marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Google Email Address</label>
                    <input 
                      type="email" 
                      className="input" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ textAlign: 'left', marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Profile Display Name</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', width: '100%', gap: '0.75rem' }}>
                  <button 
                    onClick={handleAuthSubmit}
                    className="btn"
                    style={{ flex: 1, height: '44px', fontWeight: 700, borderRadius: '9999px', textTransform: 'none', boxShadow: 'none' }}
                  >
                    Continue
                  </button>
                  <button 
                    onClick={() => setShowAuthModal(false)}
                    className="btn btn-secondary"
                    style={{ 
                      flex: 1, 
                      height: '44px', 
                      borderRadius: '9999px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'none'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Shield Check Icon for Google Permission Granting */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(31, 164, 232, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--accent)' }}>
                    <ShieldCheck size={32} style={{ color: 'var(--accent)' }} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Google OAuth Permissions</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  HydraSEO wants to access your Google Account (<b>{authEmail}</b>) for your new registration.
                </p>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', textAlign: 'left', backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                    <input type="checkbox" defaultChecked disabled style={{ accentColor: 'var(--accent)', marginTop: '0.2rem' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <b>openid, profile, email</b><br />
                      <span style={{ color: 'var(--text-secondary)' }}>View your basic account profile name, email, and avatar photo.</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', marginTop: '0.2rem' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <b>drive.appdata</b> (Technical Audits)<br />
                      <span style={{ color: 'var(--text-secondary)' }}>Save, sync, and retrieve your Technical SEO & Core Web Vitals reports.</span>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', width: '100%', gap: '0.75rem' }}>
                  <button 
                    onClick={() => handleLogin(authEmail, authName)}
                    className="btn"
                    style={{ flex: 1, height: '44px', fontWeight: 700, borderRadius: '9999px', textTransform: 'none', boxShadow: 'none' }}
                  >
                    Grant & Complete Sign Up
                  </button>
                  <button 
                    onClick={() => setAuthStep('credentials')}
                    className="btn btn-secondary"
                    style={{ 
                      flex: 1, 
                      height: '44px', 
                      borderRadius: '9999px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'none'
                    }}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
