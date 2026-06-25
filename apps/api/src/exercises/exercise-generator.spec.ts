import {
  buildExercisePrompt,
  ExerciseFormatError,
  parseExerciseResponse,
  type ExerciseContext,
} from './exercise-generator';

const context: ExerciseContext = {
  weakness: 'ie/ei spelling',
  difficulty: 'medium',
  strengths: ['steady rhythm'],
  learningStyle: 'short focused drills',
  relatedPatterns: ['long words'],
};

describe('buildExercisePrompt', () => {
  it('asks for JSON in the required shape', () => {
    const { system } = buildExercisePrompt(context);
    expect(system.toLowerCase()).toContain('json');
    expect(system).toContain('title');
    expect(system).toContain('text');
    expect(system).toContain('targetWords');
  });

  it('includes the weakness, difficulty and related patterns', () => {
    const { prompt } = buildExercisePrompt(context);
    expect(prompt).toContain('ie/ei spelling');
    expect(prompt).toContain('medium');
    expect(prompt).toContain('long words');
  });
});

describe('parseExerciseResponse', () => {
  it('parses a valid passage and cleans target words', () => {
    const raw = JSON.stringify({
      title: '  The brief at the field  ',
      text: 'Their friend received a brief note and believed every line of it. The chief retrieved the field report and reviewed each piece.',
      targetWords: ['receive', 42, '', '  believe  ', 'field'],
    });

    const result = parseExerciseResponse(raw);

    expect(result.title).toBe('The brief at the field');
    expect(result.text).toContain('received');
    expect(result.targetWords).toEqual(['receive', 'believe', 'field']);
  });

  it('collapses line breaks into a single paragraph', () => {
    const raw = JSON.stringify({
      title: 'Two lines',
      text: 'The chief received a brief field report.\n\nHe believed every piece of it and reviewed the field again.',
      targetWords: ['receive'],
    });

    const result = parseExerciseResponse(raw);

    expect(result.text).not.toContain('\n');
    expect(result.text).toContain('report. He believed');
  });

  it('caps an over-long passage at a word boundary', () => {
    const sentence =
      'The chief received a brief field report and believed every piece of it. ';
    const raw = JSON.stringify({
      title: 'Long drill',
      text: sentence.repeat(60),
      targetWords: ['receive'],
    });

    const result = parseExerciseResponse(raw);

    expect(result.text.length).toBeLessThanOrEqual(1200); // MAX_TEXT_LEN
    expect(result.text.endsWith(' ')).toBe(false);
  });

  it('throws on malformed JSON', () => {
    expect(() => parseExerciseResponse('not json')).toThrow(
      ExerciseFormatError,
    );
  });

  it('throws when title or text is missing', () => {
    const raw = JSON.stringify({ title: 'No passage here' });
    expect(() => parseExerciseResponse(raw)).toThrow(ExerciseFormatError);
  });

  it('rejects a bare word list instead of prose', () => {
    const raw = JSON.stringify({
      title: 'Word list',
      text: 'receive believe piece chief field brief retrieve review',
      targetWords: ['receive'],
    });
    expect(() => parseExerciseResponse(raw)).toThrow(ExerciseFormatError);
  });

  it('rejects a too-short passage', () => {
    const raw = JSON.stringify({
      title: 'Tiny',
      text: 'Receive it.',
      targetWords: [],
    });
    expect(() => parseExerciseResponse(raw)).toThrow(ExerciseFormatError);
  });
});
