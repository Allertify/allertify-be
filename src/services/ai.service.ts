import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Zod schema untuk output AI yang terstruktur
export const AIEvaluationSchema = z.object({
  riskLevel: z.enum(['SAFE', 'CAUTION', 'RISKY']),
  matchedAllergens: z.array(z.string()),
  reasoning: z.string(),
});

export type AIEvaluation = z.infer<typeof AIEvaluationSchema>;

export class AIService {
  private geminiModel = google('gemini-1.5-pro');
  private geminiVisionModel = google('gemini-1.5-pro-vision');

  /**
   * Menganalisis teks bahan/ingredients berdasarkan alergi pengguna
   */
  async analyzeIngredientsText(
    ingredientsText: string, 
    userAllergies: string[]
  ): Promise<AIEvaluation> {
    try {
      if (!ingredientsText || ingredientsText.trim() === '') {
        throw new Error('Ingredients text cannot be empty');
      }

      if (!userAllergies || userAllergies.length === 0) {
        // Jika user tidak punya alergi, kembalikan hasil SAFE
        return {
          riskLevel: 'SAFE',
          matchedAllergens: [],
          reasoning: 'No allergies specified by user, product is considered safe.'
        };
      }

      const prompt = `
You are an expert nutritionist and allergy specialist. Your task is to analyze food ingredients and assess allergy risks.

USER ALLERGIES: ${userAllergies.join(', ')}

INGREDIENTS TO ANALYZE: "${ingredientsText}"

Please analyze the ingredients text above and determine:
1. Risk level based on the presence of user's allergens
2. Which specific allergens from the user's list are found in the ingredients
3. Detailed reasoning for your assessment

RISK LEVELS:
- SAFE: No allergens detected, safe for consumption
- CAUTION: Possible cross-contamination or unclear ingredients that might contain allergens
- RISKY: Direct presence of user's allergens, should avoid

Consider:
- Direct ingredient matches (e.g., "milk" matches "dairy/milk" allergy)
- Alternative names (e.g., "casein" for milk, "albumin" for eggs)
- Cross-contamination warnings (e.g., "may contain traces of...")
- Processing aids and additives that might contain allergens

Provide a thorough but concise reasoning that explains your decision.
      `;

      const result = await generateObject({
        model: this.geminiModel,
        schema: AIEvaluationSchema,
        prompt,
        temperature: 0.1, // Low temperature for consistent results
      });

      return result.object;

    } catch (error) {
      console.error('Error in analyzeIngredientsText:', error);
      
      if (error instanceof Error) {
        throw new Error(`AI analysis failed: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred during AI analysis');
    }
  }

  /**
   * Menganalisis gambar produk untuk ekstraksi OCR dan analisis alergi
   */
  async analyzeProductImage(
    imageUrl: string, 
    userAllergies: string[]
  ): Promise<AIEvaluation> {
    try {
      if (!imageUrl || imageUrl.trim() === '') {
        throw new Error('Image URL cannot be empty');
      }

      if (!userAllergies || userAllergies.length === 0) {
        // Jika user tidak punya alergi, kembalikan hasil SAFE
        return {
          riskLevel: 'SAFE',
          matchedAllergens: [],
          reasoning: 'No allergies specified by user, product is considered safe.'
        };
      }

      const prompt = `
You are an expert nutritionist and allergy specialist with OCR capabilities. Your task is to:

1. READ and EXTRACT the ingredients/composition list from this product image
2. ANALYZE the extracted ingredients against the user's allergies
3. ASSESS the allergy risk level

USER ALLERGIES: ${userAllergies.join(', ')}

Please examine the image and:
1. Extract all readable ingredients text from the product label
2. Analyze those ingredients against the user's allergy list
3. Determine the risk level and provide reasoning

RISK LEVELS:
- SAFE: No allergens detected in the ingredients
- CAUTION: Possible cross-contamination or unclear text that might contain allergens
- RISKY: Direct presence of user's allergens, should avoid

If you cannot clearly read the ingredients text from the image, set risk level to CAUTION and explain that the text is not clearly readable.

Consider:
- Direct ingredient matches
- Alternative names for allergens
- Cross-contamination warnings
- Manufacturing statements

Provide detailed reasoning that includes what ingredients you found and why you made your assessment.
      `;

      const result = await generateObject({
        model: this.geminiVisionModel,
        schema: AIEvaluationSchema,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image',
                image: imageUrl
              }
            ]
          }
        ],
        temperature: 0.1,
      });

      return result.object;

    } catch (error) {
      console.error('Error in analyzeProductImage:', error);
      
      if (error instanceof Error) {
        throw new Error(`AI image analysis failed: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred during AI image analysis');
    }
  }

  /**
   * Menganalisis teks bahan dengan konteks tambahan (brand, product name, dll)
   */
  async analyzeIngredientsWithContext(
    ingredientsText: string,
    userAllergies: string[],
    context: {
      productName?: string;
      brand?: string;
      category?: string;
    }
  ): Promise<AIEvaluation> {
    try {
      const contextInfo = [];
      if (context.productName) contextInfo.push(`Product: ${context.productName}`);
      if (context.brand) contextInfo.push(`Brand: ${context.brand}`);
      if (context.category) contextInfo.push(`Category: ${context.category}`);
      
      const contextString = contextInfo.length > 0 ? `\n\nADDITIONAL CONTEXT:\n${contextInfo.join('\n')}` : '';

      const prompt = `
You are an expert nutritionist and allergy specialist. Your task is to analyze food ingredients and assess allergy risks.

USER ALLERGIES: ${userAllergies.join(', ')}

INGREDIENTS TO ANALYZE: "${ingredientsText}"${contextString}

Please analyze the ingredients text above and determine:
1. Risk level based on the presence of user's allergens
2. Which specific allergens from the user's list are found in the ingredients
3. Detailed reasoning for your assessment

Use the additional context to better understand the product type and potential hidden allergens.

RISK LEVELS:
- SAFE: No allergens detected, safe for consumption
- CAUTION: Possible cross-contamination or unclear ingredients that might contain allergens
- RISKY: Direct presence of user's allergens, should avoid

Provide a thorough but concise reasoning that explains your decision.
      `;

      const result = await generateObject({
        model: this.geminiModel,
        schema: AIEvaluationSchema,
        prompt,
        temperature: 0.1,
      });

      return result.object;

    } catch (error) {
      console.error('Error in analyzeIngredientsWithContext:', error);
      
      if (error instanceof Error) {
        throw new Error(`AI contextual analysis failed: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred during AI contextual analysis');
    }
  }
}

export default new AIService();


