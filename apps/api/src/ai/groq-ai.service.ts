import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiChatRequest,
  AiCompletionRequest,
  AiError,
  AiService,
} from './ai.service';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = 30_000;

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

@Injectable()
export class GroqAiService extends AiService {
  private readonly apiKey: string | undefined;
  readonly model: string;

  constructor(config: ConfigService) {
    super();
    // Read config at construction (no network call), so the app boots without a key.
    // Use ||, not ??, so an empty GROQ_MODEL= in .env still falls back to the default.
    this.apiKey = config.get<string>('GROQ_API_KEY')?.trim() || undefined;
    this.model = config.get<string>('GROQ_MODEL')?.trim() || DEFAULT_MODEL;
  }

  async complete(request: AiCompletionRequest): Promise<string> {
    const messages: GroqMessage[] = [];
    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    messages.push({ role: 'user', content: request.prompt });
    return this.send(messages, request.json ?? false);
  }

  async chat(request: AiChatRequest): Promise<string> {
    const messages: GroqMessage[] = [];
    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    for (const message of request.messages) {
      messages.push({ role: message.role, content: message.content });
    }
    return this.send(messages, false);
  }

  private async send(messages: GroqMessage[], json: boolean): Promise<string> {
    if (!this.apiKey) {
      throw new AiError('GROQ_API_KEY is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.2,
          ...(json ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: controller.signal,
      });
    } catch (cause) {
      throw new AiError('AI request failed or timed out', { cause });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new AiError(
        `AI request failed with status ${response.status}` +
          (detail ? `: ${detail}` : ''),
      );
    }

    let data: GroqResponse;
    try {
      data = (await response.json()) as GroqResponse;
    } catch (cause) {
      throw new AiError('AI returned a non-JSON response', { cause });
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new AiError('AI returned an empty completion');
    }

    return content;
  }
}
