<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSingleSession
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth('api')->check()) {
            $user = auth('api')->user();
            $tokenSessionId = auth('api')->payload()->get('session_id');

            // If the session_id doesn't match the current_session_id in database, token is invalid
            if (!$user->current_session_id || $tokenSessionId !== $user->current_session_id) {
                // Optionally logout to invalidate the token completely, but since it's already invalid, we just reject it.
                return response()->json([
                    'message' => 'Sesi Anda telah berakhir karena Anda login di perangkat lain.',
                    'error_code' => 'SESSION_EXPIRED'
                ], 401);
            }
        }

        return $next($request);
    }
}
