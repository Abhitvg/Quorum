import { useState, useEffect } from 'react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DictionaryResult {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
}

export default function DictionaryModal({ isOpen, onClose }: DictionaryModalProps) {
  const [word, setWord] = useState('');
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setWord('');
        setResult(null);
        setError('');
      }, 0);
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.trim()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Word not found');
      } else {
        setResult(data[0]);
      }
    } catch {
      setError('Failed to fetch definition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dictionary">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Type a word..."
            value={word}
            onChange={(e) => setWord(e.target.value)}
            autoFocus
          />
        </div>
        <Button type="submit" loading={loading}>
          Search
        </Button>
      </form>

      <div className="min-h-[200px]">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center p-6 glass-noise rounded-xl border border-status-error/20 bg-status-error/5">
            <p className="text-status-error font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{result.word}</h2>
              {result.phonetic && <p className="text-accent-light font-mono text-sm">{result.phonetic}</p>}
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {result.meanings.map((meaning, i) => (
                <div key={i} className="glass-noise p-4 rounded-xl border border-white/5">
                  <h4 className="text-text-muted font-medium italic mb-2">{meaning.partOfSpeech}</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-text-secondary">
                    {meaning.definitions.slice(0, 3).map((def, j) => (
                      <li key={j}>
                        {def.definition}
                        {def.example && (
                          <span className="block mt-1 text-text-muted italic">&quot;{def.example}&quot;</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="text-center text-text-muted mt-10">
            <p>Look up definitions for words you hear.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
