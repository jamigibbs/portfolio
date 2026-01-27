#!/usr/bin/env python3
"""
Fetch visa requirement data from RapidAPI Visa Requirement API
and convert it to our JSON format for the 67 cities in our map.
"""

import requests
import json
import time
from typing import Dict, List

# RapidAPI Configuration
RAPIDAPI_KEY = "2742336cd3msh55a5ee1c51ed74bp1f23b9jsn1e3bc3864364"
RAPIDAPI_HOST = "visa-requirement.p.rapidapi.com"
API_ENDPOINT = f"https://{RAPIDAPI_HOST}/v2/visa/check"

# Countries for our 67 cities
CITY_COUNTRIES = {
    "USA", "United Kingdom", "Canada", "France", "Germany", "Spain", "Portugal",
    "Italy", "Netherlands", "Switzerland", "Ireland", "Czech Republic", "Hungary",
    "Poland", "Sweden", "Denmark", "Norway", "Greece", "Austria", "Belgium",
    "Australia", "New Zealand", "Japan", "South Korea", "Singapore", "Mexico",
    "Colombia", "Brazil", "Argentina", "Chile", "Peru", "Costa Rica", "Panama",
    "Ecuador", "Uruguay", "Thailand", "Vietnam", "Indonesia", "Malaysia",
    "Philippines", "India", "China", "UAE", "Turkey", "South Africa", "Morocco",
    "Egypt", "Kenya", "Israel", "Georgia"
}

# Major passports to prioritize
MAJOR_PASSPORTS = [
    "USA", "United Kingdom", "Germany", "Canada", "Australia", "Japan",
    "France", "Spain", "Italy", "Netherlands", "Singapore", "South Korea",
    "New Zealand", "Ireland", "Sweden", "Norway", "Switzerland", "Denmark"
]

def call_visa_api(passport_country: str, destination_country: str) -> Dict:
    """Call the RapidAPI Visa Requirement API"""

    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
        "Content-Type": "application/json"
    }

    payload = {
        "passport": passport_country,
        "destination": destination_country
    }

    try:
        response = requests.post(API_ENDPOINT, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling API for {passport_country} -> {destination_country}: {e}")
        return None

def convert_to_our_format(api_response: Dict) -> Dict:
    """Convert API response to our JSON format"""

    if not api_response:
        return None

    # Extract visa information from API response
    visa_type = api_response.get("visaType", "visa-required")
    duration_days = api_response.get("durationDays", 0)

    # Map API visa types to our categories
    category_mapping = {
        "visa-free": "visa-free",
        "visa on arrival": "visa-on-arrival",
        "evisa": "e-visa",
        "e-visa": "e-visa",
        "eta": "eTA",
        "visa required": "visa-required",
        "no admission": "no-admission"
    }

    category = category_mapping.get(visa_type.lower(), "visa-required")

    result = {
        "visaFree": duration_days,
        "category": category
    }

    return result

def main():
    print("Fetching visa data from RapidAPI...")
    print(f"Processing {len(MAJOR_PASSPORTS)} passports × {len(CITY_COUNTRIES)} destinations")
    print("=" * 60)

    # Load existing data
    with open('../public/passport-visa-data.json', 'r') as f:
        existing_data = json.load(f)

    visa_requirements = existing_data.get("visaRequirements", {})

    # Fetch data for each major passport
    for passport in MAJOR_PASSPORTS:
        print(f"\nProcessing passport: {passport}")

        if passport not in visa_requirements:
            visa_requirements[passport] = {}

        # Add self-citizenship
        visa_requirements[passport][passport] = {
            "visaFree": 0,
            "category": "citizen"
        }

        # Fetch visa requirements for each destination
        for destination in CITY_COUNTRIES:
            if destination == passport:
                continue

            print(f"  → {destination}...", end=" ")

            # Call API
            api_response = call_visa_api(passport, destination)

            if api_response:
                visa_info = convert_to_our_format(api_response)
                if visa_info:
                    visa_requirements[passport][destination] = visa_info
                    print(f"✓ {visa_info['category']} ({visa_info['visaFree']} days)")
                else:
                    print("✗ Failed to convert")
            else:
                print("✗ API error")

            # Rate limiting: 1 request per second
            time.sleep(1)

    # Update the JSON structure
    existing_data["visaRequirements"] = visa_requirements
    existing_data["metadata"]["lastUpdated"] = "2026-01"
    existing_data["metadata"]["dataSource"] = "RapidAPI Visa Requirement API"

    # Save to file
    output_file = '../public/passport-visa-data.json'
    with open(output_file, 'w') as f:
        json.dump(existing_data, f, indent=2)

    print("\n" + "=" * 60)
    print(f"✅ Data saved to {output_file}")
    print(f"✅ Processed {len(MAJOR_PASSPORTS)} passports with {len(CITY_COUNTRIES)} destinations each")
    print(f"✅ Total API calls: {len(MAJOR_PASSPORTS) * (len(CITY_COUNTRIES) - 1)}")

if __name__ == '__main__':
    main()
