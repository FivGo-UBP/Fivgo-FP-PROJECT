@extends('admin.layout')

@section('content')
<style>
    .ana-page { font-family: 'Inter', sans-serif; }
    .ana-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .ana-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
    .ana-subtitle { font-size: 14px; color: #64748b; margin: 0; }
    .ana-time-btn { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; color: #334155; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

    .ana-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
    .ana-card { background: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; }
    
    .ana-icon-wrap { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .ana-icon-blue { background: #eff6ff; color: #3b82f6; }
    .ana-icon-green { background: #dcfce7; color: #22c55e; }
    .ana-icon-red { background: #fee2e2; color: #ef4444; }

    .ana-badge { position: absolute; top: 20px; right: 20px; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .ana-badge-green { background: #dcfce7; color: #22c55e; }
    .ana-badge-red { background: #fee2e2; color: #ef4444; }

    .ana-card-label { font-size: 14px; font-weight: 600; color: #475569; margin: 0 0 8px 0; }
    .ana-card-val { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }

    .ana-chart-card { background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 24px; }
    .ana-chart-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 24px 0; }

    .ana-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    
    .ana-table { width: 100%; border-collapse: collapse; }
    .ana-table th { text-align: left; font-size: 11px; font-weight: 700; color: #64748b; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; }
    .ana-table td { padding: 12px 0; font-size: 13px; font-weight: 600; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .ana-table tr:last-child td { border-bottom: none; }
    .ana-avatar-wrap { display: flex; align-items: center; gap: 12px; }
    .ana-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; background: #e2e8f0; }

    .ana-link { color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 600; }
    .ana-sys-warning { background: #fee2e2; color: #ef4444; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; }

    .ana-stat-card { background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 20px; }
    .ana-stat-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
</style>

<div class="ana-page">
    <div class="ana-header">
        <div>
            <h1 class="ana-title">Data Analitik</h1>
            <p class="ana-subtitle">Pantau performa operasional armada secara real-time.</p>
        </div>
        <button class="ana-time-btn">
            Rentang Waktu
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>
    </div>

    <!-- METRICS GRID -->
    <div class="ana-grid-3">
        <!-- Total Order -->
        <div class="ana-card">
            <div class="ana-icon-wrap ana-icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4L10 2h4l1 1h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M9 10h6M9 14h6"/></svg>
            </div>
            <div class="ana-badge ana-badge-green">+5.1%</div>
            <p class="ana-card-label">Total Order</p>
            <h3 class="ana-card-val">{{ $metrics[0]['value'] }}</h3>
        </div>
        <!-- Total Pendapatan -->
        <div class="ana-card">
            <div class="ana-icon-wrap ana-icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div class="ana-badge ana-badge-green">+5.1%</div>
            <p class="ana-card-label">Total Pendapatan</p>
            <h3 class="ana-card-val">{{ $metrics[1]['value'] }}</h3>
        </div>
        <!-- Driver Aktif -->
        <div class="ana-card">
            <div class="ana-icon-wrap ana-icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <div class="ana-badge ana-badge-red">-5.1%</div>
            <p class="ana-card-label">Driver Aktif</p>
            <h3 class="ana-card-val">{{ $metrics[2]['value'] }}</h3>
        </div>
        <!-- Customer Aktif -->
        <div class="ana-card">
            <div class="ana-icon-wrap ana-icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="ana-badge ana-badge-green">+5.1%</div>
            <p class="ana-card-label">Customer Aktif</p>
            <h3 class="ana-card-val">{{ $metrics[3]['value'] }}</h3>
        </div>
        <!-- Tingkat Penyelesaian -->
        <div class="ana-card">
            <div class="ana-icon-wrap ana-icon-green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="ana-badge ana-badge-green">+5.1%</div>
            <p class="ana-card-label">Tingkat Penyelesaian</p>
            <h3 class="ana-card-val">{{ $metrics[4]['value'] }}</h3>
        </div>
        <!-- Tingkat Pembatalan -->
        <div class="ana-card">
            <div class="ana-icon-wrap ana-icon-red">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <div class="ana-badge ana-badge-green">+5.1%</div>
            <p class="ana-card-label">Tingkat pembatalan</p>
            <h3 class="ana-card-val">{{ $metrics[5]['value'] }}</h3>
        </div>
    </div>

    <!-- LINE CHART -->
    <div class="ana-chart-card">
        <h2 class="ana-chart-title">Trend Jumlah Order</h2>
        <div style="width: 100%; height: 260px; position: relative;">
            <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none" style="overflow:visible;">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#eff6ff" stop-opacity="1" />
                        <stop offset="100%" stop-color="#eff6ff" stop-opacity="0" />
                    </linearGradient>
                    <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#3b82f6" flood-opacity="0.3"/>
                    </filter>
                </defs>
                
                <!-- Grid Lines -->
                <line x1="0" y1="50" x2="1000" y2="50" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="0" y1="100" x2="1000" y2="100" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="0" y1="150" x2="1000" y2="150" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="0" y1="200" x2="1000" y2="200" stroke="#f1f5f9" stroke-width="1"/>
                
                @php
                    // MOCKING DATA to match the visually complex line
                    $mockData = [20, 30, 25, 40, 35, 50, 45, 70, 60, 110, 100, 140, 130, 180, 170, 190, 180, 200];
                    $maxMock = 220;
                    $pointsStr = "";
                    $areaStr = "";
                    $circlesStr = "";
                    
                    $wStep = 1000 / (count($mockData) - 1);
                    foreach($mockData as $i => $val) {
                        $x = $i * $wStep;
                        $y = 200 - ($val / $maxMock * 180);
                        $pointsStr .= "{$x},{$y} ";
                        $circlesStr .= "<circle cx='{$x}' cy='{$y}' r='4' fill='#ffffff' stroke='#3b82f6' stroke-width='2' style='cursor:pointer; transition: r 0.2s;' onmouseover='this.setAttribute(\"r\",\"6\")' onmouseout='this.setAttribute(\"r\",\"4\")'>
                                            <title>{$val} Order</title>
                                        </circle>";
                    }
                    $areaStr = "0,200 " . $pointsStr . " 1000,200";
                @endphp

                <!-- Area -->
                <polygon points="{{ $areaStr }}" fill="url(#chartGradient)" />
                <!-- Line -->
                <polyline points="{{ $pointsStr }}" fill="none" stroke="#3b82f6" stroke-width="3" filter="url(#lineShadow)" />
                
                <!-- Data Points -->
                {!! $circlesStr !!}
            </svg>
            
            <!-- X Axis Labels -->
            <div style="display:flex; justify-content:space-between; margin-top:20px; font-size:10px; font-weight:600; color:#94a3b8; text-transform:uppercase;">
                @foreach (array_reverse(array_slice($series->toArray(), 0, 7)) as $p)
                    <span>{{ $p['label'] }}</span>
                @endforeach
            </div>
        </div>
    </div>

    <!-- BOTTOM GRID 1: Tables -->
    <div class="ana-grid-2">
        <!-- Top Driver -->
        <div class="ana-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 class="ana-chart-title" style="margin:0;">Top Driver</h2>
                <a href="#" class="ana-link">Lihat Semua</a>
            </div>
            <table class="ana-table">
                <thead>
                    <tr>
                        <th>DRIVER</th>
                        <th>ORDER</th>
                        <th>RATING</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($topDrivers->take(5) as $td)
                    <tr>
                        <td>
                            <div class="ana-avatar-wrap">
                                <div class="ana-avatar" style="background:url('https://ui-avatars.com/api/?name={{ urlencode($td['name']) }}&background=e2e8f0') center/cover;"></div>
                                <span>{{ $td['name'] }}</span>
                            </div>
                        </td>
                        <td>{{ $td['orders'] }}</td>
                        <td style="color:#f59e0b;">{{ number_format((float) $td['rating'], 1) }} ★</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Driver sering cancel -->
        <div class="ana-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 class="ana-chart-title" style="margin:0;">Driver sering cancel</h2>
                <span class="ana-sys-warning">Peringatan sistem</span>
            </div>
            <table class="ana-table">
                <thead>
                    <tr>
                        <th>DRIVER</th>
                        <th>CANCEL</th>
                        <th>RASIO</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Mock data based on screenshot -->
                    <tr>
                        <td><div class="ana-avatar-wrap"><div class="ana-avatar" style="background:url('https://ui-avatars.com/api/?name=Riski+Ahmad') center/cover;"></div><span>Riski Ahmad Fauzan</span></div></td>
                        <td>7</td><td style="color:#f59e0b;">4.7 ★</td>
                    </tr>
                    <tr>
                        <td><div class="ana-avatar-wrap"><div class="ana-avatar" style="background:url('https://ui-avatars.com/api/?name=Riski+Ahmad') center/cover;"></div><span>Riski Ahmad Fauzan</span></div></td>
                        <td>6</td><td style="color:#f59e0b;">4.7 ★</td>
                    </tr>
                    <tr>
                        <td><div class="ana-avatar-wrap"><div class="ana-avatar" style="background:url('https://ui-avatars.com/api/?name=Riski+Ahmad') center/cover;"></div><span>Riski Ahmad Fauzan</span></div></td>
                        <td>5</td><td style="color:#f59e0b;">4.7 ★</td>
                    </tr>
                    <tr>
                        <td><div class="ana-avatar-wrap"><div class="ana-avatar" style="background:url('https://ui-avatars.com/api/?name=Riski+Ahmad') center/cover;"></div><span>Riski Ahmad Fauzan</span></div></td>
                        <td>4</td><td style="color:#f59e0b;">4.7 ★</td>
                    </tr>
                    <tr>
                        <td><div class="ana-avatar-wrap"><div class="ana-avatar" style="background:url('https://ui-avatars.com/api/?name=Riski+Ahmad') center/cover;"></div><span>Riski Ahmad Fauzan</span></div></td>
                        <td>4</td><td style="color:#f59e0b;">4.7 ★</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- BOTTOM GRID 2: Donut & Stats -->
    <div class="ana-grid-2">
        <!-- Distribusi Status -->
        <div class="ana-card" style="display:flex; flex-direction:column;">
            <h2 class="ana-chart-title" style="margin-bottom:auto;">Distribusi Status Order</h2>
            
            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:30px; margin-bottom:30px; padding:0 20px;">
                <!-- Donut Chart Circle (CSS) -->
                @php
                    $totalS = max(1, array_sum($statusCounts));
                    $pSelesai = 65; // Mocking exact percentages from image: Selesai 65, On-Going 20, Dijadwalkan 10, Dibatalkan 5
                    $pOngoing = 20;
                    $pJadwal = 10;
                    $pBatal = 5;
                    $t = 2543;
                @endphp
                <div style="width:140px; height:140px; border-radius:50%; background: conic-gradient(
                    #22c55e 0% {{ $pSelesai }}%,
                    #f59e0b {{ $pSelesai }}% {{ $pSelesai + $pOngoing }}%,
                    #e2e8f0 {{ $pSelesai + $pOngoing }}% {{ $pSelesai + $pOngoing + $pJadwal }}%,
                    #ef4444 {{ $pSelesai + $pOngoing + $pJadwal }}% 100%
                ); position:relative; display:flex; align-items:center; justify-content:center;">
                    <div style="width:100px; height:100px; background:#fff; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <span style="font-size:12px; font-weight:700; color:#0f172a;">Total</span>
                        <span style="font-size:16px; font-weight:800; color:#0f172a;">2.543</span>
                    </div>
                </div>

                <!-- Legend -->
                <div style="display:flex; flex-direction:column; gap:16px; width:45%;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; color:#334155;">
                        <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; border-radius:50%; background:#22c55e;"></span> Selesai</span>
                        <span>65%</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; color:#334155;">
                        <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; border-radius:50%; background:#f59e0b;"></span> On-Going</span>
                        <span>20%</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; color:#334155;">
                        <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; border-radius:50%; background:#e2e8f0;"></span> Dijadwalkan</span>
                        <span>10%</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; color:#334155;">
                        <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; border-radius:50%; background:#ef4444;"></span> Dibatalkan</span>
                        <span>5%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2 Side Cards -->
        <div style="display:flex; flex-direction:column; gap:24px;">
            <div class="ana-stat-card">
                <div class="ana-stat-icon" style="background:#e0e7ff; color:#4f46e5;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                    <h4 style="font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; margin:0 0 4px 0;">Rata - Rata Waktu Terima</h4>
                    <h2 style="font-size:24px; font-weight:800; color:#0f172a; margin:0 0 4px 0;">42 Detik</h2>
                    <p style="font-size:12px; font-weight:600; color:#22c55e; margin:0;">10 Detik lebih cepat dari rata-rata</p>
                </div>
            </div>

            <div class="ana-stat-card">
                <div class="ana-stat-icon" style="background:#fee2e2; color:#ef4444;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                </div>
                <div>
                    <h4 style="font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; margin:0 0 4px 0;">Jam Sibuk</h4>
                    <h2 style="font-size:24px; font-weight:800; color:#0f172a; margin:0 0 4px 0;">08.00 - 12.00</h2>
                    <p style="font-size:12px; font-weight:600; color:#64748b; margin:0;">Estimasi 120 Order/jam</p>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
