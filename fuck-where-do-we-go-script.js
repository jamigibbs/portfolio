// Travel Cost Estimator - Main Script
// ====================================

// Global variables
let map;
let markers = [];
let destinationsData = [];
let selectedHomeCity = null;
let travelMode = 'drive';
let dateType = 'specific';
let travelRadiusLayer = null; // For visualizing travel radius on map
let homeMarker = null; // Marker for home city
let selectedMonths = [];
let maxTravelTime = 3; // hours
let hasSearched = false;
let lastSearchBounds = null;

// Cache for API responses
const apiCache = {
    weather: {},
    currency: {},
    advisories: {},
    flights: {},
    driving: {},
    geonames: {}
};

// ============================================
// API CONFIGURATION
// ============================================
// APIs that DON'T need keys (work immediately):
// - Open-Meteo (weather) - unlimited, no key
// - Frankfurter (currency) - unlimited, no key
// - US State Dept (travel advisories) - free, no key
// - Wikivoyage (descriptions) - no key needed

// APIs that NEED keys (set up account at these sites):
const API_KEYS = {
    // Amadeus: Get free key at https://developers.amadeus.com (2000 calls/month)
    amadeus: {
        clientId: '7fvKA80GShJnStxs1wjCJO2gGRr3q7a0',
        clientSecret: 'hKXHWj1xB3fVAseN'
    },
    // GeoNames: Register free at https://www.geonames.org/login (30k credits/day)
    geonames: {
        username: 'dnfisher'
    },
    // Optional: OpenRouteService for driving routes: https://openrouteservice.org
    openRouteService: 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA4ZGYyZTM0NWUwODRjMmE5Yjg0NThkOTdkMTcxOGE5IiwiaCI6Im11cm11cjY0In0=',   // Free key, 2000 calls/day
    // TravelTime: Get free key at https://traveltime.com (up to 4 hour isochrones)
    travelTime: {
        appId: 'b0f55724',
        apiKey: 'e6e93cfb49a93efec0c59d018ed6e5b8'
    }
};

// Country data for currency and safety lookups
const COUNTRY_DATA = {
    // North America
    'USA': { currency: 'USD', iso2: 'US', iso3: 'USA' },
    'Canada': { currency: 'CAD', iso2: 'CA', iso3: 'CAN' },
    'Mexico': { currency: 'MXN', iso2: 'MX', iso3: 'MEX' },
    // Central America
    'Belize': { currency: 'BZD', iso2: 'BZ', iso3: 'BLZ' },
    'Guatemala': { currency: 'GTQ', iso2: 'GT', iso3: 'GTM' },
    'Honduras': { currency: 'HNL', iso2: 'HN', iso3: 'HND' },
    'El Salvador': { currency: 'USD', iso2: 'SV', iso3: 'SLV' },
    'Nicaragua': { currency: 'NIO', iso2: 'NI', iso3: 'NIC' },
    'Costa Rica': { currency: 'CRC', iso2: 'CR', iso3: 'CRI' },
    'Panama': { currency: 'USD', iso2: 'PA', iso3: 'PAN' },
    // Caribbean
    'Dominican Republic': { currency: 'DOP', iso2: 'DO', iso3: 'DOM' },
    'Bahamas': { currency: 'BSD', iso2: 'BS', iso3: 'BHS' },
    'Cuba': { currency: 'CUP', iso2: 'CU', iso3: 'CUB' },
    'Jamaica': { currency: 'JMD', iso2: 'JM', iso3: 'JAM' },
    'Trinidad and Tobago': { currency: 'TTD', iso2: 'TT', iso3: 'TTO' },
    'Barbados': { currency: 'BBD', iso2: 'BB', iso3: 'BRB' },
    'Aruba': { currency: 'AWG', iso2: 'AW', iso3: 'ABW' },
    'Curacao': { currency: 'ANG', iso2: 'CW', iso3: 'CUW' },
    // South America
    'Colombia': { currency: 'COP', iso2: 'CO', iso3: 'COL' },
    'Peru': { currency: 'PEN', iso2: 'PE', iso3: 'PER' },
    'Argentina': { currency: 'ARS', iso2: 'AR', iso3: 'ARG' },
    'Brazil': { currency: 'BRL', iso2: 'BR', iso3: 'BRA' },
    'Chile': { currency: 'CLP', iso2: 'CL', iso3: 'CHL' },
    'Ecuador': { currency: 'USD', iso2: 'EC', iso3: 'ECU' },
    'Bolivia': { currency: 'BOB', iso2: 'BO', iso3: 'BOL' },
    'Uruguay': { currency: 'UYU', iso2: 'UY', iso3: 'URY' },
    'Paraguay': { currency: 'PYG', iso2: 'PY', iso3: 'PRY' },
    'Venezuela': { currency: 'VES', iso2: 'VE', iso3: 'VEN' },
    // Europe
    'UK': { currency: 'GBP', iso2: 'GB', iso3: 'GBR' },
    'France': { currency: 'EUR', iso2: 'FR', iso3: 'FRA' },
    'Spain': { currency: 'EUR', iso2: 'ES', iso3: 'ESP' },
    'Italy': { currency: 'EUR', iso2: 'IT', iso3: 'ITA' },
    'Germany': { currency: 'EUR', iso2: 'DE', iso3: 'DEU' },
    'Netherlands': { currency: 'EUR', iso2: 'NL', iso3: 'NLD' },
    'Portugal': { currency: 'EUR', iso2: 'PT', iso3: 'PRT' },
    'Ireland': { currency: 'EUR', iso2: 'IE', iso3: 'IRL' },
    'Iceland': { currency: 'ISK', iso2: 'IS', iso3: 'ISL' },
    'Belgium': { currency: 'EUR', iso2: 'BE', iso3: 'BEL' },
    'Austria': { currency: 'EUR', iso2: 'AT', iso3: 'AUT' },
    'Switzerland': { currency: 'CHF', iso2: 'CH', iso3: 'CHE' },
    'Greece': { currency: 'EUR', iso2: 'GR', iso3: 'GRC' },
    'Croatia': { currency: 'EUR', iso2: 'HR', iso3: 'HRV' },
    'Czech Republic': { currency: 'CZK', iso2: 'CZ', iso3: 'CZE' },
    'Poland': { currency: 'PLN', iso2: 'PL', iso3: 'POL' },
    'Hungary': { currency: 'HUF', iso2: 'HU', iso3: 'HUN' },
    'Sweden': { currency: 'SEK', iso2: 'SE', iso3: 'SWE' },
    'Norway': { currency: 'NOK', iso2: 'NO', iso3: 'NOR' },
    'Denmark': { currency: 'DKK', iso2: 'DK', iso3: 'DNK' },
    'Finland': { currency: 'EUR', iso2: 'FI', iso3: 'FIN' },
    'Turkey': { currency: 'TRY', iso2: 'TR', iso3: 'TUR' },
    'Morocco': { currency: 'MAD', iso2: 'MA', iso3: 'MAR' },
    // Asia
    'Japan': { currency: 'JPY', iso2: 'JP', iso3: 'JPN' },
    'Thailand': { currency: 'THB', iso2: 'TH', iso3: 'THA' },
    'Indonesia': { currency: 'IDR', iso2: 'ID', iso3: 'IDN' },
    'Vietnam': { currency: 'VND', iso2: 'VN', iso3: 'VNM' },
    'Philippines': { currency: 'PHP', iso2: 'PH', iso3: 'PHL' },
    'South Korea': { currency: 'KRW', iso2: 'KR', iso3: 'KOR' },
    'Singapore': { currency: 'SGD', iso2: 'SG', iso3: 'SGP' },
    'Malaysia': { currency: 'MYR', iso2: 'MY', iso3: 'MYS' },
    // Oceania
    'Australia': { currency: 'AUD', iso2: 'AU', iso3: 'AUS' },
    'New Zealand': { currency: 'NZD', iso2: 'NZ', iso3: 'NZL' },
    'Fiji': { currency: 'FJD', iso2: 'FJ', iso3: 'FJI' }
};

// ============================================
// OPEN-METEO WEATHER API (No key needed!)
// ============================================
async function fetchWeatherOpenMeteo(lat, lon, startDate, endDate) {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)},${startDate}`;
    if (apiCache.weather[cacheKey]) {
        return apiCache.weather[cacheKey];
    }

    // Check if the trip is within forecast range (16 days)
    const today = new Date();
    const tripStart = new Date(startDate);
    const daysUntilTrip = Math.floor((tripStart - today) / (1000 * 60 * 60 * 24));

    // If trip is beyond 16 days, use climate/almanac data instead
    if (daysUntilTrip > 16) {
        return await fetchClimateData(lat, lon, tripStart.getMonth());
    }

    try {
        // Get current weather + 7-day forecast
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API failed');

        const data = await response.json();

        // Process current weather
        const current = {
            temp: Math.round(data.current.temperature_2m),
            conditions: getWeatherDescription(data.current.weather_code),
            isDay: data.current.is_day === 1
        };

        // Process 7-day forecast
        const forecast = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 0; i < 7; i++) {
            const date = new Date(data.daily.time[i]);
            forecast.push({
                day: i === 0 ? 'Today' : dayNames[date.getDay()],
                high: Math.round(data.daily.temperature_2m_max[i]),
                low: Math.round(data.daily.temperature_2m_min[i]),
                rainChance: data.daily.precipitation_probability_max[i],
                conditions: getWeatherDescription(data.daily.weather_code[i])
            });
        }

        // Process weather data
        const weather = {
            type: 'forecast',
            current,
            forecast,
            avgHigh: Math.round(data.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / data.daily.temperature_2m_max.length),
            avgLow: Math.round(data.daily.temperature_2m_min.reduce((a, b) => a + b, 0) / data.daily.temperature_2m_min.length),
            rainChance: Math.round(data.daily.precipitation_probability_max.reduce((a, b) => a + b, 0) / data.daily.precipitation_probability_max.length),
            conditions: getWeatherDescription(data.daily.weather_code[0])
        };

        apiCache.weather[cacheKey] = weather;
        return weather;
    } catch (error) {
        console.error('Open-Meteo error:', error);
        // Fall back to climate data if forecast fails
        return await fetchClimateData(lat, lon, tripStart.getMonth());
    }
}

// Fetch historical climate data (almanac) for a specific month
async function fetchClimateData(lat, lon, month) {
    const cacheKey = `climate-${lat.toFixed(2)},${lon.toFixed(2)},${month}`;
    if (apiCache.weather[cacheKey]) {
        return apiCache.weather[cacheKey];
    }

    try {
        // Get historical data for the last 5 years for this month
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5];

        // Build date ranges for the target month across multiple years
        const monthStr = String(month + 1).padStart(2, '0');
        const daysInMonth = new Date(currentYear, month + 1, 0).getDate();

        let allHighs = [];
        let allLows = [];
        let allPrecip = [];

        // Fetch data for each year (we'll do this sequentially to avoid rate limits)
        for (const year of years.slice(0, 3)) { // Limit to 3 years to reduce API calls
            const startDate = `${year}-${monthStr}-01`;
            const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

            const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&timezone=auto`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.daily) {
                    allHighs.push(...data.daily.temperature_2m_max.filter(t => t !== null));
                    allLows.push(...data.daily.temperature_2m_min.filter(t => t !== null));
                    // Convert precipitation to rain chance estimate (days with > 0.1mm)
                    const rainyDays = data.daily.precipitation_sum.filter(p => p > 0.1).length;
                    allPrecip.push(rainyDays / data.daily.precipitation_sum.length * 100);
                }
            }
        }

        if (allHighs.length === 0) {
            // If API fails, return null to trigger fallback
            return null;
        }

        // Calculate averages
        const avgHigh = Math.round(allHighs.reduce((a, b) => a + b, 0) / allHighs.length);
        const avgLow = Math.round(allLows.reduce((a, b) => a + b, 0) / allLows.length);
        const rainChance = Math.round(allPrecip.reduce((a, b) => a + b, 0) / allPrecip.length);

        // Determine typical conditions based on temperature and precipitation
        const conditions = getTypicalConditions(avgHigh, avgLow, rainChance, lat);

        const climate = {
            type: 'climate',
            monthName: getMonthName(month),
            avgHigh,
            avgLow,
            rainChance,
            conditions,
            description: getClimateDescription(avgHigh, avgLow, rainChance)
        };

        apiCache.weather[cacheKey] = climate;
        return climate;
    } catch (error) {
        console.error('Climate data error:', error);
        return null;
    }
}

// Get month name
function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
}

// Determine typical weather conditions based on climate data
function getTypicalConditions(avgHigh, avgLow, rainChance, lat) {
    // Determine if it's likely snowy (cold + precipitation + not tropical)
    const isCold = avgHigh < 40;
    const isCool = avgHigh < 60;
    const isWarm = avgHigh >= 70 && avgHigh < 85;
    const isHot = avgHigh >= 85;
    const isRainy = rainChance > 40;
    const isTropical = Math.abs(lat) < 25;

    if (isCold && rainChance > 30 && !isTropical) {
        return '❄️ Cold & Snowy';
    } else if (isCold && rainChance <= 30) {
        return '🥶 Cold & Dry';
    } else if (isCold) {
        return '🌨️ Cold';
    } else if (isCool && isRainy) {
        return '🌧️ Cool & Rainy';
    } else if (isCool) {
        return '🌤️ Cool & Mild';
    } else if (isWarm && isRainy && isTropical) {
        return '🌴 Warm & Humid';
    } else if (isWarm && isRainy) {
        return '🌦️ Warm & Rainy';
    } else if (isWarm) {
        return '☀️ Warm & Pleasant';
    } else if (isHot && isRainy) {
        return '🌴 Hot & Humid';
    } else if (isHot) {
        return '🔥 Hot & Sunny';
    }
    return '🌤️ Mild';
}

// Get a descriptive text for the climate
function getClimateDescription(avgHigh, avgLow, rainChance) {
    let desc = '';

    if (avgHigh < 32) desc = 'Expect freezing temperatures';
    else if (avgHigh < 50) desc = 'Pack warm layers';
    else if (avgHigh < 65) desc = 'Mild weather, light jacket recommended';
    else if (avgHigh < 80) desc = 'Pleasant temperatures';
    else if (avgHigh < 90) desc = 'Warm weather';
    else desc = 'Hot temperatures, stay hydrated';

    if (rainChance > 50) desc += ', frequent rain likely';
    else if (rainChance > 30) desc += ', some rain possible';
    else desc += ', mostly dry';

    return desc;
}

// Convert WMO weather codes to descriptions
function getWeatherDescription(code) {
    const codes = {
        0: '☀️ Clear', 1: '🌤️ Mostly Clear', 2: '⛅ Partly Cloudy', 3: '☁️ Cloudy',
        45: '🌫️ Foggy', 48: '🌫️ Foggy', 51: '🌧️ Light Drizzle', 53: '🌧️ Drizzle',
        55: '🌧️ Heavy Drizzle', 61: '🌧️ Light Rain', 63: '🌧️ Rain', 65: '🌧️ Heavy Rain',
        71: '🌨️ Light Snow', 73: '🌨️ Snow', 75: '🌨️ Heavy Snow',
        80: '🌦️ Showers', 81: '🌦️ Showers', 82: '⛈️ Heavy Showers',
        95: '⛈️ Thunderstorm', 96: '⛈️ Thunderstorm', 99: '⛈️ Severe Storm'
    };
    return codes[code] || '🌤️ Fair';
}

// ============================================
// FRANKFURTER CURRENCY API (No key needed!)
// ============================================
async function fetchExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;

    const cacheKey = `${fromCurrency}-${toCurrency}`;
    if (apiCache.currency[cacheKey]) {
        return apiCache.currency[cacheKey];
    }

    try {
        const url = `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Currency API failed');

        const data = await response.json();
        const rate = data.rates[toCurrency];

        apiCache.currency[cacheKey] = rate;
        return rate;
    } catch (error) {
        console.error('Frankfurter error:', error);
        return null;
    }
}

// Get all rates for a base currency
async function fetchAllExchangeRates(baseCurrency = 'USD') {
    const cacheKey = `all-${baseCurrency}`;
    if (apiCache.currency[cacheKey]) {
        return apiCache.currency[cacheKey];
    }

    try {
        const url = `https://api.frankfurter.app/latest?from=${baseCurrency}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Currency API failed');

        const data = await response.json();
        apiCache.currency[cacheKey] = data.rates;
        return data.rates;
    } catch (error) {
        console.error('Frankfurter error:', error);
        return {};
    }
}

// ============================================
// US STATE DEPT TRAVEL ADVISORIES (No key needed!)
// ============================================
// Note: This uses a CORS proxy since State Dept doesn't have CORS headers
async function fetchTravelAdvisory(countryCode) {
    if (!countryCode) return null;

    if (apiCache.advisories[countryCode]) {
        return apiCache.advisories[countryCode];
    }

    // Fallback data for common destinations (State Dept data as of 2024)
    const advisoryData = {
        'MX': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'CO': { level: 3, description: 'Reconsider Travel (some areas)', color: '#FF6B6B' },
        'PE': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'AR': { level: 1, description: 'Exercise Normal Precautions', color: '#4CAF50' },
        'DO': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'BS': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'CU': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'GB': { level: 1, description: 'Exercise Normal Precautions', color: '#4CAF50' },
        'FR': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'ES': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'IT': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'NL': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'PT': { level: 1, description: 'Exercise Normal Precautions', color: '#4CAF50' },
        'IE': { level: 1, description: 'Exercise Normal Precautions', color: '#4CAF50' },
        'IS': { level: 1, description: 'Exercise Normal Precautions', color: '#4CAF50' },
        'JP': { level: 1, description: 'Exercise Normal Precautions', color: '#4CAF50' },
        'TH': { level: 1, description: 'Exercise Normal Precautions', color: '#4CAF50' },
        'ID': { level: 2, description: 'Exercise Increased Caution', color: '#FFA500' },
        'CA': { level: 1, description: 'Exercise Normal Precautions', color: '#4CAF50' },
        'US': { level: 1, description: 'No Advisory', color: '#4CAF50' },
        'PR': { level: 1, description: 'No Advisory (US Territory)', color: '#4CAF50' }
    };

    const advisory = advisoryData[countryCode] || { level: 2, description: 'Check State.gov', color: '#888' };
    apiCache.advisories[countryCode] = advisory;
    return advisory;
}

// ============================================
// AMADEUS FLIGHT API (Requires free API key)
// ============================================
let amadeusToken = null;
let amadeusTokenExpiry = 0;

async function getAmadeusToken() {
    if (!API_KEYS.amadeus.clientId || !API_KEYS.amadeus.clientSecret) {
        return null;
    }

    // Return cached token if still valid
    if (amadeusToken && Date.now() < amadeusTokenExpiry) {
        return amadeusToken;
    }

    try {
        const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=client_credentials&client_id=${API_KEYS.amadeus.clientId}&client_secret=${API_KEYS.amadeus.clientSecret}`
        });

        if (!response.ok) throw new Error('Amadeus auth failed');

        const data = await response.json();
        amadeusToken = data.access_token;
        amadeusTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early
        return amadeusToken;
    } catch (error) {
        console.error('Amadeus auth error:', error);
        return null;
    }
}

// Fetch real flight prices from Amadeus
async function fetchFlightPrices(originCity, destCity, departDate, returnDate, travelers) {
    const token = await getAmadeusToken();
    if (!token) return null;

    // Get IATA codes (simplified - in production, use a proper airport lookup)
    const originCode = getIATACode(originCity);
    const destCode = getIATACode(destCity);

    if (!originCode || !destCode) return null;

    const cacheKey = `${originCode}-${destCode}-${departDate}-${returnDate}-${travelers}`;
    if (apiCache.flights[cacheKey]) {
        return apiCache.flights[cacheKey];
    }

    try {
        const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originCode}&destinationLocationCode=${destCode}&departureDate=${departDate}&returnDate=${returnDate}&adults=${travelers}&max=5&currencyCode=USD`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Amadeus flight search failed');

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            // Get cheapest price
            const prices = data.data.map(offer => parseFloat(offer.price.total));
            const cheapest = Math.min(...prices);
            const average = prices.reduce((a, b) => a + b, 0) / prices.length;

            const result = {
                cheapest: Math.round(cheapest),
                average: Math.round(average),
                offers: data.data.length,
                source: 'Amadeus'
            };

            apiCache.flights[cacheKey] = result;
            return result;
        }
        return null;
    } catch (error) {
        console.error('Amadeus flight error:', error);
        return null;
    }
}

// Simple IATA code lookup (expand as needed)
function getIATACode(cityOrState) {
    const codes = {
        'New York': 'JFK', 'NY': 'JFK', 'Los Angeles': 'LAX', 'CA': 'LAX',
        'Chicago': 'ORD', 'IL': 'ORD', 'Miami': 'MIA', 'FL': 'MIA',
        'San Francisco': 'SFO', 'Boston': 'BOS', 'MA': 'BOS',
        'Seattle': 'SEA', 'WA': 'SEA', 'Denver': 'DEN', 'CO': 'DEN',
        'Atlanta': 'ATL', 'GA': 'ATL', 'Dallas': 'DFW', 'TX': 'DFW',
        'Phoenix': 'PHX', 'AZ': 'PHX', 'Philadelphia': 'PHL', 'PA': 'PHL',
        'Houston': 'IAH', 'Washington': 'DCA', 'DC': 'DCA',
        'Cancun': 'CUN', 'Mexico City': 'MEX', 'San Juan': 'SJU',
        'Punta Cana': 'PUJ', 'Nassau': 'NAS', 'Havana': 'HAV',
        'Medellin': 'MDE', 'Bogota': 'BOG', 'Cartagena': 'CTG',
        'Lima': 'LIM', 'Buenos Aires': 'EZE', 'Lisbon': 'LIS',
        'Barcelona': 'BCN', 'London': 'LHR', 'Paris': 'CDG',
        'Rome': 'FCO', 'Amsterdam': 'AMS', 'Dublin': 'DUB',
        'Reykjavik': 'KEF', 'Tokyo': 'NRT', 'Bangkok': 'BKK',
        'Bali': 'DPS', 'Honolulu': 'HNL', 'Las Vegas': 'LAS',
        'New Orleans': 'MSY', 'Nashville': 'BNA', 'Austin': 'AUS'
    };
    return codes[cityOrState] || null;
}

// ============================================
// WIKIPEDIA IMAGE API (No key needed!)
// Fetches destination images from Wikipedia
// ============================================
async function fetchWikipediaImage(cityName, countryName) {
    const cacheKey = `wikipedia-img-${cityName}`;
    if (apiCache.images && apiCache.images[cacheKey]) {
        return apiCache.images[cacheKey];
    }

    try {
        // First, get the page and its main image
        const searchTitle = encodeURIComponent(cityName);
        const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${searchTitle}&prop=pageimages|info&pithumbsize=800&format=json&origin=*`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Wikipedia API failed');

        const data = await response.json();
        const pages = data.query?.pages;

        if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].thumbnail) {
                const thumb = pages[pageId].thumbnail;
                // Get a larger version by modifying the URL
                const largeUrl = thumb.source.replace(/\/\d+px-/, '/800px-');
                const smallUrl = thumb.source.replace(/\/\d+px-/, '/200px-');

                const result = {
                    url: largeUrl,
                    thumb: smallUrl,
                    credit: {
                        name: 'Wikipedia',
                        link: `https://en.wikipedia.org/wiki/${searchTitle}`
                    }
                };

                // Cache the result
                if (!apiCache.images) apiCache.images = {};
                apiCache.images[cacheKey] = result;
                return result;
            }
        }
        return null;
    } catch (error) {
        console.error('Wikipedia image error:', error);
        return null;
    }
}

// ============================================
// OPENROUTESERVICE API - Driving Directions
// Get accurate driving times and distances
// ============================================
async function fetchDrivingRoute(homeLat, homeLon, destLat, destLon) {
    if (!API_KEYS.openRouteService) {
        return null;
    }

    const cacheKey = `${homeLat.toFixed(2)},${homeLon.toFixed(2)}-${destLat.toFixed(2)},${destLon.toFixed(2)}`;
    if (apiCache.driving[cacheKey]) {
        return apiCache.driving[cacheKey];
    }

    try {
        const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${homeLon},${homeLat}&end=${destLon},${destLat}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': API_KEYS.openRouteService
            }
        });

        if (!response.ok) {
            // If route not found (e.g., water crossing), return null
            if (response.status === 404) {
                apiCache.driving[cacheKey] = { notDrivable: true };
                return { notDrivable: true };
            }
            throw new Error('OpenRouteService API failed');
        }

        const data = await response.json();

        if (data.features && data.features[0]) {
            const segment = data.features[0].properties.segments[0];
            const result = {
                durationHours: segment.duration / 3600, // Convert seconds to hours
                distanceMiles: segment.distance / 1609.34, // Convert meters to miles
                notDrivable: false
            };
            apiCache.driving[cacheKey] = result;
            return result;
        }

        return null;
    } catch (error) {
        console.error('OpenRouteService error:', error);
        return null;
    }
}

// ============================================
// TRAVELTIME API - Isochrones
// Get accurate reachable area polygons for driving (up to 4 hours)
// ============================================
let currentIsochrone = null; // Store the current isochrone layer

async function fetchDrivingIsochrone(lat, lon, timeSeconds) {
    if (!API_KEYS.travelTime || !API_KEYS.travelTime.appId) {
        console.log('Isochrone: No TravelTime API key configured');
        return null;
    }

    // TravelTime supports up to 4 hours (14400 seconds)
    const maxSeconds = 14400;
    if (timeSeconds > maxSeconds) {
        console.log(`Isochrone: Capping time from ${timeSeconds}s to ${maxSeconds}s (4h max)`);
        timeSeconds = maxSeconds;
    }

    const cacheKey = `iso-${lat.toFixed(2)},${lon.toFixed(2)}-${timeSeconds}`;
    if (apiCache.driving[cacheKey]) {
        console.log('Isochrone: Using cached data');
        return apiCache.driving[cacheKey];
    }

    try {
        const url = 'https://api.traveltimeapp.com/v4/time-map';

        // Use departure time as now
        const departureTime = new Date().toISOString();

        const requestBody = {
            departure_searches: [{
                id: 'driving-isochrone',
                coords: {
                    lat: lat,
                    lng: lon
                },
                departure_time: departureTime,
                travel_time: timeSeconds,
                transportation: {
                    type: 'driving'
                }
            }]
        };

        console.log('Isochrone: Fetching from TravelTime', { lat, lon, timeSeconds, url });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Application-Id': API_KEYS.travelTime.appId,
                'X-Api-Key': API_KEYS.travelTime.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/geo+json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Isochrone: Response status', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('TravelTime API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        console.log('Isochrone: Response data', data);

        // TravelTime returns GeoJSON when Accept header is application/geo+json
        if (data.features && data.features[0]) {
            const geometry = data.features[0].geometry;
            // Handle both Polygon and MultiPolygon
            let coords;
            if (geometry.type === 'MultiPolygon') {
                // Use the largest polygon (first one is usually the main area)
                coords = geometry.coordinates[0];
            } else {
                coords = geometry.coordinates;
            }

            const result = {
                polygon: {
                    type: 'Polygon',
                    coordinates: coords
                },
                properties: data.features[0].properties
            };
            console.log('Isochrone: Successfully parsed polygon');
            apiCache.driving[cacheKey] = result;
            return result;
        }

        console.log('Isochrone: No features in response');
        return null;
    } catch (error) {
        console.error('TravelTime isochrone error:', error);
        return null;
    }
}

// Check if a point is inside the isochrone polygon
function isPointInIsochrone(lat, lon, isochroneGeometry) {
    if (!isochroneGeometry) return true; // If no isochrone, allow all

    try {
        // Convert GeoJSON polygon to Leaflet format
        // GeoJSON coordinates are [lon, lat], Leaflet uses [lat, lon]
        const coords = isochroneGeometry.coordinates[0].map(c => [c[1], c[0]]);
        const polygon = L.polygon(coords);

        // Use Leaflet's bounds check first (fast)
        const bounds = polygon.getBounds();
        if (!bounds.contains([lat, lon])) {
            return false;
        }

        // Then use ray casting for accurate check
        return isPointInPolygonRayCasting(lat, lon, coords);
    } catch (error) {
        console.error('Error in isPointInIsochrone:', error);
        return true; // Allow if there's an error
    }
}

// Ray casting algorithm for point in polygon (more reliable)
function isPointInPolygonRayCasting(lat, lon, coords) {
    let inside = false;

    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i][0], yi = coords[i][1]; // [lat, lon]
        const xj = coords[j][0], yj = coords[j][1];

        const intersect = ((yi > lon) !== (yj > lon)) &&
            (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

// Display isochrone on map
function displayIsochrone(isochroneData, homeCity) {
    // Remove existing isochrone layer
    if (currentIsochrone) {
        map.removeLayer(currentIsochrone);
        currentIsochrone = null;
    }

    if (!isochroneData || !isochroneData.polygon) {
        console.log('No isochrone data to display');
        return;
    }

    // Remove the simple circular radius when showing accurate isochrone
    if (travelRadiusLayer) {
        map.removeLayer(travelRadiusLayer);
        travelRadiusLayer = null;
    }

    // Convert GeoJSON coordinates [lon, lat] to Leaflet [lat, lon]
    const coords = isochroneData.polygon.coordinates[0].map(c => [c[1], c[0]]);
    console.log('Drawing isochrone with', coords.length, 'points');

    currentIsochrone = L.polygon(coords, {
        color: '#ff6b35',
        weight: 3,
        fillColor: '#ff6b35',
        fillOpacity: 0.15,
        dashArray: '10, 6'
    }).addTo(map);

    // Add tooltip
    currentIsochrone.bindTooltip('Actual drivable area (via roads)', {
        permanent: false,
        direction: 'center'
    });

    // Fit map to isochrone bounds
    map.fitBounds(currentIsochrone.getBounds(), { padding: [50, 50] });
}

// ============================================
// GEONAMES API - Dynamic City Discovery
// Fetches cities within map bounds
// ============================================

// Default pricing by region (used for GeoNames cities without curated data)
const REGION_PRICING = {
    // North America
    'US': { accommodation: { budget: 80, mid: 150, luxury: 350 }, activities: 50, food: 55, flightBase: 200 },
    'CA': { accommodation: { budget: 70, mid: 140, luxury: 320 }, activities: 45, food: 50, flightBase: 250 },
    'MX': { accommodation: { budget: 35, mid: 70, luxury: 180 }, activities: 30, food: 30, flightBase: 200 },
    // Central America
    'CR': { accommodation: { budget: 40, mid: 90, luxury: 220 }, activities: 50, food: 35, flightBase: 300 },
    'PA': { accommodation: { budget: 45, mid: 100, luxury: 250 }, activities: 45, food: 35, flightBase: 280 },
    'GT': { accommodation: { budget: 30, mid: 65, luxury: 160 }, activities: 35, food: 25, flightBase: 250 },
    'BZ': { accommodation: { budget: 50, mid: 120, luxury: 300 }, activities: 60, food: 40, flightBase: 350 },
    'HN': { accommodation: { budget: 30, mid: 60, luxury: 150 }, activities: 35, food: 25, flightBase: 300 },
    'NI': { accommodation: { budget: 25, mid: 55, luxury: 140 }, activities: 30, food: 20, flightBase: 320 },
    'SV': { accommodation: { budget: 30, mid: 60, luxury: 150 }, activities: 30, food: 25, flightBase: 300 },
    // Caribbean
    'CU': { accommodation: { budget: 35, mid: 80, luxury: 200 }, activities: 35, food: 30, flightBase: 280 },
    'DO': { accommodation: { budget: 40, mid: 100, luxury: 280 }, activities: 45, food: 35, flightBase: 250 },
    'JM': { accommodation: { budget: 50, mid: 120, luxury: 320 }, activities: 50, food: 45, flightBase: 280 },
    'BS': { accommodation: { budget: 80, mid: 180, luxury: 450 }, activities: 60, food: 60, flightBase: 250 },
    'PR': { accommodation: { budget: 70, mid: 150, luxury: 380 }, activities: 50, food: 50, flightBase: 150 },
    'TT': { accommodation: { budget: 50, mid: 110, luxury: 280 }, activities: 45, food: 40, flightBase: 350 },
    // South America
    'BR': { accommodation: { budget: 40, mid: 100, luxury: 280 }, activities: 50, food: 40, flightBase: 500 },
    'AR': { accommodation: { budget: 35, mid: 80, luxury: 200 }, activities: 40, food: 45, flightBase: 550 },
    'CO': { accommodation: { budget: 30, mid: 70, luxury: 180 }, activities: 35, food: 30, flightBase: 250 },
    'PE': { accommodation: { budget: 30, mid: 70, luxury: 180 }, activities: 35, food: 40, flightBase: 400 },
    'CL': { accommodation: { budget: 40, mid: 90, luxury: 220 }, activities: 45, food: 40, flightBase: 500 },
    'EC': { accommodation: { budget: 30, mid: 65, luxury: 160 }, activities: 40, food: 25, flightBase: 380 },
    'BO': { accommodation: { budget: 25, mid: 50, luxury: 130 }, activities: 30, food: 20, flightBase: 450 },
    'UY': { accommodation: { budget: 40, mid: 90, luxury: 220 }, activities: 40, food: 45, flightBase: 600 },
    'PY': { accommodation: { budget: 30, mid: 60, luxury: 150 }, activities: 30, food: 25, flightBase: 550 },
    'VE': { accommodation: { budget: 35, mid: 70, luxury: 180 }, activities: 35, food: 30, flightBase: 400 },
    // Europe - Western
    'GB': { accommodation: { budget: 80, mid: 180, luxury: 450 }, activities: 60, food: 65, flightBase: 400 },
    'FR': { accommodation: { budget: 70, mid: 160, luxury: 400 }, activities: 55, food: 60, flightBase: 380 },
    'DE': { accommodation: { budget: 60, mid: 140, luxury: 340 }, activities: 50, food: 50, flightBase: 400 },
    'IT': { accommodation: { budget: 65, mid: 140, luxury: 350 }, activities: 50, food: 55, flightBase: 420 },
    'ES': { accommodation: { budget: 55, mid: 120, luxury: 300 }, activities: 45, food: 45, flightBase: 380 },
    'PT': { accommodation: { budget: 50, mid: 110, luxury: 280 }, activities: 40, food: 45, flightBase: 350 },
    'NL': { accommodation: { budget: 70, mid: 150, luxury: 350 }, activities: 50, food: 55, flightBase: 400 },
    'BE': { accommodation: { budget: 65, mid: 140, luxury: 340 }, activities: 50, food: 55, flightBase: 420 },
    'AT': { accommodation: { budget: 55, mid: 130, luxury: 320 }, activities: 50, food: 50, flightBase: 450 },
    'CH': { accommodation: { budget: 100, mid: 200, luxury: 500 }, activities: 70, food: 80, flightBase: 480 },
    'IE': { accommodation: { budget: 65, mid: 150, luxury: 350 }, activities: 45, food: 50, flightBase: 350 },
    // Europe - Northern
    'SE': { accommodation: { budget: 70, mid: 160, luxury: 400 }, activities: 55, food: 60, flightBase: 480 },
    'NO': { accommodation: { budget: 90, mid: 180, luxury: 450 }, activities: 65, food: 70, flightBase: 500 },
    'DK': { accommodation: { budget: 70, mid: 160, luxury: 400 }, activities: 55, food: 60, flightBase: 450 },
    'FI': { accommodation: { budget: 65, mid: 150, luxury: 380 }, activities: 55, food: 55, flightBase: 500 },
    'IS': { accommodation: { budget: 80, mid: 180, luxury: 400 }, activities: 100, food: 70, flightBase: 350 },
    // Europe - Eastern
    'PL': { accommodation: { budget: 35, mid: 80, luxury: 200 }, activities: 35, food: 30, flightBase: 420 },
    'CZ': { accommodation: { budget: 45, mid: 100, luxury: 250 }, activities: 40, food: 35, flightBase: 450 },
    'HU': { accommodation: { budget: 40, mid: 90, luxury: 220 }, activities: 40, food: 35, flightBase: 480 },
    'HR': { accommodation: { budget: 50, mid: 110, luxury: 280 }, activities: 45, food: 40, flightBase: 500 },
    'GR': { accommodation: { budget: 50, mid: 110, luxury: 280 }, activities: 45, food: 40, flightBase: 480 },
    'RO': { accommodation: { budget: 30, mid: 70, luxury: 180 }, activities: 30, food: 25, flightBase: 500 },
    'BG': { accommodation: { budget: 30, mid: 65, luxury: 160 }, activities: 30, food: 25, flightBase: 520 },
    'RS': { accommodation: { budget: 30, mid: 70, luxury: 180 }, activities: 30, food: 25, flightBase: 550 },
    // Middle East & North Africa
    'TR': { accommodation: { budget: 40, mid: 90, luxury: 220 }, activities: 40, food: 35, flightBase: 550 },
    'MA': { accommodation: { budget: 35, mid: 80, luxury: 250 }, activities: 40, food: 30, flightBase: 500 },
    'EG': { accommodation: { budget: 30, mid: 70, luxury: 200 }, activities: 40, food: 25, flightBase: 600 },
    'AE': { accommodation: { budget: 70, mid: 160, luxury: 450 }, activities: 60, food: 50, flightBase: 650 },
    'IL': { accommodation: { budget: 70, mid: 150, luxury: 380 }, activities: 50, food: 55, flightBase: 700 },
    'JO': { accommodation: { budget: 45, mid: 100, luxury: 260 }, activities: 50, food: 35, flightBase: 750 },
    // Asia
    'JP': { accommodation: { budget: 50, mid: 120, luxury: 350 }, activities: 50, food: 50, flightBase: 700 },
    'KR': { accommodation: { budget: 45, mid: 100, luxury: 280 }, activities: 45, food: 40, flightBase: 700 },
    'CN': { accommodation: { budget: 40, mid: 90, luxury: 250 }, activities: 40, food: 30, flightBase: 650 },
    'TH': { accommodation: { budget: 25, mid: 60, luxury: 180 }, activities: 25, food: 20, flightBase: 600 },
    'VN': { accommodation: { budget: 25, mid: 60, luxury: 150 }, activities: 30, food: 20, flightBase: 650 },
    'ID': { accommodation: { budget: 30, mid: 80, luxury: 250 }, activities: 30, food: 25, flightBase: 750 },
    'PH': { accommodation: { budget: 30, mid: 70, luxury: 180 }, activities: 35, food: 25, flightBase: 700 },
    'MY': { accommodation: { budget: 35, mid: 80, luxury: 200 }, activities: 40, food: 30, flightBase: 700 },
    'SG': { accommodation: { budget: 60, mid: 150, luxury: 400 }, activities: 55, food: 40, flightBase: 750 },
    'IN': { accommodation: { budget: 25, mid: 60, luxury: 180 }, activities: 30, food: 20, flightBase: 700 },
    'NP': { accommodation: { budget: 20, mid: 45, luxury: 120 }, activities: 35, food: 15, flightBase: 800 },
    'LK': { accommodation: { budget: 30, mid: 70, luxury: 200 }, activities: 35, food: 25, flightBase: 850 },
    'TW': { accommodation: { budget: 40, mid: 90, luxury: 250 }, activities: 40, food: 35, flightBase: 750 },
    'HK': { accommodation: { budget: 70, mid: 160, luxury: 400 }, activities: 50, food: 45, flightBase: 700 },
    // Oceania
    'AU': { accommodation: { budget: 70, mid: 160, luxury: 400 }, activities: 60, food: 60, flightBase: 900 },
    'NZ': { accommodation: { budget: 60, mid: 140, luxury: 350 }, activities: 60, food: 55, flightBase: 950 },
    'FJ': { accommodation: { budget: 70, mid: 180, luxury: 500 }, activities: 60, food: 50, flightBase: 900 },
    // Africa
    'ZA': { accommodation: { budget: 40, mid: 100, luxury: 280 }, activities: 50, food: 35, flightBase: 800 },
    'KE': { accommodation: { budget: 45, mid: 110, luxury: 300 }, activities: 80, food: 35, flightBase: 850 },
    'TZ': { accommodation: { budget: 50, mid: 120, luxury: 350 }, activities: 100, food: 35, flightBase: 900 },
    'GH': { accommodation: { budget: 40, mid: 90, luxury: 220 }, activities: 40, food: 30, flightBase: 800 },
    'NG': { accommodation: { budget: 50, mid: 110, luxury: 280 }, activities: 40, food: 35, flightBase: 850 },
    // Default fallback
    'DEFAULT': { accommodation: { budget: 50, mid: 100, luxury: 250 }, activities: 40, food: 40, flightBase: 500 }
};

// Cache for GeoNames results
if (!apiCache.geonames) apiCache.geonames = {};

// Fetch cities from GeoNames within a bounding box
async function fetchGeoNamesCities(bounds, maxRows = 50) {
    if (!API_KEYS.geonames.username) {
        console.warn('GeoNames username not configured');
        return [];
    }

    const cacheKey = `${bounds.north.toFixed(1)},${bounds.south.toFixed(1)},${bounds.east.toFixed(1)},${bounds.west.toFixed(1)}`;
    if (apiCache.geonames[cacheKey]) {
        return apiCache.geonames[cacheKey];
    }

    try {
        // Use citiesJSON endpoint for populated places within bounds
        const url = `https://secure.geonames.org/citiesJSON?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}&maxRows=${maxRows}&username=${API_KEYS.geonames.username}`;

        console.log('GeoNames fetch:', { bounds, url });

        const response = await fetch(url);
        if (!response.ok) throw new Error('GeoNames API failed');

        const data = await response.json();
        console.log('GeoNames response:', {
            status: data.status,
            citiesFound: data.geonames?.length || 0,
            cities: data.geonames?.slice(0, 5).map(c => c.name)
        });

        if (data.geonames && data.geonames.length > 0) {
            const cities = data.geonames.map(city => {
                const countryCode = city.countrycode || 'DEFAULT';
                const pricing = REGION_PRICING[countryCode] || REGION_PRICING['DEFAULT'];

                // Estimate flight price based on distance from NYC (rough approximation)
                const distanceFromNYC = calculateDistance(40.71, -74.01, city.lat, city.lng);
                const flightMultiplier = Math.max(0.8, Math.min(2.5, distanceFromNYC / 3000));

                return {
                    city: city.name,
                    region: city.adminName1 || getCountryName(city.countrycode),
                    country: getCountryName(city.countrycode), // Full country name for display
                    countryCode: city.countrycode, // ISO code for API lookups
                    lat: city.lat,
                    lon: city.lng,
                    population: city.population,
                    type: 'fly', // Dynamic cities are fly destinations
                    flightFromNYC: {
                        low: Math.round(pricing.flightBase * flightMultiplier * 0.7),
                        mid: Math.round(pricing.flightBase * flightMultiplier),
                        high: Math.round(pricing.flightBase * flightMultiplier * 1.5)
                    },
                    accommodation: pricing.accommodation,
                    activities: pricing.activities,
                    food: pricing.food,
                    description: null, // Will be fetched from Wikivoyage
                    seasonality: { winter: 1.0, spring: 1.0, summer: 1.0, fall: 1.0 },
                    isGeoNames: true // Flag to identify dynamically fetched cities
                };
            });

            // Sort by population (larger cities first)
            cities.sort((a, b) => (b.population || 0) - (a.population || 0));

            apiCache.geonames[cacheKey] = cities;
            return cities;
        }
        return [];
    } catch (error) {
        console.error('GeoNames error:', error);
        return [];
    }
}

// Helper to get country name from code
function getCountryName(code) {
    const countryNames = {
        'US': 'USA', 'CA': 'Canada', 'MX': 'Mexico', 'GB': 'UK', 'FR': 'France',
        'DE': 'Germany', 'IT': 'Italy', 'ES': 'Spain', 'PT': 'Portugal', 'NL': 'Netherlands',
        'BE': 'Belgium', 'AT': 'Austria', 'CH': 'Switzerland', 'IE': 'Ireland',
        'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'IS': 'Iceland',
        'PL': 'Poland', 'CZ': 'Czech Republic', 'HU': 'Hungary', 'HR': 'Croatia', 'GR': 'Greece',
        'RO': 'Romania', 'BG': 'Bulgaria', 'RS': 'Serbia',
        'TR': 'Turkey', 'MA': 'Morocco', 'EG': 'Egypt', 'AE': 'UAE', 'IL': 'Israel', 'JO': 'Jordan',
        'JP': 'Japan', 'KR': 'South Korea', 'CN': 'China', 'TH': 'Thailand', 'VN': 'Vietnam',
        'ID': 'Indonesia', 'PH': 'Philippines', 'MY': 'Malaysia', 'SG': 'Singapore',
        'IN': 'India', 'NP': 'Nepal', 'LK': 'Sri Lanka', 'TW': 'Taiwan', 'HK': 'Hong Kong',
        'AU': 'Australia', 'NZ': 'New Zealand', 'FJ': 'Fiji',
        'BR': 'Brazil', 'AR': 'Argentina', 'CO': 'Colombia', 'PE': 'Peru', 'CL': 'Chile',
        'EC': 'Ecuador', 'BO': 'Bolivia', 'UY': 'Uruguay', 'PY': 'Paraguay', 'VE': 'Venezuela',
        'CR': 'Costa Rica', 'PA': 'Panama', 'GT': 'Guatemala', 'BZ': 'Belize',
        'HN': 'Honduras', 'NI': 'Nicaragua', 'SV': 'El Salvador',
        'CU': 'Cuba', 'DO': 'Dominican Republic', 'JM': 'Jamaica', 'BS': 'Bahamas', 'PR': 'Puerto Rico', 'TT': 'Trinidad and Tobago',
        'ZA': 'South Africa', 'KE': 'Kenya', 'TZ': 'Tanzania', 'GH': 'Ghana', 'NG': 'Nigeria'
    };
    return countryNames[code] || code;
}

// Helper to get currency code from country code
function getCurrencyForCountry(code) {
    const currencies = {
        'US': 'USD', 'CA': 'CAD', 'MX': 'MXN', 'GB': 'GBP', 'FR': 'EUR', 'DE': 'EUR',
        'IT': 'EUR', 'ES': 'EUR', 'PT': 'EUR', 'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR',
        'CH': 'CHF', 'IE': 'EUR', 'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'FI': 'EUR',
        'IS': 'ISK', 'PL': 'PLN', 'CZ': 'CZK', 'HU': 'HUF', 'HR': 'EUR', 'GR': 'EUR',
        'RO': 'RON', 'BG': 'BGN', 'RS': 'RSD', 'TR': 'TRY', 'MA': 'MAD', 'EG': 'EGP',
        'AE': 'AED', 'IL': 'ILS', 'JO': 'JOD', 'JP': 'JPY', 'KR': 'KRW', 'CN': 'CNY',
        'TH': 'THB', 'VN': 'VND', 'ID': 'IDR', 'PH': 'PHP', 'MY': 'MYR', 'SG': 'SGD',
        'IN': 'INR', 'NP': 'NPR', 'LK': 'LKR', 'TW': 'TWD', 'HK': 'HKD',
        'AU': 'AUD', 'NZ': 'NZD', 'FJ': 'FJD',
        'BR': 'BRL', 'AR': 'ARS', 'CO': 'COP', 'PE': 'PEN', 'CL': 'CLP',
        'EC': 'USD', 'BO': 'BOB', 'UY': 'UYU', 'PY': 'PYG', 'VE': 'VES',
        'CR': 'CRC', 'PA': 'USD', 'GT': 'GTQ', 'BZ': 'BZD', 'HN': 'HNL', 'NI': 'NIO', 'SV': 'USD',
        'CU': 'CUP', 'DO': 'DOP', 'JM': 'JMD', 'BS': 'BSD', 'PR': 'USD', 'TT': 'TTD',
        'ZA': 'ZAR', 'KE': 'KES', 'TZ': 'TZS', 'GH': 'GHS', 'NG': 'NGN'
    };
    return currencies[code] || 'USD';
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ============================================
// WIKIVOYAGE API (No key needed!)
// Fetches travel descriptions from Wikivoyage
// ============================================
async function fetchWikivoyageDescription(cityName) {
    const cacheKey = `wikivoyage-${cityName}`;
    if (apiCache.descriptions && apiCache.descriptions[cacheKey]) {
        return apiCache.descriptions[cacheKey];
    }

    try {
        // Use Wikipedia API to fetch Wikivoyage content
        const url = `https://en.wikivoyage.org/w/api.php?action=query&titles=${encodeURIComponent(cityName)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Wikivoyage API failed');

        const data = await response.json();
        const pages = data.query?.pages;

        if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].extract) {
                let extract = pages[pageId].extract;
                // Clean up and truncate the description
                extract = extract.replace(/\n+/g, ' ').trim();
                // Take complete sentences that fit within ~300 chars
                const sentences = extract.match(/[^.!?]+[.!?]+/g) || [extract];
                let description = '';
                for (const sentence of sentences) {
                    if ((description + sentence).length <= 300) {
                        description += sentence;
                    } else {
                        break;
                    }
                }
                // If we got no complete sentences, take the first one even if long
                if (!description && sentences.length > 0) {
                    description = sentences[0];
                    if (description.length > 300) {
                        // Truncate at last word boundary before 300 chars
                        description = description.substring(0, 297).replace(/\s+\S*$/, '') + '...';
                    }
                }

                // Cache the result
                if (!apiCache.descriptions) apiCache.descriptions = {};
                apiCache.descriptions[cacheKey] = description;
                return description;
            }
        }
        return null;
    } catch (error) {
        console.error('Wikivoyage error:', error);
        return null;
    }
}

// ============================================
// ENHANCED DATA FETCHING
// ============================================
// Fetch all external data for a destination
async function fetchDestinationData(dest, startDate, endDate, travelers) {
    // Look up country data - try by name first, then by code for GeoNames cities
    let countryData = COUNTRY_DATA[dest.country] || {};
    if (!countryData.currency && dest.countryCode) {
        // For GeoNames cities, look up by ISO code in REGION_PRICING
        const regionPricing = REGION_PRICING[dest.countryCode];
        if (regionPricing) {
            countryData = { currency: getCurrencyForCountry(dest.countryCode), iso2: dest.countryCode };
        }
    }

    // Fetch data in parallel (including optional image and description)
    const [weather, exchangeRate, advisory, image, wikiDescription] = await Promise.all([
        fetchWeatherOpenMeteo(dest.lat, dest.lon, startDate, endDate),
        countryData.currency ? fetchExchangeRate('USD', countryData.currency) : Promise.resolve(1),
        countryData.iso2 || dest.countryCode ? fetchTravelAdvisory(countryData.iso2 || dest.countryCode) : Promise.resolve(null),
        fetchWikipediaImage(dest.city, dest.country),
        fetchWikivoyageDescription(dest.city)
    ]);

    // Try to get real flight prices if Amadeus is configured
    let flightData = null;
    if (API_KEYS.amadeus.clientId && dest.type === 'fly') {
        flightData = await fetchFlightPrices(
            selectedHomeCity?.city || 'New York',
            dest.city,
            startDate,
            endDate,
            travelers
        );
    }

    return {
        weather,
        exchangeRate,
        localCurrency: countryData.currency || 'USD',
        advisory,
        flightData,
        image,
        wikiDescription
    };
}

// Destinations data with base prices
// Prices are baseline estimates that get adjusted for seasonality
const DESTINATIONS = [
    // Drivable from NYC (within ~8 hours)
    { city: "Catskills", region: "New York", country: "USA", lat: 42.1, lon: -74.4,
      type: "drive", driveHoursFromNYC: 2.5,
      accommodation: { budget: 80, mid: 150, luxury: 350 },
      activities: 40, food: 60, description: "Escape to rustic mountain cabins, pristine hiking trails, and charming small towns. Perfect for a cozy weekend retreat with stunning fall foliage and winter skiing.",
      seasonality: { winter: 1.3, spring: 0.9, summer: 1.2, fall: 1.4 } },

    { city: "Cape Cod", region: "Massachusetts", country: "USA", lat: 41.67, lon: -70.3,
      type: "drive", driveHoursFromNYC: 5,
      accommodation: { budget: 100, mid: 180, luxury: 400 },
      activities: 50, food: 70, description: "Classic New England charm with sandy beaches, fresh lobster rolls, lighthouses, and quaint seaside villages. Best enjoyed in summer but magical year-round.",
      seasonality: { winter: 0.6, spring: 0.8, summer: 1.5, fall: 1.0 } },

    { city: "Philadelphia", region: "Pennsylvania", country: "USA", lat: 39.95, lon: -75.17,
      type: "drive", driveHoursFromNYC: 2,
      accommodation: { budget: 70, mid: 140, luxury: 280 },
      activities: 35, food: 55, description: "Birthplace of American democracy with world-class museums, a thriving food scene, and the iconic cheesesteak. History buffs and foodies alike will love it here.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.1, fall: 1.05 } },

    { city: "Washington DC", region: "DC", country: "USA", lat: 38.9, lon: -77.04,
      type: "drive", driveHoursFromNYC: 4,
      accommodation: { budget: 90, mid: 170, luxury: 350 },
      activities: 25, food: 60, description: "The nation's capital offers free world-class museums, iconic monuments, and vibrant neighborhoods. Cherry blossoms in spring are unforgettable.",
      seasonality: { winter: 0.8, spring: 1.3, summer: 1.0, fall: 1.0 } },

    { city: "Boston", region: "Massachusetts", country: "USA", lat: 42.36, lon: -71.06,
      type: "drive", driveHoursFromNYC: 4,
      accommodation: { budget: 100, mid: 190, luxury: 400 },
      activities: 45, food: 70, description: "Walk the Freedom Trail through American history, catch a game at Fenway, and feast on the freshest seafood. A perfect blend of old and new.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.2, fall: 1.3 } },

    { city: "Atlantic City", region: "New Jersey", country: "USA", lat: 39.36, lon: -74.42,
      type: "drive", driveHoursFromNYC: 2.5,
      accommodation: { budget: 60, mid: 120, luxury: 280 },
      activities: 50, food: 55, description: "Vegas vibes on the East Coast with beachfront casinos, a famous boardwalk, and surprisingly good dining. Great for a quick weekend getaway.",
      seasonality: { winter: 0.7, spring: 0.9, summer: 1.4, fall: 0.9 } },

    { city: "Poconos", region: "Pennsylvania", country: "USA", lat: 41.1, lon: -75.3,
      type: "drive", driveHoursFromNYC: 2,
      accommodation: { budget: 70, mid: 140, luxury: 300 },
      activities: 45, food: 50, description: "Year-round mountain escape with skiing, water parks, hiking, and romantic cabin retreats. Popular for couples and family getaways alike.",
      seasonality: { winter: 1.4, spring: 0.8, summer: 1.1, fall: 1.2 } },

    { city: "Hudson Valley", region: "New York", country: "USA", lat: 41.5, lon: -73.9,
      type: "drive", driveHoursFromNYC: 1.5,
      accommodation: { budget: 90, mid: 180, luxury: 400 },
      activities: 40, food: 65, description: "Rolling hills, award-winning wineries, farm-to-table dining, and stunning fall colors. NYC's favorite escape for food and nature lovers.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.1, fall: 1.5 } },

    { city: "Vermont", region: "Vermont", country: "USA", lat: 44.26, lon: -72.58,
      type: "drive", driveHoursFromNYC: 5,
      accommodation: { budget: 85, mid: 160, luxury: 350 },
      activities: 50, food: 55, description: "Quintessential New England with covered bridges, maple syrup farms, craft breweries, and some of the best skiing on the East Coast.",
      seasonality: { winter: 1.5, spring: 0.7, summer: 1.0, fall: 1.4 } },

    { city: "Montreal", region: "Quebec", country: "Canada", lat: 45.5, lon: -73.57,
      type: "drive", driveHoursFromNYC: 6,
      accommodation: { budget: 70, mid: 130, luxury: 280 },
      activities: 40, food: 50, description: "A slice of Europe in North America. French-speaking city with incredible food scene, vibrant nightlife, beautiful architecture, and world-famous poutine.",
      seasonality: { winter: 0.8, spring: 0.9, summer: 1.3, fall: 1.1 } },

    // Drivable from Los Angeles (within ~6 hours)
    { city: "Palm Springs", region: "California", country: "USA", lat: 33.83, lon: -116.55,
      type: "drive",
      accommodation: { budget: 80, mid: 180, luxury: 450 },
      activities: 40, food: 55, description: "Retro desert paradise with stunning mid-century modern architecture, natural hot springs, and year-round sunshine. Great for pool parties and relaxation.",
      seasonality: { winter: 1.4, spring: 1.2, summer: 0.6, fall: 1.0 } },

    { city: "San Diego", region: "California", country: "USA", lat: 32.72, lon: -117.16,
      type: "drive",
      accommodation: { budget: 90, mid: 170, luxury: 380 },
      activities: 50, food: 55, description: "Perfect weather year-round with world-famous zoo, stunning beaches, vibrant Gaslamp Quarter, and an incredible craft beer scene.",
      seasonality: { winter: 1.0, spring: 1.1, summer: 1.3, fall: 1.1 } },

    { city: "Santa Barbara", region: "California", country: "USA", lat: 34.42, lon: -119.7,
      type: "drive",
      accommodation: { budget: 100, mid: 200, luxury: 500 },
      activities: 45, food: 65, description: "The American Riviera with Spanish colonial architecture, world-class wineries, beautiful beaches, and a sophisticated food scene.",
      seasonality: { winter: 0.9, spring: 1.1, summer: 1.4, fall: 1.1 } },

    { city: "Joshua Tree", region: "California", country: "USA", lat: 34.13, lon: -116.31,
      type: "drive",
      accommodation: { budget: 60, mid: 120, luxury: 280 },
      activities: 30, food: 40, description: "Otherworldly desert landscape with iconic twisted trees, incredible stargazing, rock climbing, and a quirky arts scene. Best avoided in summer heat.",
      seasonality: { winter: 1.2, spring: 1.3, summer: 0.5, fall: 1.1 } },

    { city: "Big Sur", region: "California", country: "USA", lat: 36.27, lon: -121.81,
      type: "drive",
      accommodation: { budget: 120, mid: 250, luxury: 600 },
      activities: 35, food: 60, description: "One of the world's most dramatic coastlines. Cliffs plunge into the Pacific, redwood forests tower overhead, and luxury retreats offer total escape.",
      seasonality: { winter: 0.8, spring: 1.1, summer: 1.4, fall: 1.2 } },

    { city: "Lake Tahoe", region: "California/Nevada", country: "USA", lat: 39.1, lon: -120.04,
      type: "drive",
      accommodation: { budget: 90, mid: 180, luxury: 450 },
      activities: 60, food: 55, description: "Crystal-clear alpine lake straddling California and Nevada. World-class skiing in winter, hiking and water sports in summer. Stunning year-round.",
      seasonality: { winter: 1.5, spring: 0.9, summer: 1.3, fall: 1.0 } },

    { city: "Sedona", region: "Arizona", country: "USA", lat: 34.87, lon: -111.76,
      type: "drive",
      accommodation: { budget: 100, mid: 200, luxury: 500 },
      activities: 50, food: 55, description: "Mystical red rock formations, spiritual vortexes, world-class hiking, and a thriving arts community. Sunsets here are legendary.",
      seasonality: { winter: 1.1, spring: 1.3, summer: 0.8, fall: 1.2 } },

    { city: "Grand Canyon", region: "Arizona", country: "USA", lat: 36.1, lon: -112.11,
      type: "drive",
      accommodation: { budget: 80, mid: 160, luxury: 350 },
      activities: 40, food: 45, description: "One of Earth's most awe-inspiring natural wonders. 277 miles long, up to 18 miles wide, and over a mile deep. A must-see bucket list destination.",
      seasonality: { winter: 0.8, spring: 1.2, summer: 1.3, fall: 1.1 } },

    { city: "Scottsdale", region: "Arizona", country: "USA", lat: 33.49, lon: -111.93,
      type: "drive",
      accommodation: { budget: 80, mid: 180, luxury: 450 },
      activities: 55, food: 60, description: "Desert luxury at its finest with championship golf courses, world-class spas, upscale dining, and vibrant nightlife. Escape the winter cold in style.",
      seasonality: { winter: 1.5, spring: 1.3, summer: 0.5, fall: 1.0 } },

    // Drivable from Chicago (within ~6 hours)
    { city: "Milwaukee", region: "Wisconsin", country: "USA", lat: 43.04, lon: -87.91,
      type: "drive",
      accommodation: { budget: 70, mid: 140, luxury: 280 },
      activities: 40, food: 50, description: "Breweries & lakefront",
      seasonality: { winter: 0.7, spring: 0.9, summer: 1.3, fall: 1.0 } },

    { city: "Door County", region: "Wisconsin", country: "USA", lat: 45.01, lon: -87.15,
      type: "drive",
      accommodation: { budget: 80, mid: 150, luxury: 320 },
      activities: 40, food: 50, description: "Charming villages & cherries",
      seasonality: { winter: 0.5, spring: 0.8, summer: 1.5, fall: 1.4 } },

    { city: "Galena", region: "Illinois", country: "USA", lat: 42.42, lon: -90.43,
      type: "drive",
      accommodation: { budget: 90, mid: 170, luxury: 350 },
      activities: 35, food: 50, description: "Historic town & wineries",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.2, fall: 1.3 } },

    { city: "Indianapolis", region: "Indiana", country: "USA", lat: 39.77, lon: -86.16,
      type: "drive",
      accommodation: { budget: 70, mid: 130, luxury: 280 },
      activities: 40, food: 45, description: "Speedway & monuments",
      seasonality: { winter: 0.8, spring: 1.1, summer: 1.1, fall: 1.0 } },

    { city: "Ann Arbor", region: "Michigan", country: "USA", lat: 42.28, lon: -83.74,
      type: "drive",
      accommodation: { budget: 75, mid: 140, luxury: 280 },
      activities: 35, food: 50, description: "College town & culture",
      seasonality: { winter: 0.7, spring: 0.9, summer: 1.1, fall: 1.3 } },

    { city: "St. Louis", region: "Missouri", country: "USA", lat: 38.63, lon: -90.2,
      type: "drive",
      accommodation: { budget: 65, mid: 130, luxury: 280 },
      activities: 35, food: 45, description: "Gateway Arch & BBQ",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.1, fall: 1.0 } },

    // Drivable from Miami (within ~6 hours)
    { city: "Key West", region: "Florida", country: "USA", lat: 24.56, lon: -81.78,
      type: "drive",
      accommodation: { budget: 100, mid: 220, luxury: 500 },
      activities: 50, food: 65, description: "Tropical paradise & sunsets",
      seasonality: { winter: 1.5, spring: 1.3, summer: 0.7, fall: 0.8 } },

    { city: "Naples", region: "Florida", country: "USA", lat: 26.14, lon: -81.79,
      type: "drive",
      accommodation: { budget: 90, mid: 180, luxury: 450 },
      activities: 45, food: 60, description: "Gulf beaches & upscale dining",
      seasonality: { winter: 1.5, spring: 1.2, summer: 0.6, fall: 0.8 } },

    { city: "Tampa", region: "Florida", country: "USA", lat: 27.95, lon: -82.46,
      type: "drive",
      accommodation: { budget: 70, mid: 140, luxury: 320 },
      activities: 50, food: 50, description: "Theme parks & Ybor City",
      seasonality: { winter: 1.2, spring: 1.1, summer: 0.8, fall: 0.9 } },

    { city: "Orlando", region: "Florida", country: "USA", lat: 28.54, lon: -81.38,
      type: "drive",
      accommodation: { budget: 80, mid: 160, luxury: 380 },
      activities: 100, food: 55, description: "Theme park capital",
      seasonality: { winter: 1.2, spring: 1.3, summer: 1.1, fall: 0.9 } },

    { city: "Savannah", region: "Georgia", country: "USA", lat: 32.08, lon: -81.09,
      type: "drive",
      accommodation: { budget: 80, mid: 160, luxury: 350 },
      activities: 40, food: 55, description: "Historic squares & Southern charm",
      seasonality: { winter: 0.8, spring: 1.3, summer: 0.9, fall: 1.1 } },

    // Drivable from Atlanta (within ~5 hours)
    { city: "Asheville", region: "North Carolina", country: "USA", lat: 35.6, lon: -82.55,
      type: "drive",
      accommodation: { budget: 80, mid: 160, luxury: 380 },
      activities: 45, food: 55, description: "Mountains, arts & breweries",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.1, fall: 1.4 } },

    { city: "Charleston", region: "South Carolina", country: "USA", lat: 32.78, lon: -79.93,
      type: "drive",
      accommodation: { budget: 90, mid: 180, luxury: 420 },
      activities: 45, food: 65, description: "Historic charm & Lowcountry cuisine",
      seasonality: { winter: 0.8, spring: 1.3, summer: 1.0, fall: 1.1 } },

    { city: "Chattanooga", region: "Tennessee", country: "USA", lat: 35.05, lon: -85.31,
      type: "drive",
      accommodation: { budget: 70, mid: 140, luxury: 300 },
      activities: 45, food: 45, description: "Outdoor adventure & aquarium",
      seasonality: { winter: 0.8, spring: 1.1, summer: 1.1, fall: 1.2 } },

    { city: "Birmingham", region: "Alabama", country: "USA", lat: 33.52, lon: -86.8,
      type: "drive",
      accommodation: { budget: 65, mid: 130, luxury: 280 },
      activities: 35, food: 45, description: "Civil rights history & food scene",
      seasonality: { winter: 0.85, spring: 1.0, summer: 0.9, fall: 1.0 } },

    // Drivable from Texas cities (within ~5 hours)
    { city: "Fredericksburg", region: "Texas", country: "USA", lat: 30.28, lon: -98.87,
      type: "drive",
      accommodation: { budget: 90, mid: 180, luxury: 400 },
      activities: 40, food: 55, description: "Wine country & German heritage",
      seasonality: { winter: 0.8, spring: 1.3, summer: 0.9, fall: 1.1 } },

    { city: "Big Bend", region: "Texas", country: "USA", lat: 29.25, lon: -103.25,
      type: "drive",
      accommodation: { budget: 60, mid: 120, luxury: 250 },
      activities: 35, food: 35, description: "Remote desert wilderness",
      seasonality: { winter: 1.1, spring: 1.3, summer: 0.5, fall: 1.0 } },

    { city: "South Padre Island", region: "Texas", country: "USA", lat: 26.11, lon: -97.17,
      type: "drive",
      accommodation: { budget: 80, mid: 160, luxury: 350 },
      activities: 45, food: 50, description: "Beach resort & spring break",
      seasonality: { winter: 0.8, spring: 1.5, summer: 1.1, fall: 0.8 } },

    { city: "Marfa", region: "Texas", country: "USA", lat: 30.31, lon: -104.02,
      type: "drive",
      accommodation: { budget: 80, mid: 150, luxury: 320 },
      activities: 30, food: 45, description: "Art installations & mystery lights",
      seasonality: { winter: 0.9, spring: 1.2, summer: 0.8, fall: 1.1 } },

    // Drivable from Pacific Northwest
    { city: "Portland", region: "Oregon", country: "USA", lat: 45.52, lon: -122.68,
      type: "drive",
      accommodation: { budget: 80, mid: 160, luxury: 350 },
      activities: 45, food: 55, description: "Weird & wonderful, food carts",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Bend", region: "Oregon", country: "USA", lat: 44.06, lon: -121.31,
      type: "drive",
      accommodation: { budget: 90, mid: 170, luxury: 380 },
      activities: 55, food: 50, description: "Outdoor recreation & craft beer",
      seasonality: { winter: 1.3, spring: 1.0, summer: 1.4, fall: 1.1 } },

    { city: "Olympic National Park", region: "Washington", country: "USA", lat: 47.8, lon: -123.6,
      type: "drive",
      accommodation: { budget: 70, mid: 140, luxury: 300 },
      activities: 40, food: 40, description: "Rainforest, mountains & coast",
      seasonality: { winter: 0.7, spring: 0.9, summer: 1.5, fall: 1.0 } },

    { city: "Vancouver", region: "British Columbia", country: "Canada", lat: 49.28, lon: -123.12,
      type: "drive",
      accommodation: { budget: 90, mid: 180, luxury: 400 },
      activities: 50, food: 55, description: "Mountains meet ocean",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.3, fall: 1.0 } },

    // Fly destinations - Caribbean & Mexico
    { city: "Cancun", region: "Quintana Roo", country: "Mexico", lat: 21.16, lon: -86.85,
      type: "fly", flightFromNYC: { low: 250, mid: 400, high: 600 },
      accommodation: { budget: 60, mid: 150, luxury: 400 },
      activities: 50, food: 40, description: "Turquoise Caribbean waters, white sand beaches, and ancient Mayan ruins at your doorstep. From all-inclusive relaxation to adventure excursions.",
      seasonality: { winter: 1.4, spring: 1.3, summer: 0.8, fall: 0.7 } },

    { city: "Mexico City", region: "CDMX", country: "Mexico", lat: 19.43, lon: -99.13,
      type: "fly", flightFromNYC: { low: 220, mid: 350, high: 550 },
      accommodation: { budget: 40, mid: 100, luxury: 250 },
      activities: 30, food: 30, description: "One of the world's great cities. Incredible food scene, world-class museums, ancient Aztec ruins, and vibrant neighborhoods. Your dollar goes far here.",
      seasonality: { winter: 1.1, spring: 1.0, summer: 0.9, fall: 0.9 } },

    { city: "San Juan", region: "Puerto Rico", country: "USA", lat: 18.47, lon: -66.1,
      type: "fly", flightFromNYC: { low: 150, mid: 280, high: 450 },
      accommodation: { budget: 80, mid: 160, luxury: 350 },
      activities: 45, food: 50, description: "No passport needed for this Caribbean gem. Colorful Old San Juan, pristine beaches, rainforest adventures, and rum distilleries await.",
      seasonality: { winter: 1.4, spring: 1.2, summer: 0.9, fall: 0.8 } },

    { city: "Punta Cana", region: "La Altagracia", country: "Dominican Republic", lat: 18.58, lon: -68.4,
      type: "fly", flightFromNYC: { low: 200, mid: 350, high: 500 },
      accommodation: { budget: 70, mid: 180, luxury: 450 },
      activities: 40, food: 35, description: "All-inclusive paradise with endless palm-lined beaches, golf courses, and water sports. Leave your wallet at the resort and just relax.",
      seasonality: { winter: 1.5, spring: 1.2, summer: 0.8, fall: 0.7 } },

    { city: "Nassau", region: "New Providence", country: "Bahamas", lat: 25.06, lon: -77.35,
      type: "fly", flightFromNYC: { low: 200, mid: 350, high: 550 },
      accommodation: { budget: 100, mid: 220, luxury: 500 },
      activities: 60, food: 70, description: "Crystal-clear turquoise waters, swimming pigs, luxury resorts, and that famous Bahamian hospitality. Paradise is just a short flight away.",
      seasonality: { winter: 1.4, spring: 1.2, summer: 0.9, fall: 0.8 } },

    { city: "Havana", region: "La Habana", country: "Cuba", lat: 23.11, lon: -82.37,
      type: "fly", flightFromNYC: { low: 280, mid: 400, high: 600 },
      accommodation: { budget: 35, mid: 80, luxury: 200 },
      activities: 25, food: 25, description: "Step back in time to classic cars, crumbling colonial architecture, live salsa music, and mojitos. A unique destination unlike anywhere else.",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.9, fall: 0.8 } },

    // South America
    { city: "Medellin", region: "Antioquia", country: "Colombia", lat: 6.25, lon: -75.56,
      type: "fly", flightFromNYC: { low: 280, mid: 450, high: 700 },
      accommodation: { budget: 30, mid: 70, luxury: 180 },
      activities: 25, food: 25, description: "The 'City of Eternal Spring' has transformed into a modern, innovative city. Perfect weather year-round, amazing coffee, and incredible value.",
      seasonality: { winter: 1.1, spring: 1.0, summer: 0.95, fall: 0.95 } },

    { city: "Bogota", region: "Cundinamarca", country: "Colombia", lat: 4.71, lon: -74.07,
      type: "fly", flightFromNYC: { low: 260, mid: 420, high: 650 },
      accommodation: { budget: 35, mid: 80, luxury: 200 },
      activities: 25, food: 25, description: "High-altitude capital with world-class museums, vibrant street art, incredible gastronomy, and a thriving nightlife scene. Cool weather year-round.",
      seasonality: { winter: 1.0, spring: 1.0, summer: 1.0, fall: 1.0 } },

    { city: "Cartagena", region: "Bolivar", country: "Colombia", lat: 10.39, lon: -75.51,
      type: "fly", flightFromNYC: { low: 300, mid: 480, high: 750 },
      accommodation: { budget: 45, mid: 120, luxury: 300 },
      activities: 35, food: 35, description: "Stunning colonial walled city on the Caribbean coast. Colorful streets, romantic plazas, nearby islands, and incredible ceviche.",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.9, fall: 0.85 } },

    { city: "Lima", region: "Lima", country: "Peru", lat: -12.05, lon: -77.04,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 35, mid: 90, luxury: 220 },
      activities: 30, food: 30, description: "The gastronomic capital of South America. World-renowned ceviche, ancient ruins, and a perfect base for Machu Picchu adventures.",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.1, fall: 1.0 } },

    { city: "Buenos Aires", region: "CABA", country: "Argentina", lat: -34.6, lon: -58.38,
      type: "fly", flightFromNYC: { low: 500, mid: 800, high: 1200 },
      accommodation: { budget: 30, mid: 80, luxury: 200 },
      activities: 30, food: 35, description: "The 'Paris of South America' with passionate tango, world-class steak, incredible wine, and European-style architecture. Night owls will thrive here.",
      seasonality: { winter: 0.8, spring: 1.1, summer: 1.2, fall: 1.0 } },

    // Europe
    { city: "Lisbon", region: "Lisboa", country: "Portugal", lat: 38.72, lon: -9.14,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 900 },
      accommodation: { budget: 50, mid: 120, luxury: 280 },
      activities: 35, food: 40, description: "Europe's coolest capital. Cobblestone streets, vintage trams, incredible seafood, world-famous pastéis de nata, and beaches nearby. Amazing value for Western Europe.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Barcelona", region: "Catalonia", country: "Spain", lat: 41.39, lon: 2.17,
      type: "fly", flightFromNYC: { low: 380, mid: 600, high: 950 },
      accommodation: { budget: 60, mid: 140, luxury: 320 },
      activities: 40, food: 50, description: "Gaudí's fantastical architecture, Mediterranean beaches, legendary nightlife, and tapas culture. A city that truly has it all.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.5, fall: 1.1 } },

    { city: "London", region: "England", country: "UK", lat: 51.51, lon: -0.13,
      type: "fly", flightFromNYC: { low: 400, mid: 650, high: 1000 },
      accommodation: { budget: 80, mid: 180, luxury: 400 },
      activities: 50, food: 60, description: "History meets modern",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Paris", region: "Île-de-France", country: "France", lat: 48.86, lon: 2.35,
      type: "fly", flightFromNYC: { low: 400, mid: 650, high: 1000 },
      accommodation: { budget: 80, mid: 180, luxury: 450 },
      activities: 50, food: 60, description: "Romance & croissants",
      seasonality: { winter: 0.8, spring: 1.1, summer: 1.3, fall: 1.0 } },

    { city: "Rome", region: "Lazio", country: "Italy", lat: 41.9, lon: 12.5,
      type: "fly", flightFromNYC: { low: 420, mid: 680, high: 1050 },
      accommodation: { budget: 60, mid: 150, luxury: 350 },
      activities: 40, food: 50, description: "Ancient history & pasta",
      seasonality: { winter: 0.7, spring: 1.1, summer: 1.4, fall: 1.1 } },

    { city: "Amsterdam", region: "North Holland", country: "Netherlands", lat: 52.37, lon: 4.9,
      type: "fly", flightFromNYC: { low: 380, mid: 600, high: 950 },
      accommodation: { budget: 70, mid: 160, luxury: 350 },
      activities: 45, food: 50, description: "Canals, bikes & art",
      seasonality: { winter: 0.7, spring: 1.2, summer: 1.3, fall: 0.9 } },

    { city: "Dublin", region: "Leinster", country: "Ireland", lat: 53.35, lon: -6.26,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 70, mid: 150, luxury: 320 },
      activities: 40, food: 50, description: "Pubs, history & green",
      seasonality: { winter: 0.7, spring: 0.9, summer: 1.3, fall: 1.0 } },

    { city: "Reykjavik", region: "Capital Region", country: "Iceland", lat: 64.15, lon: -21.94,
      type: "fly", flightFromNYC: { low: 300, mid: 480, high: 750 },
      accommodation: { budget: 100, mid: 200, luxury: 400 },
      activities: 80, food: 80, description: "Northern lights & nature",
      seasonality: { winter: 1.0, spring: 0.9, summer: 1.4, fall: 0.9 } },

    // US Domestic Fly Destinations
    { city: "Miami", region: "Florida", country: "USA", lat: 25.76, lon: -80.19,
      type: "fly", flightFromNYC: { low: 100, mid: 200, high: 400 },
      accommodation: { budget: 80, mid: 180, luxury: 450 },
      activities: 50, food: 60, description: "Beaches & nightlife",
      seasonality: { winter: 1.5, spring: 1.3, summer: 0.8, fall: 0.9 } },

    { city: "New Orleans", region: "Louisiana", country: "USA", lat: 29.95, lon: -90.07,
      type: "fly", flightFromNYC: { low: 120, mid: 220, high: 400 },
      accommodation: { budget: 70, mid: 150, luxury: 350 },
      activities: 45, food: 55, description: "Jazz, food & culture",
      seasonality: { winter: 1.0, spring: 1.5, summer: 0.7, fall: 1.1 } },

    { city: "Las Vegas", region: "Nevada", country: "USA", lat: 36.17, lon: -115.14,
      type: "fly", flightFromNYC: { low: 150, mid: 280, high: 500 },
      accommodation: { budget: 50, mid: 120, luxury: 350 },
      activities: 60, food: 60, description: "Entertainment & shows",
      seasonality: { winter: 1.0, spring: 1.1, summer: 0.8, fall: 1.2 } },

    { city: "Los Angeles", region: "California", country: "USA", lat: 34.05, lon: -118.24,
      type: "fly", flightFromNYC: { low: 180, mid: 320, high: 550 },
      accommodation: { budget: 90, mid: 180, luxury: 400 },
      activities: 50, food: 55, description: "Beaches & Hollywood",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "San Francisco", region: "California", country: "USA", lat: 37.77, lon: -122.42,
      type: "fly", flightFromNYC: { low: 180, mid: 320, high: 550 },
      accommodation: { budget: 100, mid: 200, luxury: 450 },
      activities: 45, food: 60, description: "Tech hub & Golden Gate",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.2, fall: 1.1 } },

    { city: "Austin", region: "Texas", country: "USA", lat: 30.27, lon: -97.74,
      type: "fly", flightFromNYC: { low: 130, mid: 250, high: 450 },
      accommodation: { budget: 70, mid: 150, luxury: 320 },
      activities: 45, food: 50, description: "Live music & BBQ",
      seasonality: { winter: 0.9, spring: 1.3, summer: 0.8, fall: 1.1 } },

    { city: "Denver", region: "Colorado", country: "USA", lat: 39.74, lon: -104.99,
      type: "fly", flightFromNYC: { low: 130, mid: 250, high: 450 },
      accommodation: { budget: 80, mid: 160, luxury: 350 },
      activities: 55, food: 50, description: "Mountains & craft beer",
      seasonality: { winter: 1.3, spring: 1.0, summer: 1.1, fall: 1.1 } },

    { city: "Seattle", region: "Washington", country: "USA", lat: 47.61, lon: -122.33,
      type: "fly", flightFromNYC: { low: 180, mid: 320, high: 550 },
      accommodation: { budget: 90, mid: 180, luxury: 380 },
      activities: 45, food: 55, description: "Coffee & tech scene",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Honolulu", region: "Hawaii", country: "USA", lat: 21.31, lon: -157.86,
      type: "fly", flightFromNYC: { low: 400, mid: 650, high: 1000 },
      accommodation: { budget: 120, mid: 250, luxury: 550 },
      activities: 70, food: 70, description: "Paradise beaches",
      seasonality: { winter: 1.3, spring: 1.1, summer: 1.0, fall: 0.9 } },

    { city: "Nashville", region: "Tennessee", country: "USA", lat: 36.16, lon: -86.78,
      type: "fly", flightFromNYC: { low: 100, mid: 200, high: 380 },
      accommodation: { budget: 80, mid: 160, luxury: 350 },
      activities: 50, food: 50, description: "Country music & hot chicken",
      seasonality: { winter: 0.85, spring: 1.1, summer: 1.0, fall: 1.1 } },

    // Asia
    { city: "Tokyo", region: "Kanto", country: "Japan", lat: 35.68, lon: 139.69,
      type: "fly", flightFromNYC: { low: 600, mid: 950, high: 1500 },
      accommodation: { budget: 50, mid: 120, luxury: 350 },
      activities: 50, food: 50, description: "Technology & tradition",
      seasonality: { winter: 0.9, spring: 1.4, summer: 1.0, fall: 1.2 } },

    { city: "Bangkok", region: "Central Thailand", country: "Thailand", lat: 13.76, lon: 100.5,
      type: "fly", flightFromNYC: { low: 550, mid: 850, high: 1300 },
      accommodation: { budget: 25, mid: 60, luxury: 180 },
      activities: 25, food: 20, description: "Temples & street food",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.8, fall: 0.9 } },

    { city: "Bali", region: "Indonesia", country: "Indonesia", lat: -8.41, lon: 115.19,
      type: "fly", flightFromNYC: { low: 650, mid: 1000, high: 1500 },
      accommodation: { budget: 30, mid: 80, luxury: 250 },
      activities: 30, food: 25, description: "Beaches & spirituality",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.3, fall: 1.1 } },

    // Central America
    { city: "San José", region: "Central Valley", country: "Costa Rica", lat: 9.93, lon: -84.08,
      type: "fly", flightFromNYC: { low: 250, mid: 400, high: 650 },
      accommodation: { budget: 40, mid: 90, luxury: 220 },
      activities: 50, food: 35, description: "Gateway to rainforests, volcanoes, and some of the world's best biodiversity. Perfect base for eco-adventures.",
      seasonality: { winter: 1.3, spring: 1.0, summer: 0.8, fall: 0.9 } },

    { city: "Panama City", region: "Panama Province", country: "Panama", lat: 8.98, lon: -79.52,
      type: "fly", flightFromNYC: { low: 220, mid: 380, high: 600 },
      accommodation: { budget: 45, mid: 100, luxury: 250 },
      activities: 45, food: 35, description: "Modern skyline meets historic Casco Viejo. Visit the famous canal, explore jungle islands, and enjoy duty-free shopping.",
      seasonality: { winter: 1.2, spring: 1.0, summer: 0.85, fall: 0.9 } },

    { city: "Guatemala City", region: "Guatemala", country: "Guatemala", lat: 14.63, lon: -90.51,
      type: "fly", flightFromNYC: { low: 200, mid: 350, high: 550 },
      accommodation: { budget: 30, mid: 65, luxury: 160 },
      activities: 35, food: 25, description: "Ancient Mayan ruins, colonial Antigua nearby, stunning Lake Atitlán, and vibrant indigenous culture.",
      seasonality: { winter: 1.2, spring: 1.0, summer: 0.85, fall: 0.95 } },

    { city: "Belize City", region: "Belize", country: "Belize", lat: 17.5, lon: -88.2,
      type: "fly", flightFromNYC: { low: 280, mid: 420, high: 650 },
      accommodation: { budget: 50, mid: 120, luxury: 300 },
      activities: 60, food: 40, description: "World's second-largest barrier reef, ancient Mayan temples, and lush jungle adventures. English-speaking Caribbean vibes.",
      seasonality: { winter: 1.4, spring: 1.1, summer: 0.8, fall: 0.85 } },

    // South America
    { city: "Buenos Aires", region: "Buenos Aires", country: "Argentina", lat: -34.6, lon: -58.38,
      type: "fly", flightFromNYC: { low: 500, mid: 800, high: 1300 },
      accommodation: { budget: 35, mid: 80, luxury: 200 },
      activities: 40, food: 45, description: "The Paris of South America. Tango, world-class steak, stunning architecture, and passionate football culture.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 0.85, fall: 1.1 } },

    { city: "Rio de Janeiro", region: "Rio de Janeiro", country: "Brazil", lat: -22.91, lon: -43.17,
      type: "fly", flightFromNYC: { low: 450, mid: 750, high: 1200 },
      accommodation: { budget: 40, mid: 100, luxury: 280 },
      activities: 50, food: 40, description: "Christ the Redeemer, Sugarloaf Mountain, Copacabana Beach, and samba rhythms. Pure Brazilian energy.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 0.9, fall: 1.4 } },

    { city: "Lima", region: "Lima", country: "Peru", lat: -12.05, lon: -77.04,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 900 },
      accommodation: { budget: 30, mid: 70, luxury: 180 },
      activities: 35, food: 40, description: "Culinary capital of South America. Gateway to Machu Picchu with rich colonial history and stunning coastal views.",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.0, fall: 1.2 } },

    { city: "Cartagena", region: "Bolivar", country: "Colombia", lat: 10.39, lon: -75.51,
      type: "fly", flightFromNYC: { low: 200, mid: 350, high: 550 },
      accommodation: { budget: 35, mid: 85, luxury: 220 },
      activities: 40, food: 35, description: "Colorful colonial walled city on the Caribbean. Beautiful beaches, vibrant nightlife, and rich history.",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.9, fall: 0.95 } },

    { city: "Bogotá", region: "Cundinamarca", country: "Colombia", lat: 4.71, lon: -74.07,
      type: "fly", flightFromNYC: { low: 180, mid: 320, high: 500 },
      accommodation: { budget: 30, mid: 70, luxury: 180 },
      activities: 35, food: 30, description: "High-altitude capital with world-class museums, thriving food scene, street art, and amazing coffee culture.",
      seasonality: { winter: 1.1, spring: 1.0, summer: 0.95, fall: 1.0 } },

    { city: "Santiago", region: "Santiago Metropolitan", country: "Chile", lat: -33.45, lon: -70.67,
      type: "fly", flightFromNYC: { low: 450, mid: 700, high: 1100 },
      accommodation: { budget: 40, mid: 90, luxury: 220 },
      activities: 45, food: 40, description: "Modern metropolis framed by the Andes. World-class wine country, ski resorts, and gateway to Patagonia.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 0.9, fall: 1.2 } },

    { city: "Quito", region: "Pichincha", country: "Ecuador", lat: -0.18, lon: -78.47,
      type: "fly", flightFromNYC: { low: 300, mid: 480, high: 750 },
      accommodation: { budget: 30, mid: 65, luxury: 160 },
      activities: 40, food: 25, description: "UNESCO World Heritage colonial center at 9,000 feet. Gateway to the Galápagos, Amazon, and the equator.",
      seasonality: { winter: 1.0, spring: 1.0, summer: 1.0, fall: 1.0 } },

    { city: "Medellín", region: "Antioquia", country: "Colombia", lat: 6.25, lon: -75.56,
      type: "fly", flightFromNYC: { low: 200, mid: 340, high: 520 },
      accommodation: { budget: 25, mid: 60, luxury: 150 },
      activities: 35, food: 25, description: "City of eternal spring with perfect weather year-round. Innovative urban transformation and vibrant nightlife.",
      seasonality: { winter: 1.2, spring: 1.0, summer: 0.9, fall: 1.0 } },

    // Europe
    { city: "London", region: "England", country: "UK", lat: 51.51, lon: -0.13,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 900 },
      accommodation: { budget: 80, mid: 180, luxury: 450 },
      activities: 60, food: 65, description: "Iconic landmarks, world-class museums (many free!), theater, royalty, and diverse neighborhoods to explore.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Paris", region: "Île-de-France", country: "France", lat: 48.86, lon: 2.35,
      type: "fly", flightFromNYC: { low: 320, mid: 520, high: 850 },
      accommodation: { budget: 70, mid: 160, luxury: 400 },
      activities: 55, food: 60, description: "The City of Light. Art, cuisine, fashion, romance, and timeless architecture at every turn.",
      seasonality: { winter: 0.9, spring: 1.1, summer: 1.3, fall: 1.0 } },

    { city: "Barcelona", region: "Catalonia", country: "Spain", lat: 41.39, lon: 2.17,
      type: "fly", flightFromNYC: { low: 300, mid: 500, high: 800 },
      accommodation: { budget: 60, mid: 130, luxury: 320 },
      activities: 50, food: 50, description: "Gaudí's masterpieces, Mediterranean beaches, tapas culture, and vibrant nightlife. Art and architecture paradise.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.4, fall: 1.1 } },

    { city: "Rome", region: "Lazio", country: "Italy", lat: 41.9, lon: 12.5,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 900 },
      accommodation: { budget: 65, mid: 140, luxury: 350 },
      activities: 50, food: 55, description: "The Eternal City. Ancient ruins, Vatican treasures, incredible pasta, and 3,000 years of history.",
      seasonality: { winter: 0.85, spring: 1.1, summer: 1.3, fall: 1.0 } },

    { city: "Amsterdam", region: "North Holland", country: "Netherlands", lat: 52.37, lon: 4.9,
      type: "fly", flightFromNYC: { low: 320, mid: 500, high: 800 },
      accommodation: { budget: 70, mid: 150, luxury: 350 },
      activities: 50, food: 55, description: "Canal-laced charm with world-class museums, cycling culture, liberal vibes, and beautiful Dutch architecture.",
      seasonality: { winter: 0.8, spring: 1.2, summer: 1.3, fall: 0.95 } },

    { city: "Lisbon", region: "Lisbon", country: "Portugal", lat: 38.72, lon: -9.14,
      type: "fly", flightFromNYC: { low: 280, mid: 450, high: 700 },
      accommodation: { budget: 50, mid: 110, luxury: 280 },
      activities: 40, food: 45, description: "Hilly coastal capital with stunning views, historic trams, pastel buildings, and the world's best custard tarts.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Prague", region: "Bohemia", country: "Czech Republic", lat: 50.08, lon: 14.44,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 45, mid: 100, luxury: 250 },
      activities: 40, food: 35, description: "Fairy-tale medieval architecture, legendary beer culture, Gothic charm, and incredible value for Europe.",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.3, fall: 1.1 } },

    { city: "Budapest", region: "Central Hungary", country: "Hungary", lat: 47.5, lon: 19.04,
      type: "fly", flightFromNYC: { low: 380, mid: 580, high: 900 },
      accommodation: { budget: 40, mid: 90, luxury: 220 },
      activities: 40, food: 35, description: "Stunning Danube views, thermal baths, ruin bars, and grand architecture. One of Europe's best values.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.2, fall: 1.1 } },

    { city: "Vienna", region: "Vienna", country: "Austria", lat: 48.21, lon: 16.37,
      type: "fly", flightFromNYC: { low: 380, mid: 580, high: 920 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 50, food: 50, description: "Imperial palaces, classical music heritage, coffee house culture, and world-class museums. Pure elegance.",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Athens", region: "Attica", country: "Greece", lat: 37.98, lon: 23.73,
      type: "fly", flightFromNYC: { low: 400, mid: 620, high: 950 },
      accommodation: { budget: 50, mid: 110, luxury: 280 },
      activities: 45, food: 40, description: "Birthplace of democracy and Western civilization. Ancient ruins, island-hopping gateway, and amazing Mediterranean food.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.4, fall: 1.1 } },

    { city: "Dublin", region: "Leinster", country: "Ireland", lat: 53.35, lon: -6.26,
      type: "fly", flightFromNYC: { low: 280, mid: 450, high: 700 },
      accommodation: { budget: 65, mid: 150, luxury: 350 },
      activities: 45, food: 50, description: "Literary heritage, legendary pubs, Georgian architecture, and friendly locals. Gateway to stunning Irish countryside.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Edinburgh", region: "Scotland", country: "UK", lat: 55.95, lon: -3.19,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 60, mid: 140, luxury: 340 },
      activities: 45, food: 50, description: "Dramatic castle, medieval Old Town, world-class festivals, and gateway to the Scottish Highlands.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.4, fall: 1.1 } },

    { city: "Manchester", region: "England", country: "UK", lat: 53.48, lon: -2.24,
      type: "fly", flightFromNYC: { low: 340, mid: 540, high: 840 },
      accommodation: { budget: 50, mid: 110, luxury: 280 },
      activities: 40, food: 45, description: "Music heritage, football culture, Victorian architecture, and a thriving food and nightlife scene.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Birmingham", region: "England", country: "UK", lat: 52.49, lon: -1.90,
      type: "fly", flightFromNYC: { low: 340, mid: 540, high: 840 },
      accommodation: { budget: 45, mid: 100, luxury: 260 },
      activities: 35, food: 40, description: "Britain's second city with world-class museums, diverse food scene, and easy access to the Cotswolds.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.15, fall: 1.0 } },

    { city: "Bristol", region: "England", country: "UK", lat: 51.45, lon: -2.59,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 50, mid: 110, luxury: 280 },
      activities: 40, food: 45, description: "Creative hub with street art, harbourside dining, independent shops, and gateway to Bath and the southwest.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Liverpool", region: "England", country: "UK", lat: 53.41, lon: -2.98,
      type: "fly", flightFromNYC: { low: 340, mid: 540, high: 840 },
      accommodation: { budget: 45, mid: 100, luxury: 260 },
      activities: 40, food: 40, description: "Beatles heritage, stunning waterfront, world-class museums, and passionate football culture.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Glasgow", region: "Scotland", country: "UK", lat: 55.86, lon: -4.25,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 50, mid: 110, luxury: 280 },
      activities: 40, food: 45, description: "Victorian architecture, vibrant music scene, excellent museums, and gateway to the Highlands and lochs.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Bath", region: "England", country: "UK", lat: 51.38, lon: -2.36,
      type: "fly", flightFromNYC: { low: 360, mid: 560, high: 860 },
      accommodation: { budget: 60, mid: 130, luxury: 320 },
      activities: 45, food: 50, description: "Stunning Georgian architecture, Roman baths, Jane Austen connections, and beautiful countryside.",
      seasonality: { winter: 0.85, spring: 1.1, summer: 1.3, fall: 1.1 } },

    { city: "York", region: "England", country: "UK", lat: 53.96, lon: -1.08,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 55, mid: 120, luxury: 300 },
      activities: 40, food: 45, description: "Medieval walls, stunning Minster, charming Shambles, Viking heritage, and chocolate history.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.25, fall: 1.1 } },

    { city: "Cambridge", region: "England", country: "UK", lat: 52.21, lon: 0.12,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 55, mid: 125, luxury: 320 },
      activities: 40, food: 45, description: "Historic university city with stunning colleges, punting on the Cam, and peaceful meadows.",
      seasonality: { winter: 0.8, spring: 1.1, summer: 1.3, fall: 1.0 } },

    { city: "Oxford", region: "England", country: "UK", lat: 51.75, lon: -1.25,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 55, mid: 125, luxury: 320 },
      activities: 40, food: 45, description: "Dreaming spires, ancient colleges, Bodleian Library, covered market, and Harry Potter filming locations.",
      seasonality: { winter: 0.8, spring: 1.1, summer: 1.3, fall: 1.0 } },

    { city: "Berlin", region: "Berlin", country: "Germany", lat: 52.52, lon: 13.4,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 50, mid: 120, luxury: 300 },
      activities: 45, food: 45, description: "History, art, nightlife, and creativity collide. Vibrant neighborhoods, world-class museums, and incredible street food.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Munich", region: "Bavaria", country: "Germany", lat: 48.14, lon: 11.58,
      type: "fly", flightFromNYC: { low: 380, mid: 580, high: 900 },
      accommodation: { budget: 60, mid: 140, luxury: 340 },
      activities: 50, food: 50, description: "Bavarian charm, beer gardens, Oktoberfest, alpine day trips, and beautiful old town squares.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.2, fall: 1.4 } },

    // Additional German cities for driving destinations
    { city: "Dresden", region: "Saxony", country: "Germany", lat: 51.05, lon: 13.74,
      type: "drive", flightFromNYC: { low: 400, mid: 600, high: 950 },
      accommodation: { budget: 45, mid: 100, luxury: 250 },
      activities: 40, food: 40, description: "The 'Florence on the Elbe' with stunning baroque architecture, rebuilt after WWII. Art galleries and nearby Saxon Switzerland.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Leipzig", region: "Saxony", country: "Germany", lat: 51.34, lon: 12.37,
      type: "drive", flightFromNYC: { low: 400, mid: 600, high: 950 },
      accommodation: { budget: 40, mid: 90, luxury: 220 },
      activities: 35, food: 35, description: "Creative hub with vibrant arts scene, Bach heritage, alternative culture, and excellent nightlife.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Hamburg", region: "Hamburg", country: "Germany", lat: 53.55, lon: 9.99,
      type: "drive", flightFromNYC: { low: 380, mid: 580, high: 900 },
      accommodation: { budget: 55, mid: 120, luxury: 300 },
      activities: 45, food: 50, description: "Germany's gateway to the world with stunning harbor, Reeperbahn nightlife, and Elbphilharmonie concert hall.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Frankfurt", region: "Hesse", country: "Germany", lat: 50.11, lon: 8.68,
      type: "drive", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 60, mid: 130, luxury: 320 },
      activities: 45, food: 50, description: "Financial hub with stunning skyline, excellent museums, and great transport connections to wine country.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.2, fall: 1.1 } },

    { city: "Cologne", region: "North Rhine-Westphalia", country: "Germany", lat: 50.94, lon: 6.96,
      type: "drive", flightFromNYC: { low: 360, mid: 560, high: 880 },
      accommodation: { budget: 50, mid: 110, luxury: 280 },
      activities: 40, food: 45, description: "Gothic cathedral city on the Rhine with Roman history, vibrant carnival, and excellent beer halls.",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.2, fall: 1.0 } },

    // Central European cities within driving distance
    { city: "Prague", region: "Bohemia", country: "Czech Republic", lat: 50.08, lon: 14.44,
      type: "drive", flightFromNYC: { low: 350, mid: 550, high: 900 },
      accommodation: { budget: 40, mid: 90, luxury: 250 },
      activities: 40, food: 35, description: "Fairy-tale city with stunning castle, Charles Bridge, affordable beer, and incredible architecture.",
      seasonality: { winter: 0.9, spring: 1.1, summer: 1.4, fall: 1.0 } },

    { city: "Vienna", region: "Vienna", country: "Austria", lat: 48.21, lon: 16.37,
      type: "drive", flightFromNYC: { low: 380, mid: 600, high: 950 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 50, food: 50, description: "Imperial grandeur with world-class opera, coffee house culture, stunning palaces, and classical music heritage.",
      seasonality: { winter: 0.95, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Salzburg", region: "Salzburg", country: "Austria", lat: 47.80, lon: 13.04,
      type: "drive", flightFromNYC: { low: 400, mid: 620, high: 980 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 50, food: 45, description: "Mozart's birthplace with baroque old town, Alpine views, Sound of Music locations, and Christmas markets.",
      seasonality: { winter: 1.1, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Krakow", region: "Lesser Poland", country: "Poland", lat: 50.06, lon: 19.94,
      type: "drive", flightFromNYC: { low: 350, mid: 550, high: 880 },
      accommodation: { budget: 30, mid: 70, luxury: 180 },
      activities: 35, food: 25, description: "Poland's cultural capital with stunning old town, Jewish heritage, cheap and delicious food, and vibrant nightlife.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Warsaw", region: "Masovia", country: "Poland", lat: 52.23, lon: 21.01,
      type: "drive", flightFromNYC: { low: 360, mid: 560, high: 900 },
      accommodation: { budget: 35, mid: 80, luxury: 200 },
      activities: 35, food: 30, description: "Rebuilt from WWII rubble with charming old town, excellent museums, and emerging foodie scene.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Budapest", region: "Central Hungary", country: "Hungary", lat: 47.50, lon: 19.04,
      type: "drive", flightFromNYC: { low: 380, mid: 580, high: 920 },
      accommodation: { budget: 35, mid: 85, luxury: 220 },
      activities: 40, food: 30, description: "Stunning Danube city with thermal baths, ruin bars, incredible architecture, and amazing value.",
      seasonality: { winter: 0.85, spring: 1.1, summer: 1.3, fall: 1.0 } },

    { city: "Zurich", region: "Zurich", country: "Switzerland", lat: 47.38, lon: 8.54,
      type: "drive", flightFromNYC: { low: 450, mid: 700, high: 1100 },
      accommodation: { budget: 100, mid: 200, luxury: 500 },
      activities: 70, food: 80, description: "Clean, efficient Swiss city with stunning lake, Alps nearby, world-class chocolate, and excellent quality of life.",
      seasonality: { winter: 1.0, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Brussels", region: "Brussels", country: "Belgium", lat: 50.85, lon: 4.35,
      type: "drive", flightFromNYC: { low: 350, mid: 550, high: 880 },
      accommodation: { budget: 60, mid: 130, luxury: 300 },
      activities: 45, food: 55, description: "EU capital with Art Nouveau architecture, world-famous chocolate, waffles, beer, and quirky museums.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Copenhagen", region: "Capital Region", country: "Denmark", lat: 55.68, lon: 12.57,
      type: "fly", flightFromNYC: { low: 380, mid: 600, high: 950 },
      accommodation: { budget: 70, mid: 160, luxury: 400 },
      activities: 55, food: 60, description: "Scandinavian design capital with world-class restaurants, fairy-tale harbor, cycling culture, and hygge lifestyle.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Stockholm", region: "Stockholm", country: "Sweden", lat: 59.33, lon: 18.07,
      type: "fly", flightFromNYC: { low: 400, mid: 620, high: 980 },
      accommodation: { budget: 70, mid: 160, luxury: 400 },
      activities: 55, food: 60, description: "Built on 14 islands with stunning waterways, innovative design, historic old town, and Nordic beauty.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.5, fall: 1.0 } },

    // Additional Scandinavian cities for driving
    // Denmark
    { city: "Aarhus", region: "Central Denmark", country: "Denmark", lat: 56.16, lon: 10.20,
      type: "drive", flightFromNYC: { low: 400, mid: 620, high: 980 },
      accommodation: { budget: 60, mid: 140, luxury: 350 },
      activities: 50, food: 55, description: "Denmark's second city with Viking history, ARoS art museum, charming Latin Quarter, and young creative energy.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Odense", region: "Southern Denmark", country: "Denmark", lat: 55.40, lon: 10.39,
      type: "drive", flightFromNYC: { low: 420, mid: 640, high: 1000 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 45, food: 50, description: "Hans Christian Andersen's birthplace with charming old town, excellent museums, and gateway to Funen island.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Aalborg", region: "North Denmark", country: "Denmark", lat: 57.05, lon: 9.92,
      type: "drive", flightFromNYC: { low: 420, mid: 640, high: 1000 },
      accommodation: { budget: 50, mid: 120, luxury: 300 },
      activities: 40, food: 45, description: "Viking heritage meets modern waterfront. Great nightlife, Utzon Center, and gateway to northern Jutland beaches.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.4, fall: 1.0 } },

    // Sweden
    { city: "Gothenburg", region: "Västra Götaland", country: "Sweden", lat: 57.71, lon: 11.97,
      type: "drive", flightFromNYC: { low: 420, mid: 640, high: 1000 },
      accommodation: { budget: 65, mid: 150, luxury: 380 },
      activities: 50, food: 55, description: "Sweden's friendly second city with excellent seafood, Liseberg amusement park, beautiful archipelago, and relaxed vibes.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Malmö", region: "Skåne", country: "Sweden", lat: 55.60, lon: 13.00,
      type: "drive", flightFromNYC: { low: 400, mid: 620, high: 980 },
      accommodation: { budget: 60, mid: 140, luxury: 350 },
      activities: 45, food: 50, description: "Trendy city connected to Copenhagen by bridge. Turning Torso tower, diverse food scene, and beautiful parks.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Uppsala", region: "Uppsala", country: "Sweden", lat: 59.86, lon: 17.64,
      type: "drive", flightFromNYC: { low: 420, mid: 640, high: 1000 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 40, food: 45, description: "Historic university town with stunning cathedral, Viking burial mounds, and charming student atmosphere.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Helsingborg", region: "Skåne", country: "Sweden", lat: 56.05, lon: 12.69,
      type: "drive", flightFromNYC: { low: 420, mid: 640, high: 1000 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 40, food: 45, description: "Charming coastal city with medieval tower, ferry connection to Denmark, and gateway to Swedish Riviera.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.4, fall: 1.0 } },

    // Norway
    { city: "Oslo", region: "Oslo", country: "Norway", lat: 59.91, lon: 10.75,
      type: "drive", flightFromNYC: { low: 400, mid: 620, high: 980 },
      accommodation: { budget: 80, mid: 180, luxury: 450 },
      activities: 60, food: 70, description: "Compact capital surrounded by fjords and forests. Viking ships, Munch Museum, opera house, and outdoor lifestyle.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Bergen", region: "Vestland", country: "Norway", lat: 60.39, lon: 5.32,
      type: "drive", flightFromNYC: { low: 450, mid: 700, high: 1100 },
      accommodation: { budget: 75, mid: 170, luxury: 420 },
      activities: 65, food: 65, description: "Gateway to the fjords with colorful Bryggen wharf, funicular views, and dramatic mountain scenery.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.5, fall: 1.0 } },

    { city: "Stavanger", region: "Rogaland", country: "Norway", lat: 58.97, lon: 5.73,
      type: "drive", flightFromNYC: { low: 450, mid: 700, high: 1100 },
      accommodation: { budget: 70, mid: 160, luxury: 400 },
      activities: 60, food: 60, description: "Oil capital with charming old town, Pulpit Rock nearby, and beautiful Lysefjord for hiking adventures.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.5, fall: 1.0 } },

    { city: "Trondheim", region: "Trøndelag", country: "Norway", lat: 63.43, lon: 10.39,
      type: "drive", flightFromNYC: { low: 480, mid: 740, high: 1150 },
      accommodation: { budget: 70, mid: 160, luxury: 400 },
      activities: 55, food: 60, description: "Historic pilgrimage city with stunning Nidaros Cathedral, colorful warehouses, and student energy.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.5, fall: 1.0 } },

    { city: "Tromsø", region: "Troms", country: "Norway", lat: 69.65, lon: 18.96,
      type: "drive", flightFromNYC: { low: 550, mid: 850, high: 1300 },
      accommodation: { budget: 80, mid: 180, luxury: 450 },
      activities: 80, food: 65, description: "Arctic capital and best place for Northern Lights. Midnight sun, Arctic Cathedral, and whale watching.",
      seasonality: { winter: 1.3, spring: 1.0, summer: 1.2, fall: 1.1 } },

    // Finland
    { city: "Helsinki", region: "Uusimaa", country: "Finland", lat: 60.17, lon: 24.94,
      type: "drive", flightFromNYC: { low: 420, mid: 650, high: 1000 },
      accommodation: { budget: 65, mid: 150, luxury: 380 },
      activities: 50, food: 55, description: "Design capital with stunning architecture, sauna culture, island fortress, and gateway to Lapland.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Turku", region: "Southwest Finland", country: "Finland", lat: 60.45, lon: 22.27,
      type: "drive", flightFromNYC: { low: 450, mid: 680, high: 1050 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 45, food: 50, description: "Finland's oldest city with medieval castle, beautiful archipelago, and historic riverside charm.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Tampere", region: "Pirkanmaa", country: "Finland", lat: 61.50, lon: 23.79,
      type: "drive", flightFromNYC: { low: 450, mid: 680, high: 1050 },
      accommodation: { budget: 50, mid: 120, luxury: 300 },
      activities: 45, food: 45, description: "Industrial heritage turned creative hub between two lakes. Excellent museums and authentic sauna culture.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Reykjavik", region: "Capital Region", country: "Iceland", lat: 64.15, lon: -21.95,
      type: "fly", flightFromNYC: { low: 280, mid: 450, high: 700 },
      accommodation: { budget: 80, mid: 180, luxury: 400 },
      activities: 100, food: 70, description: "Gateway to otherworldly landscapes. Northern lights, geysers, glaciers, and hot springs in Europe's most unique capital.",
      seasonality: { winter: 1.0, spring: 1.1, summer: 1.5, fall: 1.2 } },

    { city: "Istanbul", region: "Marmara", country: "Turkey", lat: 41.01, lon: 28.98,
      type: "fly", flightFromNYC: { low: 450, mid: 700, high: 1100 },
      accommodation: { budget: 40, mid: 90, luxury: 220 },
      activities: 40, food: 35, description: "Where East meets West. Byzantine treasures, Ottoman grandeur, bustling bazaars, and incredible cuisine.",
      seasonality: { winter: 0.8, spring: 1.1, summer: 1.3, fall: 1.1 } },

    { city: "Marrakech", region: "Marrakech-Safi", country: "Morocco", lat: 31.63, lon: -8.0,
      type: "fly", flightFromNYC: { low: 400, mid: 650, high: 1000 },
      accommodation: { budget: 35, mid: 80, luxury: 250 },
      activities: 40, food: 30, description: "Sensory overload in the best way. Souks, palaces, gardens, and the magical Jemaa el-Fnaa square.",
      seasonality: { winter: 1.1, spring: 1.2, summer: 0.7, fall: 1.1 } },

    // Australia & Oceania
    { city: "Sydney", region: "New South Wales", country: "Australia", lat: -33.87, lon: 151.21,
      type: "fly", flightFromNYC: { low: 800, mid: 1200, high: 2000 },
      accommodation: { budget: 70, mid: 160, luxury: 400 },
      activities: 60, food: 60, description: "Iconic harbor, stunning beaches, world-class dining, and laid-back Aussie lifestyle. A bucket-list destination.",
      seasonality: { winter: 0.85, spring: 1.1, summer: 0.9, fall: 1.3 } },

    { city: "Melbourne", region: "Victoria", country: "Australia", lat: -37.81, lon: 144.96,
      type: "fly", flightFromNYC: { low: 800, mid: 1200, high: 2000 },
      accommodation: { budget: 65, mid: 150, luxury: 380 },
      activities: 55, food: 55, description: "Australia's cultural capital with street art, coffee culture, live music, and gateway to the Great Ocean Road.",
      seasonality: { winter: 0.8, spring: 1.1, summer: 0.9, fall: 1.3 } },

    // Australian road trips & regional destinations
    { city: "Great Ocean Road", region: "Victoria", country: "Australia", lat: -38.68, lon: 143.39,
      type: "drive", driveHoursFromMelbourne: 2.5,
      accommodation: { budget: 60, mid: 140, luxury: 320 },
      activities: 40, food: 45, description: "One of the world's most scenic coastal drives. See the Twelve Apostles, rainforest walks, and charming surf towns.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.3, fall: 1.1 } },

    { city: "Wilson's Promontory", region: "Victoria", country: "Australia", lat: -39.03, lon: 146.42,
      type: "drive", driveHoursFromMelbourne: 3,
      accommodation: { budget: 40, mid: 100, luxury: 220 },
      activities: 35, food: 35, description: "Victoria's wilderness gem. Pristine beaches, coastal hiking, abundant wildlife, and stunning sunsets at Australia's southernmost mainland point.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Phillip Island", region: "Victoria", country: "Australia", lat: -38.49, lon: 145.23,
      type: "drive", driveHoursFromMelbourne: 2,
      accommodation: { budget: 55, mid: 130, luxury: 280 },
      activities: 50, food: 45, description: "Famous for the nightly penguin parade, plus koalas, seals, and the MotoGP circuit. Perfect family getaway.",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.3, fall: 1.0 } },

    { city: "Yarra Valley", region: "Victoria", country: "Australia", lat: -37.71, lon: 145.58,
      type: "drive", driveHoursFromMelbourne: 1,
      accommodation: { budget: 70, mid: 160, luxury: 400 },
      activities: 60, food: 70, description: "Victoria's premier wine region. World-class wineries, gourmet restaurants, hot air ballooning, and stunning valley views.",
      seasonality: { winter: 0.8, spring: 1.0, summer: 1.1, fall: 1.3 } },

    { city: "Mornington Peninsula", region: "Victoria", country: "Australia", lat: -38.35, lon: 145.0,
      type: "drive", driveHoursFromMelbourne: 1,
      accommodation: { budget: 65, mid: 150, luxury: 380 },
      activities: 55, food: 65, description: "Beaches, wineries, hot springs, and artisan food. Melbourne's favorite weekend escape with coastal charm.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.4, fall: 1.1 } },

    { city: "Grampians", region: "Victoria", country: "Australia", lat: -37.14, lon: 142.52,
      type: "drive", driveHoursFromMelbourne: 3,
      accommodation: { budget: 50, mid: 120, luxury: 280 },
      activities: 45, food: 40, description: "Dramatic sandstone mountains with incredible hiking, Aboriginal rock art, waterfalls, and native wildlife.",
      seasonality: { winter: 0.8, spring: 1.2, summer: 1.0, fall: 1.1 } },

    { city: "Ballarat", region: "Victoria", country: "Australia", lat: -37.56, lon: 143.86,
      type: "drive", driveHoursFromMelbourne: 1.5,
      accommodation: { budget: 50, mid: 110, luxury: 250 },
      activities: 40, food: 40, description: "Gold rush history comes alive at Sovereign Hill. Beautiful gardens, historic architecture, and thriving arts scene.",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.0, fall: 1.0 } },

    { city: "Bendigo", region: "Victoria", country: "Australia", lat: -36.76, lon: 144.28,
      type: "drive", driveHoursFromMelbourne: 2,
      accommodation: { budget: 50, mid: 110, luxury: 260 },
      activities: 40, food: 45, description: "Stunning Victorian architecture, underground mine tours, excellent food and wine, and a thriving creative culture.",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.0, fall: 1.05 } },

    // Australian flights
    { city: "Hobart", region: "Tasmania", country: "Australia", lat: -42.88, lon: 147.33,
      type: "fly", flightFromNYC: { low: 850, mid: 1300, high: 2100 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 50, food: 55, description: "Australia's second-oldest city. MONA museum, fresh seafood, historic waterfront, and gateway to Tasmanian wilderness.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.3, fall: 1.1 } },

    { city: "Launceston", region: "Tasmania", country: "Australia", lat: -41.44, lon: 147.14,
      type: "fly", flightFromNYC: { low: 850, mid: 1300, high: 2100 },
      accommodation: { budget: 50, mid: 120, luxury: 280 },
      activities: 45, food: 50, description: "Cataract Gorge in the city center, excellent wine region, and gateway to Tasmania's stunning northeast.",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.3, fall: 1.1 } },

    { city: "Cairns", region: "Queensland", country: "Australia", lat: -16.92, lon: 145.77,
      type: "fly", flightFromNYC: { low: 800, mid: 1200, high: 2000 },
      accommodation: { budget: 55, mid: 130, luxury: 350 },
      activities: 80, food: 50, description: "Gateway to the Great Barrier Reef and Daintree Rainforest. Snorkel, dive, and explore two World Heritage wonders.",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.7, fall: 0.9 } },

    { city: "Gold Coast", region: "Queensland", country: "Australia", lat: -28.0, lon: 153.43,
      type: "fly", flightFromNYC: { low: 800, mid: 1200, high: 2000 },
      accommodation: { budget: 60, mid: 140, luxury: 350 },
      activities: 60, food: 50, description: "Surf beaches, theme parks, vibrant nightlife, and lush hinterland rainforest. Australia's playground.",
      seasonality: { winter: 1.0, spring: 1.1, summer: 1.2, fall: 1.0 } },

    { city: "Brisbane", region: "Queensland", country: "Australia", lat: -27.47, lon: 153.03,
      type: "fly", flightFromNYC: { low: 800, mid: 1200, high: 2000 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 45, food: 50, description: "Sunny river city with South Bank cultural precinct, rooftop bars, and easy access to beaches and islands.",
      seasonality: { winter: 1.1, spring: 1.0, summer: 0.9, fall: 1.0 } },

    { city: "Adelaide", region: "South Australia", country: "Australia", lat: -34.93, lon: 138.6,
      type: "fly", flightFromNYC: { low: 800, mid: 1200, high: 2000 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 50, food: 55, description: "Festival city surrounded by world-class wine regions. Barossa Valley, McLaren Vale, and Kangaroo Island await.",
      seasonality: { winter: 0.85, spring: 1.1, summer: 1.0, fall: 1.1 } },

    { city: "Perth", region: "Western Australia", country: "Australia", lat: -31.95, lon: 115.86,
      type: "fly", flightFromNYC: { low: 850, mid: 1300, high: 2200 },
      accommodation: { budget: 60, mid: 140, luxury: 350 },
      activities: 50, food: 50, description: "Australia's sunniest city with pristine beaches, vibrant food scene, and gateway to Margaret River wine country.",
      seasonality: { winter: 0.9, spring: 1.1, summer: 1.0, fall: 1.0 } },

    { city: "Uluru", region: "Northern Territory", country: "Australia", lat: -25.34, lon: 131.04,
      type: "fly", flightFromNYC: { low: 900, mid: 1400, high: 2300 },
      accommodation: { budget: 80, mid: 200, luxury: 600 },
      activities: 70, food: 60, description: "The spiritual heart of Australia. Witness sunrise and sunset over the sacred red rock and learn ancient Aboriginal culture.",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.6, fall: 1.0 } },

    { city: "Darwin", region: "Northern Territory", country: "Australia", lat: -12.46, lon: 130.84,
      type: "fly", flightFromNYC: { low: 850, mid: 1300, high: 2100 },
      accommodation: { budget: 55, mid: 140, luxury: 320 },
      activities: 60, food: 50, description: "Tropical frontier city. Gateway to Kakadu National Park, crocodile encounters, and spectacular wet season storms.",
      seasonality: { winter: 1.4, spring: 1.0, summer: 0.6, fall: 0.8 } },

    // New Zealand additions
    { city: "Wellington", region: "Wellington", country: "New Zealand", lat: -41.29, lon: 174.78,
      type: "fly", flightFromNYC: { low: 850, mid: 1300, high: 2200 },
      accommodation: { budget: 55, mid: 130, luxury: 320 },
      activities: 50, food: 55, description: "New Zealand's creative capital. Craft beer, Te Papa museum, vibrant cafe culture, and stunning harbor views.",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.2, fall: 1.0 } },

    { city: "Queenstown", region: "Otago", country: "New Zealand", lat: -45.03, lon: 168.66,
      type: "fly", flightFromNYC: { low: 900, mid: 1400, high: 2300 },
      accommodation: { budget: 65, mid: 160, luxury: 450 },
      activities: 90, food: 55, description: "Adventure capital of the world. Bungee jumping, skiing, jet boating, and jaw-dropping mountain scenery.",
      seasonality: { winter: 1.3, spring: 1.0, summer: 1.0, fall: 1.2 } },

    { city: "Auckland", region: "Auckland", country: "New Zealand", lat: -36.85, lon: 174.76,
      type: "fly", flightFromNYC: { low: 850, mid: 1300, high: 2200 },
      accommodation: { budget: 60, mid: 140, luxury: 350 },
      activities: 60, food: 55, description: "City of Sails surrounded by beaches, rainforests, and wine regions. Gateway to Middle-earth landscapes.",
      seasonality: { winter: 0.8, spring: 1.1, summer: 0.9, fall: 1.3 } },

    { city: "Fiji", region: "Viti Levu", country: "Fiji", lat: -17.77, lon: 177.97,
      type: "fly", flightFromNYC: { low: 800, mid: 1200, high: 1800 },
      accommodation: { budget: 70, mid: 180, luxury: 500 },
      activities: 60, food: 50, description: "Tropical paradise with pristine beaches, crystal-clear waters, and some of the friendliest people on Earth.",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.8, fall: 0.9 } },

    // More Asia destinations
    { city: "Singapore", region: "Singapore", country: "Singapore", lat: 1.35, lon: 103.82,
      type: "fly", flightFromNYC: { low: 600, mid: 950, high: 1500 },
      accommodation: { budget: 60, mid: 150, luxury: 400 },
      activities: 55, food: 40, description: "Futuristic city-state with incredible food, Gardens by the Bay, and a perfect blend of cultures.",
      seasonality: { winter: 1.1, spring: 1.0, summer: 1.0, fall: 1.0 } },

    { city: "Ho Chi Minh City", region: "Southern Vietnam", country: "Vietnam", lat: 10.82, lon: 106.63,
      type: "fly", flightFromNYC: { low: 550, mid: 850, high: 1300 },
      accommodation: { budget: 25, mid: 60, luxury: 150 },
      activities: 30, food: 20, description: "Buzzing energy, incredible street food, French colonial architecture, and gateway to the Mekong Delta.",
      seasonality: { winter: 1.2, spring: 1.0, summer: 0.8, fall: 0.9 } },

    { city: "Seoul", region: "Seoul", country: "South Korea", lat: 37.57, lon: 126.98,
      type: "fly", flightFromNYC: { low: 550, mid: 850, high: 1350 },
      accommodation: { budget: 45, mid: 100, luxury: 280 },
      activities: 45, food: 40, description: "K-pop, ancient palaces, cutting-edge technology, and some of the world's best food. Tradition meets tomorrow.",
      seasonality: { winter: 0.85, spring: 1.2, summer: 1.0, fall: 1.2 } },

    { city: "Manila", region: "Metro Manila", country: "Philippines", lat: 14.6, lon: 120.98,
      type: "fly", flightFromNYC: { low: 550, mid: 900, high: 1400 },
      accommodation: { budget: 30, mid: 70, luxury: 180 },
      activities: 35, food: 25, description: "Gateway to 7,000+ islands with stunning beaches, friendly locals, and incredible value for tropical paradise.",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.8, fall: 0.9 } },

    { city: "Kuala Lumpur", region: "Federal Territory", country: "Malaysia", lat: 3.14, lon: 101.69,
      type: "fly", flightFromNYC: { low: 580, mid: 900, high: 1400 },
      accommodation: { budget: 35, mid: 80, luxury: 200 },
      activities: 40, food: 30, description: "Iconic Petronas Towers, incredible multicultural food scene, and gateway to stunning beaches and rainforests.",
      seasonality: { winter: 1.1, spring: 1.0, summer: 0.95, fall: 1.0 } },

    // Additional Asian Destinations
    { city: "Seoul", region: "Capital Area", country: "South Korea", lat: 37.57, lon: 126.98,
      type: "fly", flightFromNYC: { low: 650, mid: 1000, high: 1600 },
      accommodation: { budget: 45, mid: 100, luxury: 280 },
      activities: 45, food: 40, description: "K-pop, incredible street food, ancient palaces, and cutting-edge technology blend seamlessly in this dynamic capital.",
      seasonality: { winter: 0.85, spring: 1.3, summer: 1.0, fall: 1.3 } },

    { city: "Kyoto", region: "Kansai", country: "Japan", lat: 35.01, lon: 135.77,
      type: "fly", flightFromNYC: { low: 620, mid: 980, high: 1550 },
      accommodation: { budget: 55, mid: 130, luxury: 400 },
      activities: 50, food: 45, description: "Ancient temples, traditional geisha districts, stunning bamboo groves, and Japan's cultural heart.",
      seasonality: { winter: 0.85, spring: 1.5, summer: 1.0, fall: 1.4 } },

    { city: "Osaka", region: "Kansai", country: "Japan", lat: 34.69, lon: 135.50,
      type: "fly", flightFromNYC: { low: 600, mid: 950, high: 1500 },
      accommodation: { budget: 45, mid: 110, luxury: 300 },
      activities: 45, food: 50, description: "Japan's kitchen with incredible street food, vibrant nightlife, and easy access to Kyoto and Nara.",
      seasonality: { winter: 0.9, spring: 1.4, summer: 1.0, fall: 1.2 } },

    { city: "Hong Kong", region: "Hong Kong", country: "Hong Kong", lat: 22.32, lon: 114.17,
      type: "fly", flightFromNYC: { low: 550, mid: 850, high: 1400 },
      accommodation: { budget: 60, mid: 150, luxury: 400 },
      activities: 50, food: 45, description: "Stunning skyline, dim sum paradise, hiking trails with harbor views, and vibrant night markets.",
      seasonality: { winter: 1.0, spring: 1.1, summer: 0.85, fall: 1.2 } },

    { city: "Taipei", region: "Northern Taiwan", country: "Taiwan", lat: 25.03, lon: 121.57,
      type: "fly", flightFromNYC: { low: 550, mid: 850, high: 1350 },
      accommodation: { budget: 40, mid: 90, luxury: 250 },
      activities: 40, food: 35, description: "Night markets, bubble tea origins, stunning temples, and easy access to beautiful mountain scenery.",
      seasonality: { winter: 0.9, spring: 1.1, summer: 0.85, fall: 1.1 } },

    { city: "Hanoi", region: "Northern Vietnam", country: "Vietnam", lat: 21.03, lon: 105.85,
      type: "fly", flightFromNYC: { low: 500, mid: 800, high: 1300 },
      accommodation: { budget: 20, mid: 50, luxury: 150 },
      activities: 25, food: 15, description: "Charming Old Quarter, legendary pho, French colonial architecture, and gateway to Ha Long Bay.",
      seasonality: { winter: 1.0, spring: 1.2, summer: 0.8, fall: 1.1 } },

    { city: "Chiang Mai", region: "Northern Thailand", country: "Thailand", lat: 18.79, lon: 98.98,
      type: "fly", flightFromNYC: { low: 580, mid: 900, high: 1400 },
      accommodation: { budget: 20, mid: 50, luxury: 150 },
      activities: 30, food: 15, description: "Ancient temples, elephant sanctuaries, incredible food scene, and laid-back mountain vibes.",
      seasonality: { winter: 1.4, spring: 1.0, summer: 0.75, fall: 0.9 } },

    { city: "Phuket", region: "Southern Thailand", country: "Thailand", lat: 7.89, lon: 98.40,
      type: "fly", flightFromNYC: { low: 600, mid: 950, high: 1450 },
      accommodation: { budget: 30, mid: 80, luxury: 250 },
      activities: 40, food: 25, description: "Thailand's largest island with stunning beaches, vibrant nightlife, and world-class diving.",
      seasonality: { winter: 1.5, spring: 1.1, summer: 0.7, fall: 0.8 } },

    { city: "Siem Reap", region: "Siem Reap", country: "Cambodia", lat: 13.36, lon: 103.86,
      type: "fly", flightFromNYC: { low: 550, mid: 900, high: 1400 },
      accommodation: { budget: 15, mid: 45, luxury: 180 },
      activities: 35, food: 15, description: "Gateway to magnificent Angkor Wat, charming pub street, and authentic Khmer culture.",
      seasonality: { winter: 1.4, spring: 1.0, summer: 0.7, fall: 0.8 } },

    { city: "Mumbai", region: "Maharashtra", country: "India", lat: 19.08, lon: 72.88,
      type: "fly", flightFromNYC: { low: 500, mid: 800, high: 1300 },
      accommodation: { budget: 25, mid: 70, luxury: 200 },
      activities: 30, food: 20, description: "Bollywood, incredible street food, colonial architecture, and India's most cosmopolitan city.",
      seasonality: { winter: 1.3, spring: 1.0, summer: 0.6, fall: 0.9 } },

    { city: "Goa", region: "Goa", country: "India", lat: 15.30, lon: 74.12,
      type: "fly", flightFromNYC: { low: 550, mid: 850, high: 1350 },
      accommodation: { budget: 20, mid: 60, luxury: 200 },
      activities: 25, food: 20, description: "Beautiful beaches, Portuguese heritage, legendary parties, and laid-back tropical vibes.",
      seasonality: { winter: 1.5, spring: 1.0, summer: 0.5, fall: 0.8 } },
];
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load curated destinations FIRST (before any functions that might fail)
    destinationsData = DESTINATIONS;
    console.log('Loaded', destinationsData.length, 'curated destinations');

    initMap();
    initDatePickers();
    initAutocomplete();
    initMonthSelector();
    initTravelTimeSelector();
    initSearchTriggers();

    // Wrap in try-catch to prevent breaking initialization
    try {
        updateApiStatus();
    } catch (e) {
        console.warn('API status update failed:', e);
    }
});

// Track if user has made changes since last search
let searchParamsChanged = false;

// Initialize event listeners to trigger search on input changes
function initSearchTriggers() {
    // All input elements that should trigger search update
    const searchInputs = [
        'travelers',
        'tripDuration',
        'startDate',
        'endDate',
        'accommodationType',
        'budgetMin',
        'budgetMax',
        'maxTravelTime'
    ];

    // Debounced auto-search function
    const debouncedSearch = debounce(() => {
        if (selectedHomeCity && hasSearched) {
            searchDestinations();
        }
    }, 800);

    // Add change listeners to all inputs
    searchInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            // For select elements, use 'change' event
            const eventType = element.tagName === 'SELECT' ? 'change' : 'input';

            element.addEventListener(eventType, () => {
                if (hasSearched) {
                    searchParamsChanged = true;
                    showSearchAreaButton();
                    // Auto-search after debounce
                    debouncedSearch();
                }
            });
        }
    });

    // Travel mode buttons
    document.querySelectorAll('.travel-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (hasSearched) {
                searchParamsChanged = true;
                showSearchAreaButton();
                debouncedSearch();
            }
        });
    });
}

// Initialize Leaflet map
function initMap() {
    map = L.map('map').setView([30, -40], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Listen for map move/zoom to show "Search this area" button
    map.on('moveend', onMapMoved);
    map.on('zoomend', onMapMoved);
}

// Handle map move/zoom - show search area button
function onMapMoved() {
    if (!hasSearched || !selectedHomeCity) return;

    const currentBounds = map.getBounds();

    // Check if map has moved significantly from last search
    if (lastSearchBounds) {
        const centerMoved = !lastSearchBounds.contains(map.getCenter());
        const zoomChanged = Math.abs(map.getZoom() - (lastSearchBounds._zoom || 3)) > 0.5;

        if (centerMoved || zoomChanged) {
            showSearchAreaButton();
        }
    }
}

// Show the "Search this area" / "Update search" button
function showSearchAreaButton(text = null) {
    const btn = document.getElementById('searchAreaBtn');
    if (text) {
        btn.textContent = text;
    } else if (searchParamsChanged) {
        btn.textContent = '🔄 Update search';
    } else {
        btn.textContent = '🔄 Search this area';
    }
    btn.classList.add('show');
}

// Hide the "Search this area" button
function hideSearchAreaButton() {
    const btn = document.getElementById('searchAreaBtn');
    btn.classList.remove('show');
    searchParamsChanged = false;
}

// Search in current map area
function searchInCurrentArea() {
    hideSearchAreaButton();

    // When searching current area, temporarily disable travel time filter
    // so user can see all destinations in the visible area
    const maxTravelTimeSelect = document.getElementById('maxTravelTime');
    const originalValue = maxTravelTimeSelect.value;

    // Calculate what travel time would be needed to reach the furthest visible point
    if (selectedHomeCity) {
        const bounds = map.getBounds();
        const corners = [
            bounds.getNorthEast(),
            bounds.getNorthWest(),
            bounds.getSouthEast(),
            bounds.getSouthWest()
        ];

        // Find furthest corner from home city
        let maxDistance = 0;
        corners.forEach(corner => {
            const dist = calculateDistance(
                selectedHomeCity.lat, selectedHomeCity.lon,
                corner.lat, corner.lng
            );
            maxDistance = Math.max(maxDistance, dist);
        });

        // Calculate approximate travel time to furthest point
        // Driving: ~55mph, Flying: ~500mph + 3h airport
        const driveTime = maxDistance / 55;
        const flyTime = (maxDistance / 500) + 3;
        const suggestedTime = Math.min(driveTime, flyTime);

        // Update the travel time selector to encompass the visible area
        const timeOptions = [2, 4, 6, 8, 12, 16, 24, 0];
        const newTime = timeOptions.find(t => t === 0 || t >= suggestedTime) || 0;
        maxTravelTimeSelect.value = newTime.toString();
        updateTravelTimeInfo();
    }

    searchDestinations(false);
}

// Initialize date pickers with defaults
function initDatePickers() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14);
    const endDate = new Date(nextWeek);
    endDate.setDate(nextWeek.getDate() + 7);

    document.getElementById('startDate').value = formatDate(nextWeek);
    document.getElementById('endDate').value = formatDate(endDate);

    // Update duration when dates change
    document.getElementById('startDate').addEventListener('change', updateDurationFromDates);
    document.getElementById('endDate').addEventListener('change', updateDurationFromDates);
    document.getElementById('tripDuration').addEventListener('change', updateEndDateFromDuration);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function updateDurationFromDates() {
    const start = new Date(document.getElementById('startDate').value);
    const end = new Date(document.getElementById('endDate').value);
    if (start && end && end > start) {
        const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
        document.getElementById('tripDuration').value = nights;
    }
}

function updateEndDateFromDuration() {
    const start = new Date(document.getElementById('startDate').value);
    const nights = parseInt(document.getElementById('tripDuration').value) || 7;
    if (start) {
        const end = new Date(start);
        end.setDate(start.getDate() + nights);
        document.getElementById('endDate').value = formatDate(end);
    }
}

// Initialize month selector for flexible dates
function initMonthSelector() {
    const container = document.getElementById('monthSelector');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    container.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth + i) % 12;
        const btn = document.createElement('button');
        btn.className = 'month-btn';
        btn.textContent = months[monthIndex];
        btn.dataset.month = monthIndex;
        btn.onclick = () => toggleMonth(btn, monthIndex);
        container.appendChild(btn);
    }
}

function toggleMonth(btn, monthIndex) {
    btn.classList.toggle('active');
    if (selectedMonths.includes(monthIndex)) {
        selectedMonths = selectedMonths.filter(m => m !== monthIndex);
    } else {
        selectedMonths.push(monthIndex);
    }
}

// Initialize travel time selector
function initTravelTimeSelector() {
    const select = document.getElementById('maxTravelTime');
    select.addEventListener('change', () => {
        updateTravelTimeInfo();
        // Auto-search when travel time changes (if home city is selected)
        if (selectedHomeCity) {
            searchDestinations();
        }
    });
    updateTravelTimeInfo(); // Set initial info
}

// Adjust travel time with stepper buttons
function adjustTravelTime(delta) {
    const input = document.getElementById('maxTravelTime');
    const display = document.getElementById('travelTimeDisplay');
    let currentValue = parseInt(input.value) || 0;

    // Increment by 1 hour, min 0, max 24
    currentValue = Math.max(0, Math.min(24, currentValue + delta));
    input.value = currentValue;

    // Update display text
    if (currentValue === 0) {
        display.textContent = 'Any';
    } else {
        display.textContent = `${currentValue} hr${currentValue !== 1 ? 's' : ''}`;
    }

    // Trigger the travel time info update and auto-search
    updateTravelTimeInfo();

    // Debounced auto-search
    if (selectedHomeCity && hasSearched) {
        clearTimeout(window.travelTimeSearchTimeout);
        window.travelTimeSearchTimeout = setTimeout(() => {
            searchDestinations();
        }, 500);
    }
}

// Adjust trip duration with stepper buttons
function adjustTripDuration(delta) {
    const input = document.getElementById('tripDuration');
    const display = document.getElementById('tripDurationDisplay');
    let currentValue = parseInt(input.value) || 7;

    // Increment by 1 night, min 1, max 30
    currentValue = Math.max(1, Math.min(30, currentValue + delta));
    input.value = currentValue;

    // Update display text
    display.textContent = `${currentValue} night${currentValue !== 1 ? 's' : ''}`;

    // Debounced auto-search if already searched
    if (selectedHomeCity && hasSearched) {
        clearTimeout(window.tripDurationSearchTimeout);
        window.tripDurationSearchTimeout = setTimeout(() => {
            searchDestinations();
        }, 500);
    }
}

// Update travel time info display
function updateTravelTimeInfo() {
    const hours = parseInt(document.getElementById('maxTravelTime').value) || 0;
    maxTravelTime = hours;

    // Also update the stepper display in case called from elsewhere
    const display = document.getElementById('travelTimeDisplay');
    if (display) {
        display.textContent = hours === 0 ? 'Any' : `${hours} hr${hours !== 1 ? 's' : ''}`;
    }

    const infoEl = document.getElementById('travelTimeInfo');

    if (hours === 0) {
        infoEl.textContent = '🌍 Showing all destinations worldwide';
    } else if (!selectedHomeCity) {
        infoEl.textContent = '📍 Select your home city to see travel radius';
    } else {
        // Calculate actual radius based on selected time
        // Using updated formula: 50 mph base + 15 min per 100 mi for longer trips
        let driveMiles;
        if (hours <= 4) {
            driveMiles = Math.round(hours * 50);
        } else {
            // For longer trips, account for stops: solve hours = distance/50 + (distance/100)*0.25
            // hours = distance * (1/50 + 0.0025) = distance * 0.0225
            driveMiles = Math.round(hours / 0.0225);
        }
        const flyMiles = Math.round((hours - 3) * 500); // 500 mph minus 3h airport time

        if (hours <= 3) {
            infoEl.textContent = `🚗 Up to ~${driveMiles.toLocaleString()} mi drive from ${selectedHomeCity.city}`;
        } else {
            infoEl.textContent = `🚗 ~${driveMiles.toLocaleString()} mi drive or ✈️ ~${flyMiles.toLocaleString()} mi flight from ${selectedHomeCity.city}`;
        }
    }

    // Auto-zoom the map if home city is selected
    if (selectedHomeCity && hours > 0) {
        autoZoomToTravelRadius(hours);
    }
}

// Check if driving is possible between two locations (no major water crossings)
function isDrivingPossible(homeCountry, destCountry, homeLat, homeLon, destLat, destLon) {
    // Normalize country names for comparison
    const normalizeCountry = (country) => {
        if (!country) return '';
        const c = country.toLowerCase();
        // Normalize UK variants
        if (c === 'uk' || c === 'united kingdom' || c === 'great britain' || c === 'england' || c === 'scotland' || c === 'wales') {
            return 'uk';
        }
        // Normalize USA variants
        if (c === 'usa' || c === 'united states' || c === 'united states of america' || c === 'us') {
            return 'usa';
        }
        return c;
    };

    const homeNorm = normalizeCountry(homeCountry);
    const destNorm = normalizeCountry(destCountry);

    // Island nations that cannot be driven to/from other countries
    const islandNations = ['ireland', 'uk', 'japan', 'philippines',
                           'indonesia', 'australia', 'new zealand', 'taiwan', 'singapore', 'hong kong',
                           'iceland', 'cuba', 'jamaica', 'puerto rico', 'dominican republic', 'bahamas',
                           'sri lanka', 'madagascar', 'maldives', 'fiji', 'malta', 'cyprus'];

    // Check if either location is an island nation
    const homeIsIsland = islandNations.includes(homeNorm);
    const destIsIsland = islandNations.includes(destNorm);

    // If both are in the same country (normalized), driving is possible within that country
    if (homeNorm === destNorm) {
        return true;
    }

    // If one is an island and the other isn't, no driving between them
    if (homeIsIsland || destIsIsland) {
        return false;
    }

    // Check for continental water crossings (simplified)
    // Americas to Europe/Asia/Africa - no driving
    const homeInAmericas = homeLon < -30;
    const destInAmericas = destLon < -30;
    if (homeInAmericas !== destInAmericas) {
        return false;
    }

    return true;
}

// Calculate travel time to destination
function calculateTravelTime(homeCity, dest, distance) {
    if (dest.type === 'drive') {
        // More realistic driving time calculation:
        // - Base speed: 50 mph average (accounts for mix of highway/city)
        // - For trips over 200 miles, add 15 min per 100 miles for rest/fuel stops
        const baseTime = distance / 50;
        const stopBuffer = distance > 200 ? (distance / 100) * 0.25 : 0;
        return baseTime + stopBuffer;
    } else {
        // Flying: flight time + 3 hours for airport (security, boarding, etc.)
        const flightSpeed = 500; // mph average
        const flightTime = distance / flightSpeed;
        const airportTime = 3; // hours
        return flightTime + airportTime;
    }
}

// Debounce helper function
// Debounce helper - creates independent timer for each use
function debounce(func, delay) {
    let timer = null;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Initialize autocomplete for home city using Nominatim (OpenStreetMap)
function initAutocomplete() {
    const input = document.getElementById('homeCity');
    const results = document.getElementById('homeCityResults');

    // Debounced search function (Nominatim requires max 1 req/sec)
    const searchCities = debounce(async (query) => {
        if (query.length < 2) {
            results.classList.remove('show');
            return;
        }

        try {
            // Show loading state
            results.innerHTML = '<div class="autocomplete-item" style="color: #888;">Searching...</div>';
            results.classList.add('show');

            // Use Nominatim API for worldwide city search
            const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
                q: query,
                format: 'json',
                addressdetails: '1',
                limit: '10',
                dedupe: '1'
            }).toString();

            const response = await fetch(url);

            if (!response.ok) throw new Error('Nominatim API failed');

            const data = await response.json();

            if (data.length === 0) {
                results.innerHTML = '<div class="autocomplete-item" style="color: #888;">No cities found</div>';
                return;
            }

            // Filter to only show places that are cities/towns/villages
            const cityTypes = ['city', 'town', 'village', 'municipality', 'administrative'];
            const cities = data.filter(place => {
                const type = place.type || place.class;
                return cityTypes.some(t => type?.includes(t)) || place.addresstype === 'city';
            });

            // If no city-type results, show all results
            const displayResults = cities.length > 0 ? cities : data;

            results.innerHTML = displayResults.map(place => {
                const city = place.address?.city || place.address?.town || place.address?.village ||
                            place.address?.municipality || place.name || '';
                const state = place.address?.state || place.address?.region || '';
                const country = place.address?.country || '';
                const displayName = formatLocationDisplay(city, state, country);

                return `<div class="autocomplete-item"
                    data-city="${escapeHtml(city)}"
                    data-state="${escapeHtml(state)}"
                    data-country="${escapeHtml(country)}"
                    data-lat="${place.lat}"
                    data-lon="${place.lon}"
                    data-display="${escapeHtml(displayName)}">
                    ${displayName}
                </div>`;
            }).join('');

            // Add click handlers
            results.querySelectorAll('.autocomplete-item').forEach(item => {
                if (item.dataset.lat) {
                    item.onclick = () => selectHomeCity(item);
                }
            });

        } catch (error) {
            console.error('Nominatim error:', error);
            // Show more helpful error message
            results.innerHTML = `<div class="autocomplete-item" style="color: #f44;">
                Search failed - check console for details
            </div>`;
        }
    }, 400); // 400ms debounce to respect rate limits

    input.addEventListener('input', (e) => {
        searchCities(e.target.value.trim());
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.classList.remove('show');
        }
    });
}

// Format location display based on what info we have
function formatLocationDisplay(city, state, country) {
    const parts = [city];
    if (state && state !== city) parts.push(state);
    if (country) parts.push(country);
    return parts.filter(p => p).join(', ');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function selectHomeCity(item) {
    const city = item.dataset.city;
    const state = item.dataset.state;
    const country = item.dataset.country || '';
    const lat = parseFloat(item.dataset.lat);
    const lon = parseFloat(item.dataset.lon);
    const displayName = item.dataset.display;

    selectedHomeCity = { city, state, country, lat, lon };
    document.getElementById('homeCity').value = displayName;
    document.getElementById('homeCityResults').classList.remove('show');

    // Update travel time info with new home city
    updateTravelTimeInfo();

    // If travel time is set, auto-zoom; otherwise just center on home city
    const hours = parseInt(document.getElementById('maxTravelTime').value) || 0;
    if (hours > 0) {
        autoZoomToTravelRadius(hours);
    } else {
        map.setView([lat, lon], 5);
    }

    // Auto-search when home city is selected
    searchDestinations();
}

// Auto-zoom map to show travel radius from home city
function autoZoomToTravelRadius(hours) {
    if (!selectedHomeCity) return;

    // Calculate approximate radius in miles
    const driveRadius = hours * 55; // 55 mph average
    const flyRadius = hours > 3 ? (hours - 3) * 500 : 0; // 500 mph minus airport time
    const maxRadius = Math.max(driveRadius, flyRadius);

    // Remove existing radius layer if any
    if (travelRadiusLayer) {
        map.removeLayer(travelRadiusLayer);
    }

    // Remove existing home marker if any
    if (homeMarker) {
        map.removeLayer(homeMarker);
    }

    // Add home city marker
    homeMarker = L.marker([selectedHomeCity.lat, selectedHomeCity.lon], {
        icon: L.divIcon({
            className: 'home-marker-icon',
            html: `<div class="home-marker">📍</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(map);
    homeMarker.bindPopup(`<b>Your location</b><br>${selectedHomeCity.city}, ${selectedHomeCity.state || selectedHomeCity.country}`);

    // Create travel radius visualization based on selected travel mode
    const layers = [];

    if (hours > 0) {
        // Flight radius - only show for 'fly' or 'both' modes
        if ((travelMode === 'fly' || travelMode === 'both') && flyRadius > 0) {
            const flyRadiusMeters = flyRadius * 1609.34;
            layers.push(L.circle([selectedHomeCity.lat, selectedHomeCity.lon], {
                radius: flyRadiusMeters,
                color: '#00d4ff',
                fillColor: '#00d4ff',
                fillOpacity: 0.05,
                weight: 3,
                dashArray: '15, 10'
            }));
        }

        // Drive radius - only show for 'drive' or 'both' modes
        if ((travelMode === 'drive' || travelMode === 'both') && driveRadius > 0) {
            const driveRadiusMeters = driveRadius * 1609.34;
            layers.push(L.circle([selectedHomeCity.lat, selectedHomeCity.lon], {
                radius: driveRadiusMeters,
                color: '#FF9800',
                fillColor: '#FF9800',
                fillOpacity: 0.12,
                weight: 3
            }));
        }

        // Combine into a layer group
        travelRadiusLayer = L.layerGroup(layers).addTo(map);
    }

    // Convert miles to degrees for bounds calculation
    const latDegrees = maxRadius / 69;
    const lonDegrees = maxRadius / (69 * Math.cos(selectedHomeCity.lat * Math.PI / 180));

    // Create bounds around home city
    const bounds = L.latLngBounds(
        [selectedHomeCity.lat - latDegrees, selectedHomeCity.lon - lonDegrees],
        [selectedHomeCity.lat + latDegrees, selectedHomeCity.lon + lonDegrees]
    );

    // Fit map to bounds with some padding
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
}

// UI state functions
function setTravelMode(mode) {
    travelMode = mode;
    document.querySelectorAll('.travel-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update radius visualization when travel mode changes
    if (selectedHomeCity) {
        const hours = parseInt(document.getElementById('maxTravelTime').value) || 0;
        if (hours > 0) {
            autoZoomToTravelRadius(hours);
        }
        // Auto-search when travel mode changes
        searchDestinations();
    }
}

function setDateType(type) {
    dateType = type;
    document.querySelectorAll('.date-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(type));
    });
    document.getElementById('specificDates').classList.toggle('active', type === 'specific');
    document.getElementById('flexibleDates').classList.toggle('active', type === 'flexible');
}

function toggleStep(stepId) {
    const step = document.getElementById(stepId);
    if (!step.classList.contains('always-on')) {
        step.classList.toggle('collapsed');
    }
}

function toggleApiPanel() {
    const panel = document.querySelector('.api-status');
    panel.classList.toggle('collapsed');
}

// Update API status indicators
function updateApiStatus() {
    // Log API configuration status
    console.log('API Status Check:', {
        geonames: API_KEYS.geonames.username ? `Configured (${API_KEYS.geonames.username})` : 'Not configured',
        amadeus: API_KEYS.amadeus.clientId ? 'Configured' : 'Not configured',
        openMeteo: 'No key needed (free)',
        wikivoyage: 'No key needed (free)',
        wikipedia: 'No key needed (free)'
    });

    // Update Amadeus status if element exists
    const amadeusStatus = document.getElementById('amadeusStatus');
    if (amadeusStatus && API_KEYS.amadeus.clientId && API_KEYS.amadeus.clientSecret) {
        amadeusStatus.classList.add('connected');
        const badge = amadeusStatus.querySelector('.api-badge');
        if (badge) badge.textContent = 'Live';
    }
}

// Main search function
async function searchDestinations(searchInArea = false) {
    if (!selectedHomeCity) {
        alert('Please select your home city first.');
        return;
    }

    const travelers = parseInt(document.getElementById('travelers').value) || 2;
    const nights = parseInt(document.getElementById('tripDuration').value) || 7;
    const accommodationType = document.getElementById('accommodationType').value;
    const budgetMin = parseInt(document.getElementById('budgetMin').value) || 0;
    const budgetMax = parseInt(document.getElementById('budgetMax').value) || Infinity;
    const maxHours = parseInt(document.getElementById('maxTravelTime').value) || 0;

    // Get current map bounds if searching in area
    const mapBounds = searchInArea ? map.getBounds() : null;

    // Get travel dates/season
    let travelMonth;
    if (dateType === 'specific') {
        const startDate = new Date(document.getElementById('startDate').value);
        travelMonth = startDate.getMonth();
    } else {
        // Use first selected month or current month
        travelMonth = selectedMonths.length > 0 ? selectedMonths[0] : new Date().getMonth();
    }

    // Show loading
    document.getElementById('loadingOverlay').classList.add('show');
    document.getElementById('searchBtn').disabled = true;

    try {
        // Clear existing markers
        clearMarkers();

        // Fetch dynamic cities from GeoNames based on map bounds or travel radius
        let geonamesCities = [];
        if (API_KEYS.geonames.username) {
            let fetchBounds;
            if (searchInArea && map.getBounds()) {
                // Use current map bounds
                const b = map.getBounds();
                fetchBounds = {
                    north: b.getNorth(),
                    south: b.getSouth(),
                    east: b.getEast(),
                    west: b.getWest()
                };
            } else {
                // Calculate bounds based on travel radius from home city
                // Use appropriate speed based on travel mode
                let maxDistance;
                if (maxHours === 0) {
                    maxDistance = 12000; // "Any distance" - worldwide
                } else if (travelMode === 'drive') {
                    maxDistance = maxHours * 60; // ~60 mph for driving bounds
                } else if (travelMode === 'fly') {
                    maxDistance = (maxHours - 3) * 500 + 500; // Flight speed minus airport time
                } else {
                    // "Both" mode - use larger of the two
                    const driveDistance = maxHours * 60;
                    const flyDistance = maxHours > 3 ? (maxHours - 3) * 500 + 500 : 500;
                    maxDistance = Math.max(driveDistance, flyDistance);
                }
                const latOffset = maxDistance / 69; // ~69 miles per degree of latitude
                const lonOffset = maxDistance / (69 * Math.cos(selectedHomeCity.lat * Math.PI / 180));
                fetchBounds = {
                    north: Math.min(85, selectedHomeCity.lat + latOffset),
                    south: Math.max(-85, selectedHomeCity.lat - latOffset),
                    east: Math.min(180, selectedHomeCity.lon + lonOffset),
                    west: Math.max(-180, selectedHomeCity.lon - lonOffset)
                };
            }
            geonamesCities = await fetchGeoNamesCities(fetchBounds, 100);
        }

        // Merge curated destinations with GeoNames cities
        // Curated destinations take priority (don't duplicate)
        const curatedCityNames = new Set(destinationsData.map(d => d.city.toLowerCase()));
        const uniqueGeonamesCities = geonamesCities.filter(gc =>
            !curatedCityNames.has(gc.city.toLowerCase())
        );

        const allDestinations = [...destinationsData, ...uniqueGeonamesCities];

        console.log('Search debug:', {
            homeCity: selectedHomeCity.city,
            homeCountry: selectedHomeCity.country,
            homeLat: selectedHomeCity.lat,
            homeLon: selectedHomeCity.lon,
            travelMode,
            maxHours,
            curatedCount: destinationsData.length,
            geonamesCount: geonamesCities.length,
            totalDestinations: allDestinations.length
        });

        // Debug: Log first few UK destinations to check country matching
        const ukDests = allDestinations.filter(d => d.country === 'UK' || d.country === 'United Kingdom');
        console.log('UK destinations found:', ukDests.length, ukDests.slice(0, 3).map(d => d.city));

        // Fetch isochrone for drive mode - this gives us accurate reachable area
        // TravelTime API supports up to 4 hours
        let isochroneData = null;
        const MAX_ISOCHRONE_HOURS = 4; // TravelTime supports up to 4 hours
        if ((travelMode === 'drive' || travelMode === 'both') && maxHours > 0 && API_KEYS.travelTime && API_KEYS.travelTime.appId) {
            const isochroneHours = Math.min(maxHours, MAX_ISOCHRONE_HOURS);
            console.log('Fetching driving isochrone for', isochroneHours, 'hour(s)...', maxHours > MAX_ISOCHRONE_HOURS ? `(capped from ${maxHours}h due to API limit)` : '');
            const timeSeconds = isochroneHours * 3600; // Convert hours to seconds
            isochroneData = await fetchDrivingIsochrone(selectedHomeCity.lat, selectedHomeCity.lon, timeSeconds);
            if (isochroneData) {
                console.log('Isochrone fetched successfully');
                // Display isochrone (show for all supported times up to 4 hours)
                if (maxHours <= MAX_ISOCHRONE_HOURS) {
                    displayIsochrone(isochroneData, selectedHomeCity);
                } else {
                    console.log('Not displaying isochrone (time was capped), using circle radius instead');
                }
            } else {
                console.log('Isochrone fetch failed, falling back to distance-based filtering');
            }
        } else {
            // Remove any existing isochrone if not in drive mode
            if (currentIsochrone) {
                map.removeLayer(currentIsochrone);
                currentIsochrone = null;
            }
        }

        // Calculate costs for each destination
        const results = [];
        const DRIVE_THRESHOLD = 500; // Miles - destinations under this are drivable
        const filterStats = { total: 0, sameCity: 0, modeFilter: 0, timeFilter: 0, boundsFilter: 0, budgetFilter: 0, cantDrive: 0, isochroneFilter: 0, passed: 0 };
        const ukFilterDebug = []; // Track UK destinations through filtering

        for (const dest of allDestinations) {
            filterStats.total++;
            const isUK = dest.country === 'UK' || dest.country === 'United Kingdom';

            // Skip if destination is the same as home city
            if (dest.city.toLowerCase() === selectedHomeCity.city.toLowerCase()) {
                filterStats.sameCity++;
                if (isUK) ukFilterDebug.push({ city: dest.city, filteredBy: 'sameCity' });
                continue;
            }

            // Calculate distance from home city
            const distance = calculateDistance(
                selectedHomeCity.lat, selectedHomeCity.lon,
                dest.lat, dest.lon
            );

            // Check if driving is actually possible (no major water crossings)
            const canDrive = isDrivingPossible(
                selectedHomeCity.country,
                dest.country,
                selectedHomeCity.lat, selectedHomeCity.lon,
                dest.lat, dest.lon
            );

            // Debug: Log UK destinations specifically
            if (isUK) {
                ukFilterDebug.push({
                    city: dest.city,
                    country: dest.country,
                    homeCountry: selectedHomeCity.country,
                    distance: Math.round(distance),
                    canDrive
                });
            }

            // Dynamically determine travel type based on distance and drivability
            // If water crossing required, must fly regardless of distance
            let effectiveType;
            if (!canDrive) {
                effectiveType = 'fly';
                filterStats.cantDrive++;
            } else {
                effectiveType = distance <= DRIVE_THRESHOLD ? 'drive' : 'fly';
            }

            // Filter by travel mode preference
            if (travelMode === 'fly' && effectiveType === 'drive') {
                filterStats.modeFilter++;
                if (isUK) ukFilterDebug[ukFilterDebug.length - 1].filteredBy = 'modeFilter (drive in fly mode)';
                continue;
            }
            if (travelMode === 'drive' && effectiveType === 'fly') {
                filterStats.modeFilter++;
                if (isUK) ukFilterDebug[ukFilterDebug.length - 1].filteredBy = `modeFilter (effectiveType=${effectiveType}, canDrive=${canDrive})`;
                continue;
            }

            // Create a copy with the effective travel type
            const destWithType = { ...dest, type: effectiveType };

            // Calculate rough travel time for initial filtering
            // Use generous estimate (faster speed) to avoid filtering out reachable destinations
            const roughTravelTime = calculateTravelTime(selectedHomeCity, destWithType, distance);

            // For drive mode with valid isochrone (not capped), use the accurate polygon for filtering
            const useIsochroneFilter = effectiveType === 'drive' && isochroneData && isochroneData.polygon && maxHours <= MAX_ISOCHRONE_HOURS;
            if (useIsochroneFilter) {
                const inIsochrone = isPointInIsochrone(dest.lat, dest.lon, isochroneData.polygon);
                if (isUK) {
                    console.log(`UK isochrone check: ${dest.city} at (${dest.lat}, ${dest.lon}) - inIsochrone: ${inIsochrone}`);
                }
                if (!inIsochrone) {
                    filterStats.isochroneFilter++;
                    if (isUK) ukFilterDebug[ukFilterDebug.length - 1].filteredBy = 'isochroneFilter (outside drivable area)';
                    continue;
                }
            } else if (maxHours > 0) {
                // Fallback to time-based filter when no isochrone or isochrone was capped
                const filterBuffer = effectiveType === 'drive' ? 1.3 : 1.0;
                if (roughTravelTime > maxHours * filterBuffer) {
                    filterStats.timeFilter++;
                    if (isUK) ukFilterDebug[ukFilterDebug.length - 1].filteredBy = `timeFilter (${roughTravelTime.toFixed(1)}h > ${(maxHours * filterBuffer).toFixed(1)}h)`;
                    continue;
                }
            }

            // If searching in current area, filter by map bounds
            if (searchInArea && mapBounds) {
                if (!mapBounds.contains([dest.lat, dest.lon])) {
                    filterStats.boundsFilter++;
                    if (isUK) ukFilterDebug[ukFilterDebug.length - 1].filteredBy = 'boundsFilter';
                    continue;
                }
            }

            // Calculate costs with the effective type
            const costs = calculateTripCost(destWithType, {
                travelers,
                nights,
                accommodationType,
                travelMonth,
                distance,
                homeCity: selectedHomeCity
            });

            // Check budget filter
            if (budgetMin > 0 || budgetMax < Infinity) {
                if (costs.total < budgetMin || costs.total > budgetMax) {
                    filterStats.budgetFilter++;
                    if (isUK) ukFilterDebug[ukFilterDebug.length - 1].filteredBy = `budgetFilter ($${costs.total})`;
                    continue;
                }
            }

            filterStats.passed++;
            if (isUK) ukFilterDebug[ukFilterDebug.length - 1].passed = true;
            results.push({
                ...destWithType,
                costs,
                distance,
                travelTime: roughTravelTime,
                needsAccurateDriveTime: effectiveType === 'drive'
            });
        }

        console.log('UK destinations debug:', ukFilterDebug);
        console.log('Filter statistics:', filterStats);
        console.log('Initial filter results:', {
            totalAfterFilters: results.length,
            driveDestinations: results.filter(r => r.type === 'drive').length,
            flyDestinations: results.filter(r => r.type === 'fly').length
        });

        // For driving destinations, fetch accurate times from OpenRouteService
        // This is done BEFORE sorting so we get accurate times for filtering
        if (API_KEYS.openRouteService) {
            const driveDestinations = results.filter(r => r.type === 'drive');
            console.log(`Fetching accurate drive times for ${driveDestinations.length} destinations...`);

            // Fetch ORS data in parallel (limit to 30 to avoid hitting API limits too hard)
            const driveBatch = driveDestinations.slice(0, 30);
            const orsResults = await Promise.all(
                driveBatch.map(async (dest) => {
                    const orsData = await fetchDrivingRoute(
                        selectedHomeCity.lat, selectedHomeCity.lon,
                        dest.lat, dest.lon
                    );
                    return { dest, orsData };
                })
            );

            // Update results with accurate driving data
            for (const { dest, orsData } of orsResults) {
                if (orsData && !orsData.notDrivable) {
                    dest.travelTime = orsData.durationHours;
                    dest.distance = orsData.distanceMiles;
                    dest.accurateDriving = true;

                    // Recalculate transport cost with accurate distance
                    const drivingCost = orsData.distanceMiles * 2 * 0.25; // Round trip, $0.25/mile
                    const costDiff = drivingCost - dest.costs.transport;
                    dest.costs.transport = Math.round(drivingCost);
                    dest.costs.total = Math.round(dest.costs.total + costDiff);
                    dest.costs.perDay = Math.round(dest.costs.total / nights);
                } else if (orsData && orsData.notDrivable) {
                    dest.notDrivable = true;
                }
            }

            // Re-filter based on actual travel times
            const beforeRefilter = results.length;
            for (let i = results.length - 1; i >= 0; i--) {
                const r = results[i];
                // Remove not-drivable destinations
                if (r.notDrivable) {
                    results.splice(i, 1);
                    continue;
                }
                // Re-check travel time with accurate data
                if (maxHours > 0 && r.accurateDriving && r.travelTime > maxHours) {
                    results.splice(i, 1);
                }
            }
            console.log(`Re-filtered: ${beforeRefilter} -> ${results.length} destinations`);
        }

        console.log('Final filter results:', {
            totalAfterFilters: results.length,
            sampleResults: results.slice(0, 10).map(r => ({
                city: r.city,
                distance: Math.round(r.distance),
                type: r.type,
                travelTime: r.travelTime.toFixed(1),
                accurate: r.accurateDriving || false
            }))
        });

        // Sort by total cost
        results.sort((a, b) => a.costs.total - b.costs.total);

        // Handle empty results - suggest expanding search
        if (results.length === 0) {
            console.log('No results found, checking for fallback options...');

            // Determine fallback suggestion based on current settings
            let fallbackMessage = '';
            let fallbackAction = null;

            if (travelMode === 'drive' && maxHours > 0 && maxHours < 6) {
                // Suggest expanding drive time
                const suggestedHours = Math.min(maxHours * 2, 8);
                fallbackMessage = `No destinations found within ${maxHours} hours driving. `;
                fallbackMessage += `<a href="#" onclick="document.getElementById('maxTravelTime').value='${suggestedHours}'; searchDestinations(); return false;">Try ${suggestedHours} hours instead?</a>`;
            } else if (travelMode === 'drive') {
                // Suggest switching to "both" mode
                fallbackMessage = `No driving destinations found within ${maxHours} hours. `;
                fallbackMessage += `<a href="#" onclick="setTravelMode('both'); searchDestinations(); return false;">Include flights too?</a>`;
            } else if (travelMode === 'fly' && maxHours > 0 && maxHours < 8) {
                // Suggest expanding flight time
                const suggestedHours = Math.min(maxHours + 4, 12);
                fallbackMessage = `No destinations found within ${maxHours} hours flight. `;
                fallbackMessage += `<a href="#" onclick="document.getElementById('maxTravelTime').value='${suggestedHours}'; searchDestinations(); return false;">Try ${suggestedHours} hours instead?</a>`;
            } else {
                // Generic fallback
                fallbackMessage = `No destinations found matching your criteria. `;
                fallbackMessage += `<a href="#" onclick="document.getElementById('maxTravelTime').value='0'; searchDestinations(); return false;">Search worldwide?</a>`;
            }

            // Show the fallback message in the alternatives panel
            const alternativesPanel = document.querySelector('.alternatives-list');
            if (alternativesPanel) {
                alternativesPanel.innerHTML = `
                    <div class="no-results-message" style="padding: 20px; text-align: center; color: #666;">
                        <p style="font-size: 1.1em; margin-bottom: 15px;">😕 ${fallbackMessage}</p>
                        <p style="font-size: 0.9em; color: #888;">
                            We're still building our destination database.
                            Try a larger search radius or different travel mode.
                        </p>
                    </div>
                `;
            }

            // Hide loading and enable search button
            document.getElementById('loadingOverlay').classList.remove('show');
            document.getElementById('searchBtn').disabled = false;

            // Mark that we've searched (even though no results)
            hasSearched = true;
            lastSearchBounds = map.getBounds();

            return; // Exit early
        }

        // Fetch real-time data for top results (weather, images, etc.)
        const topResults = results.slice(0, 15);
        const startDateStr = document.getElementById('startDate').value;
        const endDateStr = document.getElementById('endDate').value;

        // Fetch external data in parallel for top results (no need to re-fetch ORS)
        const enrichedResults = await Promise.all(
            topResults.map(async (dest) => {
                const externalData = await fetchDestinationData(dest, startDateStr, endDateStr, travelers);
                return { ...dest, ...externalData };
            })
        );

        // ORS data already fetched earlier, enrichedResults are ready
        const validEnrichedResults = enrichedResults;

        // Combine enriched results with remaining results
        const allResults = [
            ...validEnrichedResults,
            ...results.slice(15)
        ];

        // Add markers to map
        allResults.forEach(dest => addDestinationMarker(dest, travelers, nights));

        // Update alternatives panel with enriched data
        updateAlternativesPanel(allResults, budgetMin, budgetMax);

        // Mark that we've searched
        hasSearched = true;

        // Fit map to show all markers plus home city (unless searching in area)
        if (markers.length > 0 && !searchInArea) {
            const group = L.featureGroup(markers);
            // Include home city in the bounds
            const bounds = group.getBounds();
            bounds.extend([selectedHomeCity.lat, selectedHomeCity.lon]);
            // Limit max zoom to prevent jarring zoom-in on single/close markers
            map.fitBounds(bounds.pad(0.15), { maxZoom: 8 });
        } else if (!searchInArea && selectedHomeCity) {
            // No markers but have home city - show a reasonable area around home
            map.setView([selectedHomeCity.lat, selectedHomeCity.lon], 5);
        }

        // Store the current bounds for later comparison
        lastSearchBounds = map.getBounds();
        lastSearchBounds._zoom = map.getZoom();

        // Hide search area button after search
        hideSearchAreaButton();

    } catch (error) {
        console.error('Error searching destinations:', error);
        alert('An error occurred while searching. Please try again.');
    } finally {
        document.getElementById('loadingOverlay').classList.remove('show');
        document.getElementById('searchBtn').disabled = false;
    }
}

// Calculate trip cost for a destination
function calculateTripCost(dest, options) {
    const { travelers, nights, accommodationType, travelMonth, distance, homeCity } = options;

    // Get seasonality multiplier
    const season = getSeason(travelMonth);
    const seasonMultiplier = dest.seasonality[season] || 1.0;

    // Calculate transportation cost
    let transportCost = 0;
    let transportType = '';

    if (dest.type === 'drive') {
        // Driving cost: estimate $0.25/mile for gas + wear
        const drivingDistance = distance * 2; // Round trip
        transportCost = drivingDistance * 0.25;
        transportType = 'drive';
    } else {
        // Flight cost - adjust based on season and distance
        const flightPricing = dest.flightFromNYC || { low: 300, mid: 500, high: 800 };

        // Adjust flight price based on home city distance from NYC
        const nycLat = 40.71, nycLon = -74.01;
        const homeToNYCDistance = calculateDistance(homeCity.lat, homeCity.lon, nycLat, nycLon);
        const homeToDestDistance = calculateDistance(homeCity.lat, homeCity.lon, dest.lat, dest.lon);
        const nycToDestDistance = calculateDistance(nycLat, nycLon, dest.lat, dest.lon);

        // Adjust base price by distance ratio
        const distanceRatio = homeToDestDistance / nycToDestDistance;
        const adjustedFlight = {
            low: flightPricing.low * distanceRatio,
            mid: flightPricing.mid * distanceRatio,
            high: flightPricing.high * distanceRatio
        };

        // Apply seasonal adjustment
        let flightPrice;
        if (seasonMultiplier > 1.2) {
            flightPrice = adjustedFlight.high;
        } else if (seasonMultiplier > 1.0) {
            flightPrice = adjustedFlight.mid;
        } else {
            flightPrice = adjustedFlight.low;
        }

        transportCost = flightPrice * travelers;
        transportType = 'fly';
    }

    // Accommodation cost (per night, assumes 1-2 travelers share room)
    const rooms = Math.ceil(travelers / 2);
    const baseAccommodation = dest.accommodation[accommodationType] || dest.accommodation.mid;
    const accommodationCost = baseAccommodation * seasonMultiplier * nights * rooms;

    // Food cost (per person per day)
    const foodCost = dest.food * travelers * nights * seasonMultiplier;

    // Activities cost (per person per day)
    const activitiesCost = dest.activities * travelers * nights;

    // Total cost
    const total = transportCost + accommodationCost + foodCost + activitiesCost;

    return {
        transport: Math.round(transportCost),
        transportType,
        accommodation: Math.round(accommodationCost),
        food: Math.round(foodCost),
        activities: Math.round(activitiesCost),
        total: Math.round(total),
        perDay: Math.round(total / nights),
        perPerson: Math.round(total / travelers),
        seasonMultiplier
    };
}

// Get season from month
function getSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

// Format travel time for display
function formatTravelTime(hours) {
    if (!hours) return 'N/A';
    if (hours < 1) {
        return `${Math.round(hours * 60)}min`;
    } else if (hours < 24) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    } else {
        const d = Math.floor(hours / 24);
        const h = Math.round(hours % 24);
        return h > 0 ? `${d}d ${h}h` : `${d}d`;
    }
}

// Format price for short display (e.g., $1874 → $1.9k)
function formatPriceShort(price) {
    if (price >= 1000) {
        const k = price / 1000;
        // Round to 1 decimal place
        return '$' + k.toFixed(1) + 'k';
    }
    return '$' + price;
}

// Add destination marker to map
function addDestinationMarker(dest, travelers, nights) {
    // Determine marker class based on cost
    let markerClass = 'marker-moderate';
    const perDay = dest.costs.perDay;

    if (perDay < 150) markerClass = 'marker-cheap';
    else if (perDay > 400) markerClass = 'marker-expensive';

    if (dest.type === 'drive') markerClass += ' marker-drive';

    // Build weather display for marker
    let weatherDisplay = '';
    if (dest.weather) {
        const weatherEmoji = dest.weather.conditions.split(' ')[0]; // Get just the emoji
        const isClimate = dest.weather.type === 'climate';
        const tempPrefix = isClimate ? '~' : '';
        weatherDisplay = `<span class="marker-weather" title="${isClimate ? 'Typical weather for ' + dest.weather.monthName : 'Forecast'}">${weatherEmoji} ${tempPrefix}${dest.weather.avgHigh}°</span>`;
    }

    // Format price for display
    const formattedPrice = formatPriceShort(dest.costs.total);

    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="custom-marker ${markerClass}">
                <span class="marker-city">${dest.city}</span>
                <span class="marker-price">${formattedPrice}</span>
                <div class="marker-details">
                    <span class="marker-type">${dest.type === 'drive' ? '🚗' : '✈️'}</span>
                    ${weatherDisplay}
                </div>
            </div>
        `,
        iconSize: [90, 60],
        iconAnchor: [45, 30]
    });

    const popup = createPopupContent(dest, travelers, nights);

    const marker = L.marker([dest.lat, dest.lon], { icon })
        .bindPopup(popup, { maxWidth: 450, minWidth: 420 })
        .addTo(map);

    markers.push(marker);
}

// Create popup content for destination
function createPopupContent(dest, travelers, nights) {
    const costs = dest.costs;
    const travelTimeStr = formatTravelTime(dest.travelTime);

    // Season tag styling
    const seasonTag = costs.seasonMultiplier > 1.1
        ? '<span class="popup-tag warning">🔥 Peak Season</span>'
        : costs.seasonMultiplier < 0.9
            ? '<span class="popup-tag highlight">💰 Off-Season</span>'
            : '<span class="popup-tag">📅 Shoulder Season</span>';

    // Hero section with image or fallback
    let heroHtml = '';
    if (dest.image && dest.image.url) {
        heroHtml = `
            <div class="popup-hero">
                <img src="${dest.image.url}" alt="${dest.city}" loading="lazy">
                <div class="popup-hero-overlay">
                    <h2 class="popup-hero-title">${dest.city}</h2>
                    <div class="popup-hero-subtitle">${dest.region}, ${dest.country}</div>
                </div>
                <div class="popup-hero-credit">
                    <a href="${dest.image.credit.link}" target="_blank" rel="noopener">📷 ${dest.image.credit.name}</a>
                </div>
            </div>
        `;
    } else {
        heroHtml = `
            <div class="popup-hero popup-hero-noimage">
                <div>
                    <h2 class="popup-hero-title">${dest.city}</h2>
                    <div class="popup-hero-subtitle">${dest.region}, ${dest.country}</div>
                </div>
            </div>
        `;
    }

    // Weather card
    let weatherHtml = '';
    if (dest.weather) {
        const isClimate = dest.weather.type === 'climate';

        if (!isClimate && dest.weather.current && dest.weather.forecast) {
            // Enhanced weather display with current + 7-day forecast
            const currentEmoji = dest.weather.current.conditions.split(' ')[0];
            const forecastHtml = dest.weather.forecast.map(day => {
                const emoji = day.conditions.split(' ')[0];
                return `
                    <div class="forecast-day">
                        <div class="forecast-day-name">${day.day}</div>
                        <div class="forecast-day-icon">${emoji}</div>
                        <div class="forecast-day-temps">
                            <span class="forecast-high">${day.high}°</span>
                            <span class="forecast-low">${day.low}°</span>
                        </div>
                    </div>
                `;
            }).join('');

            weatherHtml = `
                <div class="popup-weather-enhanced">
                    <div class="popup-weather-current">
                        <div class="weather-current-left">
                            <span class="weather-current-icon">${currentEmoji}</span>
                            <div class="weather-current-temp">${dest.weather.current.temp}°F</div>
                        </div>
                        <div class="weather-current-right">
                            <div class="weather-current-label">Right now</div>
                            <div class="weather-current-desc">${dest.weather.current.conditions}</div>
                        </div>
                    </div>
                    <div class="popup-weather-forecast">
                        ${forecastHtml}
                    </div>
                </div>
            `;
        } else {
            // Climate data fallback (for trips > 16 days out)
            const weatherEmoji = dest.weather.conditions.split(' ')[0];
            const tempNote = `Typical for ${dest.weather.monthName}`;

            weatherHtml = `
                <div class="popup-weather">
                    <div class="popup-weather-main">
                        <span class="popup-weather-icon">${weatherEmoji}</span>
                        <div>
                            <div class="popup-weather-temp">${dest.weather.avgLow}° - ${dest.weather.avgHigh}°F</div>
                            <div class="popup-weather-desc">${tempNote}</div>
                        </div>
                    </div>
                    <div class="popup-weather-details">
                        <div>💧 ${dest.weather.rainChance}% rain</div>
                    </div>
                </div>
            `;
        }
    }

    // Description
    const description = dest.description || dest.wikiDescription || 'A beautiful destination worth exploring.';

    // Transport details
    const transportIcon = costs.transportType === 'drive' ? '🚗' : '✈️';
    const transportLabel = costs.transportType === 'drive' ? 'Drive' : 'Flights';
    const transportDetail = costs.transportType === 'drive'
        ? `${Math.round(dest.distance)} mi`
        : `${travelers} traveler${travelers > 1 ? 's' : ''}`;

    // Advisory tag (clickable to show explanation)
    let advisoryTag = '';
    if (dest.advisory) {
        const safetyClass = dest.advisory.level <= 2 ? 'highlight' : dest.advisory.level >= 3 ? 'warning' : '';
        advisoryTag = `<span class="popup-tag ${safetyClass} clickable" onclick="showSecurityModal(${dest.advisory.level})" title="Click for details">🛡️ Level ${dest.advisory.level} ⓘ</span>`;
    }

    // Currency info
    let currencyHtml = '';
    if (dest.localCurrency && dest.localCurrency !== 'USD' && dest.exchangeRate) {
        currencyHtml = `
            <div class="popup-info-row">
                <span class="popup-info-label">💱 Exchange Rate</span>
                <span class="popup-info-value">$1 = ${dest.exchangeRate.toFixed(2)} ${dest.localCurrency}</span>
            </div>
        `;
    }

    return `
        <div class="popup-content">
            ${heroHtml}

            <div class="popup-body">
                <p class="popup-description">${description}</p>

                <div class="popup-tags">
                    ${seasonTag}
                    <span class="popup-tag">⏱️ ${travelTimeStr}</span>
                    ${advisoryTag}
                </div>

                ${weatherHtml}

                <div class="popup-grid">
                    <div class="popup-card">
                        <div class="popup-card-header">${transportIcon} ${transportLabel}</div>
                        <div class="popup-card-value">$${costs.transport}</div>
                        <div class="popup-card-detail">${transportDetail}</div>
                    </div>
                    <div class="popup-card">
                        <div class="popup-card-header">🏨 Accommodation</div>
                        <div class="popup-card-value">$${costs.accommodation}</div>
                        <div class="popup-card-detail">${nights} nights</div>
                    </div>
                    <div class="popup-card">
                        <div class="popup-card-header">🍽️ Food</div>
                        <div class="popup-card-value">$${costs.food}</div>
                        <div class="popup-card-detail">${nights} days</div>
                    </div>
                    <div class="popup-card">
                        <div class="popup-card-header">🎯 Activities</div>
                        <div class="popup-card-value">$${costs.activities}</div>
                        <div class="popup-card-detail">Estimated</div>
                    </div>
                </div>

                ${currencyHtml}
            </div>

            <div class="popup-total">
                <div class="popup-total-left">
                    <div class="popup-total-label">Estimated Total</div>
                    <div class="popup-total-value">$${costs.total.toLocaleString()}</div>
                    <div class="popup-total-breakdown">${travelers} traveler${travelers > 1 ? 's' : ''} · ${nights} nights</div>
                </div>
                <div class="popup-total-right">
                    <div class="popup-total-perday">$${costs.perDay}</div>
                    <div class="popup-total-perday-label">per day</div>
                </div>
            </div>
        </div>
    `;
}

// Update alternatives panel
function updateAlternativesPanel(results, budgetMin, budgetMax) {
    const panel = document.getElementById('resultsPanel');
    const list = document.getElementById('alternativeList');
    const count = document.getElementById('resultsCount');

    if (results.length === 0) {
        panel.classList.remove('show');
        return;
    }

    // Show top destinations within budget
    const inBudget = results.slice(0, 10);

    count.textContent = `${inBudget.length} of ${results.length}`;

    list.innerHTML = inBudget.map(dest => {
        const weatherInfo = dest.weather ? `${dest.weather.conditions.split(' ')[0]} ${dest.weather.avgHigh}°F` : '';
        const advisoryColor = dest.advisory ? dest.advisory.color : '#888';
        // Show thumbnail if available, otherwise show travel mode icon
        const imageHtml = dest.image && dest.image.thumb
            ? `<div class="alternative-thumb"><img src="${dest.image.thumb}" alt="${dest.city}" loading="lazy"></div>`
            : `<div class="alternative-icon">${dest.type === 'drive' ? '🚗' : '✈️'}</div>`;
        return `
            <div class="alternative-item" onclick="focusDestination(${dest.lat}, ${dest.lon})">
                ${imageHtml}
                <div class="alternative-info">
                    <div class="alternative-name">
                        ${dest.city}, ${dest.country}
                        ${dest.advisory ? `<span style="color: ${advisoryColor}; font-size: 10px;">●</span>` : ''}
                    </div>
                    <div class="alternative-details">
                        ${dest.type === 'drive' ? '🚗' : '✈️'} ${weatherInfo ? `${weatherInfo} · ` : ''}${formatTravelTime(dest.travelTime)}
                    </div>
                </div>
                <div class="alternative-price">$${dest.costs.total}</div>
            </div>
        `;
    }).join('');

    panel.classList.add('show');
}

// Focus on a destination
function focusDestination(lat, lon) {
    map.setView([lat, lon], 8);

    // Find and open the marker popup
    markers.forEach(marker => {
        const pos = marker.getLatLng();
        if (Math.abs(pos.lat - lat) < 0.01 && Math.abs(pos.lng - lon) < 0.01) {
            marker.openPopup();
        }
    });
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

// Fetch weather data (optional - requires API key)
async function fetchWeather(lat, lon, date) {
    if (!WEATHER_API_KEY) return null;

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
    }
}

// ============================================
// SECURITY LEVEL MODAL
// ============================================
const SECURITY_LEVEL_INFO = {
    1: {
        title: 'Level 1: Exercise Normal Precautions',
        color: '#4CAF50',
        summary: 'This is the lowest advisory level for safety and security risk.',
        details: [
            'Standard safety precautions apply',
            'Be aware of your surroundings',
            'Follow local laws and customs',
            'Register with your embassy if traveling for extended periods'
        ],
        examples: 'Countries like Canada, Japan, UK, Ireland, and Portugal typically have Level 1 advisories.'
    },
    2: {
        title: 'Level 2: Exercise Increased Caution',
        color: '#FFA500',
        summary: 'There are heightened risks to safety and security.',
        details: [
            'Be more vigilant when traveling',
            'Avoid demonstrations and large gatherings',
            'Monitor local news for updates',
            'Keep a low profile and avoid displaying valuables',
            'Have contingency plans for emergencies'
        ],
        examples: 'Many popular tourist destinations including Mexico, France, Italy, Spain, and Indonesia have Level 2 advisories due to risks like petty crime or terrorism concerns.'
    },
    3: {
        title: 'Level 3: Reconsider Travel',
        color: '#FF6B6B',
        summary: 'Serious risks are present. Travel should be reconsidered.',
        details: [
            'Significant safety concerns exist in some or all areas',
            'Evaluate your personal circumstances carefully',
            'If you must travel, have robust contingency plans',
            'Avoid high-risk areas completely',
            'Ensure comprehensive travel insurance',
            'Share detailed itinerary with family/friends'
        ],
        examples: 'Countries with regional conflicts, high crime rates, or civil unrest may have Level 3 advisories. Sometimes only certain regions within a country are affected.'
    },
    4: {
        title: 'Level 4: Do Not Travel',
        color: '#d32f2f',
        summary: 'This is the highest advisory level due to life-threatening risks.',
        details: [
            'Greater likelihood of life-threatening risks',
            'Government ability to assist citizens is extremely limited',
            'Active conflict, terrorism, or civil unrest may be ongoing',
            'U.S. citizens should depart if safe to do so',
            'Travel insurance may not be valid'
        ],
        examples: 'Countries with active wars, widespread violence, or where government services have collapsed typically have Level 4 advisories.'
    }
};

function showSecurityModal(level) {
    const info = SECURITY_LEVEL_INFO[level] || SECURITY_LEVEL_INFO[2];

    // Create modal if it doesn't exist
    let modal = document.getElementById('securityModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'securityModal';
        modal.className = 'security-modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="security-modal-content">
            <button class="security-modal-close" onclick="closeSecurityModal()">&times;</button>
            <h2 style="color: ${info.color}; margin-bottom: 16px;">${info.title}</h2>
            <p style="font-size: 15px; margin-bottom: 16px; color: #ddd;">${info.summary}</p>
            <h3 style="font-size: 14px; color: #00d4ff; margin-bottom: 8px;">What this means:</h3>
            <ul style="margin-bottom: 16px; padding-left: 20px; color: #bbb;">
                ${info.details.map(d => `<li style="margin-bottom: 6px;">${d}</li>`).join('')}
            </ul>
            <p style="font-size: 13px; color: #888; border-top: 1px solid #404040; padding-top: 12px;">
                <strong>Examples:</strong> ${info.examples}
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 12px;">
                Source: U.S. Department of State Travel Advisories. Always check
                <a href="https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/" target="_blank" style="color: #00d4ff;">travel.state.gov</a>
                for the most current information.
            </p>
        </div>
    `;

    modal.style.display = 'flex';

    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) closeSecurityModal();
    };
}

function closeSecurityModal() {
    const modal = document.getElementById('securityModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
