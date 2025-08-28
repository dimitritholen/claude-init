import Anthropic from '@anthropic-ai/sdk';

export class ClaudeClient {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeCodebase(codebaseInfo: string, userProfile: any): Promise<string> {
    const prompt = `You are a Claude Code configuration expert. Analyze this codebase and user profile to generate personalized Claude Code setup files.

CODEBASE ANALYSIS:
${codebaseInfo}

USER PROFILE:
- Role: ${userProfile.role}
- Experience: ${userProfile.experience}
- Project Type: ${userProfile.projectType}

Based on this analysis, generate recommendations for:
1. Specialized agents (what agents would be most useful for this project)
2. Custom commands (what workflow commands would help this developer)
3. CLAUDE.md rules (coding standards, architecture patterns, testing requirements)
4. Project-specific guardrails (prevent over-engineering, enforce simplicity)

Return your analysis as structured JSON with these sections:
{
  "projectAnalysis": {
    "framework": "...",
    "complexity": "simple|medium|complex",
    "architecture": "...",
    "testingApproach": "...",
    "mainLanguages": ["..."]
  },
  "recommendedAgents": [
    {
      "name": "...",
      "purpose": "...",
      "systemPrompt": "..."
    }
  ],
  "recommendedCommands": [
    {
      "name": "...",
      "description": "...",
      "prompt": "..."
    }
  ],
  "claudeRules": {
    "codingStandards": ["..."],
    "architectureGuidelines": ["..."],
    "testingRequirements": ["..."],
    "simplicityGuardrails": ["..."]
  }
}`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async generateFromIdea(projectIdea: string, userProfile: any): Promise<string> {
    const prompt = `You are a Claude Code configuration expert. Based on this project idea and user profile, generate a personalized Claude Code setup.

PROJECT IDEA:
${projectIdea}

USER PROFILE:
- Role: ${userProfile.role}
- Experience: ${userProfile.experience}

Generate recommendations for a NEW project including:
1. Recommended tech stack for this idea
2. Specialized agents for this type of project
3. Custom commands for common workflows
4. CLAUDE.md rules appropriate for the project complexity
5. Guardrails to prevent over-engineering

Return as structured JSON with the same format as codebase analysis.`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}