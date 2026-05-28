<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SetupUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user if not exists
        if (!User::where('email', 'admin@info-clash.com')->exists()) {
            User::create([
                'name' => 'Admin',
                'username' => 'admin',
                'email' => 'admin@info-clash.com',
                'password' => 'password',
                'role' => 'admin',
                'is_active' => true,
            ]);
            $this->command->info('Admin user created: admin / password');
        } else {
            // Update existing admin with username if missing
            $admin = User::where('email', 'admin@info-clash.com')->first();
            if (!$admin->username) {
                $admin->update(['username' => 'admin']);
                $this->command->info('Admin username set to: admin');
            }
            $this->command->info('Admin user already exists.');
        }

        // Create sample participant users
        $participantsData = [
            ['name' => 'Peserta 1', 'username' => 'peserta1', 'email' => 'peserta1@info-clash.com', 'institution' => 'Universitas A'],
            ['name' => 'Peserta 2', 'username' => 'peserta2', 'email' => 'peserta2@info-clash.com', 'institution' => 'Universitas B'],
            ['name' => 'Peserta 3', 'username' => 'peserta3', 'email' => 'peserta3@info-clash.com', 'institution' => 'Universitas C'],
        ];

        foreach ($participantsData as $p) {
            $existing = User::where('email', $p['email'])->first();
            if (!$existing) {
                User::create([
                    'name' => $p['name'],
                    'username' => $p['username'],
                    'email' => $p['email'],
                    'password' => 'password',
                    'role' => 'participant',
                    'institution' => $p['institution'],
                    'is_active' => true,
                ]);
                $this->command->info("Participant created: {$p['username']} / password");
            } else {
                // Update existing with username if missing
                if (!$existing->username) {
                    $existing->update(['username' => $p['username']]);
                    $this->command->info("Participant {$p['email']} username set to: {$p['username']}");
                }
                $this->command->info("Participant {$p['email']} already exists.");
            }
        }

        $this->command->info('');
        $this->command->info('=== Setup Complete ===');
        $this->command->info('Admin login: username=admin / password=password');
        $this->command->info('Participant logins: peserta1, peserta2, peserta3 / password=password');
    }
}
