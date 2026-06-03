import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Star, MessageSquare, Filter, X,
  Globe, Mountain, Waves, Building2, Compass, TreePine
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CONTINENTS = ['All', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania'];
const CATEGORIES = ['All', 'beach', 'mountains', 'cities', 'adventure'];

const CATEGORY_ICONS = {
  beach: Waves,
  mountains: Mountain,
  cities: Building2,
  adventure: Compass,
};

const CATEGORY_LABELS = {
  beach: 'Beach',
  mountains: 'Mountains',
  cities: 'Cities',
  adventure: 'Adventure',
};

const CATEGORY_COLORS = {
  beach: 'from-cyan-500 to-blue-500',
  mountains: 'from-slate-500 to-slate-700',
  cities: 'from-purple-500 to-indigo-600',
  adventure: 'from-orange-500 to-red-500',
};

const SkeletonCard = () => (
  <div className="glass rounded-2xl overflow-hidden">
    <div className="shimmer h-52 w-full" />
    <div className="p-5">
      <div className="shimmer h-5 w-3/4 rounded mb-2" />
      <div className="shimmer h-3 w-full rounded mb-1" />
      <div className="shimmer h-3 w-2/3 rounded mb-4" />
      <div className="shimmer h-9 w-full rounded-lg" />
    </div>
  </div>
);

const DestinationCard = ({ destination, onAskAI }) => {
  const CategoryIcon = CATEGORY_ICONS[destination.category] || Globe;
  const categoryColor = CATEGORY_COLORS[destination.category] || 'from-blue-500 to-teal-500';

  return (
    <div className="glass rounded-2xl overflow-hidden card-hover group">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

        {/* Category badge */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${categoryColor} text-white text-xs font-semibold`}>
          <CategoryIcon size={12} />
          {CATEGORY_LABELS[destination.category] || destination.category}
        </div>

        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full glass">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-white text-xs font-semibold">{destination.rating}</span>
        </div>

        {/* Location at bottom */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          <MapPin size={13} className="text-blue-300" />
          <span className="text-white text-sm font-medium">{destination.continent}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-300 transition-colors">
          {destination.name}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-3 line-clamp-2">
          {destination.description}
        </p>

        {/* Highlights */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {destination.highlights?.slice(0, 2).map((h, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-700/60 rounded-full text-xs text-slate-300">
              {h}
            </span>
          ))}
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <span>Best: {destination.bestTime}</span>
          <span className="text-teal-400">{destination.avgCost}</span>
        </div>

        {/* Ask AI button */}
        <button
          onClick={() => onAskAI(destination)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg"
        >
          <MessageSquare size={15} />
          Ask AI About {destination.name.split(',')[0]}
        </button>
      </div>
    </div>
  );
};

const DestinationsPage = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('All');
  const [category, setCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (continent !== 'All') params.continent = continent;
      if (category !== 'All') params.category = category;

      const res = await axios.get(`${API_URL}/destinations`, { params });
      setDestinations(res.data.destinations);
    } catch (err) {
      setError('Failed to load destinations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, continent, category]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(fetchDestinations, 300);
    return () => clearTimeout(timer);
  }, [fetchDestinations]);

  const handleAskAI = (destination) => {
    const query = `Tell me everything about visiting ${destination.name} — best things to do, when to go, travel tips, costs, and must-see attractions.`;
    navigate(`/chat?q=${encodeURIComponent(query)}`);
  };

  const clearFilters = () => {
    setSearch('');
    setContinent('All');
    setCategory('All');
  };

  const hasActiveFilters = search || continent !== 'All' || category !== 'All';

  return (
    <div className="min-h-screen pt-16 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-800/80 to-transparent py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 text-sm text-slate-300">
            <Globe size={14} className="text-blue-400" />
            {destinations.length} Destinations Available
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Explore <span className="gradient-text">Destinations</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Discover amazing places around the world. Click "Ask AI" to get personalized information about any destination.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 glass rounded-xl px-4 py-3">
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destinations..."
                className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                showFilters || continent !== 'All' || category !== 'All'
                  ? 'bg-blue-600 text-white'
                  : 'glass text-slate-300 hover:text-white'
              }`}
            >
              <Filter size={16} />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
              )}
            </button>
          </div>

          {/* Filter options */}
          {showFilters && (
            <div className="glass rounded-xl p-4 space-y-4 animate-fade-in">
              {/* Continent filters */}
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">Continent</p>
                <div className="flex flex-wrap gap-2">
                  {CONTINENTS.map(c => (
                    <button
                      key={c}
                      onClick={() => setContinent(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        continent === c
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category filters */}
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                        category === c
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {c === 'All' ? 'All Types' : CATEGORY_LABELS[c] || c}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchDestinations}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl">
            <TreePine size={48} className="text-slate-500 mx-auto mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">No destinations found</h3>
            <p className="text-slate-400 mb-4">Try adjusting your search or filter criteria.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-4">
              Showing <span className="text-white font-medium">{destinations.length}</span> destinations
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {destinations.map((dest) => (
                <DestinationCard
                  key={dest.id}
                  destination={dest}
                  onAskAI={handleAskAI}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DestinationsPage;
