import chalk from 'chalk';

export interface ProgressStep {
  id: string;
  message: string;
  completed: boolean;
}

export class ProgressTracker {
  private steps: ProgressStep[] = [];

  constructor(steps: Array<{ id: string; message: string }>) {
    this.steps = steps.map(step => ({ ...step, completed: false }));
  }

  display() {
    console.log('\n' + chalk.cyan.bold('Progress:'));
    for (const step of this.steps) {
      const icon = step.completed ? chalk.green('✅') : chalk.gray('⏳');
      const text = step.completed ? chalk.green(step.message) : chalk.gray(step.message);
      console.log(`${icon} ${text}`);
    }
    console.log('');
  }

  complete(stepId: string) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
      this.display();
    }
  }

  reset() {
    this.steps.forEach(step => step.completed = false);
  }
}