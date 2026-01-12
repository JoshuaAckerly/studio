import React, { useEffect, useState, useRef } from 'react';
import { Head } from '@inertiajs/react';

type Illustration = {
    url: string;
    filename: string;
    thumbnail_url?: string;
};

export default function Illustrations() {
    const [items, setItems] = useState<Illustration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIllustration, setSelectedIllustration] = useState<Illustration | null>(null);
    const [showModal, setShowModal] = useState(false);

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

    const handleIllustrationClick = (illustration: Illustration) => {
        setSelectedIllustration(illustration);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedIllustration(null);
    };

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
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
                        {items.map((it) => (
                            <GifImage key={it.filename} illustration={it} onClick={handleIllustrationClick} />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && selectedIllustration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={closeModal}>
                    <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={closeModal}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold z-10"
                        >
                            ✕
                        </button>
                        <div className="bg-gray-900 rounded-lg overflow-hidden">
                            <img
                                src={selectedIllustration.url}
                                alt={selectedIllustration.filename}
                                className="w-full h-auto max-h-[80vh] object-contain"
                                style={{ imageRendering: 'pixelated' }}
                            />
                            <div className="p-4 text-white">
                                <p className="text-sm opacity-75">{selectedIllustration.filename}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

interface GifImageProps {
    illustration: Illustration;
    onClick?: (illustration: Illustration) => void;
}

const GifImage: React.FC<GifImageProps> = ({ illustration, onClick }) => {
    const [showGif, setShowGif] = useState(false);
    const [gifLoaded, setGifLoaded] = useState(false);
    const isGif = illustration.filename.toLowerCase().endsWith('.gif');

    // For GIFs: use thumbnail if available, otherwise don't load anything initially
    const displayUrl = isGif && illustration.thumbnail_url ? illustration.thumbnail_url : (isGif ? '' : illustration.url);

    const handleMouseEnter = () => {
        if (!isGif) return;
        setShowGif(true);
    };

    const handleMouseLeave = () => {
        if (!isGif) return;
        setShowGif(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onClick?.(illustration);
    };

    const handleGifLoad = () => {
        setGifLoaded(true);
    };

    return (
        <figure className="overflow-hidden rounded-lg bg-white/5 group cursor-pointer" onClick={handleClick}>
            <div className="relative w-full h-56 md:h-64 lg:h-72 overflow-hidden" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                {displayUrl ? (
                    <>
                        {/* Static image (thumbnail or regular image) */}
                        <img
                            src={displayUrl}
                            alt={illustration.filename}
                            loading="lazy"
                            className={`w-full h-full object-cover transition-all duration-300 absolute inset-0 ${
                                isGif && showGif ? 'opacity-0' : 'opacity-100'
                            } ${isGif ? 'group-hover:brightness-100 brightness-75 group-hover:scale-105' : 'group-hover:scale-105'}`}
                            style={{
                                imageRendering: 'pixelated'
                            }}
                        />
                        {/* GIF overlay - only for GIFs */}
                        {isGif && (
                            <>
                                <img
                                    src={illustration.url}
                                    alt={illustration.filename}
                                    loading="lazy"
                                    onLoad={handleGifLoad}
                                    className={`w-full h-full object-cover transition-all duration-300 absolute inset-0 ${
                                        showGif && gifLoaded ? 'opacity-100' : 'opacity-0'
                                    } group-hover:brightness-100 brightness-75 group-hover:scale-105`}
                                    style={{
                                        imageRendering: 'pixelated'
                                    }}
                                />
                                {/* Loading indicator while GIF loads */}
                                {showGif && !gifLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                ) : showGif ? (
                    // No thumbnail but hovered - show animated GIF
                    <>
                        <img
                            src={illustration.url}
                            alt={illustration.filename}
                            onLoad={handleGifLoad}
                            className={`w-full h-full object-cover transition-all duration-300 absolute inset-0 ${
                                gifLoaded ? 'opacity-100' : 'opacity-0'
                            } group-hover:brightness-100 brightness-75 group-hover:scale-105`}
                            style={{
                                imageRendering: 'pixelated'
                            }}
                        />
                        {/* Loading indicator while GIF loads */}
                        {!gifLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}
                    </>
                ) : (
                    // No thumbnail and not hovered - show placeholder
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="text-white text-sm opacity-50 text-center">
                            <div>GIF</div>
                            <div className="text-xs mt-1">Hover to play</div>
                        </div>
                    </div>
                )}
                {isGif && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        GIF
                    </div>
                )}
            </div>
        </figure>
    );
};
