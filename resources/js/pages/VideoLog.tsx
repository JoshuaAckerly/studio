'use client';

import MainLayout from '@/layouts/main';
import { Dialog } from '@headlessui/react';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { getProjectUrl } from '../env';

interface VideoItem {
    id: number;
    title: string;
    date: string;
    thumbnail: string;
    url: string;
    embed_url?: string;
    description?: string;
}

function TikTokCard({ item, onClick }: { item: VideoItem; onClick: () => void }) {
    return (
        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <button onClick={onClick} className="w-full text-left">
                <div className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-black">
                    {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} loading="lazy" className="h-full w-full object-cover opacity-80" />
                    ) : (
                        <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="currentColor" aria-hidden="true">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
                        </svg>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                            <svg className="ml-1 h-4 w-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="p-3">
                    <h3 className="mb-1 text-sm font-semibold text-foreground">{item.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <svg viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0" fill="currentColor" aria-hidden="true">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
                        </svg>
                        <span>{item.date}</span>
                    </div>
                </div>
            </button>
        </article>
    );
}

function StandardCard({ item, onClick }: { item: VideoItem; onClick: () => void }) {
    return (
        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <button onClick={onClick} className="w-full text-left">
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
    );
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
        <MainLayout minimalNav>
            <Head>
                <title>Video Log - Creative Process Documentation | GraveYard Jokes Studio</title>
                <meta
                    name="description"
                    content="Watch behind-the-scenes videos documenting our creative journey, game development process, music creation, and studio updates. A chronological log of creative growth."
                />
                <meta
                    name="keywords"
                    content="video log, creative process, game development videos, music creation, studio updates, behind the scenes, creative journey"
                />
                {/* Open Graph */}
                <meta property="og:title" content="Video Log - Creative Process Documentation" />
                <meta
                    property="og:description"
                    content="Watch behind-the-scenes videos documenting our creative journey, game development process, and music creation."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={getProjectUrl('studio') + '/video-log'} />
                <meta property="og:image" content={getProjectUrl('studio') + '/images/og-video-log.jpg'} />
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Video Log - Creative Process Documentation" />
                <meta name="twitter:description" content="Behind-the-scenes videos documenting our creative journey and game development process." />
                <meta name="twitter:image" content={getProjectUrl('studio') + '/images/og-video-log.jpg'} />
                <link rel="canonical" href={getProjectUrl('studio') + '/video-log'} />
            </Head>
            <div className="mx-auto max-w-5xl">
                <h1 className="mb-4 text-3xl font-semibold">Video Log</h1>
                <p className="mb-6 text-muted-foreground">A chronological log of short studio updates and process videos.</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {items.map((item) =>
                        item.embed_url ? (
                            <TikTokCard key={item.id} item={item} onClick={() => openVideo(item)} />
                        ) : (
                            <StandardCard key={item.id} item={item} onClick={() => openVideo(item)} />
                        ),
                    )}
                </div>

                <Dialog open={isOpen} onClose={close} className="relative z-50">
                    <div className="fixed inset-0 bg-black/50" />

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="mx-auto w-full max-w-lg rounded bg-[var(--popover)] p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <Dialog.Title className="text-lg font-semibold text-foreground">{selected?.title}</Dialog.Title>
                                    {selected?.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {selected?.url && (
                                        <a
                                            href={selected.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                                        >
                                            Open ↗
                                        </a>
                                    )}
                                    <button onClick={close} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                                        Close
                                    </button>
                                </div>
                            </div>

                            {selected && (
                                <div className="mt-4">
                                    {selected.embed_url ? (
                                        <div className="flex justify-center">
                                            <iframe
                                                src={selected.embed_url}
                                                className="h-[700px] w-full max-w-[325px] rounded"
                                                allow="fullscreen"
                                                title={selected.title}
                                            />
                                        </div>
                                    ) : (
                                        <video controls className="w-full rounded">
                                            <source src={selected.url} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </div>
                            )}
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </div>
        </MainLayout>
    );
}
