import { DiffResult } from '../compare/metadataDiff';

export interface Issue {
  severity: 'warning' | 'high risk' | 'critical';
  message: string;
  probableCause: string;
  recommendedFix: string;
}

export function calculateRiskScore(diffs: DiffResult[], isCSRDependent: boolean): { score: number; issues: Issue[] } {
  let score = 0;
  const issues: Issue[] = [];

  const addIssue = (severity: 'warning' | 'high risk' | 'critical', message: string, cause: string, fix: string, points: number) => {
    issues.push({ severity, message, probableCause: cause, recommendedFix: fix });
    score += points;
  };

  diffs.forEach(diff => {
    if (diff.status === 'missing_initially') {
      if (['title', 'description', 'canonical', 'robots'].includes(diff.field)) {
        addIssue(
          'critical',
          `${diff.field} is missing in initial HTML but present after JS.`,
          'Metadata is likely being injected client-side (e.g., in a useEffect or Client Component).',
          'Use `export const metadata` or `generateMetadata` in Server Components.',
          3
        );
      } else if (diff.field.startsWith('og:') || diff.field.startsWith('twitter:')) {
        addIssue(
          'high risk',
          `${diff.field} appears only after JS execution.`,
          'Social tags are rendered client-side, making them invisible to social media scrapers.',
          'Move Open Graph and Twitter metadata to Server Components.',
          2
        );
      } else {
        addIssue(
          'warning',
          `${diff.field} appears only after JS execution.`,
          'Metadata is dynamically injected.',
          'Ensure it is rendered on the server if it is important for SEO.',
          1
        );
      }
    } else if (diff.status === 'changed') {
      if (['canonical', 'robots'].includes(diff.field)) {
        addIssue(
          'critical',
          `${diff.field} changed after hydration.`,
          'Client-side state or effect is overwriting server-rendered tags.',
          'Ensure server and client render the exact same value for critical SEO tags to avoid search engine confusion.',
          4
        );
      } else {
        addIssue(
          'high risk',
          `${diff.field} changed after hydration.`,
          'Inconsistency between initial HTML and rendered DOM.',
          'Check for mismatches between `metadata` exports and client side DOM manipulations.',
          2
        );
      }
    }
  });

  if (isCSRDependent) {
    addIssue(
      'critical',
      'Content relies heavily on Client-Side Rendering.',
      'Main content is not present in initial HTML, likely relying on client-side data fetching or components.',
      'Use SSR (Server-Side Rendering) or SSG (Static Site Generation) for critical content pages.',
      4
    );
  }

  return { score, issues };
}

export function determineSeverityByScore(score: number): 'OK' | 'warning' | 'high risk' | 'critical' {
  if (score === 0) return 'OK';
  if (score >= 1 && score <= 3) return 'warning';
  if (score >= 4 && score <= 6) return 'high risk';
  return 'critical';
}
