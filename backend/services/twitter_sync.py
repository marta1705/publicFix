import requests
import re
from datetime import datetime
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from backend.db import db
from backend.models import Report
import os
import time

class TwitterSyncService:
    def __init__(self):
        api_key = os.getenv('TWITTER_API_KEY')
        if not api_key:
            raise RuntimeError("Brak TWITTER_API_KEY w zmiennych środowiskowych")
        self.api_key = api_key
        self.base_url = "https://api.twitterapi.io/twitter/tweet/advanced_search"
        
        self.geolocator = Nominatim(user_agent="publicfix_poland")
        
        # Słowa kluczowe dla różnych kategorii problemów
        self.keywords = {
            'oświetlenie_i_bezpieczeństwo': [
                'nie działa oświetlenie', 'zgaszona latarnia', 'brak światła',
                'nie świeci latarnia', 'ciemno', 'uszkodzona latarnia',
                'brak oświetlenia ulicznego', 'niebezpieczne miejsce', 'brak monitoringu'
            ],
            'infrastruktura_drogowa': [
                'dziura', 'wyrwa', 'uszkodzona droga', 'uszkodzona jezdnia',
                'dziura w asfalcie', 'pęknięta nawierzchnia', 'koleiny',
                'zapadnięta droga', 'zły stan drogi', 'brak oznakowania'
            ],
            'czystość_i_środowisko': [
                'śmieci', 'zaśmiecone', 'nielegalne wysypisko', 'pełne kosze',
                'brak koszy na śmieci', 'zanieczyszczenie', 'brud',
                'nieposprzątane', 'zalegające odpady', 'nieprzyjemny zapach'
            ],
            'infrastruktura_publiczna': [
                'uszkodzony chodnik', 'dziura w chodniku', 'zniszczony chodnik',
                'brak ławki', 'zniszczona ławka', 'uszkodzona wiata',
                'przystanek', 'brak kosza', 'zniszczona infrastruktura', 'awaria'
            ]
        }
        
        # Wzorce dla ekstrakcji lokalizacji (cała Polska)
        self.location_patterns = [
            # Ulica + numer + miasto
            r'ul\.?\s*([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+?)\s+(\d+[a-z]?)[,\s]+(?:w\s+)?([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+?)(?:\s|$|,|\.|!)',
            r'ulica\s+([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+?)\s+(\d+[a-z]?)[,\s]+(?:w\s+)?([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+?)(?:\s|$|,|\.|!)',
            
            # Miasto + ulica + numer
            r'(?:w\s+)?([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż]+)[,\s]+ul\.?\s*([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+?)\s+(\d+[a-z]?)',
            r'(?:w\s+)?([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż]+)[,\s]+ulica\s+([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+?)\s+(\d+[a-z]?)',
            
            # Miasto + "na" + ulica + numer
            r'(?:w\s+)?([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż]+)[,\s]+na\s+(?:ul\.?\s*)?([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+?)\s+(\d+[a-z]?)',
            
            # Samo miasto/wieś
            r'(?:w\s+)?([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż]{3,}?)(?:\s|$|,|\.|!)',
        ]
        
        self.known_cities = [
            'warszawa', 'kraków', 'łódź', 'wrocław', 'poznań', 'gdańsk', 
            'szczecin', 'bydgoszcz', 'lublin', 'katowice', 'białystok',
            'gdynia', 'częstochowa', 'radom', 'sosnowiec', 'toruń', 'kielce',
            'gliwice', 'zabrze', 'bytom', 'olsztyn', 'bielsko-biała', 'rzeszów',
            'ruda', 'rybnik', 'tychy', 'dąbrowa', 'elbląg', 'płock', 'opole',
            'gorzów', 'wałbrzych', 'zielona', 'tarnów', 'chorzów', 'koszalin'
        ]
    
    def search_tweets(self, query, retry_count=3):
        for attempt in range(retry_count):
            try:
                import urllib.parse
                encoded_query = urllib.parse.quote(query)
                
                url = f"{self.base_url}?queryType=Latest&query={encoded_query}"
                headers = {"X-API-Key": self.api_key}
                
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 429:
                    wait_time = 10 * (attempt + 1)
                    time.sleep(wait_time)
                    continue
                
                response.raise_for_status()
                
                try:
                    data = response.json()
                    
                    if isinstance(data, dict) and 'results' in data:
                        tweets = data['results']
                        return tweets
                    
                    elif isinstance(data, dict) and 'data' in data:
                        tweets = data['data']
                        return tweets
                    
                    elif isinstance(data, dict) and 'tweets' in data:
                        tweets = data['tweets']
                        return tweets
                    
                    elif isinstance(data, list):
                        return data
                    
                    else:
                        return []
                        
                except ValueError as e:
                    return []
                
            except requests.exceptions.HTTPError as e:
                if response.status_code == 429 and attempt < retry_count - 1:
                    continue 
                return []
                
            except requests.exceptions.RequestException as e:
                if attempt < retry_count - 1:
                    time.sleep(5)
                    continue
                return []
                
            except Exception as e:
                import traceback
                traceback.print_exc()
                return []
        
        return []
    
    def extract_location_from_text(self, text):
        if not text:
            return None, None, None
            
        text_normalized = text.strip()
        
        for pattern in self.location_patterns:
            match = re.search(pattern, text_normalized, re.IGNORECASE)
            if match:
                groups = match.groups()
                
                if len(groups) == 3:
                    for i, group in enumerate(groups):
                        if group and any(city.lower() in group.lower() for city in self.known_cities):
                            if i == 0:
                                return (groups[0].strip(), groups[1].strip(), groups[2].strip())
                            elif i == 2:
                                return (groups[2].strip(), groups[0].strip(), groups[1].strip())
                    
                    return (groups[2].strip(), groups[0].strip(), groups[1].strip())
                
                elif len(groups) == 1:
                    city = groups[0].strip()
                    if len(city) >= 3 and not city.lower() in ['dla', 'nie', 'jak', 'ale', 'czy']:
                        return (city, None, None)
        
        return None, None, None
    
    def extract_geotag_location(self, tweet):
        if 'place' in tweet and tweet['place']:
            place = tweet['place']
            if isinstance(place, dict):
                if 'bounding_box' in place and place['bounding_box']:
                    bbox = place['bounding_box']
                    if 'coordinates' in bbox and bbox['coordinates']:
                        coords = bbox['coordinates'][0]
                        if len(coords) > 0 and len(coords[0]) >= 2:
                            return coords[0][1], coords[0][0]
        
        if 'coordinates' in tweet and tweet['coordinates']:
            coords = tweet['coordinates']
            if isinstance(coords, dict) and 'coordinates' in coords:
                coord_list = coords['coordinates']
                if len(coord_list) >= 2:
                    return coord_list[1], coord_list[0]
        
        if 'geo' in tweet and tweet['geo']:
            geo = tweet['geo']
            if isinstance(geo, dict):
                if 'coordinates' in geo and isinstance(geo['coordinates'], list):
                    if len(geo['coordinates']) >= 2:
                        return geo['coordinates'][0], geo['coordinates'][1]
        
        return None, None
    
    def geocode_location(self, city, street=None, number=None):
        try:
            if street and number:
                address = f"{street} {number}, {city}, Polska"
            elif street:
                address = f"{street}, {city}, Polska"
            else:
                address = f"{city}, Polska"
            
            
            location = self.geolocator.geocode(address, timeout=10)
            if location:
                return location.latitude, location.longitude, address
            else:
                if street or number:
                    fallback_address = f"{city}, Polska"
                    location = self.geolocator.geocode(fallback_address, timeout=10)
                    if location:
                        return location.latitude, location.longitude, fallback_address
        
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            time.sleep(1)
        
        return None, None, None
    
    def detect_category(self, text):
        text_lower = text.lower()
        
        for category, keywords in self.keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        return 'inne'
    
    def process_tweet(self, tweet):
        if tweet.get('isReply'):
            return None, "Odpowiedź, nie oryginalny tweet"
        
        text = tweet.get('text') or tweet.get('full_text') or tweet.get('note_tweet', {}).get('text', '')
        
        if not text:
            return None, "Brak tekstu w tweecie"
        
        latitude = None
        longitude = None
        location_address = None
        
        geo_lat, geo_lon = self.extract_geotag_location(tweet)
        if geo_lat and geo_lon:
            latitude = geo_lat
            longitude = geo_lon
            location_address = f"Geotag: {latitude:.6f}, {longitude:.6f}"
        
        if not latitude:
            city, street, number = self.extract_location_from_text(text)
            
            if city:
                latitude, longitude, location_address = self.geocode_location(city, street, number)
                
                if not latitude:
                    return None, f"Nie można zlokalizować: {city}"
            else:
                return None, "Brak lokalizacji w tweecie"
        
        category = self.detect_category(text)
        
        existing = Report.query.filter(
            Report.latitude.between(latitude - 0.001, latitude + 0.001),
            Report.longitude.between(longitude - 0.001, longitude + 0.001),
            Report.description.contains(text[:50])
        ).first()
        
        if existing:
            return None, "Zgłoszenie już istnieje"
        
        created_at = tweet.get('created_at') or tweet.get('createdAt')
        
        if isinstance(created_at, str):
            try:
                created_at = datetime.strptime(created_at, '%a %b %d %H:%M:%S %z %Y')
            except:
                try:
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                except:
                    created_at = datetime.now()
        else:
            created_at = datetime.now()
        
        description = text[:150]
        if location_address and not location_address.startswith("Geotag"):
            description += f" [📍 {location_address}]"
        
        new_report = Report(
            description=description[:200],
            date=created_at,
            image_url=None,
            latitude=latitude,
            longitude=longitude,
            category=category,
            user_id=None,
            source='twitter'
        )
        new_report.status = 'Oczekujące'
        
        return new_report, "Sukces"
    
    def sync_reports(self, custom_queries=None):
        default_queries = [
            'dziura droga',
            'uszkodzony chodnik',
            'nie działa oświetlenie',
            'problem infrastruktura',
        ]
        
        queries = custom_queries if custom_queries else default_queries
        
        created_count = 0
        skipped_count = 0
        error_count = 0
        
        all_tweets = []
        
        for i, query in enumerate(queries):
            tweets = self.search_tweets(query)
            if tweets:
                all_tweets.extend(tweets)
            
            if i < len(queries) - 1:  
                time.sleep(5)
        
        if not all_tweets:
            return {
                'created': 0,
                'skipped': 0,
                'errors': 0
            }
        
        unique_tweets = {}
        for tweet in all_tweets:
            tweet_id = tweet.get('id') or tweet.get('id_str') or tweet.get('tweetId')
            if tweet_id and tweet_id not in unique_tweets:
                unique_tweets[tweet_id] = tweet
        
        tweets = list(unique_tweets.values())
        
        for i, tweet in enumerate(tweets, 1):
            
            report, message = self.process_tweet(tweet)
            
            if report:
                try:
                    db.session.add(report)
                    db.session.commit()
                    created_count += 1
                except Exception as e:
                    db.session.rollback()
                    error_count += 1
            else:
                skipped_count += 1
            
            if report and report.latitude:
                time.sleep(0.5)
        
        return {
            'created': created_count,
            'skipped': skipped_count,
            'errors': error_count
        }