import { ConfigService } from '@nestjs/config';
import { AiError } from './ai.service';
import { GroqAiService } from './groq-ai.service';

function configWith(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string): string | undefined => values[key],
  } as unknown as ConfigService;
}

describe('GroqAiService', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('throws AiError when the API key is missing', async () => {
    const service = new GroqAiService(configWith({}));
    await expect(service.complete({ prompt: 'hi' })).rejects.toBeInstanceOf(
      AiError,
    );
  });

  it('sends the prompt to Groq and returns the completion text', async () => {
    let capturedBody = '';
    const fetchMock = jest
      .fn()
      .mockImplementation((_url: string, init: RequestInit) => {
        capturedBody = init.body as string;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: 'hello there' } }],
            }),
        } as unknown as Response);
      });
    global.fetch = fetchMock;

    const service = new GroqAiService(
      configWith({ GROQ_API_KEY: 'test-key', GROQ_MODEL: 'test-model' }),
    );
    const result = await service.complete({
      system: 'be brief',
      prompt: 'say hello',
    });

    expect(result).toBe('hello there');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(capturedBody) as {
      model: string;
      messages: { role: string; content: string }[];
    };
    expect(body.model).toBe('test-model');
    expect(body.messages).toEqual([
      { role: 'system', content: 'be brief' },
      { role: 'user', content: 'say hello' },
    ]);
  });

  it('falls back to the default model when GROQ_MODEL is empty', async () => {
    let capturedBody = '';
    const fetchMock = jest
      .fn()
      .mockImplementation((_url: string, init: RequestInit) => {
        capturedBody = init.body as string;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
        } as unknown as Response);
      });
    global.fetch = fetchMock;

    const service = new GroqAiService(
      configWith({ GROQ_API_KEY: 'k', GROQ_MODEL: '' }),
    );
    await service.complete({ prompt: 'hi' });

    const body = JSON.parse(capturedBody) as { model: string };
    expect(body.model).toBe('llama-3.3-70b-versatile');
  });

  it('throws AiError on a non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('rate limited'),
    });

    const service = new GroqAiService(configWith({ GROQ_API_KEY: 'k' }));
    await expect(service.complete({ prompt: 'hi' })).rejects.toBeInstanceOf(
      AiError,
    );
  });
});
