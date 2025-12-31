<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('user can update their password with valid data', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/account/profile')
        ->put('/user/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
});

test('user cannot update password with incorrect current password', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/account/profile')
        ->put('/user/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasErrors()
        ->assertRedirect();
});

test('new password must be confirmed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/account/profile')
        ->put('/user/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'different-password',
        ]);

    $response
        ->assertSessionHasErrors()
        ->assertRedirect();
});

test('new password must be at least 8 characters', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/account/profile')
        ->put('/user/password', [
            'current_password' => 'password',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

    $response
        ->assertSessionHasErrors()
        ->assertRedirect();
});
