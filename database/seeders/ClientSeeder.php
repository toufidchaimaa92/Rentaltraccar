<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClientSeeder extends Seeder
{
    public function run()
    {
        // Insert multiple clients
        DB::table('clients')->insert([
            [
                'name' => 'Ahmed Benali',
                'phone' => '0612345678',
                'identity_card_number' => 'AB123456',
                'address' => '123 Rue de Casablanca, Casablanca',
                'license_number' => 'DL1234567',
                'license_date' => '2020-01-15',
                'license_expiration_date' => '2030-01-15',
                'license_front_image' => 'licenses/ahmed_front.jpg',
                'license_back_image' => 'licenses/ahmed_back.jpg',
                'cin_front_image' => 'cin/ahmed_cin_front.jpg',
                'cin_back_image' => 'cin/ahmed_cin_back.jpg',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sara El Idrissi',
                'phone' => '0623456789',
                'identity_card_number' => 'CD789012',
                'address' => '45 Avenue des Fleurs, Rabat',
                'license_number' => 'DL7654321',
                'license_date' => '2018-06-10',
                'license_expiration_date' => '2028-06-10',
                'license_front_image' => 'licenses/sara_front.jpg',
                'license_back_image' => 'licenses/sara_back.jpg',
                'cin_front_image' => 'cin/sara_cin_front.jpg',
                'cin_back_image' => 'cin/sara_cin_back.jpg',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Youssef Lahlou',
                'phone' => '0634567890',
                'identity_card_number' => 'EF345678',
                'address' => '78 Boulevard Mohammed V, Marrakech',
                'license_number' => 'DL3456789',
                'license_date' => '2019-03-20',
                'license_expiration_date' => '2029-03-20',
                'license_front_image' => 'licenses/youssef_front.jpg',
                'license_back_image' => 'licenses/youssef_back.jpg',
                'cin_front_image' => 'cin/youssef_cin_front.jpg',
                'cin_back_image' => 'cin/youssef_cin_back.jpg',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
