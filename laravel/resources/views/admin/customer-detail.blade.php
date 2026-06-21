@extends('admin.layout')

@section('content')
    <div class="fivgo-tabs-container">
        {{-- For spacing --}}
    </div>

    <div class="profile-detail-card">
        <div class="profile-avatar-wrap">
            <img src="{{ $customer->photo ?: 'https://ui-avatars.com/api/?name=' . urlencode($customer->name) . '&background=e2e8f0&color=475569&size=128' }}" 
                 alt="Profile Picture" 
                 onerror="this.src='https://ui-avatars.com/api/?name={{ urlencode($customer->name) }}&background=e2e8f0&color=475569&size=128'">
            <div class="profile-rating-badge">
                {{ number_format((float) ($customer->rating ?? 5.0), 1) }}
                <span style="color:#f59e0b; font-size:16px;">★</span>
            </div>
        </div>

        <div class="profile-info" style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
                <div>
                    <h2>
                        {{ $customer->name }}
                    </h2>
                    <p>ID#CUS-{{ substr($customer->id, 0, 4) }}</p>
                </div>
                <form action="{{ route('admin.users.toggle-status', $customer->id) }}" method="POST" style="margin:0;">
                    @csrf
                    @if ($customer->is_active)
                        <button type="button"
                            style="background:#ef4444;color:#fff;border:none;border-radius:999px;padding:0 24px;min-height:40px;font-size:13px;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px;"
                            onclick="if(confirm('Yakin ingin menonaktifkan pengguna ini?')) this.form.submit()">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>
                            Nonaktifkan
                        </button>
                    @else
                        <button type="submit"
                            style="background:#1e3a8a;color:#fff;border:none;border-radius:999px;padding:0 24px;min-height:40px;font-size:13px;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px;">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                            Aktifkan
                        </button>
                    @endif
                </form>
            </div>

            <div class="profile-blocks">
                <div class="info-block">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="m5 13 4 4L19 7"/></svg>
                    <div>
                        <span>Nomor WhatsApp</span>
                        <strong>{{ $customer->phone ?: '-' }}</strong>
                    </div>
                </div>
                <div class="info-block">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 13h5"/></svg>
                    <div>
                        <span>Email</span>
                        <strong>{{ $customer->email }}</strong>
                    </div>
                </div>
                <div class="info-block" style="min-width: 250px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M8 4h8l1 3h3v13H4V7h3z"/><path d="M8 11h8M8 15h6"/></svg>
                    <div>
                        <span>Bergabung Sejak</span>
                        <strong>{{ $customer->created_at->translatedFormat('d F Y') }}</strong>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="orders-list-card">
        <h3>Order Baru</h3>

        @forelse ($orders as $order)
            <div class="order-item-row">
                @php
                    $vehicleImage = strtolower($order->vehicle_type) === 'motor' ? 'motor kuning.png' : 'mobil kuning.png';
                @endphp
                <img src="{{ Vite::asset('resources/images/' . $vehicleImage) }}" 
                     alt="{{ $order->vehicle_type }}" 
                     class="order-item-icon"
                     style="background: transparent; object-fit: contain;"
                     onerror="this.src='{{ asset('assets/admin/logo-fivgo.png') }}'">
                
                <div class="order-item-details">
                    <strong>ID#{{ strtoupper(substr($order->id, 0, 8)) }}</strong>
                    <p>{{ $order->pickup_address }} <span style="margin:0 8px;">→</span> {{ $order->dropoff_address }}</p>
                </div>

                <div class="order-item-price">
                    <strong>Rp {{ number_format($order->price, 0, ',', '.') }}</strong>
                    @php
                        $statusColors = [
                            'pending' => '#f59e0b',
                            'accepted' => '#3b82f6',
                            'in_progress' => '#3b82f6',
                            'completed' => '#22c55e',
                            'cancelled' => '#ef4444',
                            'rejected' => '#ef4444',
                        ];
                        $statusLabels = [
                            'pending' => 'Menunggu',
                            'accepted' => 'Diterima',
                            'in_progress' => 'Dalam Perjalanan',
                            'completed' => 'Selesai',
                            'cancelled' => 'Dibatalkan',
                            'rejected' => 'Ditolak',
                        ];
                        $color = $statusColors[$order->status] ?? '#9ca3af';
                        $label = $statusLabels[$order->status] ?? ucfirst($order->status);
                    @endphp
                    <span style="display:inline-block; padding:4px 12px; background:{{ $color }}; color:#fff; border-radius:999px; font-size:11px; font-weight:700;">
                        {{ $label }}
                    </span>
                </div>
            </div>
        @empty
            <div style="text-align:center; padding:40px; color:var(--admin-muted);">
                Belum ada riwayat order.
            </div>
        @endforelse
    </div>
@endsection
