# Claude Code Configuration

Generated for: fullstack (senior level)
Project: cli-tool (medium complexity)

## Coding Standards

- TypeScript strict mode with no implicit any - compile errors are failures
- Every external API call must have a corresponding REAL integration test
- Mock-only test suites must be labeled INADEQUATE and HIGH RISK
- No abstractions without demonstrable current need (YAGNI)
- Delete code before adding code - simpler is always better
- 10-15 line functions maximum before mandatory refactoring

## Architecture Guidelines  

- CLI tools need minimal architecture - avoid enterprise patterns
- Direct implementations over abstract factories/strategies
- One file per major concern - avoid micro-module proliferation
- Inline simple logic rather than creating utility functions
- No dependency injection for simple CLI tools
- Configuration over code for variability

## Testing Requirements

- 🚨 CRITICAL: Mock-only testing is INADEQUATE for Anthropic SDK integration
- Integration tests MUST make real API calls with actual API keys
- CLI commands must be tested with real subprocess execution
- File operations must be tested against real filesystem
- Every test must include actual output/response verification
- Performance claims require actual benchmark measurements

## Simplicity Guardrails

- STOP and justify before adding any abstraction
- Maximum 3 levels of indirection (caller → function → implementation)
- No future-proofing - solve today's problem only
- Prefer 50 lines of clear code over 20 lines of clever code
- Delete commented code immediately - git preserves history
- Question every interface, abstract class, and generic type

## Verification Standards

- NO feature is 'complete' without real execution evidence
- Every external integration needs actual response logs
- Terminal commands need actual output screenshots/logs
- Performance improvements need before/after measurements
- Error handling must show real error scenarios triggered
- Claims of 'working' require reproducible proof commands

## Compliance Protocols

- ⛔ Chain of Thought analysis is MANDATORY before any implementation
- ⛔ Chain of Draft showing evolution is REQUIRED for key components
- ⛔ All blocking questions MUST be answered before coding
- ⛔ YAGNI check required - document what you're NOT building
- ⛔ Senior review checkpoint every 10-15 lines of code
- ⛔ Forbidden phrases trigger immediate task rejection

## Important Reminders

- **NEVER claim functionality works without concrete real testing proof**
- **ALWAYS flag mock-only test suites as INADEQUATE and HIGH RISK**  
- **HALT before any code** and produce Chain of Thought analysis with 3+ solutions
- **Only implement minimum functionality required** (YAGNI principle)
- **Provide specific evidence** for any performance or functionality claims
- Keep solutions simple and appropriate for the project complexity
- Follow the existing patterns and conventions in this codebase
- Verify your implementations actually work by testing them

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## 🛑 MANDATORY COMPLIANCE PROTOCOL

### FORBIDDEN TO PROCEED WITHOUT:

1. **🧠 MANDATORY CHAIN OF THOUGHT ANALYSIS**
   REQUIRED FORMAT - MUST PRODUCE THIS EXACT STRUCTURE:

   ## Current State Analysis
   [Analyze existing code/system - what exists, what's missing, dependencies]

   ## Problem Breakdown  
   [Break down the task into 2-3 core components]

   ## Solution Alternatives (MINIMUM 3)
   **Solution A**: [Describe approach, pros/cons, complexity]
   **Solution B**: [Describe approach, pros/cons, complexity]  
   **Solution C**: [Describe approach, pros/cons, complexity]

   ## Selected Solution + Justification
   [Choose best option with specific reasoning]

   ## YAGNI Check
   [List features/complexity being deliberately excluded]

2. **📝 MANDATORY CHAIN OF DRAFT**
   REQUIRED: Show evolution of key functions/classes
   
   Draft 1: [Initial rough implementation]
   Draft 2: [Refined version addressing Draft 1 issues] 
   Final:   [Production version with rationale for changes]

3. **⛔ BLOCKING QUESTIONS - ANSWER ALL**
   - What existing code/patterns am I building on?
   - What is the MINIMUM viable implementation?
   - What am I deliberately NOT implementing (YAGNI)?
   - How will I verify this works (real testing plan)?

**YOU ARE FORBIDDEN TO WRITE ANY CODE WITHOUT PRODUCING THE ABOVE ARTIFACTS**
