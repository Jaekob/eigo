import React, { useState, useEffect } from 'react';
import { Lesson, Question, QuestionType } from '../../../types';
import { contentService } from '../../../services/contentService';
import { X, Plus, Trash2, Save, AlertCircle, HelpCircle } from 'lucide-react';
import { audioService } from '../../../services/audioService';

interface LessonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingLesson: Lesson | null;
}

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingLesson
}) => {
  const [name, setName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingLesson) {
      setName(editingLesson.name);
      setTagsInput((editingLesson.tags || []).join(', '));
      setQuestions(JSON.parse(JSON.stringify(editingLesson.questions))); // deep copy
    } else {
      setName('');
      setTagsInput('Custom');
      setQuestions([
        {
          id: `q-${Date.now()}-1`,
          type: 'Flashcard',
          front: '',
          back: ''
        }
      ]);
    }
    setError(null);
  }, [editingLesson, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    audioService.sounds.navHover();
    const newId = `q-${Date.now()}-${questions.length + 1}`;
    setQuestions([
      ...questions,
      {
        id: newId,
        type: 'Flashcard',
        front: '',
        back: ''
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    audioService.sounds.navSelect();
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (index: number, key: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      [key]: value
    };
    setQuestions(updated);
  };

  const handleChoiceChange = (qIndex: number, choiceKey: string, val: string) => {
    const updated = [...questions];
    const choices = updated[qIndex].choices || {};
    choices[choiceKey] = val;
    updated[qIndex] = {
      ...updated[qIndex],
      choices
    };
    setQuestions(updated);
  };

  const handleSave = () => {
    audioService.sounds.bank();
    if (!name.trim()) {
      setError('Lesson name is required.');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one question.');
      return;
    }

    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.front.trim()) {
        setError(`Question #${i + 1} front content cannot be empty.`);
        return;
      }
      if (q.type === 'Flashcard' && !q.back?.trim()) {
        setError(`Question #${i + 1} translation (back) cannot be empty.`);
        return;
      }
      if (q.type === 'MultipleChoice') {
        if (!q.correct) {
          setError(`Question #${i + 1} requires a correct choice letter (A, B, C, or D).`);
          return;
        }
        const choices = q.choices || {};
        if (!choices.A?.trim() || !choices.B?.trim() || !choices.C?.trim() || !choices.D?.trim()) {
          setError(`Question #${i + 1} requires all choices (A, B, C, and D) to be filled.`);
          return;
        }
      }
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const finalizedLesson: Lesson = {
      id: editingLesson?.id || `custom-lesson-${Date.now()}`,
      name: name.trim(),
      tags,
      questions
    };

    contentService.saveCustomLesson(finalizedLesson);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-4xl bg-zinc-900/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-[scaleUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            {editingLesson ? 'Edit Lesson' : 'Create Custom Lesson'}
          </h2>
          <button
            onClick={() => {
              audioService.sounds.navSelect();
              onClose();
            }}
            className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              Lesson Name
            </label>
            <input
              type="text"
              placeholder="e.g. My Custom Animal Words"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Custom, Animals, Grade 5"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold mb-4 animate-[fadeIn_0.3s_forwards]">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Questions Scroll Area */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-white/5 hover:scrollbar-thumb-zinc-400 space-y-4 mb-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2 flex items-center justify-between">
            <span>Questions List ({questions.length})</span>
            <span className="text-[10px] text-zinc-600 font-normal normal-case">
              HTML formatting (e.g. colors, divs) is supported in front texts
            </span>
          </h3>

          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-5 bg-zinc-900/40 border border-zinc-850 rounded-2xl relative space-y-4 group transition-all duration-200 hover:border-zinc-800"
            >
              {/* Question Header & Remove Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-400">
                  CARD #{idx + 1}
                </span>
                <button
                  onClick={() => handleRemoveQuestion(idx)}
                  className="p-1.5 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-900/30 rounded-lg transition-all cursor-pointer"
                  title="Delete Question"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Grid: Card Type, Front, Back */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Card Type
                  </label>
                  <select
                    value={q.type}
                    onChange={(e) => {
                      const type = e.target.value as QuestionType;
                      handleQuestionChange(idx, 'type', type);
                      if (type === 'MultipleChoice' && !q.choices) {
                        handleQuestionChange(idx, 'choices', { A: '', B: '', C: '', D: '' });
                        handleQuestionChange(idx, 'correct', 'A');
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="Flashcard">Flashcard</option>
                    <option value="MultipleChoice">Multiple Choice</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Front (Prompt / Hint)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dog  or  &lt;div style='color:red'&gt;Red&lt;/div&gt;"
                    value={q.front}
                    onChange={(e) => handleQuestionChange(idx, 'front', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Flashcard Back Input */}
              {q.type === 'Flashcard' && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Back (Translation / Answer)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 犬 (Inu)"
                    value={q.back || ''}
                    onChange={(e) => handleQuestionChange(idx, 'back', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}

              {/* MCQ Options */}
              {q.type === 'MultipleChoice' && (
                <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-850/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Multiple Choice Options
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-500">CORRECT CHOICE:</span>
                      <select
                        value={q.correct || 'A'}
                        onChange={(e) => handleQuestionChange(idx, 'correct', e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-yellow-400 font-bold focus:outline-none"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <div key={letter} className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          q.correct === letter ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {letter}
                        </span>
                        <input
                          type="text"
                          placeholder={`Option ${letter}`}
                          value={q.choices?.[letter] || ''}
                          onChange={(e) => handleChoiceChange(idx, letter, e.target.value)}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-zinc-900 pt-4 flex flex-col md:flex-row justify-between gap-3">
          <button
            onClick={handleAddQuestion}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus size={16} /> ADD QUESTION CARD
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                audioService.sounds.navSelect();
                onClose();
              }}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-400 cursor-pointer transition-all"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-650 hover:scale-102 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 transition-all"
            >
              <Save size={16} /> SAVE LESSON
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
