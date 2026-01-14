# Cost of Living Data Expansion Guide

This guide explains how to expand the city coverage for your Cost of Living Explorer from 67 cities to 200+ cities using a **3-tier approach**.

## 🎯 The 3-Tier Approach

### Tier 1: Top 200 Major Cities (Direct Data)
Cities with complete cost of living data in your database.

### Tier 2: Nearest City Fallback (Automated)
When a user searches for a city not in your database, the app automatically finds and displays the nearest city with data.

### Tier 3: Country-Level Estimates (Future Enhancement)
Provide approximate cost estimates based on country averages when no nearby city data exists.

---

## 📊 Current Status

- **Current cities**: 67
- **Target cities**: 200+
- **Coverage improvement**: 3x more cities

---

## 🚀 Quick Start: Expand Your Dataset

### Option 1: Use the Python Scraper Template (Recommended)

This creates a template with 200 cities, pre-filled with coordinates and geopolitical risk scores. You just need to add the cost of living indices from Numbeo.

```bash
cd scripts
python3 scrape_numbeo.py --output cost-of-living-data-expanded.json
```

**What it does:**
- ✅ Generates JSON template for 200 major cities worldwide
- ✅ Auto-geocodes cities using OpenStreetMap (free)
- ✅ Estimates geopolitical risk scores
- ✅ Creates proper search aliases
- ⚠️ **You need to manually fill in `costOfLivingIndex` values from Numbeo**

**Next steps:**
1. Open the generated JSON file
2. Visit [Numbeo City Rankings](https://www.numbeo.com/cost-of-living/rankings.jsp)
3. For each city marked with `costOfLivingIndex: 0.0`, look up the value on Numbeo
4. Fill in the cost of living index (NYC = 100 baseline)
5. Remove any `_NEEDS_COORDINATES: true` flags after fixing coordinates

### Option 2: Manual CSV Entry

If you prefer working in Excel/Google Sheets:

```bash
# Create CSV template
python3 csv_to_json.py --create-template cities-template.csv

# Edit cities-template.csv in Excel/Google Sheets

# Convert to JSON
python3 csv_to_json.py --input cities-template.csv --output ../public/cost-of-living-data-new.json

# Merge with existing data
python3 csv_to_json.py --input cities-template.csv --merge ../public/cost-of-living-data.json --output ../public/cost-of-living-data-merged.json
```

**CSV Format:**
```csv
city,state,country,lat,lon,costOfLivingIndex,geopoliticalRisk
Tokyo,,Japan,35.6762,139.6503,88.5,2
London,,United Kingdom,51.5074,-0.1278,95.2,3
Austin,TX,USA,30.2672,-97.7431,78.4,3
```

---

## 🔧 How the Nearest City Fallback Works

The JavaScript now includes **automatic nearest-city matching**. When a user searches for a city that's not in your database:

1. **Geocodes** the search term using OpenStreetMap (free)
2. **Calculates distances** to all cities in your database using Haversine formula
3. **Suggests the nearest city** with available data
4. **Shows a warning** indicating the data is from a nearby city

**Example:**
- User searches: "Boulder, Colorado"
- Not in database ❌
- App suggests: "Denver, CO, USA (~40 km away)"
- User accepts and sees cost comparison based on Denver data
- Warning displayed: "⚠️ Using Denver as nearest available data point (40 km from your search)"

This gives you **effective coverage for thousands of cities** even with only 200 data points!

---

## 📍 Where to Get Cost of Living Data

### Primary Source: Numbeo (500+ cities)

Visit [Numbeo City Rankings](https://www.numbeo.com/cost-of-living/rankings.jsp)

**How to use:**
1. Search for your city
2. Find the "Cost of Living Index" value
3. Copy the number (NYC baseline = 100)
4. Add to your JSON/CSV

**Example Numbeo indices:**
- Zurich, Switzerland: 122.4 (22.4% more expensive than NYC)
- Bangkok, Thailand: 42.3 (57.7% cheaper than NYC)
- Lisbon, Portugal: 52.7 (47.3% cheaper than NYC)

### Alternative Sources

- **Expatistan**: https://www.expatistan.com/cost-of-living
- **Teleport Cities API** (if available): Developer-friendly but may be discontinued
- **Your own research**: Local websites, expat forums, Reddit

### Converting Non-NYC Baselines

If a source uses a different baseline city:

```
NYC_Index = (City_Index / Baseline_City_Index) × 100
```

Example: Source uses London = 100, shows Berlin = 75
```
If London's NYC index = 95.2:
Berlin NYC index = (75 / 100) × 95.2 = 71.4
```

---

## 🗺️ Recommended City List (200 Cities)

The scraper includes these regions:

- **North America**: 30 cities (USA, Canada, Mexico)
- **South America**: 25 cities (Brazil, Argentina, Colombia, Chile, etc.)
- **Europe**: 45 cities (UK, France, Germany, Spain, Italy, etc.)
- **Asia**: 50 cities (Japan, Singapore, Thailand, Vietnam, India, etc.)
- **Africa**: 15 cities (South Africa, Egypt, Kenya, Morocco, etc.)
- **Oceania**: 15 cities (Australia, New Zealand)
- **Central America & Caribbean**: 20 cities (Costa Rica, Panama, Jamaica, etc.)

This provides excellent global coverage for digital nomads and remote workers.

---

## 🧪 Testing Your Expanded Dataset

After expanding your data:

1. **Validate JSON syntax:**
   ```bash
   python3 -m json.tool ../public/cost-of-living-data-new.json > /dev/null
   ```

2. **Check city count:**
   ```bash
   grep -c '"city":' ../public/cost-of-living-data-new.json
   ```

3. **Test in browser:**
   - Replace `cost-of-living-data.json` with your new file
   - Search for various cities
   - Verify nearest-city fallback works for unlisted cities
   - Check that all markers appear on the map

---

## 📝 Data Fields Explained

```json
{
  "city": "Tokyo",              // City name
  "state": "CA",                // Optional: US state or province
  "country": "Japan",           // Country name
  "lat": 35.6762,               // Latitude (decimal degrees)
  "lon": 139.6503,              // Longitude (decimal degrees)
  "costOfLivingIndex": 88.5,    // NYC = 100 baseline
  "geopoliticalRisk": 2,        // 1 (safest) to 10 (highest risk)
  "searchAliases": [            // Search variations
    "tokyo",
    "tokyo, japan"
  ]
}
```

### Geopolitical Risk Scoring

- **1-2**: Very safe (Switzerland, Norway, Singapore, Japan)
- **3-4**: Safe (USA, Canada, UK, Germany, Australia)
- **5-6**: Moderate (Mexico, Thailand, Turkey, South Africa)
- **7-8**: Elevated (Egypt, Kenya, some Latin American cities)
- **9-10**: High (Active conflict zones, unstable regions)

Sources for risk assessment:
- [Global Peace Index](https://www.visionofhumanity.org/maps/)
- [World Risk Map](https://www.dkv.global/world-risk-map)
- US State Department Travel Advisories

---

## 🔄 Keeping Data Updated

Cost of living data changes over time. Recommended update schedule:

- **Major cities**: Every 6 months
- **Smaller cities**: Annually
- **Geopolitical risk**: Quarterly (events can change quickly)

Automated update options (future enhancement):
- Use unofficial Numbeo APIs (legal gray area)
- Subscribe to Numbeo's official API (paid)
- Community-sourced updates from users

---

## 💡 Tips for Data Collection

1. **Start with top 100 cities**: Focus on major global destinations first
2. **Batch process**: Group cities by region to speed up data entry
3. **Cross-reference**: Check multiple sources for accuracy
4. **Document sources**: Keep track of where each value came from
5. **Use recent data**: Prefer data from the last 6 months
6. **Round appropriately**: Use 1 decimal place for cost indices

---

## 🆘 Troubleshooting

### "City coordinates are (0, 0)"

The geocoder couldn't find the city. Solutions:
- Manually look up coordinates on Google Maps
- Try different city name spelling
- Use Wikipedia (has coordinates for most cities)

### "Cost of living index is 0.0"

You need to fill this in manually from Numbeo or another source.

### "Nearest city fallback not working"

Check that:
- OpenStreetMap API is accessible (not blocked by firewall)
- City names are spelled correctly
- At least one city in the database is within reasonable distance

### "Too many API requests"

The geocoder has rate limits:
- Add delays between requests (scraper does this automatically)
- Process cities in smaller batches
- Use cached coordinates when possible

---

## 📚 Additional Resources

- **Numbeo**: https://www.numbeo.com/cost-of-living/
- **OpenStreetMap Nominatim**: https://nominatim.org/
- **GeoNames**: http://www.geonames.org/
- **Global Peace Index**: https://www.visionofhumanity.org/

---

## 🎉 What's Next?

Once you've expanded to 200+ cities:

1. **Test thoroughly** with various search terms
2. **Update your PR** to GitHub Pages
3. **Monitor user feedback** for missing cities
4. **Consider adding**:
   - Country-level estimates (Tier 3)
   - User-submitted city data
   - Historical trend data
   - Cost breakdowns (housing, food, transport separately)

---

Need help? Check the existing data format in `public/cost-of-living-data.json` for examples!
