import chalk from 'chalk';

export interface ProgressStep {
  id: string;
  message: string;
  completed: boolean;
  active?: boolean;
}

export class ProgressTracker {
  private steps: ProgressStep[] = [];
  private animationInterval?: NodeJS.Timeout;
  private animationDots = 0;

  constructor(steps: Array<{ id: string; message: string }>) {
    this.steps = steps.map(step => ({ ...step, completed: false, active: false }));
    // Set first step as active initially
    if (this.steps.length > 0) {
      this.steps[0].active = true;
    }
  }

  display() {
    // Clear previous progress display
    process.stdout.write('\x1b[2K\r'); // Clear current line
    
    console.log('\n' + chalk.cyan.bold('Progress:'));
    for (const step of this.steps) {
      let icon: string;
      let text: string;
      
      if (step.completed) {
        icon = chalk.green('✅');
        text = chalk.green(step.message);
      } else if (step.active) {
        icon = chalk.yellow('◐');
        const dots = '.'.repeat(this.animationDots + 1);
        text = chalk.yellow(step.message + dots);
      } else {
        icon = chalk.gray('☐');
        text = chalk.gray(step.message);
      }
      
      console.log(`${icon} ${text}`);
    }
    console.log('');
  }

  complete(stepId: string) {
    const currentStepIndex = this.steps.findIndex(s => s.id === stepId);
    if (currentStepIndex !== -1) {
      const step = this.steps[currentStepIndex];
      step.completed = true;
      step.active = false;
      
      // Set next step as active
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < this.steps.length) {
        this.steps[nextStepIndex].active = true;
        this.startAnimation();
      } else {
        // All steps completed, stop animation
        this.stopAnimation();
      }
      
      this.updateDisplay();
    }
  }

  startAnimation() {
    this.stopAnimation(); // Clear any existing animation
    this.animationInterval = setInterval(() => {
      this.animationDots = (this.animationDots + 1) % 3; // Cycle through 0, 1, 2
      this.updateDisplay();
    }, 500);
  }

  stopAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
    }
  }

  private updateDisplay() {
    // Move cursor up to overwrite previous progress
    const linesToClear = this.steps.length + 3; // steps + header + empty lines
    process.stdout.write(`\x1b[${linesToClear}A`); // Move cursor up
    this.display();
  }

  reset() {
    this.stopAnimation();
    this.steps.forEach((step, index) => {
      step.completed = false;
      step.active = index === 0;
    });
  }
}