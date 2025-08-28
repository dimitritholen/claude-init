import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

export interface CodebaseInfo {
  packageJson?: any;
  framework: string;
  languages: string[];
  testingFrameworks: string[];
  dependencies: string[];
  devDependencies: string[];
  scripts: string[];
  fileStructure: string[];
  complexity: 'simple' | 'medium' | 'complex';
  hasDocker: boolean;
  hasCI: boolean;
  hasTests: boolean;
}

export class CodebaseAnalyzer {
  private async readFileIfExists(filePath: string): Promise<string | null> {
    try {
      return await readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async getFileStructure(dirPath: string, maxDepth: number = 2, currentDepth: number = 0): Promise<string[]> {
    if (currentDepth >= maxDepth) return [];
    
    try {
      const items = await readdir(dirPath);
      const structure: string[] = [];
      
      for (const item of items) {
        if (item.startsWith('.') && !['src', 'lib', 'app', 'pages', 'components'].includes(item)) continue;
        
        const itemPath = join(dirPath, item);
        const stats = await stat(itemPath);
        
        if (stats.isDirectory()) {
          structure.push(`${item}/`);
          if (currentDepth < maxDepth - 1) {
            const subItems = await this.getFileStructure(itemPath, maxDepth, currentDepth + 1);
            structure.push(...subItems.map(sub => `  ${sub}`));
          }
        } else {
          structure.push(item);
        }
      }
      
      return structure;
    } catch {
      return [];
    }
  }

  private detectFramework(packageJson: any, fileStructure: string[]): string {
    const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
    
    // React frameworks
    if (deps.next) return 'Next.js';
    if (deps.gatsby) return 'Gatsby';
    if (deps.react) return 'React';
    
    // Vue frameworks
    if (deps.nuxt) return 'Nuxt.js';
    if (deps.vue) return 'Vue.js';
    
    // Angular
    if (deps['@angular/core']) return 'Angular';
    
    // Backend frameworks
    if (deps.express) return 'Express.js';
    if (deps.fastify) return 'Fastify';
    if (deps.nestjs) return 'NestJS';
    if (deps.koa) return 'Koa';
    
    // Python frameworks (check file structure)
    if (fileStructure.some(f => f.includes('requirements.txt') || f.includes('pyproject.toml'))) {
      if (fileStructure.some(f => f.includes('manage.py'))) return 'Django';
      if (fileStructure.some(f => f.includes('app.py') || f.includes('main.py'))) return 'Flask/FastAPI';
    }
    
    // Other indicators
    if (packageJson?.scripts?.dev || packageJson?.scripts?.start) return 'Node.js';
    
    return 'Unknown';
  }

  private detectLanguages(fileStructure: string[]): string[] {
    const languages = new Set<string>();
    
    for (const file of fileStructure) {
      const ext = extname(file.toLowerCase());
      switch (ext) {
        case '.ts':
        case '.tsx':
          languages.add('TypeScript');
          break;
        case '.js':
        case '.jsx':
          languages.add('JavaScript');
          break;
        case '.py':
          languages.add('Python');
          break;
        case '.go':
          languages.add('Go');
          break;
        case '.rs':
          languages.add('Rust');
          break;
        case '.java':
          languages.add('Java');
          break;
        case '.php':
          languages.add('PHP');
          break;
        case '.rb':
          languages.add('Ruby');
          break;
      }
    }
    
    return Array.from(languages);
  }

  private detectTestingFrameworks(packageJson: any): string[] {
    const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
    const frameworks: string[] = [];
    
    if (deps.jest) frameworks.push('Jest');
    if (deps.vitest) frameworks.push('Vitest');
    if (deps.mocha) frameworks.push('Mocha');
    if (deps.cypress) frameworks.push('Cypress');
    if (deps.playwright) frameworks.push('Playwright');
    if (deps['@testing-library/react']) frameworks.push('Testing Library');
    if (deps.pytest) frameworks.push('Pytest');
    
    return frameworks;
  }

  private calculateComplexity(fileStructure: string[], packageJson: any): 'simple' | 'medium' | 'complex' {
    const totalFiles = fileStructure.length;
    const deps = Object.keys({ ...packageJson?.dependencies, ...packageJson?.devDependencies }).length;
    
    // Simple indicators
    if (totalFiles < 20 && deps < 15) return 'simple';
    
    // Complex indicators
    if (totalFiles > 100 || deps > 50) return 'complex';
    if (fileStructure.some(f => f.includes('microservices') || f.includes('services/'))) return 'complex';
    if (fileStructure.some(f => f.includes('docker-compose') || f.includes('k8s'))) return 'complex';
    
    return 'medium';
  }

  async analyze(projectPath: string): Promise<CodebaseInfo> {
    const fileStructure = await this.getFileStructure(projectPath);
    
    // Read package.json if exists
    const packageJsonContent = await this.readFileIfExists(join(projectPath, 'package.json'));
    const packageJson = packageJsonContent ? JSON.parse(packageJsonContent) : null;
    
    const framework = this.detectFramework(packageJson, fileStructure);
    const languages = this.detectLanguages(fileStructure);
    const testingFrameworks = this.detectTestingFrameworks(packageJson);
    const complexity = this.calculateComplexity(fileStructure, packageJson);
    
    const hasDocker = await this.fileExists(join(projectPath, 'Dockerfile')) || 
                      await this.fileExists(join(projectPath, 'docker-compose.yml'));
    
    const hasCI = await this.fileExists(join(projectPath, '.github/workflows')) ||
                  await this.fileExists(join(projectPath, '.gitlab-ci.yml')) ||
                  await this.fileExists(join(projectPath, '.travis.yml'));
    
    const hasTests = fileStructure.some(f => 
      f.includes('test') || f.includes('spec') || f.includes('__tests__')
    );

    return {
      packageJson,
      framework,
      languages,
      testingFrameworks,
      dependencies: Object.keys(packageJson?.dependencies || {}),
      devDependencies: Object.keys(packageJson?.devDependencies || {}),
      scripts: Object.keys(packageJson?.scripts || {}),
      fileStructure,
      complexity,
      hasDocker,
      hasCI,
      hasTests
    };
  }

  formatForLLM(analysis: CodebaseInfo): string {
    return `
CODEBASE ANALYSIS:
- Framework: ${analysis.framework}
- Languages: ${analysis.languages.join(', ')}
- Complexity: ${analysis.complexity}
- Testing Frameworks: ${analysis.testingFrameworks.join(', ') || 'None detected'}
- Has Docker: ${analysis.hasDocker}
- Has CI/CD: ${analysis.hasCI}
- Has Tests: ${analysis.hasTests}

DEPENDENCIES (${analysis.dependencies.length}):
${analysis.dependencies.slice(0, 15).join(', ')}${analysis.dependencies.length > 15 ? '...' : ''}

DEV DEPENDENCIES (${analysis.devDependencies.length}):
${analysis.devDependencies.slice(0, 15).join(', ')}${analysis.devDependencies.length > 15 ? '...' : ''}

NPM SCRIPTS:
${analysis.scripts.join(', ')}

FILE STRUCTURE (top-level):
${analysis.fileStructure.slice(0, 30).join('\n')}${analysis.fileStructure.length > 30 ? '\n...' : ''}
    `.trim();
  }
}