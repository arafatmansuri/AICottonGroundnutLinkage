import { BaseAgent, AgentInput, AgentOutput } from './baseAgent';

export interface QualityGradingInput extends AgentInput {
  cropType: string;
  imagePath?: string;
  manualObservations?: string[];
}

export interface QualityGradingOutput extends AgentOutput {
  estimatedGrade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'UNGRADED';
  confidence: number;
  estimatedPriceRange: { min: number; max: number };
  observations: string[];
  warning: string;
}

export class QualityGradingAgent extends BaseAgent<QualityGradingInput, QualityGradingOutput> {
  readonly name = 'QualityGradingAgent';

  validateInput(input: QualityGradingInput): boolean {
    return !!input.cropType;
  }

  protected async run(input: QualityGradingInput): Promise<QualityGradingOutput> {
    const cropLower = input.cropType.toLowerCase();
    const observations: string[] = input.manualObservations || [];

    // Mock vision-based assessment (replace with IBM Granite Vision or other model)
    // In production, this would call an image analysis API
    let grade: QualityGradingOutput['estimatedGrade'] = 'GRADE_B';
    let confidence = 0.72;
    let priceMin = 0, priceMax = 0;

    if (cropLower.includes('cotton')) {
      observations.push('Visual assessment based on uploaded image');
      observations.push('No visible contamination detected');
      observations.push('Color appears uniform — consistent with Grade B or above');
      grade = 'GRADE_B';
      confidence = 0.74;
      priceMin = 6800;
      priceMax = 7400;
    } else if (cropLower.includes('groundnut')) {
      observations.push('Kernel size appears uniform');
      observations.push('No significant discoloration detected');
      observations.push('Moisture levels cannot be assessed visually — recommend lab test');
      grade = 'GRADE_B';
      confidence = 0.68;
      priceMin = 5500;
      priceMax = 6200;
    } else {
      observations.push('Generic crop assessment performed');
      grade = 'UNGRADED';
      confidence = 0.5;
      priceMin = 4000;
      priceMax = 6000;
    }

    return {
      agentName: this.name,
      success: true,
      confidence,
      executionMs: 0,
      estimatedGrade: grade,
      estimatedPriceRange: { min: priceMin, max: priceMax },
      observations,
      warning: 'AI-assisted estimate only — final commercial grading should follow accepted physical/laboratory standards.',
    };
  }
}

export const qualityGradingAgent = new QualityGradingAgent();
