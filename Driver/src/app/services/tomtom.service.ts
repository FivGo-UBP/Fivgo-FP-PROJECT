import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TomtomService {
  private apiKey = environment.tomtomApiKey;

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
    const locations = `${startLat},${startLon}:${destLat},${destLon}`;
    
    // Trik untuk Motor: Kita pinjam mode 'car' agar tidak masuk gang sempit,
    // lalu kita minta rute 'eco' beserta alternatifnya agar nanti bisa disortir yang terpendek.
    // Untuk Mobil: Kita pakai mode murni 'car' dengan rute 'fastest' tanpa alternatif,
    // karena jalur tercepat (fastest) adalah yang paling nyaman dan masuk akal untuk mobil (jalan besar/arteri).
    
    const travelMode = 'car';
    const routeType = vehicleType === 'motor' ? 'eco' : 'fastest';
    const maxAlternatives = vehicleType === 'motor' ? 2 : 0;
    
    let url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${this.apiKey}&maxAlternatives=${maxAlternatives}&routeType=${routeType}&traffic=true&travelMode=${travelMode}`;
    
    if (vehicleType === 'motor') {
      url += '&avoid=tollRoads';
    }
    
    return this.http.get(url);
  }
}
