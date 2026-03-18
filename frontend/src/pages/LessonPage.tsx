import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, MessageSquare, ChevronRight,
  Volume2, Loader2, Send, Bot, User as UserIcon,
  ChevronDown, ChevronUp, Lightbulb, GraduationCap
} from 'lucide-react'
import api from '@/lib/api'
import type { Lesson, ChatMessage } from '@/types'

type Tab = 'learn' | 'chat'

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('learn')
  const [expandedVocab, setExpandedVocab] = useState<number | null>(null)
  const [expandedGrammar, setExpandedGrammar] = useState<number | null>(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get(`/lessons/${id}`).then(r => { setLesson(r.data); setLoading(false) }).catch(() => navigate('/dashboard'))
  }, [id, navigate])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg: ChatMessage = { role: 'user', content: chatInput }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const { data } = await api.post('/chat', {
        lesson_id: Number(id),
        messages: [...messages, userMsg],
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, kuch gadbad ho gayi. Please try again.' }]) }
    finally { setChatLoading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )
  if (!lesson?.content) return <div className="text-center text-slate-400 py-20">Lesson content not available.</div>

  const c = lesson.content

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold text-white truncate">{lesson.title}</h1>
          {lesson.title_hindi && <div className="text-slate-400 text-sm font-hindi">{lesson.title_hindi}</div>}
        </div>
        <button onClick={() => navigate(`/quiz/${id}`)}
          className="flex items-center gap-2 btn-primary text-sm py-2 px-4 whitespace-nowrap">
          <GraduationCap className="w-4 h-4" /> Take Quiz
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl mb-6 w-fit">
        {([['learn', BookOpen, 'Learn'], ['chat', MessageSquare, 'Ask Tutor']] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${tab === key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'learn' ? (
          <motion.div key="learn" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Objectives */}
            {c.learning_objectives?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-saffron-400" /> इस पाठ में सीखेंगे -- We'll learn in this lesson
                </h3>
                <ul className="space-y-2">
                  {c.learning_objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300 text-sm font-hindi">
                      <ChevronRight className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />{obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Vocabulary */}
            {c.vocabulary?.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-400" /> Vocabulary ({c.vocabulary.length} words)
                </h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {c.vocabulary.map((v, i) => (
                    <div key={i} className="card overflow-hidden">
                      <button onClick={() => setExpandedVocab(expandedVocab === i ? null : i)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors">
                        <div>
                          <div className="text-white font-semibold">{v.word}</div>
                          <div className="text-slate-400 text-sm font-hindi">{v.translation}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-mono">{v.pronunciation}</span>
                          {expandedVocab === i ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedVocab === i && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 pt-0 border-t border-white/[0.06]">
                              <div className="text-sm text-slate-300 mt-3 italic">"{v.example_sentence}"</div>
                              <div className="text-sm text-slate-500 font-hindi mt-1">{v.example_translation}</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grammar */}
            {c.grammar_points?.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-400" /> Grammar Points
                </h3>
                <div className="space-y-2">
                  {c.grammar_points.map((g, i) => (
                    <div key={i} className="card overflow-hidden">
                      <button onClick={() => setExpandedGrammar(expandedGrammar === i ? null : i)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors">
                        <div className="font-semibold text-white text-sm">{g.rule}</div>
                        {expandedGrammar === i ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </button>
                      <AnimatePresence>
                        {expandedGrammar === i && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 border-t border-white/[0.06]">
                              <p className="text-slate-300 text-sm font-hindi mt-3">{g.explanation_native}</p>
                              {g.examples?.map((ex, j) => (
                                <div key={j} className="mt-2 p-2 bg-white/[0.03] rounded-lg">
                                  <div className="text-sm text-brand-300">{ex.english}</div>
                                  <div className="text-xs text-slate-500 font-hindi">{ex.native}</div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dialogue */}
            {c.dialogue?.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-saffron-400" /> Dialogue
                </h3>
                <div className="card p-5 space-y-3">
                  {c.dialogue.map((line, i) => (
                    <div key={i} className={`flex gap-3 ${line.speaker === 'B' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold font-display
                        ${line.speaker === 'A' ? 'bg-brand-500/20 text-brand-400' : 'bg-saffron-500/20 text-saffron-400'}`}>
                        {line.speaker}
                      </div>
                      <div className={`flex-1 max-w-xs lg:max-w-sm ${line.speaker === 'B' ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-3.5 py-2.5 rounded-xl text-sm
                          ${line.speaker === 'A' ? 'bg-brand-500/10 border border-brand-500/20 text-white' : 'bg-saffron-500/10 border border-saffron-500/20 text-white'}`}>
                          <div>{line.english}</div>
                          <div className="text-xs text-slate-400 font-hindi mt-0.5">{line.native}</div>
                        </div>
                        {line.note && <div className="text-xs text-slate-500 mt-1 px-1">{line.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary & Tips */}
            <div className="grid sm:grid-cols-2 gap-4">
              {c.summary && (
                <div className="card p-5">
                  <h4 className="font-semibold text-white mb-2 text-sm">📝 Summary</h4>
                  <p className="text-slate-300 text-sm font-hindi">{c.summary}</p>
                </div>
              )}
              {c.tips?.length > 0 && (
                <div className="card p-5">
                  <h4 className="font-semibold text-white mb-2 text-sm">💡 Study Tips</h4>
                  <ul className="space-y-1.5">
                    {c.tips.map((tip, i) => (
                      <li key={i} className="text-slate-300 text-sm font-hindi flex items-start gap-1.5">
                        <span className="text-saffron-400 mt-0.5">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex justify-center pt-2 pb-6">
              <button onClick={() => navigate(`/quiz/${id}`)} className="btn-primary flex items-center gap-2 text-base px-8 py-4 glow-blue">
                <GraduationCap className="w-5 h-5" /> Ready? Take the Quiz!
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col h-[60vh] card overflow-hidden">
            {/* Chat header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">AI Tutor</div>
                <div className="text-slate-500 text-xs font-hindi">इस पाठ के बारे में कुछ भी पूछें</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Ask me anything about this lesson!</p>
                  <p className="text-slate-600 text-xs font-hindi mt-1">इस पाठ के बारे में कोई भी सवाल पूछें</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['Explain the grammar', 'Give me more examples', 'How do I use these words?'].map(s => (
                      <button key={s} onClick={() => { setChatInput(s) }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center
                    ${msg.role === 'user' ? 'bg-saffron-500/20' : 'bg-brand-500/20'}`}>
                    {msg.role === 'user' ? <UserIcon className="w-3.5 h-3.5 text-saffron-400" /> : <Bot className="w-3.5 h-3.5 text-brand-400" />}
                  </div>
                  <div className={`max-w-xs lg:max-w-md px-3.5 py-2.5 rounded-xl text-sm text-white
                    ${msg.role === 'user' ? 'bg-saffron-500/15 border border-saffron-500/20' : 'bg-white/[0.06] border border-white/[0.08]'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/[0.06] flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="input-field flex-1 py-2.5 text-sm" placeholder="Ask your tutor..." />
              <button onClick={sendMessage} disabled={!chatInput.trim() || chatLoading}
                className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
