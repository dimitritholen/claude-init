import { describe, it, expect, beforeAll } from 'vitest';
import { ClaudeClient } from './claude-client';

describe('ClaudeClient REAL Integration Tests', () => {
  let client: ClaudeClient;
  let validApiKey: string;

  beforeAll(() => {
    // Test requires real API key - check environment
    validApiKey = process.env.ANTHROPIC_API_KEY || '';
    
    if (!validApiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY not found. Integration tests will be skipped.');
      console.warn('⚠️  To run full tests, set ANTHROPIC_API_KEY environment variable.');
    }
    
    client = new ClaudeClient(validApiKey, 'sonnet');
  });

  describe('Real API Key Validation', () => {
    it('should validate real API key with live endpoint', async () => {
      if (!validApiKey) {
        console.log('🔄 SKIPPED: API key validation (no key provided)');
        return;
      }

      const isValid = await client.validateApiKey();
      expect(isValid).toBe(true);
      
      console.log('✅ VERIFIED: Real API key validation successful');
    }, 30000);

    it('should reject invalid API key with live endpoint', async () => {
      const invalidClient = new ClaudeClient('invalid-key-test-123');
      
      const isValid = await invalidClient.validateApiKey();
      expect(isValid).toBe(false);
      
      console.log('✅ VERIFIED: Invalid API key properly rejected');
    }, 30000);
  });

  describe('Real Codebase Analysis', () => {
    it('should analyze codebase with real API response', async () => {
      if (!validApiKey) {
        console.log('🔄 SKIPPED: Codebase analysis (no key provided)');
        return;
      }

      const mockCodebaseInfo = `
        Project Analysis:
        - Language: TypeScript
        - Framework: Node.js CLI
        - Files: src/index.ts, src/claude-client.ts
        - Dependencies: @anthropic-ai/sdk, commander, chalk
        - Build: tsc
        - Test: none detected
      `;

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
      
      console.log('✅ VERIFIED: Real codebase analysis with valid JSON response');
      console.log('📊 Response structure:', Object.keys(parsed));
      console.log('🤖 Agents suggested:', parsed.recommendedAgents.length);
      console.log('⚡ Commands suggested:', parsed.recommendedCommands.length);
      
    }, 60000);

    it('should handle malformed responses gracefully', async () => {
      if (!validApiKey) {
        console.log('🔄 SKIPPED: Malformed response handling (no key provided)');
        return;
      }

      // Test with minimal input that might produce edge cases
      const minimalInput = "Empty project";
      const userProfile = { role: 'junior', experience: 'beginner' };

      const result = await client.analyzeCodebase(minimalInput, userProfile);
      
      // Should still produce valid JSON with required fields
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('projectAnalysis');
      expect(parsed).toHaveProperty('claudeRules');
      
      console.log('✅ VERIFIED: Graceful handling of minimal input with real API');
      
    }, 30000);
  });

  describe('Real Idea Generation', () => {
    it('should generate from project idea with real API response', async () => {
      if (!validApiKey) {
        console.log('🔄 SKIPPED: Idea generation (no key provided)');
        return;
      }

      const projectIdea = "A CLI tool for managing development workflows";
      const userProfile = {
        role: 'fullstack',
        experience: 'senior',
        preferences: ['TypeScript', 'automation']
      };

      const result = await client.generateFromIdea(projectIdea, userProfile);
      
      // Verify valid JSON with required structure
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('projectAnalysis');
      expect(parsed).toHaveProperty('recommendedAgents');
      expect(parsed).toHaveProperty('recommendedCommands');
      expect(parsed).toHaveProperty('claudeRules');
      
      console.log('✅ VERIFIED: Real project idea generation with valid response');
      console.log('💡 Generated for idea:', projectIdea);
      
    }, 60000);
  });

  describe('Model Switching', () => {
    it('should work with sonnet model', async () => {
      if (!validApiKey) {
        console.log('🔄 SKIPPED: Sonnet model test (no key provided)');
        return;
      }

      const sonnetClient = new ClaudeClient(validApiKey, 'sonnet');
      const isValid = await sonnetClient.validateApiKey();
      expect(isValid).toBe(true);
      
      console.log('✅ VERIFIED: Sonnet model connectivity');
    }, 30000);

    it('should work with opus model', async () => {
      if (!validApiKey) {
        console.log('🔄 SKIPPED: Opus model test (no key provided)');
        return;
      }

      const opusClient = new ClaudeClient(validApiKey, 'opus');
      const isValid = await opusClient.validateApiKey();
      expect(isValid).toBe(true);
      
      console.log('✅ VERIFIED: Opus model connectivity');
    }, 30000);
  });

  describe('JSON Extraction Logic', () => {
    it('should extract JSON from code blocks', async () => {
      if (!validApiKey) {
        console.log('🔄 SKIPPED: JSON extraction test (no key provided)');
        return;
      }

      // Test actual extraction by making a real API call
      const simpleInput = "Simple test project";
      const userProfile = { role: 'junior', experience: 'beginner' };

      const result = await client.analyzeCodebase(simpleInput, userProfile);
      
      // The fact that we can parse it means extraction worked
      const parsed = JSON.parse(result);
      expect(typeof parsed).toBe('object');
      
      console.log('✅ VERIFIED: JSON extraction from real API response');
      
    }, 30000);
  });
});