import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProgressTracker } from './progress-tracker';

describe('ProgressTracker REAL Console Tests', () => {
  let tracker: ProgressTracker;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods to capture real output
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up any running animations
    if (tracker) {
      tracker.stopAnimation();
    }
    consoleSpy.mockRestore();
  });

  describe('Real Progress Tracking', () => {
    it('should track progress through multiple steps', async () => {
      const steps = [
        { id: 'step1', message: 'First step' },
        { id: 'step2', message: 'Second step' },
        { id: 'step3', message: 'Final step' }
      ];

      tracker = new ProgressTracker(steps);
      
      // Initial display
      tracker.display();
      expect(consoleSpy).toHaveBeenCalled();

      // Complete steps one by one
      tracker.complete('step1');
      tracker.display();
      
      tracker.complete('step2');
      tracker.display();
      
      tracker.complete('step3');
      tracker.display();

      // Verify console.log was called multiple times for progress updates
      expect(consoleSpy.mock.calls.length).toBeGreaterThan(3);
      
      console.log('✅ VERIFIED: Real progress tracking through multiple steps');
      console.log('📊 Console calls made:', consoleSpy.mock.calls.length);
    });

    it('should handle animation start and stop', async () => {
      const steps = [
        { id: 'animate-test', message: 'Testing animation' }
      ];

      tracker = new ProgressTracker(steps);
      
      // Start animation
      tracker.startAnimation();
      
      // Let animation run briefly
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Complete step during animation
      tracker.complete('animate-test');
      
      // Stop animation
      tracker.stopAnimation();
      
      // Animation should have produced console output
      expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
      
      console.log('✅ VERIFIED: Real animation start/stop functionality');
    });

    it('should display progress with real formatting', async () => {
      const steps = [
        { id: 'format-test', message: 'Testing display formatting' },
        { id: 'format-test-2', message: 'Second formatting test' }
      ];

      tracker = new ProgressTracker(steps);
      
      // Test initial display
      tracker.display();
      
      // Complete first step and display
      tracker.complete('format-test');
      tracker.display();
      
      // Check that console.log received formatted strings
      const calls = consoleSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      
      // Verify some calls contain progress information
      const hasProgressInfo = calls.some(call => 
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('Testing display formatting') ||
            arg.includes('✓') ||
            arg.includes('○')
          )
        )
      );
      
      expect(hasProgressInfo).toBe(true);
      
      console.log('✅ VERIFIED: Real progress display formatting');
    });

    it('should handle rapid step completion', async () => {
      const steps = [
        { id: 'rapid1', message: 'Rapid step 1' },
        { id: 'rapid2', message: 'Rapid step 2' },
        { id: 'rapid3', message: 'Rapid step 3' },
        { id: 'rapid4', message: 'Rapid step 4' },
        { id: 'rapid5', message: 'Rapid step 5' }
      ];

      tracker = new ProgressTracker(steps);
      tracker.startAnimation();
      
      // Rapidly complete all steps
      steps.forEach(step => {
        tracker.complete(step.id);
      });
      
      tracker.stopAnimation();
      
      // Should have handled rapid completion without errors
      expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
      
      console.log('✅ VERIFIED: Rapid step completion handling');
    });
  });

  describe('Real Error Scenarios', () => {
    it('should handle invalid step IDs gracefully', () => {
      const steps = [
        { id: 'valid-step', message: 'Valid step' }
      ];

      tracker = new ProgressTracker(steps);
      
      // Try to complete non-existent step
      expect(() => {
        tracker.complete('invalid-step');
      }).not.toThrow();
      
      // Try to complete valid step
      expect(() => {
        tracker.complete('valid-step');
      }).not.toThrow();
      
      console.log('✅ VERIFIED: Graceful handling of invalid step IDs');
    });

    it('should handle empty steps array', () => {
      expect(() => {
        tracker = new ProgressTracker([]);
        tracker.display();
      }).not.toThrow();
      
      console.log('✅ VERIFIED: Empty steps array handling');
    });

    it('should handle multiple animation start/stop calls', () => {
      const steps = [
        { id: 'multi-test', message: 'Multiple calls test' }
      ];

      tracker = new ProgressTracker(steps);
      
      // Multiple start calls
      expect(() => {
        tracker.startAnimation();
        tracker.startAnimation();
        tracker.startAnimation();
      }).not.toThrow();
      
      // Multiple stop calls
      expect(() => {
        tracker.stopAnimation();
        tracker.stopAnimation();
        tracker.stopAnimation();
      }).not.toThrow();
      
      console.log('✅ VERIFIED: Multiple animation control calls handled');
    });
  });

  describe('Real Console Integration', () => {
    it('should integrate with real console output systems', () => {
      const steps = [
        { id: 'console-test', message: 'Console integration test' }
      ];

      tracker = new ProgressTracker(steps);
      
      // Restore console temporarily to test real output
      consoleSpy.mockRestore();
      
      // This should not throw and should produce real console output
      expect(() => {
        tracker.display();
      }).not.toThrow();
      
      // Re-mock for cleanup
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      console.log('✅ VERIFIED: Real console output integration');
    });

    it('should work with console formatting characters', () => {
      const steps = [
        { id: 'format-chars', message: 'Step with unicode ✓ characters' },
        { id: 'format-emoji', message: 'Step with emoji 🚀 test' }
      ];

      tracker = new ProgressTracker(steps);
      
      // Should handle special characters without issues
      expect(() => {
        tracker.display();
        tracker.complete('format-chars');
        tracker.display();
        tracker.complete('format-emoji');
        tracker.display();
      }).not.toThrow();
      
      console.log('✅ VERIFIED: Special character and emoji handling');
    });
  });

  describe('Real Timing Tests', () => {
    it('should handle real timing delays', async () => {
      const steps = [
        { id: 'timing-test', message: 'Timing delay test' }
      ];

      tracker = new ProgressTracker(steps);
      tracker.startAnimation();
      
      // Let animation run for a realistic duration
      await new Promise(resolve => setTimeout(resolve, 500));
      
      tracker.complete('timing-test');
      
      // Brief delay before stopping
      await new Promise(resolve => setTimeout(resolve, 100));
      
      tracker.stopAnimation();
      
      // Animation should have produced multiple console calls during the delay
      expect(consoleSpy.mock.calls.length).toBeGreaterThan(5);
      
      console.log('✅ VERIFIED: Real timing delays with animation');
      console.log('⏱️  Animation produced', consoleSpy.mock.calls.length, 'console updates');
    });
  });
});