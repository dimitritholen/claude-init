import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { join } from 'path';

export interface UserProfile {
  role: 'frontend' | 'backend' | 'fullstack' | 'devops';
  experience: 'junior' | 'senior';
  projectType: 'new' | 'existing' | 'update';
  projectPath?: string;
  projectIdea?: string;
}

export async function startInteractiveSetup(): Promise<UserProfile> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'projectType',
      message: '🎯 What are we working with today?',
      choices: [
        {
          name: '✨ New project from idea',
          value: 'new'
        },
        {
          name: '📁 Existing codebase',
          value: 'existing'
        },
        {
          name: '🔄 Update existing setup',
          value: 'update'
        }
      ]
    }
  ]);

  let projectPath: string | undefined;
  let projectIdea: string | undefined;

  if (answers.projectType === 'new') {
    const ideaAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'idea',
        message: '💡 Describe your project idea:',
        validate: (input: string) => {
          if (input.trim().length < 10) {
            return 'Please provide a more detailed description (at least 10 characters)';
          }
          return true;
        }
      }
    ]);
    projectIdea = ideaAnswer.idea;
  } else {
    const pathAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'path',
        message: '📂 Enter the path to your project:',
        default: process.cwd(),
        validate: (input: string) => {
          if (!existsSync(input)) {
            return 'Path does not exist. Please enter a valid directory path.';
          }
          return true;
        }
      }
    ]);
    projectPath = pathAnswer.path;

    // Check if .claude directory already exists
    if (answers.projectType === 'existing' && projectPath && existsSync(join(projectPath, '.claude'))) {
      const overwriteAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: '⚠️  Found existing .claude setup. Overwrite?',
          default: false
        }
      ]);
      
      if (!overwriteAnswer.overwrite) {
        console.log(chalk.yellow('Setup cancelled. Run with --force to overwrite existing setup.'));
        process.exit(0);
      }
    }
  }

  const profileAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'role',
      message: '👤 What\'s your primary role?',
      choices: [
        { name: '🎨 Frontend Developer', value: 'frontend' },
        { name: '⚙️  Backend Developer', value: 'backend' },
        { name: '🚀 Full-stack Developer', value: 'fullstack' },
        { name: '🛠️  DevOps Engineer', value: 'devops' }
      ]
    },
    {
      type: 'list',
      name: 'experience',
      message: '📈 Experience level?',
      choices: [
        { name: '🌱 Junior (more explanations)', value: 'junior' },
        { name: '🎯 Senior (concise guidance)', value: 'senior' }
      ]
    }
  ]);

  const userProfile: UserProfile = {
    ...answers,
    ...profileAnswers,
    projectPath,
    projectIdea
  };

  console.log('\n' + chalk.green('✅ Profile complete! Generating your personalized Claude setup...'));
  
  return userProfile;
}