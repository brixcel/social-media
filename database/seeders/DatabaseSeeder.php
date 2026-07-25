<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Post;
use App\Models\Page;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Admin User
        $admin = User::create([
            'name' => 'Demo Admin',
            'first_name' => 'Demo',
            'last_name' => 'Admin',
            'middlename' => 'System',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        // 2. Create Regular Demo Users
        $usersData = [
            [
                'name' => 'John Doe',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'middlename' => 'M',
                'email' => 'user@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
            ],
            [
                'name' => 'Jane Smith',
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'middlename' => 'A',
                'email' => 'jane@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
            ],
            [
                'name' => 'Alex Johnson',
                'first_name' => 'Alex',
                'last_name' => 'Johnson',
                'middlename' => 'B',
                'email' => 'alex@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
            ],
            [
                'name' => 'Sarah Connor',
                'first_name' => 'Sarah',
                'last_name' => 'Connor',
                'middlename' => 'C',
                'email' => 'sarah@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
            ],
        ];

        $createdUsers = [$admin];
        foreach ($usersData as $uData) {
            $createdUsers[] = User::create($uData);
        }

        // 3. Create Sample Posts
        $postsData = [
            [
                'content' => '🚀 Welcome to the new Social Media Demo application! We are excited to showcase our full-stack features including user posts, admin dashboards, and custom pages.',
                'mediaURL' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
                'mediaType' => 'image/jpeg',
                'mediaName' => 'welcome_banner.jpg',
                'mediaSize' => '245 KB',
                'user_id' => $admin->id,
                'likes' => [$createdUsers[1]->id, $createdUsers[2]->id],
            ],
            [
                'content' => 'Beautiful sunset view during my evening walk today! 🌅 Standard local demo environment setup is complete.',
                'mediaURL' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
                'mediaType' => 'image/jpeg',
                'mediaName' => 'sunset.jpg',
                'mediaSize' => '180 KB',
                'user_id' => $createdUsers[1]->id,
                'likes' => [$admin->id, $createdUsers[3]->id],
            ],
            [
                'content' => 'Just finished setting up the new database migrations and seeding demo content for testing. Everything runs smooth locally! 💻🔥',
                'mediaURL' => null,
                'mediaType' => null,
                'mediaName' => null,
                'mediaSize' => null,
                'user_id' => $createdUsers[2]->id,
                'likes' => [$createdUsers[1]->id],
            ],
            [
                'content' => 'Coffee break with a view ☕. Exploring modern web architecture and component design.',
                'mediaURL' => 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
                'mediaType' => 'image/jpeg',
                'mediaName' => 'coffee.jpg',
                'mediaSize' => '310 KB',
                'user_id' => $createdUsers[3]->id,
                'likes' => [$admin->id, $createdUsers[2]->id, $createdUsers[4]->id],
            ],
            [
                'content' => 'Reminder to check out the admin panel to manage users, ban/unban status, and content pages!',
                'mediaURL' => null,
                'mediaType' => null,
                'mediaName' => null,
                'mediaSize' => null,
                'user_id' => $admin->id,
                'likes' => [$createdUsers[1]->id],
            ],
        ];

        foreach ($postsData as $pData) {
            Post::create($pData);
        }

        // 4. Create Sample Pages
        $pagesData = [
            [
                'title' => 'About Us',
                'slug' => 'about-us',
                'content' => 'Welcome to Social Media Demo! This is a feature-rich web platform designed to demonstrate modern social networking capabilities.',
                'status' => 'published',
            ],
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'content' => 'Privacy Policy: This demo environment stores all data locally in an SQLite database for demonstration purposes only.',
                'status' => 'published',
            ],
            [
                'title' => 'Terms of Service',
                'slug' => 'terms-of-service',
                'content' => 'Terms of Service: By using this demo site, you acknowledge that features are simulated for previewing user interactions.',
                'status' => 'published',
            ],
            [
                'title' => 'Upcoming Features Draft',
                'slug' => 'upcoming-features',
                'content' => 'Draft notes for future real-time messaging and notification updates.',
                'status' => 'draft',
            ],
        ];

        foreach ($pagesData as $pgData) {
            Page::create($pgData);
        }
    }
}
