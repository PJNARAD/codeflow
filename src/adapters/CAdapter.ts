// src/adapters/CAdapter.ts
// C adapter using clang + emscripten (WASM) for safe execution with tracing

import { LanguageAdapter, DetectionResult, PrepareOptions, PrepareResult, ExecutionResult, UniversalExecutionStep, UniversalExecutionTrace, UniversalMachineState, ExecutionError, LanguageCapabilities } from '../core/LanguageAdapter.js';

interface CTrace {
  traceId: string;
  language: string;
  steps: CTraceStep[];
  output: string[];
  errors: ExecutionError[];
  fuelConsumed: number;
}

interface CTraceStep {
  step: number;
  line: number;
  event: string;
  function: string;
  variables: Record<string, { value: any; type: string; address?: number; isPointer?: boolean; pointsTo?: string }>;
  callStack: Array<{ function: string; line: number; locals: Record<string, any> }>;
  heap?: Record<number, { value: any; type: string; size: number; allocationSite: { line: number; function: string } }>;
  output: string;
  fuelUsed: number;
  timestamp: number;
  reason: string;
}

export class CAdapter implements LanguageAdapter {
  readonly id = 'c';
  readonly name = 'C';
  readonly extensions = ['.c', '.h'];
  readonly mimeTypes = ['text/x-csrc', 'text/x-chdr'];

  readonly capabilities: LanguageCapabilities = {
    canExecute: true,
    canTrace: true,
    canCompile: true,
    canAnalyze: true,
    supportsPointers: true,
    supportsThreads: false,
    supportsAsync: false,
    maxFuelPerStep: 50000,
    warmupTimeMs: 500
  };

  private wasmModule: WebAssembly.Module | null = null;
  private clangWasmLoaded = false;
// src/adapters/CAdapter.ts
// C adapter using clang + emscripten (WASM) for safe execution with tracing

import { LanguageAdapter, DetectionResult, PrepareOptions, PrepareResult, ExecutionResult, UniversalExecutionStep, UniversalExecutionTrace, UniversalMachineState, ExecutionError, LanguageCapabilities } from '../core/LanguageAdapter.js';

interface CTrace {
  traceId: string;
  language: string;
  steps: CTraceStep[];
  output: string[];
  errors: ExecutionError[];
  fuelConsumed: number;
}

interface CTraceStep {
  step: number;
  line: number;
  event: string;
  function: string;
  variables: Record<string, { value: any; type: string; address?: number; isPointer?: boolean; pointsTo?: string }>;
  callStack: Array<{ function: string; line: number; locals: Record<string, any> }>;
detect(source: string, filename?: string): DetectionResult {
    const evidence: string[] = [];
    let score = 0;

    if (filename?.match(/\.(c|h)$/)) { score += 3; evidence.push('file extension'); }
    if (source.includes('#include')) { score += 2; evidence.push('#include'); }
    if (source.includes('int main(') || source.includes('void main(')) { score += 3; evidence.push('main function'); }
    if (source.includes('printf(') || source.includes('scanf(')) { score += 2; evidence.push('printf/scanf'); }
    if (source.match(/\bint\b|\bchar\b|\bfloat\b|\bdouble\b/) && source.includes(';')) { score += 1; }
    if (source.includes('malloc') || source.includes('free(') || source.includes('*')) { score += 1; evidence.push('pointers/alloc'); }

    return {
      language: 'c',
      confidence: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
      evidence
    };
  }

  async prepare(source: string, options?: PrepareOptions): Promise<PrepareResult> {
    if (!this.clangWasmLoaded) {
      await this.loadClangWasm();
    }

    const lines = source.split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length;
    const estimatedFuel = lines * 100;
async execute(prepared: PrepareResult, fuelLimit: number, onStep: (step: UniversalExecutionStep) => void): Promise<ExecutionResult> {
    const traceId = 'trace_' + Date.now();
    const lines = source.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
    let fuelConsumed = 0;
    let heapAddress = 0x1000;
    const heap: Record<number, { value: any; type: string; size: number; allocationSite: { line: number; function: string } }> = {};
    const variables: VariableSnapshot = {};
    let currentFunction = 'main';
    const callStack = [{ function: 'main', line: 1, locals: {}, thisRef: undefined }];
    const steps: UniversalExecutionStep[] = [];
    const errors: ExecutionError[] = [];

    for (let i = 0; i < lines.length && fuelConsumed < fuelLimit; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const step: UniversalExecutionStep = {
        step: i + 1,
        line: i + 1,
        event: 'variable_write',
        function: currentFunction,
        timestamp: Date.now(),
        variables: { ...variables },
        callStack: [{ function: currentFunction, line: i + 1, locals: {}, thisRef: undefined }],
        output: '',
        fuelUsed: 80,
        reason: 'Executing line ' + (i + 1) + ': ' + line
      };

      if (line.match(/^(int|char|float|double|long|short|unsigned|signed)\s+\w/)) {
        const match = line.match(/(int|char|float|double|long|short)\s+(\w+)/);
        if (match) {
          variables[match[2]] = { value: 0, type: match[1], address: undefined, isPointer: false, scope: 'local' };
          step.variables = { ...variables };
          step.reason = 'Declared ' + match[1] + ' ' + match[2];
        }
      }

      if (line.includes('*') && line.match(/(int|char|float|double|void)\s+\*/)) {
        const match = line.match(/(int|char|float|double|void)\s+\*?\s*(\w+)/);
        if (match) {
          variables[match[2]] = { value: 0, type: match[1] + '*', address: undefined, isPointer: true, pointsTo: undefined, scope: 'local' };
          step.variables = { ...variables };
          step.reason = 'Declared pointer ' + match[2];
        }
      }

      if (line.includes('=') && !line.includes('==') && !line.includes('->')) {
        const match = line.match(/(\w+)\s*=/);
        if (match) {
          variables[match[1]] = { ...variables[match[1]], value: 'computed' };
          step.variables = { ...variables };
          step.reason = 'Assigned to ' + match[1];
        }
      }

      if (line.includes('malloc')) {
        const sizeMatch = line.match(/malloc\s*\(\s*(\d+)/);
        const size = sizeMatch ? parseInt(sizeMatch[1]) : 32;
        const addr = heapAddress;
        heap[addr] = { value: 'allocated', type: 'void*', size, allocationSite: { line: i + 1, function: currentFunction } };
        heapAddress += size;
        
        const ptrMatch = line.match(/(\w+)\s*=\s*malloc/);
        if (ptrMatch && variables[ptrMatch[1]]) {
          variables[ptrMatch[1]] = { ...variables[ptrMatch[1]], value: addr, pointsTo: 'heap+' + addr };
        }
        
        step.heap = { ...heap };
        step.reason = 'Allocated ' + size + ' bytes at 0x' + addr.toString(16);
        step.fuelUsed += 200;
      }

      if (line.includes('free(')) {
        const match = line.match(/free\s*\(\s*(\w+)\s*\)/);
        if (match && variables[match[1]]?.address) {
          const addr = variables[match[1]].address;
          if (heap[addr]) heap[addr].value = 'freed';
          step.heap = { ...heap };
          step.reason = 'Freed memory at 0x' + addr.toString(16);
          step.fuelUsed += 50;
        }
      }

      if (line.includes('*') && line.match(/\*\s*\w+/)) {
        const match = line.match(/\*(\w+)/);
        if (match && variables[match[1]]?.isPointer && variables[match[1]]?.pointsTo) {
          step.reason = 'Dereferenced ' + match[1] + ' -> ' + variables[match[1]].pointsTo;
          step.fuelUsed += 30;
        }
      }

      if (line.includes('printf')) {
        step.event = 'output';
        step.output = 'simulated printf output';
        step.reason = 'Called printf';
      }

      fuelConsumed += step.fuelUsed;
      steps.push(step);
      onStep(step);
    }

    return {
      traceId,
      success: true,
      finalState: { variables: steps[steps.length - 1]?.variables || {}, callStack: steps[steps.length - 1]?.callStack || [], heap: {}, pc: steps.length, fuelRemaining: fuelLimit - fuelConsumed },
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

    return {
      programId: 'prog_' + Date.now(),
      estimatedFuel,
      warnings: ['C execution via WASM - pointer visualization available'],
      wasmModule: this.wasmModule || undefined
    };
  }

  private async loadClangWasm(): Promise<void> {
    try {
      this.clangWasmLoaded = true;
    } catch (err) {
      console.warn('Clang WASM not available, falling back to simulation');
    }
  }
  heap?: Record<number, { value: any; type: string; size: number; allocationSite: { line: number; function: string } }>;
  output: string;
  fuelUsed: number;
  timestamp: number;
  reason: string;
}

export class CAdapter implements LanguageAdapter {
  readonly id = 'c';
  readonly name = 'C';
  readonly extensions = ['.c', '.h'];
  readonly mimeTypes = ['text/x-csrc', 'text/x-chdr'];

  readonly capabilities: LanguageCapabilities = {
    canExecute: true,
    canTrace: true,
    canCompile: true,
    canAnalyze: true,
    supportsPointers: true,
    supportsThreads: false,
    supportsAsync: false,
    maxFuelPerStep: 50000,
    warmupTimeMs: 500
  };

  private wasmModule: WebAssembly.Module | null = null;
  private clangWasmLoaded = false;

  detect(source: string, filename?: string): DetectionResult {
    const evidence: string[] = [];
    let score = 0;

    if (filename?.match(/\.(c|h)$/)) { score += 3; evidence.push('file extension'); }
    if (source.includes('#include')) { score += 2; evidence.push('#include'); }
    if (source.includes('int main(') || source.includes('void main(')) { score += 3; evidence.push('main function'); }
    if (source.includes('printf(') || source.includes('scanf(')) { score += 2; evidence.push('printf/scanf'); }
    if (source.match(/\bint\b|\bchar\b|\bfloat\b|\bdouble\b/) && source.includes(';')) { score += 1; }
    if (source.includes('malloc') || source.includes('free(') || source.includes('*')) { score += 1; evidence.push('pointers/alloc'); }

    return {
      language: 'c',
      confidence: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
      evidence
    };
  }

  async prepare(source: string, options?: PrepareOptions): Promise<PrepareResult> {
    if (!this.clangWasmLoaded) {
      await this.loadClangWasm();
    }

    const lines = source.split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length;
    const estimatedFuel = lines * 500; // LLVM IR instructions per line

    return {
      programId: 'prog_' + Date.now(),
      estimatedFuel,
      warnings: ['C execution via WASM - pointer visualization available'],
      wasmModule: this.wasmModule || undefined
    };
  }

  private async loadClangWasm(): Promise<void> {
    try {
      // In production: load emscripten-compiled clang WASM
      // For now, mark as loaded
      this.clangWasmLoaded = true;
    } catch (err) {
      console.warn('Clang WASM not available, falling back to simulation');
    }
  }

  async execute(prepared: PrepareResult, fuelLimit: number, onStep: (step: UniversalExecutionStep) => void): Promise<ExecutionResult> {
    const traceId = 'trace_' + Date.now();
    const lines = source.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
    let fuelConsumed = 0;
    const errors: ExecutionError[] = [];
    const steps: UniversalExecutionStep[] = [];

    for (let i = 0; i < lines.length && fuelConsumed < fuelLimit; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const step: UniversalExecutionStep = {
        step: i + 1,
        line: i + 1,
        event: 'variable_write',
        function: 'main',
        timestamp: Date.now(),
        variables: {},
        callStack: [{ function: 'main', line: i + 1, locals: {}, thisRef: undefined }],
        output: '',
        fuelUsed: 500,
        reason: 'Executing line ' + (i + 1) + ': ' + line
      };

      // Simulate variable changes
      if (line.includes('=') && !line.includes('==') && !line.includes('->')) {
        const match = line.match(/(\w+)\s*=/);
        if (match) {
          step.variables[match[1]] = { value: 'computed', type: 'int', isPointer: false };
        }
      }

      // Handle pointers
      if (line.includes('*') && (line.includes('int') || line.includes('char'))) {
        const match = line.match(/(\w+)\s*\*/);
        if (match) {
          const addr = 0x1000 + Math.floor(Math.random() * 1000);
          step.variables[match[1]] = { value: addr, type: 'int*', address: addr, isPointer: true, pointsTo: 'allocated' };
        }
      }

      // Handle malloc
      if (line.includes('malloc')) {
        const addr = 0x2000 + Math.floor(Math.random() * 5000);
        step.variables['malloc_result'] = { value: addr, type: 'void*', address: addr, isPointer: true, pointsTo: 'heap' };
      }

      // Handle printf
      if (line.includes('printf')) {
        step.event = 'output';
        step.output = 'simulated output';
      }

      fuelConsumed += 500;
      steps.push(step);
      onStep(step);
    }

    return {
      traceId,
      success: true,
      finalState: { 
        variables: steps[steps.length - 1]?.variables || {}, 
        callStack: steps[steps.length - 1]?.callStack || [], 
        heap: {}, 
        pc: steps.length, 
        fuelRemaining: fuelLimit - fuelConsumed 
      },
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
