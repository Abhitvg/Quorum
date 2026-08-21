'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '../Button';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssistantPanel({ isOpen, onClose }: AssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'assistant', text: 'Hi! I am your meeting assistant. Ask me anything.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [openAIKey, setOpenAIKey] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load API key from local storage if exists
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_key');
    if (savedKey) {
      setTimeout(() => {
        setOpenAIKey(savedKey);
        setUseOpenAI(true);
      }, 0);
    }
  }, []);

  const handleSaveKey = (key: string) => {
    setOpenAIKey(key);
    localStorage.setItem('openai_key', key);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      if (useOpenAI && openAIKey) {
        // Use OpenAI
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: userMessage }],
          })
        });

        if (!res.ok) throw new Error('OpenAI API Error');
        const data = await res.json();
        const reply = data.choices[0].message.content;
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'assistant', text: reply }]);

      } else {
        // Use DuckDuckGo Instant Answers
        // Notice we prefix with cors-anywhere or just try to fetch directly if they support CORS
        // Wait, duckduckgo api doesn't support direct CORS from localhost sometimes, but format=json might.
        // Actually, Wikipedia API is safer for CORS. Let's use Wikipedia if DDG fails.
        let reply = "I couldn't find a quick answer for that.";
        
        try {
          const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
          const data = await res.json();
          if (data.AbstractText) {
            reply = data.AbstractText;
          } else if (data.RelatedTopics && data.RelatedTopics.length > 0 && data.RelatedTopics[0].Text) {
            reply = data.RelatedTopics[0].Text;
          } else {
            throw new Error('DDG Empty');
          }
        } catch {
          // Fallback to Wikipedia
          const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(userMessage)}&origin=*`);
          const wikiData = await wikiRes.json();
          const pages = wikiData.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pageId !== '-1' && pages[pageId].extract) {
            reply = pages[pageId].extract.substring(0, 300) + '...';
          }
        }
        
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'assistant', text: reply }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-backdrop-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[400px] bg-surface-900/95 backdrop-blur-xl border-l border-border-subtle z-40 flex flex-col animate-slide-in-right shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="text-xl">🤖</span> Meeting Assistant
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Toggle Backend */}
          <div className="flex items-center gap-2 bg-surface-800 p-1 rounded-lg">
            <button
              onClick={() => setUseOpenAI(false)}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${!useOpenAI ? 'bg-surface-600 text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
            >
              Public APIs
            </button>
            <button
              onClick={() => setUseOpenAI(true)}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${useOpenAI ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
            >
              OpenAI
            </button>
          </div>

          {useOpenAI && (
            <div className="mt-3">
              <input
                type="password"
                placeholder="Enter OpenAI API Key"
                value={openAIKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                className="w-full bg-surface-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-accent text-white rounded-br-sm' 
                    : 'bg-surface-800 text-text-secondary rounded-bl-sm border border-white/5'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-800 text-text-secondary rounded-2xl rounded-bl-sm px-4 py-2 text-sm flex gap-1">
                <span className="animate-bounce">.</span><span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span><span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border-subtle bg-surface-800/50">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-surface-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent"
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="!px-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
