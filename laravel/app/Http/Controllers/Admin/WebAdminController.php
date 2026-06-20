<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DriverDocument;
use App\Models\DriverProfile;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Promo;
use App\Models\Report;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WebAdminController extends Controller
{
    public function showLogin()
    {
        if (Auth::check() && Auth::user()->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }

        return view('admin.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $credentials['role'] = 'admin';

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            return back()
                ->withErrors(['email' => 'Email atau password admin salah.'])
                ->onlyInput('email');
        }

        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }

    public function dashboard()
    {
        $this->ensureAdmin();

        $statusCounts = $this->orderStatusCounts();
        $activeOrders = $this->activeOrders(10);
        $assignedOrders = $this->assignedOrders(10);
        $drivers = $this->driversWithLocation(12);
        $recentOrders = Order::with(['customer', 'driver'])
            ->latest()
            ->limit(8)
            ->get();

        return view('admin.dashboard', [
            'active' => 'dashboard',
            'title' => 'Dashboard',
            'metrics' => [
                [
                    'label' => 'Total Pelanggan',
                    'value' => $this->compactNumber(User::where('role', 'customer')->count()),
                    'icon' => 'users',
                    'tone' => 'green',
                ],
                [
                    'label' => 'Total Driver',
                    'value' => $this->compactNumber(User::where('role', 'driver')->count()),
                    'icon' => 'driver',
                    'tone' => 'yellow',
                ],
                [
                    'label' => 'Order hari ini',
                    'value' => $this->compactNumber(Order::whereDate('created_at', today())->count()),
                    'icon' => 'order',
                    'tone' => 'blue',
                ],
            ],
            'statusCounts' => $statusCounts,
            'recentOrders' => $recentOrders,
            'activeOrders' => $activeOrders,
            'mapboxToken' => config('services.mapbox.token'),
            'mapData' => $this->mapData($drivers, $assignedOrders),
        ]);
    }

    public function monitoring()
    {
        $this->ensureAdmin();
        $assignedOrders = $this->assignedOrders(14);
        $drivers = $this->driversWithLocation(24);

        return view('admin.monitoring', [
            'active' => 'monitoring',
            'title' => 'Monitoring',
            'activeOrders' => $assignedOrders,
            'drivers' => $drivers,
            'mapboxToken' => config('services.mapbox.token'),
            'mapData' => $this->mapData($drivers, $assignedOrders),
        ]);
    }

    public function analytics()
    {
        $this->ensureAdmin();

        $totalOrders = Order::count();
        $completedOrders = Order::where('status', 'completed')->count();
        $cancelledOrders = Order::whereIn('status', ['cancelled', 'rejected'])->count();
        $revenue = (int) Order::sum('final_price');

        $series = collect(range(6, 0))->map(function (int $daysAgo) {
            $date = today()->subDays($daysAgo);

            return [
                'label' => $date->format('d M'),
                'orders' => Order::whereDate('created_at', $date)->count(),
            ];
        });

        $maxSeries = max(1, $series->max('orders'));

        return view('admin.analytics', [
            'active' => 'analytics',
            'title' => 'Analitik',
            'metrics' => [
                [
                    'label' => 'Total Order',
                    'value' => $this->compactNumber($totalOrders),
                    'delta' => '+5.1%',
                    'tone' => 'green',
                    'icon' => 'order',
                ],
                [
                    'label' => 'Total Pendapatan',
                    'value' => $this->rupiah($revenue),
                    'delta' => '+5.1%',
                    'tone' => 'green',
                    'icon' => 'wallet',
                ],
                [
                    'label' => 'Driver Aktif',
                    'value' => $this->compactNumber(DriverProfile::whereIn('status', ['online', 'active', 'busy'])->count()),
                    'delta' => '-5.1%',
                    'tone' => 'red',
                    'icon' => 'driver',
                ],
                [
                    'label' => 'Customer Aktif',
                    'value' => $this->compactNumber(User::where('role', 'customer')->whereNotNull('phone_verified_at')->count()),
                    'delta' => '+5.1%',
                    'tone' => 'green',
                    'icon' => 'users',
                ],
                [
                    'label' => 'Tingkat Penyelesaian',
                    'value' => $this->percentage($completedOrders, $totalOrders),
                    'delta' => '+5.1%',
                    'tone' => 'green',
                    'icon' => 'check',
                ],
                [
                    'label' => 'Tingkat pembatalan',
                    'value' => $this->percentage($cancelledOrders, $totalOrders),
                    'delta' => '+5.1%',
                    'tone' => 'green',
                    'icon' => 'warning',
                ],
            ],
            'series' => $series,
            'maxSeries' => $maxSeries,
            'statusCounts' => $this->orderStatusCounts(),
            'topDrivers' => $this->topDrivers(),
        ]);
    }

    public function customers(Request $request)
    {
        $this->ensureAdmin();

        return $this->usersPage($request, 'customer', 'Pengguna > Customer', 'customers');
    }

    public function drivers(Request $request)
    {
        $this->ensureAdmin();

        return $this->usersPage($request, 'driver', 'Pengguna > Driver', 'drivers');
    }

    public function showCustomer($id)
    {
        $this->ensureAdmin();

        $customer = User::where('role', 'customer')->findOrFail($id);
        $orders = Order::where('customer_id', $id)->latest()->get();

        return view('admin.customer-detail', [
            'active' => 'customer-detail',
            'title' => 'Pengguna > Customer > Lihat Detail',
            'customer' => $customer,
            'orders' => $orders,
        ]);
    }

    public function destroyCustomer($id)
    {
        $this->ensureAdmin();

        $customer = User::where('role', 'customer')->findOrFail($id);
        $customer->delete();

        return back()->with('status', 'Akun customer berhasil dihapus.');
    }

    public function showDriver($id)
    {
        $this->ensureAdmin();

        $driver = User::with('driverProfile')->where('role', 'driver')->findOrFail($id);

        return view('admin.driver-detail', [
            'active' => 'drivers',
            'title' => 'Pengguna > Driver > Lihat Detail > Edit Profil',
            'driver' => $driver,
        ]);
    }

    public function updateDriver(Request $request, $id)
    {
        $this->ensureAdmin();

        $driver = User::with('driverProfile')->where('role', 'driver')->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'vehicle_brand' => 'required|string|max:255',
            'plate_number' => 'required|string|max:20',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $driver->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
        ]);

        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('assets/driver/profile_pictures'), $filename);
            $driver->update(['profile_picture' => $filename]);
        }

        if ($driver->driverProfile) {
            $driver->driverProfile->update([
                'vehicle_brand' => $request->vehicle_brand,
                'plate_number' => $request->plate_number,
            ]);
        }

        return back()->with('status', 'Profil driver berhasil diperbarui.');
    }

    public function destroyDriver($id)
    {
        $this->ensureAdmin();

        $driver = User::where('role', 'driver')->findOrFail($id);
        $driver->delete();

        return back()->with('status', 'Akun driver berhasil dihapus.');
    }

    public function verification()
    {
        $this->ensureAdmin();

        $documents = DriverDocument::with('user')
            ->latest()
            ->paginate(12);

        return view('admin.verification', [
            'active' => 'verification',
            'title' => 'Verifikasi Driver',
            'documents' => $documents,
            'pendingCount' => DriverDocument::where('status', 'pending')->count(),
            'approvedCount' => DriverDocument::where('status', 'approved')->count(),
            'rejectedCount' => DriverDocument::where('status', 'rejected')->count(),
        ]);
    }

    public function orders(Request $request)
    {
        $this->ensureAdmin();

        $orders = Order::with(['customer', 'driver'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->input('status')))
            ->when($request->filled('vehicle_type'), fn ($query) => $query->where('vehicle_type', $request->input('vehicle_type')))
            ->when($request->filled('q'), function ($query) use ($request) {
                $search = '%' . $request->input('q') . '%';

                $query->where(function ($query) use ($search) {
                    $query
                        ->where('pickup_address', 'like', $search)
                        ->orWhere('dropoff_address', 'like', $search)
                        ->orWhereHas('customer', fn ($query) => $query->where('name', 'like', $search)->orWhere('email', 'like', $search))
                        ->orWhereHas('driver', fn ($query) => $query->where('name', 'like', $search)->orWhere('email', 'like', $search));
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return view('admin.orders', [
            'active' => 'orders',
            'title' => 'Order',
            'orders' => $orders,
            'statusCounts' => $this->orderStatusCounts(),
        ]);
    }

    public function showOrder($id)
    {
        $this->ensureAdmin();

        $order = Order::with(['customer', 'driver.driverProfile'])->findOrFail($id);

        return view('admin.order-detail', [
            'active' => 'orders',
            'title' => 'Lihat Detail',
            'order' => $order,
            'mapboxToken' => config('services.mapbox.token'),
        ]);
    }

    public function promo()
    {
        $this->ensureAdmin();

        return view('admin.operational', [
            'active' => 'promo',
            'title' => 'Promo',
            'summary' => [
                ['label' => 'Promo Aktif', 'value' => Promo::where('is_active', true)->count()],
                ['label' => 'Total Kuota', 'value' => Promo::sum('quota')],
                ['label' => 'Terpakai', 'value' => Promo::sum('used_count')],
            ],
            'rows' => Promo::latest()->limit(12)->get(),
            'columns' => ['Kode', 'Judul', 'Diskon', 'Kuota', 'Status'],
            'type' => 'promo',
        ]);
    }

    public function reports()
    {
        $this->ensureAdmin();

        return view('admin.operational', [
            'active' => 'reports',
            'title' => 'Laporan',
            'summary' => [
                ['label' => 'Laporan Terbuka', 'value' => Report::where('status', 'open')->count()],
                ['label' => 'Diproses', 'value' => Report::where('status', 'in_progress')->count()],
                ['label' => 'Selesai', 'value' => Report::where('status', 'resolved')->count()],
            ],
            'rows' => Report::with(['reporter', 'reported'])->latest()->limit(12)->get(),
            'columns' => ['Pelapor', 'Dilaporkan', 'Alasan', 'Status', 'Tanggal'],
            'type' => 'reports',
        ]);
    }

    public function messages()
    {
        $this->ensureAdmin();

        return view('admin.operational', [
            'active' => 'messages',
            'title' => 'Pesan',
            'summary' => [
                ['label' => 'Pesan Global', 'value' => Notification::whereNull('user_id')->count()],
                ['label' => 'Belum Dibaca', 'value' => Notification::where('is_read', false)->count()],
                ['label' => 'Total Pesan', 'value' => Notification::count()],
            ],
            'rows' => Notification::latest()->limit(12)->get(),
            'columns' => ['Judul', 'Pesan', 'Tipe', 'Status', 'Tanggal'],
            'type' => 'messages',
        ]);
    }

    public function withdrawals()
    {
        $this->ensureAdmin();

        return view('admin.operational', [
            'active' => 'withdrawals',
            'title' => 'Penarikan Saldo',
            'summary' => [
                ['label' => 'Menunggu', 'value' => Withdrawal::where('status', 'pending')->count()],
                ['label' => 'Diproses', 'value' => Withdrawal::where('status', 'processed')->count()],
                ['label' => 'Nominal Pending', 'value' => $this->rupiah((int) Withdrawal::where('status', 'pending')->sum('amount'))],
            ],
            'rows' => Withdrawal::with('driver')->latest()->limit(12)->get(),
            'columns' => ['Driver', 'Nominal', 'Status', 'Catatan', 'Tanggal'],
            'type' => 'withdrawals',
        ]);
    }

    public function createDriver()
    {
        $this->ensureAdmin();

        return view('admin.driver-create', [
            'active' => 'drivers',
            'title' => 'Tambah Akun'
        ]);
    }

    public function storeDriver(Request $request)
    {
        $this->ensureAdmin();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'dob' => 'nullable|date',
            'gender' => 'nullable|in:male,female',
            'city' => 'nullable|string',
            'phone' => 'required|string',
            'emergency_phone' => 'nullable|string',
            'vehicle_type' => 'required|in:motorcycle,car',
            'vehicle_plate' => 'required|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt('password123'),
            'role' => 'driver',
            'phone' => $request->phone,
            'is_active' => true,
        ]);

        DriverProfile::create([
            'user_id' => $user->id,
            'birth_date' => $request->dob,
            'gender' => $request->gender,
            'address' => $request->city,
            'emergency_contact' => $request->emergency_phone,
            'vehicle_type' => $request->vehicle_type,
            'vehicle_plate_number' => $request->vehicle_plate,
            'rating' => 5.0,
            'is_online' => false,
            'status' => 'offline',
        ]);

        return redirect()->route('admin.drivers')->with('status', 'Akun driver berhasil dibuat!');
    }

    public function toggleUserStatus(Request $request, string $id)
    {
        $this->ensureAdmin();

        $user = User::findOrFail($id);
        $user->is_active = ! $user->is_active;
        $user->save();

        $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('status', "Akun {$user->name} berhasil {$statusText}.");
    }

    private function usersPage(Request $request, string $role, string $title, string $active)
    {
        $users = User::query()
            ->with('driverProfile')
            ->where('users.role', $role)
            ->when($request->filled('q'), function ($query) use ($request) {
                $search = '%' . $request->input('q') . '%';

                $query->where(function ($query) use ($search) {
                    $query
                        ->where('users.name', 'like', $search)
                        ->orWhere('users.email', 'like', $search)
                        ->orWhere('users.phone', 'like', $search)
                        ->orWhere('users.id', 'like', $search);
                });
            })
            ->when($role === 'customer' && $request->filled('status'), function ($query) use ($request) {
                $status = $request->input('status');
                if ($status === 'active') {
                    $query->where('users.is_active', 1);
                } elseif ($status === 'inactive') {
                    $query->where('users.is_active', 0);
                }
            })
            ->when($role === 'driver' && $request->filled('status'), function ($query) use ($request) {
                $query->whereHas('driverProfile', fn ($query) => $query->where('status', $request->input('status')));
            })
            ->when($role === 'driver' && $request->filled('vehicle_type'), function ($query) use ($request) {
                $query->whereHas('driverProfile', fn ($query) => $query->where('vehicle_type', $request->input('vehicle_type')));
            })
            ->when($request->filled('sort_rating'), function ($query) use ($role, $request) {
                $direction = $request->input('sort_rating') === 'desc' ? 'desc' : 'asc';
                if ($role === 'driver') {
                    $query->leftJoin('driver_profiles', 'users.id', '=', 'driver_profiles.user_id')
                        ->select('users.*')
                        ->orderByRaw('CASE WHEN driver_profiles.rating IS NULL THEN 1 ELSE 0 END, driver_profiles.rating ' . $direction);
                } else {
                    $query->select('users.*')
                        ->orderByRaw('CASE WHEN users.rating IS NULL THEN 1 ELSE 0 END, users.rating ' . $direction);
                }
            }, function ($query) {
                $query->select('users.*')->latest('users.created_at');
            })
            ->paginate(10)
            ->withQueryString();

        return view('admin.users', [
            'active' => $active,
            'title' => $title,
            'role' => $role,
            'users' => $users,
        ]);
    }

    private function activeOrders(int $limit)
    {
        return Order::with(['customer', 'driver'])
            ->whereNotIn('status', ['completed', 'cancelled', 'rejected'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    private function assignedOrders(int $limit)
    {
        return Order::with(['customer', 'driver.driverProfile'])
            ->whereNotNull('driver_id')
            ->whereNotIn('status', ['completed', 'cancelled', 'rejected'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    private function driversWithLocation(int $limit)
    {
        return DriverProfile::with('user')
            ->whereIn('status', ['online', 'active', 'busy'])
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->latest()
            ->limit($limit)
            ->get();
    }

    private function mapData($drivers, $orders): array
    {
        $points = [];
        $routes = [];

        foreach ($drivers as $driver) {
            if (! $this->hasCoordinates($driver->current_lat, $driver->current_lng)) {
                continue;
            }

            $points[] = [
                'type' => 'driver',
                'label' => $driver->user?->name ?: 'Driver FivGo',
                'status' => $driver->status,
                'coordinates' => [(float) $driver->current_lng, (float) $driver->current_lat],
                'meta' => [
                    'vehicle' => $driver->vehicle_type ?: 'Kendaraan',
                    'plate' => $driver->plate_number ?: '-',
                    'rating' => number_format((float) $driver->rating, 1),
                ],
            ];
        }

        foreach ($orders as $order) {
            $orderId = substr($order->id, 0, 8);

            if ($this->hasCoordinates($order->pickup_lat, $order->pickup_lng)) {
                $points[] = [
                    'type' => 'pickup',
                    'label' => 'Pickup #' . $orderId,
                    'status' => $order->status,
                    'coordinates' => [(float) $order->pickup_lng, (float) $order->pickup_lat],
                    'meta' => [
                        'customer' => $order->customer?->name ?: 'Customer FivGo',
                        'driver' => $order->driver?->name ?: 'Belum ada driver',
                        'address' => $order->pickup_address,
                    ],
                ];
            }

            if ($this->hasCoordinates($order->dropoff_lat, $order->dropoff_lng)) {
                $points[] = [
                    'type' => 'dropoff',
                    'label' => 'Tujuan #' . $orderId,
                    'status' => $order->status,
                    'coordinates' => [(float) $order->dropoff_lng, (float) $order->dropoff_lat],
                    'meta' => [
                        'customer' => $order->customer?->name ?: 'Customer FivGo',
                        'driver' => $order->driver?->name ?: 'Belum ada driver',
                        'address' => $order->dropoff_address,
                    ],
                ];
            }

            if ($this->hasCoordinates($order->pickup_lat, $order->pickup_lng)
                && $this->hasCoordinates($order->dropoff_lat, $order->dropoff_lng)) {
                $routes[] = [
                    'id' => $order->id,
                    'status' => $order->status,
                    'coordinates' => [
                        [(float) $order->pickup_lng, (float) $order->pickup_lat],
                        [(float) $order->dropoff_lng, (float) $order->dropoff_lat],
                    ],
                ];
            }
        }

        return [
            'center' => $this->mapCenter($points),
            'points' => $points,
            'routes' => $routes,
        ];
    }

    private function mapCenter(array $points): array
    {
        if ($points === []) {
            return [107.298, -6.321];
        }

        $lng = array_sum(array_map(fn ($point) => $point['coordinates'][0], $points)) / count($points);
        $lat = array_sum(array_map(fn ($point) => $point['coordinates'][1], $points)) / count($points);

        return [$lng, $lat];
    }

    private function hasCoordinates($lat, $lng): bool
    {
        return is_numeric($lat) && is_numeric($lng);
    }

    private function orderStatusCounts(): array
    {
        $counts = Order::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        return [
            'pending' => (int) ($counts['pending'] ?? 0),
            'accepted' => (int) ($counts['accepted'] ?? 0),
            'started' => (int) ($counts['started'] ?? 0),
            'completed' => (int) ($counts['completed'] ?? 0),
            'cancelled' => (int) ($counts['cancelled'] ?? 0),
            'rejected' => (int) ($counts['rejected'] ?? 0),
        ];
    }

    private function topDrivers()
    {
        return User::with('driverProfile')
            ->where('role', 'driver')
            ->limit(6)
            ->get()
            ->map(function (User $driver) {
                return [
                    'name' => $driver->name ?: 'Driver FivGo',
                    'orders' => Order::where('driver_id', $driver->id)->count(),
                    'rating' => optional($driver->driverProfile)->rating ?: 0,
                ];
            })
            ->sortByDesc('orders')
            ->values();
    }

    private function ensureAdmin(): void
    {
        abort_unless(Auth::check() && Auth::user()->role === 'admin', 403);
    }

    private function compactNumber(int|float $value): string
    {
        return number_format((float) $value, 0, ',', '.');
    }

    private function rupiah(int|float $value): string
    {
        return 'Rp ' . number_format((float) $value, 0, ',', '.');
    }

    private function percentage(int|float $part, int|float $total): string
    {
        if ($total <= 0) {
            return '0%';
        }

        return number_format(($part / $total) * 100, 1, ',', '.') . '%';
    }
}
