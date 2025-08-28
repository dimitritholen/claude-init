import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { createAgentSystemPrompt, createCommandPrompt, MANDATORY_COMPLIANCE_PROTOCOL } from './prompt-templates';
import { ClaudeMdManager, ProjectSpecificContent } from './claude-md-manager';

export interface GeneratedFiles {
  agents: Array<{ name: string; content: string; path: string }>;
  commands: Array<{ name: string; content: string; path: string }>;
  hooks: { content: string; path: string };
  claudeMd: { content: string; path: string };
}

export class FileGenerator {
  private async ensureDirectory(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  private enhanceAgentDescription(agent: any): string {
    let description = agent.description || '';
    
    // If description is already detailed (>100 chars) and follows pattern, use as-is
    if (description.length > 100 && description.includes('Use this agent when')) {
      return description;
    }
    
    // If description is too short or doesn't follow pattern, enhance it
    if (description.length < 100 || (!description.includes('Use ') && !description.includes('use '))) {
      const agentName = agent.name || 'specialist';
      const tools = agent.tools || ['Read', 'Write', 'Edit', 'Bash'];
      
      // Generate enhanced description based on agent name and tools
      const enhancedDescription = this.generateDetailedDescription(agentName, description, tools);
      return enhancedDescription;
    }
    
    return description;
  }

  private generateDetailedDescription(name: string, baseDescription: string, tools: string[]): string {
    const nameLower = name.toLowerCase();
    
    // Create base capabilities from name and tools
    let capabilities = '';
    let scenarios = '';
    let perfectFor = '';
    
    if (nameLower.includes('test')) {
      capabilities = 'comprehensive testing strategies and implementation';
      scenarios = 'writing unit tests, integration tests, performance benchmarks, or developing test automation frameworks';
      perfectFor = 'TDD workflows, test coverage improvements, or when establishing testing best practices';
    } else if (nameLower.includes('debug')) {
      capabilities = 'systematic debugging and problem resolution';
      scenarios = 'identifying code issues, analyzing error logs, troubleshooting application failures, or optimizing performance bottlenecks';
      perfectFor = 'complex bug investigation, production issue resolution, or when systematic problem-solving approaches are needed';
    } else if (nameLower.includes('architect') || nameLower.includes('design')) {
      capabilities = 'strategic architectural guidance and design pattern recommendations';
      scenarios = 'evaluating technical decisions, suggesting refactoring opportunities, designing system architecture, or ensuring code adheres to best practices';
      perfectFor = 'architecture reviews, major feature planning, or when balancing immediate needs with future extensibility';
    } else if (nameLower.includes('typescript') || nameLower.includes('ts')) {
      capabilities = 'TypeScript development expertise with strict typing and modern patterns';
      scenarios = 'implementing type-safe interfaces, configuring advanced TypeScript features, optimizing build processes, or migrating JavaScript to TypeScript';
      perfectFor = 'type system design, complex generic implementations, or when building scalable TypeScript applications';
    } else if (nameLower.includes('cli') || nameLower.includes('command')) {
      capabilities = 'CLI development and terminal-based application design';
      scenarios = 'building command-line interfaces, implementing argument parsing, designing user workflows, or creating developer tools';
      perfectFor = 'CLI architecture decisions, user experience optimization, or when building developer productivity tools';
    } else if (nameLower.includes('dev') || nameLower.includes('engineer') || nameLower.includes('code')) {
      capabilities = 'comprehensive software engineering expertise for complex development tasks';
      scenarios = 'analyzing requirements, designing system architecture, implementing robust solutions, or providing senior-level technical guidance';
      perfectFor = 'complex feature development, technical decision-making, or when senior engineering perspective is needed';
    } else {
      // Generic enhancement based on base description
      const cleanBase = baseDescription.replace(/\. Use.*$/, '').replace(/\.$/, '');
      capabilities = cleanBase || 'specialized development assistance';
      scenarios = 'implementing features, solving technical challenges, optimizing code, or providing expert guidance';
      perfectFor = 'complex development tasks, technical problem-solving, or when specialized expertise is required';
    }
    
    // Construct detailed description
    const detailed = `Use this agent when you need ${capabilities}. This includes ${scenarios}, or when you need expert technical guidance. Perfect for ${perfectFor}, and excels at delivering high-quality, maintainable solutions.`;
    
    return detailed;
  }

  private generateAgentFile(agent: any): string {
    // Enhance description to be detailed and follow proper patterns
    const description = this.enhanceAgentDescription(agent);
    
    const yamlHeader = `---
name: ${agent.name}
description: ${description}
model: ${agent.model || 'sonnet'}
tools: ${agent.tools ? agent.tools.join(', ') : 'Read, Write, Edit, Bash'}
---

`;
    
    // If the agent already has enhanced system prompt, use it; otherwise enhance it
    const enhancedSystemPrompt = agent.systemPrompt.includes('MANDATORY COMPLIANCE PROTOCOL') 
      ? agent.systemPrompt 
      : createAgentSystemPrompt(
          agent.name,
          agent.systemPrompt,
          agent.tools || ['Read', 'Write', 'Edit', 'Bash'],
          'detected from codebase analysis'
        );
    
    return yamlHeader + enhancedSystemPrompt;
  }

  private generateCommandFile(command: any): string {
    let yamlHeader = `---
`;
    if (command.allowedTools && command.allowedTools.length > 0) {
      yamlHeader += `allowed-tools: ${command.allowedTools.join(', ')}
`;
    }
    if (command.argumentHint) {
      yamlHeader += `argument-hint: ${command.argumentHint}
`;
    }
    yamlHeader += `description: ${command.description}
`;
    yamlHeader += `---

`;
    
    // If the command already has enhanced prompt, use it; otherwise enhance it
    const enhancedPrompt = command.prompt.includes('MANDATORY COMPLIANCE PROTOCOL')
      ? command.prompt
      : createCommandPrompt(
          command.description,
          command.prompt,
          command.argumentHint
        );
    
    return yamlHeader + enhancedPrompt;
  }

  private async generateClaudeMd(
    projectPath: string, 
    recommendations: any, 
    userProfile: any,
    codebaseInfo?: any
  ): Promise<void> {
    const claudeMdPath = join(projectPath, 'CLAUDE.md');
    const manager = new ClaudeMdManager(claudeMdPath);

    // Parse existing content
    await manager.parseExisting();

    // Extract project-specific information from codebase analysis
    const projectSpecificContent: ProjectSpecificContent = {
      projectType: recommendations.projectAnalysis?.projectType || 'unknown',
      complexity: recommendations.projectAnalysis?.complexity || 'medium',
      dependencies: codebaseInfo ? Object.keys(codebaseInfo.dependencies || {}) : [],
      frameworks: this.detectFrameworks(codebaseInfo),
      buildTools: this.detectBuildTools(codebaseInfo),
      testFrameworks: this.detectTestFrameworks(codebaseInfo)
    };

    // Generate project-specific sections
    const newSections = manager.generateProjectSpecificContent(
      recommendations.projectAnalysis || { projectType: 'unknown', complexity: 'medium' },
      userProfile,
      projectSpecificContent
    );

    // Add standard sections that might not be project-specific
    this.addStandardSections(newSections, recommendations.claudeRules);

    // Merge with existing content
    manager.mergeWithExisting(newSections);

    // Save the result
    await manager.save(userProfile, recommendations.projectAnalysis || { projectType: 'unknown', complexity: 'medium' });
  }

  private detectFrameworks(codebaseInfo: any): string[] {
    if (!codebaseInfo?.dependencies) return [];
    
    const frameworks = [];
    const deps = Object.keys(codebaseInfo.dependencies);
    
    if (deps.includes('react')) frameworks.push('react');
    if (deps.includes('express')) frameworks.push('express');
    if (deps.includes('fastify')) frameworks.push('fastify');
    if (deps.includes('next')) frameworks.push('next');
    if (deps.includes('nuxt')) frameworks.push('nuxt');
    if (deps.includes('vue')) frameworks.push('vue');
    if (deps.includes('angular')) frameworks.push('angular');
    if (deps.includes('n8n-workflow')) frameworks.push('n8n');
    
    return frameworks;
  }

  private detectBuildTools(codebaseInfo: any): string[] {
    if (!codebaseInfo) return [];
    
    const buildTools = [];
    const scripts = Object.keys(codebaseInfo.scripts || {});
    const deps = Object.keys({...codebaseInfo.dependencies, ...codebaseInfo.devDependencies});
    
    if (deps.includes('webpack')) buildTools.push('webpack');
    if (deps.includes('vite')) buildTools.push('vite');
    if (deps.includes('rollup')) buildTools.push('rollup');
    if (deps.includes('esbuild')) buildTools.push('esbuild');
    if (deps.includes('gulp')) buildTools.push('gulp');
    if (scripts.includes('build') || scripts.includes('compile')) buildTools.push('npm-scripts');
    
    return buildTools;
  }

  private detectTestFrameworks(codebaseInfo: any): string[] {
    if (!codebaseInfo) return [];
    
    const testFrameworks = [];
    const deps = Object.keys({...codebaseInfo.dependencies, ...codebaseInfo.devDependencies});
    
    if (deps.includes('vitest')) testFrameworks.push('vitest');
    if (deps.includes('jest')) testFrameworks.push('jest');
    if (deps.includes('mocha')) testFrameworks.push('mocha');
    if (deps.includes('chai')) testFrameworks.push('chai');
    if (deps.includes('cypress')) testFrameworks.push('cypress');
    if (deps.includes('playwright')) testFrameworks.push('playwright');
    
    return testFrameworks;
  }

  private addStandardSections(sections: any[], claudeRules: any): void {
    // Add verification standards if not generated by project-specific logic
    if (!sections.find(s => s.title === 'Verification Standards')) {
      sections.push({
        title: 'Verification Standards',
        content: claudeRules.verificationStandards 
          ? claudeRules.verificationStandards.map((rule: string) => `- ${rule}`).join('\n')
          : '- Provide concrete evidence for all functionality claims\n- Flag mock-only testing as INADEQUATE and HIGH RISK\n- Use enforced status labels: VERIFIED, MOCK-ONLY, INADEQUATE, UNSUBSTANTIATED',
        isAutoGenerated: true,
        level: 2
      });
    }

    // Add compliance protocols
    if (!sections.find(s => s.title === 'Compliance Protocols')) {
      sections.push({
        title: 'Compliance Protocols',
        content: claudeRules.complianceProtocols 
          ? claudeRules.complianceProtocols.map((rule: string) => `- ${rule}`).join('\n')
          : '- Mandatory Chain of Thought analysis before any code implementation\n- Chain of Draft showing evolution of key functions\n- YAGNI enforcement - document what is deliberately NOT implemented\n- Continuous senior developer review after each significant function',
        isAutoGenerated: true,
        level: 2
      });
    }

    // Add important reminders
    if (!sections.find(s => s.title === 'Important Reminders')) {
      sections.push({
        title: 'Important Reminders',
        content: `- **NEVER claim functionality works without concrete real testing proof**
- **ALWAYS flag mock-only test suites as INADEQUATE and HIGH RISK**  
- **HALT before any code** and produce Chain of Thought analysis with 3+ solutions
- **Only implement minimum functionality required** (YAGNI principle)
- **Provide specific evidence** for any performance or functionality claims
- Keep solutions simple and appropriate for the project complexity
- Follow the existing patterns and conventions in this codebase
- Verify your implementations actually work by testing them`,
        isAutoGenerated: true,
        level: 2
      });
    }

    // Add instruction reminders
    if (!sections.find(s => s.title === 'important-instruction-reminders')) {
      sections.push({
        title: 'important-instruction-reminders',
        content: `Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.`,
        isAutoGenerated: true,
        level: 1
      });
    }

    // Add compliance protocol
    if (!sections.find(s => s.title === 'MANDATORY COMPLIANCE PROTOCOL')) {
      sections.push({
        title: 'MANDATORY COMPLIANCE PROTOCOL',
        content: MANDATORY_COMPLIANCE_PROTOCOL.replace(/^#{1,3}\s*/gm, '').trim(), // Remove leading headers
        isAutoGenerated: true,
        level: 2
      });
    }
  }

  private generateHooksConfig(recommendedHooks: any): any {
    const hooksConfig: any = { hooks: {} };
    
    // Process different hook types
    for (const [hookType, hooks] of Object.entries(recommendedHooks)) {
      if (Array.isArray(hooks) && hooks.length > 0) {
        hooksConfig.hooks[hookType] = hooks.map((hook: any) => {
          if (hookType === 'PostToolUse' && hook.matcher) {
            return {
              matcher: hook.matcher,
              description: hook.description,
              hooks: [{
                type: 'command',
                command: hook.command
              }]
            };
          } else if (hookType === 'Stop') {
            return {
              description: hook.description,
              hooks: [{
                type: 'command', 
                command: hook.command
              }]
            };
          } else {
            return {
              description: hook.description || 'Automated verification hook',
              hooks: [{
                type: 'command', 
                command: hook.command
              }]
            };
          }
        });
      }
    }
    
    // Add default verification hooks if none provided
    if (!hooksConfig.hooks.Stop) {
      hooksConfig.hooks.Stop = [{
        description: 'Verify implementation with real testing after task completion',
        hooks: [{
          type: 'command',
          command: 'echo "⚠️  REMINDER: Verify your implementation with REAL tests, not mocks. Provide concrete evidence of functionality."'
        }]
      }];
    }
    
    return hooksConfig;
  }

  async generate(
    projectPath: string,
    recommendations: any,
    userProfile: any,
    codebaseInfo?: any
  ): Promise<GeneratedFiles> {
    const claudeDir = join(projectPath, '.claude');
    const agentsDir = join(claudeDir, 'agents');
    const commandsDir = join(claudeDir, 'commands');

    // Ensure directories exist
    await mkdir(agentsDir, { recursive: true });
    await mkdir(commandsDir, { recursive: true });

    const generatedFiles: GeneratedFiles = {
      agents: [],
      commands: [],
      hooks: { content: '', path: '' },
      claudeMd: { content: '', path: '' }
    };

    // Generate agent files
    if (recommendations.recommendedAgents && Array.isArray(recommendations.recommendedAgents) && recommendations.recommendedAgents.length > 0) {
      for (const agent of recommendations.recommendedAgents) {
        if (agent && agent.name) {
          const fileName = `${agent.name.toLowerCase().replace(/\s+/g, '-')}.md`;
          const filePath = join(agentsDir, fileName);
          const content = this.generateAgentFile(agent);
          
          await this.ensureDirectory(filePath);
          await writeFile(filePath, content, 'utf-8');
          
          generatedFiles.agents.push({
            name: agent.name,
            content,
            path: filePath
          });
        }
      }
    } else {
      throw new Error('No agents found in recommendations. Quality validation should have caught this.');
    }

    // Generate command files
    if (recommendations.recommendedCommands && Array.isArray(recommendations.recommendedCommands) && recommendations.recommendedCommands.length > 0) {
      for (const command of recommendations.recommendedCommands) {
        if (command && command.name) {
          const fileName = `${command.name.toLowerCase().replace(/^\//, '').replace(/\s+/g, '-')}.md`;
          const filePath = join(commandsDir, fileName);
          const content = this.generateCommandFile(command);
          
          await this.ensureDirectory(filePath);
          await writeFile(filePath, content, 'utf-8');
          
          generatedFiles.commands.push({
            name: command.name,
            content,
            path: filePath
          });
        }
      }
    } else {
      throw new Error('No commands found in recommendations. Quality validation should have caught this.');
    }

    // Generate or update CLAUDE.md using the intelligent manager
    await this.generateClaudeMd(projectPath, recommendations, userProfile, codebaseInfo);
    
    const claudeMdPath = join(projectPath, 'CLAUDE.md');
    generatedFiles.claudeMd = {
      content: await readFile(claudeMdPath, 'utf-8'),
      path: claudeMdPath
    };

    // Generate hooks configuration
    if (recommendations.recommendedHooks && typeof recommendations.recommendedHooks === 'object') {
      try {
        const hooksConfig = this.generateHooksConfig(recommendations.recommendedHooks);
        const hooksDir = join(claudeDir, 'hooks');
        const hooksConfigPath = join(hooksDir, 'config.json');
        
        await mkdir(hooksDir, { recursive: true });
        await writeFile(hooksConfigPath, JSON.stringify(hooksConfig, null, 2), 'utf-8');
        
        generatedFiles.hooks = {
          content: JSON.stringify(hooksConfig, null, 2),
          path: hooksConfigPath
        };
      } catch (error) {
        console.warn('⚠️  Error generating hooks, using default configuration...');
        // Create minimal hooks as fallback
        const defaultHooks = {
          hooks: {
            Stop: [{
              description: 'Verify implementation with real testing after task completion',
              hooks: [{
                type: 'command',
                command: 'echo "⚠️  REMINDER: Verify your implementation with REAL tests, not mocks. Provide concrete evidence of functionality."'
              }]
            }]
          }
        };
        
        const hooksDir = join(claudeDir, 'hooks');
        const hooksConfigPath = join(hooksDir, 'config.json');
        
        await mkdir(hooksDir, { recursive: true });
        await writeFile(hooksConfigPath, JSON.stringify(defaultHooks, null, 2), 'utf-8');
        
        generatedFiles.hooks = {
          content: JSON.stringify(defaultHooks, null, 2),
          path: hooksConfigPath
        };
      }
    } else {
      console.warn('⚠️  No hooks found in recommendations, creating default hooks...');
      // Create default hooks configuration
      const defaultHooks = {
        hooks: {
          Stop: [{
            description: 'Verify implementation with real testing after task completion',
            hooks: [{
              type: 'command',
              command: 'echo "⚠️  REMINDER: Verify your implementation with REAL tests, not mocks. Provide concrete evidence of functionality."'
            }]
          }]
        }
      };
      
      const hooksDir = join(claudeDir, 'hooks');
      const hooksConfigPath = join(hooksDir, 'config.json');
      
      await mkdir(hooksDir, { recursive: true });
      await writeFile(hooksConfigPath, JSON.stringify(defaultHooks, null, 2), 'utf-8');
      
      generatedFiles.hooks = {
        content: JSON.stringify(defaultHooks, null, 2),
        path: hooksConfigPath
      };
    }

    return generatedFiles;
  }
}