import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Star, Users, Globe, Zap, MessageSquare,
  ArrowRight, ChevronLeft, ChevronRight, Mail, CheckCircle,
  Plane, Map, Calendar, Shield, TrendingUp, Heart
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Featured destinations for carousel
const featuredDestinations = [
  {
    name: 'Santorini, Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format',
    tagline: 'Sunsets that paint the sky'
  },
  {
    name: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format',
    tagline: 'Where culture meets paradise'
  },
  {
    name: 'Tokyo, Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format',
    tagline: 'Future meets ancient tradition'
  },
  {
    name: 'Machu Picchu, Peru',
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&auto=format',
    tagline: 'Mysteries of the ancient world'
  },
  {
    name: 'Maldives',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&auto=format',
    tagline: 'Crystal waters, endless serenity'
  }
];

const stats = [
  { icon: MapPin, value: 195, suffix: '+', label: 'Destinations' },
  { icon: Users, value: 50000, suffix: '+', label: 'Travelers Served' },
  { icon: MessageSquare, value: 1000000, suffix: '+', label: 'AI Queries Answered' },
  { icon: Star, value: 4.9, suffix: '', label: 'Average Rating' }
];

const features = [
  {
    icon: MessageSquare,
    title: 'AI Travel Conversations',
    description: 'Ask anything about travel — visa requirements, best times to visit, local tips, costs. Get instant expert answers.',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    icon: Map,
    title: 'Smart Itinerary Planning',
    description: 'Generate personalized day-by-day itineraries tailored to your budget, interests, and travel style.',
    color: 'from-teal-500 to-green-600'
  },
  {
    icon: Globe,
    title: 'Destination Discovery',
    description: 'Explore hundreds of destinations with detailed information, ratings, and insider recommendations.',
    color: 'from-purple-500 to-pink-600'
  },
  {
    icon: Zap,
    title: 'Real-Time Streaming',
    description: 'Powered by Gemini 2.5 Flash with Google grounding for accurate, up-to-date travel information.',
    color: 'from-orange-500 to-red-600'
  },
  {
    icon: Shield,
    title: 'Trusted Information',
    description: 'All answers come with source citations so you can verify and explore further.',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    icon: Calendar,
    title: 'Any Trip, Any Budget',
    description: 'Whether you\'re a backpacker or luxury traveler, we craft the perfect plan for your needs.',
    color: 'from-rose-500 to-pink-600'
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Adventure Traveler',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&auto=format',
    text: 'TourismAI planned my entire 2-week Japan trip in minutes! The itinerary was incredibly detailed and the visa information was spot-on.',
    rating: 5
  },
  {
    name: 'Marcus Chen',
    role: 'Digital Nomad',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format',
    text: 'I use this for every trip now. The AI answered all my budget travel questions and helped me discover hidden gems I\'d never have found otherwise.',
    rating: 5
  },
  {
    name: 'Priya Sharma',
    role: 'Family Vacationer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format',
    text: 'Planning a family trip to Europe was overwhelming until I found TourismAI. It created a kid-friendly itinerary that everyone loved!',
    rating: 5
  }
];

// Animated counter hook
const useCounter = (target, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const isDecimal = target % 1 !== 0;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = isDecimal
        ? parseFloat((eased * target).toFixed(1))
        : Math.floor(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
};

const StatCard = ({ icon: Icon, value, suffix, label, animating }) => {
  const count = useCounter(value, 2000, animating);
  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
  };

  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/20 flex items-center justify-center">
        <Icon size={24} className="text-blue-400" />
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        {typeof value === 'number' && value % 1 === 0 ? formatNumber(count) : count}{suffix}
      </div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const statsRef = useRef(null);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex(i => (i + 1) % featuredDestinations.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Intersection observer for stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/chat?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await axios.post(`${API_URL}/newsletter/subscribe`, { email });
      setEmailStatus('success');
      setEmail('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Subscription failed. Please try again.';
      setEmailStatus(msg);
    }
  };

  const currentDestination = featuredDestinations[carouselIndex];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${currentDestination.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-blue-400/30 animate-pulse-slow"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 text-sm text-slate-300">
            <Zap size={14} className="text-yellow-400" />
            Powered by Gemini 2.5 Flash AI
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            Your AI-Powered
            <br />
            <span className="gradient-text">Travel Companion</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover destinations, plan perfect itineraries, and get instant answers to all your travel questions — all in one intelligent platform.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="flex glass rounded-2xl p-2 gap-2 shadow-2xl">
              <div className="flex items-center flex-1 px-3">
                <Search size={20} className="text-slate-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask anything about travel... (e.g., Best places to visit in Japan)"
                  className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-sm sm:text-base"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
              >
                Ask AI <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Quick suggestions */}
          <div className="flex flex-wrap justify-center gap-2">
            {['🗼 Paris Guide', '🏝️ Maldives Travel', '🗾 Japan Itinerary', '🌍 Budget Europe'].map(q => (
              <button
                key={q}
                onClick={() => navigate(`/chat?q=${encodeURIComponent(q.slice(3))}`)}
                className="px-3 py-1.5 glass rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/20 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Carousel controls */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
          <button
            onClick={() => setCarouselIndex(i => (i - 1 + featuredDestinations.length) % featuredDestinations.length)}
            className="p-2 glass rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {featuredDestinations.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i)}
                className={`transition-all duration-300 rounded-full ${i === carouselIndex ? 'w-6 h-2 bg-blue-400' : 'w-2 h-2 bg-white/40'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setCarouselIndex(i => (i + 1) % featuredDestinations.length)}
            className="p-2 glass rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Current destination label */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 text-center">
          <p className="text-white font-semibold">{currentDestination.name}</p>
          <p className="text-slate-400 text-sm">{currentDestination.tagline}</p>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-slate-800/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <StatCard key={i} {...stat} animating={statsVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to <span className="gradient-text">Travel Smarter</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with deep travel expertise to make every trip unforgettable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="glass rounded-2xl p-6 card-hover group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Loved by <span className="gradient-text">Travelers Worldwide</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass rounded-2xl p-6 card-hover">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-10 sm:p-16">
            <Plane size={48} className="text-blue-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Your <span className="gradient-text">Adventure?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Ask our AI agent anything about travel and get personalized recommendations instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/chat')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageSquare size={20} />
                Chat with AI Agent
              </button>
              <button
                onClick={() => navigate('/planner')}
                className="px-8 py-4 glass text-white rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Plan My Trip
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-slate-800/50 border-t border-white/5">
        <div className="max-w-xl mx-auto text-center">
          <Mail size={32} className="text-blue-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Stay Inspired</h3>
          <p className="text-slate-400 mb-6">Get travel tips, destination guides, and AI insights delivered to your inbox.</p>

          {emailStatus === 'success' ? (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle size={20} />
              <span>Successfully subscribed! Welcome aboard.</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailStatus(''); }}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
          {emailStatus && emailStatus !== 'success' && (
            <p className="text-red-400 text-sm mt-2">{emailStatus}</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                  <Plane size={16} className="text-white" />
                </div>
                <span className="text-white font-bold">TourismAI</span>
              </div>
              <p className="text-slate-400 text-sm">Your intelligent travel companion powered by Gemini AI.</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Explore</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/destinations" className="hover:text-white transition-colors">Destinations</a></li>
                <li><a href="/planner" className="hover:text-white transition-colors">Trip Planner</a></li>
                <li><a href="/chat" className="hover:text-white transition-colors">AI Agent</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Regions</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><span>Asia & Pacific</span></li>
                <li><span>Europe</span></li>
                <li><span>Americas</span></li>
                <li><span>Africa & Middle East</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Connect</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><span>Powered by Google Gemini</span></li>
                <li><span>Real-time AI responses</span></li>
                <li><span>Source-verified info</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2025 TourismAI. All rights reserved.</p>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Heart size={14} className="text-red-400" />
              <span>Built with AI for travelers everywhere</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
