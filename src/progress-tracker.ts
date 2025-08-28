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
  private displayed = false;
  private completed = new Set<string>();

  constructor(steps: Array<{ id: string; message: string }>) {
    this.steps = steps.map(step => ({ ...step, completed: false, active: false }));
  }

  display() {
    if (!this.displayed) {
      console.log('\n' + chalk.cyan.bold('Progress:'));
      for (const step of this.steps) {
        console.log(`${chalk.gray('☐')} ${chalk.gray(step.message)}`);
      }
      console.log('');
      this.displayed = true;
    }
  }

  complete(stepId: string) {
    if (this.completed.has(stepId)) return; // Prevent duplicate completions
    
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      this.completed.add(stepId);
      step.completed = true;
      
      // Print clean completion message
      console.log(`${chalk.green('✓')} ${chalk.green(step.message)}`);
      
      // Stop animation if this is the last step
      if (this.completed.size === this.steps.length) {
        this.stopAnimation();
      }
    }
  }

  startAnimation() {
    // No animation needed - we use clean line-by-line output
    // Animation was causing the display corruption
  }

  stopAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
    }
  }

  logWarning(message: string) {
    // Clean warning output that doesn't interfere with progress
    console.log(chalk.yellow(`⚠️  ${message}`));
  }

  logError(message: string) {
    // Clean error output
    console.log(chalk.red(`❌ ${message}`));
  }

  fail(stepId: string, message: string) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      console.log(`${chalk.red('✗')} ${chalk.red(step.message)} - ${chalk.red(message)}`);
    }
    this.stopAnimation();
  }

  reset() {
    this.stopAnimation();
    this.completed.clear();
    this.displayed = false;
    this.steps.forEach(step => {
      step.completed = false;
      step.active = false;
    });
  }
}