@extends('admin.layout')
@php
    $hideExit = true;
@endphp

@section('content')
<style>
    .form-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
        border: 1px solid #eef2f6;
        margin-top: 16px;
    }
    .form-grid-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 32px;
    }
    @media (max-width: 768px) {
        .form-grid-layout {
            grid-template-columns: 1fr;
        }
    }
    .upload-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .upload-box {
        background-color: #f1f5f9;
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        height: 340px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        text-align: center;
        padding: 20px;
        position: relative;
        overflow: hidden;
        transition: border-color 150ms ease, background-color 150ms ease;
    }
    .upload-box:hover {
        border-color: #818cf8;
        background-color: #f8fafc;
    }
    .upload-circle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        margin-bottom: 16px;
        z-index: 2;
    }
    .upload-circle svg {
        width: 24px;
        height: 24px;
        color: #64748b;
    }
    .upload-text {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        line-height: 1.5;
        z-index: 2;
    }
    .upload-preview {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 1;
    }
    .upload-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        opacity: 0;
        z-index: 3;
        transition: opacity 150ms ease;
    }
    .upload-box:hover .upload-overlay {
        opacity: 1;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 20px;
    }
    .form-label {
        font-size: 13px;
        font-weight: 700;
        color: #334155;
    }
    .promo-type-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
    .type-option-radio {
        display: none;
    }
    .type-option-label {
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        color: #475569;
        background: #ffffff;
        transition: all 150ms ease;
        text-align: center;
    }
    .type-option-radio:checked + .type-option-label {
        background-color: #c7d2fe;
        border-color: #818cf8;
        color: #1e1b4b;
    }
    .input-text {
        width: 100%;
        min-height: 48px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        outline: none;
        background: #ffffff;
        box-sizing: border-box;
        transition: border-color 150ms ease;
    }
    .input-text:focus {
        border-color: #818cf8;
    }
    .row-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
    }
    @media (max-width: 576px) {
        .row-grid {
            grid-template-columns: 1fr;
            gap: 16px;
        }
    }
    .percent-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }
    .percent-input-wrapper input {
        padding-right: 40px;
    }
    .percent-addon {
        position: absolute;
        right: 16px;
        font-size: 14px;
        font-weight: 700;
        color: #64748b;
        pointer-events: none;
    }
    .textarea-syarat {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 16px;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        outline: none;
        background: #ffffff;
        resize: vertical;
        min-height: 120px;
        box-sizing: border-box;
        transition: border-color 150ms ease;
    }
    .textarea-syarat:focus {
        border-color: #818cf8;
    }
    .advanced-toggle-btn {
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 700;
        color: #4f46e5;
        margin-top: 10px;
        user-select: none;
        width: fit-content;
        transition: color 150ms ease;
    }
    .advanced-toggle-btn:hover {
        color: #3730a3;
    }
    .advanced-fields-box {
        display: none;
        padding: 24px;
        border: 1px dashed #cbd5e1;
        border-radius: 12px;
        background-color: #f8fafc;
        margin-top: 16px;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }
    .advanced-fields-box.show {
        display: grid;
    }
    @media (max-width: 576px) {
        .advanced-fields-box.show {
            grid-template-columns: 1fr;
        }
    }
    .btn-action-row {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 32px;
        border-top: 1px solid #eef2f6;
        padding-top: 24px;
    }
    .btn-cancel {
        background: #f1f5f9;
        color: #475569;
        border: none;
        padding: 12px 28px;
        border-radius: 8px;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 150ms ease;
        text-align: center;
    }
    .btn-cancel:hover {
        background: #e2e8f0;
    }
    .btn-submit {
        background: #1e3c88;
        color: #ffffff;
        border: none;
        padding: 12px 28px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        transition: background-color 150ms ease;
        text-align: center;
    }
    .btn-submit:hover {
        background: #162e6b;
    }
</style>

@if ($errors->any())
    <div style="background:#fef2f2; border:1px solid #fecaca; color:#ef4444; padding:16px; border-radius:12px; margin-bottom:24px;">
        <ul style="margin:0; padding-left:20px; font-size:14px; font-weight: 600;">
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<form action="{{ isset($promo) ? route('admin.promo.update', $promo->id) : route('admin.promo.store') }}" method="POST" enctype="multipart/form-data">
    @csrf
    @if(isset($promo))
        @method('PUT')
    @endif
    
    <div class="form-card">
        <div class="form-grid-layout">
            <!-- Left Column: Cover Image Upload -->
            <div class="upload-container">
                <span class="form-label">Gambar Promo</span>
                <input type="file" name="image" id="promo-image-file" accept="image/*" style="display: none;">
                <div class="upload-box" onclick="document.getElementById('promo-image-file').click()">
                    @if(isset($promo) && $promo->image)
                        <img src="{{ asset($promo->image) }}" class="upload-preview" id="promo-image-preview">
                        <div class="upload-overlay">Ganti Gambar</div>
                    @else
                        <img src="" class="upload-preview" id="promo-image-preview" style="display: none;">
                        <div class="upload-circle" id="promo-upload-placeholder-circle">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <span class="upload-text" id="promo-upload-placeholder-text">Klik atau Geser Gambar<br><span style="font-weight: 500; font-size: 10px; color: #94a3b8;">Rasio 4:5 di sarankan (Maks. 5MB)</span></span>
                        <div class="upload-overlay" id="promo-upload-overlay" style="display: none;">Ganti Gambar</div>
                    @endif
                </div>
            </div>

            <!-- Right Column: Form Inputs -->
            <div>
                <!-- Promo Type -->
                <div class="form-group">
                    <span class="form-label">Tipe Promo</span>
                    <div class="promo-type-group">
                        <div>
                            <input type="radio" id="type-event" name="type" value="event" class="type-option-radio" {{ (!isset($promo) || $promo->type === 'event') ? 'checked' : '' }}>
                            <label class="type-option-label" for="type-event">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Event Promo
                            </label>
                        </div>
                        <div>
                            <input type="radio" id="type-voucher" name="type" value="voucher" class="type-option-radio" {{ (isset($promo) && $promo->type === 'voucher') ? 'checked' : '' }}>
                            <label class="type-option-label" for="type-voucher">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                </svg>
                                Voucher Promo
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Promo Name -->
                <div class="form-group">
                    <label class="form-label" for="promo-title">Nama Promo</label>
                    <input type="text" name="title" id="promo-title" class="input-text" value="{{ old('title', $promo->title ?? '') }}" placeholder="Contoh Diskon Akhir Pekan" required>
                </div>

                <!-- Value and Expiry Date -->
                <div class="row-grid">
                    <div class="form-group">
                        <label class="form-label" for="promo-discount">Nilai Diskon (%)</label>
                        <div class="percent-input-wrapper">
                            <input type="number" name="discount_percent" id="promo-discount" class="input-text" value="{{ old('discount_percent', $promo->discount_percent ?? '0') }}" min="0" max="100" required>
                            <span class="percent-addon">%</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="promo-end-date">Tanggal Berlaku</label>
                        <input type="date" name="end_date" id="promo-end-date" class="input-text" value="{{ old('end_date', isset($promo) && $promo->end_date ? $promo->end_date->format('Y-m-d') : '') }}" required>
                    </div>
                </div>

                <!-- Terms & Conditions / Description -->
                <div class="form-group">
                    <label class="form-label" for="promo-description">Syarat & Ketentuan</label>
                    <textarea name="description" id="promo-description" class="textarea-syarat" placeholder="Tuliskan Syarat dan ketentuan disini">{{ old('description', $promo->description ?? '') }}</textarea>
                </div>

                <!-- Advanced Options Toggle -->
                <div class="advanced-toggle-btn" onclick="toggleAdvancedFields()">
                    <span>Pengaturan Tambahan (Opsional)</span>
                    <svg id="advanced-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>

                <!-- Advanced Fields (Collapsible) -->
                <div class="advanced-fields-box" id="advanced-fields">
                    <div class="form-group">
                        <label class="form-label" for="promo-code">Kode Promo</label>
                        <input type="text" name="code" id="promo-code" class="input-text" value="{{ old('code', $promo->code ?? '') }}" placeholder="Auto-generate dari Nama Promo">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="promo-quota">Kuota Penggunaan</label>
                        <input type="number" name="quota" id="promo-quota" class="input-text" value="{{ old('quota', $promo->quota ?? '1000') }}" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="promo-max-discount">Maksimal Potongan (Rp)</label>
                        <input type="number" name="max_discount" id="promo-max-discount" class="input-text" value="{{ old('max_discount', $promo->max_discount ?? '50000') }}" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="promo-min-order">Minimal Harga Order (Rp)</label>
                        <input type="number" name="min_order_amount" id="promo-min-order" class="input-text" value="{{ old('min_order_amount', $promo->min_order_amount ?? '0') }}" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="promo-limit-user">Batas per User</label>
                        <input type="number" name="limit_per_user" id="promo-limit-user" class="input-text" value="{{ old('limit_per_user', $promo->limit_per_user ?? '1') }}" min="1">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="promo-start-date">Mulai Berlaku</label>
                        <input type="date" name="start_date" id="promo-start-date" class="input-text" value="{{ old('start_date', isset($promo) && $promo->start_date ? $promo->start_date->format('Y-m-d') : '') }}">
                    </div>
                </div>

                <!-- Actions -->
                <div class="btn-action-row">
                    <a href="{{ route('admin.promo') }}" class="btn-cancel">Batal</a>
                    <button type="submit" class="btn-submit">Simpan</button>
                </div>
            </div>
        </div>
    </div>
</form>

<script>
    // Javascript to show cover image preview
    document.getElementById('promo-image-file').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewImg = document.getElementById('promo-image-preview');
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
                
                // Hide placeholders
                const circle = document.getElementById('promo-upload-placeholder-circle');
                if (circle) circle.style.display = 'none';
                const text = document.getElementById('promo-upload-placeholder-text');
                if (text) text.style.display = 'none';
                
                // Show overlays
                const overlay = document.getElementById('promo-upload-overlay');
                if (overlay) overlay.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        }
    });

    // Toggle advanced options
    function toggleAdvancedFields() {
        const fields = document.getElementById('advanced-fields');
        const chevron = document.getElementById('advanced-chevron');
        fields.classList.toggle('show');
        if (fields.classList.contains('show')) {
            chevron.style.transform = 'rotate(180deg)';
        } else {
            chevron.style.transform = 'rotate(0deg)';
        }
    }
    
    // Smooth transitions for chevron
    document.getElementById('advanced-chevron').style.transition = 'transform 200ms ease';
</script>
@endsection
