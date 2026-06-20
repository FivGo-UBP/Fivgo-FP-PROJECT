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

        return view('admin.promo', [
            'active' => 'promo',
            'title' => 'Promo',
            'promos' => Promo::latest()->get(),
        ]);
    }

    public function createPromo()
    {
        $this->ensureAdmin();

        return view('admin.promo-create', [
            'active' => 'promo',
            'title' => 'Promo > Buat Promo Baru',
        ]);
    }

    public function storePromo(Request $request)
    {
        $this->ensureAdmin();

        $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:event,voucher',
            'discount_percent' => 'required|integer|min:0|max:100',
            'end_date' => 'required|date',
            'start_date' => 'nullable|date',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'code' => 'nullable|string|max:255',
            'quota' => 'nullable|integer|min:0',
            'max_discount' => 'nullable|integer|min:0',
            'min_order_amount' => 'nullable|integer|min:0',
            'limit_per_user' => 'nullable|integer|min:1',
        ]);

        $code = $request->code ?: strtoupper(\Illuminate\Support\Str::slug($request->title, ''));
        
        $originalCode = $code;
        $counter = 1;
        while (Promo::where('code', $code)->exists()) {
            $code = $originalCode . $counter;
            $counter++;
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('assets/promo/images'), $filename);
            $imagePath = 'assets/promo/images/' . $filename;
        }

        Promo::create([
            'type' => $request->type,
            'code' => $code,
            'title' => $request->title,
            'description' => $request->description,
            'discount_percent' => $request->discount_percent,
            'max_discount' => $request->max_discount ?? 50000,
            'min_order_amount' => $request->min_order_amount ?? 0,
            'limit_per_user' => $request->limit_per_user ?? 1,
            'quota' => $request->quota ?? 1000,
            'used_count' => 0,
            'start_date' => $request->start_date ?: now(),
            'end_date' => $request->end_date,
            'is_active' => true,
            'image' => $imagePath,
        ]);

        return redirect()->route('admin.promo')->with('status', 'Promo baru berhasil dibuat!');
    }

    public function editPromo($id)
    {
        $this->ensureAdmin();

        $promo = Promo::findOrFail($id);

        return view('admin.promo-create', [
            'active' => 'promo',
            'title' => 'Promo > Edit Promo',
            'promo' => $promo,
        ]);
    }

    public function updatePromo(Request $request, $id)
    {
        $this->ensureAdmin();

        $promo = Promo::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:event,voucher',
            'discount_percent' => 'required|integer|min:0|max:100',
            'end_date' => 'required|date',
            'start_date' => 'nullable|date',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'code' => 'nullable|string|max:255',
            'quota' => 'nullable|integer|min:0',
            'max_discount' => 'nullable|integer|min:0',
            'min_order_amount' => 'nullable|integer|min:0',
            'limit_per_user' => 'nullable|integer|min:1',
        ]);

        $code = $request->code ?: $promo->code;
        if ($code !== $promo->code) {
            $originalCode = $code;
            $counter = 1;
            while (Promo::where('code', $code)->where('id', '!=', $id)->exists()) {
                $code = $originalCode . $counter;
                $counter++;
            }
        }

        $data = [
            'type' => $request->type,
            'code' => $code,
            'title' => $request->title,
            'description' => $request->description,
            'discount_percent' => $request->discount_percent,
            'max_discount' => $request->max_discount ?? 50000,
            'min_order_amount' => $request->min_order_amount ?? 0,
            'limit_per_user' => $request->limit_per_user ?? 1,
            'quota' => $request->quota ?? 1000,
            'start_date' => $request->start_date ?: ($promo->start_date ?: now()),
            'end_date' => $request->end_date,
        ];

        if ($request->hasFile('image')) {
            if ($promo->image && file_exists(public_path($promo->image))) {
                @unlink(public_path($promo->image));
            }

            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('assets/promo/images'), $filename);
            $data['image'] = 'assets/promo/images/' . $filename;
        }

        $promo->update($data);

        return redirect()->route('admin.promo')->with('status', 'Promo berhasil diperbarui!');
    }

    public function destroyPromo($id)
    {
        $this->ensureAdmin();

        $promo = Promo::findOrFail($id);

        if ($promo->image && file_exists(public_path($promo->image))) {
            @unlink(public_path($promo->image));
        }

        $promo->delete();

        return redirect()->route('admin.promo')->with('status', 'Promo berhasil dihapus!');
    }

    public function reportsCustomer(Request $request)
    {
        return $this->getReportsPage($request, 'customer');
    }

    public function reportsDriver(Request $request)
    {
        return $this->getReportsPage($request, 'driver');
    }

    private function getReportsPage(Request $request, string $role)
    {
        $this->ensureAdmin();

        $segmentType = $request->input('type', 'biasa');
        $status = $request->input('status');
        $time = $request->input('time');

        $query = Report::with(['reporter', 'reported.driverProfile'])
            ->where('type', $segmentType);

        // Filter reports by the reporter's role (customer or driver)
        $query->where(function ($q) use ($role, $segmentType) {
            $q->whereHas('reporter', fn ($r) => $r->where('role', $role));
            if ($segmentType === 'biasa') {
                $q->orWhereHas('reporter', fn ($r) => $r->where('role', 'admin'));
            }
        });

        if ($status) {
            $query->where('status', $status);
        }

        if ($time) {
            if ($time === 'day') {
                $query->whereDate('created_at', today());
            } elseif ($time === 'week') {
                $query->where('created_at', '>=', now()->startOfWeek());
            } elseif ($time === 'month') {
                $query->where('created_at', '>=', now()->startOfMonth());
            }
        }

        $reports = $query->latest()->paginate(10)->withQueryString();

        return view('admin.reports', [
            'active' => 'reports-' . $role,
            'title' => 'Laporan > ' . ucfirst($role),
            'role' => $role,
            'type' => $segmentType,
            'reports' => $reports,
        ]);
    }

    public function updateReportStatus(Request $request, $id)
    {
        $this->ensureAdmin();

        $report = Report::findOrFail($id);
        $request->validate([
            'status' => 'required|in:open,in_progress,resolved'
        ]);

        $report->update([
            'status' => $request->status,
        ]);

        return back()->with('status', 'Status laporan berhasil diperbarui.');
    }

    public function destroyReport($id)
    {
        $this->ensureAdmin();

        $report = Report::findOrFail($id);
        $report->delete();

        return back()->with('status', 'Laporan berhasil dihapus.');
    }

    public function tindakanReport(Request $request)
    {
        $this->ensureAdmin();

        $request->validate([
            'report_id'   => 'required|exists:reports,id',
            'action'      => 'required|in:terima,tolak',
            'message'     => 'required|string|max:500',
        ]);

        $report = Report::findOrFail($request->report_id);

        if ($request->action === 'terima') {
            // Terima laporan: update status to in_progress & notify reported user
            $report->update(['status' => 'in_progress']);

            if ($report->reported_id) {
                Notification::create([
                    'user_id' => $report->reported_id,
                    'title'   => 'Peringatan dari Admin FivGo',
                    'message' => $request->message,
                    'is_read' => false,
                ]);
            }
        } else {
            // Tolak laporan: resolve without notification to reported
            $report->update(['status' => 'resolved']);
        }

        return response()->json(['success' => true, 'action' => $request->action]);
    }

    public function messages()
    {
        $this->ensureAdmin();

        return view('admin.messages', [
            'active' => 'messages',
            'title' => 'Pesan',
        ]);
    }

    public function getConversations(Request $request)
    {
        $this->ensureAdmin();
        $adminId = Auth::id();
        $role = $request->query('role', 'customer');

        $chats = \App\Models\Chat::whereNull('order_id')
            ->where(function ($q) use ($adminId) {
                $q->where('sender_id', $adminId)->orWhere('receiver_id', $adminId);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Group by the other user's ID
        $grouped = $chats->groupBy(function ($chat) use ($adminId) {
            return $chat->sender_id === $adminId ? $chat->receiver_id : $chat->sender_id;
        });

        $conversations = [];
        foreach ($grouped as $otherUserId => $userChats) {
            $latestChat = $userChats->first();
            $otherUser = \App\Models\User::find($otherUserId);
            if (!$otherUser || $otherUser->role !== $role) {
                continue;
            }

            // Calculate unread count for admin (chats where receiver_id is admin and is_read is false)
            $unreadCount = $userChats->where('receiver_id', $adminId)->where('is_read', false)->count();

            $conversations[] = [
                'user' => [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'photo' => $otherUser->profile_picture ? asset('assets/driver/profile_pictures/' . $otherUser->profile_picture) : ($otherUser->photo ? asset('assets/driver/profile_pictures/' . $otherUser->photo) : null),
                    'role' => $otherUser->role,
                    'initials' => collect(explode(' ', $otherUser->name))
                        ->filter()
                        ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
                        ->take(2)
                        ->join(''),
                ],
                'last_message' => $latestChat->message ?: '[Gambar]',
                'last_message_time' => $latestChat->created_at->format('H.i'),
                'unread_count' => $unreadCount,
                'created_at' => $latestChat->created_at,
            ];
        }

        // Sort by latest message time
        usort($conversations, function ($a, $b) {
            return $b['created_at'] <=> $a['created_at'];
        });

        return response()->json(['data' => $conversations]);
    }

    public function getChatMessages(Request $request, $userId)
    {
        $this->ensureAdmin();
        $adminId = Auth::id();

        $chats = \App\Models\Chat::whereNull('order_id')
            ->where(function ($q) use ($userId, $adminId) {
                $q->where(function ($sub) use ($userId, $adminId) {
                    $sub->where('sender_id', $userId)->where('receiver_id', $adminId);
                })->orWhere(function ($sub) use ($userId, $adminId) {
                    $sub->where('sender_id', $adminId)->where('receiver_id', $userId);
                });
            })
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark as read
        \App\Models\Chat::whereNull('order_id')
            ->where('sender_id', $userId)
            ->where('receiver_id', $adminId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['data' => $chats]);
    }

    public function adminSendMessage(Request $request)
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'message' => 'nullable|string',
            'image'   => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
        ]);

        if (empty($validated['message']) && !$request->hasFile('image')) {
            return response()->json(['message' => 'Pesan atau gambar harus diisi.'], 422);
        }

        $adminId = Auth::id();
        $userId = $validated['user_id'];

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $upload = new \Cloudinary\Api\Upload\UploadApi();
            $response = $upload->upload($request->file('image')->getRealPath());
            $imageUrl = $response['secure_url'];
        }

        $chat = \App\Models\Chat::create([
            'order_id'    => null,
            'sender_id'   => $adminId,
            'receiver_id' => $userId,
            'message'     => $validated['message'] ?? '',
            'image_url'   => $imageUrl,
            'is_read'     => false,
        ]);

        try {
            broadcast(new \App\Events\MessageSent($chat))->toOthers();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Broadcasting failed: ' . $e->getMessage());
        }

        return response()->json($chat, 201);
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
