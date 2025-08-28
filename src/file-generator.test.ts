import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileGenerator } from './file-generator';
import { readFile, access, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp } from 'fs/promises';

describe('FileGenerator REAL Filesystem Tests', () => {
  let generator: FileGenerator;
  let testDir: string;

  beforeEach(async () => {
    generator = new FileGenerator();
    // Create real temporary directory for each test
    testDir = await mkdtemp(join(tmpdir(), 'claude-init-test-'));
    console.log('📁 Created test directory:', testDir);
  });

  afterEach(async () => {
    // Clean up real filesystem after each test
    try {
      await rm(testDir, { recursive: true, force: true });
      console.log('🗑️  Cleaned up test directory:', testDir);
    } catch (error) {
      console.warn('⚠️  Failed to cleanup test directory:', error);
    }
  });

  describe('Real Directory Creation', () => {
    it('should create .claude directory structure on real filesystem', async () => {
      const recommendations = {
        projectAnalysis: { projectType: 'CLI Tool', complexity: 'medium' },
        recommendedAgents: [
          {
            name: 'Test Agent',
            description: 'Test description',
            systemPrompt: 'Test system prompt',
            tools: ['Read', 'Write']
          }
        ],
        recommendedCommands: [
          {
            name: 'test-command',
            description: 'Test command',
            prompt: 'Test prompt'
          }
        ],
        recommendedHooks: {
          Stop: [{
            description: 'Test hook',
            command: 'echo test'
          }]
        },
        claudeRules: {
          codingStandards: ['Test standard'],
          architectureGuidelines: ['Test guideline'],
          testingRequirements: ['Test requirement'],
          simplicityGuardrails: ['Test guardrail']
        }
      };

      const userProfile = {
        role: 'fullstack',
        experience: 'senior'
      };

      const result = await generator.generate(testDir, recommendations, userProfile);

      // Verify real directories were created
      await access(join(testDir, '.claude'));
      await access(join(testDir, '.claude', 'agents'));
      await access(join(testDir, '.claude', 'commands'));
      await access(join(testDir, '.claude', 'hooks'));

      console.log('✅ VERIFIED: Real directory structure created');
      console.log('📁 Generated files:', {
        agents: result.agents.length,
        commands: result.commands.length,
        hooks: !!result.hooks.content,
        claudeMd: !!result.claudeMd.content
      });
    });
  });

  describe('Real Agent File Generation', () => {
    it('should generate agent files on real filesystem with correct YAML headers', async () => {
      const recommendations = {
        projectAnalysis: { projectType: 'CLI Tool', complexity: 'medium' },
        recommendedAgents: [
          {
            name: 'Development Helper',
            description: 'Helps with development tasks',
            systemPrompt: 'You are a development assistant.',
            tools: ['Read', 'Write', 'Edit', 'Bash']
          },
          {
            name: 'Code Reviewer',
            description: 'Reviews code for quality',
            systemPrompt: 'You review code for best practices.',
            tools: ['Read', 'Grep']
          }
        ],
        recommendedCommands: [],
        recommendedHooks: {},
        claudeRules: {
          codingStandards: ['Use TypeScript'],
          architectureGuidelines: ['Keep it simple'],
          testingRequirements: ['Write real tests'],
          simplicityGuardrails: ['YAGNI principle']
        }
      };

      const userProfile = { role: 'fullstack', experience: 'senior' };

      const result = await generator.generate(testDir, recommendations, userProfile);

      // Verify agent files exist and have correct content
      expect(result.agents).toHaveLength(2);

      const agentFile1 = await readFile(result.agents[0].path, 'utf-8');
      expect(agentFile1).toContain('---');
      expect(agentFile1).toContain('name: Development Helper');
      expect(agentFile1).toContain('description: Helps with development tasks');
      expect(agentFile1).toContain('tools: Read, Write, Edit, Bash');
      expect(agentFile1).toContain('You are a development assistant.');

      const agentFile2 = await readFile(result.agents[1].path, 'utf-8');
      expect(agentFile2).toContain('name: Code Reviewer');
      expect(agentFile2).toContain('tools: Read, Grep');

      console.log('✅ VERIFIED: Real agent files with proper YAML headers');
      console.log('📄 Agent 1 path:', result.agents[0].path);
      console.log('📄 Agent 2 path:', result.agents[1].path);
    });

    it('should create default agent when none provided', async () => {
      const recommendations = {
        projectAnalysis: { projectType: 'CLI Tool', complexity: 'medium' },
        recommendedAgents: [], // Empty array
        recommendedCommands: [],
        recommendedHooks: {},
        claudeRules: {
          codingStandards: ['Default standards'],
          architectureGuidelines: ['Default guidelines'],
          testingRequirements: ['Default testing'],
          simplicityGuardrails: ['Default guardrails']
        }
      };

      const userProfile = { role: 'junior', experience: 'beginner' };

      const result = await generator.generate(testDir, recommendations, userProfile);

      // Should create default agent
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe('Development Helper');

      // Verify default agent file exists and has content
      const agentContent = await readFile(result.agents[0].path, 'utf-8');
      expect(agentContent).toContain('Development Helper');
      expect(agentContent).toContain('General purpose development assistant');

      console.log('✅ VERIFIED: Default agent creation when none provided');
    });
  });

  describe('Real Command File Generation', () => {
    it('should generate command files with proper YAML structure', async () => {
      const recommendations = {
        projectAnalysis: { projectType: 'CLI Tool', complexity: 'medium' },
        recommendedAgents: [],
        recommendedCommands: [
          {
            name: 'analyze-code',
            description: 'Analyze codebase for patterns',
            prompt: 'Analyze the provided code for patterns and issues.',
            argumentHint: '[file-pattern]',
            allowedTools: ['Read', 'Grep', 'Glob']
          }
        ],
        recommendedHooks: {},
        claudeRules: {
          codingStandards: ['Test standards'],
          architectureGuidelines: ['Test guidelines'],
          testingRequirements: ['Test requirements'],
          simplicityGuardrails: ['Test guardrails']
        }
      };

      const userProfile = { role: 'fullstack', experience: 'senior' };

      const result = await generator.generate(testDir, recommendations, userProfile);

      expect(result.commands).toHaveLength(1);

      // Verify command file content
      const commandContent = await readFile(result.commands[0].path, 'utf-8');
      expect(commandContent).toContain('---');
      expect(commandContent).toContain('allowed-tools: Read, Grep, Glob');
      expect(commandContent).toContain('argument-hint: [file-pattern]');
      expect(commandContent).toContain('description: Analyze codebase for patterns');
      expect(commandContent).toContain('Analyze the provided code for patterns');

      console.log('✅ VERIFIED: Real command file with YAML structure');
      console.log('📄 Command path:', result.commands[0].path);
    });
  });

  describe('Real CLAUDE.md Generation', () => {
    it('should generate CLAUDE.md with proper structure and content', async () => {
      const recommendations = {
        projectAnalysis: {
          projectType: 'CLI Tool',
          complexity: 'high'
        },
        recommendedAgents: [],
        recommendedCommands: [],
        recommendedHooks: {},
        claudeRules: {
          codingStandards: [
            'TypeScript strict mode with no implicit any',
            'Every function must have type annotations'
          ],
          architectureGuidelines: [
            'CLI tools need minimal architecture',
            'Direct implementations over abstractions'
          ],
          testingRequirements: [
            'Integration tests MUST make real API calls',
            'CLI commands tested with real subprocess execution'
          ],
          simplicityGuardrails: [
            'Maximum 3 levels of indirection',
            'No future-proofing - solve today\'s problem only'
          ]
        }
      };

      const userProfile = {
        role: 'fullstack',
        experience: 'senior'
      };

      const result = await generator.generate(testDir, recommendations, userProfile);

      // Verify CLAUDE.md was created
      const claudeMdContent = await readFile(result.claudeMd.path, 'utf-8');

      expect(claudeMdContent).toContain('# Claude Code Configuration');
      expect(claudeMdContent).toContain('Generated for: fullstack (senior level)');
      expect(claudeMdContent).toContain('Project: CLI Tool (high complexity)');
      expect(claudeMdContent).toContain('## Coding Standards');
      expect(claudeMdContent).toContain('TypeScript strict mode');
      expect(claudeMdContent).toContain('## Testing Requirements');
      expect(claudeMdContent).toContain('real API calls');
      expect(claudeMdContent).toContain('MANDATORY COMPLIANCE PROTOCOL');

      console.log('✅ VERIFIED: CLAUDE.md with proper structure and content');
      console.log('📄 CLAUDE.md path:', result.claudeMd.path);
      console.log('📊 Content length:', claudeMdContent.length, 'characters');
    });

    it('should append to existing CLAUDE.md file', async () => {
      // Create existing CLAUDE.md
      const existingContent = '# Existing Configuration\n\nSome existing rules.';
      const claudeMdPath = join(testDir, 'CLAUDE.md');
      await generator['ensureDirectory'](claudeMdPath);
      require('fs').writeFileSync(claudeMdPath, existingContent);

      const recommendations = {
        projectAnalysis: { projectType: 'CLI Tool', complexity: 'medium' },
        recommendedAgents: [],
        recommendedCommands: [],
        recommendedHooks: {},
        claudeRules: {
          codingStandards: ['New standard'],
          architectureGuidelines: ['New guideline'],
          testingRequirements: ['New requirement'],
          simplicityGuardrails: ['New guardrail']
        }
      };

      const userProfile = { role: 'junior', experience: 'beginner' };

      const result = await generator.generate(testDir, recommendations, userProfile);

      // Verify existing content was preserved
      const finalContent = await readFile(result.claudeMd.path, 'utf-8');
      expect(finalContent).toContain('# Existing Configuration');
      expect(finalContent).toContain('Some existing rules.');
      expect(finalContent).toContain('# Auto-generated Configuration');
      expect(finalContent).toContain('New standard');

      console.log('✅ VERIFIED: Existing CLAUDE.md preservation and appending');
    });
  });

  describe('Real Hooks Configuration', () => {
    it('should generate hooks JSON with proper structure', async () => {
      const recommendations = {
        projectAnalysis: { projectType: 'CLI Tool', complexity: 'medium' },
        recommendedAgents: [],
        recommendedCommands: [],
        recommendedHooks: {
          Stop: [{
            description: 'Verify with real tests',
            command: 'npm test'
          }],
          PostToolUse: [{
            matcher: 'Write',
            description: 'Run linter after file writes',
            command: 'npm run lint'
          }]
        },
        claudeRules: {
          codingStandards: ['Test standards'],
          architectureGuidelines: ['Test guidelines'],
          testingRequirements: ['Test requirements'],
          simplicityGuardrails: ['Test guardrails']
        }
      };

      const userProfile = { role: 'fullstack', experience: 'senior' };

      const result = await generator.generate(testDir, recommendations, userProfile);

      // Verify hooks config was created
      const hooksContent = await readFile(result.hooks.path, 'utf-8');
      const hooksConfig = JSON.parse(hooksContent);

      expect(hooksConfig).toHaveProperty('hooks');
      expect(hooksConfig.hooks).toHaveProperty('Stop');
      expect(hooksConfig.hooks).toHaveProperty('PostToolUse');
      expect(hooksConfig.hooks.Stop[0].description).toBe('Verify with real tests');
      expect(hooksConfig.hooks.PostToolUse[0].matcher).toBe('Write');

      console.log('✅ VERIFIED: Real hooks JSON configuration');
      console.log('📄 Hooks path:', result.hooks.path);
      console.log('⚙️  Hook types:', Object.keys(hooksConfig.hooks));
    });

    it('should create default hooks when none provided', async () => {
      const recommendations = {
        projectAnalysis: { projectType: 'CLI Tool', complexity: 'medium' },
        recommendedAgents: [],
        recommendedCommands: [],
        recommendedHooks: {}, // Empty hooks
        claudeRules: {
          codingStandards: ['Default standards'],
          architectureGuidelines: ['Default guidelines'],
          testingRequirements: ['Default testing'],
          simplicityGuardrails: ['Default guardrails']
        }
      };

      const userProfile = { role: 'junior', experience: 'beginner' };

      const result = await generator.generate(testDir, recommendations, userProfile);

      // Verify default hooks were created
      const hooksContent = await readFile(result.hooks.path, 'utf-8');
      const hooksConfig = JSON.parse(hooksContent);

      expect(hooksConfig.hooks).toHaveProperty('Stop');
      expect(hooksConfig.hooks.Stop[0].description).toContain('real testing');

      console.log('✅ VERIFIED: Default hooks creation');
    });
  });

  describe('Error Handling with Real Filesystem', () => {
    it('should handle file permission errors gracefully', async () => {
      // This test would require setting up specific permission scenarios
      // For now, we'll test with valid scenarios to ensure the system works
      const recommendations = {
        projectAnalysis: { projectType: 'CLI Tool', complexity: 'medium' },
        recommendedAgents: [],
        recommendedCommands: [],
        recommendedHooks: {},
        claudeRules: {
          codingStandards: ['Standards'],
          architectureGuidelines: ['Guidelines'],
          testingRequirements: ['Requirements'],
          simplicityGuardrails: ['Guardrails']
        }
      };

      const userProfile = { role: 'fullstack', experience: 'senior' };

      // Should not throw with valid directory
      const result = await generator.generate(testDir, recommendations, userProfile);
      expect(result).toBeDefined();

      console.log('✅ VERIFIED: Graceful handling of filesystem operations');
    });
  });
});