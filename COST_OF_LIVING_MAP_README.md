# Cost of Living Comparison Map

An interactive web-based map that allows users to compare the cost of living across major cities worldwide.

## Overview

This tool helps people understand where they can live for less (or more) based on their current city and monthly budget. Users select their home city, enter their monthly budget, and the map displays all cities color-coded by relative cost of living.

## Features

- **Interactive Map**: Built with Leaflet.js for smooth, responsive mapping
- **67 Major Cities**: Covers cities across North America, Europe, Asia, South America, Africa, and Oceania
- **Cost Comparison**: Shows percentage difference and equivalent budget for each city
- **Color-Coded Markers**:
  - 🟢 Green: 40%+ cheaper (high savings)
  - 🟠 Amber: 10-40% cheaper (moderate savings)
  - ⚪ Gray: ±10% (similar cost)
  - 🔴 Red: More expensive
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Files

- `cost-of-living-map.html` - The main interactive map page
- `public/cost-of-living-data.json` - Cost of living data for 67 cities worldwide

## How to Use

1. Open `cost-of-living-map.html` in your browser or visit the hosted version
2. Select your home city from the dropdown
3. Enter your monthly budget in USD
4. Click "Calculate" to see the comparison map
5. Click on any city marker to see detailed cost information

## Data Sources

The current dataset is compiled from publicly available cost of living indices from:

- [Numbeo Cost of Living Index](https://www.numbeo.com/cost-of-living/)
- [AdvisorSmith Cost of Living Index](https://advisorsmith.com/data/coli/)
- [Kaggle Global Cost of Living datasets](https://www.kaggle.com/datasets/mvieira101/global-cost-of-living)

**Baseline**: New York City, NY, USA = 100

## Updating the Data

### Option 1: Download from Kaggle

1. Visit [Kaggle's Global Cost of Living dataset](https://www.kaggle.com/datasets/mvieira101/global-cost-of-living)
2. Download the CSV file
3. Convert to JSON format matching the structure in `public/cost-of-living-data.json`
4. Update the file

### Option 2: Use Numbeo API (Paid)

1. Contact Numbeo at api@numbeo.com for API access
2. Use their API to fetch live data
3. Update the JSON file with the latest data

### Option 3: Manual Updates

Edit `public/cost-of-living-data.json` directly. Each city entry should have:

```json
{
  "city": "City Name",
  "state": "State/Province (optional)",
  "country": "Country Name",
  "lat": 40.7128,
  "lon": -74.0060,
  "costOfLivingIndex": 100.0
}
```

## Data Structure

```json
{
  "metadata": {
    "description": "Cost of Living Index data for major cities worldwide",
    "baseline": "New York City, NY, USA = 100",
    "lastUpdated": "2026-01"
  },
  "cities": [
    {
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "lat": 40.7128,
      "lon": -74.0060,
      "costOfLivingIndex": 100.0
    }
  ]
}
```

## Adding More Cities

To add more cities:

1. Open `public/cost-of-living-data.json`
2. Add a new city object to the `cities` array
3. Ensure you have:
   - City name
   - Country name
   - Latitude and longitude (use [LatLong.net](https://www.latlong.net/))
   - Cost of living index relative to NYC (100)
4. Save the file

## Technical Details

- **Mapping Library**: Leaflet.js 1.9.4
- **Map Tiles**: OpenStreetMap
- **No Backend Required**: Fully client-side JavaScript
- **Framework**: Vanilla JavaScript (no dependencies beyond Leaflet)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential improvements for the future:

- [ ] Add city search/autocomplete
- [ ] Include more cities (500+)
- [ ] Add filters (by region, country, cost range)
- [ ] Show additional metrics (safety, quality of life, weather)
- [ ] Add comparison between multiple home cities
- [ ] Export results to PDF or CSV
- [ ] Integration with live Numbeo API
- [ ] Add historical cost trends
- [ ] Currency conversion options

## License

Data compiled from public sources. Please review individual data source licenses for commercial use.

## Contact

For questions or suggestions, please contact David Fisher at hello@dnfisher.co

---

**Last Updated**: January 2026
