// src/app/upgrade/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Check } from 'lucide-react';

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
  price: string; // formatted price for display
  priceValue: string; // raw value for PayPal (e.g. '9.99')
  description: string[];
  highlight?: boolean; // to emphasize most popular
}

const packages: PackageInfo[] = [
  {
    id: '100',
    name: 'Pro (100 Scans)',
    price: '$9.99',
    priceValue: '9.99',
    description: ['100 deep‑crawler page scans', 'Core Web Vitals timing reports', 'SEO comparison tools'],
  },
  {
    id: '500',
    name: 'Pro (500 Scans)',
    price: '$19.99',
    priceValue: '19.99',
    description: [
      '500 deep‑crawler page scans',
      'Full PageSpeed audits & suggestions',
      'Advanced NWSAPI checks',
      'Priority queue processing',
    ],
    highlight: true,
  },
  {
    id: '1000',
    name: 'Pro (1000 Scans)',
    price: '$29.99',
    priceValue: '29.99',
    description: ['1000 deep‑crawler page scans', 'Full priority crawler allocation', 'Enterprise PDF audit exports'],
  },
  {
    id: 'infinite',
    name: 'Ultimate (Infinite)',
    price: '$99.99 / year',
    priceValue: '99.99',
    description: [
      'Unlimited priority crawler page audits',
      'All locks lifted',
      'Premium support & SLA',
    ],
  },
];

// ---------- Main component ----------
export default function UpgradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID'; // TODO: replace with real client ID

  useEffect(() => {
    // Load any existing plan from localStorage (used by the main app)
    const storedPlan = localStorage.getItem('hydraseo_user_plan_guest') || localStorage.getItem('hydraseo_user_plan_' + (JSON.parse(localStorage.getItem('hydraseo_active_user') || '{}').email || 'guest'));
    if (storedPlan) setCurrentPlan(storedPlan);
  }, []);

  useEffect(() => {
    // Load PayPal SDK once
    loadPayPalScript(PAYPAL_CLIENT_ID)
      .then(() => setIsLoading(false))
      .catch((e) => console.error(e));
  }, []);

  // ---------- PayPal button rendering ----------
  const renderPayPalButton = (pkg: PackageInfo) => {
    if (typeof (window as any).paypal === 'undefined') return;
    (window as any).paypal.Buttons({
      style: {
        shape: 'pill',
        color: 'gold',
        layout: 'vertical',
        label: 'pay',
      },
      createOrder: function (data: any, actions: any) {
        return actions.order.create({
          purchase_units: [{
            description: pkg.name,
            amount: {
              currency_code: 'USD',
              value: pkg.priceValue,
            },
          }],
        });
      },
      onApprove: function (data: any, actions: any) {
        return actions.order.capture().then(function (details: any) {
          // Successful payment – persist plan & redirect back to home
          const email = JSON.parse(localStorage.getItem('hydraseo_active_user') || '{}').email || 'guest';
          localStorage.setItem(`hydraseo_user_plan_${email}`, pkg.name);
          // Reset usage counters so the new quota starts fresh
          localStorage.setItem('hydraseo_fingerprint_db', JSON.stringify({}));
          // Optionally clear global scan count in the main app (it reads from storage on mount)
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

  // Re‑render PayPal buttons whenever SDK is loaded and packages change
  useEffect(() => {
    if (isLoading) return;
    packages.forEach(renderPayPalButton);
  }, [isLoading]);

  const close = () => router.push('/');

  return (
    <div className="drawer-backdrop" onClick={close} style={{ backgroundColor: 'rgba(0,0,0,0.45)', position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '2rem',
          width: '100%',
          maxWidth: '960px',
          boxShadow: 'var(--shadow-5)',
          position: 'relative',
        }}
      >
        {/* Close X */}
        <button
          onClick={close}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', textAlign: 'center' }}>
          Upgrade to HydraSEO Pro
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
          Choose the package that fits your needs and complete the payment securely with PayPal.
        </p>

        {/* Packages grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: pkg.highlight ? '2px solid var(--success)' : '1px solid var(--border)',
                borderRadius: '20px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              {pkg.highlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-0.75rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--success)',
                    color: '#0a0e15',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  Most Popular
                </div>
              )}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: pkg.highlight ? 'var(--success)' : 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {pkg.name}
              </h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{pkg.price}</span>
              </div>
              <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {pkg.description.map((line, idx) => (
                  <li key={idx} style={{ marginBottom: '0.35rem' }}>
                    <Check size={12} style={{ color: 'var(--accent)', marginRight: '0.25rem', verticalAlign: 'middle' }} /> {line}
                  </li>
                ))}
              </ul>
              {/* PayPal button container */}
              <div id={`paypal-button-${pkg.id}`} style={{ marginTop: 'auto' }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
