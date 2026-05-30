@extends('admin.layout')

@section('subtitle', 'Kelola modul operasional pendukung dari panel admin.')

@section('content')
    <section class="status-summary-grid">
        @foreach ($summary as $item)
            <article>
                <span>{{ strtoupper($item['label']) }}</span>
                <strong>{{ is_numeric($item['value']) ? number_format($item['value'], 0, ',', '.') : $item['value'] }}</strong>
            </article>
        @endforeach
    </section>

    <section class="table-card">
        <div class="section-heading">
            <div>
                <h2>{{ $title }}</h2>
                <p>Data terbaru dari modul {{ strtolower($title) }}.</p>
            </div>
        </div>

        <div class="table-scroll">
            <table class="admin-table">
                <thead>
                    <tr>
                        @foreach ($columns as $column)
                            <th>{{ $column }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @forelse ($rows as $row)
                        @if ($type === 'promo')
                            <tr>
                                <td><strong>{{ $row->code }}</strong></td>
                                <td>{{ $row->title }}</td>
                                <td>{{ $row->discount_percent }}% <small>Maks. Rp {{ number_format($row->max_discount, 0, ',', '.') }}</small></td>
                                <td>{{ number_format($row->used_count, 0, ',', '.') }} / {{ number_format($row->quota, 0, ',', '.') }}</td>
                                <td><span class="status-pill {{ $row->is_active ? 'status-completed' : 'status-cancelled' }}">{{ $row->is_active ? 'AKTIF' : 'NONAKTIF' }}</span></td>
                            </tr>
                        @elseif ($type === 'reports')
                            <tr>
                                <td>{{ $row->reporter?->name ?: '-' }}</td>
                                <td>{{ $row->reported?->name ?: '-' }}</td>
                                <td>{{ $row->reason }}</td>
                                <td><span class="status-pill status-{{ $row->status }}">{{ strtoupper($row->status) }}</span></td>
                                <td>{{ $row->created_at?->format('d M Y') }}</td>
                            </tr>
                        @elseif ($type === 'messages')
                            <tr>
                                <td>{{ $row->title }}</td>
                                <td><span class="route-cell">{{ $row->message }}</span></td>
                                <td>{{ $row->user_id ? 'Personal' : 'Global' }}</td>
                                <td><span class="status-pill {{ $row->is_read ? 'status-completed' : 'status-pending' }}">{{ $row->is_read ? 'DIBACA' : 'BARU' }}</span></td>
                                <td>{{ $row->created_at?->format('d M Y') }}</td>
                            </tr>
                        @elseif ($type === 'withdrawals')
                            <tr>
                                <td>{{ $row->driver?->name ?: 'Driver FivGo' }}</td>
                                <td>Rp {{ number_format($row->amount, 0, ',', '.') }}</td>
                                <td><span class="status-pill status-{{ $row->status }}">{{ strtoupper($row->status) }}</span></td>
                                <td>{{ $row->notes ?: '-' }}</td>
                                <td>{{ $row->created_at?->format('d M Y') }}</td>
                            </tr>
                        @endif
                    @empty
                        <tr>
                            <td colspan="{{ count($columns) }}" class="empty-table">Data belum tersedia.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>
@endsection
