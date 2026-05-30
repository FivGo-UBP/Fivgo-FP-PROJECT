import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TomtomService {
  private apiKey = environment.tomtomApiKey;
  private mapboxApiKey = environment.mapboxApiKey;

  constructor(private http: HttpClient) {}

  // 1. Search / Autocomplete API
  searchAddress(query: string, lon?: number, lat?: number): Observable<any> {
    let url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${this.apiKey}&typeahead=true&limit=8&idxSet=POI,PAD,Str,Xstr`;
    if (lon && lat) {
      url += `&lat=${lat}&lon=${lon}&radius=10000`; // Bias to location
    }
    return this.http.get(url);
  }

  // 2. Geocoding API (Address to Coordinates)
  geocode(address: string): Observable<any> {
    return this.http.get(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${this.apiKey}`);
  }
  
  // Reverse Geocoding (Coordinates to Address)
  reverseGeocode(lat: number, lon: number): Observable<any> {
    return this.http.get(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${this.apiKey}`);
  }

  // 3. Routing API
  calculateRoute(startLat: number, startLon: number, destLat: number, destLon: number, vehicleType: string = 'mobil'): Observable<any> {
    const mapboxUrl = this.buildMapboxRouteUrl(startLat, startLon, destLat, destLon, vehicleType);
    const tomtomUrl = this.buildTomTomRouteUrl(startLat, startLon, destLat, destLon, vehicleType);

    return this.http.get(mapboxUrl).pipe(
      map((res: any) => {
        const normalized = this.normalizeMapboxRouteResponse(res);
        if (!normalized.routes.length) {
          throw new Error('Mapbox route not found');
        }
        return normalized;
      }),
      catchError(() => this.http.get(tomtomUrl))
    );
  }

  private buildTomTomRouteUrl(startLat: number, startLon: number, destLat: number, destLon: number, vehicleType: string): string {
    const locations = `${startLat},${startLon}:${destLat},${destLon}`;
    
    // Trik untuk Motor: Kita pinjam mode 'car' agar tidak masuk gang sempit,
    // lalu kita minta rute 'eco' beserta alternatifnya agar nanti bisa disortir yang terpendek.
    // Untuk Mobil: Kita pakai mode murni 'car' dengan rute 'fastest' tanpa alternatif,
    // karena jalur tercepat (fastest) adalah yang paling nyaman dan masuk akal untuk mobil (jalan besar/arteri).
    
    const travelMode = 'car';
    const routeType = vehicleType === 'motor' ? 'eco' : 'fastest';
    const maxAlternatives = vehicleType === 'motor' ? 2 : 0;
    
    let url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${this.apiKey}&maxAlternatives=${maxAlternatives}&routeType=${routeType}&traffic=true&travelMode=${travelMode}&instructionsType=text&language=id-ID`;
    
    if (vehicleType === 'motor') {
      url += '&avoid=tollRoads';
    }
    
    return url;
  }

  private buildMapboxRouteUrl(startLat: number, startLon: number, destLat: number, destLon: number, vehicleType: string): string {
    const coordinates = `${startLon},${startLat};${destLon},${destLat}`;
    const params = new URLSearchParams({
      access_token: this.mapboxApiKey,
      geometries: 'geojson',
      overview: 'full',
      steps: 'true',
      language: 'id',
      alternatives: vehicleType === 'motor' ? 'true' : 'false',
    });

    if (vehicleType === 'motor') {
      params.set('exclude', 'toll');
    }

    return `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?${params.toString()}`;
  }

  private normalizeMapboxRouteResponse(res: any): any {
    return {
      routes: (res?.routes || []).map((route: any) => {
        const coordinates = route?.geometry?.coordinates || [];
        const points = coordinates.map(([longitude, latitude]: [number, number]) => ({ longitude, latitude }));
        const instructions: any[] = [];

        for (const leg of route?.legs || []) {
          for (const step of leg?.steps || []) {
            const [longitude, latitude] = step?.maneuver?.location || [];
            if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
              instructions.push({
                message: step?.maneuver?.instruction || step?.name || '',
                point: { longitude, latitude },
              });
            }
          }
        }

        return {
          summary: {
            lengthInMeters: route?.distance || 0,
            travelTimeInSeconds: route?.duration || 0,
          },
          legs: [{ points }],
          guidance: { instructions },
        };
      }),
    };
  }
}
