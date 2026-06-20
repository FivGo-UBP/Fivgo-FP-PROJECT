@extends('admin.layout')

@section('content')
<style>
    /* Override Header for Order Detail Page */
    .topbar-header {
        background-color: #1e3a8a !important;
        margin: -32px -32px 32px -32px !important;
        padding: 32px !important;
        border-bottom: none !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
    }
    .topbar-header h1 {
        display: none !important;
    }
    .topbar-header p {
        display: none !important;
    }
    
    .od-breadcrumb {
        color: #94a3b8;
        font-size: 16px;
        font-weight: 500;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .od-breadcrumb:hover { color: #ffffff; }
    .od-title-active {
        color: #ffffff;
        font-size: 18px;
        font-weight: 700;
    }

    .od-page { font-family: 'Inter', sans-serif; }
    .od-main-title {
        font-size: 22px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 24px;
    }

    .od-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    
    .od-grid-top {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 40px;
        margin-bottom: 32px;
    }

    /* Left column */
    .od-waktu-card {
        border: 1px solid #1e3a8a;
        border-radius: 8px;
        padding: 12px 16px;
        display: inline-flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 32px;
        width: 100%;
        max-width: 300px;
    }
    .od-waktu-icon {
        width: 32px;
        height: 32px;
        background: #e2e8f0;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1e3a8a;
    }
    .od-waktu-texts span {
        display: block;
        font-size: 10px;
        font-weight: 600;
        color: #64748b;
    }
    .od-waktu-texts strong {
        display: block;
        font-size: 13px;
        color: #0f172a;
        font-weight: 700;
        margin-top: 2px;
    }

    /* Timeline */
    .od-timeline {
        position: relative;
        padding-left: 24px;
    }
    .od-timeline::before {
        content: '';
        position: absolute;
        left: 7px;
        top: 8px;
        bottom: 24px;
        width: 2px;
        background: #cbd5e1;
    }
    .od-tl-item {
        position: relative;
        margin-bottom: 32px;
    }
    .od-tl-item:last-child {
        margin-bottom: 0;
    }
    .od-tl-icon-awal {
        position: absolute;
        left: -24px;
        top: 2px;
        width: 16px;
        height: 16px;
        border: 2px solid #94a3b8;
        border-radius: 50%;
        background: #ffffff;
    }
    .od-tl-icon-tujuan {
        position: absolute;
        left: -26px;
        top: -2px;
        color: #f59e0b;
    }
    .od-tl-title {
        font-size: 14px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 4px;
    }
    .od-tl-desc {
        font-size: 13px;
        color: #64748b;
        line-height: 1.5;
    }

    /* Right column (User cards) */
    .od-user-card {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
    }
    .od-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        background-color: #e2e8f0;
    }
    .od-user-role {
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
    }
    .od-user-name {
        font-size: 14px;
        font-weight: 800;
        color: #0f172a;
        margin-top: 2px;
    }
    .od-vehicle-info {
        font-size: 11px;
        color: #64748b;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .od-dot {
        width: 4px;
        height: 4px;
        background: #94a3b8;
        border-radius: 50%;
    }

    /* Map */
    .od-map-wrap {
        height: 350px;
        background: #f1f5f9;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
    }
</style>

<!-- Custom Header Content inserted into .topbar-header -->
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const header = document.querySelector('.topbar-header');
        if(header) {
            header.innerHTML = `
                <a href="{{ route('admin.orders') }}" class="od-breadcrumb">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Order
                </a>
                <span style="color:#64748b; font-weight:bold;">&gt;</span>
                <span class="od-title-active">Lihat Detail</span>
            `;
        }
    });
</script>

<div class="od-page">
    <h2 class="od-main-title">Detail Order</h2>

    <div class="od-card">
        <div class="od-grid-top">
            <!-- Left Side -->
            <div>
                <div class="od-waktu-card">
                    <div class="od-waktu-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div class="od-waktu-texts">
                        <span>Waktu Pemesanan</span>
                        <strong>{{ $order->created_at?->translatedFormat('d M Y, h:i A') ?: 'Hari Ini, 10:45 AM' }}</strong>
                    </div>
                </div>

                <div class="od-timeline">
                    <div class="od-tl-item">
                        <div class="od-tl-icon-awal"></div>
                        <div class="od-tl-title">Awal</div>
                        <div class="od-tl-desc" id="pickup-address-text">{{ $order->pickup_address ?: 'Mall Karawang' }}</div>
                    </div>
                    <div class="od-tl-item">
                        <div class="od-tl-icon-tujuan">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        </div>
                        <div class="od-tl-title">Tujuan</div>
                        <div class="od-tl-desc" id="dropoff-address-text">{{ $order->dropoff_address ?: 'Masjid Ar-riyadh' }}</div>
                    </div>
                </div>
            </div>

            <!-- Right Side -->
            <div>
                <div class="od-user-card">
                    <div class="od-avatar" style="background-image:url('https://ui-avatars.com/api/?name={{ urlencode($order->customer?->name ?: 'Customer') }}&background=e2e8f0&color=1e293b')"></div>
                    <div>
                        <div class="od-user-role">Customer</div>
                        <div class="od-user-name">{{ $order->customer?->name ?: 'Riski Ahmad' }}</div>
                    </div>
                </div>

                <div class="od-user-card">
                    <div class="od-avatar" style="background-image:url('https://ui-avatars.com/api/?name={{ urlencode($order->driver?->name ?: 'Driver') }}&background=e2e8f0&color=1e293b')"></div>
                    <div>
                        <div class="od-user-role">Driver</div>
                        <div class="od-user-name">{{ $order->driver?->name ?: 'Riski Ahmad' }}</div>
                        @if($order->driver)
                            <div class="od-vehicle-info">
                                {{ $order->driver->driverProfile?->plate_number ?: 'T 1234 YZ' }}
                                <span class="od-dot"></span>
                                {{ ucfirst($order->vehicle_type ?: 'Honda Vario') }}
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>

        <!-- Map Bottom -->
        <div class="od-map-wrap">
            <div
                class="admin-map mapbox-admin-map"
                style="height: 100%; width: 100%; border-radius: 12px;"
                data-mapbox-map
                data-mapbox-token="{{ $mapboxToken }}"
                data-mapbox-empty="Belum ada rute untuk order ini."
            >
                @php
                    $mapData = [];
                    if ($order->pickup_lat && $order->pickup_lng) {
                        $mapData['points'][] = [
                            'type' => 'pickup',
                            'label' => 'Awal',
                            'coordinates' => [(float) $order->pickup_lng, (float) $order->pickup_lat],
                        ];
                    }
                    if ($order->dropoff_lat && $order->dropoff_lng) {
                        $mapData['points'][] = [
                            'type' => 'dropoff',
                            'label' => 'Tujuan',
                            'coordinates' => [(float) $order->dropoff_lng, (float) $order->dropoff_lat],
                        ];
                    }
                    if (count($mapData) > 0 && isset($mapData['points'][0], $mapData['points'][1])) {
                        $mapData['routes'][] = [
                            'coordinates' => [
                                $mapData['points'][0]['coordinates'],
                                $mapData['points'][1]['coordinates']
                            ],
                            'color' => '#1e3a8a',
                            'width' => 4
                        ];
                    }
                @endphp
                <script type="application/json" id="mapbox-data" data-mapbox-payload>{!! json_encode($mapData) !!}</script>
            </div>
        </div>

    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const mapboxToken = '{{ $mapboxToken }}';
    if (!mapboxToken) return;

    // Check if we need to reverse geocode generic addresses
    const pickupAddressEl = document.getElementById('pickup-address-text');
    const dropoffAddressEl = document.getElementById('dropoff-address-text');
    
    const pickupText = pickupAddressEl ? pickupAddressEl.innerText.trim().toLowerCase() : '';
    const dropoffText = dropoffAddressEl ? dropoffAddressEl.innerText.trim().toLowerCase() : '';
    
    const needsReverseGeocode = (text) => text.includes('lokasi saat ini') || text.includes('current location') || text === 'awal' || text === '';

    const mapDataEl = document.getElementById('mapbox-data');
    if (!mapDataEl) return;
    
    try {
        const mapData = JSON.parse(mapDataEl.textContent);
        const points = mapData.points || [];
        
        points.forEach(pt => {
            if (pt.type === 'pickup' && needsReverseGeocode(pickupText)) {
                reverseGeocode(pt.coordinates[0], pt.coordinates[1], pickupAddressEl);
            }
            if (pt.type === 'dropoff' && needsReverseGeocode(dropoffText)) {
                reverseGeocode(pt.coordinates[0], pt.coordinates[1], dropoffAddressEl);
            }
        });
    } catch (e) {
        console.error("Error parsing map data for geocoding", e);
    }

    function reverseGeocode(lng, lat, element) {
        element.innerHTML = '<span style="color:#94a3b8; font-size:11px;">Mencari alamat...</span>';
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.features && data.features.length > 0) {
                    // Use .text instead of .place_name for a shorter, cleaner name (e.g. just the street or building name)
                    let shortName = data.features[0].text;
                    
                    // Fallback if somehow text is empty
                    if (!shortName) {
                        shortName = data.features[0].place_name.split(',')[0];
                    }
                    element.innerText = shortName;
                } else {
                    element.innerText = 'Lokasi tidak diketahui';
                }
            })
            .catch(err => {
                element.innerText = 'Koordinat: ' + lat + ', ' + lng;
            });
    }
});
</script>
@endsection
