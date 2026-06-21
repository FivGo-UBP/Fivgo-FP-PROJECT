@extends('admin.layout')

@section('content')
<style>
    /* Override Header for Monitoring Page */
    .topbar-header {
        background-color: #1e3a8a !important;
        margin: -32px -32px 32px -32px !important;
        padding: 32px !important;
        border-bottom: none !important;
    }
    .topbar-header h1 {
        color: #ffffff !important;
        font-size: 24px !important;
        margin: 0 !important;
    }
    .topbar-header p {
        display: none !important;
    }

    .mon-page { font-family: 'Inter', sans-serif; }
    .mon-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 32px;
        align-items: start;
        height: calc(100vh - 160px);
    }
    .mon-map-wrapper {
        background: #e2e8f0;
        border-radius: 16px;
        height: 100%;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .mon-map-wrapper .admin-map {
        height: 100% !important;
        width: 100% !important;
        border-radius: 16px;
    }
    .mon-sidebar {
        height: 100%;
        overflow-y: auto;
        padding-right: 8px;
    }
    /* Custom Scrollbar for sidebar */
    .mon-sidebar::-webkit-scrollbar { width: 6px; }
    .mon-sidebar::-webkit-scrollbar-track { background: transparent; }
    .mon-sidebar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

    .mon-sidebar h2 {
        font-size: 22px;
        font-weight: 800;
        color: #1e3a8a;
        margin: 0 0 24px 0;
    }

    .mon-order-card {
        background: #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
    }
    .mon-order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    .mon-order-id {
        font-size: 11px;
        font-weight: 800;
        color: #1e3a8a;
        text-transform: uppercase;
    }
    .mon-order-status {
        font-size: 10px;
        font-weight: 800;
    }
    .mon-order-status.status-pickup { color: #f59e0b; }
    .mon-order-status.status-dropoff { color: #f59e0b; }
    .mon-order-status.status-completed { color: #22c55e; }
    .mon-order-status.status-pending { color: #64748b; }
    .mon-order-status.status-cancelled { color: #ef4444; }

    .mon-legend {
        margin-top: 24px;
        padding: 14px 16px;
        background: #f1f5f9;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
    }
    .mon-legend h4 {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 10px 0;
    }
    .mon-legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 6px;
    }
    .mon-legend-item:last-child { margin-bottom: 0; }
    .mon-legend-line {
        width: 28px;
        height: 3px;
        border-radius: 2px;
        flex-shrink: 0;
    }
    .mon-legend-line.is-amber {
        height: 0;
        border-top: 3px dashed #f59e0b;
    }
    .mon-legend-line.is-green {
        background: #139f5b;
    }
    
    .mon-driver-pill {
        background: #1e3a8a;
        color: #ffffff;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 10px;
        border-radius: 999px;
        display: inline-block;
        margin-bottom: 8px;
    }
    .mon-driver-name {
        font-size: 16px;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 6px 0;
    }
    .mon-eta {
        font-size: 12px;
        color: #334155;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
    }
</style>

<div class="mon-page">
    <div class="mon-grid">
        <!-- Map Area -->
        <div class="mon-map-wrapper">
            <div
                class="admin-map mapbox-admin-map"
                data-mapbox-map
                data-mapbox-token="{{ $mapboxToken }}"
                data-mapbox-empty="Belum ada driver aktif atau order yang sudah diambil."
            >
                <script type="application/json" data-mapbox-payload>{!! json_encode($mapData, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) !!}</script>
                @unless ($mapboxToken)
                    <p class="map-token-warning" style="padding: 20px;">Tambahkan MAPBOX_ACCESS_TOKEN di .env untuk menampilkan Mapbox.</p>
                @endunless
            </div>
        </div>

        <!-- Sidebar Area -->
        <aside class="mon-sidebar">
            <h2>Orderan Berjalan</h2>
            
            @forelse ($activeOrders as $order)
                @php
                    $idStr = strtoupper(substr($order->id, 0, 8));
                    
                    // Determine readable status
                    $statusClass = 'status-pending';
                    $statusText = 'Menunggu Driver';
                    $eta = rand(2, 10) . ' Mins';
                    
                    if ($order->status === 'accepted') {
                        $statusClass = 'status-pickup';
                        $statusText = 'Menuju ke Lokasi Jemput';
                    } elseif ($order->status === 'started') {
                        $statusClass = 'status-dropoff';
                        $statusText = 'Menuju ke Lokasi Tujuan';
                    } elseif ($order->status === 'completed') {
                        $statusClass = 'status-completed';
                        $statusText = 'Selesai';
                        $eta = null;
                    } elseif ($order->status === 'cancelled' || $order->status === 'rejected') {
                        $statusClass = 'status-cancelled';
                        $statusText = 'Dibatalkan';
                        $eta = null;
                    }
                @endphp
                <div class="mon-order-card">
                    <div class="mon-order-header">
                        <span class="mon-order-id">#{{ $idStr }}</span>
                        <span class="mon-order-status {{ $statusClass }}">{{ $statusText }}</span>
                    </div>
                    <span class="mon-driver-pill">Driver</span>
                    <h3 class="mon-driver-name">{{ $order->driver?->name ?: 'Belum ada driver' }}</h3>
                    @if($eta)
                        <div class="mon-eta">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            ETA: {{ $eta }}
                        </div>
                    @endif
                </div>
            @empty
                <p style="color:#64748b; font-size:14px; font-weight:500;">Tidak ada order yang sedang berjalan.</p>
            @endforelse

            <div class="mon-legend">
                <h4>Keterangan Rute</h4>
                <div class="mon-legend-item">
                    <span class="mon-legend-line is-amber"></span>
                    Menuju ke Lokasi Jemput
                </div>
                <div class="mon-legend-item">
                    <span class="mon-legend-line is-green"></span>
                    Menuju ke Lokasi Tujuan
                </div>
            </div>

        </aside>
    </div>
</div>
@endsection
