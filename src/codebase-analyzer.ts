import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

export interface CodebaseInfo {
  fileStructure: string[];
  fileExtensions: string[];
  configFiles: string[];
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
  scripts: { [key: string]: string };
  packageJsons: any[];
  rootConfigFiles: string[];
  totalFiles: number;
  maxDepthReached: number;
  specialDirectories: string[];
  buildFiles: string[];
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
        // Skip common build/cache directories but include important dot files
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build' || 
            item === 'target' || item === '__pycache__' || item === '.pytest_cache' ||
            item === '.next' || item === '.nuxt' || item === 'coverage') continue;
        
        // Include important hidden directories
        if (item.startsWith('.') && ![
          '.github', '.gitlab', '.vscode', '.idea', '.env', '.docker', '.k8s', '.aws', '.azure'
        ].some(important => item.startsWith(important))) continue;
        
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

  private getFileExtensions(fileStructure: string[]): string[] {
    const extensions = new Set<string>();
    for (const file of fileStructure) {
      const ext = extname(file.toLowerCase());
      if (ext) extensions.add(ext);
    }
    return Array.from(extensions).sort();
  }

  private getConfigFiles(fileStructure: string[]): string[] {
    const configPatterns = [
      // Web configs
      'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'webpack.config.js', 'vite.config.js', 'rollup.config.js',
      'next.config.js', 'nuxt.config.js', 'vue.config.js',
      'tsconfig.json', 'jsconfig.json', 'babel.config.js', '.babelrc',
      'eslint.config.js', '.eslintrc', '.prettierrc', 'tailwind.config.js',
      
      // Python configs
      'requirements.txt', 'pyproject.toml', 'setup.py', 'setup.cfg',
      'Pipfile', 'poetry.lock', 'conda.yml', 'environment.yml',
      'manage.py', 'wsgi.py', 'asgi.py', 'settings.py',
      
      // Go configs
      'go.mod', 'go.sum', 'Gopkg.toml', 'Gopkg.lock',
      
      // Rust configs
      'Cargo.toml', 'Cargo.lock',
      
      // Java configs
      'pom.xml', 'build.gradle', 'gradle.properties', 'gradlew',
      'mvnw', 'settings.gradle', 'build.xml',
      
      // Infrastructure
      'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
      'k8s.yml', 'kubernetes.yml', '.dockerignore',
      'terraform.tf', '*.terraform', 'Vagrantfile',
      
      // CI/CD
      '.github', '.gitlab-ci.yml', '.travis.yml', 'Jenkinsfile',
      'azure-pipelines.yml', '.circleci', 'buildkite.yml',
      
      // Other
      'Makefile', 'CMakeLists.txt', 'configure', 'autogen.sh',
      '.env', '.env.example', '.env.local', '.gitignore', '.gitattributes'
    ];
    
    return fileStructure.filter(file => 
      configPatterns.some(pattern => 
        file.toLowerCase().includes(pattern.toLowerCase()) ||
        file.endsWith(pattern) ||
        basename(file.toLowerCase()) === pattern.toLowerCase()
      )
    );
  }

  private getSpecialDirectories(fileStructure: string[]): string[] {
    const specialDirs = [
      'src/', 'lib/', 'app/', 'components/', 'pages/', 'public/', 'static/',
      'assets/', 'styles/', 'css/', 'scss/', 'less/', 'images/', 'img/',
      'test/', 'tests/', '__tests__/', 'spec/', '__specs__/', 'e2e/',
      'docs/', 'documentation/', 'examples/', 'demo/', 'samples/',
      'config/', 'configs/', 'settings/', 'env/', 'environments/',
      'build/', 'dist/', 'out/', 'target/', 'bin/', 'obj/', 'release/',
      'node_modules/', 'vendor/', 'packages/', 'deps/', 'third_party/',
      'migrations/', 'seeds/', 'fixtures/', 'data/', 'db/', 'database/',
      'server/', 'client/', 'frontend/', 'backend/', 'api/', 'services/',
      'models/', 'views/', 'controllers/', 'middleware/', 'routes/',
      'utils/', 'helpers/', 'shared/', 'common/', 'core/', 'base/',
      'types/', 'interfaces/', 'constants/', 'enums/', 'hooks/',
      'context/', 'providers/', 'store/', 'state/', 'reducers/', 'actions/'
    ];
    
    return fileStructure.filter(item => 
      item.endsWith('/') && specialDirs.includes(item)
    );
  }

  private getBuildFiles(fileStructure: string[]): string[] {
    const buildPatterns = [
      'Makefile', 'makefile', 'GNUmakefile',
      'build.sh', 'build.bat', 'build.ps1', 'build.py',
      'gulpfile.js', 'gruntfile.js', 'webpack.config.js',
      'rollup.config.js', 'vite.config.js', 'esbuild.config.js',
      'turbo.json', 'nx.json', 'lerna.json', 'rush.json',
      'CMakeLists.txt', 'configure', 'configure.ac', 'autogen.sh',
      'sbt', 'build.sbt', 'project/', 'target/'
    ];
    
    return fileStructure.filter(file => 
      buildPatterns.some(pattern => 
        file.toLowerCase().includes(pattern.toLowerCase()) ||
        basename(file.toLowerCase()) === pattern.toLowerCase()
      )
    );
  }

  async analyze(projectPath: string): Promise<CodebaseInfo> {
    const fileStructure = await this.getFileStructure(projectPath, 3); // Deeper scan
    
    // Collect all package.json files (for monorepos)
    const packageJsons: any[] = [];
    const mainPackageJson = await this.readFileIfExists(join(projectPath, 'package.json'));
    if (mainPackageJson) {
      packageJsons.push({ path: 'package.json', content: JSON.parse(mainPackageJson) });
    }
    
    // Look for other package.json files in subdirectories
    for (const file of fileStructure) {
      if (file.includes('package.json') && file !== 'package.json') {
        const content = await this.readFileIfExists(join(projectPath, file.replace(/\s+/g, '')));
        if (content) {
          try {
            packageJsons.push({ path: file, content: JSON.parse(content) });
          } catch {
            // Invalid JSON, skip
          }
        }
      }
    }
    
    const mainPkg = packageJsons.find(p => p.path === 'package.json')?.content;
    
    return {
      fileStructure,
      fileExtensions: this.getFileExtensions(fileStructure),
      configFiles: this.getConfigFiles(fileStructure),
      dependencies: mainPkg?.dependencies || {},
      devDependencies: mainPkg?.devDependencies || {},
      scripts: mainPkg?.scripts || {},
      packageJsons,
      rootConfigFiles: await this.getRootConfigFiles(projectPath),
      totalFiles: fileStructure.length,
      maxDepthReached: 3,
      specialDirectories: this.getSpecialDirectories(fileStructure),
      buildFiles: this.getBuildFiles(fileStructure)
    };
  }

  private async getRootConfigFiles(projectPath: string): Promise<string[]> {
    const commonConfigFiles = [
      '.gitignore', '.gitattributes', '.editorconfig', '.npmrc', '.nvmrc',
      'README.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md',
      '.env', '.env.example', '.env.local', '.env.production',
      'docker-compose.yml', 'Dockerfile', '.dockerignore',
      'Makefile', 'makefile', 'justfile'
    ];
    
    const existingFiles = [];
    for (const file of commonConfigFiles) {
      if (await this.fileExists(join(projectPath, file))) {
        existingFiles.push(file);
      }
    }
    
    return existingFiles;
  }
  
  formatForLLM(analysis: CodebaseInfo): string {
    const deps = Object.keys(analysis.dependencies);
    const devDeps = Object.keys(analysis.devDependencies);
    const scripts = Object.keys(analysis.scripts);
    
    return `
<codebase_data>
<file_structure total_files="${analysis.totalFiles}">
${analysis.fileStructure.slice(0, 50).join('\n')}${analysis.fileStructure.length > 50 ? '\n... and ' + (analysis.fileStructure.length - 50) + ' more files' : ''}
</file_structure>

<file_extensions>
${analysis.fileExtensions.join(', ')}
</file_extensions>

<special_directories>
${analysis.specialDirectories.join('\n')}
</special_directories>

<config_files>
${analysis.configFiles.join('\n')}
</config_files>

<root_config_files>
${analysis.rootConfigFiles.join('\n')}
</root_config_files>

<build_files>
${analysis.buildFiles.join('\n')}
</build_files>

<dependencies count="${deps.length}">
${deps.slice(0, 20).join(', ')}${deps.length > 20 ? '\n... and ' + (deps.length - 20) + ' more' : ''}
</dependencies>

<dev_dependencies count="${devDeps.length}">
${devDeps.slice(0, 20).join(', ')}${devDeps.length > 20 ? '\n... and ' + (devDeps.length - 20) + ' more' : ''}
</dev_dependencies>

<npm_scripts>
${scripts.map(s => `${s}: ${analysis.scripts[s]}`).join('\n')}
</npm_scripts>

<package_json_files>
${analysis.packageJsons.map(p => p.path).join('\n')}
</package_json_files>
</codebase_data>
    `.trim();
  }
}