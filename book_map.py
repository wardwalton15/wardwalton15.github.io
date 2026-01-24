import pandas as pd
import requests
import folium
import pycountry


# Configuration for each map
MAP_CONFIGS = [
    {
        "name": "Haidyn",
        "csv_path": "haidyn_goodreads - Sheet1.csv",
        "output_path": "haidyn_book_map.html",
    },
    {
        "name": "Ward",
        "csv_path": "ward_country_sheet - Sheet1.csv",
        "output_path": "ward_book_map.html",
    },
]


def load_book_data(csv_path: str) -> pd.DataFrame:
    """Load book CSV with country data."""
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} books")
    return df


def normalize_country_name(country_name: str) -> tuple[str | None, str | None]:
    """Convert country name to ISO code and standardized name."""
    if not country_name:
        return None, None

    # Handle common variations and alternate names
    name_mapping = {
        "United States of America": "United States",
        "USA": "United States",
        "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
        "Russian Empire": "Russia",
        "Soviet Union": "Russia",
        "USSR": "Russia",
        "Weimar Republic": "Germany",
        "Nazi Germany": "Germany",
        "West Germany": "Germany",
        "East Germany": "Germany",
        "German Empire": "Germany",
        "Kingdom of Prussia": "Germany",
        "Austrian Empire": "Austria",
        "Austria-Hungary": "Austria",
        "Czechoslovakia": "Czech Republic",
        "Czechia": "Czech Republic",
        "Kingdom of Italy": "Italy",
        "British Raj": "India",
        "British India": "India",
        "Ottoman Empire": "Turkey",
        "Kingdom of England": "United Kingdom",
        "Kingdom of Scotland": "United Kingdom",
        "Kingdom of Great Britain": "United Kingdom",
        "England": "United Kingdom",
        "Scotland": "United Kingdom",
        "Wales": "United Kingdom",
        "Northern Ireland": "United Kingdom",
        "People's Republic of China": "China",
        "Republic of China": "Taiwan",
        "Sinagpore": "Singapore",
        "Afganistan": "Afghanistan",
        "Phillipines": "Philippines",
        "Phillipines ": "Philippines",
        "Turkey": "Türkiye",
        "Copenhagan": "Denmark",
        "Mexixoc": "Mexico",
        "German": "Germany",
        "Grece": "Greece",
    }

    country_name = country_name.strip()
    normalized = name_mapping.get(country_name, country_name)

    try:
        country = pycountry.countries.search_fuzzy(normalized)[0]
        return country.alpha_3, country.name
    except LookupError:
        print(f"  Could not normalize country: {country_name}")
        return None, country_name


def build_country_book_mapping(df: pd.DataFrame) -> dict:
    """Build mapping of countries to their books and authors."""
    country_data = {}

    print(f"\nProcessing {len(df)} books...")

    for _, row in df.iterrows():
        country_name = row.get("Country", "")
        if pd.isna(country_name) or not country_name:
            print(f"  No country for: {row['Title']} by {row['Author']}")
            continue

        iso_code, display_name = normalize_country_name(country_name)

        if iso_code:
            if iso_code not in country_data:
                country_data[iso_code] = {
                    "name": display_name,
                    "count": 0,
                    "books": []
                }

            country_data[iso_code]["count"] += 1
            country_data[iso_code]["books"].append({
                "title": row["Title"],
                "author": row["Author"],
                "rating": 0
            })

    return country_data


def create_map(country_data: dict, name: str = ""):
    """Create an interactive choropleth map with book data."""
    # Create base map
    m = folium.Map(location=[20, 0], zoom_start=2, tiles="cartodbpositron")

    # Add title
    title = f"{name}'s Book Map" if name else "Book Map"
    title_html = f'''
    <div style="position: fixed;
                top: 10px; left: 50px; z-index: 9999;
                background-color: white; padding: 10px 20px;
                border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">
        {title}
    </div>
    '''
    m.get_root().html.add_child(folium.Element(title_html))

    # Prepare data for choropleth
    country_counts = {code: data["count"] for code, data in country_data.items()}

    if not country_counts:
        print("No country data to display!")
        return m

    # Load GeoJSON for world countries
    geojson_url = "https://raw.githubusercontent.com/python-visualization/folium/main/examples/data/world-countries.json"

    # Create choropleth layer
    folium.Choropleth(
        geo_data=geojson_url,
        name="Book Count",
        data=pd.DataFrame(
            list(country_counts.items()),
            columns=["Country", "Books"]
        ),
        columns=["Country", "Books"],
        key_on="feature.id",
        fill_color="YlGnBu",
        fill_opacity=0.7,
        line_opacity=0.2,
        legend_name="Number of Books Read",
        nan_fill_color="white"
    ).add_to(m)

    # Add interactive tooltips with country details
    geojson_response = requests.get(geojson_url)
    geojson_data = geojson_response.json()

    def style_function(feature):
        country_id = feature.get("id", "")
        if country_id in country_data:
            return {
                "fillOpacity": 0.7,
                "weight": 2,
                "color": "black"
            }
        return {
            "fillOpacity": 0,
            "weight": 0
        }

    def highlight_function(feature):
        return {
            "weight": 3,
            "color": "#666",
            "fillOpacity": 0.9
        }

    # Add GeoJson layer with popups
    for feature in geojson_data["features"]:
        country_id = feature.get("id", "")
        if country_id in country_data:
            data = country_data[country_id]

            # Create popup content
            books_html = "<br>".join([
                f"• <b>{b['title']}</b> by {b['author']}" +
                (f" ({b['rating']}★)" if b['rating'] > 0 else "")
                for b in data["books"][:10]  # Limit to 10 books
            ])
            if len(data["books"]) > 10:
                books_html += f"<br>... and {len(data['books']) - 10} more"

            popup_html = f"""
            <div style="width: 300px; max-height: 400px; overflow-y: auto;">
                <h4>{data['name']}</h4>
                <p><b>{data['count']} book(s) read</b></p>
                <hr>
                {books_html}
            </div>
            """

            # Create a GeoJson for just this country
            folium.GeoJson(
                feature,
                style_function=lambda x: {"fillOpacity": 0, "weight": 0},
                highlight_function=highlight_function,
                tooltip=folium.Tooltip(f"{data['name']}: {data['count']} books"),
                popup=folium.Popup(popup_html, max_width=350)
            ).add_to(m)

    folium.LayerControl().add_to(m)

    return m


def print_summary(country_data: dict):
    """Print a summary of the book mapping."""
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)

    total_books = sum(d["count"] for d in country_data.values())
    print(f"Total books mapped: {total_books}")
    print(f"Countries represented: {len(country_data)}")

    print("\nBooks by country:")
    sorted_countries = sorted(
        country_data.items(),
        key=lambda x: x[1]["count"],
        reverse=True
    )
    for code, data in sorted_countries:
        print(f"  {data['name']}: {data['count']} books")


def main():
    print("=" * 50)
    print("BOOK MAP - Visualize Your Reading by Author Origin")
    print("=" * 50)

    for config in MAP_CONFIGS:
        name = config["name"]
        csv_path = config["csv_path"]
        output_path = config["output_path"]

        print(f"\n{'=' * 50}")
        print(f"Generating map for: {name}")
        print("=" * 50)

        # Load book data
        df = load_book_data(csv_path)

        # Build country mapping
        country_data = build_country_book_mapping(df)

        # Print summary
        print_summary(country_data)

        # Create and save map
        print(f"\nGenerating map...")
        book_map = create_map(country_data, name)
        book_map.save(output_path)
        print(f"Map saved to: {output_path}")

    print(f"\n{'=' * 50}")
    print("All maps generated!")
    print("=" * 50)


if __name__ == "__main__":
    main()
