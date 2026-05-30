@php
    $svg = function (string $name, string $class = 'icon') {
        $paths = [
            'eye' => '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="3"/>',
            'mail' => '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
            'lock' => '<path d="M7 10V8a5 5 0 0 1 10 0v2"/><path d="M5 10h14v10H5z"/>',
        ];

        return '<svg class="' . e($class) . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . ($paths[$name] ?? $paths['mail']) . '</svg>';
    };
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login | Admin FivGo</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="admin-login-body">
    <main class="admin-login-shell">
        <section class="login-visual-panel" aria-label="Peta layanan FivGo di Indonesia"></section>

        <section class="login-form-panel" aria-labelledby="login-title">
            <div class="login-form-card">
                <h2 id="login-title">LOGIN</h2>

                @if ($errors->any())
                    <div class="admin-alert is-danger">
                        {{ $errors->first() }}
                    </div>
                @endif

                <form method="POST" action="{{ route('admin.login.store') }}" class="login-form">
                    @csrf

                    <label class="form-field">
                        <span>Email</span>
                        <span class="input-wrap">
                            <input
                                type="email"
                                name="email"
                                value="{{ old('email') }}"
                                placeholder="Masukkan Email Anda"
                                autocomplete="email"
                                required
                                autofocus
                            >
                        </span>
                    </label>

                    <label class="form-field">
                        <span>Password</span>
                        <span class="input-wrap">
                            <input
                                id="admin-password"
                                type="password"
                                name="password"
                                placeholder="Masukkan Password Anda"
                                autocomplete="current-password"
                                required
                            >
                            <button class="password-toggle" type="button" data-password-toggle aria-label="Tampilkan password">
                                {!! $svg('eye', 'field-icon') !!}
                            </button>
                        </span>
                    </label>

                    <div class="login-row">
                        <a href="#">Lupa Password?</a>
                    </div>

                    <button class="primary-button" type="submit">Masuk</button>
                </form>
            </div>
        </section>
    </main>
</body>
</html>
