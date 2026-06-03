import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MapPin, Calendar, DollarSign, Heart, Loader, AlertCircle,
  CheckCircle, Plane, Sun, Sunset, Moon, Coffee, Navigation,
  RotateCcw, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const INTEREST_OPTIONS = [
  'Culture & History', 'Food & Cuisine', 'Adventure & Sports', 'Nature & Wildlife',
  'Art & Museums', 'Shopping', 'Beach & Relaxation', 'Nightlife',
  'Photography', 'Hiking', 'Local Experiences', 'Architecture'
];

const InputField = ({ label, icon: Icon, children, required }) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
      <Icon size={15} className="text-blue-400" />
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const DaySection = ({ content }) => {
  // Extract day number if present in content
  return (
    <div className="glass rounded-xl p-5 border-l-4 border-blue-500 animate-fade-in">
      <div className="markdown-content text-sm">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

const TripPlannerPage = () => {
  const [form, setForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    interests: []
  });
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [generationError, setGenerationError] = useState('');
  const abortControllerRef = useRef(null);
  const itineraryRef = useRef(null);

  const scrollToItinerary = useCallback(() => {
    itineraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (streamingContent) scrollToItinerary();
  }, [streamingContent, scrollToItinerary]);

  const validate = () => {
    const newErrors = {};
    if (!form.destination.trim()) newErrors.destination = 'Destination is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    else if (form.startDate && new Date(form.endDate) < new Date(form.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!form.budget.trim()) newErrors.budget = 'Budget is required';
    if (form.interests.length === 0) newErrors.interests = 'Please select at least one interest';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInterestToggle = (interest) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
    if (errors.interests) setErrors(prev => ({ ...prev, interests: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsGenerating(true);
    setItinerary('');
    setStreamingContent('');
    setGenerationError('');

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/planner/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          budget: form.budget,
          interests: form.interests.join(', ')
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate itinerary');
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
                setStreamingContent(accumulatedContent);
              } else if (data.type === 'done') {
                setItinerary(data.fullContent || accumulatedContent);
                setStreamingContent('');
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseErr) {
              // ignore
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setGenerationError(err.message || 'Failed to generate itinerary. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const resetPlanner = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setItinerary('');
    setStreamingContent('');
    setGenerationError('');
    setIsGenerating(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const displayContent = streamingContent || itinerary;
  const tripDays = form.startDate && form.endDate
    ? Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className="min-h-screen pt-16 pb-16 px-4">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 text-sm text-slate-300">
          <Sparkles size={14} className="text-yellow-400" />
          AI-Powered Itinerary Generator
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
          Plan Your <span className="gradient-text">Dream Trip</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Tell us where you want to go and we'll create a personalized day-by-day itinerary just for you.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Form */}
        {!displayContent && !isGenerating && (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
            {/* Destination */}
            <InputField label="Destination" icon={MapPin} required>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, destination: e.target.value }));
                  if (errors.destination) setErrors(prev => ({ ...prev, destination: '' }));
                }}
                placeholder="e.g., Tokyo, Japan"
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors ${
                  errors.destination ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.destination && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.destination}
                </p>
              )}
            </InputField>

            {/* Date range */}
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Start Date" icon={Calendar} required>
                <input
                  type="date"
                  value={form.startDate}
                  min={today}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, startDate: e.target.value }));
                    if (errors.startDate) setErrors(prev => ({ ...prev, startDate: '' }));
                  }}
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white outline-none focus:border-blue-500 transition-colors [color-scheme:dark] ${
                    errors.startDate ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.startDate && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.startDate}
                  </p>
                )}
              </InputField>

              <InputField label="End Date" icon={Calendar} required>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || today}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, endDate: e.target.value }));
                    if (errors.endDate) setErrors(prev => ({ ...prev, endDate: '' }));
                  }}
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white outline-none focus:border-blue-500 transition-colors [color-scheme:dark] ${
                    errors.endDate ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.endDate && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.endDate}
                  </p>
                )}
              </InputField>
            </div>

            {/* Trip duration indicator */}
            {tripDays > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Calendar size={16} className="text-blue-400" />
                <span className="text-blue-300 text-sm">
                  {tripDays} day{tripDays !== 1 ? 's' : ''} trip
                </span>
              </div>
            )}

            {/* Budget */}
            <InputField label="Budget" icon={DollarSign} required>
              <input
                type="text"
                value={form.budget}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, budget: e.target.value }));
                  if (errors.budget) setErrors(prev => ({ ...prev, budget: '' }));
                }}
                placeholder="e.g., $2000 total, $150/day, budget backpacker"
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors ${
                  errors.budget ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.budget && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.budget}
                </p>
              )}
            </InputField>

            {/* Interests */}
            <InputField label="Interests & Activities" icon={Heart} required>
              <div className="flex flex-wrap gap-2 mb-2">
                {INTEREST_OPTIONS.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      form.interests.includes(interest)
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              {form.interests.length > 0 && (
                <p className="text-slate-500 text-xs">
                  Selected: {form.interests.join(', ')}
                </p>
              )}
              {errors.interests && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.interests}
                </p>
              )}
            </InputField>

            {/* Submit */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-xl"
            >
              <Plane size={22} />
              Generate My Itinerary
            </button>
          </form>
        )}

        {/* Generating state */}
        {isGenerating && !streamingContent && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center border border-white/10">
              <Loader size={36} className="text-blue-400 animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Crafting Your Itinerary...</h3>
            <p className="text-slate-400">
              Our AI is designing the perfect trip to {form.destination}. This takes a few seconds.
            </p>
          </div>
        )}

        {/* Streaming / Generated Itinerary */}
        {displayContent && (
          <div ref={itineraryRef} className="animate-fade-in">
            {/* Itinerary header */}
            <div className="glass rounded-2xl p-6 mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isGenerating ? (
                    <Loader size={18} className="text-blue-400 animate-spin" />
                  ) : (
                    <CheckCircle size={18} className="text-green-400" />
                  )}
                  <span className="text-white font-bold text-xl">
                    {form.destination} Itinerary
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  {form.startDate} → {form.endDate} • {tripDays} days • {form.budget}
                </p>
              </div>
              {!isGenerating && (
                <button
                  onClick={resetPlanner}
                  className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  <RotateCcw size={15} />
                  Plan Another
                </button>
              )}
            </div>

            {/* Itinerary content */}
            <div className="glass rounded-2xl p-6 sm:p-8">
              <div className={`markdown-content ${isGenerating ? 'streaming-cursor' : ''}`}>
                <ReactMarkdown>{displayContent}</ReactMarkdown>
              </div>

              {isGenerating && (
                <div className="flex items-center gap-2 mt-4 text-slate-400 text-sm">
                  <Loader size={14} className="animate-spin" />
                  Generating your itinerary...
                </div>
              )}
            </div>

            {/* Action buttons after generation */}
            {!isGenerating && itinerary && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={resetPlanner}
                  className="flex items-center gap-2 px-6 py-3 glass rounded-xl text-slate-300 hover:text-white font-medium transition-colors"
                >
                  <RotateCcw size={16} />
                  Plan Another Trip
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(itinerary)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle size={16} />
                  Copy Itinerary
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {generationError && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-fade-in">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 text-sm">{generationError}</p>
              <button
                onClick={() => { setGenerationError(''); resetPlanner(); }}
                className="mt-2 flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300"
              >
                <RotateCcw size={13} />
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripPlannerPage;
