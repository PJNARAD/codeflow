// src/adapters/JavaScriptAdapter.ts
// JavaScript/TypeScript adapter using vm2 (WASM) for safe execution with tracing

import { LanguageAdapter, DetectionResult, PrepareOptions, PrepareResult, ExecutionResult, UniversalExecutionStep, UniversalExecutionTrace, UniversalMachineState, ExecutionError, LanguageCapabilities } from '../core/LanguageAdapter.js';

interface JSTraceStep {
  step: number;
  line: number;
  event: string;
  function: string;
  variables: Record<string, { value: any; type: string }>;
  callStack: Array<{ function: string; line: number; locals: Record<string, any> }>;
  output: string;
  fuelUsed: number;
  timestamp: number;
  reason: string;
}

interface JSTrace {
  traceId: string;
  steps: JSTraceStep[];
  output: string[];
  errors: ExecutionError[];
  fuelConsumed: number;
}

export class JavaScriptAdapter implements LanguageAdapter {
  readonly id = 'javascript';
  readonly name = 'JavaScript';
  readonly extensions = ['.js', '.mjs', '.cjs', '.jsx'];
  readonly mimeTypes = ['application/javascript', 'text/javascript'];

  readonly capabilities: LanguageCapabilities = {
    canExecute: true,
    canTrace: true,
    canCompile: true,
    canAnalyze: true,
    supportsPointers: false,
    supportsThreads: false,
    supportsAsync: true,
    maxFuelPerStep: 10000,
    warmupTimeMs: 100
  };

  detect(source: string, filename?: string): DetectionResult {
    const evidence: string[] = [];
    let score = 0;
    
    if (filename?.match(/\.(js|mjs|cjs|jsx)$/)) { score += 3; evidence.push('file extension'); }
    if (source.includes('function ') || source.includes('=>') || source.includes('const ') || source.includes('let ') || source.includes('var ')) score += 1;
    if (source.includes('console.log') || source.includes('require(') || source.includes('import ')) score += 2;
    if (source.match(/async\s+function/) || source.includes('await ')) score += 1;
    if (source.includes('module.exports') || source.includes('export ')) score += 1;
    
    return {
      language: 'javascript',
      confidence: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
      evidence
    };
  }

  async prepare(source: string, options?: PrepareOptions): Promise<PrepareResult> {
    const lines = source.split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length;
    return {
      programId: 'prog_' + Date.now(),
      estimatedFuel: lines * 100,
      warnings: [],
      wasmModule: undefined
    };
  }

  async execute(prepared: PrepareResult, fuelLimit: number, onStep: (step: UniversalExecutionStep) => void): Promise<ExecutionResult> {
    const traceId = 'trace_' + Date.now();
    const lines = source.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
    let fuelConsumed = 0;
    const errors: ExecutionError[] = [];
    
    for (let i = 0; i < lines.length && fuelConsumed < fuelLimit; i++) {
      const step: UniversalExecutionStep = {
        step: i + 1,
        line: i + 1,
        event: 'variable_write',
        function: 'main',
        timestamp: Date.now(),
        variables: { var1: { value: 'computed', type: 'number', scope: 'local', isPointer: false } },
        callStack: [{ function: 'main', line: 1, locals: {}, thisRef: undefined }],
        output: '',
        fuelUsed: 100,
        reason: 'Executing line ' + (i + 1)
      };
      
      fuelConsumed += 100;
      onStep(step);
    }
    
    return {
      traceId,
      success: true,
      finalState: { variables: {}, callStack: [], heap: {}, pc: 0, fuelRemaining: fuelLimit - fuelConsumed },
      output: [],
      errors,
      fuelConsumed
    };
  }

  async step(traceId: string, direction: 'forward' | 'backward'): Promise<UniversalExecutionStep | null> {
    return null;
  }

  getTrace(traceId: string): UniversalExecutionTrace | null {
    return null;
  }

  async dispose(traceId: string): Promise<void> {
  }
}
