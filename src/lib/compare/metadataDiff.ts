import { Metadata } from '../extractors/headMetadata';
import { ContentSignals } from '../extractors/contentSignals';

export interface DiffResult {
  field: string;
  initialValue: string | string[] | null;
  renderedValue: string | string[] | null;
  status: 'missing_initially' | 'changed' | 'removed' | 'same';
}

export interface ComparisonResult {
  metadataDiffs: DiffResult[];
  contentChanged: boolean;
  isCSRDependent: boolean;
}

export function compareMetadata(initial: Metadata, rendered: Metadata): DiffResult[] {
  const diffs: DiffResult[] = [];

  const compareField = (fieldPath: string, initVal: any, rendVal: any) => {
    if (!initVal && rendVal) {
      diffs.push({ field: fieldPath, initialValue: initVal, renderedValue: rendVal, status: 'missing_initially' });
    } else if (initVal && !rendVal) {
      diffs.push({ field: fieldPath, initialValue: initVal, renderedValue: rendVal, status: 'removed' });
    } else if (JSON.stringify(initVal) !== JSON.stringify(rendVal)) {
      diffs.push({ field: fieldPath, initialValue: initVal, renderedValue: rendVal, status: 'changed' });
    }
  };

  compareField('title', initial.title.value, rendered.title.value);
  compareField('description', initial.description.value, rendered.description.value);
  compareField('canonical', initial.canonical.value, rendered.canonical.value);
  compareField('robots', initial.robots.value, rendered.robots.value);
  
  if (initial.hreflang.value.join(',') !== rendered.hreflang.value.join(',')) {
     compareField('hreflang', initial.hreflang.value, rendered.hreflang.value);
  }

  // OG
  compareField('og:title', initial.og.title.value, rendered.og.title.value);
  compareField('og:description', initial.og.description.value, rendered.og.description.value);
  compareField('og:image', initial.og.image.value, rendered.og.image.value);
  compareField('og:url', initial.og.url.value, rendered.og.url.value);

  // Twitter
  compareField('twitter:title', initial.twitter.title.value, rendered.twitter.title.value);
  compareField('twitter:description', initial.twitter.description.value, rendered.twitter.description.value);
  compareField('twitter:image', initial.twitter.image.value, rendered.twitter.image.value);
  compareField('twitter:card', initial.twitter.card.value, rendered.twitter.card.value);

  // JSON-LD
  if (!initial.jsonLd.present && rendered.jsonLd.present) {
    diffs.push({ field: 'json-ld', initialValue: null, renderedValue: 'Present', status: 'missing_initially' });
  }

  return diffs;
}

export function compareContent(initial: ContentSignals, rendered: ContentSignals): boolean {
  // If initially there was almost no text, but after render there is significant text
  return initial.bodyTextLength < 100 && rendered.bodyTextLength > 500;
}
