@extends('admin.layout')

@section('subtitle', 'Tinjau kelengkapan dokumen dan status verifikasi driver.')

@section('content')
    <section class="status-summary-grid">
        <article><span>PENDING</span><strong>{{ $pendingCount }}</strong></article>
        <article><span>APPROVED</span><strong>{{ $approvedCount }}</strong></article>
        <article><span>REJECTED</span><strong>{{ $rejectedCount }}</strong></article>
    </section>

    <section class="table-card">
        <div class="section-heading">
            <div>
                <h2>Dokumen Driver</h2>
                <p>Daftar dokumen KTP, SIM, dan STNK yang masuk ke sistem.</p>
            </div>
        </div>

        <div class="table-scroll">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Driver</th>
                        <th>Tipe</th>
                        <th>File</th>
                        <th>Status</th>
                        <th>Masuk</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($documents as $document)
                        <tr>
                            <td>{{ $document->user?->name ?: 'Driver FivGo' }}</td>
                            <td>{{ strtoupper($document->type) }}</td>
                            <td><span class="route-cell">{{ $document->file_path }}</span></td>
                            <td><span class="status-pill status-{{ $document->status }}">{{ strtoupper($document->status) }}</span></td>
                            <td>{{ $document->created_at?->format('d M Y H:i') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="empty-table">Belum ada dokumen driver.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="pagination-wrap">
            {{ $documents->links() }}
        </div>
    </section>
@endsection
