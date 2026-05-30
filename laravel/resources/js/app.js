import './bootstrap';
import carDriverMarkerUrl from '../images/mobil driver.png';
import motorDriverMarkerUrl from '../images/Motor driver.png';

document.addEventListener('DOMContentLoaded', () => {
    const layout = document.querySelector('[data-admin-layout]');
    const sidebarToggle = document.querySelector('[data-sidebar-toggle]');

    sidebarToggle?.addEventListener('click', () => {
        layout?.classList.toggle('is-sidebar-open');
    });

    document.querySelector('[data-password-toggle]')?.addEventListener('click', (event) => {
        const input = document.querySelector('#admin-password');

        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        input.type = input.type === 'password' ? 'text' : 'password';
        event.currentTarget?.setAttribute(
            'aria-label',
            input.type === 'password' ? 'Tampilkan password' : 'Sembunyikan password'
        );
    });

    initializeAdminMaps();
});

async function initializeAdminMaps() {
    const mapElements = [...document.querySelectorAll('[data-mapbox-map]')];
    const activeMapElements = mapElements.filter((mapElement) => mapElement.dataset.mapboxToken);

    if (activeMapElements.length === 0) {
        return;
    }

    const [{ default: mapboxgl }] = await Promise.all([
        import('mapbox-gl'),
        import('mapbox-gl/dist/mapbox-gl.css'),
    ]);

    activeMapElements.forEach((mapElement) => {
        const token = mapElement.dataset.mapboxToken;
        const payloadElement = mapElement.querySelector('[data-mapbox-payload]');
        const payload = parseMapPayload(payloadElement?.textContent);
        const points = Array.isArray(payload.points) ? payload.points : [];
        const routes = Array.isArray(payload.routes) ? payload.routes : [];
        const center = Array.isArray(payload.center) ? payload.center : [107.298, -6.321];

        mapElement.classList.add('has-mapbox');
        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
            container: mapElement,
            style: 'mapbox://styles/mapbox/streets-v12',
            center,
            zoom: points.length > 0 ? 12 : 11,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        map.on('load', () => {
            addOrderRoutes(map, routes);
            addMapMarkers(mapboxgl, map, points);
            fitMapToPoints(mapboxgl, map, points, center);

            if (points.length === 0) {
                showMapEmptyState(mapElement);
            }
        });
    });
}

function parseMapPayload(payload) {
    if (!payload) {
        return {};
    }

    try {
        return JSON.parse(payload);
    } catch {
        return {};
    }
}

function addOrderRoutes(map, routes) {
    if (routes.length === 0) {
        return;
    }

    map.addSource('assigned-order-routes', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: routes.map((route) => ({
                type: 'Feature',
                properties: {
                    status: route.status,
                },
                geometry: {
                    type: 'LineString',
                    coordinates: route.coordinates,
                },
            })),
        },
    });

    map.addLayer({
        id: 'assigned-order-routes-line',
        type: 'line',
        source: 'assigned-order-routes',
        layout: {
            'line-cap': 'round',
            'line-join': 'round',
        },
        paint: {
            'line-color': '#139f5b',
            'line-width': 4,
            'line-opacity': 0.78,
        },
    });
}

function addMapMarkers(mapboxgl, map, points) {
    points.forEach((point) => {
        if (!Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
            return;
        }

        const markerElement = document.createElement('button');
        markerElement.type = 'button';
        markerElement.className = `fivgo-map-marker is-${point.type || 'pin'}`;
        markerElement.setAttribute('aria-label', point.label || 'Marker FivGo');

        if (point.type === 'driver') {
            markerElement.classList.add('has-vehicle-icon');
            markerElement.innerHTML = `<img src="${driverMarkerImage(point)}" alt="" aria-hidden="true">`;
        }

        new mapboxgl.Marker({ element: markerElement, anchor: point.type === 'dropoff' ? 'bottom' : 'center' })
            .setLngLat(point.coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(markerPopupHtml(point)))
            .addTo(map);
    });
}

function driverMarkerImage(point) {
    const vehicle = String(point.meta?.vehicle || '').toLowerCase();

    if (vehicle.includes('mobil') || vehicle.includes('car')) {
        return carDriverMarkerUrl;
    }

    return motorDriverMarkerUrl;
}

function fitMapToPoints(mapboxgl, map, points, center) {
    const validPoints = points.filter((point) => Array.isArray(point.coordinates) && point.coordinates.length === 2);

    if (validPoints.length === 0) {
        map.setCenter(center);
        return;
    }

    const bounds = validPoints.reduce((mapBounds, point) => {
        return mapBounds.extend(point.coordinates);
    }, new mapboxgl.LngLatBounds(validPoints[0].coordinates, validPoints[0].coordinates));

    map.fitBounds(bounds, {
        padding: 72,
        maxZoom: 14,
        duration: 0,
    });
}

function markerPopupHtml(point) {
    const meta = point.meta || {};
    const rows = [
        meta.customer ? ['Customer', meta.customer] : null,
        meta.driver ? ['Driver', meta.driver] : null,
        meta.vehicle ? ['Kendaraan', `${meta.vehicle} ${meta.plate || ''}`.trim()] : null,
        meta.rating ? ['Rating', meta.rating] : null,
        meta.address ? ['Alamat', meta.address] : null,
    ].filter(Boolean);

    return `
        <div class="map-popup">
            <strong>${escapeHtml(point.label || 'FivGo')}</strong>
            <span>${escapeHtml(point.status || point.type || '')}</span>
            ${rows.map(([label, value]) => `<p><b>${escapeHtml(label)}</b>${escapeHtml(value)}</p>`).join('')}
        </div>
    `;
}

function showMapEmptyState(mapElement) {
    if (mapElement.querySelector('.empty-map')) {
        return;
    }

    const empty = document.createElement('p');
    empty.className = 'empty-map';
    empty.textContent = mapElement.dataset.mapboxEmpty || 'Belum ada data peta.';
    mapElement.append(empty);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
