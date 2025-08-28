import Anthropic from '@anthropic-ai/sdk';

export type ModelType = 'sonnet' | 'opus';

export class ClaudeClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, modelType: ModelType = 'sonnet') {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
    
    this.model = modelType === 'opus' 
      ? 'claude-opus-4-20250514'
      : 'claude-sonnet-4-20250514';
  }

  private extractJson(text: string): string {
    // Clean up the response to extract just the JSON
    const jsonMatch = text.match(/```json\s*\n([\s\S]*?)\n\s*```/) || 
                     text.match(/```\s*\n([\s\S]*?)\n\s*```/) ||
                     text.match(/(\{[\s\S]*\})/);
    
    if (jsonMatch) {
      return jsonMatch[1] || jsonMatch[0];
    }
    
    return text;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error: any) {
      if (error.status === 401) {
        return false;
      }
      // Other errors might be rate limits, etc. - still valid key
      return true;
    }
  }

  async analyzeCodebase(codebaseInfo: string, userProfile: any): Promise<string> {
    const prompt = `<role>
You are a Claude Code configuration expert with deep knowledge of:
- Software development best practices across ALL programming languages and frameworks
- Anthropic's prompt engineering techniques (XML tags, chain-of-thought, multishot examples, clear roles)
- Claude Code's agent, command, and hook systems
- Preventing over-engineering while maintaining code quality
</role>

<task>
Analyze the provided codebase data and user profile to generate a comprehensive Claude Code setup that includes:
1. Specialized agents with expertly crafted system prompts using prompt engineering best practices
2. Custom commands with proper argument handling and tool restrictions
3. Intelligent hooks for automation based on the detected project type
4. CLAUDE.md rules tailored to this specific project
</task>

${codebaseInfo}

<user_profile>
- Role: ${userProfile.role}
- Experience: ${userProfile.experience} 
- Project Type: ${userProfile.projectType}
</user_profile>

<requirements>
1. DETECT project characteristics from the raw data (don't assume - analyze file extensions, dependencies, structure)
2. CREATE agents that use advanced prompt engineering:
   - Clear role definitions
   - XML tags for structured thinking
   - Chain-of-thought reasoning when appropriate
   - Specific tool restrictions based on agent purpose
3. DESIGN commands with:
   - Proper YAML frontmatter
   - Argument placeholders ($1, $2, $ARGUMENTS)
   - Tool restrictions appropriate for the command
   - Well-engineered prompts for the detected project type
4. GENERATE hooks for common automation:
   - PostToolUse hooks for linting/formatting after edits
   - Stop hooks for testing after task completion
   - Project-specific hooks based on detected build tools
5. ENSURE all prompts prevent over-engineering and enforce real testing
</requirements>

<thinking>
Before generating the configuration, I need to:
1. Analyze the codebase data to understand what type of project this is
2. Determine appropriate agents based on the technology stack and user experience
3. Design commands that match common workflows for this project type
4. Create hooks that automate repetitive tasks specific to this stack
5. Apply prompt engineering techniques to make all generated prompts effective
</thinking>

<output_format>
Return ONLY valid JSON with this structure:
{
  "projectAnalysis": {
    "detectedTechnologies": ["..."],
    "projectType": "...", 
    "complexity": "simple|medium|complex",
    "buildTools": ["..."],
    "testingSetup": "...",
    "mainLanguages": ["..."]
  },
  "recommendedAgents": [
    {
      "name": "agent-name",
      "description": "Brief description for YAML header",
      "tools": ["Read", "Write", "Edit", "Bash"],
      "systemPrompt": "Expert system prompt using XML tags and clear instructions"
    }
  ],
  "recommendedCommands": [
    {
      "name": "command-name", 
      "description": "Brief description",
      "argumentHint": "[optional arguments]",
      "allowedTools": ["Bash(git add:*)", "Write"],
      "prompt": "Command prompt with $ARGUMENTS placeholders"
    }
  ],
  "recommendedHooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "description": "Auto-format code after edits",
        "command": "detected formatting command"
      }
    ],
    "Stop": [
      {
        "description": "Run tests after task completion",
        "command": "detected test command"
      }
    ]
  },
  "claudeRules": {
    "codingStandards": ["Standards specific to detected languages/frameworks"],
    "architectureGuidelines": ["Guidelines based on project complexity and type"],
    "testingRequirements": ["Real testing requirements for detected test frameworks"],
    "simplicityGuardrails": ["Prevent over-engineering based on project complexity"]
  }
}
</output_format>`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return this.extractJson(text);
  }

  async generateFromIdea(projectIdea: string, userProfile: any): Promise<string> {
    const prompt = `<role>
You are a Claude Code configuration expert and tech stack consultant with expertise in:
- Recommending appropriate technology stacks for different project types
- Creating production-ready development workflows
- Anthropic's prompt engineering best practices
- Preventing over-engineering in new projects
</role>

<task>
Based on the project idea and user profile, recommend an appropriate tech stack and generate a complete Claude Code setup with expertly crafted agents, commands, and hooks.
</task>

<project_idea>
${projectIdea}
</project_idea>

<user_profile>
- Role: ${userProfile.role}
- Experience: ${userProfile.experience}
</user_profile>

<requirements>
1. RECOMMEND a modern, appropriate tech stack for this project idea
2. CONSIDER the user's role and experience level when suggesting complexity
3. CREATE agents with advanced prompt engineering techniques
4. DESIGN commands for common workflows in the recommended stack
5. GENERATE hooks for automation based on the recommended tools
6. ENSURE all recommendations prevent over-engineering for a new project
</requirements>

<thinking>
For this project idea, I need to:
1. Determine what type of application this is (web app, API, CLI tool, etc.)
2. Recommend an appropriate, modern tech stack
3. Consider the user's experience level for complexity decisions
4. Generate agents that help with the recommended technologies
5. Create commands for common workflows in this stack
6. Set up hooks for typical automation needs
</thinking>

<examples>
- For a "task management web app": React/Next.js + TypeScript + Tailwind + Prisma + PostgreSQL
- For a "REST API for mobile app": Node.js + Express + TypeScript + Prisma + PostgreSQL
- For a "data processing tool": Python + pandas + pytest + Docker
</examples>

<output_format>
Return ONLY valid JSON with the same structure as codebase analysis, but include recommended tech stack in projectAnalysis.
</output_format>`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return this.extractJson(text);
  }
}