/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by failing fast when a service is unhealthy.
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service unhealthy, requests fail immediately
 * - HALF_OPEN: Testing if service has recovered
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit */
  threshold?: number;
  /** Time in ms before attempting to close the circuit */
  resetTimeout?: number;
  /** Name for logging */
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private readonly threshold: number;
  private readonly resetTimeout: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.threshold = options.threshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000; // 30 seconds
    this.name = options.name ?? 'default';
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        console.log(`[CircuitBreaker:${this.name}] Transitioning from OPEN to HALF_OPEN`);
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        const waitTime = Math.ceil((this.resetTimeout - (Date.now() - this.lastFailureTime)) / 1000);
        throw new Error(`Service temporarily unavailable. Please retry in ${waitTime} seconds.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      // Require 2 successful requests before closing
      if (this.successCount >= 2) {
        console.log(`[CircuitBreaker:${this.name}] Circuit CLOSED after successful recovery`);
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Failed during recovery attempt, reopen circuit
      console.error(`[CircuitBreaker:${this.name}] Circuit OPEN - failed during recovery`);
      this.state = 'OPEN';
      this.successCount = 0;
    } else if (this.failureCount >= this.threshold) {
      console.error(`[CircuitBreaker:${this.name}] Circuit OPEN after ${this.failureCount} failures`);
      this.state = 'OPEN';
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): { state: CircuitState; failures: number; lastFailure: number } {
    return {
      state: this.state,
      failures: this.failureCount,
      lastFailure: this.lastFailureTime,
    };
  }

  /**
   * Manually reset the circuit (for testing or admin override)
   */
  reset(): void {
    console.log(`[CircuitBreaker:${this.name}] Circuit manually reset`);
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

// Pre-configured circuit breakers for different services
export const submissionBreaker = new CircuitBreaker({
  name: 'assessment-submission',
  threshold: 5,
  resetTimeout: 30000,
});

export const databaseBreaker = new CircuitBreaker({
  name: 'database',
  threshold: 3,
  resetTimeout: 15000,
});
