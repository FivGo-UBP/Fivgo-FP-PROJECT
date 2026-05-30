@extends('admin.layout')

@section('subtitle', 'Pantau order aktif dan driver yang sedang tersedia.')

@section('content')
    <section class="monitoring-grid">
        <div class="card-surface monitoring-map-card">
            <div class="section-heading">
                <div>
                    <h2>Peta Operasional</h2>
                    <p>Ikon kendaraan menunjukkan driver aktif, marker kuning pickup, dan marker biru tujuan.</p>
                </div>
            </div>

            <div
                class="admin-map is-large mapbox-admin-map"
                data-mapbox-map
                data-mapbox-token="{{ $mapboxToken }}"
                data-mapbox-empty="Belum ada driver aktif atau order yang sudah diambil."
            >
                <script type="application/json" data-mapbox-payload>{!! json_encode($mapData, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) !!}</script>
                @unless ($mapboxToken)
                    <p class="map-token-warning">Tambahkan MAPBOX_ACCESS_TOKEN di .env untuk menampilkan Mapbox.</p>
                @endunless
            </div>
        </div>

        <aside class="side-list-card">
            <h2>Order Diambil Driver</h2>
            <div class="stack-list">
                @forelse ($activeOrders as $order)
                    <article>
                        <span class="status-pill status-{{ $order->status }}">{{ strtoupper($order->status) }}</span>
                        <strong>{{ $order->customer?->name ?: 'Customer FivGo' }}</strong>
                        <p>{{ $order->pickup_address }}</p>
                        <small>{{ $order->driver?->name ?: 'Menunggu driver' }}</small>
                    </article>
                @empty
                    <p class="empty-copy">Tidak ada order aktif.</p>
                @endforelse
            </div>
        </aside>
    </section>
@endsection
