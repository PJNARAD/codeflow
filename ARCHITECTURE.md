# CODEFLOW — Universal Multi-Language Code Intelligence
## Architecture Specification for Nebius × NVIDIA Global AI Hackathon 2026

---

### 1. PRODUCT VISION

**CodeFlow** = Universal visual execution + AI reasoning environment for programming languages.

```
User Code
    ↓
Language Detection
    ↓
Language-Specific Adapter (Parser/Compiler/Executor)
    ↓
Universal Intermediate Representation (UIR)
    ↓
Safe Execution (Fuel-limited WASM Workers)
    ↓
Universal Execution Trace (UET)
    ↓
Universal Visualization Engine (Language-independent)
    ↓
NVIDIA Nemotron (via Nebius) → AI Explanation / Debugging / Reasoning
```

**Core Principle:** NO language-specific visualizers. One Universal Visualization Engine consumes Universal Execution Trace produced by Language Adapters.

---

### 3. TARGET ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CODEFLOW APP                                  │
├─────────────────────────────────────────────────────────────────────┤
│  UI Layer (preserved, extended)                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Language Detection Service                                         │
├─────────────────────────────────────────────────────────────────────┤
│  Language Adapter Registry                                          │
│  ├── JavaScriptAdapter    (Tier 1 - vm2/quickjs WASM)              │
│  ├── TypeScriptAdapter    (Tier 1 - tsc → JS → vm2)                │
│  ├── PythonAdapter        (Tier 1 - Pyodide WASM)                  │
│  ├── CAdapter             (Tier 1 - clang+emscripten WASM)         │
│  ├── CppAdapter           (Tier 1 - clang++ + emscripten WASM)     │
│  ├── JavaAdapter          (Tier 2 - TeaVM/subprocess)              │
│  ├── GoAdapter            (Tier 2 - GopherJS/subprocess)           │
│  ├── RustAdapter          (Tier 3 - wasm32/subprocess)             │
│  ├── CSharpAdapter        (Tier 2 - .NET WASM/subprocess)          │
│  └── ... (pluggable)                                                │
├─────────────────────────────────────────────────────────────────────┤
│  Universal Intermediate Representation (UIR)                        │
├─────────────────────────────────────────────────────────────────────┤
│  Execution Engine (Fuel-limited WASM Workers)                       │
│  ├── Fuel-based instruction counting (not time)                    │
│  ├── Memory limits at WASM level                                    │
│  ├── No filesystem access (virtual FS only)                        │
│  ├── No network access                                              │
│  ├── Stdout/stderr captured, size-limited                          │
│  └── Process timeout enforced at host level                        │
├─────────────────────────────────────────────────────────────────────┤
│  Universal Execution Trace Normalizer                               │
├─────────────────────────────────────────────────────────────────────┤
│  Universal Visualization Engine (Language-agnostic)                │
├─────────────────────────────────────────────────────────────────────┤
│  Nemotron Integration Layer (Nebius API)                           │
└─────────────────────────────────────────────────────────────────────┘
```
---

### 4. LANGUAGE ADAPTER INTERFACE

```typescript
// src/core/LanguageAdapter.ts

interface LanguageCapabilities {
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

interface LanguageAdapter {
  readonly id: string;
  readonly name: string;
  readonly extensions: string[];
  readonly mimeTypes: string[];
  readonly capabilities: LanguageCapabilities;

  detect(source: string, filename?: string): DetectionResult;
  prepare(source: string, options?: PrepareOptions): Promise<PrepareResult>;
  execute(prepared: PreparedProgram, fuelLimit: number, onStep: StepCallback): Promise<ExecutionResult>;
  step(traceId: string, direction: 'forward' | 'backward'): Promise<UniversalExecutionStep | null>;
  getTrace(traceId: string): UniversalExecutionTrace | null;
  dispose(traceId: string): Promise<void>;
}

interface DetectionResult {
  language: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

interface PrepareOptions {
  fuelLimit?: number;
  memoryLimit?: number;
  timeoutMs?: number;
  enablePointers?: boolean;
}

interface PrepareResult {
  programId: string;
  estimatedFuel: number;
  warnings: string[];
  wasmModule?: WebAssembly.Module;
}

interface ExecutionResult {
  traceId: string;
  success: boolean;
  finalState: UniversalMachineState;
  output: string[];
  errors: ExecutionError[];
  fuelConsumed: number;
}

type StepCallback = (step: UniversalExecutionStep) => void;
---

### 5. UNIVERSAL INTERMEDIATE REPRESENTATION (UIR)

```typescript
// src/core/UniversalIR.ts

interface UniversalProgramIR {
  language: string;
  source: string;
  sourceHash: string;
  ast: UniversalASTNode;
  symbols: SymbolTable;
  controlFlow: ControlFlowGraph;
  entryPoint: string;
  metadata: ProgramMetadata;
}

interface UniversalASTNode {
  type: string;
  children: UniversalASTNode[];
  location: SourceLocation;
  metadata: Record<string, any>;
}

interface SourceLocation {
  line: number;
  column: number;
  length: number;
}

interface SymbolTable {
  functions: Map<string, UniversalFunction>;
  classes: Map<string, UniversalClass>;
  variables: Map<string, UniversalVariable>;
  types: Map<string, UniversalType>;
}

interface UniversalFunction {
  name: string;
  parameters: UniversalParameter[];
  returnType?: UniversalType;
  body: UniversalStatement[];
  startLine: number;
  endLine: number;
  isAsync?: boolean;
  isGenerator?: boolean;
  isEntryPoint?: boolean;
}

interface UniversalClass {
  name: string;
  fields: UniversalField[];
  methods: UniversalFunction[];
  parentClass?: string;
  interfaces: string[];
  startLine: number;
  endLine: number;
}

interface UniversalVariable {
  name: string;
  type?: UniversalType;
  scope: 'global' | 'local' | 'member' | 'parameter';
  declaringFunction?: string;
  declaringClass?: string;
  line: number;
  isConstant: boolean;
  isMutable: boolean;
}

interface UniversalType {
  kind: 'primitive' | 'array' | 'object' | 'function' | 'pointer' | 'reference' | 'generic' | 'unknown';
  name: string;
  size?: number;
  elementType?: UniversalType;
  pointeeType?: UniversalType;
  typeParams?: UniversalType[];
}
```

---

### 6. UNIVERSAL EXECUTION TRACE (UET)

```typescript
interface UniversalExecutionTrace {
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

interface UniversalExecutionStep {
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

type ExecutionEventType = 
  | 'variable_write' | 'variable_read'
  | 'function_call' | 'function_return'
  | 'branch_taken' | 'branch_not_taken'
  | 'loop_iterate' | 'loop_exit'
  | 'output' | 'error';

interface VariableSnapshot {
  [name: string]: {
    value: any;
    type: string;
    address?: number;
    scope: 'global' | 'local' | 'closure';
    isPointer?: boolean;
    pointsTo?: string;
  };
}

interface CallFrame {
  function: string;
  line: number;
  locals: VariableSnapshot;
  thisRef?: any;
}

interface HeapSnapshot {
  [address: number]: {
    value: any;
    type: string;
    size: number;
    allocationSite: { line: number; function: string };
  };
}

interface UniversalMachineState {
  variables: VariableSnapshot;
  callStack: CallFrame[];
  heap: HeapSnapshot;
  pc: number;
  fuelRemaining: number;
}

interface ExecutionStats {
  totalSteps: number;
  totalTimeMs: number;
  maxMemoryMb: number;
  maxCallDepth: number;
}
```
```