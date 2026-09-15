// Execution Trace Manager
// Builds and stores sequential execution states for deterministic simulation

class ExecutionTrace {
    constructor() {
        this.traces = [];
        this.currentTrace = null;
    }

    // Start a new trace for a given code snippet
    startTrace(code) {
        const state = new ExecutionState();
        this.currentTrace = state;
        this.traces.push({ id: Date.now().toString(), code, state });
        return state;
    }

    // Advance to next step in the current trace
    advanceStep(traceId) {
        if (!this.currentTrace) return null;
        const trace = this.traces.find(t => t.id === traceId);
        if (!trace) return null;

        // Increment step counter
        trace.step++;
        
        // Generate meaningful instruction for the step
        const instruction = this.generateInstruction(trace.state);
        const type = trace.state.classifyInstruction(instruction);
        
        // Record variables before and after
        const before = trace.state.variablesBefore;
        const after = trace.state.variablesAfter;
        
        // Update call stack
        trace.state.pushCallFrame(instruction, type);
        
        // Store the updated state
        trace.state.recordVariablesBefore(before);
        trace.state.recordVariablesAfter(after);
        
        // Generate output and explanation
        const output = this.generateOutput(trace.state);
        const explanation = this.generateExplanation(trace.state, instruction);
        
        trace.state.output = output;
        trace.state.explanation = explanation;
        
        // Handle loop state
        if (this.detectLoop(trace.state)) {
            trace.state.loopState = {
                variable: this.getLoopVariable(trace.state),
                iteration: trace.state.loopIteration
            };
        }
        
        return trace.state;
    }

    // Detect if we're in a loop pattern
    detectLoop(state) {
        // Simple heuristic: check for repeated pattern in call stack
        if (state.callStack.length >= 3) {
            // Look for repeating function calls
            const recent = state.callStack.slice(-5);
            for (let i = 0; i < recent.length - 2; i++) {
                if (recent[i].instruction === recent[i+1].instruction &&
                    recent[i].type === recent[i+1].type) {
                    return {
                        variable: recent[i].instruction.split('(')[0],
                        iteration: i + 1
                    };
                }
            }
        }
        return null;
    }

    // Get loop variable from call stack
    getLoopVariable(state) {
        if (state.loopState) {
            return state.loopState.variable;
        }
        return null;
    }

    // Generate a meaningful instruction for the step
    generateInstruction(state) {
        const instr = state.instruction;
        
        if (instr.includes('def ')) {
            return 'Function definition executed';
        } else if (instr.includes('return ')) {
            return 'Return statement processed';
        } else if (instr.includes('if ')) {
            return 'Conditional check evaluated';
        } else if (instr.includes('for ') || instr.includes('while ')) {
            return 'Loop iteration processed';
        } else if (instr.includes('print ') || instr.includes('console') || instr.includes('log')) {
            return 'Output generated';
        } else if (instr.includes('+') || instr.includes('-') || instr.includes('*') || instr.includes('/')) {
            return 'Arithmetic computation performed';
        } else if (instr.includes('==') || instr.includes('<') || instr.includes('>')) {
            return 'Comparison check evaluated';
        } else {
            return 'Instruction executed';
        }
    }

    // Generate descriptive output for the step
    generateOutput(state) {
        const output = '';
        if (state.output) {
            output += state.output;
        }
        return output;
    }

    // Generate human-readable explanation
    generateExplanation(state, instruction) {
        const parts = [];
        
        if (state.instructionType === 'function_declaration') {
            parts.push('Defining a function');
        } else if (state.instructionType === 'return_statement') {
            parts.push('Returning a value');
        } else if (state.instructionType === 'conditional_check') {
            parts.push('Evaluating conditional condition');
        } else if (state.instructionType === 'loop_start') {
            parts.push('Starting loop iteration');
        } else if (state.instructionType === 'arithmetic_computation') {
            parts.push('Performing arithmetic calculation');
        } else if (state.instructionType === 'output_statement') {
            parts.push('Generating output');
        } else if (state.loopState) {
            parts.push('Entering loop iteration');
        }
        
        return parts.join(' ') || 'Execution completed';
    }

    // Get current trace
    getCurrentTrace() {
        return this.currentTrace;
    }

    // Save current trace to persistent storage
    saveTrace(traceId) {
        this.traces[traces.indexOf(traceId)] = {
            ...traceId,
            state: traceId === this.currentTrace ? traceId : null
        };
    }

    // Load previous trace
    loadPreviousTrace(index) {
        if (index >= 0 && index < this.traces.length) {
            return this.traces[index];
        }
        return null;
    }
}

export default ExecutionTrace;