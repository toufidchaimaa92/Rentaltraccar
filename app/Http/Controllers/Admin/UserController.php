<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display the list of users with filters.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', Rule::in($this->roles())],
            'status' => ['nullable', Rule::in($this->statuses())],
            'sort_by' => ['nullable', Rule::in($this->sortableColumns())],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $sortBy = $validated['sort_by'] ?? 'name';
        $sortDir = $validated['sort_dir'] ?? 'asc';

        $users = User::query()
            ->where('role', '!=', 'admin')
            ->when($validated['search'] ?? null, function ($query, string $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($validated['role'] ?? null, fn ($query, string $role) => $query->where('role', $role))
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->orderBy($sortBy, $sortDir)
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'status' => $user->status,
                'notes' => $user->notes,
                'created_at' => optional($user->created_at)->toDateTimeString(),
                'updated_at' => optional($user->updated_at)->toDateTimeString(),
            ]);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $validated['search'] ?? '',
                'role' => $validated['role'] ?? '',
                'status' => $validated['status'] ?? '',
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'meta' => [
                'roles' => $this->roles(),
                'statuses' => $this->statuses(),
            ],
        ]);
    }

    /**
     * Create a new user.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->normalizeContactInput($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'required_without:phone', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20', 'required_without:email', 'regex:/^\\+\\d{6,20}$/', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in($this->roles())],
            'status' => ['required', Rule::in($this->statuses())],
            'notes' => ['nullable', 'string'],
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'status' => $data['status'],
            'notes' => $data['notes'] ?? null,
        ]);

        return Redirect::back()->with('success', 'User created successfully.');
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $this->normalizeContactInput($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'required_without:phone', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20', 'required_without:email', 'regex:/^\\+\\d{6,20}$/', Rule::unique('users', 'phone')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', Rule::in($this->roles())],
            'status' => ['required', Rule::in($this->statuses())],
            'notes' => ['nullable', 'string'],
        ]);

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'],
            'status' => $data['status'],
            'notes' => $data['notes'] ?? null,
        ];

        if (!empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        $user->update($payload);

        return Redirect::back()->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): RedirectResponse
    {
        if (auth()->id() === $user->id) {
            return Redirect::back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return Redirect::back()->with('success', 'User removed successfully.');
    }

    /**
     * Available roles.
     */
    protected function roles(): array
    {
        return ['admin', 'manager', 'employee', 'controller'];
    }

    /**
     * Available statuses.
     */
    protected function statuses(): array
    {
        return ['active', 'suspended'];
    }

    /**
     * Allowed sortable columns.
     */
    protected function sortableColumns(): array
    {
        return ['name', 'email', 'phone', 'role', 'status', 'created_at'];
    }

    protected function normalizeContactInput(Request $request): void
    {
        $email = trim((string) $request->input('email', ''));
        $phone = preg_replace('/\\s+/', '', (string) $request->input('phone', ''));

        $request->merge([
            'email' => $email !== '' ? $email : null,
            'phone' => $phone !== '' ? $phone : null,
        ]);
    }
}
