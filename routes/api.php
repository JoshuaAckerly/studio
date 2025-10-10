<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\VisitNotification;

// Tracking endpoint (no CSRF protection in API)
Route::post('/track-visit', function (Request $request) {
    Log::info('Track-visit endpoint hit!', ['data' => $request->all()]);
    
    $data = $request->all();
    
    $visitData = [
        'referrer' => $data['referrer'] ?? null,
        'subdomain' => $data['subdomain'] ?? null,
        'page_title' => $data['page_title'] ?? null,
        'user_agent' => $data['user_agent'] ?? null,
        'timestamp' => $data['timestamp'] ?? now(),
        'ip' => $request->ip(),
    ];
    
    // Log the visit data
    Log::info('Subdomain visit tracked', $visitData);
    
    // Send email notification
    try {
        $adminEmail = config('mail.admin_email');
        Log::info('Attempting to send email to: ' . $adminEmail);
        
        Mail::to($adminEmail)->send(new VisitNotification($visitData));
        Log::info('Visit notification email sent successfully');
    } catch (\Exception $e) {
        Log::error('Failed to send visit notification email: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
    }
    
    return response()->json(['status' => 'success', 'data' => $visitData]);
});