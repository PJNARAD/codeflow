// src/core/LanguageDetector.ts
// Heuristic + ML-based language detection with confidence scoring

import { AdapterRegistry } from './AdapterRegistry.js';
import { LanguageAdapter, DetectionResult } from './LanguageAdapter.js';

interface DetectionCandidate {
  adapter: LanguageAdapter;
  result: DetectionResult;
}

const CONFIDENCE_ORDER = { high: 3, medium: 2, low: 1 };

export class LanguageDetector {
  constructor(private registry: AdapterRegistry) {}

  detect(source: string, filename?: string): DetectionResult {
    const candidates: DetectionCandidate[] = [];

    for (const adapter of this.registry.getAll()) {
      const result = adapter.detect(source, filename);
      if (result.confidence !== 'low' || result.evidence.length > 0) {
        candidates.push({ adapter, result });
      }
    }

    if (candidates.length === 0) {
      return { language: 'unknown', confidence: 'low', evidence: [] };
    }

    // Sort by confidence and specificity
    candidates.sort((a, b) => {
      const confDiff = CONFIDENCE_ORDER[b.result.confidence] - CONFIDENCE_ORDER[a.result.confidence];
      if (confDiff !== 0) return confDiff;
      
      // Prefer adapters with more specific file extensions
      const aSpec = a.adapter.extensions.length;
      const bSpec = b.adapter.extensions.length;
      return bSpec - aSpec;
    });

    const best = candidates[0];
    return {
      language: best.adapter.id,
      confidence: best.result.confidence,
      evidence: best.result.evidence
    };
  }

  // Get top N detection results for UI
  detectAll(source: string, filename?: string): DetectionResult[] {
    const candidates: DetectionCandidate[] = [];

    for (const adapter of this.registry.getAll()) {
      const result = adapter.detect(source, filename);
      if (result.confidence !== 'low' || result.evidence.length > 0) {
        candidates.push({ adapter, result });
      }
    }

    candidates.sort((a, b) => {
      const confDiff = CONFIDENCE_ORDER[b.result.confidence] - CONFIDENCE_ORDER[a.result.confidence];
      if (confDiff !== 0) return confDiff;
      return b.adapter.extensions.length - a.adapter.extensions.length;
    });

    return candidates.map(c => ({
      language: c.adapter.id,
      name: c.adapter.name,
      confidence: c.result.confidence,
      evidence: c.result.evidence
    }));
  }
}