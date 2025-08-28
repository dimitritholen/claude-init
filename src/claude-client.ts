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
      let extracted = jsonMatch[1] || jsonMatch[0];
      
      // Clean up common formatting issues
      extracted = extracted.trim();
      
      // Try to validate it's actually JSON
      try {
        JSON.parse(extracted);
        return extracted;
      } catch (error: any) {
        console.log('⚠️  Initial JSON parse failed, attempting repairs...');
        
        // Try to repair common JSON issues
        const repairedJson = this.repairJson(extracted);
        if (repairedJson) {
          try {
            JSON.parse(repairedJson);
            return repairedJson;
          } catch {
            console.log('⚠️  JSON repair failed, trying extraction...');
          }
        }
        
        // If repair fails, try to find just the JSON object part
        const objectMatch = extracted.match(/(\{[\s\S]*?\})/);
        if (objectMatch) {
          try {
            const repaired = this.repairJson(objectMatch[0]);
            if (repaired) {
              JSON.parse(repaired);
              return repaired;
            }
          } catch {
            // Continue to fallback
          }
        }
      }
    }
    
    // Last resort - try to find any JSON-like structure in the text
    const lastResortMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (lastResortMatch) {
      const repaired = this.repairJson(lastResortMatch[0]);
      if (repaired) {
        try {
          JSON.parse(repaired);
          return repaired;
        } catch {
          // Return as-is if repair doesn't work
        }
      }
      return lastResortMatch[0];
    }
    
    return text;
  }

  private repairJson(jsonStr: string): string | null {
    try {
      // Remove trailing commas before closing braces/brackets
      let repaired = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix common quote issues
      repaired = repaired.replace(/'/g, '"'); // Replace single quotes with double quotes
      
      // Fix unquoted keys
      repaired = repaired.replace(/(\w+)(\s*:\s*)/g, '"$1"$2');
      
      // Fix already quoted keys that got double-quoted
      repaired = repaired.replace(/""([^"]+)""/g, '"$1"');
      
      // Remove any trailing commas at the end before closing brace
      repaired = repaired.replace(/,\s*}/g, '}');
      repaired = repaired.replace(/,\s*]/g, ']');
      
      // Find the first complete JSON object
      let braceCount = 0;
      let start = repaired.indexOf('{');
      if (start === -1) return null;
      
      for (let i = start; i < repaired.length; i++) {
        if (repaired[i] === '{') braceCount++;
        if (repaired[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            return repaired.substring(start, i + 1);
          }
        }
      }
      
      return repaired;
    } catch {
      return null;
    }
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
      
      // Try one more intelligent fallback based on the response content
      const fallbackConfig = this.createIntelligentFallback(text);
      if (fallbackConfig) {
        console.warn('⚠️  Using intelligent fallback configuration based on response analysis...');
        return JSON.stringify(fallbackConfig);
      }
      
      throw new Error(`Failed to extract valid JSON from Claude response: ${error}`);
    }
  }

  private createIntelligentFallback(responseText: string): any | null {
    try {
      // Analyze the response to extract useful information even if JSON is malformed
      const analysis: any = {
        projectAnalysis: {
          detectedTechnologies: [],
          projectType: 'unknown',
          complexity: 'medium',
          buildTools: [],
          testingSetup: 'unknown',
          mainLanguages: []
        },
        recommendedAgents: [],
        recommendedCommands: [],
        recommendedHooks: {},
        claudeRules: {
          codingStandards: ['Follow existing code patterns', 'Implement proper error handling'],
          architectureGuidelines: ['Keep solutions simple', 'Use established patterns'],
          testingRequirements: ['Write real integration tests', 'Avoid mock-only testing'],
          simplicityGuardrails: ['Implement only what is required', 'Prefer composition over complexity']
        }
      };

      // Extract project information from the response text
      const text = responseText.toLowerCase();
      
      // Detect technologies
      if (text.includes('python')) {
        analysis.projectAnalysis.detectedTechnologies.push('Python');
        analysis.projectAnalysis.mainLanguages.push('Python');
      }
      if (text.includes('typescript') || text.includes('react')) {
        analysis.projectAnalysis.detectedTechnologies.push('TypeScript');
        analysis.projectAnalysis.mainLanguages.push('TypeScript');
      }
      if (text.includes('react')) analysis.projectAnalysis.detectedTechnologies.push('React');
      if (text.includes('fastapi')) analysis.projectAnalysis.detectedTechnologies.push('FastAPI');
      if (text.includes('django')) analysis.projectAnalysis.detectedTechnologies.push('Django');
      if (text.includes('azure')) analysis.projectAnalysis.detectedTechnologies.push('Azure');
      if (text.includes('docker')) analysis.projectAnalysis.detectedTechnologies.push('Docker');
      if (text.includes('bicep')) analysis.projectAnalysis.detectedTechnologies.push('Azure Bicep');
      if (text.includes('n8n')) analysis.projectAnalysis.detectedTechnologies.push('N8N');

      // Detect project type
      if (text.includes('fullstack') || (text.includes('frontend') && text.includes('backend'))) {
        analysis.projectAnalysis.projectType = 'fullstack-web-app';
      } else if (text.includes('enterprise') || text.includes('microservice')) {
        analysis.projectAnalysis.projectType = 'enterprise-system';
      } else if (text.includes('api')) {
        analysis.projectAnalysis.projectType = 'api-service';
      } else if (text.includes('cli')) {
        analysis.projectAnalysis.projectType = 'cli-tool';
      }

      // Detect complexity
      if (text.includes('complex') || text.includes('enterprise') || text.includes('microservice')) {
        analysis.projectAnalysis.complexity = 'high';
      } else if (text.includes('simple') || text.includes('basic')) {
        analysis.projectAnalysis.complexity = 'low';
      }

      // Detect build tools
      if (text.includes('npm')) analysis.projectAnalysis.buildTools.push('npm');
      if (text.includes('docker')) analysis.projectAnalysis.buildTools.push('docker');
      if (text.includes('azure pipeline')) analysis.projectAnalysis.buildTools.push('Azure Pipelines');
      if (text.includes('pytest')) analysis.projectAnalysis.buildTools.push('pytest');

      // Detect testing issues
      if (text.includes('mock-only') || text.includes('inadequate')) {
        analysis.projectAnalysis.testingSetup = 'mock-only-inadequate';
        analysis.claudeRules.testingRequirements = [
          '🚨 CRITICAL: Mock-only tests are INADEQUATE and HIGH RISK',
          'MANDATORY: Replace mock-only tests with REAL integration tests',
          'All external API calls must have corresponding REAL integration tests',
          'Performance claims require actual measurements, not assumptions'
        ];
      }

      // Add default agents based on detected technologies
      if (analysis.projectAnalysis.detectedTechnologies.includes('Python')) {
        analysis.recommendedAgents.push({
          name: 'Python Backend Specialist',
          description: 'Expert in Python backend development with FastAPI/Django patterns and real testing practices.',
          tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep'],
          systemPrompt: 'You are a Python backend specialist. Focus on clean, testable code with real integration tests.'
        });
      }

      if (analysis.projectAnalysis.detectedTechnologies.includes('TypeScript')) {
        analysis.recommendedAgents.push({
          name: 'TypeScript Frontend Specialist', 
          description: 'Expert in TypeScript and React development with strict typing and component best practices.',
          tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep'],
          systemPrompt: 'You are a TypeScript/React specialist. Enforce strict typing and component-based architecture.'
        });
      }

      return analysis;
      
    } catch (fallbackError) {
      console.error('⚠️  Fallback configuration creation failed:', fallbackError);
      return null;
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