# Global Cost of Living & Digital Nomad Map

A comprehensive interactive web-based map for digital nomads and location-independent professionals to compare cost of living, visa requirements, savings runway, and geopolitical risk across major cities worldwide.

## Overview

This tool helps people understand where they can live based on their budget, passport(s), savings, and risk tolerance. Users can explore 67 major cities worldwide with detailed information about:

- Cost of living comparisons
- Visa requirements for multiple passports
- Savings runway calculations
- Geopolitical risk indicators
- Paths to permanent residency

## Features

### 🔍 Smart City Search
- **Autocomplete search** with fuzzy matching
- **Approximate matching**: If your exact city isn't in the database, the system suggests nearby or similar cities
- Search by city name, state, or country

### 💰 Cost of Living Analysis
- Compare 67 major cities across 6 continents
- Real-time cost calculations based on your budget
- Shows equivalent budget and monthly savings/costs
- Color-coded visualization:
  - 🟢 **Green**: 40%+ cheaper (high savings potential)
  - 🟠 **Amber**: 10-40% cheaper (moderate savings)
  - ⚪ **Gray**: ±10% (similar cost)
  - 🔴 **Red**: More expensive

### 🛂 Multi-Passport Visa Information
- **Select multiple passports** (perfect for dual/triple citizens)
- Shows visa requirements for each destination
- Categories: Visa-free, Visa-on-arrival, e-Visa, ESTA/eTA, Visa required
- Displays maximum stay duration
- **Path to residency** information for long-term planning
- Covers 20 major passport countries

### 💵 Savings Runway Calculator
- Input your total savings
- Quick presets: $1K, $5K, $10K, $20K, $30K, $50K, $100K, $200K
- Calculates how many months you can live in each city
- Perfect for sabbaticals, career breaks, or digital nomad planning

### ⚠️ Geopolitical Risk Scoring
- Risk scores from 1 (safest) to 10 (highest risk)
- Based on factors including:
  - Political stability
  - Safety and crime rates
  - Economic stability
  - Rule of law
  - Natural disaster exposure
- Visual risk badges: Low, Medium, High

### 📊 Enhanced City Data Cards
- **Organized sections** for easy scanning
- Cost comparison details
- Geopolitical risk assessment
- Comprehensive visa information
- Savings runway display
- Residency path information

## Files

- `cost-of-living-map.html` - Main interactive map application
- `public/cost-of-living-data.json` - Cost of living and risk data for 67 cities
- `public/passport-visa-data.json` - Visa requirements for 20 passport countries × 41 destination countries

## How to Use

### Basic Usage

1. **Open** `cost-of-living-map.html` or visit the hosted version
2. **Search for your home city** using the autocomplete search
3. **Enter your monthly budget** in USD
4. **(Optional) Select your passport(s)** to see visa information
5. **(Optional) Enter your total savings** to see runway calculations
6. **Click "Explore Destinations"** to generate the map
7. **Click on any city marker** to see detailed information

### Example Scenarios

**Scenario 1: Digital Nomad with US Passport**
- Home: New York
- Budget: $4,000/month
- Passport: USA
- Savings: $50,000
- Result: See which cities offer the best value, how long you can stay visa-free, and your runway

**Scenario 2: Dual Citizen Planning Relocation**
- Home: London
- Budget: $6,000/month
- Passports: UK, Colombia
- Savings: $100,000
- Result: Compare visa options, costs, and residency paths

**Scenario 3: Career Break Planning**
- Home: San Francisco
- Budget: $3,000/month
- Savings: $30,000
- Result: Find affordable cities where your savings can last 10+ months

## Data Sources

### Cost of Living Data
Compiled from publicly available indices:
- [Numbeo Cost of Living Index](https://www.numbeo.com/cost-of-living/)
- [AdvisorSmith Cost of Living Index](https://advisorsmith.com/data/coli/)
- [Kaggle Global Cost of Living datasets](https://www.kaggle.com/datasets/mvieira101/global-cost-of-living)

**Baseline**: New York City, NY, USA = 100

### Visa Requirements
Compiled from:
- Official government immigration websites
- IATA Travel Centre
- VisaHQ
- Embassy websites

**⚠️ Important**: Visa policies change frequently. Always verify with official sources before making travel plans.

### Geopolitical Risk
Risk scores based on publicly available data from:
- Global Peace Index
- World Bank Governance Indicators
- Economist Intelligence Unit
- Safety and crime statistics
- Natural disaster data

## Supported Passports

The system includes visa information for holders of these 20 passports:
- **Americas**: USA, Canada, Colombia, Mexico, Brazil, Argentina
- **Europe**: UK, Germany, France, Spain, Italy, Russia
- **Asia-Pacific**: Japan, South Korea, Singapore, China, India, Australia
- **Middle East/Africa**: UAE, South Africa

## Updating the Data

### Adding More Cities

1. Open `public/cost-of-living-data.json`
2. Add a new city object to the `cities` array:

```json
{
  "city": "City Name",
  "state": "State/Province (optional)",
  "country": "Country Name",
  "lat": 40.7128,
  "lon": -74.0060,
  "costOfLivingIndex": 85.5,
  "geopoliticalRisk": 3,
  "searchAliases": ["city name", "city name, country"]
}
```

3. Find coordinates at [LatLong.net](https://www.latlong.net/)
4. Use NYC (100) as cost of living baseline
5. Assign geopolitical risk score (1-10)

### Updating Visa Requirements

1. Open `public/passport-visa-data.json`
2. Navigate to the passport country in `visaRequirements`
3. Add or update country entries:

```json
"CountryName": {
  "visaFree": 90,
  "category": "visa-free",
  "residencyPath": "Work visa, 5 years to permanent residence"
}
```

**Categories**:
- `visa-free`, `visa-on-arrival`, `visa-required`, `e-visa`, `eTA`, `ESTA`, `citizen`

### Updating Geopolitical Risks

Run the Python script to batch update risks:

```python
python3 << 'EOF'
import json

with open('public/cost-of-living-data.json', 'r') as f:
    data = json.load(f)

# Update risk scores
risk_updates = {
    "USA": 3,
    "UK": 2,
    # Add more countries...
}

for city in data['cities']:
    if city['country'] in risk_updates:
        city['geopoliticalRisk'] = risk_updates[city['country']]

with open('public/cost-of-living-data.json', 'w') as f:
    json.dump(data, f, indent=2)
EOF
```

## Technical Details

- **Mapping Library**: Leaflet.js 1.9.4
- **Map Tiles**: OpenStreetMap
- **No Backend Required**: Fully client-side JavaScript
- **Framework**: Vanilla JavaScript (no dependencies beyond Leaflet)
- **Data Format**: JSON
- **Responsive**: Works on desktop, tablet, and mobile

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Advanced Features

### Haversine Distance Calculation
The app includes distance calculation functionality for potential future features like "find cities within X km" or "nearest city matching".

### Fuzzy Search
The autocomplete search supports partial matches, making it easy to find cities even with incomplete information.

### Multiple Data Overlays
Users can combine multiple data points:
- Cost + Visa + Runway
- Cost + Risk
- Visa + Risk + Runway

## Future Enhancements

Potential improvements:

- [ ] Add 200+ more cities
- [ ] Include more passport countries (150+ total)
- [ ] Add climate/weather data
- [ ] Show internet speed (important for digital nomads)
- [ ] Add healthcare quality indicators
- [ ] Include expat community size
- [ ] Show flight connectivity
- [ ] Add language information
- [ ] Crime statistics by city
- [ ] Quality of life metrics
- [ ] Export results to PDF
- [ ] Save and share configurations
- [ ] Add filtering (hide cities by risk, visa status, etc.)
- [ ] Integration with live APIs for real-time data
- [ ] Add historical cost trends
- [ ] Currency conversion options
- [ ] Tax implications calculator
- [ ] Remote work visa programs (e.g., Portugal D7, Spain Digital Nomad visa)

## Use Cases

This tool is perfect for:

- 🌴 **Digital nomads** planning their next destination
- 💼 **Remote workers** considering relocation
- 🎓 **Students** exploring study abroad options
- 👴 **Retirees** looking for affordable retirement destinations
- 🚀 **Entrepreneurs** scouting business locations
- ✈️ **Travelers** on extended trips or sabbaticals
- 🏡 **Expats** researching potential moves
- 📊 **Researchers** analyzing global cost of living patterns

## Disclaimers

⚠️ **Important Notes**:

1. **Visa Information**: Visa requirements change frequently. Always verify with official government sources before making travel plans.

2. **Cost of Living**: Costs can vary significantly within cities and depend on lifestyle. Use these figures as general guidelines.

3. **Geopolitical Risk**: Risk assessments are subjective and can change rapidly. Do your own research and consult current travel advisories.

4. **Residency Paths**: Immigration laws are complex and subject to change. Consult with immigration lawyers for specific advice.

5. **Data Freshness**: Data is current as of January 2026. Check for updates regularly.

## Contributing

To contribute more cities, update visa information, or suggest improvements:

1. Fork the repository
2. Update the JSON data files
3. Test the changes locally
4. Submit a pull request with a description of changes

## License

Data compiled from public sources. Please review individual data source licenses for commercial use.

Cost of living data: Free to use with attribution
Visa data: Compiled from public government sources
Geopolitical risk: Based on publicly available indices

## Contact

For questions, suggestions, or data corrections, please contact:
- Email: hello@dnfisher.co
- Website: https://dnfisher.co

## Changelog

### Version 2.0 (January 2026)
- ✨ Added multi-passport visa requirements
- ✨ Added savings runway calculator
- ✨ Added geopolitical risk scoring
- ✨ Redesigned city data cards
- ✨ Added smart city search with autocomplete
- ✨ Enhanced popup interface with organized sections
- 📊 Expanded to 67 cities
- 🛂 Added support for 20 passport countries

### Version 1.0 (January 2026)
- 🎉 Initial release
- 🗺️ Interactive map with 67 cities
- 💰 Basic cost of living comparison
- 📱 Mobile responsive design

---

**Last Updated**: January 2026
**Cities**: 67
**Passport Countries**: 20
**Destination Countries**: 41
