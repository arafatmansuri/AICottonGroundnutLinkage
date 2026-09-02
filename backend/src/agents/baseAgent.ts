// Base AI Agent interface
export interface AgentInput {
  userId?: string;
  [key: string]: unknown;
}

export interface AgentOutput {
  agentName: string;
  success: boolean;
  confidence: number;
  executionMs: number;
  error?: string;
  [key: string]: unknown;
}

export abstract class BaseAgent<I extends AgentInput, O extends AgentOutput> {
  abstract readonly name: string;

  abstract validateInput(input: I): boolean;
  protected abstract run(input: I): Promise<O>;

  async execute(input: I): Promise<O> {
    const start = Date.now();
    if (!this.validateInput(input)) {
      return {
        agentName: this.name,
        success: false,
        confidence: 0,
        executionMs: 0,
        error: 'Invalid input',
      } as unknown as O;
    }

    try {
      const result = await this.run(input);
      result.executionMs = Date.now() - start;
      result.agentName = this.name;
      return result;
    } catch (error: unknown) {
      return {
        agentName: this.name,
        success: false,
        confidence: 0,
        executionMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      } as unknown as O;
    }
  }

  getConfidence(output: O): number {
    return output.confidence;
  }
}
