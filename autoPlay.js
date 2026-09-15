// Auto-Play Module
// Controls automatic execution progression

class AutoPlay {
    constructor(trace) {
        this.trace = trace;
        this.isRunning = false;
        this.isPaused = false;
        this.stepCount = 0;
    }
    
    // Start auto-play
    start() {
        if (this.isRunning || this.isPaused) return;
        this.isRunning = true;
        this.isPaused = false;
        this.stepCount = 0;
        this.nextStep();
    }
    
    // Stop auto-play
    stop() {
        this.isRunning = false;
    }
    
    // Continue from current position
    continueFrom(currentIndex) {
        if (currentIndex >= this.trace.step) {
            return;
        }
        this.nextStep();
    }
    
    // Next step
    nextStep() {
        const state = this.trace.advanceStep(this.trace.id);
        if (state) {
            this.stepCount++;
            this.nextStep();
        }
    }
    
    // Get progress
    getProgress() {
        if (!this.trace) return null;
        const totalSteps = this.trace.step;
        if (totalSteps <= 0) return null;
        return Math.round((this.stepCount / totalSteps) * 100);
    }
    
    // Reset playback
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.stepCount = 0;
    }
}

export default AutoPlay;