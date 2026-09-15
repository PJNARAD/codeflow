// CODEFLOW - Interactive Code Executor

class CodeFlowApp {
    constructor() {
        this.running = false;
        this.speed = 1;
        this.currentInstruction = '';
        this.variables = {};
        this.executionHistory = [];
        this.isPaused = false;
        this.toolbar = document.getElementById('toolbar');
        this.languageSelector = document.getElementById('language-selector');
        this.runBtn = document.getElementById('run-btn');
        this.stepBtn = document.getElementById('step-btn');
        this.autoPlayBtn = document.getElementById('auto-play-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.speedSelector = document.getElementById('speed-selector');
        this.sourceTextarea = document.getElementById('source-code-textarea');
        this.instructionDisplay = document.getElementById('instruction-display');
        this.variablesPanel = document.getElementById('variables-panel');
        this.valuesPanel = document.getElementById('values-panel');
        this.typeDisplay = document.getElementById('type-display');
        this.explanationContent = document.getElementById('explanation-content');
        this.outputLog = document.getElementById('output-log');
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.loadSampleCode();
    }
    setupEventListeners() {
        this.runBtn.addEventListener('click', () => this.run());
        this.stepBtn.addEventListener('click', () => this.step());
        this.autoPlayBtn.addEventListener('click', () => this.startAutoPlay());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.speedSelector.addEventListener('change', (e) => { this.speed = parseFloat(e.target.value); this.updateSpeedLabel(); });
    }
    loadSampleCode() {
        const code = `#include <stdio.h>

void print_fibonacci_loop(int n) {
    if (n <= 0) {
        printf("Please enter a positive integer.\n");
        return;
    }

    long long first = 0, second = 1, next;

    printf("Fibonacci Sequence (%d terms): ", n);

    for (int i = 0; i < n; i++) {
        if (i == 0) {
            printf("%lld", first);
        } else if (i == 1) {
            printf(", %lld", second);
        } else {
            next = first + second;
            first = second;
            second = next;
            printf(", %lld", next);
        }
    }

    printf("\n");
}

int main() {
    int terms = 10;
    print_fibonacci_loop(terms);
    return 0;
}`;
        this.sourceTextarea.value = code;
    }
    run() {
        if (this.running || this.isPaused) return;
        this.isRunning = true;
        this.isPaused = false;
        this.updateUI();
        this.executeCode();
    }
    step() {
        if (!this.isRunning) return;
        this.isPaused = true;
        this.updateUI();
        this.executeOneStep();
    }
    autoPlay() {
        if (this.isRunning && !this.isPaused) return;
        this.autoPlay();
    }
    pause() {
        this.isPaused = true;
        this.updateUI();
    }
    reset() {
        this.running = false;
        this.isPaused = false;
        this.executionHistory = [];
        this.updateUI();
    }
    startAutoPlay() {
        if (this.isRunning && !this.isPaused) return;
        this.autoPlay();
    }
    executeCode() {
        const code = this.sourceTextarea.value;
        this.executionHistory = [];
        try {
            this.run();
        } catch (e) {
            console.error(e);
            this.addToOutput('Error: ' + e.message);
        }
    }
    executeOneStep() {
        if (!this.isRunning) return;
        this.isPaused = true;
        this.updateUI();
        setTimeout(() => this.step(), 500);
    }
    updateUI() {
        this.runBtn.disabled = this.isRunning || this.isPaused;
        this.autoPlayBtn.disabled = this.isRunning;
        this.pauseBtn.disabled = this.isRunning || this.isPaused;
        if (this.currentInstruction) {
            this.instructionDisplay.textContent = this.currentInstruction;
        } else {
            this.instructionDisplay.textContent = 'No instruction yet.';
        }
        this.renderVariables();
        this.typeDisplay.textContent = 'Variables: ' + JSON.stringify(this.variables);
    }
    renderVariables() {
        const list = this.variablesPanel.querySelector('#variables-list');
        if (list) {
            list.innerHTML = '';
            for (const [k,v] of Object.entries(this.variables)) {
                const li = document.createElement('li');
                li.textContent = k + ': ' + v;
                list.appendChild(li);
            }
        }
    }
    addToOutput(msg) {
        const div = document.createElement('div');
        div.textContent = msg;
        this.outputLog.prepend(div);
        if (this.outputLog.children.length > 50) {
            this.outputLog.removeChild(this.outputLog.lastChild);
        }
    }
    updateSpeedLabel() {
        const opt = this.speedSelector.querySelector('option');
        if (opt) opt.textContent = 'Speed: ' + this.speed + 'x';
    }
}

document.addEventListener('DOMContentLoaded', () => new CodeFlowApp());