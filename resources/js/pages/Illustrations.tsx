import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';

type Illustration = {
    url: string;
    filename: string;
};

export default function Illustrations() {
    const [items, setItems] = useState<Illustration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        fetch('/api/illustrations')
            .then((r) => r.json())
            .then((data) => {
                if (!mounted) return;
                // API returns resource collection: { data: [{url, filename}, ...] }
                setItems(data?.data || []);
            })
            .catch((e) => console.error('Failed to load illustrations', e))
            .finally(() => mounted && setLoading(false));

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <>
            <Head>
                <title>Illustrations Gallery - Visual Art & Digital Artwork | GraveYard Jokes Studio</title>
                <meta name="description" content="Explore our collection of original digital illustrations and visual artwork. Browse through a gallery showcasing our creative visual storytelling and artistic development." />
                <meta name="keywords" content="illustrations, digital art, visual art, artwork gallery, digital illustrations, creative artwork, original art" />
                
                {/* Open Graph */}
                <meta property="og:title" content="Illustrations Gallery - Visual Art & Digital Artwork" />
                <meta property="og:description" content="Explore our collection of original digital illustrations and visual artwork showcasing creative storytelling." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://studio.graveyardjokes.com/illustrations" />
                <meta property="og:image" content="https://studio.graveyardjokes.com/images/og-illustrations.jpg" />
                
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Illustrations Gallery - Visual Art" />
                <meta name="twitter:description" content="Explore our collection of original digital illustrations and visual artwork." />
                <meta name="twitter:image" content="https://studio.graveyardjokes.com/images/og-illustrations.jpg" />
                
                <link rel="canonical" href="https://studio.graveyardjokes.com/illustrations" />
            </Head>
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                <h1 className="text-4xl font-semibold mb-6">Illustrations Gallery</h1>

                {loading ? (
                    <p>Loading…</p>
                ) : items.length === 0 ? (
                    <p>No illustrations found.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {items.map((it) => (
                            <figure key={it.filename} className="overflow-hidden rounded-lg bg-white/5">
                                <img
                                    src={it.url}
                                    alt={it.filename}
                                    loading="lazy"
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/vlogs/default.svg';
                                    }}
                                />
                            </figure>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
