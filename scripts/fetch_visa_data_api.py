#!/usr/bin/env python3
"""
Fetch Visa Data from External API

This script fetches comprehensive visa requirements data from external APIs
and converts it to our passport-visa-data.json format.

Supported APIs:
1. nickypangers/passport-visa-api (self-hosted or public instance)
2. Travel Buddy AI (requires API key)
3. Zyla Visa Checker API (requires API key)

Usage:
    python3 fetch_visa_data_api.py --source nickypangers --output ../public/passport-visa-data.json
    python3 fetch_visa_data_api.py --source travelbuddy --api-key YOUR_KEY --output ../public/passport-visa-data.json
"""

import requests
import json
import argparse
from datetime import datetime
import time

class VisaDataFetcher:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.visa_data = {
            "metadata": {
                "description": "Visa requirements and residency information by country",
                "lastUpdated": datetime.now().strftime("%Y-%m"),
                "note": "Visa policies can change. Always verify with official sources before travel.",
                "dataSource": ""
            },
            "passports": [],
            "visaRequirements": {}
        }

    def fetch_from_nickypangers(self, base_url="https://api.passportindex.org"):
        """
        Fetch data from nickypangers/passport-visa-api

        Note: You may need to self-host this API or find a public instance.
        See: https://github.com/nickypangers/passport-visa-api
        """
        print("⚠️  Note: nickypangers API requires self-hosting or public instance")
        print("   See: https://github.com/nickypangers/passport-visa-api")
        print("")
        print("   To self-host:")
        print("   1. Clone the repo: git clone https://github.com/nickypangers/passport-visa-api")
        print("   2. Follow setup instructions in README")
        print("   3. Run the API locally")
        print("   4. Use --base-url http://localhost:PORT")
        print("")

        # Example of how it would work if API is available
        countries = self._get_country_list()

        for passport in countries:
            print(f"Fetching data for {passport}...")
            self.visa_data["visaRequirements"][passport] = {}

            for destination in countries:
                try:
                    # Example endpoint (adjust based on actual API)
                    url = f"{base_url}/visa-requirements/{passport}/{destination}"
                    response = requests.get(url, timeout=5)

                    if response.status_code == 200:
                        data = response.json()
                        self.visa_data["visaRequirements"][passport][destination] = {
                            "visaFree": data.get("dur", 0),
                            "category": self._convert_category(data["category"]["code"]),
                            "residencyPath": ""  # Not provided by API
                        }

                    time.sleep(0.1)  # Rate limiting

                except Exception as e:
                    print(f"  Error fetching {passport} -> {destination}: {e}")
                    continue

        self.visa_data["metadata"]["dataSource"] = "nickypangers/passport-visa-api"
        return self.visa_data

    def fetch_from_travelbuddy(self):
        """
        Fetch data from Travel Buddy AI API
        Free tier available: https://travel-buddy.ai/api/
        """
        if not self.api_key:
            print("❌ API key required for Travel Buddy AI")
            print("   Get one at: https://travel-buddy.ai/api/")
            return None

        print("Fetching from Travel Buddy AI API...")
        base_url = "https://api.travel-buddy.ai/v2"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        # Example endpoint - adjust based on actual API docs
        try:
            response = requests.get(
                f"{base_url}/visa-requirements/all",
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                # Transform to our format
                # (Implementation depends on their API structure)
                print("✅ Data fetched successfully")
                self.visa_data["metadata"]["dataSource"] = "Travel Buddy AI"
                return self.visa_data
            else:
                print(f"❌ API returned status {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ Error fetching data: {e}")
            return None

    def fetch_from_zyla(self):
        """
        Fetch data from Zyla Visa Checker API
        Free tier: https://zylalabs.com/api-marketplace/travel/visa+checker+api/2154
        """
        if not self.api_key:
            print("❌ API key required for Zyla API")
            print("   Get one at: https://zylalabs.com/api-marketplace/travel/visa+checker+api/2154")
            return None

        print("Fetching from Zyla Visa Checker API...")
        base_url = "https://zylalabs.com/api/2154"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        countries = self._get_country_list()

        for passport in countries:
            print(f"Fetching data for {passport}...")
            self.visa_data["visaRequirements"][passport] = {}

            for destination in countries:
                try:
                    url = f"{base_url}/visa+checker+api/1953/get+requirement?passport={passport}&destination={destination}"
                    response = requests.get(url, headers=headers, timeout=5)

                    if response.status_code == 200:
                        data = response.json()
                        self.visa_data["visaRequirements"][passport][destination] = {
                            "visaFree": data.get("duration", 0),
                            "category": data.get("status", "visa-required"),
                            "residencyPath": ""
                        }

                    time.sleep(0.2)  # Rate limiting

                except Exception as e:
                    print(f"  Error: {e}")
                    continue

        self.visa_data["metadata"]["dataSource"] = "Zyla Visa Checker API"
        return self.visa_data

    def _get_country_list(self):
        """Get list of all countries (ISO 2 codes or full names)"""
        # This should match the countries in your passport-visa-data.json
        return [
            "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
            "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas",
            "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize",
            "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil",
            "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
            "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China",
            "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba",
            "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
            "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
            "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
            "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
            "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
            "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
            "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
            "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos",
            "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
            "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives",
            "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
            "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
            "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
            "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
            "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
            "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
            "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
            "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
            "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
            "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
            "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
            "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
            "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
            "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
            "USA", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela",
            "Vietnam", "Yemen", "Zambia", "Zimbabwe"
        ]

    def _convert_category(self, code):
        """Convert API category codes to our format"""
        mapping = {
            "VF": "visa-free",
            "VOA": "visa-on-arrival",
            "EV": "e-visa",
            "VR": "visa-required",
            "NA": "no-admission",
            "ESTA": "ESTA",
            "eTA": "eTA"
        }
        return mapping.get(code, "visa-required")

    def save_to_file(self, filename):
        """Save visa data to JSON file"""
        self.visa_data["passports"] = list(self.visa_data["visaRequirements"].keys())

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.visa_data, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Saved to: {filename}")
        print(f"📊 Total passports: {len(self.visa_data['passports'])}")
        print(f"📊 Total combinations: {sum(len(v) for v in self.visa_data['visaRequirements'].values())}")


def main():
    parser = argparse.ArgumentParser(description='Fetch visa requirements from external APIs')
    parser.add_argument('--source', choices=['nickypangers', 'travelbuddy', 'zyla'],
                       default='nickypangers',
                       help='API source to use')
    parser.add_argument('--api-key', help='API key (required for travelbuddy and zyla)')
    parser.add_argument('--base-url', help='Base URL for self-hosted APIs')
    parser.add_argument('--output', '-o',
                       default='../public/passport-visa-data.json',
                       help='Output JSON file')

    args = parser.parse_args()

    fetcher = VisaDataFetcher(api_key=args.api_key)

    print(f"\n🌍 Fetching visa data from {args.source}...")
    print("=" * 60)

    if args.source == 'nickypangers':
        base_url = args.base_url or "https://api.passportindex.org"
        data = fetcher.fetch_from_nickypangers(base_url)
    elif args.source == 'travelbuddy':
        data = fetcher.fetch_from_travelbuddy()
    elif args.source == 'zyla':
        data = fetcher.fetch_from_zyla()

    if data:
        fetcher.save_to_file(args.output)
        print("\n✅ Done!")
    else:
        print("\n❌ Failed to fetch data")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
