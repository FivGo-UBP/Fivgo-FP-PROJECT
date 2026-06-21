@extends('admin.layout')

@section('subtitle')
    <a href="{{ route('admin.drivers') }}" style="color:#cbd5e1; text-decoration:none;">&larr; Pengguna &gt; Driver &gt;</a> <span style="font-weight:600; color:#ffffff;">Tambah Akun</span>
@endsection

@section('content')
    <div style="margin-bottom:24px;">
        <h1 style="font-size:24px; font-weight:700; color:#1e293b; margin:0 0 8px 0;">Buat Akun Driver Baru</h1>
        <p style="color:#64748b; margin:0; font-size:14px;">Lengkapi informasi di bawah ini untuk mendaftarkan mitra pengemudi baru di sistem FivGo.</p>
    </div>

    @if ($errors->any())
        <div style="background:#fef2f2; border:1px solid #fecaca; color:#ef4444; padding:16px; border-radius:12px; margin-bottom:24px;">
            <ul style="margin:0; padding-left:20px; font-size:14px;">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form action="{{ route('admin.drivers.store') }}" method="POST" enctype="multipart/form-data">
        @csrf
        <div style="background:#ffffff; border-radius:16px; padding:32px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
            
            {{-- Informasi Pribadi --}}
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
                <div style="background:#e2e8f0; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#334155;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <h2 style="font-size:16px; font-weight:700; margin:0;">Informasi Pribadi</h2>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:32px;">
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Nama Lengkap</label>
                    <input type="text" name="name" value="{{ old('name') }}" placeholder="Contoh: Budi Santoso" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:12px 16px; font-size:14px; outline:none; box-sizing:border-box;" required>
                </div>
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Tanggal Lahir</label>
                    <input type="date" name="dob" value="{{ old('dob') }}" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:12px 16px; font-size:14px; outline:none; box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Jenis Kelamin</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <label style="border:1px solid #cbd5e1; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; font-size:14px; color:#64748b; text-align:center;">
                            <input type="radio" name="gender" value="male" style="display:none;" {{ old('gender') == 'male' ? 'checked' : '' }} onchange="this.closest('div').querySelectorAll('label').forEach(l => l.style.borderColor='#cbd5e1'); this.parentElement.style.borderColor='#1e3a8a';">
                            <span style="font-weight:bold;">♂</span> Pria
                        </label>
                        <label style="border:1px solid #cbd5e1; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; font-size:14px; color:#64748b; text-align:center;">
                            <input type="radio" name="gender" value="female" style="display:none;" {{ old('gender') == 'female' ? 'checked' : '' }} onchange="this.closest('div').querySelectorAll('label').forEach(l => l.style.borderColor='#cbd5e1'); this.parentElement.style.borderColor='#1e3a8a';">
                            <span style="font-weight:bold;">♀</span> Wanita
                        </label>
                    </div>
                </div>
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Foto Profil</label>
                    <div style="display:flex; align-items:center; gap:20px;">
                        <img id="photoPreview"
                             src="https://ui-avatars.com/api/?name=Driver&background=e2e8f0&color=475569&size=200"
                             alt="Preview Foto"
                             style="width:88px; height:88px; border-radius:16px; object-fit:cover; border:2px solid #e2e8f0; flex-shrink:0;">
                        <div style="flex:1;">
                            <label for="photo" style="display:inline-flex; align-items:center; gap:8px; background:#f1f5f9; border:1px dashed #cbd5e1; border-radius:8px; padding:10px 18px; font-size:13px; font-weight:600; color:#475569; cursor:pointer;" onmouseover="this.style.borderColor='#1e3a8a'; this.style.color='#1e3a8a'" onmouseout="this.style.borderColor='#cbd5e1'; this.style.color='#475569'">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                Pilih Foto
                            </label>
                            <input type="file" id="photo" name="photo" accept="image/*" style="display:none;" onchange="previewDriverPhoto(event)">
                            <p style="font-size:12px; color:#94a3b8; margin:8px 0 0 0;">Format: JPG, PNG, WEBP. Maks 5 MB.</p>
                        </div>
                    </div>
                </div>
            </div>

            <hr style="border:none; border-top:1px solid #e2e8f0; margin-bottom:32px;">

            {{-- Kontak & Wilayah --}}
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
                <div style="background:#e2e8f0; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#334155;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
                <h2 style="font-size:16px; font-weight:700; margin:0;">Kontak & Wilayah</h2>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:32px;">
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Email</label>
                    <input type="email" name="email" value="{{ old('email') }}" placeholder="Driver@gmail.com" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:12px 16px; font-size:14px; outline:none; box-sizing:border-box;" required>
                </div>
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Kota</label>
                    <input type="text" name="city" value="{{ old('city') }}" placeholder="Contoh: Jakarta Selatan" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:12px 16px; font-size:14px; outline:none; box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Nomor Hp Utama</label>
                    <div style="display:flex; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">
                        <span style="background:#f8fafc; padding:12px 16px; font-weight:600; color:#334155; border-right:1px solid #cbd5e1;">+62</span>
                        <input type="tel" name="phone" value="{{ old('phone') }}" style="width:100%; border:none; padding:12px 16px; font-size:14px; outline:none; box-sizing:border-box;" required>
                    </div>
                </div>
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Nomor Hp Darurat</label>
                    <div style="display:flex; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">
                        <span style="background:#f8fafc; padding:12px 16px; font-weight:600; color:#334155; border-right:1px solid #cbd5e1;">+62</span>
                        <input type="tel" name="emergency_phone" value="{{ old('emergency_phone') }}" style="width:100%; border:none; padding:12px 16px; font-size:14px; outline:none; box-sizing:border-box;">
                    </div>
                </div>
            </div>

            <hr style="border:none; border-top:1px solid #e2e8f0; margin-bottom:32px;">

            {{-- Informasi Kendaraan --}}
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
                <div style="background:#e2e8f0; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#334155;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                </div>
                <h2 style="font-size:16px; font-weight:700; margin:0;">Informasi Kendaraan</h2>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; margin-bottom:48px;">
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Jenis Kendaraan</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <label style="border:1px solid #cbd5e1; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; font-size:14px; color:#64748b; text-align:center;">
                            <input type="radio" name="vehicle_type" value="motorcycle" style="display:none;" {{ old('vehicle_type') == 'motorcycle' ? 'checked' : '' }} onchange="this.closest('div').querySelectorAll('label').forEach(l => l.style.borderColor='#cbd5e1'); this.parentElement.style.borderColor='#1e3a8a';" required>
                            <span style="font-weight:bold;">🏍️</span> Motor
                        </label>
                        <label style="border:1px solid #cbd5e1; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; font-size:14px; color:#64748b; text-align:center;">
                            <input type="radio" name="vehicle_type" value="car" style="display:none;" {{ old('vehicle_type') == 'car' ? 'checked' : '' }} onchange="this.closest('div').querySelectorAll('label').forEach(l => l.style.borderColor='#cbd5e1'); this.parentElement.style.borderColor='#1e3a8a';" required>
                            <span style="font-weight:bold;">🚗</span> Mobil
                        </label>
                    </div>
                </div>
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Merk Kendaraan</label>
                    <input type="text" name="vehicle_brand" value="{{ old('vehicle_brand') }}" placeholder="Contoh: Honda Vario / Toyota Avanza" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:12px 16px; font-size:14px; outline:none; box-sizing:border-box;" required>
                </div>
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Nomor Kendaraan</label>
                    <input type="text" name="vehicle_plate" value="{{ old('vehicle_plate') }}" placeholder="Contoh: T 1234 NY" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:12px 16px; font-size:14px; outline:none; box-sizing:border-box;" required>
                </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:16px;">
                <a href="{{ route('admin.drivers') }}" style="background:#e2e8f0; color:#334155; border:none; padding:12px 32px; border-radius:8px; font-weight:600; text-decoration:none; cursor:pointer;">
                    Batal
                </a>
                <button type="submit" style="background:#1e3a8a; color:#ffffff; border:none; padding:12px 32px; border-radius:8px; font-weight:600; cursor:pointer;">
                    Buat Akun
                </button>
            </div>
        </div>
    </form>

    <script>
        function previewDriverPhoto(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('photoPreview').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }
    </script>
@endsection
