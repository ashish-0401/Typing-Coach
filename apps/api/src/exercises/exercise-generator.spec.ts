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

  it('parses JSON wrapped in markdown code fences', () => {
    const inner = JSON.stringify({
      title: 'Fenced',
      text: 'Their friend received a brief note and believed every line of it today.',
      targetWords: ['receive'],
    });
    const result = parseExerciseResponse('```json\n' + inner + '\n```');
    expect(result.text).toContain('received');
  });

  it('extracts the JSON object when the model adds stray text', () => {
    const inner = JSON.stringify({
      title: 'Stray',
      text: 'Their friend received a brief note and believed every line of it today.',
    });
    const result = parseExerciseResponse(
      `Sure! Here is your drill:\n${inner}\nHope that helps.`,
    );
    expect(result.title).toBe('Stray');
  });

  it('accepts the passage under an alternate key', () => {
    const raw = JSON.stringify({
      title: 'Alt key',
      passage:
        'Their friend received a brief note and believed every line of it today.',
    });
    expect(parseExerciseResponse(raw).text).toContain('received');
  });

  it('joins an array passage into one paragraph', () => {
    const raw = JSON.stringify({
      title: 'Array text',
      text: [
        'Their friend received a brief note and believed it.',
        'The chief retrieved the field report and reviewed each piece.',
      ],
    });
    const result = parseExerciseResponse(raw);
    expect(result.text).not.toContain('\n');
    expect(result.text).toContain('believed it. The chief');
  });

  it('defaults the title when it is missing', () => {
    const raw = JSON.stringify({
      text: 'Their friend received a brief note and believed every line of it today.',
    });
    expect(parseExerciseResponse(raw).title.length).toBeGreaterThan(0);
  });

  it('accepts comma-separated target words', () => {
    const raw = JSON.stringify({
      title: 'Commas',
      text: 'Their friend received a brief note and believed every line of it today.',
      targetWords: 'receive, believe , field',
    });
    expect(parseExerciseResponse(raw).targetWords).toEqual([
      'receive',
      'believe',
      'field',
    ]);
  });

  it('accepts a run-on passage with no end punctuation', () => {
    const raw = JSON.stringify({
      title: 'Foreign Policy',
      text: 'The foreign policy chief believed neither the neighbor nor the foreign aide could receive the brief in time to relieve the siege so the chief decided to retrieve the foreign policy guide and review each piece of evidence',
      targetWords: ['receive', 'relieve', 'foreign'],
    });
    expect(parseExerciseResponse(raw).text).toContain('foreign policy chief');
  });
});
