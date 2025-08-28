import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { createAgentSystemPrompt, createCommandPrompt, MANDATORY_COMPLIANCE_PROTOCOL } from './prompt-templates';

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

  private generateAgentFile(agent: any): string {
    // Ensure description ends with "Use when" clause
    let description = agent.description;
    if (!description.includes('Use ') && !description.includes('use ')) {
      description = `${description}. Use for related tasks`;
    }
    
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

  private generateClaudeMd(recommendations: any, userProfile: any): string {
    const { claudeRules, projectAnalysis } = recommendations;
    
    let content = `# Claude Code Configuration

Generated for: ${userProfile.role} (${userProfile.experience} level)
Project: ${projectAnalysis.projectType || 'detected project'} (${projectAnalysis.complexity} complexity)

## Coding Standards

${claudeRules.codingStandards.map((rule: string) => `- ${rule}`).join('\n')}

## Architecture Guidelines  

${claudeRules.architectureGuidelines.map((rule: string) => `- ${rule}`).join('\n')}

## Testing Requirements

${claudeRules.testingRequirements.map((rule: string) => `- ${rule}`).join('\n')}

## Simplicity Guardrails

${claudeRules.simplicityGuardrails.map((rule: string) => `- ${rule}`).join('\n')}

## Verification Standards

${claudeRules.verificationStandards ? claudeRules.verificationStandards.map((rule: string) => `- ${rule}`).join('\n') : '- Provide concrete evidence for all functionality claims\n- Flag mock-only testing as INADEQUATE and HIGH RISK\n- Use enforced status labels: VERIFIED, MOCK-ONLY, INADEQUATE, UNSUBSTANTIATED'}

## Compliance Protocols

${claudeRules.complianceProtocols ? claudeRules.complianceProtocols.map((rule: string) => `- ${rule}`).join('\n') : '- Mandatory Chain of Thought analysis before any code implementation\n- Chain of Draft showing evolution of key functions\n- YAGNI enforcement - document what is deliberately NOT implemented\n- Continuous senior developer review after each significant function'}

## Important Reminders

- **NEVER claim functionality works without concrete real testing proof**
- **ALWAYS flag mock-only test suites as INADEQUATE and HIGH RISK**  
- **HALT before any code** and produce Chain of Thought analysis with 3+ solutions
- **Only implement minimum functionality required** (YAGNI principle)
- **Provide specific evidence** for any performance or functionality claims
- Keep solutions simple and appropriate for the project complexity
- Follow the existing patterns and conventions in this codebase
- Verify your implementations actually work by testing them

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

${MANDATORY_COMPLIANCE_PROTOCOL}
`;

    return content;
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
    userProfile: any
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
      console.warn('⚠️  No agents found in recommendations, creating default agent...');
      // Create a default agent as fallback
      const defaultAgent = {
        name: 'Development Helper',
        description: 'General purpose development assistant',
        tools: ['Read', 'Write', 'Edit', 'Bash'],
        systemPrompt: 'You are a helpful development assistant. Follow the project guidelines in CLAUDE.md.'
      };
      const fileName = 'development-helper.md';
      const filePath = join(agentsDir, fileName);
      const content = this.generateAgentFile(defaultAgent);
      
      await this.ensureDirectory(filePath);
      await writeFile(filePath, content, 'utf-8');
      
      generatedFiles.agents.push({
        name: defaultAgent.name,
        content,
        path: filePath
      });
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
      console.warn('⚠️  No commands found in recommendations, creating default command...');
      // Create a default command as fallback
      const defaultCommand = {
        name: 'help',
        description: 'General help and guidance',
        argumentHint: '[topic]',
        allowedTools: ['Read', 'Grep'],
        prompt: 'Provide helpful guidance on the requested topic. Use the project context from CLAUDE.md to give relevant advice.'
      };
      const fileName = 'help.md';
      const filePath = join(commandsDir, fileName);
      const content = this.generateCommandFile(defaultCommand);
      
      await this.ensureDirectory(filePath);
      await writeFile(filePath, content, 'utf-8');
      
      generatedFiles.commands.push({
        name: defaultCommand.name,
        content,
        path: filePath
      });
    }

    // Generate or update CLAUDE.md
    const claudeMdPath = join(projectPath, 'CLAUDE.md');
    const claudeMdContent = this.generateClaudeMd(recommendations, userProfile);
    
    // Check if CLAUDE.md already exists
    if (existsSync(claudeMdPath)) {
      const existing = await readFile(claudeMdPath, 'utf-8');
      const updatedContent = `${existing}

# Auto-generated Configuration
${claudeMdContent}`;
      await writeFile(claudeMdPath, updatedContent, 'utf-8');
    } else {
      await writeFile(claudeMdPath, claudeMdContent, 'utf-8');
    }

    generatedFiles.claudeMd = {
      content: claudeMdContent,
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