// Speed Control Module
// Manages execution speed for educational purposes

class SpeedControl {
    constructor(speeds = [1, 2, 5, 10]) {
        this.speeds = speeds;
        this.currentSpeed = 1;
        this.speedIndex = 0;
    }
    
    // Get current speed multiplier
    getSpeed() {
        return this.speeds[this.speedIndex];
    }
    
    // Set speed
    setSpeed(speed) {
        if (this.speeds.includes(speed)) {
            this.currentSpeed = speed;
            this.speedIndex = this.speeds.indexOf(speed);
        }
    }
    
    // Change to specific speed
    setSpeedByValue(value) {
        const index = this.speeds.indexOf(value);
        if (index !== -1) {
            this.currentSpeed = this.speeds[index];
            this.speedIndex = index;
        }
    }
    
    // Reset to normal speed
    resetToNormal() {
        this.currentSpeed = 1;
        this.speedIndex = 0;
    }
    
    // Get current speed level
    getLevel() {
        return this.speedIndex + 1;
    }
}

export default SpeedControl;