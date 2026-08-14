import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface GeminiGenerationResult {
  text: string;
  model: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenAI | null = null;
  private readonly defaultModel = 'gemini-3.6-flash';

  constructor(private readonly configService: ConfigService) {
    this.initClient();
  }

  private initClient(): void {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.client = new GoogleGenAI({ apiKey: apiKey.trim() });
        this.logger.log('GeminiService initialized with GoogleGenAI client');
      } catch (err) {
        this.logger.error('Failed to initialize GoogleGenAI client', err);
        this.client = null;
      }
    } else {
      this.logger.warn(
        'GEMINI_API_KEY not configured. AI generation will fall back to structured templates & prompt export.',
      );
    }
  }

  isConfigured(): boolean {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;
    return !!(apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here');
  }

  async generateText(
    prompt: string,
    systemInstruction?: string,
  ): Promise<GeminiGenerationResult> {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: apiKey.trim() });
    }

    try {
      // First attempt using the Interactions API
      const interaction = await this.client.interactions.create({
        model: this.defaultModel,
        input: prompt,
        system_instruction: systemInstruction,
      });

      if (interaction && interaction.output_text) {
        return {
          text: interaction.output_text.trim(),
          model: this.defaultModel,
        };
      }
    } catch (interactionsError) {
      this.logger.warn(
        `Interactions API call failed (${(interactionsError as Error)?.message}), attempting models.generateContent fallback`,
      );
    }

    // Fallback to models.generateContent
    try {
      const response = await this.client.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const responseText = response.text || '';
      return {
        text: responseText.trim(),
        model: this.defaultModel,
      };
    } catch (fallbackError) {
      this.logger.error('Gemini API generateContent failed', fallbackError);
      throw fallbackError;
    }
  }
}
