const express = require('express');
const router = express.Router();

// Static destinations data
const destinations = [
  {
    id: 1,
    name: 'Paris, France',
    continent: 'Europe',
    category: 'cities',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format',
    rating: 4.8,
    description: 'The City of Light dazzles with iconic landmarks, world-class cuisine, and unparalleled romantic ambiance.',
    highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame Cathedral'],
    bestTime: 'April - June, September - November',
    avgCost: '$150-200/day'
  },
  {
    id: 2,
    name: 'Bali, Indonesia',
    continent: 'Asia',
    category: 'beach',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format',
    rating: 4.7,
    description: 'A tropical paradise blending stunning beaches, ancient temples, lush rice terraces, and vibrant culture.',
    highlights: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Seminyak Beach'],
    bestTime: 'April - October',
    avgCost: '$50-80/day'
  },
  {
    id: 3,
    name: 'New York, USA',
    continent: 'Americas',
    category: 'cities',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format',
    rating: 4.6,
    description: 'The city that never sleeps offers iconic skylines, diverse neighborhoods, Broadway shows, and endless energy.',
    highlights: ['Times Square', 'Central Park', 'Statue of Liberty'],
    bestTime: 'April - June, September - November',
    avgCost: '$200-300/day'
  },
  {
    id: 4,
    name: 'Machu Picchu, Peru',
    continent: 'Americas',
    category: 'adventure',
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&auto=format',
    rating: 4.9,
    description: 'The ancient Incan citadel set high in the Andes Mountains offers breathtaking views and mysterious history.',
    highlights: ['Inca Trail', 'Sun Gate', 'Huayna Picchu'],
    bestTime: 'May - September',
    avgCost: '$80-120/day'
  },
  {
    id: 5,
    name: 'Santorini, Greece',
    continent: 'Europe',
    category: 'beach',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&auto=format',
    rating: 4.8,
    description: 'Iconic whitewashed buildings, azure domes, and spectacular sunsets over the caldera make this island unforgettable.',
    highlights: ['Oia Village', 'Red Beach', 'Akrotiri Archaeological Site'],
    bestTime: 'June - September',
    avgCost: '$150-250/day'
  },
  {
    id: 6,
    name: 'Tokyo, Japan',
    continent: 'Asia',
    category: 'cities',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&auto=format',
    rating: 4.9,
    description: 'A mesmerizing blend of ultramodern and traditional, from neon-lit skyscrapers to historic temples and tranquil gardens.',
    highlights: ['Shibuya Crossing', 'Senso-ji Temple', 'Mount Fuji Day Trip'],
    bestTime: 'March - May, September - November',
    avgCost: '$100-150/day'
  },
  {
    id: 7,
    name: 'Safari, Kenya',
    continent: 'Africa',
    category: 'adventure',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&auto=format',
    rating: 4.9,
    description: 'Witness the magnificent Great Migration and encounter Africa\'s Big Five in their natural savanna habitat.',
    highlights: ['Masai Mara', 'Amboseli National Park', 'Nairobi National Park'],
    bestTime: 'July - October',
    avgCost: '$200-400/day'
  },
  {
    id: 8,
    name: 'Sydney, Australia',
    continent: 'Oceania',
    category: 'cities',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&auto=format',
    rating: 4.7,
    description: 'Australia\'s harbour city stuns with its iconic Opera House, golden beaches, and laid-back outdoor lifestyle.',
    highlights: ['Sydney Opera House', 'Bondi Beach', 'Harbour Bridge'],
    bestTime: 'September - November, March - May',
    avgCost: '$150-200/day'
  },
  {
    id: 9,
    name: 'Swiss Alps, Switzerland',
    continent: 'Europe',
    category: 'mountains',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&auto=format',
    rating: 4.8,
    description: 'Dramatic mountain peaks, pristine lakes, and charming villages make Switzerland a year-round alpine paradise.',
    highlights: ['Jungfraujoch', 'Matterhorn', 'Lake Geneva'],
    bestTime: 'June - September (summer), December - March (skiing)',
    avgCost: '$200-350/day'
  },
  {
    id: 10,
    name: 'Maldives',
    continent: 'Asia',
    category: 'beach',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&auto=format',
    rating: 4.9,
    description: 'Crystal-clear turquoise waters, pristine white sand, and overwater bungalows define the ultimate tropical luxury escape.',
    highlights: ['Overwater Villas', 'Snorkeling & Diving', 'Bioluminescent Beach'],
    bestTime: 'November - April',
    avgCost: '$300-600/day'
  },
  {
    id: 11,
    name: 'Patagonia, Argentina',
    continent: 'Americas',
    category: 'mountains',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&auto=format',
    rating: 4.8,
    description: 'At the southern tip of South America, dramatic granite towers, glaciers, and pristine wilderness await adventurers.',
    highlights: ['Torres del Paine', 'Perito Moreno Glacier', 'Los Glaciares National Park'],
    bestTime: 'November - March',
    avgCost: '$100-180/day'
  },
  {
    id: 12,
    name: 'Marrakech, Morocco',
    continent: 'Africa',
    category: 'cities',
    image: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=600&auto=format',
    rating: 4.6,
    description: 'A sensory feast of colorful souks, aromatic spices, ornate palaces, and vibrant Djemaa el-Fna square.',
    highlights: ['Djemaa el-Fna', 'Majorelle Garden', 'Bahia Palace'],
    bestTime: 'March - May, September - November',
    avgCost: '$60-100/day'
  }
];

// GET /api/destinations - Get all destinations with optional filters
router.get('/', (req, res) => {
  try {
    let filtered = [...destinations];
    const { search, continent, category } = req.query;

    if (search) {
      const searchLower = String(search).toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchLower) ||
        d.description.toLowerCase().includes(searchLower)
      );
    }

    if (continent && continent !== 'All') {
      filtered = filtered.filter(d => d.continent === continent);
    }

    if (category && category !== 'All') {
      filtered = filtered.filter(d => d.category === category);
    }

    res.json({ destinations: filtered, total: filtered.length });
  } catch (error) {
    console.error('Destinations error:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// GET /api/destinations/:id - Get single destination
router.get('/:id', (req, res) => {
  try {
    const destination = destinations.find(d => d.id === parseInt(req.params.id));
    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    res.json(destination);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch destination' });
  }
});

module.exports = router;
