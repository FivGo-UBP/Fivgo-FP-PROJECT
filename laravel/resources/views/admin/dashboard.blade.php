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
                <span class="metric-icon is-{{ $metric['tone'] }}" data-icon="{{ $metric['icon'] }}"></span>
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
        <div class="map-header">
            <div>
                <h2>Monitoring Order Aktif</h2>
                <p>Lokasi operasional ditampilkan sebagai simulasi visual dari order yang sedang berjalan.</p>
            </div>
            <a class="ghost-button" href="{{ route('admin.monitoring') }}">Buka Monitoring</a>
        </div>

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

    <section class="table-card">
        <div class="section-heading">
            <div>
                <h2>Order Terbaru</h2>
                <p>Daftar ringkas pesanan terakhir yang masuk ke sistem.</p>
            </div>
            <a class="ghost-button" href="{{ route('admin.orders') }}">Lihat semua</a>
        </div>

        <div class="table-scroll">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Driver</th>
                        <th>Rute</th>
                        <th>Status</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($recentOrders as $order)
                        <tr>
                            <td>#{{ substr($order->id, 0, 8) }}</td>
                            <td>{{ $order->customer?->name ?: 'Customer FivGo' }}</td>
                            <td>{{ $order->driver?->name ?: '-' }}</td>
                            <td>
                                <span class="route-cell">{{ $order->pickup_address }}</span>
                                <small>{{ $order->dropoff_address }}</small>
                            </td>
                            <td><span class="status-pill status-{{ $order->status }}">{{ strtoupper($order->status) }}</span></td>
                            <td>Rp {{ number_format($order->final_price ?? $order->estimated_price, 0, ',', '.') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="empty-table">Belum ada order.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>
@endsection
