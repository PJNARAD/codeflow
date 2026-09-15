// src/core/LanguageAdapter.ts
// Universal Language Adapter Interface

export interface LanguageCapabilities {
  canExecute: boolean;
  canTrace: boolean;
  canCompile: boolean;
  canAnalyze: boolean;
  supportsPointers: boolean;
  supportsThreads: boolean;
  supportsAsync: boolean;
  maxFuelPerStep: number;
  warmupTimeMs: number;
}

export interface DetectionResult {
  language: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface PrepareOptions {
  fuelLimit?: number;
  memoryLimit?: number;
  timeoutMs?: number;
  enablePointers?: boolean;
}

export interface PrepareResult {
  programId: string;
  estimatedFuel: number;
  warnings: string[];
  wasmModule?: WebAssembly.Module;
}

export interface RunOptions {
  fuelLimit?: number;
  memoryLimit?: number;
  timeoutMs?: number;
  onStep?: (step: UniversalExecutionStep) => void;
  onOutput?: (output: string) => void;
  onError?: (error: ExecutionError) => void;
}

export interface StepCallback {
  (step: UniversalExecutionStep): void;
}

export interface ExecutionResult {
  traceId: string;
  success: boolean;
  finalState: UniversalMachineState;
  output: string[];
  errors: ExecutionError[];
  fuelConsumed: number;
}

export interface ExecutionError {
  type: 'compile' | 'runtime' | 'fuel_exhausted' | 'timeout' | 'memory' | 'security';
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
}

export interface UniversalMachineState {
  variables: VariableSnapshot;
  callStack: CallFrame[];
  heap: HeapSnapshot;
  pc: number;
  fuelRemaining: number;
}

export interface ExecutionStats {
  totalSteps: number;
  totalTimeMs: number;
  maxMemoryMb: number;
  maxCallDepth: number;
}

// Forward declarations for trace types
export interface UniversalExecutionTrace {
  traceId: string;
  language: string;
  programId: string;
  startTime: number;
  endTime?: number;
  steps: UniversalExecutionStep[];
  finalState: UniversalMachineState;
  output: string[];
  errors: ExecutionError[];
  fuelConsumed: number;
  stats: ExecutionStats;
}

export interface UniversalExecutionStep {
  step: number;
  line: number;
  column?: number;
  event: ExecutionEventType;
  function: string;
  timestamp: number;
  variables: VariableSnapshot;
  callStack: CallFrame[];
  heap?: HeapSnapshot;
  output: string;
  fuelUsed: number;
  reason: string;
}

export type ExecutionEventType = 
  | 'variable_write' | 'variable_read'
  | 'function_call' | 'function_return'
  | 'branch_taken' | 'branch_not_taken'
  | 'loop_iterate' | 'loop_exit'
  | 'output' | 'error';

export interface VariableSnapshot {
  [name: string]: {
    value: any;
    type: string;
    address?: number;
    scope: 'global' | 'local' | 'closure';
    isPointer?: boolean;
    pointsTo?: string;
  };
}

export interface CallFrame {
  function: string;
  line: number;
  locals: VariableSnapshot;
  thisRef?: any;
}

export interface HeapSnapshot {
  [address: number]: {
    value: any;
    type: string;
    size: number;
    allocationSite: { line: number; function: string };
  };
}

export interface LanguageAdapter {
  readonly id: string;
  readonly name: string;
  readonly extensions: string[];
  readonly mimeTypes: string[];
  readonly capabilities: LanguageCapabilities;

  // Detection
  detect(source: string, filename?: string): DetectionResult;

  // Preparation (async, returns fuel cost estimate)
  prepare(source: string, options?: PrepareOptions): Promise<PrepareResult>;

  // Execution with tracing (runs in worker, fuel-limited)
  execute(prepared: PrepareResult, fuelLimit: number, onStep: StepCallback): Promise<ExecutionResult>;

  // Single-step advance (for time-travel/stepping)
  step(traceId: string, direction: 'forward' | 'backward'): Promise<UniversalExecutionStep | null>;

  // Get current trace state
  getTrace(traceId: string): UniversalExecutionTrace | null;

  // Cleanup
  dispose(traceId: string): Promise<void>;
}