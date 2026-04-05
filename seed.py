"""Seed the PropChain database with sample Kazakhstan properties via the API."""

import httpx
import sys

API = "http://localhost:8000/properties"

PROPERTIES = [
    {
        "title": "Astana Green Quarter Residences",
        "address": "Block 14, Mangilik El Ave 56, Astana 010000, Kazakhstan",
        "description": (
            "Premium residential complex in the heart of Astana's new administrative "
            "district. 24 floors, panoramic city views, underground parking, concierge "
            "service. Walking distance to Bayterek Tower and EXPO grounds."
        ),
        "total_tokens": 10_000,
        "price_per_token": "0.850000",
        "uri": "https://propchain.io/metadata/astana-green-quarter.json",
    },
    {
        "title": "Almaty Esentai Commercial Tower",
        "address": "Al-Farabi Ave 77/7, Almaty 050040, Kazakhstan",
        "description": (
            "Class-A office space in Almaty's premier business corridor near Esentai Mall. "
            "12,000 sqm leasable area across 18 floors. High-speed elevators, smart building "
            "management, LEED Gold certified. Current occupancy rate 94%."
        ),
        "total_tokens": 25_000,
        "price_per_token": "1.200000",
        "uri": "https://propchain.io/metadata/almaty-esentai-tower.json",
    },
    {
        "title": "Shymkent Bazaar District Apartments",
        "address": "Tauke Khan Ave 32, Shymkent 160012, Kazakhstan",
        "description": (
            "Mixed-use development in Shymkent's historic bazaar quarter. 120 residential "
            "units with ground-floor retail. Recently renovated with modern amenities while "
            "preserving traditional architectural elements. Strong rental yield at 8.5% APY."
        ),
        "total_tokens": 5_000,
        "price_per_token": "0.450000",
        "uri": "https://propchain.io/metadata/shymkent-bazaar-apts.json",
    },
]


def main():
    created = 0
    with httpx.Client(timeout=10) as client:
        for prop in PROPERTIES:
            print(f"Creating: {prop['title']}...", end=" ")
            resp = client.post(API, json=prop)
            if resp.status_code == 201:
                data = resp.json()
                print(f"OK (id={data['id']})")
                created += 1
            else:
                print(f"FAILED ({resp.status_code}: {resp.text})")

    print(f"\nSeeded {created}/{len(PROPERTIES)} properties.")
    return 0 if created == len(PROPERTIES) else 1


if __name__ == "__main__":
    sys.exit(main())
