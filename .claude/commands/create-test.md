---
allowed-tools: Read, Write, Edit, Bash(npm:test, npx:*)
argument-hint: [module to test]
description: Create REAL integration tests, not mocks
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
Create REAL integration tests, not mocks
## 🛑 MANDATORY: REAL TESTING ONLY

### BEFORE WRITING ANY TEST:

1. **Chain of Thought Analysis**
   ## Module Analysis
   [What does $ARGUMENTS do? External dependencies?]
   
   ## Testing Strategy
   **Unit Tests**: [What isolated logic needs mocks?]
   **Integration Tests**: [What MUST use real APIs?]
   **E2E Tests**: [What full flows need testing?]
   
   ## YAGNI Check
   [What tests are we NOT writing?]

2. **Required Evidence Plan**
   - How will I capture REAL API responses?
   - How will I verify ACTUAL outputs?
   - What REAL errors will I trigger?

Create comprehensive tests for: $ARGUMENTS

### MANDATORY TEST REQUIREMENTS:
- ✅ Real Anthropic API calls (if applicable)
- ✅ Actual file system operations
- ✅ Real subprocess execution
- ✅ Concrete error scenarios
- ❌ NO mock-only integration tests

### PROOF ARTIFACTS REQUIRED:
- Actual API response examples
- Real terminal output
- Actual error messages
- Performance measurements (if claimed)

Arguments: [module to test]
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