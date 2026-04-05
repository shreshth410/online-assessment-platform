import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineClock } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './TestAttempt.css';

/**
 * TestAttempt — One-question-at-a-time test taking interface
 * with timer, question palette, and auto-submit.
 */
export default function TestAttempt() {
  const { testId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: optionId }
  const [attemptId, setAttemptId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);

  // Fetch test and create attempt
  useEffect(() => {
    initTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 && attemptId && !submitting) {
      handleSubmit(true); // Auto-submit on time up
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [attemptId]);

  const initTest = async () => {
    try {
      // Fetch test details
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*, subjects(name)')
        .eq('id', testId)
        .single();

      if (testError) throw testError;
      setTest(testData);
      setTimeLeft(testData.duration * 60);

      // Fetch questions with options
      const { data: tqData } = await supabase
        .from('test_questions')
        .select('question_id, questions(*, options(*))')
        .eq('test_id', testId);

      const qs = (tqData || []).map(tq => tq.questions).filter(Boolean);
      setQuestions(qs);

      // Create attempt
      const { data: attempt, error: aError } = await supabase
        .from('attempts')
        .insert({
          user_id: profile.id,
          test_id: parseInt(testId),
          status: 'in_progress',
        })
        .select()
        .single();

      if (aError) throw aError;
      setAttemptId(attempt.id);
    } catch (err) {
      toast.error('Failed to start test');
      console.error(err);
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async (timedOut = false) => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Insert all responses
      const responses = questions.map(q => ({
        attempt_id: attemptId,
        question_id: q.id,
        selected_option: answers[q.id] || null,
      }));

      const { error: rError } = await supabase
        .from('responses')
        .insert(responses);

      if (rError) throw rError;

      // Mark attempt as completed (use 'completed' for both cases
      // so the DB trigger fires and calculates the score server-side)
      const { error: aError } = await supabase
        .from('attempts')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
        })
        .eq('id', attemptId);

      if (aError) throw aError;

      // Try server-side scoring first (DB trigger + RPC)
      const { error: rpcError } = await supabase.rpc('calculate_test_score', {
        p_attempt_id: attemptId,
      });

      // If the RPC fails (function may not exist), fall back to client-side scoring
      if (rpcError) {
        console.warn('RPC calculate_test_score failed, using client-side scoring:', rpcError);

        let correct = 0;
        questions.forEach(q => {
          const selectedOpt = answers[q.id];
          if (selectedOpt) {
            const option = q.options.find(o => o.id === selectedOpt);
            if (option?.is_correct) correct++;
          }
        });

        const total = questions.length;
        const percentage = total > 0 ? Math.round((correct / total) * 100 * 100) / 100 : 0;

        await supabase
          .from('results')
          .upsert({
            attempt_id: attemptId,
            total_questions: total,
            correct_answers: correct,
            score: correct,
            percentage,
          }, { onConflict: 'attempt_id' });
      }

      toast.success(timedOut ? 'Time\'s up! Test submitted.' : 'Test submitted successfully!');
      navigate(`/student/result/${attemptId}`);
    } catch (err) {
      toast.error('Failed to submit test');
      console.error(err);
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /><p>Loading test...</p></div>;
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimeLow = timeLeft < 60;

  return (
    <div className="test-attempt">
      {/* Header */}
      <div className="test-header">
        <div className="test-header-left">
          <h2 className="test-title">{test?.title}</h2>
          <span className="badge badge-info">{test?.subjects?.name}</span>
        </div>
        <div className={`test-timer ${isTimeLow ? 'test-timer-low' : ''}`}>
          <HiOutlineClock size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="test-body">
        {/* Question Area */}
        <div className="test-question-area">
          <div className="test-question-card card">
            <div className="test-question-number">
              Question {currentIndex + 1} of {questions.length}
            </div>
            <p className="test-question-text">{currentQuestion?.question_text}</p>

            <div className="test-options">
              {currentQuestion?.options.map((opt, i) => (
                <div
                  key={opt.id}
                  className={`test-option ${answers[currentQuestion.id] === opt.id ? 'test-option-selected' : ''}`}
                  onClick={() => selectOption(currentQuestion.id, opt.id)}
                >
                  <span className="test-option-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="test-option-text">{opt.option_text}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="test-nav">
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <HiOutlineChevronLeft size={18} /> Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                >
                  Next <HiOutlineChevronRight size={18} />
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={() => setShowConfirm(true)}
                  disabled={submitting}
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="test-palette">
          <div className="card">
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
              Question Palette
            </h4>
            <div className="palette-grid">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  className={`palette-item ${
                    i === currentIndex ? 'palette-current' :
                    answers[q.id] ? 'palette-answered' : 'palette-unanswered'
                  }`}
                  onClick={() => setCurrentIndex(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="palette-legend">
              <span><span className="palette-dot palette-dot-current" /> Current</span>
              <span><span className="palette-dot palette-dot-answered" /> Answered</span>
              <span><span className="palette-dot palette-dot-unanswered" /> Unanswered</span>
            </div>
            <div style={{ marginTop: 'var(--space-lg)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {answeredCount}/{questions.length} answered
            </div>
            <button
              className="btn btn-success"
              style={{ width: '100%', marginTop: 'var(--space-md)' }}
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Submit Test?</h3>
            </div>
            <div className="modal-body">
              <p>You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.</p>
              {answeredCount < questions.length && (
                <p style={{ color: 'var(--color-warning)', marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-sm)' }}>
                  ⚠️ {questions.length - answeredCount} question(s) are unanswered.
                </p>
              )}
              <p style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Once submitted, you cannot change your answers.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Continue Test
              </button>
              <button className="btn btn-success" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting ? <span className="spinner spinner-sm" /> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
