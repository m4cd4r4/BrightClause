'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Loader2, FileText, Sparkles } from 'lucide-react'
import { api, ChatMessage, ChatSource } from '@/lib/api'

interface DisplayMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
}

const STARTERS = [
  'What are the key risks in this contract?',
  'What is the termination policy?',
  'Are there any hidden fees or penalties?',
  'Summarize this contract in plain English',
]

export function ChatPanel({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: DisplayMessage = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await api.chat.ask(documentId, text.trim(), history)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.answer, sources: response.sources },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble answering that. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full
                     shadow-lg transition-all ${
                       open
                         ? 'bg-ink-800 text-ink-400 hover:bg-ink-700'
                         : 'bg-accent text-ink-950 hover:bg-accent-light'
                     }`}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="text-sm font-medium">{open ? 'Close' : 'Ask AI'}</span>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] z-30
                       bg-ink-950 border-l border-ink-800/50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-800/50">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-200">Contract Q&A</h3>
                <p className="text-[11px] text-ink-500">Ask anything about this document</p>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-3 pt-4">
                  <p className="text-xs text-ink-500 text-center mb-4">Try asking:</p>
                  {STARTERS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-ink-900/50 border border-ink-800/30
                                 text-xs text-ink-400 hover:text-ink-200 hover:border-ink-700 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-accent/15 text-ink-200 rounded-br-md'
                        : 'bg-ink-900/60 text-ink-300 border border-ink-800/30 rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                    {/* Source citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-ink-800/30 flex flex-wrap gap-1.5">
                        {msg.sources.map((src, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                       bg-ink-800/50 text-[10px] text-ink-500 font-mono"
                            title={src.content}
                          >
                            <FileText className="w-3 h-3" />
                            {src.page_number != null ? `p.${src.page_number}` : `chunk ${j + 1}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-ink-900/60 border border-ink-800/30 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-ink-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-ink-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-ink-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-ink-800/50">
              <form
                onSubmit={e => {
                  e.preventDefault()
                  sendMessage(input)
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about this contract..."
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-ink-900/50 border border-ink-800/50 rounded-xl
                             text-sm text-ink-200 placeholder-ink-600
                             focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
                             disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-3 py-2.5 bg-accent text-ink-950 rounded-xl
                             hover:bg-accent-light transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
