import Anthropic from '@anthropic-ai/sdk';
import { createCodebaseAnalysisPrompt, createIdeaGenerationPrompt } from './prompt-templates';

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
      const extracted = jsonMatch[1] || jsonMatch[0];
      // Try to validate it's actually JSON
      try {
        JSON.parse(extracted);
        return extracted;
      } catch {
        // If it's not valid JSON, try to find just the JSON object part
        const objectMatch = extracted.match(/(\{[\s\S]*?\})/);
        if (objectMatch) {
          return objectMatch[0];
        }
      }
    }
    
    // Last resort - try to find any JSON-like structure in the text
    const lastResortMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (lastResortMatch) {
      return lastResortMatch[0];
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
    const prompt = createCodebaseAnalysisPrompt(userProfile, codebaseInfo);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 6000, // Increased for complex responses
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const extracted = this.extractJson(text);
    
    // Validate extracted JSON before returning
    try {
      const parsed = JSON.parse(extracted);
      
      // Validate required structure
      const requiredFields = ['projectAnalysis', 'recommendedAgents', 'recommendedCommands', 'claudeRules'];
      const missingFields = requiredFields.filter(field => !parsed.hasOwnProperty(field));
      
      if (missingFields.length > 0) {
        console.warn(`⚠️  Missing fields in Claude response: ${missingFields.join(', ')}`);
        console.warn('Response structure:', Object.keys(parsed));
        
        // Add minimal default structure for missing fields
        if (!parsed.recommendedAgents) parsed.recommendedAgents = [];
        if (!parsed.recommendedCommands) parsed.recommendedCommands = [];
        if (!parsed.recommendedHooks) parsed.recommendedHooks = {};
        if (!parsed.claudeRules) {
          parsed.claudeRules = {
            codingStandards: ['Follow existing code patterns'],
            architectureGuidelines: ['Keep solutions simple'],
            testingRequirements: ['Write real tests, not just mocks'],
            simplicityGuardrails: ['Implement only what is required']
          };
        }
        
        return JSON.stringify(parsed);
      }
      
      return extracted;
    } catch (error) {
      console.error('❌ Raw response from Claude:', text.substring(0, 800) + '...');
      console.error('❌ Extracted JSON attempt:', extracted.substring(0, 400) + '...');
      console.error('❌ JSON Parse Error:', error);
      throw new Error(`Failed to extract valid JSON from Claude response: ${error}`);
    }
  }

  async generateFromIdea(projectIdea: string, userProfile: any): Promise<string> {
    const prompt = createIdeaGenerationPrompt(projectIdea, userProfile);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 6000, // Increased for complex responses
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const extracted = this.extractJson(text);
    
    // Validate extracted JSON before returning
    try {
      const parsed = JSON.parse(extracted);
      
      // Validate required structure
      const requiredFields = ['projectAnalysis', 'recommendedAgents', 'recommendedCommands', 'claudeRules'];
      const missingFields = requiredFields.filter(field => !parsed.hasOwnProperty(field));
      
      if (missingFields.length > 0) {
        console.warn(`⚠️  Missing fields in Claude response: ${missingFields.join(', ')}`);
        console.warn('Response structure:', Object.keys(parsed));
        
        // Add minimal default structure for missing fields
        if (!parsed.recommendedAgents) parsed.recommendedAgents = [];
        if (!parsed.recommendedCommands) parsed.recommendedCommands = [];
        if (!parsed.recommendedHooks) parsed.recommendedHooks = {};
        if (!parsed.claudeRules) {
          parsed.claudeRules = {
            codingStandards: ['Follow existing code patterns'],
            architectureGuidelines: ['Keep solutions simple'],
            testingRequirements: ['Write real tests, not just mocks'],
            simplicityGuardrails: ['Implement only what is required']
          };
        }
        
        return JSON.stringify(parsed);
      }
      
      return extracted;
    } catch (error) {
      console.error('❌ Raw response from Claude:', text.substring(0, 800) + '...');
      console.error('❌ Extracted JSON attempt:', extracted.substring(0, 400) + '...');
      console.error('❌ JSON Parse Error:', error);
      throw new Error(`Failed to extract valid JSON from Claude response: ${error}`);
    }
  }
}