<?php

namespace App\Http\Controllers;

use App\Mail\WelcomeSubscriberMail;
use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $subscriber = Subscriber::firstOrCreate(
            ['email' => $validated['email']],
            [
                'unsubscribe_token' => Str::uuid()->toString(),
                'confirmed_at' => now(),
            ]
        );

        if ($subscriber->wasRecentlyCreated) {
            Mail::to($subscriber->email)->send(new WelcomeSubscriberMail($subscriber));
        }

        return response()->json(['message' => 'Subscribed successfully.'], 201);
    }

    public function unsubscribe(string $token): RedirectResponse
    {
        $subscriber = Subscriber::where('unsubscribe_token', $token)->firstOrFail();
        $subscriber->delete();

        return redirect('/blog')->with('status', 'You have been unsubscribed.');
    }
}
