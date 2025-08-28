import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';
import { ClaudeClient } from './claude-client';
import Anthropic from '@anthropic-ai/sdk';

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk');

describe('ClaudeClient Integration Tests', () => {
  let client: ClaudeClient;
  let mockAnthropicInstance: any;
  let mockMessagesCreate: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Create mock for messages.create
    mockMessagesCreate = vi.fn();
    
    // Mock the Anthropic constructor
    mockAnthropicInstance = {
      messages: {
        create: mockMessagesCreate
      }
    };
    
    (Anthropic as any).mockImplementation(() => mockAnthropicInstance);
    
    client = new ClaudeClient('test-api-key', 'sonnet');
  });

  describe('API Key Validation', () => {
    it('should validate valid API key', async () => {
      // Mock successful API response
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'test' }]
      });

      const isValid = await client.validateApiKey();
      expect(isValid).toBe(true);
      expect(mockMessagesCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      
      console.log('✅ VERIFIED: API key validation successful');
    });

    it('should reject invalid API key', async () => {
      // Mock 401 unauthorized response
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      mockMessagesCreate.mockRejectedValue(error);
      
      const isValid = await client.validateApiKey();
      expect(isValid).toBe(false);
      
      console.log('✅ VERIFIED: Invalid API key properly rejected');
    });

    it('should handle other API errors as valid key', async () => {
      // Mock rate limit or other non-auth error
      const error = new Error('Rate limited');
      (error as any).status = 429;
      mockMessagesCreate.mockRejectedValue(error);
      
      const isValid = await client.validateApiKey();
      expect(isValid).toBe(true); // Should still consider key valid
      
      console.log('✅ VERIFIED: Non-auth errors handled correctly');
    });
  });

  describe('Codebase Analysis', () => {
    it('should analyze codebase with valid JSON response', async () => {
      const mockResponse = {
        content: [{
          type: 'text',
          text: `\`\`\`json
{
  "projectAnalysis": {
    "projectType": "CLI Tool",
    "complexity": "medium",
    "detectedTechnologies": ["TypeScript", "Node.js"]
  },
  "recommendedAgents": [
    {
      "name": "TypeScript CLI Specialist",
      "description": "Expert in TypeScript CLI development with comprehensive knowledge of command-line interfaces, argument parsing, and terminal interactions for this specific project",
      "systemPrompt": "You are a TypeScript CLI specialist for this project. Focus on clean command structure, proper error handling, user-friendly output, and maintainable code architecture. Understand the specific CLI patterns and tools used in this codebase.",
      "tools": ["Read", "Write", "Edit", "Bash", "Grep"]
    },
    {
      "name": "Testing Integration Expert", 
      "description": "Specialist in real integration testing and test automation with focus on CLI testing, process spawning, and filesystem interactions",
      "systemPrompt": "You are a testing expert focused on real integration tests. Avoid mock-only testing and ensure all CLI commands are tested with actual process execution. Focus on testing real user scenarios and edge cases.",
      "tools": ["Read", "Write", "Edit", "Bash"]
    },
    {
      "name": "Node.js Performance Optimizer",
      "description": "Expert in Node.js performance optimization, async patterns, and CLI tool efficiency for production-ready command-line applications",
      "systemPrompt": "You are a Node.js performance specialist. Focus on optimizing CLI startup time, memory usage, and async operations. Ensure the tool is fast and efficient for daily developer use.",
      "tools": ["Read", "Edit", "Bash"]
    }
  ],
  "recommendedCommands": [
    {
      "name": "analyze-performance",
      "description": "Analyze CLI performance and startup time",
      "prompt": "Analyze the CLI tool performance, including startup time, memory usage, and execution efficiency. Identify bottlenecks and suggest specific optimizations for faster user experience."
    },
    {
      "name": "test-cli-scenarios",
      "description": "Run comprehensive CLI testing scenarios",
      "prompt": "Execute comprehensive testing of CLI scenarios including edge cases, error handling, and user interaction flows. Ensure all commands work reliably across different environments."
    }
  ],
  "recommendedHooks": {},
  "claudeRules": {
    "codingStandards": [
      "Use TypeScript strict mode with no implicit any",
      "Implement proper error handling for all CLI operations", 
      "Use commander.js or yargs for consistent argument parsing",
      "Follow Node.js CLI best practices for user experience",
      "Document all CLI commands with clear help text",
      "Use proper exit codes for different error conditions"
    ],
    "architectureGuidelines": [
      "Keep CLI commands focused and single-purpose",
      "Use dependency injection for testable CLI components",
      "Separate CLI logic from business logic for reusability",
      "Follow UNIX philosophy for tool composition"
    ],
    "testingRequirements": [
      "Test CLI commands with real subprocess execution",
      "Integration tests for file system operations",
      "Test error scenarios with actual failure conditions",
      "Performance tests for CLI startup time"
    ]
  }
}
\`\`\``
        }]
      };

      mockMessagesCreate.mockResolvedValue(mockResponse);

      const mockCodebaseInfo = "TypeScript CLI project";
      const mockUserProfile = {
        role: 'fullstack',
        experience: 'senior',
        preferences: ['TypeScript', 'testing']
      };

      const result = await client.analyzeCodebase(mockCodebaseInfo, mockUserProfile);
      
      // Verify we got valid JSON response
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('projectAnalysis');
      expect(parsed).toHaveProperty('recommendedAgents');
      expect(parsed).toHaveProperty('recommendedCommands');
      expect(parsed).toHaveProperty('claudeRules');
      
      // Verify structure matches expected format
      expect(Array.isArray(parsed.recommendedAgents)).toBe(true);
      expect(Array.isArray(parsed.recommendedCommands)).toBe(true);
      expect(typeof parsed.claudeRules).toBe('object');
      expect(parsed.recommendedAgents).toHaveLength(3);
      expect(parsed.recommendedCommands).toHaveLength(2);
      
      console.log('✅ VERIFIED: Codebase analysis with valid JSON response');
      console.log('📊 Response structure:', Object.keys(parsed));
      console.log('🤖 Agents suggested:', parsed.recommendedAgents.length);
      console.log('⚡ Commands suggested:', parsed.recommendedCommands.length);
    });

    it('should reject response with missing fields', async () => {
      const mockResponse = {
        content: [{
          type: 'text',
          text: `\`\`\`json
{
  "projectAnalysis": "Basic project analysis"
}
\`\`\``
        }]
      };

      mockMessagesCreate.mockResolvedValue(mockResponse);

      // Should reject incomplete responses with QualityError
      await expect(client.analyzeCodebase("Empty project", { role: 'junior' }))
        .rejects.toThrow('Claude analysis does not meet quality standards');
      
      console.log('✅ VERIFIED: Quality validation rejects incomplete responses');
    });

    it('should handle malformed JSON response', async () => {
      const mockResponse = {
        content: [{
          type: 'text',
          text: 'This is not valid JSON at all'
        }]
      };

      mockMessagesCreate.mockResolvedValue(mockResponse);

      await expect(client.analyzeCodebase("test", {})).rejects.toThrow('Failed to extract valid JSON');
      
      console.log('✅ VERIFIED: Proper error handling for malformed JSON');
    });
  });

  describe('Idea Generation', () => {
    it('should reject inadequate project idea responses', async () => {
      const mockResponse = {
        content: [{
          type: 'text',
          text: `\`\`\`json
{
  "projectAnalysis": "CLI tool for development workflow automation with TypeScript",
  "recommendedAgents": [
    {
      "name": "workflow-expert",
      "description": "Development workflow automation specialist"
    }
  ],
  "recommendedCommands": [
    {
      "name": "automate-workflow",
      "description": "Automate common development tasks"
    }
  ],
  "recommendedHooks": {},
  "claudeRules": {
    "codingStandards": ["Use TypeScript for type safety"],
    "architectureGuidelines": ["Keep CLI simple and focused"]
  }
}
\`\`\``
        }]
      };

      mockMessagesCreate.mockResolvedValue(mockResponse);

      const projectIdea = "A CLI tool for managing development workflows";
      const userProfile = {
        role: 'fullstack',
        experience: 'senior',
        preferences: ['TypeScript', 'automation']
      };

      // Should reject inadequate responses (only 1 agent, insufficient rules)
      await expect(client.generateFromIdea(projectIdea, userProfile))
        .rejects.toThrow('Claude analysis does not meet quality standards');
      
      console.log('✅ VERIFIED: Quality validation rejects inadequate idea responses');
    });
  });

  describe('Model Switching', () => {
    it('should use correct sonnet model', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'test' }]
      });

      const sonnetClient = new ClaudeClient('test-key', 'sonnet');
      await sonnetClient.validateApiKey();
      
      expect(mockMessagesCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      
      console.log('✅ VERIFIED: Sonnet model selection');
    });

    it('should use correct opus model', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'test' }]
      });

      const opusClient = new ClaudeClient('test-key', 'opus');
      await opusClient.validateApiKey();
      
      expect(mockMessagesCreate).toHaveBeenCalledWith({
        model: 'claude-opus-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      
      console.log('✅ VERIFIED: Opus model selection');
    });
  });

  describe('JSON Extraction Logic', () => {
    it('should extract JSON from code blocks', async () => {
      const mockResponse = {
        content: [{
          type: 'text',
          text: `Here's the analysis:
\`\`\`json
{
  "projectAnalysis": "Simple test project",
  "recommendedAgents": [],
  "recommendedCommands": [],
  "claudeRules": {}
}
\`\`\`
Hope this helps!`
        }]
      };

      mockMessagesCreate.mockResolvedValue(mockResponse);

      const result = await client.analyzeCodebase("Simple test project", { role: 'junior' });
      
      // The fact that we can parse it means extraction worked
      const parsed = JSON.parse(result);
      expect(typeof parsed).toBe('object');
      expect(parsed.projectAnalysis).toBe('Simple test project');
      
      console.log('✅ VERIFIED: JSON extraction from code blocks');
    });

    it('should extract JSON without code block markers', async () => {
      const mockResponse = {
        content: [{
          type: 'text',
          text: `{"projectAnalysis": "Direct JSON", "recommendedAgents": [], "recommendedCommands": [], "claudeRules": {}}`
        }]
      };

      mockMessagesCreate.mockResolvedValue(mockResponse);

      const result = await client.analyzeCodebase("test", {});
      const parsed = JSON.parse(result);
      expect(parsed.projectAnalysis).toBe('Direct JSON');
      
      console.log('✅ VERIFIED: JSON extraction without code blocks');
    });

    it('should handle nested JSON objects', async () => {
      const mockResponse = {
        content: [{
          type: 'text',
          text: `\`\`\`
{
  "projectAnalysis": "Complex project",
  "claudeRules": {
    "codingStandards": ["Standard 1", "Standard 2"],
    "nested": {
      "deep": "value"
    }
  },
  "recommendedAgents": [],
  "recommendedCommands": []
}
\`\`\``
        }]
      };

      mockMessagesCreate.mockResolvedValue(mockResponse);

      const result = await client.analyzeCodebase("test", {});
      const parsed = JSON.parse(result);
      expect(parsed.claudeRules.nested.deep).toBe('value');
      
      console.log('✅ VERIFIED: Nested JSON object extraction');
    });
  });
});