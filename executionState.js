// Execution State Model
// Normalized execution state for deterministic educational execution simulator

class ExecutionState {
    constructor() {
        this.step = 0;
        this.line = 0;
        this.instruction = '';
        this.instructionType = '';
        this.variablesBefore = {};
        this.variablesAfter = {};
        this.callStack = [];
        this.condition = false;
        this.loopState = null;
        this.output = '';
        this.explanation = '';
        this.visualizationEvent = null;
    }

    // Get current state snapshot
    getSnapshot() {
        return {
            step: this.step,
            line: this.line,
            instruction: this.instruction,
            instructionType: this.instructionType,
            variablesBefore: JSON.parse(JSON.stringify(this.variablesBefore)),
            variablesAfter: JSON.parse(JSON.stringify(this.variablesAfter)),
            callStack: [...this.callStack],
            condition: this.condition,
            loopState: this.loopState,
            output: this.output,
            explanation: this.explanation,
            visualizationEvent: this.visualizationEvent
        };
    }

    // Set instruction with type classification
    setInstruction(instruction, instructionType) {
        this.instruction = instruction;
        this.instructionType = instructionType;
    }

    // Track variables before and after execution
    recordVariablesBefore(vars) {
        this.variablesBefore = vars;
    }

    recordVariablesAfter(vars) {
        this.variablesAfter = vars;
    }

    // Push frame onto call stack
    pushCallFrame(frame) {
        this.callStack.push({
            line: frame.line,
            instruction: frame.instruction,
            type: frame.type
        });
    }

    // Pop frame from call stack
    popCallFrame() {
        if (this.callStack.length > 0) {
            this.callStack.pop();
        }
    }

    // Determine instruction type based on content
    classifyInstruction(instruction) {
        if (instruction.includes('def ')) return 'function_declaration';
        if (instruction.includes('return ')) return 'return_statement';
        if (instruction.startsWith('if ')) return 'conditional_check';
        if (instruction.startsWith('for ') || instruction.startsWith('while ')) return 'loop_start';
        if (instruction.startsWith('print ')) return 'output_statement';
        if (instruction.startsWith('print') || instruction.startsWith('console') || instruction.startsWith('log')) return 'output_statement';
        if (instruction.includes('+') || instruction.includes('-') || instruction.includes('*') || instruction.includes('/')) return 'arithmetic_computation';
        if (instruction.includes('==') || instruction.includes('<') || instruction.includes('>')) return 'comparison_check';
        if (instruction.startsWith('def ') || instruction.startsWith('class ')) return 'definition';
        return 'unknown_instruction';
    }
}

export default ExecutionState;