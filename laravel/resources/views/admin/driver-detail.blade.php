@extends('admin.layout')

@section('content')
    <div class="fivgo-tabs-container" style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
            <h1 style="font-size:24px; font-weight:700; color:#1e293b; margin:0 0 8px 0;">Edit Profil</h1>
            <p style="color:#64748b; margin:0; font-size:14px;">Perbarui informasi profil driver yang terdaftar dalam sistem.</p>
        </div>

        <form action="{{ route('admin.users.toggle-status', $driver->id) }}" method="POST" style="margin:0;">
            @csrf
            @if ($driver->is_active)
                <button type="button"
                    style="background:#ef4444;color:#fff;border:none;border-radius:999px;padding:0 24px;min-height:40px;font-size:13px;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px;"
                    onclick="if(confirm('Yakin ingin menonaktifkan driver ini?')) this.form.submit()">
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

    @if(session('status'))
        <div style="background:#dcfce3; color:#166534; padding:16px; border-radius:8px; margin-bottom:24px; font-weight:500;">
            {{ session('status') }}
        </div>
    @endif

    <form action="{{ route('admin.drivers.update', $driver->id) }}" method="POST" enctype="multipart/form-data">
        @csrf
        @method('PUT')
        
        <div style="background:#ffffff; border-radius:24px; padding:40px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); max-width:1000px; margin:0 auto;">
            
            {{-- Profile Avatar Area --}}
            <div style="display:flex; justify-content:center; margin-bottom:40px;">
                <div style="position:relative; width:120px; height:120px;">
                    <img src="{{ $driver->photo ?: 'https://ui-avatars.com/api/?name=' . urlencode($driver->name) . '&background=e2e8f0&color=475569&size=200' }}" 
                         alt="Driver Profile"
                         style="width:100%; height:100%; border-radius:24px; object-fit:cover;"
                         id="avatarPreview"
                         onerror="this.src='https://ui-avatars.com/api/?name={{ urlencode($driver->name) }}&background=e2e8f0&color=475569&size=200'">
                    
                    <label for="profile_picture" style="position:absolute; bottom:-10px; right:-10px; background:#ffffff; border:1px solid #e2e8f0; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        <input type="file" id="profile_picture" name="profile_picture" accept="image/*" style="display:none;" onchange="previewImage(event)">
                    </label>
                </div>
            </div>

            {{-- Row 1 --}}
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
                <div>
                    <label style="display:block; font-size:14px; font-weight:600; color:#334155; margin-bottom:8px;">Nama Lengkap</label>
                    <input type="text" name="name" value="{{ old('name', $driver->name) }}" required
                           style="width:100%; height:48px; padding:0 16px; border:1px solid #e2e8f0; border-radius:8px; font-size:15px; background:#f8fafc; color:#334155; outline:none; transition:border 0.2s;"
                           onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'">
                    @error('name') <span style="color:#ef4444; font-size:12px; margin-top:4px; display:block;">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label style="display:block; font-size:14px; font-weight:600; color:#334155; margin-bottom:8px;">ID Driver</label>
                    <input type="text" value="DRV-{{ strtoupper(substr($driver->id, 0, 4)) }}" disabled
                           style="width:100%; height:48px; padding:0 16px; border:1px solid #e2e8f0; border-radius:8px; font-size:15px; background:#f8fafc; color:#64748b; outline:none; cursor:not-allowed;">
                </div>
            </div>

            {{-- Row 2 --}}
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:40px;">
                <div>
                    <label style="display:block; font-size:14px; font-weight:600; color:#334155; margin-bottom:8px;">Nomor Telephone</label>
                    <div style="position:relative;">
                        <span style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:#64748b;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </span>
                        <input type="text" name="phone" value="{{ old('phone', $driver->phone) }}" required
                               style="width:100%; height:48px; padding:0 16px 0 48px; border:1px solid #e2e8f0; border-radius:8px; font-size:15px; background:#f8fafc; color:#334155; outline:none; transition:border 0.2s;"
                               onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                    @error('phone') <span style="color:#ef4444; font-size:12px; margin-top:4px; display:block;">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label style="display:block; font-size:14px; font-weight:600; color:#334155; margin-bottom:8px;">Email</label>
                    <div style="position:relative;">
                        <span style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:#64748b;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </span>
                        <input type="email" name="email" value="{{ old('email', $driver->email) }}" required
                               style="width:100%; height:48px; padding:0 16px 0 48px; border:1px solid #e2e8f0; border-radius:8px; font-size:15px; background:#f8fafc; color:#334155; outline:none; transition:border 0.2s;"
                               onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                    @error('email') <span style="color:#ef4444; font-size:12px; margin-top:4px; display:block;">{{ $message }}</span> @enderror
                </div>
            </div>

            <hr style="border:none; border-top:1px solid #e2e8f0; margin-bottom:32px;">

            <h3 style="font-size:18px; font-weight:700; color:#1e293b; margin:0 0 24px 0;">Informasi Kendaraan</h3>

            {{-- Row 3 --}}
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; margin-bottom:40px;">
                <div>
                    <label style="display:block; font-size:14px; font-weight:600; color:#334155; margin-bottom:8px;">Jenis Kendaraan</label>
                    <input type="text" value="{{ ($driver->driverProfile->vehicle_type ?? '') == 'car' ? 'Mobil' : 'Motor' }}" disabled
                           style="width:100%; height:48px; padding:0 16px; border:1px solid #e2e8f0; border-radius:8px; font-size:15px; background:#f8fafc; color:#64748b; outline:none; cursor:not-allowed;">
                </div>
                <div>
                    <label style="display:block; font-size:14px; font-weight:600; color:#334155; margin-bottom:8px;">Merk Kendaraan</label>
                    <input type="text" value="{{ $driver->driverProfile->vehicle_brand ?? '-' }}" disabled
                           style="width:100%; height:48px; padding:0 16px; border:1px solid #e2e8f0; border-radius:8px; font-size:15px; background:#f8fafc; color:#64748b; outline:none; cursor:not-allowed;">
                </div>
                <div>
                    <label style="display:block; font-size:14px; font-weight:600; color:#334155; margin-bottom:8px;">Plat Nomor Kendaraan</label>
                    <input type="text" value="{{ $driver->driverProfile->plate_number ?? '-' }}" disabled
                           style="width:100%; height:48px; padding:0 16px; border:1px solid #e2e8f0; border-radius:8px; font-size:15px; background:#f8fafc; color:#64748b; outline:none; cursor:not-allowed;">
                </div>
            </div>

            {{-- Action Buttons --}}
            <div style="display:flex; justify-content:flex-end; gap:16px;">
                <a href="{{ route('admin.drivers') }}" 
                   style="display:flex; align-items:center; justify-content:center; text-decoration:none; width:140px; height:46px; border:1px solid #cbd5e1; border-radius:8px; background:#ffffff; color:#334155; font-size:15px; font-weight:600; transition:all 0.2s;"
                   onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#ffffff'">
                    Kembali
                </a>
                <button type="submit" 
                        style="width:180px; height:46px; border:none; border-radius:8px; background:#1e3a8a; color:#ffffff; font-size:15px; font-weight:600; cursor:pointer; transition:opacity 0.2s;"
                        onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                    Simpan Perubahan
                </button>
            </div>

        </div>
    </form>

    <script>
        function previewImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('avatarPreview').src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        }
    </script>
@endsection
