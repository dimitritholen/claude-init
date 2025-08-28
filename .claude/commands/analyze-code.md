---
allowed-tools: Read, Bash(find:*, ls:*, cat:*)
argument-hint: [file or directory path]
description: Analyze code with mandatory compliance protocols
---

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

<task>
Analyze code with mandatory compliance protocols
## 🛑 MANDATORY COMPLIANCE BEFORE ANALYSIS

### REQUIRED PRE-ANALYSIS:
1. **Chain of Thought**: What am I analyzing? Why? What patterns to look for?
2. **YAGNI Check**: What analysis is actually needed vs nice-to-have?
3. **Evidence Plan**: How will I prove my findings?

Analyze the code at: $ARGUMENTS

### MANDATORY ANALYSIS SECTIONS:

## Current State Analysis
[What exists, structure, dependencies, patterns]

## Testing Assessment
- 🚨 **MOCK-ONLY**: [List any mock-only test files] - **HIGH RISK**
- ❌ **MISSING TESTS**: [List untested critical paths]
- ✅ **REAL TESTS**: [List any actual integration tests found]

## Code Quality Issues
[Concrete issues with file:line references]

## YAGNI Violations
[Over-engineered components that could be simpler]

## Recommendations
[Specific, actionable items - not generic advice]

### FORBIDDEN PHRASES:
- "The code looks good"
- "Well-structured" (without specifics)
- "Should work fine"
- "Appears to be tested" (without verification)

Arguments: [file or directory path]
</task>

## 🚨 VERIFICATION ENFORCEMENT - ABSOLUTE REQUIREMENTS

**FORBIDDEN PHRASES THAT TRIGGER IMMEDIATE VIOLATION**:
- "This should work" 
- "Everything is working"  
- "The feature is complete"
- "Production-ready" (without performance measurements)
- "Memory efficient" (without actual memory testing)
- Any performance claim (speed, memory, throughput) without measurements

### MANDATORY PROOF ARTIFACTS:
- **Real API response logs** (copy-paste actual responses)
- **Actual database query results** (show actual data returned)
- **Live system testing results** (terminal output, screenshots)
- **Real error handling** (show actual error scenarios triggering)
- **Performance measurements** (if making speed/memory claims)

### STATUS REPORTING - ENFORCED LABELS:
- ✅ **VERIFIED**: [Feature] - **Real Evidence**: [Specific proof with examples]
- 🚨 **MOCK-ONLY**: [Feature] - **HIGH RISK**: No real verification performed
- ❌ **INADEQUATE**: [Testing] - Missing real integration testing
- ⛔ **UNSUBSTANTIATED**: [Claim] - No evidence provided for performance/functionality claim

## 🚨 YAGNI ENFORCEMENT - ZERO TOLERANCE

### MANDATORY PRE-CODING CHECKLIST:
- [ ] ✅ Chain of Thought analysis completed (see required format above)
- [ ] ✅ Chain of Draft shown for key components  
- [ ] ✅ YAGNI principle applied (features excluded documented)
- [ ] ✅ Current state analyzed (what exists, dependencies, integration points)
- [ ] ✅ 3+ solution alternatives compared with justification

### DURING IMPLEMENTATION:
- **CONTINUOUS SENIOR REVIEW**: After every significant function/class, STOP and review as senior developer
- **IMMEDIATE REFACTORING**: Fix sub-optimal code the moment you identify it
- **YAGNI ENFORCEMENT**: If you're adding anything not in original requirements, STOP and justify

### CONCRETE EXAMPLES OF VIOLATIONS:
❌ **BAD**: "I'll implement error handling" → starts coding immediately
✅ **GOOD**: Produces Chain of Thought comparing 3 error handling approaches first

❌ **BAD**: Adds caching "because it might be useful" 
✅ **GOOD**: Only implements caching if specifically required

❌ **BAD**: Writes 50 lines then reviews
✅ **GOOD**: Reviews after each 10-15 line function

**MANDATORY WORKFLOW**:
1. **HALT** - Produce Chain of Thought analysis first
2. **ANALYZE** - What exists, what's needed, what's deliberately excluded
3. **DRAFT** - Show evolution of implementation  
4. **IMPLEMENT** - Minimum viable solution only
5. **VERIFY** - Real testing with concrete proof
6. **REPORT** - Use enforced status labels (VERIFIED, MOCK-ONLY, etc.)

**REMEMBER**: Every claim must be backed by real evidence. No "should work" statements allowed.