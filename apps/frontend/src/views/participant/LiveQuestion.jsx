import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../../stores/useGameStore';
import useGameSocket from '../../hooks/useGameSocket';

const optionStyles = [
  { shape: 'change_history', color: 'bg-red-600', iconColor: 'bg-red-800' },
  { shape: 'diamond', color: 'bg-blue-600', iconColor: 'bg-blue-800' },
  { shape: 'circle', color: 'bg-yellow-500', iconColor: 'bg-yellow-700' },
  { shape: 'square', color: 'bg-green-600', iconColor: 'bg-green-800' },
];

export default function LiveQuestion() {
  const [selected, setSelected] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const startTimeRef = useRef(Date.now());
  const score = useGameStore((s) => s.score);
  const currentQuestion = useGameStore((s) => s.currentQuestion);
  const { submitAnswer } = useGameSocket();

  // Timer countdown
  useEffect(() => {
    if (!currentQuestion) return;
    setSelected(null);
    setTextAnswer('');
    setIsSubmitted(false);
    setTimeLeft(currentQuestion.time_limit || 30);
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, (currentQuestion.time_limit || 30) - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [currentQuestion?.event_question_id]);

  const handleAnswer = (answerValue) => {
    // BUG-01 FIX: Use only isSubmitted as guard (not `selected`).
    // `selected` is React state and may still be null on rapid double-click
    // before the state update flushes, allowing double submission.
    // Setting isSubmitted=true synchronously here prevents that race condition.
    if (isSubmitted) return;
    setIsSubmitted(true);
    
    if (currentQuestion?.type === 'multiple_choice') {
      setSelected(answerValue);
    }
    
    const timeTakenMs = Date.now() - startTimeRef.current;
    const optionId = currentQuestion?.type === 'multiple_choice' ? answerValue : null;
    const textAns = currentQuestion?.type !== 'multiple_choice' ? answerValue : null;
    
    submitAnswer(currentQuestion?.event_question_id, optionId, textAns, timeTakenMs);
  };

  // Build options from current question data or use fallback
  const options = (currentQuestion?.options || []).map((opt, i) => ({
    id: opt.id,
    label: opt.text,
    ...optionStyles[i % optionStyles.length],
  }));

  const questionText = currentQuestion?.question_text || 'Waiting for question...';

  const renderQuestionText = () => {
    if (currentQuestion?.type === 'short_answer' && questionText.includes('___')) {
      const parts = questionText.split('___');
      return (
        <span className="inline-flex flex-wrap items-center justify-center gap-y-3 leading-relaxed">
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              <span>{part}</span>
              {i < parts.length - 1 && (
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={isSubmitted}
                  className="mx-2 px-4 py-2 border-b-[4px] border-black bg-gray-100 text-[#7a33ff] font-bold text-center focus:outline-none focus:border-[#7a33ff] min-w-[120px] rounded-t-md transition-colors"
                  placeholder="jawaban..."
                  autoFocus
                />
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }
    return questionText;
  };

  const questionIndex = (currentQuestion?.index ?? 0) + 1;
  const totalQuestions = currentQuestion?.total ?? '?';
  const progressPercent = totalQuestions !== '?' ? ((questionIndex) / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col font-body-md text-black overflow-hidden">
      
      {/* Dark Header */}
      <header className="h-14 md:h-16 shrink-0 bg-[#0A0A0B] flex justify-between items-center px-4 md:px-8 z-20">
        <div className="text-xl md:text-2xl font-black text-[#7a33ff] italic font-display-lg tracking-tighter uppercase">
          INFO-CLASH
        </div>
        <div className="flex items-center gap-4 md:gap-6 text-gray-400">
          <div className="bg-[#1f1f20] px-4 py-1 rounded text-white font-bold text-sm tracking-widest border border-[#353436]">
            SCORE: {score.toLocaleString()}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full">
        
        {/* Progress Bar */}
        <div className="w-full h-2 md:h-3 border-[2px] md:border-[3px] border-black rounded-full mb-4 md:mb-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 h-full bg-black transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Info Row */}
        <div className="flex justify-between items-start mb-4 md:mb-6 shrink-0">
          <div>
            <h2 className="text-sm md:text-xl font-bold tracking-widest uppercase mb-1">
              QUESTION {questionIndex} OF {totalQuestions}
            </h2>
            <p className="text-sm md:text-lg font-medium text-gray-700">
              {currentQuestion?.type?.replace('_', ' ') || 'Multiple Choice'}
            </p>
          </div>
          {/* Timer */}
          <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full border-[2px] md:border-[3px] flex items-center justify-center -mt-1 md:-mt-2 shrink-0 transition-colors ${
            timeLeft <= 5 ? 'border-red-500 text-red-500' : timeLeft <= 10 ? 'border-yellow-500 text-yellow-600' : 'border-gray-300 text-gray-500'
          }`}>
            <span className="text-xl md:text-3xl font-bold">{timeLeft}</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="w-full bg-white border-[4px] md:border-[6px] border-black rounded-lg min-h-[150px] md:min-h-[250px] flex flex-col items-center justify-center p-4 md:p-8 mb-4 md:mb-8 shadow-[0_6px_0_0_#000] md:shadow-[0_8px_0_0_#000]">
          <h3 className="text-xl md:text-3xl text-center font-medium w-full">
            {renderQuestionText()}
          </h3>
        </div>

        {/* Answers Area */}
        {currentQuestion?.type === 'multiple_choice' || !currentQuestion ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
            {options.map((opt) => {
              const isSelected = selected === opt.id;
              const isUnselectedState = selected !== null && !isSelected;
              
              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  disabled={isSubmitted}
                  className={`
                    relative overflow-hidden border-[3px] md:border-[6px] border-black rounded-lg p-2 md:p-4 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start gap-2 md:gap-6 transition-all active:translate-y-1 md:active:translate-y-2 active:shadow-[0_0px_0_0_#000] shadow-[0_4px_0_0_#000] md:shadow-[0_8px_0_0_#000]
                    ${isSelected ? `${opt.color} text-white scale-[0.98]` : ''}
                    ${isUnselectedState ? 'bg-white text-black opacity-40 grayscale' : ''}
                    ${!selected ? `${opt.color} text-white hover:brightness-110` : ''}
                  `}
                >
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 border-[2px] md:border-[3px] border-black/10 ${opt.iconColor}`}>
                    <span className="material-symbols-outlined text-[24px] md:text-[32px] text-white" style={{ fontVariationSettings: "'FILL' 0" }}>
                      {opt.shape}
                    </span>
                  </div>
                  <span className="text-lg md:text-2xl font-bold md:font-medium text-center md:text-left">{opt.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-start gap-4">
            {!questionText.includes('___') && (
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isSubmitted}
                placeholder="Ketik jawaban Anda di sini..."
                className="w-full max-w-2xl bg-white border-[4px] border-black rounded-lg px-6 py-4 text-xl md:text-2xl font-bold focus:border-[#7a33ff] focus:outline-none transition-colors shadow-[0_4px_0_0_#000] text-center"
                autoFocus
              />
            )}
            <button
              onClick={() => handleAnswer(textAnswer)}
              disabled={isSubmitted || !textAnswer.trim()}
              className="mt-4 w-full max-w-2xl bg-[#7a33ff] text-white border-[4px] border-black rounded-lg p-4 md:p-6 text-xl md:text-2xl font-black font-display-lg tracking-wider uppercase transition-all active:translate-y-2 active:shadow-[0_0px_0_0_#000] shadow-[0_6px_0_0_#000] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_6px_0_0_#000]"
            >
              {isSubmitted ? 'JAWABAN TERKIRIM' : 'SUBMIT JAWABAN'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
