import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send, Copy, Share2, RotateCcw, Bot, User, Zap,
  CheckCircle, AlertCircle, Loader, MessageSquare, Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SUGGESTED_QUESTIONS = [
  'What are the top 10 must-visit places in Japan?',
  'What visa do I need for Europe as an Indian citizen?',
  'What is the best time to visit Bali?',
  'How much does a 2-week trip to Southeast Asia cost?',
  'What are hidden gems in Paris most tourists miss?',
  'Give me safety tips for solo female travel in Morocco',
];

const TypingIndicator = () => (
  <div className="flex items-end gap-3 animate-fade-in">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center flex-shrink-0">
      <Bot size={16} className="text-white" />
    </div>
    <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1.5 items-center h-5">
        <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
        <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
        <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
      </div>
    </div>
  </div>
);

const MessageBubble = ({ message, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopy && onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TourismAI Answer',
        text: message.content
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className={`flex items-end gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-teal-400'
      }`}>
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] group ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
            : 'glass text-slate-100 rounded-bl-sm'
        } ${message.streaming ? 'streaming-cursor' : ''}`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content text-sm">
              <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* AI message actions */}
        {!isUser && !message.streaming && message.content && (
          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              {copied ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Share2 size={12} />
              Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const sessionId = useRef(`session_${Date.now()}`);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle initial query from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && messages.length === 0) {
      setInput(query);
      // Auto-submit after a brief delay
      setTimeout(() => {
        sendMessage(query);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || isStreaming) return;

    setInput('');
    setError('');

    const userMessage = { role: 'user', content: text, id: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    const aiMessageId = Date.now() + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: aiMessageId, streaming: true }]);
    setIsStreaming(true);

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          sessionId: sessionId.current
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                accumulatedContent += data.content;
                setMessages(prev => prev.map(m =>
                  m.id === aiMessageId
                    ? { ...m, content: accumulatedContent, streaming: true }
                    : m
                ));
              } else if (data.type === 'done') {
                setMessages(prev => prev.map(m =>
                  m.id === aiMessageId
                    ? { ...m, content: data.fullContent || accumulatedContent, streaming: false }
                    : m
                ));
              } else if (data.type === 'error') {
                setError(data.message || 'An error occurred');
                setMessages(prev => prev.filter(m => m.id !== aiMessageId));
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== aiMessageId));
      } else {
        setError(err.message || 'Failed to connect to AI service. Please try again.');
        setMessages(prev => prev.filter(m => m.id !== aiMessageId));
      }
    } finally {
      setIsStreaming(false);
      setMessages(prev => prev.map(m =>
        m.id === aiMessageId ? { ...m, streaming: false } : m
      ));
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError('');
    sessionId.current = `session_${Date.now()}`;
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.slice(0, prev.findIndex(m => m.id === lastUserMsg.id) + 1));
      sendMessage(lastUserMsg.content);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      {/* Header */}
      <div className="glass-dark border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">AI Travel Agent</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-slate-400">Gemini 2.5 Flash • Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Trash2 size={14} />
                <span className="hidden sm:block">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="py-12 text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center mb-6 border border-white/10">
                <Zap size={36} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ask me anything about travel</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                I'm your AI travel expert. Ask about destinations, visa requirements, itineraries, costs, and more.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="glass rounded-xl px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all group"
                  >
                    <MessageSquare size={14} className="inline-block mr-2 text-blue-400 group-hover:text-blue-300" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <TypingIndicator />
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-fade-in">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm flex-1">{error}</p>
              <button
                onClick={retryLastMessage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
              >
                <RotateCcw size={14} />
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="glass-dark border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <div className={`flex items-end gap-2 glass rounded-2xl p-2 transition-all ${
            isStreaming ? 'opacity-75' : ''
          }`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about destinations, visa, weather, costs, itineraries..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none resize-none text-sm px-3 py-2 min-h-[40px] max-h-32"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                input.trim() && !isStreaming
                  ? 'bg-gradient-to-br from-blue-600 to-teal-500 text-white hover:opacity-90 shadow-lg'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isStreaming ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="text-slate-500 text-xs text-center mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
