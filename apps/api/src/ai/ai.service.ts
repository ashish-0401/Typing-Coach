export interface AiCompletionRequest {
  /** Optional system instruction that frames the model's role and constraints. */
  system?: string;
  /** The user prompt. */
  prompt: string;
  /** When true, ask the model to reply with a single JSON object. */
  json?: boolean;
  /** Optional cap on completion tokens, so long JSON outputs have room to finish. */
  maxTokens?: number;
}

/** A single turn in a conversation. */
export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  /** Optional system instruction that frames the model's role and constraints. */
  system?: string;
  /** Conversation turns, oldest first. */
  messages: AiChatMessage[];
}

/**
 * Provider-agnostic AI text. Consumers inject this abstract class; the concrete
 * provider (Groq today) is bound in AiModule, so swapping providers touches a
 * single line and no feature code.
 */
export abstract class AiService {
  /** Identifier of the underlying model, for auditing and storage. */
  abstract readonly model: string;

  /**
   * Run a single completion and return the raw model text. When `request.json`
   * is true the text is a JSON object string for the caller to parse and validate.
   */
  abstract complete(request: AiCompletionRequest): Promise<string>;

  /**
   * Hold a multi-turn conversation and return the assistant's natural-language
   * reply. `messages` are oldest-first; the optional `system` frames the role.
   */
  abstract chat(request: AiChatRequest): Promise<string>;
}

/** Raised when a completion cannot be produced (missing key, network, or bad response). */
export class AiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AiError';
  }
}
