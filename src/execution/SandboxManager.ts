// src/execution/SandboxManager.ts
// Resource limits, timeouts, and isolation for execution sandboxing

import { LanguageAdapter, PrepareOptions, PrepareResult } from '../core/LanguageAdapter.js';

export interface SandboxConfig {
  fuelLimit: number;
  memoryLimit: number; // MB
  timeoutMs: number;
  enablePointers: boolean;
  virtualFs: boolean;
  networkAccess: boolean;
}

export interface SandboxInstance {
  instanceId: string;
  adapterId: string;
  config: SandboxConfig;
  createdAt: number;
  worker?: Worker;
  wasmModule?: WebAssembly.Module;
  memoryUsage: number; // bytes
  fuelConsumed: number;
  startTime: number;
}

export class SandboxManager {
  private instances = new Map<string, SandboxInstance>();
  private globalFuelLimit = 10000000; // Total fuel across all instances
  private globalMemoryLimit = 1024; // MB
  private totalFuelConsumed = 0;
  private totalMemoryUsage = 0;

  createInstance(adapterId: string, options: PrepareOptions): SandboxInstance {
    const config: SandboxConfig = {
      fuelLimit: options.fuelLimit ?? 100000,
      memoryLimit: options.memoryLimit ?? 64,
      timeoutMs: options.timeoutMs ?? 30000,
      enablePointers: options.enablePointers ?? false,
      virtualFs: true,
      networkAccess: false
    };

    const instance: SandboxInstance = {
      instanceId: 'sandbox_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      adapterId,
      config,
      createdAt: Date.now(),
      memoryUsage: 0,
      fuelConsumed: 0,
      startTime: Date.now()
    };

    this.instances.set(instance.instanceId, instance);
    this.totalMemoryUsage += config.memoryLimit * 1024 * 1024;

    return instance;
  }

  async destroyInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    if (instance.worker) {
      instance.worker.terminate();
    }

    this.totalMemoryUsage -= instance.config.memoryLimit * 1024 * 1024;
    this.totalFuelConsumed += instance.fuelConsumed;
    this.instances.delete(instanceId);
  }

  getInstance(instanceId: string): SandboxInstance | undefined {
    return this.instances.get(instanceId);
  }

  getActiveInstances(): SandboxInstance[] {
    return Array.from(this.instances.values());
  }

  checkFuelLimit(instanceId: string, fuelToConsume: number): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;
    
    const newFuel = instance.fuelConsumed + fuelToConsume;
    return newFuel <= instance.config.fuelLimit && newFuel <= this.globalFuelLimit;
  }

  checkMemoryLimit(instanceId: string, memoryToAllocate: number): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;
    
    const newMemory = instance.memoryUsage + memoryToAllocate;
    return newMemory <= instance.config.memoryLimit * 1024 * 1024 && 
           this.totalMemoryUsage + memoryToAllocate <= this.globalMemoryLimit * 1024 * 1024;
  }

  consumeFuel(instanceId: string, fuel: number): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.fuelConsumed += fuel;
    }
  }

  allocateMemory(instanceId: string, bytes: number): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;
    
    if (!this.checkMemoryLimit(instanceId, bytes)) return false;
    
    instance.memoryUsage += bytes;
    return true;
  }

  freeMemory(instanceId: string, bytes: number): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.memoryUsage = Math.max(0, instance.memoryUsage - bytes);
    }
  }

  getStats(): { totalFuel: number; totalMemory: number; activeInstances: number } {
    return {
      totalFuel: this.totalFuelConsumed,
      totalMemory: this.totalMemoryUsage,
      activeInstances: this.instances.size
    };
  }

  setGlobalLimits(fuelLimit: number, memoryLimit: number): void {
    this.globalFuelLimit = fuelLimit;
    this.globalMemoryLimit = memoryLimit;
  }

  async warmup(adapterId: string): Promise<void> {
    // Pre-warm adapters that need it (e.g., Pyodide)
    if (adapterId === 'python') {
      // In real implementation, pre-load Pyodide worker
    }
  }
}

// Fuel models for different languages
export const FUEL_MODELS: Record<string, { unit: string; opsPerFuel: number }> = {
  javascript: { unit: 'bytecode_ops', opsPerFuel: 1 },
  typescript: { unit: 'bytecode_ops', opsPerFuel: 1 },
  python: { unit: 'bytecode_ops', opsPerFuel: 2 }, // Python bytecode ops are heavier
  c: { unit: 'llvm_ir', opsPerFuel: 5 },
  cpp: { unit: 'llvm_ir', opsPerFuel: 5 },
  java: { unit: 'jvm_bytecode', opsPerFuel: 3 },
  go: { unit: 'ssa_ops', opsPerFuel: 2 },
  rust: { unit: 'mir_ops', opsPerFuel: 3 },
  csharp: { unit: 'il_ops', opsPerFuel: 3 }
};
