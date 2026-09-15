// src/ui/LanguageSelector.ts
// Auto-detect language selector with capability badges

import { AdapterRegistry, LanguageAdapter, DetectionResult, LanguageCapabilities } from '../core/AdapterRegistry.js';
import { adapterRegistry } from '../core/AdapterRegistry.js';

export class LanguageSelector {
  private registry: AdapterRegistry;
  private selector: HTMLSelectElement;
  private detectionDisplay: HTMLElement;
  private capabilityBadges: HTMLElement;
  private currentLanguage: string = 'auto';

  constructor(container: HTMLElement, registry: AdapterRegistry = adapterRegistry) {
    this.registry = registry;
    this.buildUI(container);
    this.setupEventListeners();
  }

  private buildUI(container: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'language-selector-wrapper';

    // Label
    const label = document.createElement('label');
    label.textContent = 'Language: ';
    label.htmlFor = 'language-select';
    wrapper.appendChild(label);

    // Select element
    this.selector = document.createElement('select');
    this.selector.id = 'language-select';
    this.selector.className = 'language-select';
    
    // Auto-detect option
    const autoOption = document.createElement('option');
    autoOption.value = 'auto';
    autoOption.textContent = 'Auto-detect';
    this.selector.appendChild(autoOption);

    // Add all registered adapters
    for (const adapter of this.registry.getAll()) {
      const opt = document.createElement('option');
      opt.value = adapter.id;
      opt.textContent = `${adapter.name} ${this.capabilityBadgeText(adapter.capabilities)}`;
      opt.dataset.capabilities = JSON.stringify(this.capabilityFlags(adapter.capabilities));
      this.selector.appendChild(opt);
    }

    wrapper.appendChild(this.selector);

    // Detection display
    this.detectionDisplay = document.createElement('div');
    this.detectionDisplay.className = 'detection-display';
    this.detectionDisplay.style.fontSize = '12px';
    this.detectionDisplay.style.color = '#aaa';
    this.detectionDisplay.style.marginTop = '4px';
    wrapper.appendChild(this.detectionDisplay);

    // Capability badges panel
    this.capabilityBadges = document.createElement('div');
    this.capabilityBadges.className = 'capability-badges';
    this.capabilityBadges.style.marginTop = '8px';
    wrapper.appendChild(this.capabilityBadges);

    container.appendChild(wrapper);
  }

  private capabilityBadgeText(caps: LanguageCapabilities): string {
    const badges: string[] = [];
    if (caps.canExecute) badges.push('▶');
    if (caps.canTrace) badges.push('⏭');
    if (caps.canAnalyze) badges.push('🔍');
    if (caps.canCompile) badges.push('⚙');
    return badges.join(' ');
  }

  private capabilityFlags(caps: LanguageCapabilities): Record<string, boolean> {
    return {
      execute: caps.canExecute,
      trace: caps.canTrace,
      analyze: caps.canAnalyze,
      compile: caps.canCompile,
      pointers: caps.supportsPointers,
      threads: caps.supportsThreads,
      async: caps.supportsAsync
    };
  }

  private setupEventListeners(): void {
    this.selector.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.currentLanguage = target.value;
      this.updateDetectionDisplay();
    });
  }

  async detectAndSelect(source: string, filename?: string): Promise<string> {
    if (this.currentLanguage !== 'auto') {
      return this.currentLanguage;
    }

    const result = this.registry.detect(source, filename);
    this.updateDetectionDisplay(result);
    
    // Auto-select the detected language
    const adapter = this.registry.get(result.language);
    if (adapter) {
      this.selector.value = result.language;
      this.currentLanguage = result.language;
    }

    return result.language;
  }

  private updateDetectionDisplay(result?: DetectionResult): void {
    if (this.currentLanguage === 'auto' && result) {
      const confidenceColors: Record<string, string> = { high: '#4caf50', medium: '#e9b000', low: '#e94560' };
      this.detectionDisplay.innerHTML = `
        Detected: <strong>${result.language}</strong> 
        (confidence: <span style="color:${confidenceColors[result.confidence]}">${result.confidence}</span>)
        Evidence: ${result.evidence.join(', ')}
      `;
    } else if (this.currentLanguage !== 'auto') {
      const adapter = this.registry.get(this.currentLanguage);
      if (adapter) {
        this.detectionDisplay.innerHTML = `Selected: <strong>${adapter.name}</strong> ${this.capabilityBadgeText(adapter.capabilities)}`;
      }
    } else {
      this.detectionDisplay.textContent = 'Enter code to auto-detect language';
    }

    // Update capability badges
    this.renderCapabilityBadges();
  }

  private renderCapabilityBadges(): void {
    if (this.currentLanguage === 'auto') {
      this.capabilityBadges.innerHTML = '';
      return;
    }

    const adapter = this.registry.get(this.currentLanguage);
    if (!adapter) return;

    const caps = adapter.capabilities;
    const badges = [
      { key: 'canExecute', label: 'Execute', icon: '▶' },
      { key: 'canTrace', label: 'Trace', icon: '⏭' },
      { key: 'canAnalyze', label: 'Analyze', icon: '🔍' },
      { key: 'canCompile', label: 'Compile', icon: '⚙' },
      { key: 'supportsPointers', label: 'Pointers', icon: '🔗' },
      { key: 'supportsThreads', label: 'Threads', icon: '🧵' },
      { key: 'supportsAsync', label: 'Async', icon: '⏱' }
    ];

    this.capabilityBadges.innerHTML = badges
      .filter(b => (caps as any)[b.key])
      .map(b => `<span class="cap-badge" title="${b.label}">${b.icon}</span>`)
      .join(' ');
  }

  getSelectedLanguage(): string {
    return this.currentLanguage;
  }

  setLanguage(id: string): void {
    if (this.registry.get(id)) {
      this.selector.value = id;
      this.currentLanguage = id;
      this.updateDetectionDisplay();
    }
  }
}
// src/ui/LanguageSelector.ts
// Auto-detect language selector with capability badges

import { AdapterRegistry, LanguageAdapter, DetectionResult, LanguageCapabilities } from '../core/AdapterRegistry.js';
import { adapterRegistry } from '../core/AdapterRegistry.js';

export class LanguageSelector {
  private registry: AdapterRegistry;
  private selector: HTMLSelectElement;
  private detectionDisplay: HTMLElement;
  private capabilityBadges: HTMLElement;
  private currentLanguage: string = 'auto';

  constructor(container: HTMLElement, registry: AdapterRegistry = adapterRegistry) {
    this.registry = registry;
    this.buildUI(container);
    this.setupEventListeners();
  }

  private buildUI(container: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'language-selector-wrapper';

    // Label
    const label = document.createElement('label');
    label.textContent = 'Language: ';
    label.htmlFor = 'language-select';
    wrapper.appendChild(label);

    // Select element
    this.selector = document.createElement('select');
    this.selector.id = 'language-select';
    this.selector.className = 'language-select';
    
    // Auto-detect option
    const autoOption = document.createElement('option');
    autoOption.value = 'auto';
    autoOption.textContent = 'Auto-detect';
    this.selector.appendChild(autoOption);

    // Add all registered adapters
    for (const adapter of this.registry.getAll()) {
      const opt = document.createElement('option');
      opt.value = adapter.id;
      opt.textContent = `${adapter.name} ${this.capabilityBadgeText(adapter.capabilities)}`;
      opt.dataset.capabilities = JSON.stringify(this.capabilityFlags(adapter.capabilities));
      this.selector.appendChild(opt);
    }

    wrapper.appendChild(this.selector);

    // Detection display
    this.detectionDisplay = document.createElement('div');
    this.detectionDisplay.className = 'detection-display';
    this.detectionDisplay.style.fontSize = '12px';
    this.detectionDisplay.style.color = '#aaa';
    this.detectionDisplay.style.marginTop = '4px';
    wrapper.appendChild(this.detectionDisplay);

    // Capability badges panel
    this.capabilityBadges = document.createElement('div');
    this.capabilityBadges.className = 'capability-badges';
    this.capabilityBadges.style.marginTop = '8px';
    wrapper.appendChild(this.capabilityBadges);

    container.appendChild(wrapper);
  }

  private capabilityBadgeText(caps: LanguageCapabilities): string {
    const badges: string[] = [];
    if (caps.canExecute) badges.push('▶');
    if (caps.canTrace) badges.push('⏭');
    if (caps.canAnalyze) badges.push('🔍');
    if (caps.canCompile) badges.push('⚙');
    return badges.join(' ');
  }

  private capabilityFlags(caps: LanguageCapabilities): Record<string, boolean> {
    return {
      execute: caps.canExecute,
      trace: caps.canTrace,
      analyze: caps.canAnalyze,
      compile: caps.canCompile,
      pointers: caps.supportsPointers,
      threads: caps.supportsThreads,
      async: caps.supportsAsync
    };
  }

  private setupEventListeners(): void {
    this.selector.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.currentLanguage = target.value;
      this.updateDetectionDisplay();
    });
  }

  async detectAndSelect(source: string, filename?: string): Promise<string> {
    if (this.currentLanguage !== 'auto') {
      return this.currentLanguage;
    }

    const result = this.registry.detect(source, filename);
    this.updateDetectionDisplay(result);
    
    // Auto-select the detected language
    const adapter = this.registry.get(result.language);
    if (adapter) {
      this.selector.value = result.language;
      this.currentLanguage = result.language;
    }

    return result.language;
  }

  private updateDetectionDisplay(result?: DetectionResult): void {
    if (this.currentLanguage === 'auto' && result) {
      const confidenceColors = { high: '#4caf50', medium: '#e9b000', low: '#e94560' };
      this.detectionDisplay.innerHTML = `
        Detected: <strong>${result.language}</strong> 
        (confidence: <span style="color:${confidenceColors[result.confidence]}">${result.confidence}</span>)
        Evidence: ${result.evidence.join(', ')}
      `;
    } else if (this.currentLanguage !== 'auto') {
      const adapter = this.registry.get(this.currentLanguage);
      if (adapter) {
        this.detectionDisplay.innerHTML = `Selected: <strong>${adapter.name}</strong> ${this.capabilityBadgeText(adapter.capabilities)}`;
      }
    } else {
      this.detectionDisplay.textContent = 'Enter code to auto-detect language';
    }

    // Update capability badges
    this.renderCapabilityBadges();
  }

  private renderCapabilityBadges(): void {
    if (this.currentLanguage === 'auto') {
      this.capabilityBadges.innerHTML = '';
      return;
    }

    const adapter = this.registry.get(this.currentLanguage);
    if (!adapter) return;

    const caps = adapter.capabilities;
    const badges = [
      { key: 'canExecute', label: 'Execute', icon: '▶' },
      { key: 'canTrace', label: 'Trace', icon: '⏭' },
      { key: 'canAnalyze', label: 'Analyze', icon: '🔍' },
      { key: 'canCompile', label: 'Compile', icon: '⚙' },
      { key: 'supportsPointers', label: 'Pointers', icon: '🔗' },
      { key: 'supportsThreads', label: 'Threads', icon: '🧵' },
      { key: 'supportsAsync', label: 'Async', icon: '⏱' }
    ];

    this.capabilityBadges.innerHTML = badges
      .filter(b => caps[b.key as keyof LanguageCapabilities])
      .map(b => `<span class="cap-badge" title="${b.label}">${b.icon}</span>`)
      .join(' ');
  }

  getSelectedLanguage(): string {
    return this.currentLanguage;
  }

  setLanguage(id: string): void {
    if (this.registry.get(id)) {
      this.selector.value = id;
      this.currentLanguage = id;
      this.updateDetectionDisplay();
    }
  }
}
