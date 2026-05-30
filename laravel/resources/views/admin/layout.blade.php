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
        ['route' => 'admin.dashboard', 'active' => 'dashboard', 'label' => 'Dashboard', 'icon' => 'dashboard'],
        ['route' => 'admin.monitoring', 'active' => 'monitoring', 'label' => 'Monitoring', 'icon' => 'monitor'],
        ['route' => 'admin.analytics', 'active' => 'analytics', 'label' => 'Analitik', 'icon' => 'analytics'],
        ['route' => 'admin.customers', 'active' => 'customers', 'label' => 'Pengguna', 'icon' => 'users'],
        ['route' => 'admin.verification', 'active' => 'verification', 'label' => 'Verifikasi Driver', 'icon' => 'shield'],
        ['route' => 'admin.orders', 'active' => 'orders', 'label' => 'Order', 'icon' => 'order'],
        ['route' => 'admin.promo', 'active' => 'promo', 'label' => 'Promo', 'icon' => 'tag'],
        ['route' => 'admin.reports', 'active' => 'reports', 'label' => 'Laporan', 'icon' => 'report'],
        ['route' => 'admin.messages', 'active' => 'messages', 'label' => 'Pesan', 'icon' => 'message'],
        ['route' => 'admin.withdrawals', 'active' => 'withdrawals', 'label' => 'Penarikan Saldo', 'icon' => 'wallet'],
    ];

    $svg = function (string $name, string $class = 'icon') {
        $paths = [
            'dashboard' => '<path d="M4 5h6v6H4zM14 5h6v4h-6zM14 13h6v6h-6zM4 15h6v4H4z"/>',
            'monitor' => '<path d="M4 5h16v11H4z"/><path d="M9 20h6M12 16v4"/>',
            'analytics' => '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/>',
            'users' => '<path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4"/><circle cx="12" cy="9" r="3"/><path d="M20 19c0-1.7-1-3.1-2.5-3.7"/><path d="M17 6.3a3 3 0 0 1 0 5.4"/>',
            'driver' => '<path d="M4 15h3l2-4h6l2 4h3"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 11h6"/>',
            'shield' => '<path d="M12 3 5 6v5c0 4 2.8 7.3 7 9 4.2-1.7 7-5 7-9V6z"/><path d="m9 12 2 2 4-5"/>',
            'order' => '<path d="M8 4h8l1 3h3v13H4V7h3z"/><path d="M8 11h8M8 15h6"/>',
            'tag' => '<path d="M4 11V5h6l10 10-6 6z"/><circle cx="8" cy="8" r="1.5"/>',
            'report' => '<path d="M12 4 3 20h18z"/><path d="M12 9v5M12 17h.01"/>',
            'message' => '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 13h5"/>',
            'wallet' => '<path d="M4 7h16v12H4z"/><path d="M16 12h4v4h-4z"/><path d="M4 7l3-3h10l3 3"/>',
            'download' => '<path d="M12 4v10"/><path d="m8 10 4 4 4-4"/><path d="M5 20h14"/>',
            'logout' => '<path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4"/><path d="M8 12h10"/>',
            'menu' => '<path d="M4 6h16M4 12h16M4 18h16"/>',
            'search' => '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
            'check' => '<path d="m5 13 4 4L19 7"/>',
            'warning' => '<path d="M12 4 3 20h18z"/><path d="M12 9v5M12 17h.01"/>',
        ];

        return '<svg class="' . e($class) . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . ($paths[$name] ?? $paths['dashboard']) . '</svg>';
    };
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} | Admin FivGo</title>
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
                    <a
                        class="admin-nav-item {{ $active === $item['active'] ? 'is-active' : '' }}"
                        href="{{ route($item['route']) }}"
                    >
                        {!! $svg($item['icon'], 'admin-nav-icon') !!}
                        <span>{{ $item['label'] }}</span>
                    </a>
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
                    {!! $svg('menu', 'button-icon') !!}
                </button>

                <div>
                    <h1>{{ $title }}</h1>
                    @hasSection('subtitle')
                        <p>@yield('subtitle')</p>
                    @endif
                </div>

                <div class="topbar-actions">
                    @yield('actions')
                    <button class="admin-export-button" type="button">
                        {!! $svg('download', 'button-icon') !!}
                        <span>Ekspor pdf</span>
                    </button>
                    <form method="POST" action="{{ route('admin.logout') }}">
                        @csrf
                        <button class="icon-button" type="submit" aria-label="Keluar">
                            {!! $svg('logout', 'button-icon') !!}
                        </button>
                    </form>
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
