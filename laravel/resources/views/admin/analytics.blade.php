@extends('admin.layout')

@section('subtitle', 'Pantau performa operasional armada secara real-time.')

@section('actions')
    <button class="filter-button" type="button">Rentang Waktu</button>
@endsection

@section('content')
    <section class="metric-grid analytics-metrics">
        @foreach ($metrics as $metric)
            <article class="analytics-card">
                <span class="metric-icon is-{{ $metric['tone'] }}" data-icon="{{ $metric['icon'] }}"></span>
                <span class="delta-pill is-{{ $metric['tone'] }}">{{ $metric['delta'] }}</span>
                <p>{{ $metric['label'] }}</p>
                <strong>{{ $metric['value'] }}</strong>
            </article>
        @endforeach
    </section>

    <section class="analytics-grid">
        <article class="chart-card">
            <div class="section-heading">
                <div>
                    <h2>Tren Order</h2>
                    <p>Volume pesanan dalam tujuh hari terakhir.</p>
                </div>
            </div>

            <div class="bar-chart" aria-label="Grafik order tujuh hari">
                @foreach ($series as $point)
                    <span style="--bar-height: {{ max(8, ($point['orders'] / $maxSeries) * 100) }}%;">
                        <b>{{ $point['orders'] }}</b>
                        <small>{{ $point['label'] }}</small>
                    </span>
                @endforeach
            </div>
        </article>

        @php
            $statusTotal = max(1, array_sum($statusCounts));
            $completed = ($statusCounts['completed'] / $statusTotal) * 100;
            $started = (($statusCounts['started'] + $statusCounts['accepted']) / $statusTotal) * 100;
            $pending = ($statusCounts['pending'] / $statusTotal) * 100;
            $cancelled = (($statusCounts['cancelled'] + $statusCounts['rejected']) / $statusTotal) * 100;
        @endphp

        <article class="donut-card">
            <h2>Distribusi Status Order</h2>
            <div
                class="donut-chart"
                style="--complete: {{ $completed }}%; --ongoing: {{ $completed + $started }}%; --scheduled: {{ $completed + $started + $pending }}%;"
            >
                <span>
                    <b>Total</b>
                    <strong>{{ number_format($statusTotal === 1 && array_sum($statusCounts) === 0 ? 0 : $statusTotal, 0, ',', '.') }}</strong>
                </span>
            </div>
            <div class="legend-list">
                <span><i class="legend-complete"></i>Selesai <b>{{ number_format($completed, 0) }}%</b></span>
                <span><i class="legend-ongoing"></i>On-Going <b>{{ number_format($started, 0) }}%</b></span>
                <span><i class="legend-scheduled"></i>Dijadwalkan <b>{{ number_format($pending, 0) }}%</b></span>
                <span><i class="legend-cancelled"></i>Dibatalkan <b>{{ number_format($cancelled, 0) }}%</b></span>
            </div>
        </article>
    </section>

    <section class="table-card">
        <div class="section-heading">
            <div>
                <h2>Performa Driver</h2>
                <p>Driver dengan kontribusi order dan rating tertinggi.</p>
            </div>
        </div>

        <div class="table-scroll">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Driver</th>
                        <th>Order</th>
                        <th>Rating</th>
                        <th>Rasio</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($topDrivers as $driver)
                        <tr>
                            <td>
                                <span class="person-cell">
                                    <span class="mini-avatar">{{ strtoupper(substr($driver['name'], 0, 1)) }}</span>
                                    {{ $driver['name'] }}
                                </span>
                            </td>
                            <td>{{ $driver['orders'] }}</td>
                            <td>{{ number_format((float) $driver['rating'], 1) }}</td>
                            <td>{{ $driver['orders'] > 0 ? '4.7' : '-' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="empty-table">Belum ada data driver.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>
@endsection
