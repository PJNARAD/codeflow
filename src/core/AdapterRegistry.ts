// src/core/AdapterRegistry.ts
// Plugin registry for language adapters

import { LanguageAdapter, DetectionResult, LanguageCapabilities } from './LanguageAdapter.js';

export class AdapterRegistry {
  private adapters = new Map<string, LanguageAdapter>();
  private detectionOrder: LanguageAdapter[] = [];

  register(adapter: LanguageAdapter): void {
    if (this.adapters.has(adapter.id)) {
      console.warn(`Adapter ${adapter.id} already registered, replacing`);
    }
    this.adapters.set(adapter.id, adapter);
    this.detectionOrder.push(adapter);
    // Sort by detection priority (adapters with more specific detection first)
    this.detectionOrder.sort((a, b) => {
      const aSpec = a.extensions.length;
      const bSpec = b.extensions.length;
      return bSpec - aSpec;
    });
  }

  get(id: string): LanguageAdapter | undefined {
    return this.adapters.get(id);
  }

  getAll(): LanguageAdapter[] {
    return Array.from(this.adapters.values());
  }

  // Auto-detect with confidence scoring
  detect(source: string, filename?: string): DetectionResult {
    const results: Array<{ adapter: LanguageAdapter; result: DetectionResult }> = [];

    for (const adapter of this.detectionOrder) {
      const result = adapter.detect(source, filename);
      if (result.confidence !== 'low') {
        results.push({ adapter, result });
      }
    }

    if (results.length === 0) {
      return { language: 'unknown', confidence: 'low', evidence: [] };
    }

    // Return highest confidence result
    results.sort((a, b) => {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      return confidenceOrder[b.result.confidence] - confidenceOrder[a.result.confidence];
    });

    return results[0].result;
  }

  // Get adapters by capability
  getByCapability(cap: keyof LanguageCapabilities): LanguageAdapter[] {
    return this.getAll().filter(a => a.capabilities[cap]);
  }

  // Get adapters that can execute
  getExecutable(): LanguageAdapter[] {
    return this.getByCapability('canExecute');
  }

  // Get adapters that can trace
  getTraceable(): LanguageAdapter[] {
    return this.getByCapability('canTrace');
  }
}

// Singleton instance
export const adapterRegistry = new AdapterRegistry();