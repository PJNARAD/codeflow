// src/ui/ExecutionController.ts
// Run/Step/Auto/Reset controls using ExecutionEngine

import { ExecutionEngine, RunOptions } from '../execution/ExecutionEngine.js';
import { UniversalExecutionStep, ExecutionError } from '../core/UniversalIR.js';

export class ExecutionController {
  private engine: ExecutionEngine;
  private runBtn: HTMLButtonElement;
  private stepBtn: HTMLButtonElement;
  private autoBtn: HTMLButtonElement;
  private pauseBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private speedSelect: HTMLSelectElement;
  private outputLog: HTMLElement;

  private isRunning = false;
  private isPaused = false;
  private speed = 1;
  private autoPlayInterval: ReturnType<typeof setInterval> | null = null;
  private currentTraceId: string | null = null;
  private onStepCallback?: (step: UniversalExecutionStep) => void;
  private onOutputCallback?: (output: string) => void;
  private onErrorCallback?: (error: ExecutionError) => void;

  constructor(container: HTMLElement, engine: ExecutionEngine) {
    this.engine = engine;
    this.buildUI(container);
    this.setupEventListeners();
  }

  private buildUI(container: HTMLElement): void {
    const controls = document.createElement('div');
    controls.className = 'execution-controls';
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';

    this.runBtn = this.createButton('Run', 'run-btn', '#e94560');
    this.stepBtn = this.createButton('Step', 'step-btn', '#0084ff');
    this.autoBtn = this.createButton('Auto', 'auto-btn', '#e94560');
    this.pauseBtn = this.createButton('Pause', 'pause-btn', '#e9b000');
    this.resetBtn = this.createButton('Reset', 'reset-btn', '#666');

    this.speedSelect = document.createElement('select');
    this.speedSelect.id = 'speed-selector';
    this.speedSelect.className = 'speed-select';
    for (const [label, value] of [['Slow', '0.5'], ['Normal', '1'], ['Fast', '2'], ['Turbo', '5']]) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = `${label} (${value}x)`;
      this.speedSelect.appendChild(opt);
    }

    controls.append(this.runBtn, this.stepBtn, this.autoBtn, this.pauseBtn, this.resetBtn, this.speedSelect);
    container.appendChild(controls);

    this.outputLog = document.createElement('pre');
    this.outputLog.id = 'output-log';
    this.outputLog.className = 'output-log';
    this.outputLog.style.background = '#0f3460';
    this.outputLog.style.color = '#e0e0e0';
    this.outputLog.style.padding = '12px';
    this.outputLog.style.borderRadius = '4px';
    this.outputLog.style.fontSize = '13px';
    this.outputLog.style.minHeight = '80px';
    this.outputLog.style.maxHeight = '200px';
    this.outputLog.style.overflow = 'auto';
    this.outputLog.textContent = 'Output will appear here...';
    container.appendChild(this.outputLog);
  }

  private createButton(text: string, id: string, bgColor: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.id = id;
    btn.textContent = text;
    btn.style.padding = '8px 16px';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.backgroundColor = bgColor;
    btn.style.color = 'white';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '14px';
    btn.style.transition = 'background-color 0.2s';
    return btn;
  }

  private setupEventListeners(): void {
    this.runBtn.addEventListener('click', () => this.run());
    this.stepBtn.addEventListener('click', () => this.step());
    this.autoBtn.addEventListener('click', () => this.startAutoPlay());
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.speedSelect.addEventListener('change', (e) => {
      this.speed = parseFloat((e.target as HTMLSelectElement).value);
    });
  }

  setCallbacks(options: {
    onStep?: (step: UniversalExecutionStep) => void;
    onOutput?: (output: string) => void;
    onError?: (error: ExecutionError) => void;
  }): void {
    this.onStepCallback = options.onStep;
    this.onOutputCallback = options.onOutput;
    this.onErrorCallback = options.onError;
  }
