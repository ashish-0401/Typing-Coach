import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TypingSession,
  TypingSessionDocument,
} from './schemas/typing-session.schema';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(TypingSession.name)
    private readonly sessionModel: Model<TypingSessionDocument>,
  ) {}

  create(userId: string, dto: CreateSessionDto): Promise<TypingSessionDocument> {
    return this.sessionModel.create({ userId, ...dto });
  }

  findByUser(userId: string): Promise<TypingSessionDocument[]> {
    return this.sessionModel.find({ userId }).sort({ date: -1 }).exec();
  }
}
