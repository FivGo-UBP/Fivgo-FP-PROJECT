@extends('admin.layout')

@section('content')
<style>
    .reports-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
    }
    .reports-title-box h1 {
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 6px 0;
    }
    .reports-title-box p {
        font-size: 14px;
        color: #64748b;
        margin: 0;
    }
    .reports-filters {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }
    .reports-segments {
        display: inline-flex;
        background: #f1f5f9;
        border-radius: 10px;
        padding: 4px;
        border: 1px solid #e2e8f0;
    }
    .segment-btn {
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 700;
        color: #64748b;
        text-decoration: none;
        border-radius: 7px;
        transition: background-color 150ms ease, color 150ms ease;
    }
    .segment-btn:hover {
        color: #1e293b;
    }
    .segment-btn.active {
        background: #ffffff;
        color: #1e293b;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .filter-select {
        min-height: 40px;
        padding: 0 36px 0 16px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background-color: #ffffff;
        color: #334155;
        font-size: 13px;
        font-weight: 600;
        outline: none;
        cursor: pointer;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 10px center;
        background-repeat: no-repeat;
        background-size: 18px;
        appearance: none;
    }
    .table-container-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
        border: 1px solid #eef2f6;
    }
    .reports-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }
    .reports-table th {
        padding: 16px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        border-bottom: 1px solid #e2e8f0;
        background-color: #f8fafc;
    }
    .reports-table td {
        padding: 16px;
        font-size: 14px;
        color: #334155;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
    }
    .reports-table tr:hover td {
        background-color: #f8fafc;
    }
    .report-id {
        font-weight: 700;
        color: #1e293b;
    }
    .reporter-cell {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .reporter-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        background-color: #cbd5e1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .reporter-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .reporter-avatar span {
        color: #ffffff;
        font-weight: 700;
        font-size: 13px;
    }
    .reporter-name {
        font-weight: 600;
        color: #1e293b;
    }
    .reason-cell {
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #475569;
    }
    .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        padding: 4px 12px;
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        text-transform: uppercase;
    }
    .status-badge.status-open {
        background-color: #fee2e2;
        color: #b91c1c;
    }
    .status-badge.status-in_progress {
        background-color: #fef3c7;
        color: #d97706;
    }
    .status-badge.status-resolved {
        background-color: #d1fae5;
        color: #065f46;
    }
    .btn-action-detail {
        background-color: #f1f5f9;
        color: #334155;
        border: 1px solid #e2e8f0;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: background-color 150ms ease, color 150ms ease;
    }
    .btn-action-detail:hover {
        background-color: #e2e8f0;
        color: #1e293b;
    }
    .btn-tindakan {
        background-color: #1c3c88;
        color: #ffffff;
        border: 1px solid #1c3c88;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: background-color 150ms ease;
    }
    .btn-tindakan:hover {
        background-color: #162e6b;
    }

    /* Tindakan Modal */
    .tindakan-overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(4px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 16px;
    }
    .tindakan-overlay.show {
        display: flex;
    }
    .tindakan-box {
        background: #ffffff;
        border-radius: 20px;
        max-width: 560px;
        width: 100%;
        box-shadow: 0 24px 48px -12px rgba(0,0,0,0.18);
        border: 1px solid #e2e8f0;
        animation: modalFadeIn 200ms ease-out;
        overflow: hidden;
    }
    .tindakan-header {
        padding: 24px 28px 0 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .tindakan-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
    }
    .tindakan-body {
        padding: 20px 28px 28px 28px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .tindakan-radio-group {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
    .tindakan-radio-item {
        display: flex;
        align-items: center;
        gap: 14px;
        cursor: pointer;
    }
    .tindakan-radio-circle {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid #cbd5e1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: border-color 150ms ease, background-color 150ms ease;
    }
    .tindakan-radio-circle.checked {
        background-color: #22c55e;
        border-color: #22c55e;
    }
    .tindakan-radio-circle.checked svg {
        display: block;
    }
    .tindakan-radio-circle svg {
        display: none;
    }
    .tindakan-radio-text strong {
        display: block;
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
    }
    .tindakan-radio-text span {
        font-size: 13px;
        color: #64748b;
    }
    .tindakan-textarea-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .tindakan-textarea-label {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
    }
    .tindakan-textarea {
        width: 100%;
        min-height: 110px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 14px;
        font-size: 14px;
        color: #334155;
        resize: vertical;
        line-height: 1.6;
        font-family: inherit;
        box-sizing: border-box;
        transition: border-color 150ms ease;
        outline: none;
    }
    .tindakan-textarea:focus {
        border-color: #1c3c88;
        box-shadow: 0 0 0 3px rgba(28,60,136,0.08);
    }
    .tindakan-textarea-counter {
        text-align: right;
        font-size: 12px;
        color: #94a3b8;
    }
    .tindakan-info-box {
        display: flex;
        align-items: center;
        gap: 12px;
        background-color: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 10px;
        padding: 14px 16px;
    }
    .tindakan-info-box span {
        font-size: 13.5px;
        font-weight: 600;
        color: #d97706;
        line-height: 1.4;
    }
    .btn-kirim-peringatan {
        width: 100%;
        background-color: #1c3c88;
        color: #ffffff;
        border: none;
        padding: 14px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: background-color 150ms ease;
    }
    .btn-kirim-peringatan:hover {
        background-color: #162e6b;
    }
    .btn-kirim-peringatan:disabled {
        background-color: #94a3b8;
        cursor: not-allowed;
    }
    
    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 999;
        padding: 16px;
    }
    .modal-overlay.show {
        display: flex;
    }
    .modal-box {
        background: #ffffff;
        border-radius: 16px;
        max-width: 580px;
        width: 100%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border: 1px solid #e2e8f0;
        overflow: hidden;
        animation: modalFadeIn 200ms ease-out;
    }
    @keyframes modalFadeIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    .modal-header {
        background-color: #f8fafc;
        padding: 20px 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .modal-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
    }
    .btn-close-modal {
        background: none;
        border: none;
        cursor: pointer;
        color: #94a3b8;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 150ms ease, color 150ms ease;
    }
    .btn-close-modal:hover {
        background-color: #cbd5e1;
        color: #475569;
    }
    .modal-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .modal-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
    .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .info-label {
        font-size: 12px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
    }
    .info-val {
        font-size: 14px;
        font-weight: 600;
        color: #334155;
    }
    .description-box {
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        padding: 16px;
        font-size: 14px;
        color: #334155;
        white-space: pre-wrap;
        line-height: 1.5;
        max-height: 200px;
        overflow-y: auto;
    }
    .modal-footer {
        padding: 20px 24px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: #f8fafc;
    }
    .status-form {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
    }
    .btn-update-status {
        background-color: #1c3c88;
        color: #ffffff;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        transition: background-color 150ms ease;
    }
    .btn-update-status:hover {
        background-color: #162e6b;
    }
    
    /* Pagination Styles */
    .pagination-row {
        display: flex;
        justify-content: center;
        margin-top: 24px;
    }
    .reports-pagination {
        display: inline-flex;
        gap: 8px;
    }
    .pagination-btn {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        background-color: #ffffff;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        text-decoration: none;
        transition: all 150ms ease;
    }
    .pagination-btn:hover {
        border-color: #1e3c88;
        color: #1e3c88;
    }
    .pagination-btn.active {
        background-color: #1c3c88;
        color: #ffffff;
        border-color: #1c3c88;
    }
    .pagination-btn.disabled {
        pointer-events: none;
        opacity: 0.5;
        background-color: #f1f5f9;
        border-color: #e2e8f0;
    }

    /* Redesigned Modal panels */
    .detail-panel-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 24px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
    }
    .panel-card-title {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 20px 0;
    }
    .panel-grid-row {
        display: grid;
        grid-template-columns: 160px 1fr;
        padding: 6px 0;
        align-items: flex-start;
    }
    .panel-row-label {
        font-size: 14px;
        font-weight: 500;
        color: #475569;
    }
    .panel-row-val {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
    }
    .panel-user-header {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .panel-user-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background-color: #cbd5e1;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
        overflow: hidden;
    }
    .panel-user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .panel-user-name {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
    }
    .panel-user-badge {
        font-size: 12px;
        font-weight: 600;
        padding: 2px 10px;
        border-radius: 9999px;
    }
    .customer-badge {
        background-color: #ffedd5;
        color: #ea580c;
    }
    .driver-badge {
        background-color: #dbeafe;
        color: #1e40af;
    }
    .detail-sec-title {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 8px 0;
    }
    .detail-sec-desc {
        font-size: 14px;
        font-weight: 400;
        color: #475569;
        line-height: 1.6;
        margin: 0;
        white-space: pre-wrap;
    }
</style>

<div class="reports-header-row">
    <div class="reports-title-box">
        <h1>Daftar Laporan</h1>
        <p>Kelola dan Tanggapi Kendala {{ ucfirst($role) }}</p>
    </div>
    
    <div class="reports-filters">
        <!-- Segment Switcher -->
        <div class="reports-segments">
            <a href="{{ request()->fullUrlWithQuery(['type' => 'biasa']) }}" class="segment-btn {{ $type === 'biasa' ? 'active' : '' }}">
                Laporan Umum
            </a>
            <a href="{{ request()->fullUrlWithQuery(['type' => 'formulir']) }}" class="segment-btn {{ $type === 'formulir' ? 'active' : '' }}">
                Laporan via Formulir
            </a>
        </div>
        
        <!-- Dropdown Status -->
        <select class="filter-select" onchange="window.location.href = this.value">
            <option value="{{ request()->fullUrlWithQuery(['status' => '']) }}">Semua Status</option>
            <option value="{{ request()->fullUrlWithQuery(['status' => 'open']) }}" {{ request('status') === 'open' ? 'selected' : '' }}>Menunggu</option>
            <option value="{{ request()->fullUrlWithQuery(['status' => 'in_progress']) }}" {{ request('status') === 'in_progress' ? 'selected' : '' }}>Diproses</option>
            <option value="{{ request()->fullUrlWithQuery(['status' => 'resolved']) }}" {{ request('status') === 'resolved' ? 'selected' : '' }}>Selesai</option>
        </select>
        
        <!-- Dropdown Waktu -->
        <select class="filter-select" onchange="window.location.href = this.value">
            <option value="{{ request()->fullUrlWithQuery(['time' => '']) }}">Semua Waktu</option>
            <option value="{{ request()->fullUrlWithQuery(['time' => 'day']) }}" {{ request('time') === 'day' ? 'selected' : '' }}>Hari Ini</option>
            <option value="{{ request()->fullUrlWithQuery(['time' => 'week']) }}" {{ request('time') === 'week' ? 'selected' : '' }}>Minggu Ini</option>
            <option value="{{ request()->fullUrlWithQuery(['time' => 'month']) }}" {{ request('time') === 'month' ? 'selected' : '' }}>Bulan Ini</option>
        </select>
    </div>
</div>

<div class="table-container-card">
    <div style="overflow-x: auto;">
        <table class="reports-table">
            <thead>
                <tr>
                    <th>Id Laporan</th>
                    <th>Tanggal</th>
                    <th>{{ $type === 'formulir' ? 'Pengirim' : 'Pelapor' }}</th>
                    <th>{{ $type === 'formulir' ? 'Kategori' : 'Alasan' }}</th>
                    <th>Status</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                @forelse($reports as $report)
                    @php
                        $shortId = strtoupper(substr($report->id, 0, 4) . substr($report->id, 4, 3));
                        // For formulir reports, extract name from description
                        $displayName = $report->reporter?->name ?: 'Anonim';
                        if ($type === 'formulir' && $report->description) {
                            preg_match('/Nama:\s*(.+)/i', $report->description, $m);
                            if (!empty($m[1])) $displayName = trim($m[1]);
                        }
                    @endphp
                    <tr id="report-row-{{ $report->id }}">
                        <td class="report-id">#{{ $shortId }}</td>
                        <td>{{ $report->created_at?->translatedFormat('d M Y') ?: '-' }}</td>
                        <td>
                            <div class="reporter-cell">
                                <div class="reporter-avatar">
                                    @if($report->reporter && $report->reporter->photo)
                                        <img src="{{ $report->reporter->photo }}" alt="">
                                    @else
                                        <span>{{ strtoupper(substr($displayName, 0, 1)) }}</span>
                                    @endif
                                </div>
                                <span class="reporter-name">{{ $displayName }}</span>
                            </div>
                        </td>
                        <td>
                            <div class="reason-cell" title="{{ $report->reason }}">
                                {{ $report->reason }}
                            </div>
                        </td>
                        <td>
                            @if($report->status === 'open')
                                <span class="status-badge status-open">Menunggu</span>
                            @elseif($report->status === 'in_progress')
                                <span class="status-badge status-in_progress">Diproses</span>
                            @else
                                <span class="status-badge status-resolved">Selesai</span>
                            @endif
                        </td>
                        <td>
                            @php
                                $reporterCustomId = $report->reporter ? (strtoupper(substr($report->reporter->role ?: 'customer', 0, 3)) . '-' . strtoupper(substr($report->reporter->id, 0, 4) . '-' . substr($report->reporter->id, 4, 5))) : '-';
                                $reportedCustomId = $report->reported ? (strtoupper(substr($report->reported->role ?: 'driver', 0, 3)) . '-' . strtoupper(substr($report->reported->id, 0, 4) . '-' . substr($report->reported->id, 4, 5))) : '-';
                                $createdAtTime = $report->created_at ? $report->created_at->translatedFormat('d M, H.i') . ' WIB' : '-';
                            @endphp
                            <button class="btn-action-detail" onclick="openDetailModal({{ json_encode([
                                'id' => $report->id,
                                'type' => $type,
                                'shortId' => $shortId,
                                'tanggal' => $report->created_at?->translatedFormat('d M Y') ?: '-',
                                'created_at_time' => $createdAtTime,
                                'pengirim' => $displayName,
                                'alasan' => $report->reason,
                                'deskripsi' => $report->description ?: 'Tidak ada deskripsi detail.',
                                'status' => $report->status,
                                'order_id' => $report->order_id,
                                'reporter_name' => $report->reporter?->name ?: 'Anonim',
                                'reporter_email' => $report->reporter?->email ?: '-',
                                'reporter_phone' => $report->reporter?->phone ?: '-',
                                'reporter_custom_id' => $reporterCustomId,
                                'reporter_role' => $report->reporter?->role ?: 'customer',
                                'reporter_photo' => $report->reporter?->photo,
                                'reported_name' => $report->reported?->name ?: 'System/Admin',
                                'reported_email' => $report->reported?->email ?: '-',
                                'reported_phone' => $report->reported?->phone ?: '-',
                                'reported_custom_id' => $reportedCustomId,
                                'reported_role' => $report->reported?->role ?: 'admin',
                                'reported_photo' => $report->reported?->photo,
                                'reported_rating' => $report->reported?->driverProfile?->rating ?: null
                            ]) }})">
                                Lihat Detail
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <button class="btn-tindakan" onclick="openTindakanModal({{ json_encode([
                                'id' => $report->id,
                                'shortId' => $shortId,
                                'reported_name' => $report->reported?->name ?: 'Tidak diketahui',
                                'reported_id' => $report->reported?->id ?: null,
                            ]) }})">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Tindakan
                            </button>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" style="text-align: center; color: #94a3b8; padding: 32px 16px;">
                            Tidak ada data laporan yang tersedia.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    
    <!-- Pagination -->
    @if($reports->hasPages())
        <div class="pagination-row">
            <div class="reports-pagination">
                {{-- Previous Page Link --}}
                @if ($reports->onFirstPage())
                    <span class="pagination-btn disabled">&lsaquo;</span>
                @else
                    <a href="{{ $reports->previousPageUrl() }}" class="pagination-btn">&lsaquo;</a>
                @endif

                {{-- Pagination Elements --}}
                @foreach ($reports->getUrlRange(1, $reports->lastPage()) as $page => $url)
                    @if ($page == $reports->currentPage())
                        <span class="pagination-btn active">{{ $page }}</span>
                    @else
                        <a href="{{ $url }}" class="pagination-btn">{{ $page }}</a>
                    @endif
                @endforeach

                {{-- Next Page Link --}}
                @if ($reports->hasMorePages())
                    <a href="{{ $reports->nextPageUrl() }}" class="pagination-btn">&rsaquo;</a>
                @else
                    <span class="pagination-btn disabled">&rsaquo;</span>
                @endif
            </div>
        </div>
    @endif
</div>

<!-- Report Detail Modal -->
<div class="modal-overlay" id="detail-modal" onclick="closeDetailModal(event)">
    <div class="modal-box" onclick="event.stopPropagation()" id="modal-box-element">
        <div class="modal-header">
            <h3 id="modal-title-id">Detail Laporan #LAP-00000</h3>
            <button class="btn-close-modal" onclick="closeDetailModal(event)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <!-- Grid Layout for two columns (Standard for Formulir, will adjust dynamic sizing via JS) -->
        <div class="modal-body" id="modal-body-layout" style="background: #f8fafc; padding: 24px; max-height: calc(85vh - 120px); overflow-y: auto;">
            
            <!-- Left Column: Info Laporan + Pelapor + Terlapor -->
            <div id="modal-left-column" style="display: flex; flex-direction: column; gap: 20px;">
                
                <!-- Card 1: Informasi Laporan -->
                <div class="detail-panel-card">
                    <h4 class="panel-card-title">Informasi Laporan</h4>
                    <div class="panel-grid-row">
                        <span class="panel-row-label">ID Laporan</span>
                        <span class="panel-row-val" id="panel-info-id">#LAP-00000</span>
                    </div>
                    <div class="panel-grid-row">
                        <span class="panel-row-label">Tanggal Laporan</span>
                        <span class="panel-row-val" id="panel-info-date">-</span>
                    </div>
                    <div class="panel-grid-row">
                        <span class="panel-row-label">Status</span>
                        <span id="panel-info-status">
                            <span class="status-badge status-open">Menunggu</span>
                        </span>
                    </div>
                    <div class="panel-grid-row">
                        <span class="panel-row-label">Kategori</span>
                        <span class="panel-row-val" id="panel-info-category">-</span>
                    </div>
                    <div class="panel-grid-row">
                        <span class="panel-row-label">Deskripsi</span>
                        <span class="panel-row-val" id="panel-info-short-desc">-</span>
                    </div>
                </div>

                <!-- Card 2: Pelapor & Terlapor Combined -->
                <div class="detail-panel-card">
                    <!-- Pelapor section -->
                    <div id="panel-section-pelapor">
                        <h4 class="panel-card-title">Pelapor</h4>
                        <div class="panel-user-header" style="margin-bottom: 20px;">
                            <div class="panel-user-avatar" id="panel-pelapor-avatar">-</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span class="panel-user-name" id="panel-pelapor-name">-</span>
                                <span class="panel-user-badge customer-badge" id="panel-pelapor-badge">Customer</span>
                            </div>
                        </div>
                        <div class="panel-grid-row">
                            <span class="panel-row-label">ID Pengguna</span>
                            <span class="panel-row-val" id="panel-pelapor-id">-</span>
                        </div>
                        <div class="panel-grid-row">
                            <span class="panel-row-label">Email</span>
                            <span class="panel-row-val" id="panel-pelapor-email">-</span>
                        </div>
                        <div class="panel-grid-row">
                            <span class="panel-row-label">No - Telpon</span>
                            <span class="panel-row-val" id="panel-pelapor-phone">-</span>
                        </div>
                    </div>

                    <!-- Divider -->
                    <hr id="panel-users-divider" style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">

                    <!-- Terlapor section -->
                    <div id="panel-section-terlapor">
                        <h4 class="panel-card-title">Terlapor</h4>
                        <div class="panel-user-header" style="margin-bottom: 20px;">
                            <div class="panel-user-avatar" id="panel-terlapor-avatar">-</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span class="panel-user-name" id="panel-terlapor-name">-</span>
                                <span class="panel-user-badge driver-badge">Driver</span>
                            </div>
                        </div>
                        <div class="panel-grid-row">
                            <span class="panel-row-label">ID Pengguna</span>
                            <span class="panel-row-val" id="panel-terlapor-id">-</span>
                        </div>
                        <div class="panel-grid-row">
                            <span class="panel-row-label">Email</span>
                            <span class="panel-row-val" id="panel-terlapor-email">-</span>
                        </div>
                        <div class="panel-grid-row">
                            <span class="panel-row-label">No - Telpon</span>
                            <span class="panel-row-val" id="panel-terlapor-phone">-</span>
                        </div>
                        <div class="panel-grid-row">
                            <span class="panel-row-label">Rating</span>
                            <span class="panel-row-val" id="panel-terlapor-rating">-</span>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Right Column: Detail Laporan -->
            <div id="modal-right-column" style="display: flex; flex-direction: column; gap: 20px;">
                
                <!-- Card 3: Detail Laporan -->
                <div class="detail-panel-card" style="height: 100%; display: flex; flex-direction: column;">
                    <h4 class="panel-card-title" style="margin-bottom: 20px;">Detail Laporan</h4>
                    
                    <div style="margin-bottom: 24px;">
                        <h5 class="detail-sec-title">Deskripsi Laporan</h5>
                        <p class="detail-sec-desc" id="panel-detail-desc">-</p>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <h5 class="detail-sec-title">Waktu Kejadian</h5>
                        <p class="detail-sec-desc" id="panel-detail-time">-</p>
                    </div>

                    <div>
                        <h5 class="detail-sec-title">No Booking</h5>
                        <p class="detail-sec-desc" id="panel-detail-booking">-</p>
                    </div>
                </div>

            </div>

        </div>
        
        <div class="modal-footer">
            <!-- Update Status Form -->
            <form id="status-update-form" method="POST" action="" class="status-form">
                @csrf
                <select name="status" id="modal-status-select" class="filter-select" style="min-height: 38px; width: 160px;">
                    <option value="open">Menunggu</option>
                    <option value="in_progress">Diproses</option>
                    <option value="resolved">Selesai</option>
                </select>
                <button type="submit" class="btn-update-status">Simpan Status</button>
            </form>
            
            <!-- Delete Form -->
            <form id="delete-report-form" method="POST" action="" onsubmit="return confirm('Apakah Anda yakin ingin menghapus laporan ini?');">
                @csrf
                @method('DELETE')
                <button type="submit" class="btn-action-detail" style="background-color: #fee2e2; color: #b91c1c; border-color: #fca5a5; padding: 10px 16px;">
                    Hapus
                </button>
            </form>
        </div>
    </div>
</div>

<!-- Tindakan Admin Modal -->
<div class="tindakan-overlay" id="tindakan-modal" onclick="closeTindakanModal(event)">
    <div class="tindakan-box" onclick="event.stopPropagation()">
        <div class="tindakan-header">
            <h3>Tindakan Admin</h3>
            <button class="btn-close-modal" onclick="closeTindakanModal(event)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="tindakan-body">

            <!-- Radio Options -->
            <div class="tindakan-radio-group">
                <label class="tindakan-radio-item" onclick="selectTindakan('terima')">
                    <div class="tindakan-radio-circle checked" id="radio-terima">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#ffffff" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div class="tindakan-radio-text">
                        <strong>Terima Laporan</strong>
                        <span>Laporan valid, berikan peringatan kepada terlapor.</span>
                    </div>
                </label>
                <label class="tindakan-radio-item" onclick="selectTindakan('tolak')">
                    <div class="tindakan-radio-circle" id="radio-tolak">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#ffffff" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div class="tindakan-radio-text">
                        <strong>Tolak Laporan</strong>
                        <span>Laporan tidak valid atau tidak terbukti.</span>
                    </div>
                </label>
            </div>

            <!-- Pesan Peringatan Textarea -->
            <div class="tindakan-textarea-wrap">
                <label class="tindakan-textarea-label" for="pesan-peringatan">Pesan Peringatan</label>
                <textarea
                    id="pesan-peringatan"
                    class="tindakan-textarea"
                    maxlength="500"
                    oninput="updatePesanCounter()"
                    placeholder="Tulis pesan peringatan untuk terlapor..."
                ></textarea>
                <div class="tindakan-textarea-counter"><span id="pesan-counter">0</span>/500</div>
            </div>

            <!-- Info Box -->
            <div class="tindakan-info-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706" stroke-width="2" style="flex-shrink:0;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Peringatan akan dikirim sebagai notifikasi langsung ke aplikasi akun terlapor</span>
            </div>

            <!-- Submit Button -->
            <button class="btn-kirim-peringatan" id="btn-kirim-peringatan" onclick="submitTindakan()">
                Kirim Peringatan
            </button>
        </div>
    </div>
</div>

<script>
    function parseChatbotDesc(descText) {
        const katMatch = descText.match(/Kategori Masalah:\s*(.+)/i);
        const jenisMatch = descText.match(/Jenis Masalah \(Level 2\):\s*(.+)/i);
        const detailMatch = descText.match(/Detail Kejadian \(Level 3\):\s*(.+)/i);
        const tambahanMatch = descText.match(/Detail Tambahan dari User:\s*(.+)/i);
        const orderMatch = descText.match(/-\s*Order\s*ID:\s*([A-Za-z0-9\-]+)/i);
        const tujuanMatch = descText.match(/-\s*Tujuan:\s*(.+)/i);
        const jemputMatch = descText.match(/-\s*Penjemputan:\s*(.+)/i);
        const waktuMatch = descText.match(/-\s*Waktu:\s*(.+)/i);
        const tarifMatch = descText.match(/-\s*Tarif:\s*(.+)/i);
        const bayarMatch = descText.match(/-\s*Metode\s*Pembayaran:\s*(.+)/i);
        const kendaraanMatch = descText.match(/-\s*Jenis\s*Kendaraan:\s*(.+)/i);

        if (katMatch || jenisMatch || detailMatch) {
            return {
                isChatbot: true,
                kategori: katMatch ? katMatch[1].trim() : '',
                jenisMasalah: jenisMatch ? jenisMatch[1].trim() : '',
                detailKejadian: detailMatch ? detailMatch[1].trim() : '',
                tambahan: tambahanMatch ? tambahanMatch[1].trim() : '',
                orderId: orderMatch ? orderMatch[1].trim() : '',
                tujuan: tujuanMatch ? tujuanMatch[1].trim() : '',
                penjemputan: jemputMatch ? jemputMatch[1].trim() : '',
                waktu: waktuMatch ? waktuMatch[1].trim() : '',
                tarif: tarifMatch ? tarifMatch[1].trim() : '',
                pembayaran: bayarMatch ? bayarMatch[1].trim() : '',
                kendaraan: kendaraanMatch ? kendaraanMatch[1].trim() : ''
            };
        }
        return { isChatbot: false };
    }

    function openDetailModal(data) {
        document.getElementById('modal-title-id').innerText = 'Detail Laporan #' + data.shortId;

        const isFormulir = data.type === 'formulir';
        const desc = data.deskripsi || '';
        const parsed = parseChatbotDesc(desc);
        // Kolom kanan hanya untuk laporan formulir; laporan umum selalu single-column
        const isChatbot = false;

        const box = document.getElementById('modal-box-element');
        const bodyLayout = document.getElementById('modal-body-layout');
        const rightCol = document.getElementById('modal-right-column');
        const leftCol = document.getElementById('modal-left-column');

        if (isFormulir) {
            // 2-column layout: left column (info+users) | right column (detail)
            box.style.maxWidth = '1000px';
            bodyLayout.style.display = 'grid';
            bodyLayout.style.gridTemplateColumns = '1.1fr 1fr';
            bodyLayout.style.gap = '24px';
            rightCol.style.display = 'flex';
            // Left column: stack cards vertically
            leftCol.style.display = 'flex';
            leftCol.style.flexDirection = 'column';
            leftCol.style.gap = '20px';
        } else {
            // Biasa: wider modal, cards side by side inside the (full-width) left column
            box.style.maxWidth = '900px';
            bodyLayout.style.display = 'flex';
            bodyLayout.style.flexDirection = 'column';
            bodyLayout.style.gap = '0';
            rightCol.style.display = 'none';
            // Left column: 2 cards side by side
            leftCol.style.display = 'grid';
            leftCol.style.gridTemplateColumns = '1fr 1fr';
            leftCol.style.gap = '20px';
        }

        // Set ID & Date
        document.getElementById('panel-info-id').innerText = '#' + data.shortId;
        document.getElementById('panel-info-date').innerText = data.created_at_time;

        // Status Badge
        let statusHtml = '';
        if (data.status === 'open') {
            statusHtml = '<span class="status-badge status-open" style="background-color: #fee2e2; color: #ef4444; border-radius: 9999px; padding: 4px 12px; font-size: 12px; font-weight: 600; text-transform: lowercase;">menunggu</span>';
        } else if (data.status === 'in_progress') {
            statusHtml = '<span class="status-badge status-in_progress" style="background-color: #fef3c7; color: #f59e0b; border-radius: 9999px; padding: 4px 12px; font-size: 12px; font-weight: 600; text-transform: lowercase;">diproses</span>';
        } else {
            statusHtml = '<span class="status-badge status-resolved" style="background-color: #d1fae5; color: #10b981; border-radius: 9999px; padding: 4px 12px; font-size: 12px; font-weight: 600; text-transform: lowercase;">selesai</span>';
        }
        document.getElementById('panel-info-status').innerHTML = statusHtml;

        // Parse description details for category title and description
        let category = data.alasan.replace(/^Masalah:\s*/i, '');
        let shortDesc = desc;
        let detailDesc = desc;

        const namaMatch = desc.match(/Nama:\s*(.+)/i);
        const telpMatch = desc.match(/Nomor Hp:\s*(.+)/i);
        const descMatch = desc.match(/Detail Tambahan\s*(?:\(Formulir\))?:\s*([\s\S]+)/i) || desc.match(/Deskripsi:\s*([\s\S]+)/i);

        let parsedNama = namaMatch ? namaMatch[1].trim() : (data.pengirim || 'Anonim');
        let parsedTelp = telpMatch ? telpMatch[1].trim() : (data.reporter_phone || '-');

        if (descMatch) {
            detailDesc = descMatch[1].trim();
            shortDesc = detailDesc.split('\n')[0];
        } else {
            shortDesc = desc.substring(0, 70) + (desc.length > 70 ? '...' : '');
        }

        // Clean up Detail Perjalanan from detailDesc if present for Formulir reports
        let detailDescClean = detailDesc;
        const tripIndex = detailDesc.indexOf('--- Detail Perjalanan ---');
        if (tripIndex !== -1) {
            detailDescClean = detailDesc.substring(0, tripIndex).trim();
        }

        document.getElementById('panel-info-category').innerText = category;
        
        if (!isFormulir) {
            // Untuk laporan umum: tampilkan detail kejadian jika chatbot, atau shortDesc
            const parsedForDesc = parseChatbotDesc(desc);
            if (parsedForDesc.isChatbot && parsedForDesc.detailKejadian) {
                document.getElementById('panel-info-short-desc').innerText = parsedForDesc.detailKejadian;
            } else {
                document.getElementById('panel-info-short-desc').innerText = shortDesc || desc.substring(0, 100);
            }
        } else {
            document.getElementById('panel-info-short-desc').innerText = shortDesc;
        }

        // Pelapor Details
        document.getElementById('panel-pelapor-name').innerText = parsedNama;
        document.getElementById('panel-pelapor-id').innerText = data.reporter_custom_id || '-';
        document.getElementById('panel-pelapor-email').innerText = data.reporter_email || '-';
        document.getElementById('panel-pelapor-phone').innerText = parsedTelp;

        const pAvatar = document.getElementById('panel-pelapor-avatar');
        pAvatar.className = 'panel-user-avatar';
        if (data.reporter_photo) {
            pAvatar.innerHTML = `<img src="${data.reporter_photo}">`;
        } else {
            pAvatar.innerHTML = '';
            pAvatar.innerText = parsedNama.substring(0, 1).toUpperCase();
        }

        // Set role badge label for Pelapor
        const pBadge = document.getElementById('panel-pelapor-badge');
        if (pBadge) {
            const pRole = (data.reporter_role || 'customer').toLowerCase();
            if (pRole === 'driver') {
                pBadge.className = 'panel-user-badge driver-badge';
                pBadge.innerText = 'Driver';
            } else {
                pBadge.className = 'panel-user-badge customer-badge';
                pBadge.innerText = 'Customer';
            }
        }

        // Terlapor Details (Shown for driver reports or when reported is a driver/customer)
        const reportedRole = data.reported_role;
        if (reportedRole === 'driver' || reportedRole === 'customer') {
            document.getElementById('panel-section-terlapor').style.display = '';
            document.getElementById('panel-users-divider').style.display = '';
            document.getElementById('panel-terlapor-name').innerText = data.reported_name;
            document.getElementById('panel-terlapor-id').innerText = data.reported_custom_id || '-';
            document.getElementById('panel-terlapor-email').innerText = data.reported_email || '-';
            document.getElementById('panel-terlapor-phone').innerText = data.reported_phone || '-';

            const badgeSpan = document.querySelector('#panel-section-terlapor .panel-user-badge');
            if (badgeSpan) {
                if (reportedRole === 'customer') {
                    badgeSpan.className = 'panel-user-badge customer-badge';
                    badgeSpan.innerText = 'Customer';
                } else {
                    badgeSpan.className = 'panel-user-badge driver-badge';
                    badgeSpan.innerText = 'Driver';
                }
            }

            if (reportedRole === 'driver') {
                document.getElementById('panel-terlapor-rating').parentNode.style.display = '';
                document.getElementById('panel-terlapor-rating').innerHTML = (data.reported_rating ? parseFloat(data.reported_rating).toFixed(1) : '4.8') + ' <span style="color: #fbbf24; font-size: 14px;">★</span>';
            } else {
                document.getElementById('panel-terlapor-rating').parentNode.style.display = 'none';
            }

            const tAvatar = document.getElementById('panel-terlapor-avatar');
            tAvatar.className = 'panel-user-avatar';
            if (data.reported_photo) {
                tAvatar.innerHTML = `<img src="${data.reported_photo}">`;
            } else {
                tAvatar.innerHTML = '';
                tAvatar.innerText = data.reported_name.substring(0, 1).toUpperCase();
            }
        } else {
            document.getElementById('panel-section-terlapor').style.display = 'none';
            document.getElementById('panel-users-divider').style.display = 'none';
        }

        // Right Column Detail Card (Shown for Formulir or Chatbot)
        if (isFormulir || isChatbot) {
            if (isChatbot) {
                let chatbotHtml = `
                    <div style="display: flex; flex-direction: column; gap: 14px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                        <div>
                            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Kategori Chatbot</span>
                            <span style="font-size: 14px; font-weight: 700; color: #1e293b;">${parsed.kategori}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Jenis Masalah (Level 2)</span>
                            <span style="font-size: 14px; font-weight: 600; color: #334155;">${parsed.jenisMasalah}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Detail Kejadian (Level 3)</span>
                            <span style="font-size: 14px; font-weight: 700; color: #ea580c; background-color: #fff7ed; padding: 4px 8px; border-radius: 6px; border: 1px solid #ffedd5; display: inline-block;">${parsed.detailKejadian}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Detail Tambahan</span>
                            <span style="font-size: 13px; font-style: italic; color: #475569;">${parsed.tambahan}</span>
                        </div>
                    </div>
                `;

                if (parsed.orderId) {
                    chatbotHtml += `
                        <h5 class="detail-sec-title" style="margin-top: 24px; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #1e293b;">Detail Perjalanan</h5>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <div>
                                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Penjemputan</span>
                                <span style="font-size: 13px; font-weight: 600; color: #334155; line-height: 1.4;">${parsed.penjemputan}</span>
                            </div>
                            <div>
                                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Tujuan</span>
                                <span style="font-size: 13px; font-weight: 600; color: #334155; line-height: 1.4;">${parsed.tujuan}</span>
                            </div>
                            <div>
                                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Tarif</span>
                                <span style="font-size: 13px; font-weight: 700; color: #16a34a;">${parsed.tarif}</span>
                            </div>
                            <div>
                                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Metode Pembayaran</span>
                                <span style="font-size: 13px; font-weight: 700; color: #2563eb;">${parsed.pembayaran}</span>
                            </div>
                            <div>
                                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Jenis Kendaraan</span>
                                <span style="font-size: 13px; font-weight: 600; color: #334155;">${parsed.kendaraan}</span>
                            </div>
                        </div>
                    `;
                }

                document.getElementById('panel-detail-desc').innerHTML = chatbotHtml;
                document.getElementById('panel-detail-time').innerText = parsed.waktu || data.created_at_time;
                document.getElementById('panel-detail-booking').innerText = parsed.orderId ? '#' + parsed.orderId.substring(0, 8).toUpperCase() : '-';
            } else {
                document.getElementById('panel-detail-desc').innerText = detailDescClean;
                document.getElementById('panel-detail-time').innerText = data.created_at_time;
                document.getElementById('panel-detail-booking').innerText = data.order_id ? '#' + data.order_id.substring(0, 8).toUpperCase() : '-';
            }
        }

        // Select Status Select option value
        document.getElementById('modal-status-select').value = data.status;

        // Set Form Actions
        const updateUrl = "{{ route('admin.reports.status.update', ':id') }}".replace(':id', data.id);
        document.getElementById('status-update-form').action = updateUrl;

        const deleteUrl = "{{ route('admin.reports.destroy', ':id') }}".replace(':id', data.id);
        document.getElementById('delete-report-form').action = deleteUrl;

        // Open Overlay
        document.getElementById('detail-modal').classList.add('show');
    }



    function closeDetailModal(event) {
        document.getElementById('detail-modal').classList.remove('show');
    }

    // ======== Tindakan Admin Modal ========
    let currentTindakanReportId = null;
    let currentTindakanReportedId = null;
    let currentTindakanAction = 'terima';

    function openTindakanModal(data) {
        currentTindakanReportId = data.id;
        currentTindakanReportedId = data.reported_id;
        currentTindakanAction = 'terima';

        // Reset state
        selectTindakan('terima');

        // Reset textarea to empty (placeholder only)
        const textarea = document.getElementById('pesan-peringatan');
        textarea.value = '';
        updatePesanCounter();

        document.getElementById('tindakan-modal').classList.add('show');
    }

    function closeTindakanModal(event) {
        document.getElementById('tindakan-modal').classList.remove('show');
    }

    function selectTindakan(action) {
        currentTindakanAction = action;
        const radioTerima = document.getElementById('radio-terima');
        const radioTolak = document.getElementById('radio-tolak');

        if (action === 'terima') {
            radioTerima.classList.add('checked');
            radioTolak.classList.remove('checked');
        } else {
            radioTolak.classList.add('checked');
            radioTerima.classList.remove('checked');
        }
    }

    function updatePesanCounter() {
        const textarea = document.getElementById('pesan-peringatan');
        document.getElementById('pesan-counter').innerText = textarea.value.length;
    }

    function submitTindakan() {
        const pesan = document.getElementById('pesan-peringatan').value.trim();
        if (!pesan) {
            alert('Pesan peringatan tidak boleh kosong.');
            return;
        }

        const btn = document.getElementById('btn-kirim-peringatan');
        btn.disabled = true;
        btn.innerText = 'Mengirim...';

        fetch('{{ route("admin.reports.tindakan") }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            body: JSON.stringify({
                report_id: currentTindakanReportId,
                reported_id: currentTindakanReportedId,
                action: currentTindakanAction,
                message: pesan
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeTindakanModal();
                alert('Tindakan berhasil dikirim!');
                window.location.reload();
            } else {
                alert(data.message || 'Gagal mengirim tindakan.');
                btn.disabled = false;
                btn.innerText = 'Kirim Peringatan';
            }
        })
        .catch(() => {
            alert('Terjadi kesalahan. Silakan coba lagi.');
            btn.disabled = false;
            btn.innerText = 'Kirim Peringatan';
        });
    }
</script>
@endsection
