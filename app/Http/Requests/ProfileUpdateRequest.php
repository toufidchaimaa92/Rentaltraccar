<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $email = trim((string) $this->input('email', ''));
        $phone = preg_replace('/\\s+/', '', (string) $this->input('phone', ''));

        $this->merge([
            'email' => $email !== '' ? $email : null,
            'phone' => $phone !== '' ? $phone : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'string',
                'lowercase',
                'email',
                'max:255',
                'required_without:phone',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                'required_without:email',
                'regex:/^\\+\\d{6,20}$/',
                Rule::unique(User::class, 'phone')->ignore($this->user()->id),
            ],
        ];
    }
}
