#!/usr/bin/env python3
"""
CSV to JSON Converter for Cost of Living Data

This script converts a CSV file with city data into the JSON format
needed for the cost of living map.

CSV Format (with headers):
city,state,country,lat,lon,costOfLivingIndex,geopoliticalRisk

Example:
Tokyo,,Japan,35.6762,139.6503,88.5,2
London,,United Kingdom,51.5074,-0.1278,95.2,3
Austin,TX,USA,30.2672,-97.7431,78.4,3

Usage:
    python csv_to_json.py --input cities.csv --output expanded-data.json
"""

import csv
import json
import argparse
from datetime import datetime


def csv_to_json(csv_file: str, output_file: str, merge_with: str = None):
    """
    Convert CSV to JSON format for cost of living map.

    Args:
        csv_file: Input CSV file path
        output_file: Output JSON file path
        merge_with: Optional existing JSON file to merge with
    """

    cities = []

    # Read CSV file
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            city_entry = {
                "city": row['city'].strip(),
                "country": row['country'].strip(),
                "lat": float(row['lat']),
                "lon": float(row['lon']),
                "costOfLivingIndex": float(row['costOfLivingIndex']),
                "geopoliticalRisk": int(row['geopoliticalRisk']),
                "searchAliases": [
                    row['city'].strip().lower(),
                    f"{row['city'].strip().lower()}, {row['country'].strip().lower()}"
                ]
            }

            # Add state if present
            if row.get('state') and row['state'].strip():
                city_entry['state'] = row['state'].strip()
                city_entry['searchAliases'].append(
                    f"{row['city'].strip().lower()}, {row['state'].strip().lower()}"
                )

            cities.append(city_entry)

    # Merge with existing data if specified
    if merge_with:
        try:
            with open(merge_with, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                # Add existing cities that aren't in the CSV
                existing_city_keys = {
                    (c['city'], c['country']): c
                    for c in existing_data.get('cities', [])
                }
                csv_city_keys = {(c['city'], c['country']) for c in cities}

                for key, city_data in existing_city_keys.items():
                    if key not in csv_city_keys:
                        cities.append(city_data)

                print(f"Merged with {len(existing_city_keys)} existing cities")
        except FileNotFoundError:
            print(f"Warning: Could not find {merge_with}, creating new file")

    # Create final dataset
    dataset = {
        "metadata": {
            "description": "Cost of Living Index data for major cities worldwide",
            "baseline": "New York City, NY, USA = 100",
            "note": "Index includes rent, food, transportation, and utilities",
            "lastUpdated": datetime.now().strftime("%Y-%m"),
            "sources": "Compiled from Numbeo, manual data entry, and public cost of living indices",
            "geopoliticalRiskNote": "Risk score from 1 (safest) to 10 (highest risk) based on political stability, safety, economic factors",
            "totalCities": len(cities)
        },
        "cities": sorted(cities, key=lambda x: (x['country'], x['city']))
    }

    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    print(f"✅ Successfully converted {len(cities)} cities to JSON")
    print(f"📁 Output file: {output_file}")


def create_csv_template(output_file: str):
    """Create a CSV template for data entry."""

    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['city', 'state', 'country', 'lat', 'lon', 'costOfLivingIndex', 'geopoliticalRisk'])
        writer.writerow(['Tokyo', '', 'Japan', '35.6762', '139.6503', '88.5', '2'])
        writer.writerow(['London', '', 'United Kingdom', '51.5074', '-0.1278', '95.2', '3'])
        writer.writerow(['Austin', 'TX', 'USA', '30.2672', '-97.7431', '78.4', '3'])

    print(f"✅ CSV template created: {output_file}")
    print("Fill in the template and run: python csv_to_json.py --input your_data.csv --output output.json")


def main():
    parser = argparse.ArgumentParser(description='Convert CSV city data to JSON format')
    parser.add_argument('--input', '-i', help='Input CSV file')
    parser.add_argument('--output', '-o', help='Output JSON file')
    parser.add_argument('--merge', '-m', help='Existing JSON file to merge with')
    parser.add_argument('--create-template', '-t', help='Create CSV template file')

    args = parser.parse_args()

    if args.create_template:
        create_csv_template(args.create_template)
    elif args.input and args.output:
        csv_to_json(args.input, args.output, args.merge)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
