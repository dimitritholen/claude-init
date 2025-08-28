import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { join } from 'path';
import { ModelType, ClaudeClient } from './claude-client';

export interface UserProfile {
  role: 'frontend' | 'backend' | 'fullstack' | 'devops';
  experience: 'junior' | 'senior';
  projectType: 'new' | 'existing' | 'update';
  projectPath?: string;
  projectIdea?: string;
  apiKey: string;
  modelType: ModelType;
}

async function getApiKey(): Promise<string> {
  const existingKey = process.env.ANTHROPIC_API_KEY;
  
  if (existingKey) {
    console.log(chalk.green('✓ Found API key in environment'));
    return existingKey;
  }

  console.log(chalk.yellow('⚠️  No API key found in environment'));
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: '🔑 Enter your Anthropic API key:',
      mask: '*',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'API key is required';
        }
        if (!input.startsWith('sk-ant-')) {
          return 'Invalid API key format. Should start with "sk-ant-"';
        }
        return true;
      }
    }
  ]);

  return apiKey;
}

export async function startInteractiveSetup(): Promise<UserProfile> {
  console.log(chalk.gray('💡 Press Q at any time to quit\n'));

  // Get and validate API key
  const apiKey = await getApiKey();
  
  const { modelType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'modelType',
      message: '🤖 Which Claude model would you like to use?',
      choices: [
        { name: '⚡ Sonnet 4 (Fast, efficient)', value: 'sonnet' },
        { name: '🧠 Opus 4 (Advanced reasoning)', value: 'opus' }
      ]
    }
  ]);

  // Validate API key
  const spinner = ora('🔐 Validating API key...').start();
  const client = new ClaudeClient(apiKey, modelType);
  const isValid = await client.validateApiKey();
  
  if (!isValid) {
    spinner.fail('❌ Invalid API key');
    console.log(chalk.red('Please check your API key and try again.'));
    process.exit(1);
  }
  
  spinner.succeed('✅ API key validated!');
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
    projectIdea,
    apiKey,
    modelType
  };

  console.log('\n' + chalk.green('✅ Profile complete! Generating your personalized Claude setup...'));
  
  return userProfile;
}