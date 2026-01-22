# Comprehensive Visa Data Guide

## Current Status

✅ **Added all 195+ countries to passport selector**
⚠️ **Visa requirements data is PARTIAL** - Only ~50 destination countries for USA passport

## The Challenge

Creating comprehensive visa data requires:
- **195 passports** × **195 destinations** = **38,025 data points**
- Each data point needs: visa-free days, category, residency path
- Visa policies change frequently
- Research time: ~2-5 minutes per combination = **1,266-3,169 hours of work**

## Recommended Solutions

### Option 1: Use VisaList.io API (Recommended)
```
Service: VisaList.io
Coverage: 199 countries/territories
Cost: Free tier available
API: https://visalist.io/
```

**Example Integration:**
```javascript
async function loadVisaDataFromAPI() {
    const response = await fetch('https://api.visalist.io/visa-requirements');
    const data = await response.json();
    // Transform to our format
    return transformVisaData(data);
}
```

### Option 2: Passport Index Database
```
Service: Passport Index
Coverage: 199 passports
Data: Passport power rankings
URL: https://www.passportindex.org/
```

Free to scrape (check their ToS) or contact for data access.

### Option 3: IATA Travel Centre
```
Service: IATA Timatic
Coverage: Official airline database
Cost: Paid subscription
Accuracy: Highest (used by airlines)
URL: https://www.iatatravelcentre.com/
```

### Option 4: Manual Entry with Henley Passport Index
```
Use Henley Passport Index rankings:
1. Visit https://www.henleypassportindex.com/
2. Check visa-free access for each passport
3. Fill in our JSON structure

Top 10 most powerful passports (2026):
1. Singapore (195 visa-free destinations)
2. Japan, South Korea, Germany (192)
3. Finland, Italy, Spain (190)
4. Austria, Denmark, Netherlands (189)
5. France, Ireland, Portugal, Sweden (188)
...
```

## Data Structure

Our format:
```json
{
  "visaRequirements": {
    "PassportCountry": {
      "DestinationCountry": {
        "visaFree": 90,  // Days allowed
        "category": "visa-free",  // or "visa-on-arrival", "e-visa", "visa-required", "citizen"
        "residencyPath": "Work permit, 5 years to PR"  // Optional
      }
    }
  }
}
```

### Visa Categories:
- **visa-free**: No visa needed, get stamped at border
- **visa-on-arrival**: Pay fee at border, get visa immediately
- **e-visa**: Apply online before travel, approved electronically
- **eTA/ESTA**: Electronic travel authorization (for visa-free countries)
- **visa-required**: Must apply at embassy/consulate before travel
- **citizen**: Passport holder is a citizen (0 days limit)

## Quick Start: Top 50 Passports

If full coverage is overwhelming, start with the 50 most powerful passports:

1. **Schengen Area** (visa-free travel between 27 EU countries)
2. **Five Eyes** (USA, UK, Canada, Australia, NZ)
3. **Major Asian** (Japan, South Korea, Singapore, Taiwan, Hong Kong)
4. **Latin America** (Chile, Brazil, Argentina, Mexico)
5. **Gulf States** (UAE, Qatar, Kuwait, Bahrain)

## Automation Script Template

```python
import requests
import json

def fetch_visa_data():
    """
    Fetch visa requirements from external API
    and convert to our format
    """

    countries = [all_195_countries]
    visa_data = {}

    for passport in countries:
        visa_data[passport] = {}
        for destination in countries:
            # Call external API
            req_data = get_visa_requirement(passport, destination)

            visa_data[passport][destination] = {
                "visaFree": req_data['days'],
                "category": req_data['type'],
                "residencyPath": req_data.get('residency', '')
            }

    # Save to JSON
    with open('passport-visa-data.json', 'w') as f:
        json.dump(visa_data, f, indent=2)
```

## What I've Done So Far

✅ Added all 195 countries to the passport selector
✅ Working search function (supports abbreviations like "UK" → "United Kingdom")
✅ Blue checkmark UI for selecting multiple passports
✅ Template structure for visa data
✅ Sample data for USA passport → 50 destinations

## Next Steps

Choose one of these paths:

### Path A: External API (Fastest)
1. Sign up for VisaList.io or similar
2. Write integration script
3. Transform their format to ours
4. Update `passport-visa-data.json`
5. **Time: 1-2 days**

### Path B: Manual Top 50 (Most Accurate)
1. Focus on 50 most common passports
2. Use Henley Index + official embassy sites
3. Fill in ~2,500 combinations
4. **Time: 1-2 weeks**

### Path C: Hybrid (Recommended)
1. Use API for basic visa-free/required status
2. Manually add residency paths for top destinations
3. Best of both worlds
4. **Time: 3-5 days**

### Path D: Keep Current (Pragmatic)
1. Keep 195 passports for selection
2. Only show visa data where available
3. Add message: "Visa data not available for this passport combination"
4. Gradually fill in popular routes
5. **Time: Ongoing**

## Implementation for Path D (Recommended)

Update the JavaScript to handle missing data:

```javascript
function getVisaInfo(city) {
    if (selectedPassports.size === 0) return null;

    const visaInfoList = [];
    selectedPassports.forEach(passport => {
        const passportData = visaData.visaRequirements?.[passport];

        if (!passportData) {
            // No data for this passport
            visaInfoList.push({
                passport: passport,
                category: 'data-unavailable',
                message: 'Visa data not available'
            });
            return;
        }

        const countryVisa = passportData[city.country];
        if (countryVisa) {
            visaInfoList.push({
                passport: passport,
                ...countryVisa
            });
        } else {
            // No data for this destination
            visaInfoList.push({
                passport: passport,
                category: 'data-unavailable',
                message: `Visa requirements not available for ${city.country}`
            });
        }
    });

    return visaInfoList;
}
```

## Resources

- **Henley Passport Index**: https://www.henleypassportindex.com/
- **VisaList.io API**: https://visalist.io/
- **Passport Index**: https://www.passportindex.org/
- **IATA Timatic**: https://www.iatatravelcentre.com/
- **Wikipedia Visa Policies**: https://en.wikipedia.org/wiki/Visa_policy_of_[country]

## My Recommendation

**Start with Path D (Keep Current):**
1. You now have all 195 countries in the selector ✅
2. Search works great ✅
3. Show visa data where available
4. Add disclaimer: "Check official sources before travel"
5. Users can still use the tool effectively
6. Gradually expand coverage based on popular passport combinations

This gives you a working, useful tool TODAY, with a path to improvement over time.
