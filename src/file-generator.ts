import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

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
    const yamlHeader = `---
name: ${agent.name}
description: ${agent.description}
tools: ${agent.tools ? agent.tools.join(', ') : 'Read, Write, Edit, Bash'}
---

`;
    
    return yamlHeader + agent.systemPrompt;
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
    
    return yamlHeader + command.prompt;
  }

  private generateClaudeMd(recommendations: any, userProfile: any): string {
    const { claudeRules, projectAnalysis } = recommendations;
    
    let content = `# Claude Code Configuration

Generated for: ${userProfile.role} (${userProfile.experience} level)
Project: ${projectAnalysis.framework} (${projectAnalysis.complexity} complexity)

## Coding Standards

${claudeRules.codingStandards.map((rule: string) => `- ${rule}`).join('\n')}

## Architecture Guidelines  

${claudeRules.architectureGuidelines.map((rule: string) => `- ${rule}`).join('\n')}

## Testing Requirements

${claudeRules.testingRequirements.map((rule: string) => `- ${rule}`).join('\n')}

## Simplicity Guardrails

${claudeRules.simplicityGuardrails.map((rule: string) => `- ${rule}`).join('\n')}

## Important Reminders

- Always write REAL tests that actually test functionality, not mocks
- Keep solutions simple and appropriate for the project complexity
- Follow the existing patterns and conventions in this codebase
- Verify your implementations actually work by testing them
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
              hooks: [{
                type: 'command',
                command: hook.command
              }]
            };
          } else {
            return {
              hooks: [{
                type: 'command', 
                command: hook.command
              }]
            };
          }
        });
      }
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
    for (const agent of recommendations.recommendedAgents) {
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

    // Generate command files
    for (const command of recommendations.recommendedCommands) {
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
    if (recommendations.recommendedHooks) {
      const hooksConfig = this.generateHooksConfig(recommendations.recommendedHooks);
      const hooksDir = join(claudeDir, 'hooks');
      const hooksConfigPath = join(hooksDir, 'config.json');
      
      await mkdir(hooksDir, { recursive: true });
      await writeFile(hooksConfigPath, JSON.stringify(hooksConfig, null, 2), 'utf-8');
      
      generatedFiles.hooks = {
        content: JSON.stringify(hooksConfig, null, 2),
        path: hooksConfigPath
      };
    }

    return generatedFiles;
  }
}