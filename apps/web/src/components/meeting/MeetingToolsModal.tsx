'use client';

import { useState } from 'react';
import Button from '../Button';

interface MeetingToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MeetingToolsModal({ isOpen, onClose }: MeetingToolsModalProps) {
  const [activeTab, setActiveTab] = useState<'yesno' | 'joke' | 'dog' | 'frankfurter' | 'agify' | 'persona'>('yesno');

  // Yes/No State
  const [yesNoResult, setYesNoResult] = useState<{ answer: string; image: string } | null>(null);
  
  // Joke State
  const [joke, setJoke] = useState<{ setup: string; punchline: string } | null>(null);
  const [showPunchline, setShowPunchline] = useState(false);

  // Dog State
  const [dogImage, setDogImage] = useState<string>('');

  // Currency State
  const [rates, setRates] = useState<{ amount: number; base: string; date: string; rates: Record<string, number> } | null>(null);

  // Agify State
  const [agifyName, setAgifyName] = useState('');
  const [agifyResult, setAgifyResult] = useState<{ name: string; age: number; count: number } | null>(null);

  // Persona State
  interface Persona {
    name: { first: string; last: string };
    location: { city: string; country: string };
    email: string;
    phone: string;
    picture: { large: string };
  }
  const [persona, setPersona] = useState<Persona | null>(null);

  const fetchYesNo = async () => {
    try {
      const res = await fetch('https://yesno.wtf/api');
      const data = await res.json();
      setYesNoResult(data);
    } catch {
      // ignore
    }
  };

  const fetchJoke = async () => {
    try {
      setShowPunchline(false);
      const res = await fetch('https://official-joke-api.appspot.com/random_joke');
      const data = await res.json();
      setJoke(data);
    } catch {
      // ignore
    }
  };

  const fetchDog = async () => {
    try {
      const res = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await res.json();
      if (data.status === 'success') {
        setDogImage(data.message);
      }
    } catch {
      // ignore
    }
  };

  const fetchRates = async () => {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD');
      const data = await res.json();
      setRates(data);
    } catch {
      // ignore
    }
  };

  const fetchAgify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agifyName) return;
    try {
      const res = await fetch(`https://api.agify.io?name=${encodeURIComponent(agifyName)}`);
      const data = await res.json();
      setAgifyResult(data);
    } catch {
      // ignore
    }
  };

  const fetchPersona = async () => {
    try {
      const res = await fetch('https://randomuser.me/api/');
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setPersona(data.results[0]);
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-surface-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🧰</span> Meeting Tools
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-white/10 bg-surface-900/50 p-2 flex flex-col gap-1 overflow-y-auto">
            <TabButton active={activeTab === 'yesno'} onClick={() => setActiveTab('yesno')} icon="🎱">Decision Maker</TabButton>
            <TabButton active={activeTab === 'joke'} onClick={() => setActiveTab('joke')} icon="🎭">Break the Ice</TabButton>
            <TabButton active={activeTab === 'dog'} onClick={() => setActiveTab('dog')} icon="🐶">Cheer Up</TabButton>
            <TabButton active={activeTab === 'frankfurter'} onClick={() => { setActiveTab('frankfurter'); fetchRates(); }} icon="💱">Exchange Rates</TabButton>
            <TabButton active={activeTab === 'agify'} onClick={() => setActiveTab('agify')} icon="🎂">Guess Age</TabButton>
            <TabButton active={activeTab === 'persona'} onClick={() => setActiveTab('persona')} icon="👤">Fake Persona</TabButton>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-surface-900">
            {activeTab === 'yesno' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <h3 className="text-lg font-bold text-white">Let the API decide!</h3>
                {yesNoResult && (
                  <div className="animate-fade-in flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={yesNoResult.image} alt={yesNoResult.answer} className="rounded-xl max-h-64 mb-4 object-cover border border-white/10" />
                    <div className="text-4xl font-black uppercase tracking-widest text-accent-light">
                      {yesNoResult.answer}
                    </div>
                  </div>
                )}
                <Button onClick={fetchYesNo}>{yesNoResult ? 'Ask Again' : 'Ask a Yes/No Question'}</Button>
              </div>
            )}

            {activeTab === 'joke' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-white">Need an icebreaker?</h3>
                {joke && (
                  <div className="animate-fade-in w-full bg-surface-800 p-6 rounded-xl border border-white/10">
                    <p className="text-lg text-white font-medium mb-4">{joke.setup}</p>
                    {showPunchline ? (
                      <p className="text-xl text-accent-light font-bold animate-spring-up">{joke.punchline} 🤣</p>
                    ) : (
                      <Button variant="ghost" onClick={() => setShowPunchline(true)}>Reveal Punchline</Button>
                    )}
                  </div>
                )}
                <Button onClick={fetchJoke}>{joke ? 'Another Joke' : 'Get a Joke'}</Button>
              </div>
            )}

            {activeTab === 'dog' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <h3 className="text-lg font-bold text-white">Instant serotonin boost</h3>
                {dogImage && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dogImage} alt="Random Dog" className="rounded-xl max-h-64 object-cover border border-white/10 animate-scale-in" />
                  </>
                )}
                <Button onClick={fetchDog}>{dogImage ? 'More Dogs!' : 'Show me a Dog'}</Button>
              </div>
            )}

            {activeTab === 'frankfurter' && (
              <div className="flex flex-col h-full space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Latest Rates (Base: USD)</h3>
                {!rates ? (
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-surface-700 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-surface-700 rounded"></div>
                        <div className="h-4 bg-surface-700 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(rates.rates).slice(0, 10).map(([currency, rate]) => (
                      <div key={currency} className="bg-surface-800 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="font-bold text-text-secondary">{currency}</span>
                        <span className="text-lg text-white font-mono">{rate.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'agify' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <h3 className="text-lg font-bold text-white">How old does this name sound?</h3>
                <form onSubmit={fetchAgify} className="w-full max-w-xs flex gap-2">
                  <input
                    type="text"
                    value={agifyName}
                    onChange={(e) => setAgifyName(e.target.value)}
                    placeholder="Enter a name..."
                    className="flex-1 bg-surface-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                  />
                  <Button type="submit">Guess</Button>
                </form>
                {agifyResult && (
                  <div className="animate-spring-up bg-surface-800 p-6 rounded-xl border border-white/10 w-full max-w-xs">
                    <div className="text-text-secondary mb-2">Name: <span className="text-white font-bold">{agifyResult.name}</span></div>
                    <div className="text-text-secondary mb-2">Estimated Age: <span className="text-4xl block text-accent-light font-black mt-2">{agifyResult.age || '?'}</span></div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'persona' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <h3 className="text-lg font-bold text-white">Need a fake identity?</h3>
                
                {persona && (
                  <div className="animate-scale-in bg-surface-800 p-6 rounded-xl border border-white/10 w-full max-w-sm flex flex-col items-center text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={persona.picture.large} alt="Persona" className="w-24 h-24 rounded-full border-2 border-accent mb-4" />
                    <h4 className="text-xl font-bold text-white mb-1">{persona.name.first} {persona.name.last}</h4>
                    <p className="text-text-secondary text-sm mb-4">📍 {persona.location.city}, {persona.location.country}</p>
                    <div className="grid grid-cols-2 gap-4 w-full text-left text-sm">
                      <div className="bg-surface-900 p-2 rounded">
                        <span className="text-text-muted block text-xs">Email</span>
                        <span className="text-white truncate block" title={persona.email}>{persona.email}</span>
                      </div>
                      <div className="bg-surface-900 p-2 rounded">
                        <span className="text-text-muted block text-xs">Phone</span>
                        <span className="text-white block">{persona.phone}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button onClick={fetchPersona}>{persona ? 'Generate Another' : 'Generate Persona'}</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all text-left ${
        active 
          ? 'bg-accent/20 text-accent-light border border-accent/30' 
          : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {children}
    </button>
  );
}
