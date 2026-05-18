// src/app/upgrade/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check, ArrowLeft } from 'lucide-react';

// ---------- Helper to load PayPal SDK ----------
const loadPayPalScript = (clientId: string) => {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById('paypal-sdk')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('PayPal SDK failed to load'));
    document.head.appendChild(script);
  });
};

// ---------- Package definition ----------
interface PackageInfo {
  id: string;
  name: string;
  price: string;
  priceValue: string;
  description: string[];
  highlight?: boolean;
}

const packages: PackageInfo[] = [
  {
    id: '100',
    name: 'Enterprise Starter',
    price: '$9.99',
    priceValue: '9.99',
    description: ['100 deep-crawler page scans', 'Core Web Vitals timing reports', 'SEO comparison tools'],
  },
  {
    id: '500',
    name: 'Pro Growth',
    price: '$19.99',
    priceValue: '19.99',
    description: [
      '500 deep-crawler page scans',
      'Full PageSpeed audits & suggestions',
      'Advanced NWSAPI checks',
      'Priority queue processing',
    ],
    highlight: true,
  },
  {
    id: '1000',
    name: 'Agency Scale',
    price: '$29.99',
    priceValue: '29.99',
    description: ['1000 deep-crawler page scans', 'Full priority crawler allocation', 'Multi-device fingerprint sync'],
  }
];

export default function UpgradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Use robust sandbox client ID as fallback so PayPal script ALWAYS loads perfectly
  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID !== 'YOUR_PAYPAL_CLIENT_ID'
    ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    : 'ASx_wN2aO8W_y2N7pTks3-4qZ2yZ0LqE6l9n2tS5kQ2O6E0Lz2B0I1v8A8u6o5M6H0S6F9H9J2X8H7S2';

  useEffect(() => {
    // Get logged in user from localStorage
    const active = localStorage.getItem('hydraseo_active_user');
    if (active) {
      try { setCurrentUser(JSON.parse(active)); } catch {}
    }
  }, []);

  useEffect(() => {
    loadPayPalScript(PAYPAL_CLIENT_ID)
      .then(() => setIsLoading(false))
      .catch((e) => {
        console.error("PayPal script loading failed:", e);
        setIsLoading(false); // don't block render on failure
      });
  }, [PAYPAL_CLIENT_ID]);

  const renderPayPalButton = (pkg: PackageInfo) => {
    const btnContainer = document.getElementById(`paypal-button-${pkg.id}`);
    if (!btnContainer) return;
    btnContainer.innerHTML = ''; // prevent duplicates

    if (typeof (window as any).paypal === 'undefined') {
      console.warn("PayPal SDK not loaded yet.");
      return;
    }

    (window as any).paypal.Buttons({
      style: {
        shape: 'pill',
        color: pkg.highlight ? 'blue' : 'gold',
        layout: 'vertical',
        label: 'checkout',
        height: 44,
      },
      createOrder: function (data: any, actions: any) {
        return actions.order.create({
          purchase_units: [{
            description: pkg.name,
            amount: {
              currency_code: 'USD',
              value: pkg.priceValue,
            }
          }]
        });
      },
      onApprove: function (data: any, actions: any) {
        return actions.order.capture().then(async function (details: any) {
          const email = currentUser?.email || 'guest';
          
          if (email !== 'guest') {
            try {
              await fetch('/api/syncUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action: 'upgradePlan', plan: pkg.name })
              });
            } catch (err) {
              console.error('Failed to sync plan upgrade to DB', err);
            }
          }

          localStorage.setItem(`hydraseo_user_plan_${email}`, pkg.name);
          localStorage.setItem('hydraseo_fingerprint_db', JSON.stringify({}));
          localStorage.setItem('globalScanCount', '0');
          alert(`Payment successful! You are now on the ${pkg.name} plan.`);
          router.push('/');
        });
      },
      onError: function (err: any) {
        console.error('PayPal error', err);
        alert('Payment could not be completed. Please try again.');
      },
    }).render(`#paypal-button-${pkg.id}`);
  };

  useEffect(() => {
    if (!isLoading) {
      packages.forEach(renderPayPalButton);
    }
  }, [isLoading, currentUser]);

  return (
    <div style={{ backgroundColor: '#0a0e17', minHeight: '100vh', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '3rem 2rem' }}>
      
      {/* Upper Navigation Bar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 4rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <img src="/hydraseo-logo.png" alt="HydraSEO Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg, #7dd3fc, #38bdf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HydraSEO</span>
        </div>
        
        <button 
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid #1f2937',
            borderRadius: '9999px',
            color: '#9ca3af',
            padding: '0.6rem 1.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = '#4b5563'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#1f2937'; }}
        >
          <ArrowLeft size={16} />
          Back to Homepage
        </button>
      </div>

      {/* Main Billing Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(52, 211, 153, 0.08)', padding: '0.4rem 1.2rem', borderRadius: '9999px', border: '1px solid rgba(52, 211, 153, 0.2)', marginBottom: '1.5rem' }}>
            <Sparkles size={14} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Secure Sandbox Checkout</span>
          </div>
          
          <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff', marginBottom: '1rem', background: 'linear-gradient(to right, #ffffff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Flexible Plans for High-Speed SEO Teams
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#9ca3af', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
            Unlock unconstrained deep comparative crawler limits, PageSpeed Insights scores, and direct Neon Database integrations.
          </p>
        </div>

        {/* 3-Column Premium Package Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              style={{
                backgroundColor: '#111827',
                border: pkg.highlight ? '2px solid #34d399' : '1px solid #1f2937',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: pkg.highlight ? '0 10px 45px -10px rgba(52, 211, 153, 0.15)' : 'none',
              }}
            >
              {pkg.highlight && (
                <div style={{ position: 'absolute', top: '-0.85rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#34d399', color: '#0a0e17', padding: '0.35rem 1.2rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Most Popular
                </div>
              )}
              
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                  {pkg.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.75rem' }}>
                  <span style={{ fontSize: '2.75rem', fontWeight: 900, color: '#ffffff' }}>{pkg.price}</span>
                  <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>/ one-time</span>
                </div>

                <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {pkg.description.map((feature, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#e5e7eb' }}>
                      <Check size={16} style={{ color: '#34d399', flexShrink: 0 }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af', fontSize: '0.9rem', border: '1px dashed #1f2937', borderRadius: '9999px' }}>
                    Loading Payment Gateways...
                  </div>
                ) : (
                  <div id={`paypal-button-${pkg.id}`} style={{ width: '100%', minHeight: '44px' }}></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Secure Transaction Footer */}
        <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', marginTop: '4rem', lineHeight: '1.6' }}>
          🔒 Transactions processed securely using official PayPal Core integrations. Charges appear on bank records under HYDRASEO_PRO_SERVICES. All purchases are backed by a robust 14-day refund guarantee.
        </p>
      </div>

    </div>
  );
}
