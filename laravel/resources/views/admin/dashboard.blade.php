@extends('admin.layout')

@section('subtitle', 'Ringkasan operasional armada dan pesanan FivGo.')

@section('content')
    <section class="metric-grid dashboard-metrics">
        @php
            $iconClasses = [
                'users'  => 'fi fi-rr-user',
                'driver' => 'fi fi-rr-driver-man',
                'order'  => 'fi fi-rr-receipt',
                'wallet' => 'fi fi-rr-wallet',
                'check'  => 'fi fi-rr-check',
                'warning'=> 'fi fi-rr-exclamation',
            ];
        @endphp
        @foreach ($metrics as $metric)
            @php
                $iconClass = $iconClasses[$metric['icon']] ?? 'fi fi-rr-apps';
                $toneClass = match($metric['tone'] ?? '') {
                    'green' => 'is-green',
                    'blue'  => 'is-blue',
                    'red'   => 'is-red',
                    default => 'is-yellow',
                };
            @endphp
            <article class="metric-card">
                <div>
                    <p>{{ $metric['label'] }}</p>
                    <strong>{{ $metric['value'] }}</strong>
                </div>
                <span class="metric-icon {{ $toneClass }}"><i class="{{ $iconClass }}"></i></span>
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
