// Travel Cost Estimator - Main Script
// ====================================

// Global variables
let map;
let markers = [];
let destinationsData = [];
let selectedHomeCity = null;
let travelMode = 'both';
let dateType = 'specific';
let selectedMonths = [];

// OpenWeatherMap API (free tier - 1000 calls/day)
const WEATHER_API_KEY = ''; // User should add their own key

// Destinations data with base prices
// Prices are baseline estimates that get adjusted for seasonality
const DESTINATIONS = [
    // Drivable from NYC (within ~8 hours)
    { city: "Catskills", region: "New York", country: "USA", lat: 42.1, lon: -74.4,
      type: "drive", driveHoursFromNYC: 2.5,
      accommodation: { budget: 80, mid: 150, luxury: 350 },
      activities: 40, food: 60, description: "Mountain cabins & hiking",
      seasonality: { winter: 1.3, spring: 0.9, summer: 1.2, fall: 1.4 } },

    { city: "Cape Cod", region: "Massachusetts", country: "USA", lat: 41.67, lon: -70.3,
      type: "drive", driveHoursFromNYC: 5,
      accommodation: { budget: 100, mid: 180, luxury: 400 },
      activities: 50, food: 70, description: "Beaches & seafood",
      seasonality: { winter: 0.6, spring: 0.8, summer: 1.5, fall: 1.0 } },

    { city: "Philadelphia", region: "Pennsylvania", country: "USA", lat: 39.95, lon: -75.17,
      type: "drive", driveHoursFromNYC: 2,
      accommodation: { budget: 70, mid: 140, luxury: 280 },
      activities: 35, food: 55, description: "History & cheesesteaks",
      seasonality: { winter: 0.85, spring: 1.0, summer: 1.1, fall: 1.05 } },

    { city: "Washington DC", region: "DC", country: "USA", lat: 38.9, lon: -77.04,
      type: "drive", driveHoursFromNYC: 4,
      accommodation: { budget: 90, mid: 170, luxury: 350 },
      activities: 25, food: 60, description: "Museums & monuments (free!)",
      seasonality: { winter: 0.8, spring: 1.3, summer: 1.0, fall: 1.0 } },

    { city: "Boston", region: "Massachusetts", country: "USA", lat: 42.36, lon: -71.06,
      type: "drive", driveHoursFromNYC: 4,
      accommodation: { budget: 100, mid: 190, luxury: 400 },
      activities: 45, food: 70, description: "Historic city & lobster",
      seasonality: { winter: 0.75, spring: 1.0, summer: 1.2, fall: 1.3 } },

    { city: "Atlantic City", region: "New Jersey", country: "USA", lat: 39.36, lon: -74.42,
      type: "drive", driveHoursFromNYC: 2.5,
      accommodation: { budget: 60, mid: 120, luxury: 280 },
      activities: 50, food: 55, description: "Casinos & boardwalk",
      seasonality: { winter: 0.7, spring: 0.9, summer: 1.4, fall: 0.9 } },

    { city: "Poconos", region: "Pennsylvania", country: "USA", lat: 41.1, lon: -75.3,
      type: "drive", driveHoursFromNYC: 2,
      accommodation: { budget: 70, mid: 140, luxury: 300 },
      activities: 45, food: 50, description: "Lakes & ski resorts",
      seasonality: { winter: 1.4, spring: 0.8, summer: 1.1, fall: 1.2 } },

    { city: "Hudson Valley", region: "New York", country: "USA", lat: 41.5, lon: -73.9,
      type: "drive", driveHoursFromNYC: 1.5,
      accommodation: { budget: 90, mid: 180, luxury: 400 },
      activities: 40, food: 65, description: "Wineries & fall foliage",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.1, fall: 1.5 } },

    { city: "Vermont", region: "Vermont", country: "USA", lat: 44.26, lon: -72.58,
      type: "drive", driveHoursFromNYC: 5,
      accommodation: { budget: 85, mid: 160, luxury: 350 },
      activities: 50, food: 55, description: "Skiing & maple syrup",
      seasonality: { winter: 1.5, spring: 0.7, summer: 1.0, fall: 1.4 } },

    { city: "Montreal", region: "Quebec", country: "Canada", lat: 45.5, lon: -73.57,
      type: "drive", driveHoursFromNYC: 6,
      accommodation: { budget: 70, mid: 130, luxury: 280 },
      activities: 40, food: 50, description: "French culture & poutine",
      seasonality: { winter: 0.8, spring: 0.9, summer: 1.3, fall: 1.1 } },

    // Fly destinations - Caribbean & Mexico
    { city: "Cancun", region: "Quintana Roo", country: "Mexico", lat: 21.16, lon: -86.85,
      type: "fly", flightFromNYC: { low: 250, mid: 400, high: 600 },
      accommodation: { budget: 60, mid: 150, luxury: 400 },
      activities: 50, food: 40, description: "Beaches & Mayan ruins",
      seasonality: { winter: 1.4, spring: 1.3, summer: 0.8, fall: 0.7 } },

    { city: "Mexico City", region: "CDMX", country: "Mexico", lat: 19.43, lon: -99.13,
      type: "fly", flightFromNYC: { low: 220, mid: 350, high: 550 },
      accommodation: { budget: 40, mid: 100, luxury: 250 },
      activities: 30, food: 30, description: "Culture, food & history",
      seasonality: { winter: 1.1, spring: 1.0, summer: 0.9, fall: 0.9 } },

    { city: "San Juan", region: "Puerto Rico", country: "USA", lat: 18.47, lon: -66.1,
      type: "fly", flightFromNYC: { low: 150, mid: 280, high: 450 },
      accommodation: { budget: 80, mid: 160, luxury: 350 },
      activities: 45, food: 50, description: "Beaches & Old San Juan",
      seasonality: { winter: 1.4, spring: 1.2, summer: 0.9, fall: 0.8 } },

    { city: "Punta Cana", region: "La Altagracia", country: "Dominican Republic", lat: 18.58, lon: -68.4,
      type: "fly", flightFromNYC: { low: 200, mid: 350, high: 500 },
      accommodation: { budget: 70, mid: 180, luxury: 450 },
      activities: 40, food: 35, description: "All-inclusive resorts",
      seasonality: { winter: 1.5, spring: 1.2, summer: 0.8, fall: 0.7 } },

    { city: "Nassau", region: "New Providence", country: "Bahamas", lat: 25.06, lon: -77.35,
      type: "fly", flightFromNYC: { low: 200, mid: 350, high: 550 },
      accommodation: { budget: 100, mid: 220, luxury: 500 },
      activities: 60, food: 70, description: "Crystal clear waters",
      seasonality: { winter: 1.4, spring: 1.2, summer: 0.9, fall: 0.8 } },

    { city: "Havana", region: "La Habana", country: "Cuba", lat: 23.11, lon: -82.37,
      type: "fly", flightFromNYC: { low: 280, mid: 400, high: 600 },
      accommodation: { budget: 35, mid: 80, luxury: 200 },
      activities: 25, food: 25, description: "Classic cars & culture",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.9, fall: 0.8 } },

    // South America
    { city: "Medellin", region: "Antioquia", country: "Colombia", lat: 6.25, lon: -75.56,
      type: "fly", flightFromNYC: { low: 280, mid: 450, high: 700 },
      accommodation: { budget: 30, mid: 70, luxury: 180 },
      activities: 25, food: 25, description: "Eternal spring & coffee",
      seasonality: { winter: 1.1, spring: 1.0, summer: 0.95, fall: 0.95 } },

    { city: "Bogota", region: "Cundinamarca", country: "Colombia", lat: 4.71, lon: -74.07,
      type: "fly", flightFromNYC: { low: 260, mid: 420, high: 650 },
      accommodation: { budget: 35, mid: 80, luxury: 200 },
      activities: 25, food: 25, description: "Mountain capital & museums",
      seasonality: { winter: 1.0, spring: 1.0, summer: 1.0, fall: 1.0 } },

    { city: "Cartagena", region: "Bolivar", country: "Colombia", lat: 10.39, lon: -75.51,
      type: "fly", flightFromNYC: { low: 300, mid: 480, high: 750 },
      accommodation: { budget: 45, mid: 120, luxury: 300 },
      activities: 35, food: 35, description: "Colonial city & beaches",
      seasonality: { winter: 1.3, spring: 1.1, summer: 0.9, fall: 0.85 } },

    { city: "Lima", region: "Lima", country: "Peru", lat: -12.05, lon: -77.04,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 850 },
      accommodation: { budget: 35, mid: 90, luxury: 220 },
      activities: 30, food: 30, description: "Foodie capital & history",
      seasonality: { winter: 0.9, spring: 1.0, summer: 1.1, fall: 1.0 } },

    { city: "Buenos Aires", region: "CABA", country: "Argentina", lat: -34.6, lon: -58.38,
      type: "fly", flightFromNYC: { low: 500, mid: 800, high: 1200 },
      accommodation: { budget: 30, mid: 80, luxury: 200 },
      activities: 30, food: 35, description: "Tango, steak & wine",
      seasonality: { winter: 0.8, spring: 1.1, summer: 1.2, fall: 1.0 } },

    // Europe
    { city: "Lisbon", region: "Lisboa", country: "Portugal", lat: 38.72, lon: -9.14,
      type: "fly", flightFromNYC: { low: 350, mid: 550, high: 900 },
      accommodation: { budget: 50, mid: 120, luxury: 280 },
      activities: 35, food: 40, description: "History, beaches & pastéis",
      seasonality: { winter: 0.7, spring: 1.0, summer: 1.4, fall: 1.0 } },

    { city: "Barcelona", region: "Catalonia", country: "Spain", lat: 41.39, lon: 2.17,
      type: "fly", flightFromNYC: { low: 380, mid: 600, high: 950 },
      accommodation: { budget: 60, mid: 140, luxury: 320 },
      activities: 40, food: 50, description: "Gaudí, tapas & beaches",
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
];

// Major US cities for home city selection
const HOME_CITIES = [
    { city: "New York", state: "NY", lat: 40.71, lon: -74.01 },
    { city: "Los Angeles", state: "CA", lat: 34.05, lon: -118.24 },
    { city: "Chicago", state: "IL", lat: 41.88, lon: -87.63 },
    { city: "Houston", state: "TX", lat: 29.76, lon: -95.37 },
    { city: "Phoenix", state: "AZ", lat: 33.45, lon: -112.07 },
    { city: "Philadelphia", state: "PA", lat: 39.95, lon: -75.17 },
    { city: "San Antonio", state: "TX", lat: 29.42, lon: -98.49 },
    { city: "San Diego", state: "CA", lat: 32.72, lon: -117.16 },
    { city: "Dallas", state: "TX", lat: 32.78, lon: -96.8 },
    { city: "San Jose", state: "CA", lat: 37.34, lon: -121.89 },
    { city: "Austin", state: "TX", lat: 30.27, lon: -97.74 },
    { city: "Jacksonville", state: "FL", lat: 30.33, lon: -81.66 },
    { city: "Fort Worth", state: "TX", lat: 32.76, lon: -97.33 },
    { city: "Columbus", state: "OH", lat: 39.96, lon: -83.0 },
    { city: "Charlotte", state: "NC", lat: 35.23, lon: -80.84 },
    { city: "San Francisco", state: "CA", lat: 37.77, lon: -122.42 },
    { city: "Indianapolis", state: "IN", lat: 39.77, lon: -86.16 },
    { city: "Seattle", state: "WA", lat: 47.61, lon: -122.33 },
    { city: "Denver", state: "CO", lat: 39.74, lon: -104.99 },
    { city: "Washington", state: "DC", lat: 38.9, lon: -77.04 },
    { city: "Boston", state: "MA", lat: 42.36, lon: -71.06 },
    { city: "Nashville", state: "TN", lat: 36.16, lon: -86.78 },
    { city: "Detroit", state: "MI", lat: 42.33, lon: -83.05 },
    { city: "Portland", state: "OR", lat: 45.52, lon: -122.68 },
    { city: "Las Vegas", state: "NV", lat: 36.17, lon: -115.14 },
    { city: "Atlanta", state: "GA", lat: 33.75, lon: -84.39 },
    { city: "Miami", state: "FL", lat: 25.76, lon: -80.19 },
    { city: "Minneapolis", state: "MN", lat: 44.98, lon: -93.27 },
];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initDatePickers();
    initAutocomplete();
    initMonthSelector();
    destinationsData = DESTINATIONS;
});

// Initialize Leaflet map
function initMap() {
    map = L.map('map').setView([30, -40], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
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

// Initialize autocomplete for home city
function initAutocomplete() {
    const input = document.getElementById('homeCity');
    const results = document.getElementById('homeCityResults');

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        if (query.length < 2) {
            results.classList.remove('show');
            return;
        }

        const matches = HOME_CITIES.filter(c =>
            c.city.toLowerCase().includes(query) ||
            c.state.toLowerCase().includes(query)
        ).slice(0, 8);

        if (matches.length === 0) {
            results.classList.remove('show');
            return;
        }

        results.innerHTML = matches.map(c =>
            `<div class="autocomplete-item" data-city="${c.city}" data-state="${c.state}" data-lat="${c.lat}" data-lon="${c.lon}">
                ${c.city}, ${c.state}
            </div>`
        ).join('');

        results.classList.add('show');

        // Add click handlers
        results.querySelectorAll('.autocomplete-item').forEach(item => {
            item.onclick = () => selectHomeCity(item);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.classList.remove('show');
        }
    });
}

function selectHomeCity(item) {
    const city = item.dataset.city;
    const state = item.dataset.state;
    const lat = parseFloat(item.dataset.lat);
    const lon = parseFloat(item.dataset.lon);

    selectedHomeCity = { city, state, lat, lon };
    document.getElementById('homeCity').value = `${city}, ${state}`;
    document.getElementById('homeCityResults').classList.remove('show');

    // Center map on home city
    map.setView([lat, lon], 5);
}

// UI state functions
function setTravelMode(mode) {
    travelMode = mode;
    document.querySelectorAll('.travel-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
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

// Main search function
async function searchDestinations() {
    if (!selectedHomeCity) {
        alert('Please select your home city first.');
        return;
    }

    const travelers = parseInt(document.getElementById('travelers').value) || 2;
    const nights = parseInt(document.getElementById('tripDuration').value) || 7;
    const accommodationType = document.getElementById('accommodationType').value;
    const budgetMin = parseInt(document.getElementById('budgetMin').value) || 0;
    const budgetMax = parseInt(document.getElementById('budgetMax').value) || Infinity;

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

        // Calculate costs for each destination
        const results = [];

        for (const dest of destinationsData) {
            // Filter by travel mode
            if (travelMode === 'fly' && dest.type === 'drive') continue;
            if (travelMode === 'drive' && dest.type === 'fly') continue;

            // Calculate distance from home city
            const distance = calculateDistance(
                selectedHomeCity.lat, selectedHomeCity.lon,
                dest.lat, dest.lon
            );

            // Skip drive destinations if too far (> 600 miles)
            if (dest.type === 'drive' && distance > 600) continue;

            // Calculate costs
            const costs = calculateTripCost(dest, {
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
                    continue;
                }
            }

            results.push({
                ...dest,
                costs,
                distance
            });
        }

        // Sort by total cost
        results.sort((a, b) => a.costs.total - b.costs.total);

        // Add markers to map
        results.forEach(dest => addDestinationMarker(dest, travelers, nights));

        // Update alternatives panel
        updateAlternativesPanel(results, budgetMin, budgetMax);

        // Fit map to show all markers
        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }

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

    // Activities cost (per person, spread across trip)
    const activitiesCost = dest.activities * travelers;

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

// Add destination marker to map
function addDestinationMarker(dest, travelers, nights) {
    // Determine marker class based on cost
    let markerClass = 'marker-moderate';
    const perDay = dest.costs.perDay;

    if (perDay < 150) markerClass = 'marker-cheap';
    else if (perDay > 400) markerClass = 'marker-expensive';

    if (dest.type === 'drive') markerClass += ' marker-drive';

    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="custom-marker ${markerClass}">
                <span class="marker-price">$${dest.costs.total}</span>
                <span class="marker-type">${dest.type === 'drive' ? '🚗' : '✈️'}</span>
            </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
    });

    const popup = createPopupContent(dest, travelers, nights);

    const marker = L.marker([dest.lat, dest.lon], { icon })
        .bindPopup(popup, { maxWidth: 320 })
        .addTo(map);

    markers.push(marker);
}

// Create popup content for destination
function createPopupContent(dest, travelers, nights) {
    const costs = dest.costs;
    const seasonLabel = costs.seasonMultiplier > 1.1 ? '🔥 Peak Season' :
                       costs.seasonMultiplier < 0.9 ? '💰 Off-Season' : '📅 Shoulder Season';

    return `
        <div class="popup-content">
            <div class="popup-header">${dest.city}</div>
            <div class="popup-subheader">${dest.region}, ${dest.country}</div>

            <div class="popup-section">
                <h4>📍 About</h4>
                <p style="font-size: 13px; color: #ccc; margin: 0;">${dest.description}</p>
                <div style="margin-top: 8px;">
                    <span class="weather-badge">${seasonLabel}</span>
                </div>
            </div>

            <div class="popup-section">
                <h4>${costs.transportType === 'drive' ? '🚗 Driving' : '✈️ Flights'}</h4>
                <div class="popup-row">
                    <span class="popup-row-label">
                        ${costs.transportType === 'drive'
                            ? `${Math.round(dest.distance)} mi round trip`
                            : `${travelers} traveler${travelers > 1 ? 's' : ''}`}
                    </span>
                    <span class="popup-row-value">$${costs.transport}</span>
                </div>
            </div>

            <div class="popup-section">
                <h4>🏨 Accommodation</h4>
                <div class="popup-row">
                    <span class="popup-row-label">${nights} nights</span>
                    <span class="popup-row-value">$${costs.accommodation}</span>
                </div>
            </div>

            <div class="popup-section">
                <h4>🍽️ Food & Activities</h4>
                <div class="popup-row">
                    <span class="popup-row-label">Food (${nights} days)</span>
                    <span class="popup-row-value">$${costs.food}</span>
                </div>
                <div class="popup-row">
                    <span class="popup-row-label">Activities</span>
                    <span class="popup-row-value">$${costs.activities}</span>
                </div>
            </div>

            <div class="popup-total">
                <div class="popup-total-label">Estimated Total (${travelers} travelers)</div>
                <div class="popup-total-value">$${costs.total}</div>
                <div class="popup-total-per-day">$${costs.perDay}/day · $${costs.perPerson}/person</div>
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

    list.innerHTML = inBudget.map(dest => `
        <div class="alternative-item" onclick="focusDestination(${dest.lat}, ${dest.lon})">
            <div class="alternative-icon">${dest.type === 'drive' ? '🚗' : '✈️'}</div>
            <div class="alternative-info">
                <div class="alternative-name">${dest.city}, ${dest.country}</div>
                <div class="alternative-details">${dest.description}</div>
            </div>
            <div class="alternative-price">$${dest.costs.total}</div>
        </div>
    `).join('');

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
