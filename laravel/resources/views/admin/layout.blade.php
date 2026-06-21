@php
    $active = $active ?? 'dashboard';
    $title = $title ?? 'Admin FivGo';
    $admin = auth()->user();
    $initials = collect(explode(' ', $admin?->name ?: 'Admin FivGo'))
        ->filter()
        ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
        ->take(2)
        ->join('');

    $navItems = [
        ['route' => 'admin.dashboard',         'active' => 'dashboard',  'label' => 'Dashboard',            'icon' => 'fi fi-rr-apps'],
        ['route' => 'admin.monitoring',         'active' => 'monitoring', 'label' => 'Monitoring',            'icon' => 'fi fi-rr-map-marker'],
        ['route' => 'admin.analytics',          'active' => 'analytics',  'label' => 'Analitik',             'icon' => 'fi fi-rr-stats'],
        ['route' => 'admin.customers',          'active' => 'customers',  'label' => 'Pengguna',             'icon' => 'fi fi-rr-users'],
        ['route' => 'admin.verification',       'active' => 'verification','label' => 'Pembaruan Data Driver','icon' => 'fi fi-rr-shield'],
        ['route' => 'admin.orders',             'active' => 'orders',     'label' => 'Order',                'icon' => 'fi fi-rr-receipt'],
        ['route' => 'admin.promo',              'active' => 'promo',      'label' => 'Promo',                'icon' => 'fi fi-rr-badge-percent'],
        ['route' => 'admin.reports.customer',   'active' => 'reports',    'label' => 'Laporan',              'icon' => 'fi fi-rr-document'],
        ['route' => 'admin.messages',           'active' => 'messages',   'label' => 'Pesan',                'icon' => 'fi fi-rr-comment'],
        ['route' => 'admin.withdrawals',        'active' => 'withdrawals','label' => 'Penarikan Saldo',      'icon' => 'fi fi-rr-wallet'],
    ];
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} | Admin FivGo</title>
    <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css">
    <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-straight/css/uicons-solid-straight.css">
    <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="admin-body">
    <div class="admin-layout" data-admin-layout>
        <aside class="admin-sidebar" data-admin-sidebar>
            <a class="admin-brand" href="{{ route('admin.dashboard') }}">
                <span class="admin-brand-mark">
                    <img src="{{ asset('assets/admin/logo-fivgo.png') }}" alt="" aria-hidden="true">
                </span>
                <span class="admin-brand-name">FivGo</span>
            </a>

            <nav class="admin-nav" aria-label="Navigasi admin">
                @foreach ($navItems as $item)
                    @if($item['route'] === 'admin.customers')
                        @php
                            $isUsersMenu = in_array($active, ['customers', 'drivers', 'customer-detail']);
                        @endphp
                        <div class="admin-nav-group">
                            <a
                                class="admin-nav-item {{ $isUsersMenu ? 'is-active' : '' }}"
                                href="#"
                                onclick="event.preventDefault(); this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.submenu-arrow').innerText = this.nextElementSibling.classList.contains('hidden') ? '▼' : '▲';"
                            >
                                <i class="{{ $item['icon'] }} admin-nav-icon" aria-hidden="true"></i>
                                <span style="flex:1">{{ $item['label'] }}</span>
                                <span class="submenu-arrow" style="margin-right:14px; font-size:10px;">{{ $isUsersMenu ? '▲' : '▼' }}</span>
                            </a>
                            <div class="admin-nav-submenu {{ $isUsersMenu ? '' : 'hidden' }}">
                                <div class="submenu-items">
                                    <a href="{{ route('admin.customers') }}" class="{{ $active === 'customers' || $active === 'customer-detail' ? 'submenu-active' : '' }}">Customer</a>
                                    <a href="{{ route('admin.drivers') }}" class="{{ $active === 'drivers' ? 'submenu-active' : '' }}">Driver</a>
                                </div>
                            </div>
                        </div>
                    @elseif($item['route'] === 'admin.reports.customer')
                        @php
                            $isReportsMenu = in_array($active, ['reports-customer', 'reports-driver']);
                        @endphp
                        <div class="admin-nav-group">
                            <a
                                class="admin-nav-item {{ $isReportsMenu ? 'is-active' : '' }}"
                                href="#"
                                onclick="event.preventDefault(); this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.submenu-arrow').innerText = this.nextElementSibling.classList.contains('hidden') ? '▼' : '▲';"
                            >
                                <i class="{{ $item['icon'] }} admin-nav-icon" aria-hidden="true"></i>
                                <span style="flex:1">{{ $item['label'] }}</span>
                                <span class="submenu-arrow" style="margin-right:14px; font-size:10px;">{{ $isReportsMenu ? '▲' : '▼' }}</span>
                            </a>
                            <div class="admin-nav-submenu {{ $isReportsMenu ? '' : 'hidden' }}">
                                <div class="submenu-items">
                                    <a href="{{ route('admin.reports.customer') }}" class="{{ $active === 'reports-customer' ? 'submenu-active' : '' }}">Customer</a>
                                    <a href="{{ route('admin.reports.driver') }}" class="{{ $active === 'reports-driver' ? 'submenu-active' : '' }}">Driver</a>
                                </div>
                            </div>
                        </div>
                    @else
                        <a
                            class="admin-nav-item {{ $active === $item['active'] ? 'is-active' : '' }}"
                            href="{{ route($item['route']) }}"
                        >
                            <i class="{{ $item['icon'] }} admin-nav-icon" aria-hidden="true"></i>
                            <span>{{ $item['label'] }}</span>
                        </a>
                    @endif
                @endforeach
            </nav>

            <div class="admin-profile">
                <span class="admin-avatar">{{ $initials ?: 'AF' }}</span>
                <span>
                    <strong>{{ $admin?->name ?: 'Admin FivGo' }}</strong>
                    <small>{{ $admin?->email ?: 'fivgoubp@gmail.com' }}</small>
                </span>
            </div>
        </aside>

        <main class="admin-main">
            <header class="admin-topbar">
                <button class="icon-button mobile-menu-button" type="button" data-sidebar-toggle aria-label="Buka menu">
                    <i class="fi fi-rr-bars-staggered button-icon" aria-hidden="true"></i>
                </button>

                <div>
                    <h1>{{ $title }}</h1>
                    @hasSection('subtitle')
                        <p>@yield('subtitle')</p>
                    @endif
                </div>

                <div class="topbar-actions">
                    @yield('actions')
                    @if(isset($active) && in_array($active, ['dashboard', 'analytics']))
                        <button class="admin-export-button" type="button" onclick="window.print()">
                            <i class="fi fi-rr-file-download button-icon" aria-hidden="true"></i>
                            <span>Ekspor pdf</span>
                        </button>
                    @endif
                    @if(empty($hideExit))
                    <form method="POST" action="{{ route('admin.logout') }}">
                        @csrf
                        <button class="icon-button" type="submit" aria-label="Keluar">
                            <i class="fi fi-rr-sign-out-alt button-icon" aria-hidden="true"></i>
                        </button>
                    </form>
                    @endif
                </div>
            </header>

            @if (session('status'))
                <div class="admin-alert is-success">{{ session('status') }}</div>
            @endif

            @yield('content')
        </main>
    </div>
</body>
</html>
