import React, { useEffect, useState } from 'react';

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
    );
}
