let map;
let markers = [];
let citiesData = [];
let visaData = {};
let selectedHomeCity = null;
let selectedPassports = new Set();

// Initialize the map
function initMap() {
    map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

// Load cities data
async function loadCitiesData() {
    try {
        const response = await fetch('public/cost-of-living-data.json');
        const data = await response.json();
        citiesData = data.cities;
        setupAutocomplete();
    } catch (error) {
        console.error('Error loading cities data:', error);
        alert('Error loading city data. Please refresh the page.');
    }
}

// Load visa data
async function loadVisaData() {
    try {
        const response = await fetch('public/passport-visa-data.json');
        const data = await response.json();
        visaData = data;
        populatePassportDropdown(data.passports);
    } catch (error) {
        console.error('Error loading visa data:', error);
    }
}

// Populate passport dropdown (works for both multi-select and custom implementations)
function populatePassportDropdown(passports) {
    const passportSelect = document.getElementById('passports');
    if (!passportSelect) return;

    passports.forEach(passport => {
        const option = document.createElement('option');
        option.value = passport;
        option.textContent = passport;
        passportSelect.appendChild(option);
    });

    // Handle multi-select changes
    passportSelect.addEventListener('change', () => {
        selectedPassports.clear();
        Array.from(passportSelect.selectedOptions).forEach(option => {
            selectedPassports.add(option.value);
        });
    });
}

// Setup autocomplete for city search
function setupAutocomplete() {
    const input = document.getElementById('homeCity');
    const results = document.getElementById('homeCityResults');

    input.addEventListener('input', async (e) => {
        const term = e.target.value.toLowerCase().trim();

        if (term.length < 2) {
            results.classList.remove('show');
            return;
        }

        // First, try exact and partial matches in our database
        const matches = citiesData.filter(c =>
            c.city.toLowerCase().includes(term) ||
            c.country.toLowerCase().includes(term) ||
            (c.state && c.state.toLowerCase().includes(term))
        ).slice(0, 10);

        // If we have matches, show them
        if (matches.length > 0) {
            results.innerHTML = matches.map(c => {
                const cityLabel = c.state
                    ? `${c.city}, ${c.state}, ${c.country}`
                    : `${c.city}, ${c.country}`;
                return `
                    <div class="autocomplete-item" data-city-id="${citiesData.indexOf(c)}">
                        <div class="city-name">${c.city}</div>
                        <div class="city-details">${c.country}${c.state ? ', ' + c.state : ''}</div>
                    </div>
                `;
            }).join('');

            results.classList.add('show');

            // Add click handlers
            results.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', () => {
                    const cityId = parseInt(item.dataset.cityId);
                    selectedHomeCity = citiesData[cityId];
                    selectedHomeCity._isNearestMatch = false;
                    const label = selectedHomeCity.state
                        ? `${selectedHomeCity.city}, ${selectedHomeCity.state}, ${selectedHomeCity.country}`
                        : `${selectedHomeCity.city}, ${selectedHomeCity.country}`;
                    input.value = label;
                    results.classList.remove('show');
                });
            });
        } else {
            // No matches - try to geocode the search term and find nearest city
            try {
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(e.target.value)}&format=json&limit=1`;
                const response = await fetch(geocodeUrl);
                const data = await response.json();

                if (data && data.length > 0) {
                    const searchLat = parseFloat(data[0].lat);
                    const searchLon = parseFloat(data[0].lon);
                    const searchName = data[0].display_name;

                    // Find nearest city in our database
                    const nearest = findNearestCity(
                        { lat: searchLat, lon: searchLon },
                        null
                    );

                    if (nearest.city) {
                        results.innerHTML = `
                            <div class="autocomplete-item" data-nearest="true" data-city-id="${citiesData.indexOf(nearest.city)}" data-distance="${nearest.distance}" data-search-name="${searchName}">
                                <div class="city-name">📍 "${e.target.value}" not found</div>
                                <div class="city-details">Nearest city: ${nearest.city.city}, ${nearest.city.country} (~${nearest.distance} km away)</div>
                            </div>
                        `;
                        results.classList.add('show');

                        results.querySelector('.autocomplete-item').addEventListener('click', (event) => {
                            const cityId = parseInt(event.currentTarget.dataset.cityId);
                            const distance = parseInt(event.currentTarget.dataset.distance);
                            const searchName = event.currentTarget.dataset.searchName;

                            selectedHomeCity = citiesData[cityId];
                            selectedHomeCity._isNearestMatch = true;
                            selectedHomeCity._searchedCity = searchName;
                            selectedHomeCity._distance = distance;

                            input.value = `${selectedHomeCity.city}, ${selectedHomeCity.country} (nearest to "${e.target.value}")`;
                            results.classList.remove('show');
                        });
                    } else {
                        results.classList.remove('show');
                    }
                } else {
                    results.classList.remove('show');
                }
            } catch (error) {
                console.error('Geocoding error:', error);
                results.classList.remove('show');
            }
        }
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container')) {
            results.classList.remove('show');
        }
    });
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Find nearest city with data for a given location
function findNearestCity(searchCity, searchCountry) {
    let nearestCity = null;
    let minDistance = Infinity;

    citiesData.forEach(city => {
        // Skip if country doesn't match (unless no country specified)
        if (searchCountry && city.country.toLowerCase() !== searchCountry.toLowerCase()) {
            return;
        }

        const distance = calculateDistance(
            city.lat, city.lon,
            searchCity.lat, searchCity.lon
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
        }
    });

    return { city: nearestCity, distance: Math.round(minDistance) };
}

// Get color based on percentage difference
function getColor(percentDiff) {
    if (percentDiff <= -40) return '#4CAF50';
    if (percentDiff <= -10) return '#FF9800';
    if (percentDiff < 10) return '#9E9E9E';
    return '#f44336';
}

// Get marker class based on percentage difference
function getMarkerClass(percentDiff) {
    if (percentDiff <= -40) return 'marker-green';
    if (percentDiff <= -10) return 'marker-amber';
    if (percentDiff < 10) return 'marker-gray';
    return 'marker-red';
}

// Get geopolitical risk badge
function getRiskBadge(risk) {
    if (risk <= 2) return '<span class="risk-badge risk-low">Low Risk</span>';
    if (risk <= 5) return '<span class="risk-badge risk-medium">Medium Risk</span>';
    return '<span class="risk-badge risk-high">High Risk</span>';
}

// Get visa information for city
function getVisaInfo(city) {
    if (selectedPassports.size === 0) return null;

    const visaInfoList = [];
    selectedPassports.forEach(passport => {
        const countryVisa = visaData.visaRequirements?.[passport]?.[city.country];
        if (countryVisa) {
            visaInfoList.push({
                passport: passport,
                ...countryVisa
            });
        }
    });

    return visaInfoList;
}

// Format visa badge
function getVisaBadge(category) {
    const badges = {
        'visa-free': '<span class="visa-badge visa-free">Visa Free</span>',
        'visa-on-arrival': '<span class="visa-badge visa-on-arrival">Visa on Arrival</span>',
        'visa-required': '<span class="visa-badge visa-required">Visa Required</span>',
        'e-visa': '<span class="visa-badge visa-eta">e-Visa</span>',
        'eTA': '<span class="visa-badge visa-eta">eTA</span>',
        'ESTA': '<span class="visa-badge visa-eta">ESTA</span>',
        'citizen': '<span class="visa-badge visa-free">Citizen</span>',
        'citizen-rights': '<span class="visa-badge visa-free">Citizen Rights</span>',
        'CTA': '<span class="visa-badge visa-free">CTA Member</span>'
    };
    return badges[category] || `<span class="visa-badge visa-required">${category}</span>`;
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

// Calculate and display results
function calculateAndDisplay() {
    if (!selectedHomeCity) {
        alert('Please select your home city');
        return;
    }

    const budget = parseFloat(document.getElementById('budget').value);
    const savingsSelect = document.getElementById('savings');
    const savings = savingsSelect ? parseFloat(savingsSelect.value) || 0 : 0;

    if (!budget || budget <= 0) {
        alert('Please enter a valid monthly budget');
        return;
    }

    // Clear existing markers
    clearMarkers();

    // Show info box
    const infoBox = document.getElementById('infoBox');
    const infoText = document.getElementById('infoText');
    const homeCityLabel = selectedHomeCity.state
        ? `${selectedHomeCity.city}, ${selectedHomeCity.state}, ${selectedHomeCity.country}`
        : `${selectedHomeCity.city}, ${selectedHomeCity.country}`;

    let infoMsg = `Comparing costs relative to ${homeCityLabel} with $${budget.toLocaleString()}/month budget`;
    if (selectedHomeCity._isNearestMatch) {
        infoMsg = `⚠️ Using ${homeCityLabel} as nearest available data point (${selectedHomeCity._distance} km from your search). ` + infoMsg;
    }
    if (savings > 0) {
        infoMsg += ` and $${savings.toLocaleString()} in savings`;
    }
    if (selectedPassports.size > 0) {
        infoMsg += `. Showing visa info for: ${Array.from(selectedPassports).join(', ')}`;
    }
    infoText.textContent = infoMsg;
    infoBox.style.display = 'block';

    // Center map on home city
    map.setView([selectedHomeCity.lat, selectedHomeCity.lon], 3);

    // Add markers for all cities
    citiesData.forEach(city => {
        const percentDiff = ((city.costOfLivingIndex - selectedHomeCity.costOfLivingIndex) / selectedHomeCity.costOfLivingIndex) * 100;
        const equivalentBudget = (budget * city.costOfLivingIndex) / selectedHomeCity.costOfLivingIndex;
        const monthlySavings = budget - equivalentBudget;
        const runwayMonths = savings > 0 ? (savings / equivalentBudget).toFixed(1) : 0;

        const color = getColor(percentDiff);
        const markerClass = getMarkerClass(percentDiff);

        // Create custom div icon
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="custom-marker ${markerClass}">${percentDiff >= 0 ? '+' : ''}${Math.round(percentDiff)}%</div>`,
            iconSize: [45, 45],
            iconAnchor: [22, 22],
            popupAnchor: [0, -22]
        });

        const cityLabel = city.state
            ? `${city.city}, ${city.state}, ${city.country}`
            : `${city.city}, ${city.country}`;

        // Build popup content
        let popupHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3>${city.city}</h3>
                    <div class="country">${city.country}${city.state ? ', ' + city.state : ''}</div>
                </div>

                <div class="popup-section">
                    <h4><span class="icon">💵</span> Cost of Living</h4>
                    <div class="popup-row">
                        <span class="label">Compared to home:</span>
                        <span class="value ${percentDiff < 0 ? 'positive' : 'negative'}">${percentDiff >= 0 ? '+' : ''}${percentDiff.toFixed(1)}%</span>
                    </div>
                    <div class="popup-row">
                        <span class="label">Equivalent budget:</span>
                        <span class="value">$${equivalentBudget.toLocaleString(undefined, {maximumFractionDigits: 0})}/mo</span>
                    </div>
                    <div class="popup-row">
                        <span class="label">Monthly ${monthlySavings > 0 ? 'savings' : 'extra cost'}:</span>
                        <span class="value ${monthlySavings > 0 ? 'positive' : 'negative'}">$${Math.abs(monthlySavings).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
        `;

        popupHTML += `</div>`;

        // Geopolitical risk
        popupHTML += `
                <div class="popup-section">
                    <h4><span class="icon">⚠️</span> Geopolitical Risk</h4>
                    <div>${getRiskBadge(city.geopoliticalRisk)}</div>
                </div>
        `;

        // Visa information
        const visaInfo = getVisaInfo(city);
        if (visaInfo && visaInfo.length > 0) {
            popupHTML += `<div class="popup-section"><h4><span class="icon">🛂</span> Visa Information</h4>`;
            visaInfo.forEach(info => {
                popupHTML += `
                    <div class="visa-info">
                        <strong>${info.passport}:</strong> ${getVisaBadge(info.category)}
                        ${info.visaFree > 0 ? `<div style="margin-top: 4px; font-size: 0.85em;">Stay: ${info.visaFree} days visa-free</div>` : ''}
                        ${info.residencyPath ? `<div style="margin-top: 4px; font-size: 0.85em; color: #666;">Residency: ${info.residencyPath}</div>` : ''}
                    </div>
                `;
            });
            popupHTML += `</div>`;
        }

        // Savings runway section (redesigned for better readability)
        if (savings > 0 && visaInfo && visaInfo.length > 0) {
            popupHTML += `<div class="popup-section"><h4><span class="icon">⏱️</span> Savings Runway</h4>`;

            // For each passport, show the runway calculation
            visaInfo.forEach(info => {
                const visaType = info.category === 'visa-free' ? 'visa-free entry' :
                                 info.category === 'visa-on-arrival' ? 'visa on arrival' :
                                 info.category === 'e-visa' ? 'e-Visa' :
                                 info.category === 'citizen' ? 'citizenship rights' :
                                 info.category;

                popupHTML += `
                    <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #0096ff;">
                        <div style="font-size: 0.9em; color: #333; line-height: 1.6;">
                            Based on your <strong>$${savings.toLocaleString()}</strong> savings, you can live here for
                            <strong style="color: #4CAF50; font-size: 1.1em;">${runwayMonths} months</strong>
                            with <strong>${visaType}</strong>, which is supported by your <strong>${info.passport}</strong> passport.
                        </div>
                    </div>
                `;
            });

            popupHTML += `</div>`;
        } else if (savings > 0) {
            // Show runway even without visa info
            popupHTML += `
                <div class="popup-section">
                    <h4><span class="icon">⏱️</span> Savings Runway</h4>
                    <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; border-left: 3px solid #0096ff;">
                        <div style="font-size: 0.9em; color: #333; line-height: 1.6;">
                            Based on your <strong>$${savings.toLocaleString()}</strong> savings, you can live here for
                            <strong style="color: #4CAF50; font-size: 1.1em;">${runwayMonths} months</strong>.
                        </div>
                    </div>
                </div>
            `;
        }

        popupHTML += `</div>`;

        const marker = L.marker([city.lat, city.lon], { icon: icon })
            .addTo(map)
            .bindPopup(popupHTML, {
                maxWidth: 450,
                className: 'custom-popup'
            });

        markers.push(marker);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadCitiesData();
    loadVisaData();
});
