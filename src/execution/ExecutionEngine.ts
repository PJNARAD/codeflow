// src/execution/ExecutionEngine.ts
// Coordinates execution across language adapters with sandboxing

import { AdapterRegistry } from '../core/AdapterRegistry.js';
import { LanguageAdapter, RunOptions, ExecutionResult, UniversalExecutionStep, UniversalExecutionTrace, UniversalMachineState, ExecutionError } from '../core/LanguageAdapter.js';

interface ActiveTrace {
  traceId: string;
  adapterId: string;
  source: string;
  options: RunOptions;
  currentIndex: number;
  steps: UniversalExecutionStep[];
  fuelRemaining: number;
  status: 'running' | 'completed' | 'error' | 'cancelled';
}

export class ExecutionEngine {
  private registry: AdapterRegistry;
  private activeTraces = new Map<string, ActiveTrace>();

  constructor(registry: AdapterRegistry) {
    this.registry = registry;
  }

  async run(adapterId: string, source: string, options: RunOptions = {}): Promise<ExecutionResult> {
    const adapter = this.registry.get(adapterId);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterId}`);
    }

    if (!adapter.capabilities.canExecute) {
      throw new Error(`Adapter ${adapterId} cannot execute`);
    }

    const prepared = await adapter.prepare(source, options);
    const traceId = 'trace_' + Date.now() + '_' + Math.random().toString(36).slice(2);

    const activeTrace: ActiveTrace = {
      traceId,
      adapterId,
      source,
      options,
      currentIndex: 0,
      steps: [],
      fuelRemaining: options.fuelLimit ?? adapter.capabilities.maxFuelPerStep,
      status: 'running'
    };

    this.activeTraces.set(traceId, activeTrace);

    try {
      const result = await adapter.execute(prepared, activeTrace.fuelRemaining, (step) => {
        activeTrace.steps.push(step);
        activeTrace.fuelRemaining -= step.fuelUsed;
        activeTrace.currentIndex = activeTrace.steps.length - 1;
        
        if (options.onStep) {
          options.onStep(step);
        }
        
        if (step.output && options.onOutput) {
          options.onOutput(step.output);
        }
        
        if (step.event === 'error' && options.onError) {
          options.onError({ type: 'runtime', message: step.reason, line: step.line });
        }
      });

      activeTrace.status = 'completed';
      
      return {
        traceId,
        success: result.success,
        finalState: result.finalState,
        output: result.output,
        errors: result.errors,
        fuelConsumed: result.fuelConsumed
      };
    } catch (error) {
      activeTrace.status = 'error';
      const execError: ExecutionError = { type: 'runtime', message: error.message, line: 0 };
      
      if (options.onError) {
        options.onError(execError);
      }
      
      return {
        traceId,
        success: false,
        finalState: { variables: {}, callStack: [], heap: {}, pc: 0, fuelRemaining: 0 },
        output: [],
        errors: [execError],
        fuelConsumed: 0
      };
    }
  }

  async step(traceId: string, direction: 'forward' | 'backward'): Promise<UniversalExecutionStep | null> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;

    const adapter = this.registry.get(trace.adapterId);
    if (!adapter) return null;

    const step = await adapter.step(traceId, direction);
    if (step) {
      if (direction === 'forward') {
        trace.currentIndex++;
      } else {
        trace.currentIndex--;
      }
      trace.currentIndex = Math.max(0, Math.min(trace.steps.length - 1, trace.currentIndex));
    }
    return step;
  }

  async getTrace(traceId: string): Promise<UniversalExecutionTrace | null> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;

    const adapter = this.registry.get(trace.adapterId);
    if (!adapter) return null;

    return adapter.getTrace(traceId);
  }

  async cancel(traceId: string): Promise<void> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;

    const adapter = this.registry.get(trace.adapterId);
    if (adapter) {
      await adapter.cancel(traceId);
    }
    trace.status = 'cancelled';
  }

  async reset(traceId: string): Promise<void> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;

    const adapter = this.registry.get(trace.adapterId);
    if (adapter) {
      await adapter.reset(traceId);
    }
    this.activeTraces.delete(traceId);
  }
}
