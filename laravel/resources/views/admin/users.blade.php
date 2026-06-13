@extends('admin.layout')

@section('subtitle')
    {{ $role === 'driver' ? 'Kelola akun driver, rating, kendaraan, dan status operasional.' : 'Kelola data pelanggan, kontak, dan status verifikasi.' }}
@endsection

@section('content')
    {{-- Segmented Tabs --}}
    <section class="toolbar-card" style="margin-top:24px;">
        <div class="segmented-tabs">
            <a class="{{ $role === 'customer' ? 'is-active' : '' }}" href="{{ route('admin.customers') }}">Customer</a>
            <a class="{{ $role === 'driver' ? 'is-active' : '' }}" href="{{ route('admin.drivers') }}">Driver</a>
        </div>

        {{-- Filter Form --}}
        <form class="filter-form" method="GET" action="{{ request()->url() }}">
            <label class="search-field">
                <span class="search-icon"></span>
                <input
                    type="search"
                    name="q"
                    value="{{ request('q') }}"
                    placeholder="Cari nama, email, atau ID {{ $role }} ..."
                >
            </label>

            @if ($role === 'customer')
                <select name="status">
                    <option value="">Status Akun</option>
                    <option value="active"   @selected(request('status') === 'active')>Aktif</option>
                    <option value="inactive" @selected(request('status') === 'inactive')>Nonaktif</option>
                </select>
            @else
                <select name="vehicle_type">
                    <option value="">Kategori Kendaraan</option>
                    <option value="motor" @selected(request('vehicle_type') === 'motor')>Motor</option>
                    <option value="mobil" @selected(request('vehicle_type') === 'mobil')>Mobil</option>
                </select>
            @endif

            <select name="sort_rating">
                <option value="">Urutkan Rating</option>
                <option value="desc" @selected(request('sort_rating') === 'desc')>Rating Terbaik</option>
                <option value="asc"  @selected(request('sort_rating') === 'asc')>Rating Terendah</option>
            </select>

            <button type="submit" class="secondary-button" style="background:#f59e0b;color:#fff;border-color:#f59e0b;">
                Cari
            </button>
        </form>
    </section>

    {{-- Table --}}
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
                        <th style="width:50px;text-align:center;">No</th>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Telephone</th>
                        @if ($role === 'driver')
                            <th>Status Kerja</th>
                            <th>Rating</th>
                            <th>Status Akun</th>
                        @else
                            <th>Status Akun</th>
                            <th>Rating</th>
                        @endif
                        <th style="text-align:center;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($users as $user)
                        <tr>
                            {{-- No --}}
                            <td style="text-align:center;">
                                {{ $loop->iteration + ($users->currentPage() - 1) * $users->perPage() }}
                            </td>

                            {{-- Nama --}}
                            <td><strong>{{ $user->name ?: '-' }}</strong></td>

                            {{-- Email --}}
                            <td>{{ $user->email ?: '-' }}</td>

                            {{-- Telephone --}}
                            <td>{{ $user->phone ?: '-' }}</td>

                            @if ($role === 'driver')
                                {{-- Status Kerja --}}
                                <td>
                                    @php $statusKerja = strtolower($user->driverProfile?->status ?: 'offline'); @endphp
                                    <span class="status-pill status-{{ $statusKerja }}">
                                        {{ ucfirst($statusKerja) }}
                                    </span>
                                </td>

                                {{-- Rating --}}
                                <td>
                                    <strong>{{ number_format((float) ($user->driverProfile?->rating ?? 5.0), 1) }}</strong>
                                    <span style="color:#f59e0b;font-size:14px;">★</span>
                                </td>

                                {{-- Status Akun (Toggle) --}}
                                <td>
                                    <form action="{{ route('admin.users.toggle-status', $user->id) }}" method="POST">
                                        @csrf
                                        @if ($user->is_active)
                                            <button type="submit" class="secondary-button"
                                                style="background:#ef4444;color:#fff;border:none;border-radius:999px;min-width:110px;min-height:34px;font-size:12px;">
                                                Nonaktifkan
                                            </button>
                                        @else
                                            <button type="submit" class="secondary-button"
                                                style="background:#1e3a8a;color:#fff;border:none;border-radius:999px;min-width:110px;min-height:34px;font-size:12px;">
                                                Aktifkan
                                            </button>
                                        @endif
                                    </form>
                                </td>

                            @else
                                {{-- Status Akun (Toggle) --}}
                                <td>
                                    <form action="{{ route('admin.users.toggle-status', $user->id) }}" method="POST">
                                        @csrf
                                        @if ($user->is_active)
                                            <button type="submit" class="secondary-button"
                                                style="background:#ef4444;color:#fff;border:none;border-radius:999px;min-width:110px;min-height:34px;font-size:12px;">
                                                Nonaktifkan
                                            </button>
                                        @else
                                            <button type="submit" class="secondary-button"
                                                style="background:#1e3a8a;color:#fff;border:none;border-radius:999px;min-width:110px;min-height:34px;font-size:12px;">
                                                Aktifkan
                                            </button>
                                        @endif
                                    </form>
                                </td>

                                {{-- Rating --}}
                                <td>
                                    <strong>{{ number_format((float) ($user->rating ?? 5.0), 1) }}</strong>
                                    <span style="color:#f59e0b;font-size:14px;">★</span>
                                </td>
                            @endif

                            {{-- Aksi --}}
                            <td style="text-align:center;">
                                <a href="#" class="ghost-button"
                                    style="gap:6px;padding:8px 14px;min-height:34px;font-size:12px;border-radius:8px;">
                                    Lihat Detail
                                    <span style="font-size:14px;">→</span>
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="{{ $role === 'driver' ? 8 : 7 }}" class="empty-table">
                                Data belum tersedia.
                            </td>
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
