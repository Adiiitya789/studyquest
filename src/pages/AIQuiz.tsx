import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Brain, Sparkles, Coins, CheckCircle, XCircle } from 'lucide-react';

// ⚠️ SECURITY NOTE: VITE_-prefixed env vars are inlined into the built JS bundle
// at build time, so this Gemini key ships to every visitor's browser — anyone
// can read it from devtools' Network tab or by viewing the bundled JS source,
// then use it to run up usage on your Gemini quota/billing. Fine for a
// hackathon demo with a throwaway/free-tier key; before a real launch, move
// this call behind a server-side proxy (e.g. a Supabase Edge Function) that
// holds the key and never sends it to the client.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
};

export default function AIQuiz() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function generateQuiz() {
    if (!notes.trim() || notes.length < 50) {
      setError('Please paste at least a few sentences of notes!');
      return;
    }
    
    setLoading(true);
    setError('');
    setQuiz(null);
    setUserAnswers({});
    setSubmitted(false);

    try {
      // 1. Setup the AI Model
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

      // 2. The Secret JSON Prompt
      const prompt = `
        You are a strict JSON quiz generator. Read these study notes and generate a 3-question multiple-choice quiz testing the core concepts.
        You must reply ONLY with a valid JSON array in this exact format, with no markdown formatting, no backticks, and no extra text:
        [
          {
            "question": "What is...",
            "options": ["A", "B", "C", "D"],
            "correctIndex": 0
          }
        ]
        
        Study Notes:
        ${notes}
      `;

      // 3. Ask Gemini
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Clean up the text just in case Gemini added markdown code blocks
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedQuiz = JSON.parse(cleanJson) as Question[];
      setQuiz(parsedQuiz);
    } catch (err: any) {
      console.error("AI Error:", err);
      setError('The AI got confused reading your notes. Try again!');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(qIndex: number, optIndex: number) {
    if (submitted) return;
    setUserAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  }

  async function submitQuiz() {
    if (Object.keys(userAnswers).length !== quiz?.length) {
      setError('Please answer all questions first!');
      return;
    }
    setError('');
    setSubmitted(true);

    // Calculate Score
    let correctCount = 0;
    if (quiz) {
      quiz.forEach((q, i) => {
        if (userAnswers[i] === q.correctIndex) correctCount++;
      });
    }

    // The database awards the coins server-side (see submit_quiz_result in the
    // migrations) based on the score we report — it no longer trusts a
    // client-computed coin total written straight to profiles.coins.
    if (user && quiz) {
      const { error } = await supabase.rpc('submit_quiz_result', {
        p_correct: correctCount,
        p_total: quiz.length,
      });
      if (error) {
        console.error('Failed to submit quiz result:', error.message);
      } else {
        await refreshProfile(); // Update coin balance in UI instantly
      }
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto pb-20">
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-300">
          <Brain size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Loot Quiz</h1>
          <p className="text-sm text-coffee-400">Turn your notes into cold, hard coins.</p>
        </div>
      </div>

      {!quiz ? (
        <div className="glass-card p-6">
          <label className="block text-sm font-semibold text-white mb-2">Paste your study notes here:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g., Mitochondria is the powerhouse of the cell..."
            className="w-full h-48 px-4 py-3 rounded-xl bg-coffee-800/50 border border-white/5 text-white placeholder-coffee-500 focus:outline-none focus:border-primary-500/50 resize-none mb-4"
          />
          
          {error && <p className="text-sm text-rose-400 mb-4">{error}</p>}

          <button
            onClick={generateQuiz}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-[#f1d6b9] text-coffee-900 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="animate-pulse">AI is reading your notes...</span>
            ) : (
              <>
                <Sparkles size={20} /> Generate Loot Quiz
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* The Quiz Render */}
          {quiz.map((q, qIndex) => (
            <div key={qIndex} className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-4">{qIndex + 1}. {q.question}</h3>
              <div className="space-y-2">
                {q.options.map((opt, optIndex) => {
                  const isSelected = userAnswers[qIndex] === optIndex;
                  const isCorrect = optIndex === q.correctIndex;
                  
                  // Styling logic for after submission
                  let btnClass = "border-white/5 text-coffee-300 hover:bg-white/5";
                  if (isSelected) btnClass = "border-primary-500 bg-primary-500/10 text-primary-300";
                  
                  if (submitted) {
                    if (isCorrect) {
                      btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                    } else if (isSelected && !isCorrect) {
                      btnClass = "border-rose-500 bg-rose-500/10 text-rose-400";
                    } else {
                      btnClass = "border-white/5 text-coffee-500 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleSelectOption(qIndex, optIndex)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${btnClass}`}
                    >
                      <span>{opt}</span>
                      {submitted && isCorrect && <CheckCircle size={18} className="text-emerald-500" />}
                      {submitted && isSelected && !isCorrect && <XCircle size={18} className="text-rose-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-rose-400 text-center">{error}</p>}

          {!submitted ? (
            <button
              onClick={submitQuiz}
              className="w-full py-4 rounded-xl bg-[#f1d6b9] text-coffee-900 font-bold hover:brightness-95 transition-all"
            >
              Submit Answers
            </button>
          ) : (
            <div className="glass-card p-6 text-center animate-slide-up border-primary-500/30">
              <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
              
              {Object.values(userAnswers).filter((ans, i) => ans === quiz[i].correctIndex).length > 0 ? (
                <div>
                  <p className="text-emerald-400 font-medium mb-4">
                    You got {Object.values(userAnswers).filter((ans, i) => ans === quiz[i].correctIndex).length} / {quiz.length} correct!
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-lg mb-4">
                    <Coins size={20} /> +{Object.values(userAnswers).filter((ans, i) => ans === quiz[i].correctIndex).length} Coin{Object.values(userAnswers).filter((ans, i) => ans === quiz[i].correctIndex).length > 1 ? 's' : ''} Added!
                  </div>
                </div>
              ) : (
                <p className="text-coffee-400 mb-6">0 / {quiz.length} correct. Review your notes and try again!</p>
              )}
              
              <button
                onClick={() => setQuiz(null)}
                className="px-6 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
              >
                Try Another Topic
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}