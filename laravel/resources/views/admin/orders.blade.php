@extends('admin.layout')

@section('subtitle', 'Kelola status order, rute, pembayaran, dan penugasan driver.')

@section('content')
    <section class="status-summary-grid">
        <article><span>MENUNGGU</span><strong>{{ $statusCounts['pending'] }}</strong></article>
        <article><span>DITERIMA</span><strong>{{ $statusCounts['accepted'] }}</strong></article>
        <article><span>BERJALAN</span><strong>{{ $statusCounts['started'] }}</strong></article>
        <article><span>SELESAI</span><strong>{{ $statusCounts['completed'] }}</strong></article>
    </section>

    <section class="toolbar-card">
        <form class="filter-form is-wide" method="GET">
            <label class="search-field">
                <span class="search-icon"></span>
                <input
                    type="search"
                    name="q"
                    value="{{ request('q') }}"
                    placeholder="Cari customer, driver, atau alamat ..."
                >
            </label>

            <select name="status">
                <option value="">Status Order</option>
                @foreach (['pending', 'accepted', 'started', 'completed', 'cancelled', 'rejected'] as $status)
                    <option value="{{ $status }}" @selected(request('status') === $status)>{{ ucfirst($status) }}</option>
                @endforeach
            </select>

            <select name="vehicle_type">
                <option value="">Kategori Kendaraan</option>
                <option value="motor" @selected(request('vehicle_type') === 'motor')>Motor</option>
                <option value="mobil" @selected(request('vehicle_type') === 'mobil')>Mobil</option>
                <option value="car" @selected(request('vehicle_type') === 'car')>Car</option>
            </select>

            <button class="secondary-button" type="submit">Terapkan</button>
        </form>
    </section>

    <section class="table-card">
        <div class="section-heading">
            <div>
                <h2>Daftar Order</h2>
                <p>{{ number_format($orders->total(), 0, ',', '.') }} order ditemukan.</p>
            </div>
        </div>

        <div class="table-scroll">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID Order</th>
                        <th>Customer</th>
                        <th>Driver</th>
                        <th>Kendaraan</th>
                        <th>Rute</th>
                        <th>Pembayaran</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($orders as $order)
                        <tr>
                            <td>
                                <strong>#{{ substr($order->id, 0, 8) }}</strong>
                                <small>{{ $order->created_at?->format('d M Y H:i') }}</small>
                            </td>
                            <td>{{ $order->customer?->name ?: 'Customer FivGo' }}</td>
                            <td>{{ $order->driver?->name ?: '-' }}</td>
                            <td>{{ $order->vehicle_type ?: '-' }}</td>
                            <td>
                                <span class="route-cell">{{ $order->pickup_address }}</span>
                                <small>{{ $order->dropoff_address }}</small>
                            </td>
                            <td>
                                <strong>Rp {{ number_format($order->final_price ?? $order->estimated_price, 0, ',', '.') }}</strong>
                                <small>{{ strtoupper($order->payment_method) }}</small>
                            </td>
                            <td><span class="status-pill status-{{ $order->status }}">{{ strtoupper($order->status) }}</span></td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="empty-table">Belum ada order.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="pagination-wrap">
            {{ $orders->links() }}
        </div>
    </section>
@endsection
