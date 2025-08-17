import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '../middlewares/google.gen.ai';


export const AIEvaluationSchema = z.object({
  riskLevel: z.enum(['SAFE', 'CAUTION', 'RISKY']),
  matchedAllergens: z.array(z.string()),
  reasoning: z.string(),
});

export type AIEvaluation = z.infer<typeof AIEvaluationSchema>;

export class AIService {
  private geminiModel = google('gemini-2.5-flash');
  private geminiVisionModel = google('gemini-2.5-pro-vision');

  /**
   * Mock AI response untuk development/testing 
   */
  private getMockAIResponse(userAllergies: string[], ingredientsText: string): AIEvaluation {
    console.log('🤖 AI BYPASSED - Using mock response');
    
    // Simple logic untuk mock response
    const lowerIngredients = ingredientsText.toLowerCase();
    const matchedAllergens: string[] = [];
    
    // Check untuk common allergens
    userAllergies.forEach(allergen => {
      const allergenLower = allergen.toLowerCase();
      if (lowerIngredients.includes(allergenLower) || 
          lowerIngredients.includes(allergenLower.replace(' ', ''))) {
        matchedAllergens.push(allergen);
      }
    });
    
    let riskLevel: 'SAFE' | 'CAUTION' | 'RISKY' = 'SAFE';
    let reasoning = 'Product appears safe based on ingredient analysis.';
    
    if (matchedAllergens.length > 0) {
      riskLevel = 'RISKY';
      reasoning = `⚠️ HIGH RISK: Detected allergens: ${matchedAllergens.join(', ')}. Avoid this product.`;
    } else if (lowerIngredients.includes('may contain') || lowerIngredients.includes('traces of')) {
      riskLevel = 'CAUTION';
      reasoning = '⚠️ CAUTION: Product may contain traces of allergens. Check with manufacturer.';
    } else if (lowerIngredients.includes('natural flavors') || lowerIngredients.includes('spices')) {
      riskLevel = 'CAUTION';
      reasoning = '⚠️ CAUTION: Contains natural flavors/spices that may include allergens.';
    }
    
    return {
      riskLevel,
      matchedAllergens,
      reasoning
    };
  }

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

      // Bypass AI jika environment variable BYPASS_AI = true
      if (process.env.BYPASS_AI === 'true' || process.env.BYPASS_AUTH === 'true') {
        return this.getMockAIResponse(userAllergies, ingredientsText);
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
        temperature: 0.1, 
      });

      return result.object;

    } catch (error) {
      console.error('Error in analyzeIngredientsText:', error);
      
      // Fallback ke mock response jika AI gagal
      if (process.env.BYPASS_AI === 'true' || process.env.BYPASS_AUTH === 'true') {
        console.log('🔄 AI failed, falling back to mock response');
        return this.getMockAIResponse(userAllergies, ingredientsText);
      }
      
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

      // Bypass AI jika environment variable BYPASS_AI = true
      if (process.env.BYPASS_AI === 'true' || process.env.BYPASS_AUTH === 'true') {
        return {
          riskLevel: 'CAUTION',
          matchedAllergens: [],
          reasoning: '🤖 AI BYPASSED - Image analysis requires AI service. Set BYPASS_AI=false to enable real AI analysis.'
        };
      }

      const prompt = `
You are an expert nutritionist and allergy specialist. Your task is to analyze food product images and assess allergy risks.

USER ALLERGIES: ${userAllergies.join(', ')}

Please analyze the product image above and determine:
1. Risk level based on the presence of user's allergens
2. Which specific allergens from the user's list are found in the product
3. Detailed reasoning for your assessment

Look for:
- Ingredient lists on packaging
- Allergy warnings (e.g., "Contains: milk, nuts")
- Cross-contamination notices
- Product name and brand information

RISK LEVELS:
- SAFE: No allergens detected, safe for consumption
- CAUTION: Possible cross-contamination or unclear information that might contain allergens
- RISKY: Direct presence of user's allergens, should avoid

Provide a thorough but concise reasoning that explains your decision.
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
      
      // Fallback ke mock response jika AI gagal
      if (process.env.BYPASS_AI === 'true' || process.env.BYPASS_AUTH === 'true') {
        console.log('🔄 AI failed, falling back to mock response');
        return {
          riskLevel: 'CAUTION',
          matchedAllergens: [],
          reasoning: '🤖 AI BYPASSED - Image analysis failed. Set BYPASS_AI=false to enable real AI analysis.'
        };
      }
      
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
      // Bypass AI jika environment variable BYPASS_AI = true
      if (process.env.BYPASS_AI === 'true' || process.env.BYPASS_AUTH === 'true') {
        return this.getMockAIResponse(userAllergies, ingredientsText);
      }

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
      
      // Fallback ke mock response jika AI gagal
      if (process.env.BYPASS_AI === 'true' || process.env.BYPASS_AUTH === 'true') {
        console.log('🔄 AI failed, falling back to mock response');
        return this.getMockAIResponse(userAllergies, ingredientsText);
      }
      
      if (error instanceof Error) {
        throw new Error(`AI contextual analysis failed: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred during AI contextual analysis');
    }
  }
}

export default new AIService();


