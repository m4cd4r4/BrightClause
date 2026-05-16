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
    <div className="v3">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderRadius: 999,
          boxShadow: 'var(--v3-shadow-md)', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
          background: open ? 'var(--v3-card)' : 'var(--v3-accent)',
          color: open ? 'var(--v3-text-secondary)' : 'var(--v3-accent-fg)',
        }}
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        <span>{open ? 'Close' : 'Ask AI'}</span>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw',
              zIndex: 30, background: 'var(--v3-popover)',
              borderLeft: '1px solid var(--v3-border)',
              display: 'flex', flexDirection: 'column', boxShadow: 'var(--v3-shadow-md)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--v3-border)' }}>
              <div style={{ padding: 8, background: 'rgba(212,168,45,0.12)', borderRadius: 'var(--v3-radius-sm)' }}>
                <Sparkles size={16} color="var(--v3-accent)" />
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Contract Q&amp;A</h3>
                <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', margin: 0 }}>Ask anything about this document</p>
              </div>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                  <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', textAlign: 'center', marginBottom: 8 }}>Try asking:</p>
                  {STARTERS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 12px',
                        borderRadius: 'var(--v3-radius-md)', background: 'var(--v3-card)',
                        border: '1px solid var(--v3-border)', cursor: 'pointer',
                        fontSize: 12, color: 'var(--v3-text-secondary)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    style={{
                      maxWidth: '85%', borderRadius: 'var(--v3-radius-lg)', padding: '10px 14px', fontSize: 13,
                      background: msg.role === 'user' ? 'rgba(212,168,45,0.15)' : 'var(--v3-card)',
                      color: msg.role === 'user' ? 'var(--v3-text-primary)' : 'var(--v3-text-secondary)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--v3-border)',
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</div>

                    {/* Source citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--v3-border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {msg.sources.map((src, j) => (
                          <span
                            key={j}
                            className="v3-mono"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 999,
                              background: 'var(--v3-panel)', fontSize: 11, color: 'var(--v3-text-muted)',
                            }}
                            title={src.content}
                          >
                            <FileText size={12} />
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
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: 'var(--v3-card)', border: '1px solid var(--v3-border)', borderRadius: 'var(--v3-radius-lg)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="animate-bounce" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--v3-text-muted)', animationDelay: '0ms' }} />
                      <span className="animate-bounce" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--v3-text-muted)', animationDelay: '150ms' }} />
                      <span className="animate-bounce" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--v3-text-muted)', animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: 16, borderTop: '1px solid var(--v3-border)' }}>
              <form
                onSubmit={e => {
                  e.preventDefault()
                  sendMessage(input)
                }}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about this contract..."
                  disabled={loading}
                  style={{
                    flex: 1, height: 38, padding: '0 14px',
                    background: 'var(--v3-card)', border: '1px solid var(--v3-border)',
                    borderRadius: 'var(--v3-radius-md)', color: 'var(--v3-text-primary)',
                    fontSize: 13, outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="v3-btn v3-btn-primary"
                  style={{ height: 38, padding: '0 12px', opacity: loading || !input.trim() ? 0.4 : 1 }}
                >
                  {loading ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
