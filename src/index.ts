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
    progress.startAnimation();

    // Small delay to ensure user sees the initial state before work begins
    await new Promise(resolve => setTimeout(resolve, 200));

    let recommendations: any;
    let codebaseInfo: any = null;
    let projectPath = userProfile.projectPath || process.cwd();

    if (userProfile.projectType === 'new') {
      // Generate from idea
      const analysis = await claudeClient.generateFromIdea(userProfile.projectIdea!, userProfile);
      progress.complete('analyze-idea');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      progress.complete('generate-setup');
      
      try {
        recommendations = JSON.parse(analysis);
        
        // Validate that we have the basic structure
        if (!recommendations.projectAnalysis) {
          console.warn(chalk.yellow('⚠️  Missing project analysis in response'));
        }
        if (!recommendations.recommendedAgents || !Array.isArray(recommendations.recommendedAgents)) {
          console.warn(chalk.yellow('⚠️  Missing or invalid agents in response, will use defaults'));
        }
        if (!recommendations.recommendedCommands || !Array.isArray(recommendations.recommendedCommands)) {
          console.warn(chalk.yellow('⚠️  Missing or invalid commands in response, will use defaults'));
        }
        
      } catch (error) {
        console.error(chalk.red('\n❌ Failed to parse AI response:'), analysis.substring(0, 400) + '...');
        console.error(chalk.red('❌ Parse error:'), error instanceof Error ? error.message : error);
        
        // Try to continue with minimal fallback structure
        console.warn(chalk.yellow('⚠️  Using fallback configuration...'));
        recommendations = {
          projectAnalysis: {
            detectedTechnologies: ['Based on idea'],
            projectType: 'New Project',
            complexity: 'medium',
            buildTools: ['npm'],
            testingSetup: 'to-be-added',
            mainLanguages: ['TypeScript']
          },
          recommendedAgents: [],
          recommendedCommands: [],
          recommendedHooks: {},
          claudeRules: {
            codingStandards: ['Use modern best practices', 'Follow project conventions'],
            architectureGuidelines: ['Start simple', 'Follow YAGNI principle'],
            testingRequirements: ['Plan for real testing from start', 'Avoid mock-only testing'],
            simplicityGuardrails: ['Build MVP first', 'Add features incrementally']
          }
        };
      }
    } else {
      // Analyze existing codebase
      codebaseInfo = await analyzer.analyze(projectPath);
      const formattedInfo = analyzer.formatForLLM(codebaseInfo);
      progress.complete('analyze-codebase');
      
      // Add small delay to show the step transition
      await new Promise(resolve => setTimeout(resolve, 300));
      progress.complete('detect-patterns');
      
      const analysis = await claudeClient.analyzeCodebase(formattedInfo, userProfile);
      progress.complete('generate-setup');
      
      try {
        recommendations = JSON.parse(analysis);
        
        // Validate that we have the basic structure
        if (!recommendations.projectAnalysis) {
          console.warn(chalk.yellow('⚠️  Missing project analysis in response'));
        }
        if (!recommendations.recommendedAgents || !Array.isArray(recommendations.recommendedAgents)) {
          console.warn(chalk.yellow('⚠️  Missing or invalid agents in response, will use defaults'));
        }
        if (!recommendations.recommendedCommands || !Array.isArray(recommendations.recommendedCommands)) {
          console.warn(chalk.yellow('⚠️  Missing or invalid commands in response, will use defaults'));
        }
        
      } catch (error) {
        console.error(chalk.red('\n❌ Failed to parse AI response:'), analysis.substring(0, 400) + '...');
        console.error(chalk.red('❌ Parse error:'), error instanceof Error ? error.message : error);
        
        // Try to continue with minimal fallback structure
        console.warn(chalk.yellow('⚠️  Using fallback configuration...'));
        recommendations = {
          projectAnalysis: {
            detectedTechnologies: ['TypeScript', 'Node.js'],
            projectType: 'CLI Tool',
            complexity: 'medium',
            buildTools: ['npm'],
            testingSetup: 'missing',
            mainLanguages: ['TypeScript']
          },
          recommendedAgents: [],
          recommendedCommands: [],
          recommendedHooks: {},
          claudeRules: {
            codingStandards: ['Use TypeScript strict mode', 'Follow existing patterns'],
            architectureGuidelines: ['Keep solutions simple', 'Follow YAGNI principle'],
            testingRequirements: ['Add real integration tests', 'Avoid mock-only testing'],
            simplicityGuardrails: ['Implement only required features', 'Prefer composition over inheritance']
          }
        };
      }
    }

    // Generate files with progress updates
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
    progress.complete('create-agents');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    progress.complete('create-commands');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    progress.complete('create-hooks');
    
    const generatedFiles = await generator.generate(projectPath, recommendations, userProfile, codebaseInfo);
    progress.complete('create-rules');
    progress.stopAnimation(); // Ensure animation is stopped

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