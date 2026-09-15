// Reset Module
// Resets execution state to initial conditions

class Reset {
    // Reset the entire execution state machine
    static resetAll() {
        // Clear all traces
        const traces = ExecutionTrace.getAllTraces();
        traces.forEach(t => {
            t.traces = [];
        });
        
        // Reset global state
        ExecutionState.instance?.reset();
        
        return true;
    }
    
    // Reset a specific trace
    static resetTrace(traceId) {
        const traces = ExecutionTrace.getAllTraces();
        const idx = traces.findIndex(t => t.id === traceId);
        if (idx !== -1) {
            traces[idx].state.reset();
            return true;
        }
        return false;
    }
    
    // Reset to initial state
    static resetInitialState() {
        // Create a fresh execution state
        const state = new ExecutionState();
        state.step = 0;
        state.line = 0;
        state.instruction = '';
        state.instructionType = '';
        state.variablesBefore = {};
        state.variablesAfter = {};
        state.callStack = [];
        state.condition = false;
        state.loopState = null;
        state.output = '';
        state.explanation = '';
        state.visualizationEvent = null;
        
        return state;
    }
}

export default Reset;