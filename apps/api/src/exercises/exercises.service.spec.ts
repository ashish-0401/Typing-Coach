import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ExercisesService } from './exercises.service';
import { AiService } from '../ai/ai.service';
import { LearningProfileService } from '../learning-profile/learning-profile.service';
import { DiagnosisService } from '../learning-profile/diagnosis.service';
import { GeneratedExerciseDocument } from './schemas/generated-exercise.schema';

const GOOD_RESPONSE = JSON.stringify({
  title: 'The brief at the field',
  text: 'Their friend received a brief note and believed every line of it. The chief retrieved the field report and reviewed each piece.',
  targetWords: ['receive', 'believe', 'field'],
});

interface Mocks {
  create: jest.Mock;
  getByUser: jest.Mock;
  getLatest: jest.Mock;
  complete: jest.Mock;
}

function makeService(
  overrides: {
    primaryWeaknesses?: string[];
    complete?: jest.Mock;
  } = {},
): { service: ExercisesService; mocks: Mocks } {
  const create = jest.fn().mockResolvedValue({ _id: 'ex1' });
  const getByUser = jest.fn().mockResolvedValue({
    primaryWeaknesses: overrides.primaryWeaknesses ?? ['ie/ei spelling'],
    strengths: ['steady rhythm'],
    learningStyle: 'short focused drills',
  });
  const getLatest = jest.fn().mockResolvedValue({ patterns: ['long words'] });
  const complete =
    overrides.complete ?? jest.fn().mockResolvedValue(GOOD_RESPONSE);

  const exerciseModel = {
    create,
  } as unknown as Model<GeneratedExerciseDocument>;
  const profiles = { getByUser } as unknown as LearningProfileService;
  const diagnoses = { getLatest } as unknown as DiagnosisService;
  const ai = { model: 'test-model', complete } as unknown as AiService;

  const service = new ExercisesService(exerciseModel, profiles, diagnoses, ai);
  return { service, mocks: { create, getByUser, getLatest, complete } };
}

describe('ExercisesService.generate', () => {
  it('throws BadRequestException when the user has no weakness yet', async () => {
    const { service, mocks } = makeService({ primaryWeaknesses: [] });

    await expect(service.generate('u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('defaults to the top weakness and medium difficulty', async () => {
    const { service, mocks } = makeService();

    await service.generate('u1');

    expect(mocks.complete).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        weakness: 'ie/ei spelling',
        difficulty: 'medium',
      }),
    );
  });

  it('uses the provided weakness and difficulty', async () => {
    const { service, mocks } = makeService();

    await service.generate('u1', {
      weakness: 'double letters',
      difficulty: 'hard',
    });

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        weakness: 'double letters',
        difficulty: 'hard',
      }),
    );
  });

  it('persists the generated exercise with the model id', async () => {
    const { service, mocks } = makeService();

    await service.generate('u1');

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        title: 'The brief at the field',
        targetWords: ['receive', 'believe', 'field'],
        aiModel: 'test-model',
      }),
    );
  });

  it('maps AI failures to a ServiceUnavailableException', async () => {
    const complete = jest.fn().mockRejectedValue(new Error('network down'));
    const { service, mocks } = makeService({ complete });

    await expect(service.generate('u1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('maps an unparseable AI response to a ServiceUnavailableException', async () => {
    const complete = jest.fn().mockResolvedValue('not json at all');
    const { service, mocks } = makeService({ complete });

    await expect(service.generate('u1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
