<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class VerificationController extends Controller
{
    public function sendCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required'
        ]);

        try {
            Mail::raw("Your URSAC Hub verification code is: {$request->code}", function ($message) use ($request) {
                $message->to($request->email)
                        ->subject('URSAC Hub Email Verification Code');
            });
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}