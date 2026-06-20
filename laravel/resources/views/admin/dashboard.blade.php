@extends('admin.layout')

@section('subtitle', 'Ringkasan operasional armada dan pesanan FivGo.')

@section('content')
    <section class="metric-grid dashboard-metrics">
        @foreach ($metrics as $metric)
            <article class="metric-card">
                <div>
                    <p>{{ $metric['label'] }}</p>
                    <strong>{{ $metric['value'] }}</strong>
                </div>
                <span class="metric-icon is-yellow" data-icon="{{ $metric['icon'] }}"></span>
            </article>
        @endforeach

        <article class="status-card">
            <h2>Status Pesanan</h2>
            <div class="status-list">
                <span><b>MENUNGGU</b><strong>{{ $statusCounts['pending'] }}</strong></span>
                <span><b>DITERIMA</b><strong>{{ $statusCounts['accepted'] }}</strong></span>
                <span><b>BERJALAN</b><strong>{{ $statusCounts['started'] }}</strong></span>
            </div>
        </article>
    </section>

    <section class="dashboard-map card-surface">

        <div
            class="admin-map mapbox-admin-map"
            data-mapbox-map
            data-mapbox-token="{{ $mapboxToken }}"
            data-mapbox-empty="Belum ada driver aktif atau order yang sudah diambil."
        >
            <script type="application/json" data-mapbox-payload>{!! json_encode($mapData, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) !!}</script>
            @unless ($mapboxToken)
                <p class="map-token-warning">Tambahkan MAPBOX_ACCESS_TOKEN di .env untuk menampilkan Mapbox.</p>
            @endunless
        </div>
    </section>

@endsection
