// Stepping Module
// Handles single-step and multi-step execution

class Stepping {
    constructor(trace) {
        this.trace = trace;
        this.currentIndex = 0;
    }

    // Take a single step forward
    step() {
        if (this.currentIndex >= this.trace.step) {
            return null;
        }
        
        const nextState = this.trace.advanceStep(this.trace.id);
        
        if (nextState) {
            this.currentIndex++;
            return nextState;
        }
        
        return null;
    }

    // Take multiple steps at once
    stepMany(count) {
        const results = [];
        for (let i = 0; i < count; i++) {
            const nextState = this.trace.advanceStep(this.trace.id);
            if (nextState) {
                results.push(nextState);
            } else {
                break;
            }
        }
        return results;
    }

    // Reset to beginning of trace
    reset() {
        this.currentIndex = 0;
    }

    // Get current position
    getPosition() {
        return {
            step: this.trace.step,
            currentIndex: this.currentIndex
        };
    }

    // Is we at the end?
    isDone() {
        return this.currentIndex >= this.trace.step;
    }
}

export default Stepping;