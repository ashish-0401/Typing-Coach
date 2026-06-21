export interface AiCompletionRequest {
  /** Optional system instruction that frames the model's role and constraints. */
  system?: string;
  /** The user prompt. */
  prompt: string;
  /** When true, ask the model to reply with a single JSON object. */
  json?: boolean;
}

/**
 * Provider-agnostic AI text completion. Consumers inject this abstract class;
 * the concrete provider (Groq today) is bound in AiModule, so swapping providers
 * touches a single line and no feature code.
 */
export abstract class AiService {
  /** Identifier of the underlying model, for auditing and storage. */
  abstract readonly model: string;

  /**
   * Run a single completion and return the raw model text. When `request.json`
   * is true the text is a JSON object string for the caller to parse and validate.
   */
  abstract complete(request: AiCompletionRequest): Promise<string>;
}

/** Raised when a completion cannot be produced (missing key, network, or bad response). */
export class AiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AiError';
  }
}
