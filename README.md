# claude-init

Generate personalized Claude Code agents, commands, and rules based on your codebase and experience level.

## Features

- 🎯 **Universal Project Detection**: AI-powered analysis works with ANY language, framework, or infrastructure
- 👤 **Personal Profile**: Tailored to your role (frontend/backend/fullstack/devops) and experience level
- 🤖 **Model Choice**: Choose between Claude Sonnet 4 (fast) or Opus 4 (advanced reasoning)
- 📁 **Three Scenarios**:
  - ✨ New project from idea with tech stack recommendations
  - 📂 Existing codebase analysis (supports all languages/frameworks)
  - 🔄 Update existing Claude setup
- 🧠 **Advanced Prompt Engineering**: Uses Anthropic's best practices (XML tags, chain-of-thought, role definitions)
- 🔗 **Smart Hooks**: Automatically generates project-appropriate automation
- 🛡️ **Smart Guardrails**: Prevents over-engineering and enforces real testing
- 🚀 **Beautiful UX**: Progress tracking with real-time checkmarks

## Installation

```bash
# Install globally
npm install -g claude-init

# Or run directly
npx claude-init
```

## Usage

1. Navigate to your project directory
2. Run `claude-init`
3. Answer a few quick questions
4. Get personalized Claude Code setup!

```bash
cd your-project
claude-init
```

### Environment Setup

Set your Anthropic API key:
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Or the tool will prompt you for it interactively.

## Generated Files

- **`.claude/agents/*.md`** - Specialized agents with proper YAML headers and advanced prompt engineering
- **`.claude/commands/*.md`** - Custom workflow commands with argument handling and tool restrictions
- **`.claude/hooks/config.json`** - Smart automation hooks for your project type
- **`CLAUDE.md`** - Project-specific rules and guardrails tailored to your technology stack

## Examples

### Universal Language Support
- **Python**: Generates pytest agents, virtual env commands, PEP 8 enforcement
- **Go**: Creates testing agents, module commands, gofmt hooks  
- **Rust**: Cargo-focused agents, clippy hooks, performance testing commands
- **Java**: Maven/Gradle agents, Spring Boot commands, JUnit hooks
- **Any Framework**: AI detects and adapts to YOUR specific stack

### Intelligent Project Detection
- **Monorepos**: Detects multiple package.json files, generates workspace-aware commands
- **Full-stack**: Separate frontend/backend agents with appropriate tool restrictions
- **Legacy Code**: Adapts to existing patterns without assumptions
- **Custom Frameworks**: Works with proprietary or unusual technology stacks

## Keyboard Shortcuts

- **Q** - Quit at any time
- **Ctrl+C** - Force quit

## Model Options

- **Sonnet 4** (`claude-sonnet-4-20250514`) - Fast and efficient
- **Opus 4** (`claude-opus-4-20250514`) - Advanced reasoning for complex projects

## Development

```bash
git clone <repo>
cd claude-init
npm install
npm run dev    # Run in development mode
npm run build  # Build TypeScript
```