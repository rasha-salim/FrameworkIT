import React, { useState } from 'react';
import { usePuzzleStore } from './PuzzleStore';
import { useSDPuzzleStore } from './software-design/SDPuzzleStore';
import { useGameStore } from '../core/GameStore';
import { EventBus } from '../core/EventBus';
import type { DebriefQuestion } from '../types';

const LLM_API_KEY = (import.meta.env.VITE_LLM_API_KEY as string | undefined) || '';
const LLM_MODEL = (import.meta.env.VITE_LLM_MODEL as string | undefined) || 'claude-haiku-4-5-20251001';
const LLM_API_URL = (import.meta.env.VITE_LLM_API_URL as string | undefined) || 'https://api.anthropic.com/v1/messages';

interface QuestionState {
  answer: string;
  showHint: boolean;
  feedback: string | null;
  feedbackLoading: boolean;
}

async function getLLMFeedback(
  question: string,
  answer: string,
  chapterContext: string,
): Promise<string> {
  const response = await fetch(LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LLM_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are a system design tutor reviewing a student's reflection after completing a puzzle about ${chapterContext}.\n\nQuestion: ${question}\n\nStudent's answer: ${answer}\n\nGive brief, encouraging feedback (2-3 sentences). If their understanding is correct, affirm it and add one insight they might not have considered. If they have a misconception, gently correct it. Do not use emojis.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'Could not generate feedback.';
}

const FALLBACK_QUESTIONS: DebriefQuestion[] = [
  {
    id: 'general-approach',
    question: 'Describe in your own words what you built and why it solves the problem.',
  },
  {
    id: 'general-tradeoffs',
    question: 'What trade-offs did you consider in your design?',
  },
];

const CHAPTER_CONTEXT: Record<string, string> = {
  '01-load-balancing': 'load balancing and horizontal scaling',
  '02-caching': 'caching strategies, TTL, and cache invalidation',
  '03-databases': 'database read replicas and replication',
  '04-rate-limiting': 'rate limiting strategies and API protection',
  '05-sessions': 'session management, stateless servers, and shared session stores',
  '06-partitioning': 'database partitioning, sharding strategies, and data distribution',
  'sd-01-solid': 'SOLID principles, single responsibility, dependency inversion',
  'sd-02-patterns': 'design patterns, Factory, Builder, Adapter, Decorator',
  'sd-03-refactoring': 'refactoring, code smells, dependency injection',
  'sd-04-orchestration': 'behavioral patterns, Strategy, Observer, Repository',
  'sd-05-architecture': 'layered architecture, hexagonal architecture, ports and adapters',
  'sd-06-ddd': 'domain-driven design, aggregates, domain events, value objects',
};

export const DebriefUI: React.FC = () => {
  const selectedTrack = useGameStore((s) => s.selectedTrack);
  const sysPuzzleData = usePuzzleStore((s) => s.puzzleData);
  const sdPuzzleData = useSDPuzzleStore((s) => s.puzzleData);
  const puzzleData = selectedTrack === 'software-design' ? sdPuzzleData : sysPuzzleData;
  const currentChapter = useGameStore((s) => s.currentChapter);
  const sysGrade = usePuzzleStore((s) => s.simulationState.grade);
  const sdGrade = useSDPuzzleStore((s) => s.simulationState.grade);
  const grade = selectedTrack === 'software-design' ? sdGrade : sysGrade;

  const questions = puzzleData?.debrief?.length ? puzzleData.debrief : FALLBACK_QUESTIONS;

  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>(() => {
    const initial: Record<string, QuestionState> = {};
    for (const q of questions) {
      initial[q.id] = { answer: '', showHint: false, feedback: null, feedbackLoading: false };
    }
    return initial;
  });

  const updateQuestion = (id: string, updates: Partial<QuestionState>) => {
    setQuestionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  const allAnswered = questions.every((q) => questionStates[q.id]?.answer.trim().length >= 10);

  const handleGetFeedback = async (q: DebriefQuestion) => {
    const state = questionStates[q.id];
    if (!state.answer.trim() || !LLM_API_KEY) return;

    updateQuestion(q.id, { feedbackLoading: true, feedback: null });
    try {
      const context = CHAPTER_CONTEXT[currentChapter] || 'system design';
      const feedback = await getLLMFeedback(q.question, state.answer, context);
      updateQuestion(q.id, { feedback, feedbackLoading: false });
    } catch (err) {
      console.warn('[Debrief] LLM feedback failed:', err);
      updateQuestion(q.id, {
        feedback: 'Could not get feedback. Check your API configuration.',
        feedbackLoading: false,
      });
    }
  };

  const handleContinue = () => {
    // Save debrief answers to localStorage
    const answers: Record<string, string> = {};
    for (const q of questions) {
      answers[q.id] = questionStates[q.id].answer;
    }
    localStorage.setItem(`debrief-${currentChapter}`, JSON.stringify(answers));

    // CHECKPOINT 2: Mark debrief completed (grade already saved in GradeDisplay)
    useGameStore.getState().markDebriefCompleted(currentChapter);

    useGameStore.getState().setPhase('exploring');
    useGameStore.getState().setCurrentPuzzleId(null);
    EventBus.emit('puzzle:back-to-world');
  };

  const handleSkip = () => {
    handleContinue();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(5, 8, 18, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0f1428, #141a30)',
          border: '1px solid #2a3355',
          borderRadius: 16,
          padding: '40px 48px',
          maxWidth: 640,
          width: '90vw',
          fontFamily: 'monospace',
          margin: '24px 0',
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#4488ff',
            marginBottom: 4,
          }}
        >
          Debrief
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#6688aa',
            marginBottom: 28,
          }}
        >
          Reflect on your design decisions. Explaining your reasoning helps solidify your understanding.
        </div>

        {questions.map((q) => {
          const state = questionStates[q.id];
          return (
            <div key={q.id} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: '#ccddeeff', marginBottom: 8, lineHeight: 1.5 }}>
                {q.question}
              </div>

              {q.hint && (
                <div style={{ marginBottom: 8 }}>
                  {!state.showHint ? (
                    <button
                      onClick={() => updateQuestion(q.id, { showHint: true })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4488ff',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Show hint
                    </button>
                  ) : (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6688aa',
                        background: 'rgba(68, 136, 255, 0.08)',
                        border: '1px solid #2a335544',
                        borderRadius: 6,
                        padding: '8px 12px',
                        lineHeight: 1.5,
                      }}
                    >
                      {q.hint}
                    </div>
                  )}
                </div>
              )}

              <textarea
                value={state.answer}
                onChange={(e) => updateQuestion(q.id, { answer: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Type your answer here..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: '10px 12px',
                  background: '#0a0e1a',
                  border: '1px solid #2a3355',
                  borderRadius: 6,
                  color: '#ccddeeff',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />

              {LLM_API_KEY && state.answer.trim().length >= 10 && (
                <button
                  onClick={() => handleGetFeedback(q)}
                  disabled={state.feedbackLoading}
                  style={{
                    marginTop: 8,
                    background: 'rgba(68, 136, 255, 0.12)',
                    border: '1px solid #4488ff44',
                    color: state.feedbackLoading ? '#4488ff66' : '#88bbff',
                    padding: '6px 14px',
                    borderRadius: 6,
                    cursor: state.feedbackLoading ? 'default' : 'pointer',
                    fontSize: 11,
                    fontFamily: 'monospace',
                  }}
                >
                  {state.feedbackLoading ? 'Getting feedback...' : 'Get AI Feedback'}
                </button>
              )}

              {state.feedback && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: '#aabbcc',
                    background: 'rgba(68, 204, 102, 0.08)',
                    border: '1px solid #44cc6633',
                    borderRadius: 6,
                    padding: '10px 14px',
                    lineHeight: 1.6,
                  }}
                >
                  {state.feedback}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: '1px solid #2a3355',
              color: '#667788',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          >
            Skip
          </button>

          <button
            onClick={handleContinue}
            disabled={!allAnswered}
            style={{
              background: allAnswered
                ? 'linear-gradient(135deg, #2255aa, #3366cc)'
                : 'rgba(68, 136, 255, 0.1)',
              border: '1px solid #4488ff44',
              color: allAnswered ? '#ffffff' : '#4488ff66',
              padding: '10px 24px',
              borderRadius: 8,
              cursor: allAnswered ? 'pointer' : 'default',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
