#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { startInteractiveSetup } from './interactive';
import { CodebaseAnalyzer } from './codebase-analyzer';
import { ClaudeClient, QualityError } from './claude-client';
import { FileGenerator } from './file-generator';
import { ProgressTracker } from './progress-tracker';

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

  let progress: ProgressTracker | undefined;

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
          { id: 'create-hooks', message: 'Creating automation hooks' },
          { id: 'create-rules', message: 'Writing CLAUDE.md rules' }
        ]
      : [
          { id: 'analyze-codebase', message: 'Analyzing codebase structure' },
          { id: 'detect-patterns', message: 'Detecting frameworks and patterns' },
          { id: 'generate-setup', message: 'Generating personalized setup' },
          { id: 'create-agents', message: 'Creating specialized agents' },
          { id: 'create-commands', message: 'Creating custom commands' },
          { id: 'create-hooks', message: 'Creating automation hooks' },
          { id: 'create-rules', message: 'Writing CLAUDE.md rules' }
        ];

    progress = new ProgressTracker(progressSteps);
    progress.display();

    let recommendations: any;
    let codebaseInfo: any = null;
    let projectPath = userProfile.projectPath || process.cwd();

    if (userProfile.projectType === 'new') {
      // Generate from idea
      const analysis = await claudeClient.generateFromIdea(userProfile.projectIdea!, userProfile);
      progress.complete('analyze-idea');
      progress.complete('generate-setup');
      
      try {
        recommendations = JSON.parse(analysis);
        
      } catch (error) {
        // Quality validation failed or JSON parsing failed - this should be handled by QualityError
        throw error;
      }
    } else {
      // Analyze existing codebase
      codebaseInfo = await analyzer.analyze(projectPath);
      const formattedInfo = analyzer.formatForLLM(codebaseInfo);
      progress.complete('analyze-codebase');
      progress.complete('detect-patterns');
      
      const analysis = await claudeClient.analyzeCodebase(formattedInfo, userProfile);
      progress.complete('generate-setup');
      
      try {
        recommendations = JSON.parse(analysis);
      } catch (error) {
        // Quality validation failed or JSON parsing failed - this should be handled by QualityError
        throw error;
      }
    }

    // Generate files with progress updates
    progress.complete('create-agents');
    progress.complete('create-commands');
    progress.complete('create-hooks');
    
    const generatedFiles = await generator.generate(projectPath, recommendations, userProfile, codebaseInfo);
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
    if (progress) {
      progress.stopAnimation(); // Clean up animation on error
    }

    if (error instanceof QualityError) {
      // Handle quality validation failures with detailed message
      console.log('\n' + boxen(
        chalk.red.bold('❌ Analysis Quality Check Failed\n\n') +
        chalk.white('Claude\'s response did not meet quality standards:\n') +
        error.validationErrors.map(e => chalk.yellow(`  • ${e}`)).join('\n') +
        '\n\n' +
        chalk.cyan('This typically happens when:\n') +
        '  • API response was truncated due to length limits\n' +
        '  • Context window was exceeded\n' +
        '  • Temporary API connectivity issues\n' +
        '  • Complex project required multiple analysis passes\n\n' +
        chalk.green('Solutions:\n') +
        '  • Run \'claude-init\' again (often resolves the issue)\n' +
        '  • Try using --model opus for complex projects\n' +
        '  • Ensure stable internet connection\n\n' +
        chalk.yellow.bold('Quality guarantee: We only generate setups with Claude\'s complete analysis.'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'red',
          margin: 1
        }
      ));
    } else {
      // Handle other errors
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}

program
  .name('claude-init')
  .description('Generate personalized Claude Code setup for your project')
  .version('1.0.0')
  .action(main);

program.parse();