@extends('admin.layout')

@section('content')
<style>
    /* Override Header for Order Page */
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

    .order-page { font-family: 'Inter', sans-serif; }
    
    .order-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
    }
    .order-top-bar h2 {
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
    }
    .order-filters {
        display: flex;
        gap: 12px;
    }
    .order-filter-btn {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        color: #334155;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    }
    
    /* Tabs */
    .order-tabs-container {
        border-bottom: 2px solid #cbd5e1;
        margin-bottom: 24px;
        display: flex;
        gap: 32px;
        padding-bottom: 0;
    }
    .order-tab {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #64748b;
        padding-bottom: 12px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
        text-decoration: none;
    }
    .order-tab.active {
        color: #1e3a8a;
        border-bottom: 3px solid #1e3a8a;
    }
    .order-tab-count {
        background: #f1f5f9;
        color: #94a3b8;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 999px;
    }
    .order-tab.active .order-tab-count {
        background: #1e3a8a;
        color: #ffffff;
    }

    /* Cards */
    .order-list-card {
        background: #ffffff;
        border-radius: 8px;
        padding: 20px 24px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .order-col {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .order-col-label {
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
    }
    .order-col-val {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
    }
    
    .order-user-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 180px;
    }
    .order-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        background-color: #e2e8f0;
    }

    /* Status Badge */
    .order-badge {
        padding: 6px 16px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        text-align: center;
        width: 100px;
    }
    .badge-pending { background: #fef3c7; color: #d97706; }
    .badge-accepted { background: #dbeafe; color: #2563eb; }
    .badge-ongoing { background: #e0e7ff; color: #4f46e5; }
    .badge-completed { background: #dcfce7; color: #16a34a; }
    .badge-cancelled { background: #fee2e2; color: #dc2626; }
    
    .btn-detail {
        background: #f1f5f9;
        color: #475569;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
    }
    .btn-detail:hover {
        background: #e2e8f0;
    }

    /* Pagination Fix */
    .pagination {
        display: flex;
        justify-content: center;
        gap: 8px;
        list-style: none;
        padding: 0;
        margin: 32px 0 0 0;
    }
    .page-item .page-link {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        color: #475569;
        text-decoration: none;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        border: none;
    }
    .page-item.active .page-link {
        background: #1e3a8a;
        color: #ffffff;
    }
    .page-item.disabled .page-link {
        color: #cbd5e1;
        cursor: not-allowed;
    }
    /* Hide some default Laravel pagination text if necessary */
    .pagination .sr-only { display: none; }
</style>

<div class="order-page">
    <div class="order-top-bar">
        <h2>Daftar Order</h2>
        <div class="order-filters">
            <div class="order-filter-btn">
                <span>Jakarta Selatan</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="order-filter-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>23 Oct - 30 Oct 2024</span>
            </div>
        </div>
    </div>

    @php
        $currentTab = request('status', '');
        
        // Count mapped by tab exactly like the mockup
        // Real count from DB statusCounts: pending, accepted, started, completed, cancelled
        $cAll = array_sum($statusCounts);
        $cPending = $statusCounts['pending'] ?? 0;
        $cAccepted = $statusCounts['accepted'] ?? 0;
        $cOngoing = $statusCounts['started'] ?? 0;
        $cCompleted = $statusCounts['completed'] ?? 0;
        $cCancelled = ($statusCounts['cancelled'] ?? 0) + ($statusCounts['rejected'] ?? 0);
    @endphp

    <div class="order-tabs-container">
        <a href="{{ route('admin.orders') }}" class="order-tab {{ $currentTab === '' ? 'active' : '' }}">
            Semua <span class="order-tab-count">{{ number_format($cAll) }}</span>
        </a>
        <a href="{{ route('admin.orders', ['status' => 'pending']) }}" class="order-tab {{ $currentTab === 'pending' ? 'active' : '' }}">
            Pending <span class="order-tab-count">{{ number_format($cPending) }}</span>
        </a>
        <a href="{{ route('admin.orders', ['status' => 'accepted']) }}" class="order-tab {{ $currentTab === 'accepted' ? 'active' : '' }}">
            Accepted <span class="order-tab-count">{{ number_format($cAccepted) }}</span>
        </a>
        <a href="{{ route('admin.orders', ['status' => 'started']) }}" class="order-tab {{ $currentTab === 'started' ? 'active' : '' }}">
            On-Going <span class="order-tab-count">{{ number_format($cOngoing) }}</span>
        </a>
        <a href="{{ route('admin.orders', ['status' => 'completed']) }}" class="order-tab {{ $currentTab === 'completed' ? 'active' : '' }}">
            Completed <span class="order-tab-count">{{ number_format($cCompleted) }}</span>
        </a>
        <a href="{{ route('admin.orders', ['status' => 'cancelled']) }}" class="order-tab {{ $currentTab === 'cancelled' ? 'active' : '' }}">
            Cancelled <span class="order-tab-count">{{ number_format($cCancelled) }}</span>
        </a>
    </div>

    @forelse($orders as $order)
        @php
            $badgeClass = 'badge-pending';
            $badgeText = 'Pending';
            if ($order->status === 'accepted') { $badgeClass = 'badge-accepted'; $badgeText = 'Accepted'; }
            if ($order->status === 'started') { $badgeClass = 'badge-ongoing'; $badgeText = 'On-Going'; }
            if ($order->status === 'completed') { $badgeClass = 'badge-completed'; $badgeText = 'Completed'; }
            if ($order->status === 'cancelled' || $order->status === 'rejected') { $badgeClass = 'badge-cancelled'; $badgeText = 'Cancelled'; }
            
            $custId = $order->customer?->id ?? 1;
            $drvId = $order->driver?->id ?? 2;
        @endphp
        <div class="order-list-card">
            <div class="order-col" style="width:100px;">
                <span class="order-col-label">ID Order</span>
                <span class="order-col-val">#{{ substr($order->id, 0, 7) }}</span>
            </div>
            
            <div class="order-user-wrap">
                <div class="order-avatar" style="background-image:url('{{ $order->customer?->photo ?: 'https://ui-avatars.com/api/?name=' . urlencode($order->customer?->name ?: 'C') . '&background=e2e8f0&color=1e293b' }}')"></div>
                <div class="order-col">
                    <span class="order-col-label">Customer</span>
                    <span class="order-col-val">{{ $order->customer?->name ?: 'Customer FivGo' }}</span>
                </div>
            </div>

            <div class="order-user-wrap">
                <div class="order-avatar" style="background-image:url('{{ $order->driver?->photo ?: 'https://ui-avatars.com/api/?name=' . urlencode($order->driver?->name ?: 'D') . '&background=e2e8f0&color=1e293b' }}')"></div>
                <div class="order-col">
                    <span class="order-col-label">Driver</span>
                    <span class="order-col-val">{{ $order->driver?->name ?: '-' }}</span>
                </div>
            </div>

            <div class="order-badge {{ $badgeClass }}">{{ $badgeText }}</div>
            
            <div>
                <a href="{{ route('admin.orders.show', $order->id) }}" class="btn-detail">Lihat Deatil &rarr;</a>
            </div>
        </div>
    @empty
        <div style="text-align:center; padding: 40px; color:#64748b;">
            Belum ada order untuk filter ini.
        </div>
    @endforelse

    <!-- Pagination -->
    <div style="margin-top:20px;">
        {{ $orders->links('pagination::bootstrap-4') }}
    </div>
</div>
@endsection
