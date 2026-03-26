import MainLayout from '@/layouts/main';
import { Head } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';

type Illustration = {
    id?: number;
    url: string;
    filename: string;
    thumbnail_url?: string;
    embed_url?: string;
    title?: string;
    description?: string;
    tags?: string[];
    date?: string;
};

// ── Facebook card ─────────────────────────────────────────────────────────────

function FacebookCard({ item, onClick }: { item: Illustration; onClick: () => void }) {
    return (
        <article
            className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-transform hover:scale-[1.02]"
            onClick={onClick}
        >
            <div className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-[#1877F2]/10 md:h-64 lg:h-72">
                {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title ?? item.filename} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                    <svg viewBox="0 0 24 24" className="h-16 w-16 text-[#1877F2]" fill="currentColor" aria-hidden="true">
                        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                    </svg>
                )}
                <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs font-medium text-white">View post ↗</span>
                </div>
            </div>
            <div className="p-3">
                {item.title && item.title !== 'Photo' && <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>}
                {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
                {item.tags && item.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-[#1877F2]/10 px-2 py-0.5 text-[10px] font-medium text-[#1877F2]">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
                {item.date && <div className="mt-1 text-[10px] text-muted-foreground/60">{item.date}</div>}
            </div>
        </article>
    );
}

// ── S3 illustration card (existing behaviour) ─────────────────────────────────

interface GifImageProps {
    illustration: Illustration;
    onClick?: (illustration: Illustration) => void;
}

const GifImage: React.FC<GifImageProps> = ({ illustration, onClick }) => {
    const [showGif, setShowGif] = useState(false);
    const [gifLoaded, setGifLoaded] = useState(false);
    const isGif = illustration.filename.toLowerCase().endsWith('.gif');
    const displayUrl = isGif && illustration.thumbnail_url ? illustration.thumbnail_url : isGif ? '' : illustration.url;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onClick?.(illustration);
    };

    return (
        <figure className="group cursor-pointer overflow-hidden rounded-lg bg-white/5" onClick={handleClick}>
            <div
                className="relative h-56 w-full overflow-hidden md:h-64 lg:h-72"
                onMouseEnter={() => isGif && setShowGif(true)}
                onMouseLeave={() => isGif && setShowGif(false)}
            >
                {displayUrl ? (
                    <>
                        <img
                            src={displayUrl}
                            alt={illustration.filename}
                            loading="lazy"
                            className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${isGif && showGif ? 'opacity-0' : 'opacity-100'} ${isGif ? 'brightness-75 group-hover:scale-105 group-hover:brightness-100' : 'group-hover:scale-105'}`}
                            style={{ imageRendering: 'pixelated' }}
                        />
                        {isGif && (
                            <>
                                <img
                                    src={illustration.url}
                                    alt={illustration.filename}
                                    loading="lazy"
                                    onLoad={() => setGifLoaded(true)}
                                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${showGif && gifLoaded ? 'opacity-100' : 'opacity-0'} brightness-75 group-hover:scale-105 group-hover:brightness-100`}
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                {showGif && !gifLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                ) : showGif ? (
                    <>
                        <img
                            src={illustration.url}
                            alt={illustration.filename}
                            onLoad={() => setGifLoaded(true)}
                            className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${gifLoaded ? 'opacity-100' : 'opacity-0'} brightness-75 group-hover:scale-105 group-hover:brightness-100`}
                            style={{ imageRendering: 'pixelated' }}
                        />
                        {!gifLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-800">
                        <div className="text-center text-sm text-white opacity-50">
                            <div>GIF</div>
                            <div className="mt-1 text-xs">Hover to play</div>
                        </div>
                    </div>
                )}
                {isGif && (
                    <div className="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        GIF
                    </div>
                )}
            </div>
        </figure>
    );
};

// ── Facebook post modal ───────────────────────────────────────────────────────

function FacebookModal({ item, onClose }: { item: Illustration; onClose: () => void }) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === overlayRef.current && onClose()}
        >
            <div className="relative mx-4 w-full max-w-lg">
                <button onClick={onClose} className="absolute -top-10 right-0 z-10 text-2xl font-bold text-white hover:text-gray-300">
                    ✕
                </button>
                <div className="overflow-hidden rounded-lg bg-white">
                    <iframe
                        src={item.embed_url}
                        className="w-full"
                        style={{ border: 'none', height: '600px' }}
                        allow="fullscreen"
                        title={item.title ?? item.filename}
                        scrolling="no"
                    />
                    <div className="bg-white px-4 py-3">
                        {item.title && item.title !== 'Photo' && <p className="mb-1 text-sm font-semibold text-gray-900">{item.title}</p>}
                        {item.description && <p className="mb-2 text-sm text-gray-600">{item.description}</p>}
                        {item.tags && item.tags.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1">
                                {item.tags.map((tag) => (
                                    <span key={tag} className="rounded-full bg-[#1877F2]/10 px-2 py-0.5 text-xs font-medium text-[#1877F2]">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            {item.date && <span className="text-xs text-gray-400">{item.date}</span>}
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-[#1877F2] hover:underline"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                                </svg>
                                View on Facebook
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Scroll-reveal wrapper ────────────────────────────────────────────────────

function FadeInCard({ children, index }: { children: React.ReactNode; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.08 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: visible ? `${(index % 6) * 80}ms` : '0ms' }}
            className={`transition-all duration-500 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
        >
            {children}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Illustrations() {
    const [items, setItems] = useState<Illustration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Illustration | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch('/api/illustrations')
            .then((r) => r.json())
            .then((data) => {
                if (!mounted) return;
                setItems(data?.data || []);
            })
            .catch((e) => console.error('Failed to load illustrations', e))
            .finally(() => mounted && setLoading(false));

        return () => {
            mounted = false;
        };
    }, []);

    const isFacebook = items.length > 0 && !!items[0].embed_url;

    return (
        <MainLayout minimalNav>
            <Head>
                <title>Gallery - GraveYard Jokes Studio</title>
                <meta
                    name="description"
                    content="Browse our gallery of original artwork, illustrations, and creative visual content from GraveYard Jokes Studio."
                />
                <meta
                    name="keywords"
                    content="illustrations, digital art, visual art, artwork gallery, digital illustrations, creative artwork, original art"
                />
                <meta property="og:title" content="Gallery - GraveYard Jokes Studio" />
                <meta property="og:description" content="Explore our collection of original digital illustrations and visual artwork." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://studio.graveyardjokes.com/illustrations" />
                <meta property="og:image" content="https://studio.graveyardjokes.com/images/og-illustrations.jpg" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Gallery - GraveYard Jokes Studio" />
                <meta name="twitter:description" content="Explore our collection of original digital illustrations and visual artwork." />
                <meta name="twitter:image" content="https://studio.graveyardjokes.com/images/og-illustrations.jpg" />
                <link rel="canonical" href="https://studio.graveyardjokes.com/illustrations" />
            </Head>

            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <h1 className="text-4xl font-semibold">Gallery</h1>
                    {isFacebook && (
                        <span className="flex items-center gap-1.5 rounded-full bg-[#1877F2]/10 px-3 py-1 text-sm font-medium text-[#1877F2]">
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                            </svg>
                            Facebook
                        </span>
                    )}
                </div>

                {loading ? (
                    <p>Loading…</p>
                ) : items.length === 0 ? (
                    <p>No posts found.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {items.map((item, idx) =>
                            item.embed_url ? (
                                <FadeInCard key={item.id ?? item.url} index={idx}>
                                    <FacebookCard item={item} onClick={() => setSelected(item)} />
                                </FadeInCard>
                            ) : (
                                <FadeInCard key={item.filename} index={idx}>
                                    <GifImage illustration={item} onClick={(ill) => setSelected(ill)} />
                                </FadeInCard>
                            ),
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {selected &&
                (selected.embed_url ? (
                    <FacebookModal item={selected} onClose={() => setSelected(null)} />
                ) : (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelected(null)}
                    >
                        <div className="relative mx-4 max-h-[90vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setSelected(null)}
                                className="absolute -top-12 right-0 z-10 text-2xl font-bold text-white hover:text-gray-300"
                            >
                                ✕
                            </button>
                            <div className="overflow-hidden rounded-lg bg-gray-900">
                                <img
                                    src={selected.url}
                                    alt={selected.filename}
                                    className="h-auto max-h-[80vh] w-full object-contain"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <div className="p-4 text-white">
                                    <p className="text-sm opacity-75">{selected.filename}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
        </MainLayout>
    );
}
