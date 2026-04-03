import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { HiOutlineCheck, HiOutlineX, HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

/**
 * ResultPage — Detailed result view for a completed attempt.
 * Shows score, percentage, and question-by-question review.
 */
export default function ResultPage() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      // Fetch attempt with test details
      const { data: attemptData } = await supabase
        .from('attempts')
        .select('*, tests(title, subjects(name))')
        .eq('id', attemptId)
        .single();

      setAttempt(attemptData);

      // Fetch result
      const { data: resultData } = await supabase
        .from('results')
        .select('*')
        .eq('attempt_id', attemptId)
        .single();

      setResult(resultData);

      // Fetch responses with question and option details
      const { data: responsesData } = await supabase
        .from('responses')
        .select('*, questions(question_text, options(*))')
        .eq('attempt_id', attemptId);

      setResponses(responsesData || []);
    } catch (err) {
      toast.error('Failed to load results');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  if (!attempt || !result) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Result not found</div>
        <Link to="/student" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>Back to Dashboard</Link>
      </div>
    );
  }

  const percentage = result.percentage || 0;
  const passed = percentage >= 40;

  return (
    <div className="animate-fade-in">
      <Link to="/student" className="btn btn-ghost" style={{ marginBottom: 'var(--space-lg)' }}>
        <HiOutlineArrowLeft size={18} /> Back to Dashboard
      </Link>

      {/* Score Card */}
      <div className="card" style={{
        textAlign: 'center',
        padding: 'var(--space-2xl)',
        marginBottom: 'var(--space-2xl)',
        background: passed ? 'var(--color-success-light)' : 'var(--color-error-light)',
        border: `1px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}>
        <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
          {test?.title || attempt?.tests?.title}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          {attempt?.tests?.subjects?.name}
        </p>
        <div style={{ fontSize: '4rem', fontWeight: 800, color: passed ? 'var(--color-success)' : 'var(--color-error)', lineHeight: 1 }}>
          {percentage}%
        </div>
        <p style={{ fontSize: 'var(--font-size-lg)', marginTop: 'var(--space-md)', fontWeight: 600, color: passed ? 'var(--color-success)' : 'var(--color-error)' }}>
          {passed ? '🎉 Pass' : '❌ Needs Improvement'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-label">Total Questions</div>
            <div className="stat-card-value">{result.total_questions}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-label">Correct Answers</div>
            <div className="stat-card-value" style={{ color: 'var(--color-success)' }}>{result.correct_answers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-label">Wrong Answers</div>
            <div className="stat-card-value" style={{ color: 'var(--color-error)' }}>{result.total_questions - result.correct_answers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-label">Score</div>
            <div className="stat-card-value">{result.score}/{result.total_questions}</div>
          </div>
        </div>
      </div>

      {/* Question Review */}
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
        Question Review
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {responses.map((r, i) => {
          const question = r.questions;
          const options = question?.options || [];
          const correctOption = options.find(o => o.is_correct);
          const selectedOption = options.find(o => o.id === r.selected_option);
          const isCorrect = selectedOption?.is_correct;

          return (
            <div key={r.id} className="card" style={{
              borderLeft: `4px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-full)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCorrect ? 'var(--color-success-light)' : 'var(--color-error-light)',
                  color: isCorrect ? 'var(--color-success)' : 'var(--color-error)',
                  fontSize: 'var(--font-size-xs)', fontWeight: 700,
                }}>
                  {isCorrect ? <HiOutlineCheck size={16} /> : <HiOutlineX size={16} />}
                </span>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Question {i + 1}
                </span>
              </div>

              <p style={{ fontWeight: 500, marginBottom: 'var(--space-md)', lineHeight: 1.6 }}>
                {question?.question_text}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                {options.map((opt, oi) => {
                  const isSelected = opt.id === r.selected_option;
                  const isCorrectOpt = opt.is_correct;

                  let bg = 'rgba(148,163,184,0.06)';
                  let borderColor = 'var(--color-border)';
                  let textColor = 'var(--color-text-secondary)';

                  if (isCorrectOpt) {
                    bg = 'var(--color-success-light)';
                    borderColor = 'rgba(16,185,129,0.4)';
                    textColor = 'var(--color-success)';
                  } else if (isSelected && !isCorrectOpt) {
                    bg = 'var(--color-error-light)';
                    borderColor = 'rgba(239,68,68,0.4)';
                    textColor = 'var(--color-error)';
                  }

                  return (
                    <div key={opt.id} style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-sm)',
                      background: bg,
                      border: `1px solid ${borderColor}`,
                      color: textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + oi)}.</span>
                      {opt.option_text}
                      {isCorrectOpt && <HiOutlineCheck size={14} />}
                      {isSelected && !isCorrectOpt && <HiOutlineX size={14} />}
                    </div>
                  );
                })}
              </div>

              {!isCorrect && (
                <p style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Your answer: {selectedOption?.option_text || 'Not answered'} | Correct: {correctOption?.option_text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
