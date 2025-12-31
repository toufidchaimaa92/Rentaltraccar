<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\UpdatesUserProfileInformation;

class UpdateUserProfileInformation implements UpdatesUserProfileInformation
{
    /**
     * Validate and update the given user's profile information.
     *
     * @param  array<string, string>  $input
     */
    public function update(User $user, array $input): void
    {
        $email = trim((string) ($input['email'] ?? ''));
        $phone = preg_replace('/\\s+/', '', (string) ($input['phone'] ?? ''));

        $input['email'] = $email !== '' ? $email : null;
        $input['phone'] = $phone !== '' ? $phone : null;

        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                'required_without:phone',
                Rule::unique('users')->ignore($user->id),
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                'required_without:email',
                'regex:/^\\+\\d{6,20}$/',
                Rule::unique('users', 'phone')->ignore($user->id),
            ],
        ])->validateWithBag('updateProfileInformation');

        $user->forceFill([
            'name' => $input['name'],
            'email' => $input['email'],
            'phone' => $input['phone'],
        ])->save();
    }
}
