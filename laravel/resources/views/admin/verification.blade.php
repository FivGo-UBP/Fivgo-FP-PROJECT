@extends('admin.layout')

@section('subtitle', 'Tinjau dan setujui pengajuan perubahan data profil driver.')

@section('content')
    <style>
        .filter-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 16px;
        }
        .filter-tabs a {
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            color: #4b5563;
            font-size: 14px;
            font-weight: 500;
            background: #f3f4f6;
            transition: all 0.2s;
        }
        .filter-tabs a:hover {
            background: #e5e7eb;
        }
        .filter-tabs a.active {
            background: #2563eb;
            color: white;
        }
        
        .detail-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
        }
        .detail-modal-overlay.show {
            display: flex;
        }
        .detail-modal {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 650px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .detail-modal-header {
            padding: 16px 24px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .detail-modal-header h3 { margin: 0; font-size: 18px; color: #111827; }
        .detail-modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #9ca3af; transition: color 0.2s; }
        .detail-modal-close:hover { color: #111827; }
        .detail-modal-body {
            padding: 24px;
            overflow-y: auto;
        }
        .detail-modal-footer {
            padding: 16px 24px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            background: #f9fafb;
        }
        .comparison-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-top: 16px;
        }
        .comparison-col {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .comparison-col h4 {
            margin-top: 0;
            margin-bottom: 12px;
            font-size: 13px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .detail-img { width: 100%; border-radius: 6px; object-fit: contain; max-height: 250px; background: #e5e7eb; margin-bottom: 12px; }
        .info-block { margin-bottom: 16px; }
        .info-block label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .info-block div { font-size: 15px; color: #111827; font-weight: 500; }
    </style>

    <section class="status-summary-grid">
        <article><span>PENDING</span><strong>{{ $pendingCount }}</strong></article>
        <article><span>APPROVED</span><strong>{{ $approvedCount }}</strong></article>
        <article><span>REJECTED</span><strong>{{ $rejectedCount }}</strong></article>
    </section>

    <section class="table-card">
        <div class="section-heading" style="margin-bottom: 12px;">
            <div>
                <h2>Daftar Pengajuan</h2>
                <p>Daftar pengajuan perubahan data profil dari driver yang masuk ke sistem.</p>
            </div>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
            @php $currentType = $currentType ?? null; @endphp
            <a href="{{ route('admin.verification') }}" class="{{ !$currentType ? 'active' : '' }}">Semua</a>
            <a href="{{ route('admin.verification', ['type' => 'foto']) }}" class="{{ $currentType === 'foto' ? 'active' : '' }}">Foto Profil</a>
            <a href="{{ route('admin.verification', ['type' => 'telepon']) }}" class="{{ $currentType === 'telepon' ? 'active' : '' }}">Nomor Telepon</a>
            <a href="{{ route('admin.verification', ['type' => 'kendaraan']) }}" class="{{ $currentType === 'kendaraan' ? 'active' : '' }}">Kendaraan</a>
            <a href="{{ route('admin.verification', ['type' => 'delete']) }}" class="{{ $currentType === 'delete' ? 'active' : '' }}">Hapus Akun</a>
        </div>

        <div class="table-scroll">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Driver</th>
                        <th>Jenis Pengajuan</th>
                        <th>Status</th>
                        <th>Tanggal Pengajuan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($documents as $req)
                        <tr>
                            <td>
                                <strong>{{ $req->user?->name ?: 'Driver FivGo' }}</strong><br>
                                <span style="font-size: 12px; color: #6b7280;">{{ $req->user?->phone }}</span>
                            </td>
                            <td>
                                @if($req->type === 'foto')
                                    <span class="status-pill status-info" style="background:#e0f2fe; color:#0369a1;">Foto Profil</span>
                                @elseif($req->type === 'telepon')
                                    <span class="status-pill status-warning" style="background:#fef3c7; color:#b45309;">Nomor Telepon</span>
                                @elseif($req->type === 'kendaraan')
                                    <span class="status-pill status-primary" style="background:#e0e7ff; color:#4338ca;">Kendaraan</span>
                                @elseif($req->type === 'delete')
                                    <span class="status-pill status-danger" style="background:#fee2e2; color:#b91c1c;">Hapus Akun</span>
                                @else
                                    <span class="status-pill">{{ strtoupper($req->type) }}</span>
                                @endif
                            </td>
                            <td><span class="status-pill status-{{ $req->status }}">{{ strtoupper($req->status) }}</span></td>
                            <td>{{ $req->created_at?->format('d M Y H:i') }}</td>
                            <td>
                                <button type="button" class="action-button info" onclick="openDetailModal('{{ $req->id }}')" style="padding: 6px 12px; font-size: 12px; font-weight: 500; background: #eff6ff; color: #2563eb; border-radius: 6px; border: 1px solid #bfdbfe; cursor: pointer;">
                                    Lihat Detail
                                </button>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="empty-table">Belum ada pengajuan perubahan data driver.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="pagination-wrap">
            {{ $documents->links() }}
        </div>
    </section>

    <!-- Modals -->
    @foreach ($documents as $req)
        <div id="modal-{{ $req->id }}" class="detail-modal-overlay">
            <div class="detail-modal">
                <div class="detail-modal-header">
                    <h3>Detail Pengajuan: 
                        @if($req->type === 'foto') Foto Profil
                        @elseif($req->type === 'telepon') Nomor Telepon
                        @elseif($req->type === 'kendaraan') Kendaraan
                        @elseif($req->type === 'delete') Hapus Akun
                        @else {{ strtoupper($req->type) }}
                        @endif
                    </h3>
                    <button type="button" class="detail-modal-close" onclick="closeDetailModal('{{ $req->id }}')">&times;</button>
                </div>
                <div class="detail-modal-body">
                    
                    <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 16px; background: #f3f4f6; padding: 16px; border-radius: 8px;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #d1d5db; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #4b5563;">
                            {{ substr($req->user?->name ?: 'D', 0, 1) }}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #111827; font-size: 16px;">{{ $req->user?->name ?: 'Driver FivGo' }}</div>
                            <div style="color: #6b7280; font-size: 14px;">{{ $req->user?->phone }}</div>
                        </div>
                    </div>

                    <div class="comparison-grid">
                        <div class="comparison-col">
                            <h4>Data Saat Ini</h4>
                            @if($req->type === 'foto')
                                @if(!empty($req->old_data['photo']))
                                    <img src="{{ filter_var($req->old_data['photo'], FILTER_VALIDATE_URL) ? $req->old_data['photo'] : asset($req->old_data['photo']) }}" alt="Old Photo" class="detail-img">
                                @else
                                    <div style="color: #9ca3af; font-style: italic;">Tidak ada foto sebelumnya</div>
                                @endif
                            @elseif($req->type === 'telepon')
                                <div class="info-block">
                                    <label>Nomor Telepon Lama</label>
                                    <div>{{ $req->old_data['telepon'] ?? '-' }}</div>
                                </div>
                            @elseif($req->type === 'kendaraan')
                                <div class="info-block">
                                    <label>Jenis Kendaraan</label>
                                    <div>{{ $req->old_data['tipe_kendaraan'] ?? '-' }}</div>
                                </div>
                                <div class="info-block">
                                    <label>Merk Kendaraan</label>
                                    <div>{{ $req->old_data['merk_kendaraan'] ?? $req->old_data['vehicle_brand'] ?? '-' }}</div>
                                </div>
                                <div class="info-block">
                                    <label>Plat Nomor</label>
                                    <div>{{ $req->old_data['plat_kendaraan'] ?? '-' }}</div>
                                </div>
                            @elseif($req->type === 'delete')
                                <div style="color: #9ca3af; font-style: italic;">Akun saat ini aktif.</div>
                            @endif
                        </div>

                        <div class="comparison-col" style="border-color: #bfdbfe; background: #eff6ff;">
                            <h4 style="color: #1e40af;">Pengajuan Baru</h4>
                            @if($req->type === 'foto')
                                @if(!empty($req->new_data['photo']))
                                    <a href="{{ asset($req->new_data['photo']) }}" target="_blank" title="Klik untuk ukuran penuh">
                                        <img src="{{ asset($req->new_data['photo']) }}" alt="New Photo" class="detail-img" style="border: 2px solid #3b82f6;">
                                    </a>
                                @endif
                            @elseif($req->type === 'telepon')
                                <div class="info-block">
                                    <label style="color: #3b82f6;">Nomor Telepon Baru</label>
                                    <div style="color: #1e40af; font-size: 18px;">{{ $req->new_data['telepon'] ?? '-' }}</div>
                                </div>
                            @elseif($req->type === 'kendaraan')
                                <div class="info-block">
                                    <label style="color: #3b82f6;">Jenis Kendaraan Baru</label>
                                    <div style="color: #1e40af;">{{ $req->new_data['tipe_kendaraan'] ?? '-' }}</div>
                                </div>
                                <div class="info-block">
                                    <label style="color: #3b82f6;">Merk Kendaraan Baru</label>
                                    <div style="color: #1e40af;">{{ $req->new_data['merk_kendaraan'] ?? $req->new_data['vehicle_brand'] ?? '-' }}</div>
                                </div>
                                <div class="info-block">
                                    <label style="color: #3b82f6;">Plat Nomor Baru</label>
                                    <div style="color: #1e40af;">{{ $req->new_data['plat_kendaraan'] ?? '-' }}</div>
                                </div>
                                @if(!empty($req->new_data['stnk']))
                                    <div style="margin-top: 16px;">
                                        <label style="display:block; font-size: 12px; color: #3b82f6; margin-bottom: 8px;">Foto STNK Baru</label>
                                        <a href="{{ asset($req->new_data['stnk']) }}" target="_blank">
                                            <img src="{{ asset($req->new_data['stnk']) }}" alt="New STNK" class="detail-img">
                                        </a>
                                    </div>
                                @endif
                            @elseif($req->type === 'delete')
                                <div class="info-block">
                                    <label style="color: #ef4444;">Alasan Penghapusan</label>
                                    <div style="color: #b91c1c;">{{ $req->new_data['reason'] ?? '-' }}</div>
                                </div>
                                @if(!empty($req->notes))
                                    <div class="info-block">
                                        <label style="color: #ef4444;">Catatan Tambahan</label>
                                        <div style="color: #b91c1c; font-weight: normal;">{{ $req->notes }}</div>
                                    </div>
                                @endif
                            @endif
                        </div>
                    </div>

                </div>
                <div class="detail-modal-footer">
                    @if($req->status === 'pending')
                        <form action="{{ route('admin.verification.reject', $req->id) }}" method="POST" style="margin: 0;">
                            @csrf
                            <button type="submit" onclick="return confirm('Tolak pengajuan ini?');" style="padding: 10px 20px; font-size: 14px; font-weight: 500; background: white; color: #ef4444; border-radius: 6px; border: 1px solid #fca5a5; cursor: pointer; transition: all 0.2s;">
                                Tolak
                            </button>
                        </form>
                        <form action="{{ route('admin.verification.approve', $req->id) }}" method="POST" style="margin: 0;">
                            @csrf
                            <button type="submit" onclick="return confirm('Setujui pengajuan ini?');" style="padding: 10px 20px; font-size: 14px; font-weight: 500; background: #10b981; color: white; border-radius: 6px; border: none; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                Setujui
                            </button>
                        </form>
                    @else
                        <button type="button" onclick="closeDetailModal('{{ $req->id }}')" style="padding: 10px 20px; font-size: 14px; font-weight: 500; background: white; color: #374151; border-radius: 6px; border: 1px solid #d1d5db; cursor: pointer;">
                            Tutup
                        </button>
                    @endif
                </div>
            </div>
        </div>
    @endforeach

    <script>
        function openDetailModal(id) {
            document.getElementById('modal-' + id).classList.add('show');
            document.body.style.overflow = 'hidden'; // prevent scrolling
        }
        function closeDetailModal(id) {
            document.getElementById('modal-' + id).classList.remove('show');
            document.body.style.overflow = '';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('detail-modal-overlay')) {
                event.target.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
    </script>
@endsection
