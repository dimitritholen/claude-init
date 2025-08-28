import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export interface GeneratedFiles {
  agents: Array<{ name: string; content: string; path: string }>;
  commands: Array<{ name: string; content: string; path: string }>;
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
    return `# ${agent.name}

${agent.purpose}

## System Prompt

${agent.systemPrompt}

## Usage

This agent is automatically activated when working on tasks that match its expertise area.
`;
  }

  private generateCommandFile(command: any): string {
    return `# ${command.name}

${command.description}

## Prompt

${command.prompt}
`;
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

    return generatedFiles;
  }
}