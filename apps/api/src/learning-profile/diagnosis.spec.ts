import {
  buildDiagnosisPrompt,
  DiagnosisFormatError,
  parseDiagnosisResponse,
  type DiagnosisContext,
} from './diagnosis';

const context: DiagnosisContext = {
  currentWpm: 60,
  bestWpm: 72,
  averageWpm: 64,
  averageAccuracy: 94,
  totalSessions: 12,
  plateauDetected: false,
  topMistakes: ['receive', 'believe'],
  recentWpm: [58, 60, 62],
  recentAccuracy: [92, 93, 94],
};

describe('buildDiagnosisPrompt', () => {
  it('asks for JSON and includes the user data', () => {
    const { system, prompt } = buildDiagnosisPrompt(context);
    expect(system.toLowerCase()).toContain('json');
    expect(prompt).toContain('receive');
    expect(prompt).toContain('12'); // sessions analyzed
    expect(prompt).toContain('94'); // average accuracy
  });
});

describe('parseDiagnosisResponse', () => {
  it('parses a valid response and normalizes arrays', () => {
    const raw = JSON.stringify({
      summary: '  You struggle with IE/EI spelling.  ',
      reasoning: 'Errors cluster on receive and believe, not on speed.',
      patterns: ['ie/ei spelling', 42, '', 'double letters'],
      strengths: ['steady rhythm'],
      learningStyle: 'short focused drills',
    });

    const result = parseDiagnosisResponse(raw);

    expect(result.summary).toBe('You struggle with IE/EI spelling.');
    expect(result.patterns).toEqual(['ie/ei spelling', 'double letters']);
    expect(result.strengths).toEqual(['steady rhythm']);
    expect(result.learningStyle).toBe('short focused drills');
  });

  it('tolerates missing optional fields', () => {
    const raw = JSON.stringify({
      summary: 'Main issue identified.',
      reasoning: 'Because of the data provided.',
    });

    const result = parseDiagnosisResponse(raw);

    expect(result.patterns).toEqual([]);
    expect(result.strengths).toEqual([]);
    expect(result.learningStyle).toBe('');
  });

  it('throws DiagnosisFormatError on malformed JSON', () => {
    expect(() => parseDiagnosisResponse('not json')).toThrow(
      DiagnosisFormatError,
    );
  });

  it('throws DiagnosisFormatError when summary or reasoning is missing', () => {
    const raw = JSON.stringify({ summary: 'only a summary' });
    expect(() => parseDiagnosisResponse(raw)).toThrow(DiagnosisFormatError);
  });
});
