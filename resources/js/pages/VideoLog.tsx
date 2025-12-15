'use client';

// Removed unused import
import MainLayout from '@/layouts/main';
import { Dialog } from '@headlessui/react';
import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';

interface VideoItem {
    id: number;
    title: string;
    date: string;
    thumbnail: string;
    url: string;
    description?: string;
}

export default function VideoLog() {
    const [items, setItems] = useState<VideoItem[]>([]);
    const [selected, setSelected] = useState<VideoItem | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Tracking is handled by the main layout to avoid duplicate events

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const res = await fetch('/api/video-logs');
                const json = await res.json();

                if (mounted && Array.isArray(json.data)) {
                    setItems(json.data);
                }
            } catch (e) {
                console.error('Failed to load video logs', e);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const openVideo = (item: VideoItem) => {
        setSelected(item);
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
        setSelected(null);
    };

    return (
        <MainLayout>
            <Head>
                <title>Video Log - Creative Process Documentation | GraveYard Jokes Studio</title>
                <meta name="description" content="Watch behind-the-scenes videos documenting our creative journey, game development process, music creation, and studio updates. A chronological log of creative growth." />
                <meta name="keywords" content="video log, creative process, game development videos, music creation, studio updates, behind the scenes, creative journey" />
                
                {/* Open Graph */}
                <meta property="og:title" content="Video Log - Creative Process Documentation" />
                <meta property="og:description" content="Watch behind-the-scenes videos documenting our creative journey, game development process, and music creation." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://studio.graveyardjokes.com/video-log" />
                <meta property="og:image" content="https://studio.graveyardjokes.com/images/og-video-log.jpg" />
                
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Video Log - Creative Process Documentation" />
                <meta name="twitter:description" content="Behind-the-scenes videos documenting our creative journey and game development process." />
                <meta name="twitter:image" content="https://studio.graveyardjokes.com/images/og-video-log.jpg" />
                
                <link rel="canonical" href="https://studio.graveyardjokes.com/video-log" />
            </Head>
            <div className="mx-auto max-w-5xl">
                <h1 className="mb-4 text-3xl font-semibold">Video Log</h1>
                <p className="mb-6 text-muted-foreground">A chronological log of short studio updates and process videos.</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {items.map((item) => (
                        <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                            <button onClick={() => openVideo(item)} className="w-full text-left">
                                <div className="h-40 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img
                                        src={item.thumbnail}
                                        alt={item.title}
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.currentTarget as HTMLImageElement;
                                            if (!target.dataset.fallback) {
                                                target.dataset.fallback = '1';
                                                target.src = '/images/vlogs/default.svg';
                                            }
                                        }}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="p-3">
                                    <h3 className="mb-1 text-sm font-semibold text-foreground">{item.title}</h3>
                                    <div className="text-xs text-muted-foreground">{item.date}</div>
                                </div>
                            </button>
                        </article>
                    ))}
                </div>

                <Dialog open={isOpen} onClose={close} className="relative z-50">
                    <div className="fixed inset-0 bg-black/50" />

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="mx-auto w-full max-w-3xl rounded bg-[var(--popover)] p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <Dialog.Title className="text-lg font-semibold text-foreground">{selected?.title}</Dialog.Title>
                                    <p className="text-sm text-muted-foreground">{selected?.description}</p>
                                </div>
                                <div>
                                    <button onClick={close} className="px-2 py-1 text-muted-foreground">
                                        Close
                                    </button>
                                </div>
                            </div>

                            {selected && (
                                <div className="mt-4">
                                    <video controls className="w-full rounded">
                                        <source src={selected.url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </div>
        </MainLayout>
    );
}
