#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { startInteractiveSetup } from './interactive';
import { CodebaseAnalyzer } from './codebase-analyzer';
import { ClaudeClient } from './claude-client';
import { FileGenerator } from './file-generator';
import { ProgressTracker } from './progress-tracker';

const program = new Command();

async function main() {
  console.log(
    boxen(
      `🚀 ${chalk.bold.blue('Welcome to Claude Project Setup!')}\n\n${chalk.gray('Generate personalized Claude Code agents, commands, and rules\nbased on your codebase and experience level.')}\n\n${chalk.yellow('💡 Press Q at any time to quit')}`,
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'blue',
        margin: 1
      }
    )
  );

  try {
    const userProfile = await startInteractiveSetup();
    
    const claudeClient = new ClaudeClient(userProfile.apiKey, userProfile.modelType);
    const analyzer = new CodebaseAnalyzer();
    const generator = new FileGenerator();

    // Create progress tracker
    const progressSteps = userProfile.projectType === 'new' 
      ? [
          { id: 'analyze-idea', message: 'Analyzing project idea' },
          { id: 'generate-setup', message: 'Generating personalized setup' },
          { id: 'create-agents', message: 'Creating specialized agents' },
          { id: 'create-commands', message: 'Creating custom commands' },
          { id: 'create-rules', message: 'Writing CLAUDE.md rules' }
        ]
      : [
          { id: 'analyze-codebase', message: 'Analyzing codebase structure' },
          { id: 'detect-patterns', message: 'Detecting frameworks and patterns' },
          { id: 'generate-setup', message: 'Generating personalized setup' },
          { id: 'create-agents', message: 'Creating specialized agents' },
          { id: 'create-commands', message: 'Creating custom commands' },
          { id: 'create-rules', message: 'Writing CLAUDE.md rules' }
        ];

    const progress = new ProgressTracker(progressSteps);
    progress.display();

    let recommendations: any;
    let projectPath = userProfile.projectPath || process.cwd();

    if (userProfile.projectType === 'new') {
      // Generate from idea
      progress.complete('analyze-idea');
      const analysis = await claudeClient.generateFromIdea(userProfile.projectIdea!, userProfile);
      progress.complete('generate-setup');
      
      try {
        recommendations = JSON.parse(analysis);
      } catch (error) {
        console.error(chalk.red('\n❌ Failed to parse AI response:'), analysis.substring(0, 200) + '...');
        throw new Error('Invalid response format from Claude');
      }
    } else {
      // Analyze existing codebase
      progress.complete('analyze-codebase');
      const codebaseInfo = await analyzer.analyze(projectPath);
      const formattedInfo = analyzer.formatForLLM(codebaseInfo);
      
      progress.complete('detect-patterns');
      const analysis = await claudeClient.analyzeCodebase(formattedInfo, userProfile);
      progress.complete('generate-setup');
      
      try {
        recommendations = JSON.parse(analysis);
      } catch (error) {
        console.error(chalk.red('\n❌ Failed to parse AI response:'), analysis.substring(0, 200) + '...');
        throw new Error('Invalid response format from Claude');
      }
    }

    // Generate files with progress updates
    progress.complete('create-agents');
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
    
    progress.complete('create-commands');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const generatedFiles = await generator.generate(projectPath, recommendations, userProfile);
    progress.complete('create-rules');

    // Display results
    console.log(
      boxen(
        `${chalk.green.bold('✅ Setup Complete!')}\n\n` +
        `${chalk.cyan('Generated Files:')}\n` +
        `📁 ${generatedFiles.agents.length} specialized agent${generatedFiles.agents.length !== 1 ? 's' : ''}\n` +
        `⚡ ${generatedFiles.commands.length} custom command${generatedFiles.commands.length !== 1 ? 's' : ''}\n` +
        `🔗 ${generatedFiles.hooks.content ? 'Smart hooks configuration' : 'No hooks generated'}\n` +
        `📋 Updated CLAUDE.md with project rules\n\n` +
        `${chalk.yellow('Your Claude Code is now personalized for this project!')}`,
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'green',
          margin: 1
        }
      )
    );

    console.log(`\n${chalk.cyan('Generated agents:')}`);
    for (const agent of generatedFiles.agents) {
      console.log(`  • ${chalk.white(agent.name)} → ${chalk.gray(agent.path)}`);
    }

    console.log(`\n${chalk.cyan('Generated commands:')}`);
    for (const command of generatedFiles.commands) {
      console.log(`  • ${chalk.white(command.name)} → ${chalk.gray(command.path)}`);
    }

    if (generatedFiles.hooks.content) {
      console.log(`\n${chalk.cyan('Generated hooks:')}`);
      console.log(`  • ${chalk.white('Automation config')} → ${chalk.gray(generatedFiles.hooks.path)}`);
    }

    console.log(`\n${chalk.green('🎉 Ready to use! Start Claude Code in this directory to use your personalized setup.')}`);

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

program
  .name('claude-init')
  .description('Generate personalized Claude Code setup for your project')
  .version('1.0.0')
  .action(main);

program.parse();