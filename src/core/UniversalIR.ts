// src/core/UniversalIR.ts
// Universal Intermediate Representation - Language-agnostic program model

export interface UniversalProgramIR {
  language: string;
  source: string;
  sourceHash: string;
  ast: UniversalASTNode;
  symbols: SymbolTable;
  controlFlow: ControlFlowGraph;
  entryPoint: string;
  metadata: ProgramMetadata;
}

export interface UniversalASTNode {
  type: string;
  children: UniversalASTNode[];
  location: SourceLocation;
  metadata: Record<string, any>;
}

export interface SourceLocation {
  line: number;
  column: number;
  length: number;
}

export interface SymbolTable {
  functions: Map<string, UniversalFunction>;
  classes: Map<string, UniversalClass>;
  variables: Map<string, UniversalVariable>;
  types: Map<string, UniversalType>;
}

export interface UniversalFunction {
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

export interface UniversalClass {
  name: string;
  fields: UniversalField[];
  methods: UniversalFunction[];
  parentClass?: string;
  interfaces: string[];
  startLine: number;
  endLine: number;
}

export interface UniversalVariable {
  name: string;
  type?: UniversalType;
  scope: 'global' | 'local' | 'member' | 'parameter';
  declaringFunction?: string;
  declaringClass?: string;
  line: number;
  isConstant: boolean;
  isMutable: boolean;
}

export interface UniversalParameter {
  name: string;
  type?: UniversalType;
  defaultValue?: any;
  isOptional?: boolean;
}

export interface UniversalField {
  name: string;
  type?: UniversalType;
  isStatic?: boolean;
  isReadonly?: boolean;
  visibility: 'public' | 'private' | 'protected';
}

export interface UniversalStatement {
  type: string;
  children: UniversalStatement[];
  location: SourceLocation;
}

export interface UniversalType {
  kind: 'primitive' | 'array' | 'object' | 'function' | 'pointer' | 'reference' | 'generic' | 'unknown';
  name: string;
  size?: number;
  elementType?: UniversalType;
  pointeeType?: UniversalType;
  typeParams?: UniversalType[];
}

export interface ControlFlowGraph {
  nodes: Map<string, CFGNode>;
  edges: CFGEdge[];
  entryNode: string;
  exitNodes: string[];
}

export interface CFGNode {
  id: string;
  type: 'entry' | 'exit' | 'statement' | 'branch' | 'loop' | 'call';
  statements: UniversalStatement[];
  location: SourceLocation;
}

export interface CFGEdge {
  from: string;
  to: string;
  condition?: string;
  type: 'fallthrough' | 'branch_taken' | 'branch_not_taken' | 'loop_iterate' | 'loop_exit';
}

export interface ProgramMetadata {
  entryPoint: string;
  estimatedFuel: number;
  warnings: string[];
  hasPointers: boolean;
  hasClasses: boolean;
  hasAsync: boolean;
  hasGenerators: boolean;
}