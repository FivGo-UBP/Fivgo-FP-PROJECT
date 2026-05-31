import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TomtomService {
  private apiKey = environment.tomtomApiKey;
  private mapboxApiKey = environment.mapboxApiKey;

  constructor(private http: HttpClient) { }

  // 1. Search TomTom — dioptimasi untuk Indonesia
  // Radius 30km agar POI seperti "Resinda Hotel", "Resinda Mall" semua muncul
  searchAddress(query: string, lon?: number, lat?: number): Observable<any> {
    let url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json`
      + `?key=${this.apiKey}`
      + `&typeahead=true`
      + `&limit=8`
      + `&countrySet=ID`
      + `&language=id-ID`
      + `&idxSet=POI,PAD,Str,Xstr,Geo`;

    // Radius 30km: cukup luas untuk menangkap semua POI sekitar (hotel, mall, dll)
    if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}&radius=30000`;
    }

    return this.http.get(url);
  }

  // 2. Search Nominatim (OpenStreetMap) — gratis, data Indonesia lebih lengkap
  // Viewbox lebar (±0.3 derajat ≈ 30km) agar semua varian nama muncul
  searchNominatim(query: string, lat?: number, lon?: number): Observable<any[]> {
    let url = `https://nominatim.openstreetmap.org/search`
      + `?q=${encodeURIComponent(query)}`
      + `&format=json`
      + `&addressdetails=1`
      + `&countrycodes=id`
      + `&limit=8`
      + `&accept-language=id`;

    // Viewbox ±0.3 derajat (~33km) untuk temukan semua POI dengan keyword yang sama
    if (lat && lon) {
      url += `&viewbox=${lon - 0.3},${lat + 0.3},${lon + 0.3},${lat - 0.3}&bounded=0`;
    }

    const headers = new HttpHeaders({ 'Accept-Language': 'id' });
    return this.http.get<any[]>(url, { headers }).pipe(
      catchError(() => of([]))
    );
  }

  // 3. Pencarian Hybrid: gabungkan TomTom + OpenStreetMap
  // OSM duluan karena data universitas Indonesia lebih lengkap, lalu TomTom sebagai pelengkap
  searchHybrid(query: string, lon?: number, lat?: number): Observable<any[]> {
    const tomtom$ = this.searchAddress(query, lon, lat).pipe(
      map((res: any) => {
        if (!res?.results) return [];
        return res.results.map((r: any) => {
          const name = r.poi?.name
            || r.address?.freeformAddress?.split(',')[0]?.trim()
            || 'Lokasi';
          const address = r.address?.freeformAddress || '';
          const distance = r.dist;
          let distanceStr = '';
          if (distance !== undefined) {
            distanceStr = distance >= 1000
              ? (distance / 1000).toFixed(1) + ' km'
              : Math.round(distance) + ' m';
          }
          return { name, address, distanceStr, source: 'tomtom', originalResult: r };
        });
      }),
      catchError(() => of([]))
    );

    const osm$ = this.searchNominatim(query, lat, lon).pipe(
      map((results: any[]) => {
        return results.map((r: any) => {
          const name = r.name || r.display_name?.split(',')[0]?.trim() || 'Lokasi';

          // Susun alamat yang bersih dari komponen OSM
          const addr = r.address || {};
          const parts = [
            addr.road,
            addr.suburb || addr.village || addr.town,
            addr.city || addr.county,
          ].filter(Boolean);
          const address = parts.length > 0 ? parts.join(', ') : r.display_name;

          // Hitung jarak jika ada koordinat pengguna
          let distanceStr = '';
          if (lat && lon) {
            const dLat = (parseFloat(r.lat) - lat) * 111000;
            const dLon = (parseFloat(r.lon) - lon) * 111000 * Math.cos(lat * Math.PI / 180);
            const dist = Math.sqrt(dLat * dLat + dLon * dLon);
            distanceStr = dist >= 1000
              ? (dist / 1000).toFixed(1) + ' km'
              : Math.round(dist) + ' m';
          }

          return {
            name,
            address,
            distanceStr,
            source: 'osm',
            originalResult: {
              position: { lat: parseFloat(r.lat), lon: parseFloat(r.lon) },
              poi: { name },
              address: { freeformAddress: address }
            }
          };
        });
      }),
      catchError(() => of([]))
    );

    return forkJoin([tomtom$, osm$]).pipe(
      map(([tomtomResults, osmResults]) => {
        // OSM duluan karena lebih akurat untuk universitas & tempat Indonesia
        const combined = [...osmResults, ...tomtomResults];

        // Deduplikasi menggunakan NAMA LENGKAP agar "Resinda Hotel" & "Resinda Mall"
        // tidak terhapus hanya karena sama-sama mengandung "Resinda"
        const seen = new Set<string>();
        return combined.filter(item => {
          // Key = nama lengkap + 3 huruf pertama alamat (untuk bedakan cabang berbeda)
          const nameKey = item.name.toLowerCase().replace(/\s+/g, '');
          const addrHint = (item.address || '').toLowerCase().slice(0, 15).replace(/\s+/g, '');
          const key = `${nameKey}__${addrHint}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 8);
      })
    );
  }

  // 4. Geocoding API (Address to Coordinates)
  geocode(address: string): Observable<any> {
    return this.http.get(
      `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${this.apiKey}`
    );
  }

  // 5. Reverse Geocoding (Coordinates to Address)
  reverseGeocode(lat: number, lon: number): Observable<any> {
    return this.http.get(
      `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${this.apiKey}`
    );
  }

  // 6. Routing API
  calculateRoute(
    startLat: number, startLon: number,
    destLat: number, destLon: number,
    vehicleType: string = 'mobil'
  ): Observable<any> {
    const mapboxUrl = this.buildMapboxRouteUrl(startLat, startLon, destLat, destLon, vehicleType);
    const tomtomUrl = this.buildTomTomRouteUrl(startLat, startLon, destLat, destLon, vehicleType);

    const mapboxRoute$ = this.http.get(mapboxUrl).pipe(
      map((res: any) => this.ensureRouteResponse(this.normalizeMapboxRouteResponse(res), 'Mapbox'))
    );
    const tomtomRoute$ = this.http.get(tomtomUrl).pipe(
      map((res: any) => this.ensureRouteResponse(res, 'TomTom'))
    );

    // Menggunakan Mapbox sebagai router utama untuk mobil maupun motor (dengan menghindari jalan tol)
    // karena data jalan Mapbox di Indonesia jauh lebih akurat dan lengkap. TomTom digunakan sebagai fallback.
    return mapboxRoute$.pipe(
      catchError(() => tomtomRoute$)
    );
  }

  private buildTomTomRouteUrl(
    startLat: number, startLon: number,
    destLat: number, destLon: number,
    vehicleType: string
  ): string {
    const locations = `${startLat},${startLon}:${destLat},${destLon}`;
    // Menggunakan travelMode 'car' untuk motor sebagai bentuk emulasi, karena rute 'motorcycle'
    // bawaan TomTom di Indonesia sangat tidak akurat dan sering memutar jauh.
    const travelMode = 'car';
    const routeType = 'fastest';
    const maxAlternatives = 0;

    let url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json`
      + `?key=${this.apiKey}`
      + `&maxAlternatives=${maxAlternatives}`
      + `&routeType=${routeType}`
      + `&traffic=true`
      + `&travelMode=${travelMode}`;

    if (vehicleType === 'motor') {
      url += '&avoid=tollRoads';
    }

    return url;
  }

  private buildMapboxRouteUrl(
    startLat: number, startLon: number,
    destLat: number, destLon: number,
    vehicleType: string
  ): string {
    const coordinates = `${startLon},${startLat};${destLon},${destLat}`;
    const profile = vehicleType === 'mobil' ? 'mapbox/driving-traffic' : 'mapbox/driving';
    const params = new URLSearchParams({
      access_token: this.mapboxApiKey,
      geometries: 'geojson',
      overview: 'full',
      steps: 'true',
      language: 'id',
      alternatives: 'false',
    });

    if (vehicleType === 'motor') {
      params.set('exclude', 'toll');
    }

    return `https://api.mapbox.com/directions/v5/${profile}/${coordinates}?${params.toString()}`;
  }

  private ensureRouteResponse(res: any, provider: string): any {
    if (!res?.routes?.length) {
      throw new Error(`${provider} route not found`);
    }

    return res;
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
