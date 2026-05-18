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
    description: ['1000 deep-crawler page scans', 'Full priority crawler allocation'],
  }
];

// ---------- Main component ----------
export default function UpgradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID';

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
        layout: 'horizontal',
        label: 'pay',
        height: 40,
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
        return actions.order.capture().then(async function (details: any) {
          // Successful payment – persist plan & redirect back to home
          const email = JSON.parse(localStorage.getItem('hydraseo_active_user') || '{}').email || 'guest';
          
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
    <div className="drawer-backdrop" onClick={close} style={{ backgroundColor: '#000000', position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0a0e15',
          border: '1px solid #1f2937',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: '920px',
          position: 'relative',
        }}
      >
        {/* Close X */}
        <button
          onClick={close}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.08)', padding: '0.4rem 1rem', borderRadius: '9999px', border: '1px solid rgba(76, 175, 80, 0.2)', marginBottom: '1.25rem' }}>
            <Sparkles size={14} style={{ color: '#4ade80' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Secure Enterprise Billing</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Upgrade to HydraSEO Pro
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#9ca3af', margin: 0 }}>
            Select a package to unlock dynamic crawler credits and run unconstrained scans.
          </p>
        </div>

        {/* Packages grid: Custom 2-column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>
          
          {/* Left Column: Stacked Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Enterprise Starter */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '20px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {packages[0].name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>{packages[0].price}</span>
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>/ one-time</span>
                </div>
                <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: '2rem', fontSize: '0.85rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {packages[0].description.map((line, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: '#4ade80', marginTop: '0.1rem' }}>•</span> {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div id={`paypal-button-${packages[0].id}`}></div>
            </div>

            {/* Agency Scale */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '20px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {packages[2].name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>{packages[2].price}</span>
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>/ one-time</span>
                </div>
                <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: '2rem', fontSize: '0.85rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {packages[2].description.map((line, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: '#4ade80', marginTop: '0.1rem' }}>•</span> {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div id={`paypal-button-${packages[2].id}`}></div>
            </div>
          </div>

          {/* Right Column: Tall Pro Growth Card */}
          <div style={{
            backgroundColor: '#111827',
            border: '2px solid #4ade80',
            borderRadius: '20px',
            padding: '2.5rem 2rem 2rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            height: '100%',
            boxShadow: '0 10px 40px -10px rgba(74, 222, 128, 0.15)',
          }}>
            <div style={{ position: 'absolute', top: '-0.85rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#4ade80', color: '#0a0e15', padding: '0.35rem 1rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Most Popular
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#4ade80', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                {packages[1].name}
              </h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '2rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>{packages[1].price}</span>
                <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>/ one-time</span>
              </div>
              <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: '3rem', fontSize: '0.85rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {packages[1].description.map((line, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: '1.4' }}>
                    <span style={{ color: '#4ade80', marginTop: '0.1rem' }}>•</span> {line}
                  </li>
                ))}
              </ul>
            </div>
            <div id={`paypal-button-${packages[1].id}`} style={{ marginTop: 'auto' }}></div>
          </div>

        </div>
      </div>
    </div>
  );
}
