<?php

namespace App\Providers;

use App\Actions\Fortify\ResetUserPassword;
use App\Actions\Fortify\UpdateUserPassword;
use App\Actions\Fortify\UpdateUserProfileInformation;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Fortify::updateUserProfileInformationUsing(UpdateUserProfileInformation::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        Fortify::authenticateUsing(function (Request $request) {
            $login = trim((string) $request->input(Fortify::username()));
            $login = preg_replace('/\\s+/', '', $login);
            $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

            $user = User::where($field, $login)->first();

            if (!$user) {
                return null;
            }

            if ($user->isSuspended()) {
                throw ValidationException::withMessages([
                    Fortify::username() => __('Your account has been suspended.'),
                ]);
            }

            if (Hash::check($request->password, $user->password)) {
                return $user;
            }

            return null;
        });

        RateLimiter::for('login', function (Request $request) {
            $login = trim((string) $request->input(Fortify::username()));
            $login = preg_replace('/\\s+/', '', $login);
            $throttleKey = Str::transliterate(Str::lower($login).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });
    }
}
