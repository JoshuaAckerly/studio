<?php

namespace Database\Seeders;

use App\Models\FacebookGalleryPost;
use Illuminate\Database\Seeder;

class FacebookGalleryPostSeeder extends Seeder
{
    public function run(): void
    {
        $urls = [
            'https://www.facebook.com/photo/?fbid=106044101864528&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=121765273625744&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=123292126806392&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=132454395890165&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=141632251639046&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=142766554858949&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=151582710644000&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=176589348143336&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=180175224451415&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=203742958761308&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=214249867710617&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=271682605300676&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=283134904155446&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=317507357384867&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=356780593457543&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=475834834885451&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=476998454769089&set=a.956491336819796',
            'https://www.facebook.com/photo/?fbid=563064016162532&set=a.956491336819796',
        ];

        foreach ($urls as $index => $url) {
            FacebookGalleryPost::firstOrCreate(
                ['post_url' => $url],
                [
                    'title'      => null,
                    'is_active'  => true,
                    'sort_order' => $index + 1,
                ]
            );
        }
    }
}
