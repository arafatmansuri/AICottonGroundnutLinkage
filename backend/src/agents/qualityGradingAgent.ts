import { BaseAgent, AgentInput, AgentOutput } from './baseAgent';
import { aiProvider } from '../ai/aiProvider';

export interface QualityGradingInput extends AgentInput {
  cropType: string;
  imageUrl?: string;
  manualObservations?: string[];
}

export interface QualityGradingOutput extends AgentOutput {
  estimatedGrade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'UNGRADED';
  confidence: number;
  estimatedPriceRange: { min: number; max: number };
  observations: string[];
  warning: string;
}

// Structured JSON that we ask the AI to return
interface AIGradingResult {
  grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'UNGRADED';
  confidence: number; // 0-1
  priceMin: number;
  priceMax: number;
  observations: string[];
}

export class QualityGradingAgent extends BaseAgent<QualityGradingInput, QualityGradingOutput> {
  readonly name = 'QualityGradingAgent';

  validateInput(input: QualityGradingInput): boolean {
    return !!input.cropType;
  }

  protected async run(input: QualityGradingInput): Promise<QualityGradingOutput> {
    const observations: string[] = input.manualObservations ?? [];

    if (input.imageUrl) {
      try {
        const result = await this.gradeWithAI(input.cropType, input.imageUrl);
        return {
          agentName: this.name,
          success: true,
          confidence: result.confidence,
          executionMs: 0,
          estimatedGrade: result.grade,
          estimatedPriceRange: { min: result.priceMin, max: result.priceMax },
          observations: [...observations, ...result.observations],
          warning:
            'AI-assisted estimate only — final commercial grading should follow accepted physical/laboratory standards.',
        };
      } catch {
        // Fall through to heuristic if AI call fails
      }
    }

    // Heuristic fallback (no image or AI unavailable)
    return this.heuristicGrade(input.cropType, observations);
  }

  private async gradeWithAI(
    cropType: string,
    imageUrl: string,
  ): Promise<AIGradingResult> {
    const prompt = `You are an expert agricultural quality inspector.
Analyze the crop image provided and respond with ONLY a valid JSON object — no markdown, no explanation outside the JSON.

Crop type: ${cropType}
Image URL: ${imageUrl}

Return this exact JSON shape:
{
  "grade": "GRADE_A" | "GRADE_B" | "GRADE_C" | "UNGRADED",
  "confidence": <number 0-1>,
  "priceMin": <number per quintal in INR>,
  "priceMax": <number per quintal in INR>,
  "observations": [<string>, ...]
}

Grading criteria:
- GRADE_A: premium quality, uniform colour/size, no damage, no contamination
- GRADE_B: good quality, minor imperfections, acceptable moisture
- GRADE_C: below average, visible damage/discolouration, high moisture
- UNGRADED: cannot determine quality from image alone
- confidence: your certainty (0 = no idea, 1 = certain)
- priceMin/priceMax: realistic Indian mandi price range for this grade of ${cropType}
- observations: 3-5 concise visual observations from the image`;

    const message = await aiProvider.chat([
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
        ],
      },
    ]);

    const text = typeof message.content === 'string'
      ? message.content
      : (message.content as Array<{ type: string; text: string }>)
          ?.map(p => p.text)
          .join('') ?? '';

    // Extract JSON from the response (handle markdown fences if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIGradingResult;

    const validGrades = ['GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED'] as const;
    if (!validGrades.includes(parsed.grade)) {
      throw new Error(`Invalid grade in AI response: ${parsed.grade}`);
    }

    return parsed;
  }

  private heuristicGrade(
    cropType: string,
    baseObservations: string[],
  ): QualityGradingOutput {
    const cropLower = cropType.toLowerCase();
    let grade: QualityGradingOutput['estimatedGrade'] = 'GRADE_B';
    let confidence = 0.5;
    let priceMin = 0;
    let priceMax = 0;
    const observations = [...baseObservations];

    if (cropLower.includes('cotton')) {
      observations.push('No image provided — heuristic estimate only');
      observations.push('No visible contamination assumed');
      observations.push('Grade assigned based on crop type alone');
      grade = 'GRADE_B';
      confidence = 0.5;
      priceMin = 6800;
      priceMax = 7400;
    } else if (cropLower.includes('groundnut')) {
      observations.push('No image provided — heuristic estimate only');
      observations.push('Moisture levels cannot be assessed without image');
      grade = 'GRADE_B';
      confidence = 0.5;
      priceMin = 5500;
      priceMax = 6200;
    } else {
      observations.push('No image provided — generic estimate');
      grade = 'UNGRADED';
      confidence = 0.4;
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
      warning:
        'AI-assisted estimate only — final commercial grading should follow accepted physical/laboratory standards.',
    };
  }
}

export const qualityGradingAgent = new QualityGradingAgent();
