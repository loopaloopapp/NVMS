'use client';

import React, { useState } from 'react';
import { 
  Play, Square, AlertCircle, AlertTriangle, CheckCircle, Info, 
  ChevronRight, Download, Filter, HelpCircle, FileText, Check, ShieldAlert,
  Server, Laptop, Sparkles, ArrowRight, Gauge, Activity, Compass, Settings, ChevronDown, ChevronUp
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
  
  // Audits Accordion State
  const [openAudits, setOpenAudits] = useState<Record<string, boolean>>({});

  // Tabs inside Drawer
  const [drawerTab, setDrawerTab] = useState<'seo-diff' | 'pagespeed' | 'audits'>('seo-diff');


  const startRealScan = async () => {
    if (!urlInput) return;
    
    setIsScanning(true);
    setProgress(0);
    setResults([]);
    setSelectedResult(null);
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
    downloadAnchor.setAttribute("download", `nvms_report_${new Date().toISOString().slice(0,10)}.json`);
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
    downloadAnchor.setAttribute("download", `nvms_report_${new Date().toISOString().slice(0,10)}.csv`);
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
        <div>
          <h1>NVMS - Next.js Metadata Visibility Scanner</h1>
          <p>Dual-Phase SEO Visibility Auditor & simulated Google PageSpeed Insights performance suite.</p>
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
            style={{ height: '48px', gap: '0.5rem' }}
          >
            {isScanning ? (
              <>
                <Square size={16} fill="white" />
                Stop Audits
              </>
            ) : (
              <>
                <Play size={16} fill="white" />
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
                ⚠️ Performance Alert: Client-Side DOM Selector Engine Detected
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
                <span style={{ fontWeight: '700', color: 'var(--accent)' }}>💡 Recommended Architecture:</span>
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
                    📦 Download NWSAPI via NPM
                  </a>
                  <a 
                    href="https://github.com/dperini/nwsapi" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: '600' }}
                  >
                    💻 NWSAPI Github Repository
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
                🚀 High-Volume Server Optimization Opportunity (NWSAPI Recommendation)
              </div>
              <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                Your site is configured with an estimated **{options.estimatedQueries.toLocaleString()}** daily queries/requests. Under this high-traffic load, server-side CPU performance during SSR, dynamic scraping, or server-side DOM query processing is extremely critical. 
                Using a pre-compiled, high-performance CSS selector engine like **NWSAPI** in your server-side environment (Node.js/Next.js) will dramatically decrease TTFB, minimize memory overhead, and optimize hosting compute costs compared to generic software-based query selector implementations.
              </p>
              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                <a 
                  href="https://www.npmjs.com/package/nwsapi" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  📦 Get NWSAPI from NPM Registry
                </a>
                <a 
                  href="https://github.com/dperini/nwsapi" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  💻 Official NWSAPI GitHub Project
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
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', backgroundColor: filterSeverity === 'all' ? 'var(--accent)' : 'var(--bg-tertiary)' }}
                >
                  All Pages
                </button>
                <button 
                  onClick={() => setFilterSeverity('ok')}
                  className="btn" 
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', backgroundColor: filterSeverity === 'ok' ? 'var(--success)' : 'var(--bg-tertiary)' }}
                >
                  SSR Perfect
                </button>
                <button 
                  onClick={() => setFilterSeverity('warning')}
                  className="btn" 
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', backgroundColor: filterSeverity === 'warning' ? 'var(--warning)' : 'var(--bg-tertiary)' }}
                >
                  Warnings
                </button>
                <button 
                  onClick={() => setFilterSeverity('critical')}
                  className="btn" 
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', backgroundColor: filterSeverity === 'critical' ? 'var(--danger)' : 'var(--bg-tertiary)' }}
                >
                  Critical CSR
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn" onClick={exportToCSV} style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontSize: '0.85rem', padding: '0.5rem 1rem', gap: '0.25rem' }}>
                  <Download size={14} />
                  Export CSV
                </button>
                <button className="btn" onClick={exportToJSON} style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontSize: '0.85rem', padding: '0.5rem 1rem', gap: '0.25rem' }}>
                  <Download size={14} />
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
                        <span className={getSeverityBadgeClass(r.severity)}>{r.severity}</span>
                      </td>
                      <td>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '0.4rem 0.85rem', 
                            fontSize: '0.8rem', 
                            fontWeight: '700',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: r.lighthouse ? (r.lighthouse.scores.performance >= 90 ? 'var(--success)' : r.lighthouse.scores.performance >= 50 ? 'var(--warning)' : 'var(--danger)') : 'var(--bg-tertiary)', 
                            color: r.lighthouse ? (r.lighthouse.scores.performance >= 50 && r.lighthouse.scores.performance < 90 ? '#0b0f19' : '#ffffff') : 'var(--text-secondary)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                className="btn" 
                onClick={() => setSelectedResult(null)} 
                style={{ padding: '0.35rem 0.75rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                Close Audit
              </button>
            </div>

            {/* Custom Tab Selectors - Pagespeed Style */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setDrawerTab('seo-diff')} 
                className="btn" 
                style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem', backgroundColor: drawerTab === 'seo-diff' ? 'var(--accent)' : 'var(--bg-tertiary)' }}
              >
                SEO Visibility Diff
              </button>
              <button 
                onClick={() => setDrawerTab('pagespeed')} 
                className="btn" 
                style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem', backgroundColor: drawerTab === 'pagespeed' ? 'var(--accent)' : 'var(--bg-tertiary)' }}
              >
                Lighthouse Scores
              </button>
              <button 
                onClick={() => setDrawerTab('audits')} 
                className="btn" 
                style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem', backgroundColor: drawerTab === 'audits' ? 'var(--accent)' : 'var(--bg-tertiary)' }}
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
                                      💡 Recommended Fix / Opportunity:
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

    </div>
  );
}
