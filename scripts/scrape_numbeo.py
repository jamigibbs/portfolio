#!/usr/bin/env python3
"""
Numbeo Cost of Living Data Scraper

This script helps collect cost of living data from Numbeo.
Please use responsibly and respect Numbeo's terms of service.
Add delays between requests and consider manual data collection for large datasets.

Usage:
    python scrape_numbeo.py --output ../public/cost-of-living-data-expanded.json
"""

import requests
import json
import time
import argparse
from typing import List, Dict
from datetime import datetime

class NumbeoCityScraper:
    """Scraper for Numbeo cost of living data"""

    def __init__(self, delay: float = 2.0):
        self.delay = delay
        self.base_url = "https://www.numbeo.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def get_city_list(self) -> List[str]:
        """
        Returns a curated list of top 200 major cities worldwide.
        This avoids scraping and provides coverage for major global destinations.
        """
        cities = [
            # North America (30 cities)
            {"city": "New York", "country": "USA", "state": "NY"},
            {"city": "San Francisco", "country": "USA", "state": "CA"},
            {"city": "Los Angeles", "country": "USA", "state": "CA"},
            {"city": "Chicago", "country": "USA", "state": "IL"},
            {"city": "Boston", "country": "USA", "state": "MA"},
            {"city": "Seattle", "country": "USA", "state": "WA"},
            {"city": "Washington", "country": "USA", "state": "DC"},
            {"city": "Miami", "country": "USA", "state": "FL"},
            {"city": "Austin", "country": "USA", "state": "TX"},
            {"city": "Denver", "country": "USA", "state": "CO"},
            {"city": "Portland", "country": "USA", "state": "OR"},
            {"city": "San Diego", "country": "USA", "state": "CA"},
            {"city": "Philadelphia", "country": "USA", "state": "PA"},
            {"city": "Atlanta", "country": "USA", "state": "GA"},
            {"city": "Dallas", "country": "USA", "state": "TX"},
            {"city": "Houston", "country": "USA", "state": "TX"},
            {"city": "Phoenix", "country": "USA", "state": "AZ"},
            {"city": "Las Vegas", "country": "USA", "state": "NV"},
            {"city": "Toronto", "country": "Canada"},
            {"city": "Vancouver", "country": "Canada"},
            {"city": "Montreal", "country": "Canada"},
            {"city": "Calgary", "country": "Canada"},
            {"city": "Ottawa", "country": "Canada"},
            {"city": "Mexico City", "country": "Mexico"},
            {"city": "Guadalajara", "country": "Mexico"},
            {"city": "Monterrey", "country": "Mexico"},
            {"city": "Cancun", "country": "Mexico"},
            {"city": "Playa del Carmen", "country": "Mexico"},
            {"city": "Puerto Vallarta", "country": "Mexico"},
            {"city": "Tijuana", "country": "Mexico"},

            # South America (25 cities)
            {"city": "São Paulo", "country": "Brazil"},
            {"city": "Rio de Janeiro", "country": "Brazil"},
            {"city": "Buenos Aires", "country": "Argentina"},
            {"city": "Santiago", "country": "Chile"},
            {"city": "Lima", "country": "Peru"},
            {"city": "Bogotá", "country": "Colombia"},
            {"city": "Medellín", "country": "Colombia"},
            {"city": "Cartagena", "country": "Colombia"},
            {"city": "Cali", "country": "Colombia"},
            {"city": "Quito", "country": "Ecuador"},
            {"city": "Guayaquil", "country": "Ecuador"},
            {"city": "Caracas", "country": "Venezuela"},
            {"city": "Montevideo", "country": "Uruguay"},
            {"city": "Asunción", "country": "Paraguay"},
            {"city": "La Paz", "country": "Bolivia"},
            {"city": "Santa Cruz", "country": "Bolivia"},
            {"city": "Cusco", "country": "Peru"},
            {"city": "Arequipa", "country": "Peru"},
            {"city": "Brasília", "country": "Brazil"},
            {"city": "Salvador", "country": "Brazil"},
            {"city": "Fortaleza", "country": "Brazil"},
            {"city": "Curitiba", "country": "Brazil"},
            {"city": "Córdoba", "country": "Argentina"},
            {"city": "Rosario", "country": "Argentina"},
            {"city": "Valparaíso", "country": "Chile"},

            # Europe (45 cities)
            {"city": "London", "country": "United Kingdom"},
            {"city": "Paris", "country": "France"},
            {"city": "Berlin", "country": "Germany"},
            {"city": "Madrid", "country": "Spain"},
            {"city": "Barcelona", "country": "Spain"},
            {"city": "Rome", "country": "Italy"},
            {"city": "Milan", "country": "Italy"},
            {"city": "Amsterdam", "country": "Netherlands"},
            {"city": "Vienna", "country": "Austria"},
            {"city": "Brussels", "country": "Belgium"},
            {"city": "Munich", "country": "Germany"},
            {"city": "Hamburg", "country": "Germany"},
            {"city": "Frankfurt", "country": "Germany"},
            {"city": "Zurich", "country": "Switzerland"},
            {"city": "Geneva", "country": "Switzerland"},
            {"city": "Dublin", "country": "Ireland"},
            {"city": "Copenhagen", "country": "Denmark"},
            {"city": "Stockholm", "country": "Sweden"},
            {"city": "Oslo", "country": "Norway"},
            {"city": "Helsinki", "country": "Finland"},
            {"city": "Prague", "country": "Czech Republic"},
            {"city": "Warsaw", "country": "Poland"},
            {"city": "Budapest", "country": "Hungary"},
            {"city": "Lisbon", "country": "Portugal"},
            {"city": "Porto", "country": "Portugal"},
            {"city": "Athens", "country": "Greece"},
            {"city": "Valencia", "country": "Spain"},
            {"city": "Seville", "country": "Spain"},
            {"city": "Lyon", "country": "France"},
            {"city": "Marseille", "country": "France"},
            {"city": "Nice", "country": "France"},
            {"city": "Edinburgh", "country": "United Kingdom"},
            {"city": "Manchester", "country": "United Kingdom"},
            {"city": "Glasgow", "country": "United Kingdom"},
            {"city": "Birmingham", "country": "United Kingdom"},
            {"city": "Naples", "country": "Italy"},
            {"city": "Florence", "country": "Italy"},
            {"city": "Venice", "country": "Italy"},
            {"city": "Bologna", "country": "Italy"},
            {"city": "Cologne", "country": "Germany"},
            {"city": "Rotterdam", "country": "Netherlands"},
            {"city": "Krakow", "country": "Poland"},
            {"city": "Bucharest", "country": "Romania"},
            {"city": "Sofia", "country": "Bulgaria"},
            {"city": "Belgrade", "country": "Serbia"},

            # Asia (50 cities)
            {"city": "Tokyo", "country": "Japan"},
            {"city": "Singapore", "country": "Singapore"},
            {"city": "Hong Kong", "country": "Hong Kong"},
            {"city": "Seoul", "country": "South Korea"},
            {"city": "Shanghai", "country": "China"},
            {"city": "Beijing", "country": "China"},
            {"city": "Bangkok", "country": "Thailand"},
            {"city": "Dubai", "country": "United Arab Emirates"},
            {"city": "Mumbai", "country": "India"},
            {"city": "Delhi", "country": "India"},
            {"city": "Bangalore", "country": "India"},
            {"city": "Kuala Lumpur", "country": "Malaysia"},
            {"city": "Manila", "country": "Philippines"},
            {"city": "Jakarta", "country": "Indonesia"},
            {"city": "Ho Chi Minh City", "country": "Vietnam"},
            {"city": "Hanoi", "country": "Vietnam"},
            {"city": "Taipei", "country": "Taiwan"},
            {"city": "Osaka", "country": "Japan"},
            {"city": "Kyoto", "country": "Japan"},
            {"city": "Chiang Mai", "country": "Thailand"},
            {"city": "Phuket", "country": "Thailand"},
            {"city": "Bali", "country": "Indonesia"},
            {"city": "Penang", "country": "Malaysia"},
            {"city": "Colombo", "country": "Sri Lanka"},
            {"city": "Kathmandu", "country": "Nepal"},
            {"city": "Tel Aviv", "country": "Israel"},
            {"city": "Jerusalem", "country": "Israel"},
            {"city": "Istanbul", "country": "Turkey"},
            {"city": "Ankara", "country": "Turkey"},
            {"city": "Abu Dhabi", "country": "United Arab Emirates"},
            {"city": "Doha", "country": "Qatar"},
            {"city": "Riyadh", "country": "Saudi Arabia"},
            {"city": "Jeddah", "country": "Saudi Arabia"},
            {"city": "Muscat", "country": "Oman"},
            {"city": "Tbilisi", "country": "Georgia"},
            {"city": "Yerevan", "country": "Armenia"},
            {"city": "Baku", "country": "Azerbaijan"},
            {"city": "Almaty", "country": "Kazakhstan"},
            {"city": "Tashkent", "country": "Uzbekistan"},
            {"city": "Shenzhen", "country": "China"},
            {"city": "Guangzhou", "country": "China"},
            {"city": "Chengdu", "country": "China"},
            {"city": "Xi'an", "country": "China"},
            {"city": "Busan", "country": "South Korea"},
            {"city": "Cebu", "country": "Philippines"},
            {"city": "Hyderabad", "country": "India"},
            {"city": "Chennai", "country": "India"},
            {"city": "Pune", "country": "India"},
            {"city": "Goa", "country": "India"},
            {"city": "Jaipur", "country": "India"},

            # Africa (15 cities)
            {"city": "Cape Town", "country": "South Africa"},
            {"city": "Johannesburg", "country": "South Africa"},
            {"city": "Cairo", "country": "Egypt"},
            {"city": "Nairobi", "country": "Kenya"},
            {"city": "Lagos", "country": "Nigeria"},
            {"city": "Accra", "country": "Ghana"},
            {"city": "Casablanca", "country": "Morocco"},
            {"city": "Marrakech", "country": "Morocco"},
            {"city": "Tunis", "country": "Tunisia"},
            {"city": "Addis Ababa", "country": "Ethiopia"},
            {"city": "Dar es Salaam", "country": "Tanzania"},
            {"city": "Kampala", "country": "Uganda"},
            {"city": "Kigali", "country": "Rwanda"},
            {"city": "Dakar", "country": "Senegal"},
            {"city": "Algiers", "country": "Algeria"},

            # Oceania (15 cities)
            {"city": "Sydney", "country": "Australia"},
            {"city": "Melbourne", "country": "Australia"},
            {"city": "Brisbane", "country": "Australia"},
            {"city": "Perth", "country": "Australia"},
            {"city": "Adelaide", "country": "Australia"},
            {"city": "Auckland", "country": "New Zealand"},
            {"city": "Wellington", "country": "New Zealand"},
            {"city": "Christchurch", "country": "New Zealand"},
            {"city": "Gold Coast", "country": "Australia"},
            {"city": "Canberra", "country": "Australia"},
            {"city": "Hobart", "country": "Australia"},
            {"city": "Darwin", "country": "Australia"},
            {"city": "Queenstown", "country": "New Zealand"},
            {"city": "Suva", "country": "Fiji"},
            {"city": "Port Moresby", "country": "Papua New Guinea"},

            # Central America & Caribbean (20 cities)
            {"city": "Panama City", "country": "Panama"},
            {"city": "San José", "country": "Costa Rica"},
            {"city": "Guatemala City", "country": "Guatemala"},
            {"city": "San Salvador", "country": "El Salvador"},
            {"city": "Managua", "country": "Nicaragua"},
            {"city": "Tegucigalpa", "country": "Honduras"},
            {"city": "Belize City", "country": "Belize"},
            {"city": "Havana", "country": "Cuba"},
            {"city": "San Juan", "country": "Puerto Rico"},
            {"city": "Santo Domingo", "country": "Dominican Republic"},
            {"city": "Kingston", "country": "Jamaica"},
            {"city": "Port-au-Prince", "country": "Haiti"},
            {"city": "Nassau", "country": "Bahamas"},
            {"city": "Bridgetown", "country": "Barbados"},
            {"city": "Port of Spain", "country": "Trinidad and Tobago"},
            {"city": "Georgetown", "country": "Guyana"},
            {"city": "Paramaribo", "country": "Suriname"},
            {"city": "Tamarindo", "country": "Costa Rica"},
            {"city": "Bocas del Toro", "country": "Panama"},
            {"city": "Antigua", "country": "Antigua and Barbuda"},
        ]

        return cities

    def get_coordinates(self, city: str, country: str) -> Dict[str, float]:
        """
        Get coordinates for a city using a free geocoding service.
        Falls back to approximate coordinates if API fails.
        """
        try:
            # Use Nominatim (OpenStreetMap) geocoding - free and no API key needed
            url = f"https://nominatim.openstreetmap.org/search?city={city}&country={country}&format=json"
            response = self.session.get(url, timeout=5)
            time.sleep(1)  # Respectful delay for free service

            if response.status_code == 200:
                data = response.json()
                if data:
                    return {
                        "lat": float(data[0]['lat']),
                        "lon": float(data[0]['lon'])
                    }
        except Exception as e:
            print(f"  Warning: Could not geocode {city}, {country}: {e}")

        # Return None if geocoding fails - will need manual entry
        return None

    def estimate_geopolitical_risk(self, country: str) -> int:
        """
        Estimate geopolitical risk score (1-10) based on country.
        This is a simplified estimation - for production, use real data sources.
        """
        # Very rough estimates - should be replaced with real data
        low_risk = ["USA", "Canada", "Australia", "New Zealand", "United Kingdom",
                    "Germany", "Switzerland", "Norway", "Sweden", "Finland",
                    "Denmark", "Netherlands", "Japan", "Singapore", "South Korea"]

        medium_risk = ["France", "Spain", "Italy", "Portugal", "Poland", "Czech Republic",
                      "Austria", "Belgium", "Ireland", "Greece", "Chile", "Uruguay",
                      "Costa Rica", "Panama", "UAE", "Qatar", "Malaysia", "Thailand",
                      "Taiwan", "Israel", "South Africa", "Botswana"]

        if country in low_risk:
            return 2
        elif country in medium_risk:
            return 4
        else:
            return 6  # Default to medium-high risk

    def create_dataset(self, output_file: str = None):
        """
        Create an expanded dataset with 200 cities.
        For now, this creates a template that you can fill in manually
        with cost of living indices from Numbeo.
        """
        print("Creating expanded city dataset template...")
        print("Note: You'll need to manually add costOfLivingIndex values from Numbeo")
        print("Visit: https://www.numbeo.com/cost-of-living/rankings.jsp")
        print()

        cities = self.get_city_list()
        dataset = {
            "metadata": {
                "description": "Cost of Living Index data for major cities worldwide",
                "baseline": "New York City, NY, USA = 100",
                "note": "Index includes rent, food, transportation, and utilities",
                "lastUpdated": datetime.now().strftime("%Y-%m"),
                "sources": "Compiled from Numbeo, manual geocoding, and public indices",
                "geopoliticalRiskNote": "Risk score from 1 (safest) to 10 (highest risk)",
                "totalCities": len(cities)
            },
            "cities": []
        }

        print(f"Processing {len(cities)} cities...")
        for i, city_info in enumerate(cities, 1):
            print(f"[{i}/{len(cities)}] Processing {city_info['city']}, {city_info['country']}...")

            coords = self.get_coordinates(city_info['city'], city_info['country'])

            city_entry = {
                "city": city_info['city'],
                "country": city_info['country'],
                "costOfLivingIndex": 0.0,  # TO BE FILLED IN MANUALLY
                "geopoliticalRisk": self.estimate_geopolitical_risk(city_info['country']),
                "searchAliases": [
                    city_info['city'].lower(),
                    f"{city_info['city'].lower()}, {city_info['country'].lower()}"
                ]
            }

            if 'state' in city_info:
                city_entry['state'] = city_info['state']
                city_entry['searchAliases'].append(
                    f"{city_info['city'].lower()}, {city_info['state'].lower()}"
                )

            if coords:
                city_entry['lat'] = coords['lat']
                city_entry['lon'] = coords['lon']
            else:
                # Placeholder coordinates - needs manual entry
                city_entry['lat'] = 0.0
                city_entry['lon'] = 0.0
                city_entry['_NEEDS_COORDINATES'] = True

            dataset['cities'].append(city_entry)

        # Save to file
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(dataset, f, indent=2, ensure_ascii=False)
            print(f"\n✅ Dataset template saved to: {output_file}")
            print(f"📊 Total cities: {len(dataset['cities'])}")
            print("\n⚠️  Next steps:")
            print("1. Visit https://www.numbeo.com/cost-of-living/rankings.jsp")
            print("2. Fill in costOfLivingIndex values for each city")
            print("3. Fix any cities with _NEEDS_COORDINATES flag")
            print("4. Remove _NEEDS_COORDINATES flags once fixed")

        return dataset


def main():
    parser = argparse.ArgumentParser(description='Create expanded Numbeo dataset template')
    parser.add_argument('--output', '-o',
                       default='cost-of-living-data-expanded.json',
                       help='Output JSON file path')

    args = parser.parse_args()

    scraper = NumbeoCityScraper()
    scraper.create_dataset(args.output)


if __name__ == "__main__":
    main()
