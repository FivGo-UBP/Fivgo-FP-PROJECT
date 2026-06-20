@extends('admin.layout')

@section('actions')
    <a href="{{ route('admin.promo.create') }}" class="btn-add-promo">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Tambah Promo
    </a>
@endsection

@section('content')
<style>
    .btn-add-promo {
        background-color: #f59514;
        color: #ffffff;
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
        border-radius: 8px;
        padding: 10px 16px;
        display: inline-flex;
        align-items: center;
        transition: background-color 150ms ease, transform 150ms ease;
        box-shadow: 0 4px 10px rgba(245, 149, 20, 0.25);
    }
    .btn-add-promo:hover {
        background-color: #e0830c;
        transform: translateY(-1px);
        color: #ffffff;
    }
    .promo-container {
        padding: 8px 0 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .promo-card {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
        border: 1px solid #eef2f6;
        padding: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        transition: transform 150ms ease, box-shadow 150ms ease;
    }
    .promo-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03);
    }
    .promo-card-left {
        display: flex;
        align-items: center;
        gap: 20px;
        flex: 1;
    }
    .promo-img-wrapper {
        width: 100px;
        height: 100px;
        border-radius: 8px;
        overflow: hidden;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e2e8f0;
        flex-shrink: 0;
    }
    .promo-img-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .promo-img-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #94a3b8;
        font-size: 10px;
        font-weight: 700;
        text-align: center;
        padding: 4px;
    }
    .promo-img-placeholder svg {
        width: 32px;
        height: 32px;
        margin-bottom: 4px;
        stroke: #cbd5e1;
    }
    .promo-card-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .promo-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }
    .promo-title {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
        line-height: 1.3;
    }
    .promo-meta-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        font-size: 14px;
        color: #64748b;
    }
    .promo-date-box {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .promo-date-box svg {
        color: #94a3b8;
    }
    .promo-status-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        padding: 2px 10px;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        text-transform: capitalize;
    }
    .promo-status-pill.status-active {
        background-color: #d1fae5;
        color: #065f46;
    }
    .promo-status-pill.status-expired {
        background-color: #e2e8f0;
        color: #475569;
    }
    .promo-desc {
        font-size: 14px;
        color: #64748b;
        margin: 4px 0 0 0;
        line-height: 1.5;
    }
    .promo-card-right {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-shrink: 0;
    }
    .promo-action-btn {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        transition: background-color 150ms ease, color 150ms ease, transform 150ms ease;
    }
    .promo-action-btn:active {
        transform: scale(0.95);
    }
    .promo-action-btn.btn-edit {
        background-color: #eff6ff;
        color: #1d4ed8;
    }
    .promo-action-btn.btn-edit:hover {
        background-color: #dbeafe;
        color: #1e40af;
    }
    .promo-action-btn.btn-delete {
        background-color: #fef2f2;
        color: #b91c1c;
    }
    .promo-action-btn.btn-delete:hover {
        background-color: #fee2e2;
        color: #991b1b;
    }
    .empty-state {
        text-align: center;
        padding: 48px 24px;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #eef2f6;
    }
    .empty-state svg {
        color: #cbd5e1;
        margin-bottom: 16px;
    }
    .empty-state h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #1e293b;
    }
    .empty-state p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
    }
</style>

<div class="promo-container">
    @forelse($promos as $promo)
        @php
            $isExpired = $promo->end_date && $promo->end_date->isPast();
            $isActive = $promo->is_active && !$isExpired;
        @endphp
        <div class="promo-card">
            <div class="promo-card-left">
                <div class="promo-img-wrapper">
                    @if($promo->image)
                        <img src="{{ asset($promo->image) }}" alt="{{ $promo->title }}">
                    @else
                        <div class="promo-img-placeholder">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{{ $promo->type === 'voucher' ? 'Voucher' : 'Event' }}</span>
                        </div>
                    @endif
                </div>
                <div class="promo-card-info">
                    <div class="promo-title-row">
                        <h2 class="promo-title">{{ $promo->title }}</h2>
                    </div>
                    <div class="promo-meta-row">
                        <div class="promo-date-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>
                                @if($promo->start_date && $promo->end_date)
                                    {{ $promo->start_date->translatedFormat('d F') }} - {{ $promo->end_date->translatedFormat('d F Y') }}
                                @elseif($promo->end_date)
                                    s.d. {{ $promo->end_date->translatedFormat('d F Y') }}
                                @else
                                    Selamanya
                                @endif
                            </span>
                        </div>
                        <span class="promo-status-pill {{ $isActive ? 'status-active' : 'status-expired' }}">
                            {{ $isActive ? 'Aktif' : 'Kadaluarsa' }}
                        </span>
                    </div>
                    <p class="promo-desc">{{ $promo->description ?: 'Tidak ada syarat & ketentuan khusus.' }}</p>
                </div>
            </div>
            <div class="promo-card-right">
                <a href="{{ route('admin.promo.edit', $promo->id) }}" class="promo-action-btn btn-edit" title="Edit Promo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </a>
                <form action="{{ route('admin.promo.destroy', $promo->id) }}" method="POST" onsubmit="return confirm('Apakah Anda yakin ingin menghapus promo ini?');" style="display: inline;">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="promo-action-btn btn-delete" title="Hapus Promo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    @empty
        <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4M12 4v16" />
            </svg>
            <h3>Belum ada promo</h3>
            <p>Klik "+ Tambah Promo" untuk membuat promosi baru.</p>
        </div>
    @endforelse
</div>
@endsection
