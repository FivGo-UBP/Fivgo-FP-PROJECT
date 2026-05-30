@extends('admin.layout')

@section('subtitle')
    {{ $role === 'driver' ? 'Kelola akun driver, rating, kendaraan, dan status operasional.' : 'Kelola data pelanggan, kontak, dan status verifikasi.' }}
@endsection

@section('content')
    <section class="toolbar-card">
        <div class="segmented-tabs">
            <a class="{{ $role === 'customer' ? 'is-active' : '' }}" href="{{ route('admin.customers') }}">Customer</a>
            <a class="{{ $role === 'driver' ? 'is-active' : '' }}" href="{{ route('admin.drivers') }}">Driver</a>
        </div>

        <form class="filter-form" method="GET">
            <label class="search-field">
                <span class="search-icon"></span>
                <input
                    type="search"
                    name="q"
                    value="{{ request('q') }}"
                    placeholder="Cari nama, email, atau ID {{ $role }} ..."
                >
            </label>

            @if ($role === 'driver')
                <select name="vehicle_type">
                    <option value="">Kategori Kendaraan</option>
                    <option value="motor" @selected(request('vehicle_type') === 'motor')>Motor</option>
                    <option value="motorcycle" @selected(request('vehicle_type') === 'motorcycle')>Motorcycle</option>
                    <option value="mobil" @selected(request('vehicle_type') === 'mobil')>Mobil</option>
                    <option value="car" @selected(request('vehicle_type') === 'car')>Car</option>
                </select>
                <select name="status">
                    <option value="">Status Akun</option>
                    <option value="online" @selected(request('status') === 'online')>Online</option>
                    <option value="active" @selected(request('status') === 'active')>Aktif</option>
                    <option value="offline" @selected(request('status') === 'offline')>Offline</option>
                    <option value="busy" @selected(request('status') === 'busy')>Busy</option>
                </select>
            @endif

            <button class="secondary-button" type="submit">Terapkan</button>
        </form>
    </section>

    <section class="table-card">
        <div class="section-heading">
            <div>
                <h2>{{ $title }}</h2>
                <p>{{ number_format($users->total(), 0, ',', '.') }} akun ditemukan.</p>
            </div>
        </div>

        <div class="table-scroll">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Telepon</th>
                        @if ($role === 'driver')
                            <th>Kendaraan</th>
                            <th>Rating</th>
                            <th>Status</th>
                        @else
                            <th>Verifikasi</th>
                            <th>Bergabung</th>
                        @endif
                    </tr>
                </thead>
                <tbody>
                    @forelse ($users as $user)
                        <tr>
                            <td>
                                <span class="person-cell">
                                    <span class="mini-avatar">{{ strtoupper(substr($user->name ?: $user->role, 0, 1)) }}</span>
                                    <span>
                                        <strong>{{ $user->name ?: ucfirst($user->role) . ' FivGo' }}</strong>
                                        <small>#{{ substr($user->id, 0, 8) }}</small>
                                    </span>
                                </span>
                            </td>
                            <td>{{ $user->email ?: '-' }}</td>
                            <td>{{ $user->phone ?: '-' }}</td>
                            @if ($role === 'driver')
                                <td>
                                    {{ $user->driverProfile?->vehicle_type ?: '-' }}
                                    <small>{{ $user->driverProfile?->plate_number ?: '' }}</small>
                                </td>
                                <td>{{ number_format((float) ($user->driverProfile?->rating ?? 0), 1) }}</td>
                                <td><span class="status-pill status-{{ $user->driverProfile?->status ?: 'offline' }}">{{ strtoupper($user->driverProfile?->status ?: 'offline') }}</span></td>
                            @else
                                <td>
                                    <span class="status-pill {{ $user->phone_verified_at || $user->email_verified_at ? 'status-completed' : 'status-pending' }}">
                                        {{ $user->phone_verified_at || $user->email_verified_at ? 'TERVERIFIKASI' : 'BELUM' }}
                                    </span>
                                </td>
                                <td>{{ $user->created_at?->format('d M Y') }}</td>
                            @endif
                        </tr>
                    @empty
                        <tr>
                            <td colspan="{{ $role === 'driver' ? 6 : 5 }}" class="empty-table">Data belum tersedia.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="pagination-wrap">
            {{ $users->links() }}
        </div>
    </section>
@endsection
