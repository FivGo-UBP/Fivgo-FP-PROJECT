@extends('admin.layout')

@section('subtitle')
    {{ $role === 'driver' ? 'Kelola akun driver, rating, kendaraan, dan status operasional.' : 'Kelola data pelanggan, kontak, dan status verifikasi.' }}
@endsection

@section('content')


        <form class="filter-form is-wide" method="GET" action="{{ request()->url() }}" style="background:#ffffff; padding:24px; border-radius:16px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); display:flex; flex-wrap:nowrap; overflow-x:auto; gap:16px; align-items:center;">
            <label class="search-field-modern">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
                <input
                    type="search"
                    name="q"
                    value="{{ request('q') }}"
                    placeholder="Cari nama, email, atau ID {{ $role }} ..."
                >
            </label>

            <button type="submit" class="primary-button" style="background:var(--admin-yellow); color:#ffffff; border:none; min-height:46px; border-radius:8px; font-weight:700;">
                Cari
            </button>
            
            @if ($role === 'customer')
                <select name="status" onchange="this.form.submit()" style="min-height:46px; border:1px solid var(--admin-border); border-radius:8px; padding:0 16px; font-weight:600; color:var(--admin-text); background:#ffffff;">
                    <option value="">Status Akun</option>
                    <option value="active"   @selected(request('status') === 'active')>Aktif</option>
                    <option value="inactive" @selected(request('status') === 'inactive')>Nonaktif</option>
                </select>
            @else
                <select name="vehicle_type" onchange="this.form.submit()" style="min-height:46px; border:1px solid var(--admin-border); border-radius:8px; padding:0 16px; font-weight:600; color:var(--admin-text); background:#ffffff;">
                    <option value="">Kategori Kendaraan</option>
                    <option value="motor" @selected(request('vehicle_type') === 'motor')>Motor</option>
                    <option value="mobil" @selected(request('vehicle_type') === 'mobil')>Mobil</option>
                </select>
            @endif

            <select name="sort_rating" onchange="this.form.submit()" style="min-height:46px; border:1px solid var(--admin-border); border-radius:8px; padding:0 16px; font-weight:600; color:var(--admin-text); background:#ffffff;">
                <option value="">Urutkan Rating</option>
                <option value="desc" @selected(request('sort_rating') === 'desc')>Rating Terbaik</option>
                <option value="asc"  @selected(request('sort_rating') === 'asc')>Rating Terendah</option>
            </select>
        </form>

    {{-- Table --}}
    <section class="table-card" style="margin-top:0; border-top-left-radius:0; border-top-right-radius:0; border-top:none;">
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
                                    <form id="toggleFormCus_{{ $user->id }}" action="{{ route('admin.users.toggle-status', $user->id) }}" method="POST">
                                        @csrf
                                        @if ($user->is_active)
                                            <button type="button" class="secondary-button"
                                                style="background:#ef4444;color:#fff;border:none;border-radius:999px;min-width:110px;min-height:34px;font-size:12px;cursor:pointer;"
                                                onclick="openToggleModal('{{ $user->id }}', '{{ $user->name }}')">
                                                Nonaktifkan
                                            </button>
                                        @else
                                            <button type="submit" class="secondary-button"
                                                style="background:#1e3a8a;color:#fff;border:none;border-radius:999px;min-width:110px;min-height:34px;font-size:12px;cursor:pointer;">
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
                                <div style="display:flex; gap:8px; justify-content:center; align-items:center;">
                                    <a href="{{ $role === 'customer' ? route('admin.customers.show', $user->id) : '#' }}" class="ghost-button"
                                        style="background:#f1f5f9; border:none; padding:6px 12px; min-height:28px; font-size:11px; border-radius:6px;">
                                        Lihat Detail
                                        <span style="font-size:12px; margin-left:4px;">→</span>
                                    </a>
                                    @if ($role === 'customer')
                                    <button type="button" class="icon-button"
                                        style="border:none; color:#ef4444; width:28px; height:28px; min-height:28px; background:transparent;"
                                        onclick="openDeleteModal('{{ $user->id }}')">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    </button>
                                    @endif
                                </div>
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

        <div class="pagination-modern">
            {{ $users->links() }}
        </div>
    </section>

    <div id="deleteModal" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </div>
            <h3>Hapus Akun Customer?</h3>
            <p>Apakah Anda yakin ingin menghapus akun customer ini? Pengguna tidak akan dapat mengakses layanan FivGo menggunakan akun tersebut setelah proses penghapusan dilakukan.</p>
            
            <div class="modal-actions">
                <button type="button" class="modal-btn-cancel" onclick="closeDeleteModal()">Batal</button>
                <form id="deleteForm" method="POST" action="">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="modal-btn-danger">Ya, Hapus</button>
                </form>
            </div>
        </div>
    </div>

    {{-- Toggle Status Modal --}}
    <div id="toggleModal" class="modal-overlay hidden">
        <div class="modal-content" style="max-width:540px; text-align:left;">
            <div style="text-align:center;">
                <div class="modal-icon-circle" style="background:#fecaca; color:#ef4444;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h3>Nonaktifkan Customer</h3>
                <p style="margin-bottom:24px;">Tindakan ini akan mencabut semua akses Customer ke platform FivGo untuk sementara waktu.</p>
            </div>

            <div style="display:flex; align-items:center; gap:16px; padding:12px 16px; border:1px solid var(--admin-border); border-radius:12px; margin-bottom:24px;">
                <img src="{{ asset('assets/admin/logo-fivgo.png') }}" alt="" style="width:48px; height:48px; border-radius:8px; object-fit:cover; background:#f1f5f9;">
                <div>
                    <span style="display:block; font-size:12px; color:var(--admin-muted); margin-bottom:4px;">Pengguna</span>
                    <strong id="toggleUserName" style="font-size:14px;">Riski Ahmad Fauzan (Customer - ID : #CG434)</strong>
                </div>
            </div>

            <form id="toggleModalForm" method="POST" action="">
                @csrf
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:14px; font-weight:700; margin-bottom:8px;">Alasan Penonaktifan</label>
                    <select name="reason" style="width:100%; min-height:46px; border:1px solid var(--admin-border); border-radius:8px; padding:0 16px; font-size:14px; outline:none; background:#ffffff;">
                        <option value="">Pilih Alasan Utama</option>
                        <option value="spam">Aktivitas Spam / Mencurigakan</option>
                        <option value="violation">Pelanggaran Syarat & Ketentuan</option>
                        <option value="other">Lainnya</option>
                    </select>
                </div>

                <div style="margin-bottom:32px;">
                    <label style="display:block; font-size:14px; font-weight:700; margin-bottom:8px;">Catatan Tambahan (opsional)</label>
                    <textarea name="notes" rows="3" placeholder="Tuliskan detail pelanggaran atau catatan tambahan ..." style="width:100%; border:1px solid var(--admin-border); border-radius:8px; padding:12px 16px; font-size:14px; outline:none; resize:none; font-family:inherit;"></textarea>
                </div>

                <div class="modal-actions">
                    <button type="button" class="modal-btn-cancel" onclick="closeToggleModal()">Batal</button>
                    <button type="submit" class="modal-btn-danger">Ya, Nonaktifkan</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function openDeleteModal(userId) {
            const modal = document.getElementById('deleteModal');
            const form = document.getElementById('deleteForm');
            form.action = `/admin/customers/${userId}`;
            modal.classList.remove('hidden');
        }

        function closeDeleteModal() {
            const modal = document.getElementById('deleteModal');
            modal.classList.add('hidden');
        }

        function openToggleModal(userId, userName) {
            const modal = document.getElementById('toggleModal');
            const form = document.getElementById('toggleModalForm');
            const nameEl = document.getElementById('toggleUserName');
            
            form.action = `/admin/users/${userId}/toggle-status`;
            
            // Format ID like #CUS-XXXX
            const shortId = userId.substring(0, 4).toUpperCase();
            nameEl.innerText = `${userName} (Customer - ID : #CUS-${shortId})`;
            
            modal.classList.remove('hidden');
        }

        function closeToggleModal() {
            const modal = document.getElementById('toggleModal');
            modal.classList.add('hidden');
        }
    </script>
@endsection
