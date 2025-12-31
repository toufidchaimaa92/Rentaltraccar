<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;
use App\Models\UserProfile;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->profile ?? new UserProfile();

        return Inertia::render('Profile/Show', [
            'mustVerifyEmail' => false,
            'isUpdateProfileEnabled' => Features::enabled(Features::updateProfileInformation()),
            'isUpdatePasswordEnabled' => Features::enabled(Features::updatePasswords()),
            'user' => $user,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        $email = trim((string) $request->input('email', ''));
        $phone = preg_replace('/\s+/', '', (string) $request->input('phone', ''));

        $request->merge([
            'email' => $email !== '' ? $email : null,
            'phone' => $phone !== '' ? $phone : null,
        ]);

        $input = $request->all();

        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'required_without:phone', Rule::unique('users')->ignore($request->user()->id)],
            'phone' => ['nullable', 'string', 'max:20', 'required_without:email', 'regex:/^\\+\\d{6,20}$/', Rule::unique('users', 'phone')->ignore($request->user()->id)],
            'photo' => ['nullable', 'mimes:jpg,jpeg,png', 'max:1024'],
        ])->validateWithBag('updateProfileInformation');

        $user = $request->user();

        // Handle profile photo update if provided
        if (isset($input['photo'])) {
            $user->updateProfilePhoto($input['photo']);
        }

        // Update name and email on users table
        $user->forceFill([
            'name' => $input['name'],
            'email' => $input['email'],
            'phone' => $input['phone'],
        ])->save();


        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        return Redirect::route('profile.show');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
