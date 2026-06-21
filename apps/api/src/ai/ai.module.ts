import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { GroqAiService } from './groq-ai.service';

@Module({
  // Bind the provider-agnostic AiService to Groq. Swap the implementation here
  // to change providers; consumers depend only on the AiService abstraction.
  providers: [{ provide: AiService, useClass: GroqAiService }],
  exports: [AiService],
})
export class AiModule {}
