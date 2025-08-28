#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { startInteractiveSetup, UserProfile } from './interactive';
import { CodebaseAnalyzer } from './codebase-analyzer';
import { ClaudeClient } from './claude-client';
import { FileGenerator } from './file-generator';

const program = new Command();

async function main() {
  console.log(
    boxen(
      `🚀 ${chalk.bold.blue('Welcome to Claude Project Setup!')}\n\n${chalk.gray('Generate personalized Claude Code agents, commands, and rules\nbased on your codebase and experience level.')}`,
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
    
    const claudeClient = new ClaudeClient();
    const analyzer = new CodebaseAnalyzer();
    const generator = new FileGenerator();

    let recommendations: any;
    let projectPath = userProfile.projectPath || process.cwd();

    if (userProfile.projectType === 'new') {
      // Generate from idea
      const spinner = ora('🧠 Analyzing your project idea...').start();
      const analysis = await claudeClient.generateFromIdea(userProfile.projectIdea!, userProfile);
      recommendations = JSON.parse(analysis);
      spinner.succeed('✅ Project analysis complete!');
    } else {
      // Analyze existing codebase
      const spinner = ora('🔍 Analyzing your codebase...').start();
      const codebaseInfo = await analyzer.analyze(projectPath);
      const formattedInfo = analyzer.formatForLLM(codebaseInfo);
      
      spinner.text = '🧠 Generating personalized setup...';
      const analysis = await claudeClient.analyzeCodebase(formattedInfo, userProfile);
      recommendations = JSON.parse(analysis);
      spinner.succeed('✅ Codebase analysis complete!');
    }

    // Generate files
    const generatingSpinner = ora('📝 Creating Claude Code files...').start();
    const generatedFiles = await generator.generate(projectPath, recommendations, userProfile);
    generatingSpinner.succeed('✨ Claude Code setup complete!');

    // Display results
    console.log(
      boxen(
        `${chalk.green.bold('✅ Setup Complete!')}\n\n` +
        `${chalk.cyan('Generated Files:')}\n` +
        `📁 ${generatedFiles.agents.length} specialized agent${generatedFiles.agents.length !== 1 ? 's' : ''}\n` +
        `⚡ ${generatedFiles.commands.length} custom command${generatedFiles.commands.length !== 1 ? 's' : ''}\n` +
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