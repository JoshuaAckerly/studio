import NewsletterSignup from '@/components/NewsletterSignup';
import MainLayout from '@/layouts/main';
import { Head, Link } from '@inertiajs/react';
import { getProjectUrl } from '../env';

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    author: string | null;
    published_at: string;
}

interface TikTokVideo {
    id: number;
    title: string;
    date: string;
    thumbnail: string;
    url: string;
    embed_url?: string;
    description?: string;
}

interface DiscordPost {
    id: number;
    title: string;
    content: string;
    author: string | null;
    channel: string | null;
    jump_url: string | null;
    image_url: string | null;
    posted_at: string | null;
}

interface FacebookPost {
    id: number;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    post_url: string;
    posted_at: string | null;
}

interface InstagramPost {
    id: number;
    thumbnail_url: string | null;
    caption: string | null;
    permalink: string | null;
    posted_at: string | null;
}

interface Props {
    recentPosts: BlogPost[];
    recentVideos: TikTokVideo[];
    recentDiscord: DiscordPost[];
    recentFacebook: FacebookPost[];
    recentInstagram: InstagramPost[];
}

const instagramLogoPath =
    'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';

const facebookLogoPath =
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';

const discordLogoPath =
    'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z';

const tiktokLogoPath =
    'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z';

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
    return (
        <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <Link href={href} className="text-sm font-medium text-primary hover:underline">
                {linkLabel} &rarr;
            </Link>
        </div>
    );
}

function BlogCard({ post }: { post: BlogPost }) {
    const date = new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            {post.featured_image && (
                <Link href={`/blog/${post.slug}`}>
                    <img src={post.featured_image} alt={post.title} className="h-44 w-full object-cover" />
                </Link>
            )}
            <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <time dateTime={post.published_at}>{date}</time>
                    {post.author && <span>&middot; {post.author}</span>}
                </div>
                <h3 className="mb-2 text-base font-semibold leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                        {post.title}
                    </Link>
                </h3>
                {post.excerpt && (
                    <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                )}
                <Link href={`/blog/${post.slug}`} className="mt-auto text-sm font-medium text-primary hover:underline">
                    Read more &rarr;
                </Link>
            </div>
        </article>
    );
}

function FacebookCard({ post }: { post: FacebookPost }) {
    const date = post.posted_at
        ? new Date(post.posted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    return (
        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            {post.thumbnail_url && (
                <img src={post.thumbnail_url} alt={post.title} className="h-48 w-full object-cover" />
            )}
            <div className="p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#1877F2]" fill="currentColor" aria-hidden="true">
                        <path d={facebookLogoPath} />
                    </svg>
                    {date && <span>{date}</span>}
                </div>
                <h2 className="mb-2 line-clamp-2 text-base font-semibold leading-snug text-foreground">{post.title}</h2>
                {post.description && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{post.description}</p>
                )}
                <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1877F2] hover:underline"
                >
                    View on Facebook &rarr;
                </a>
            </div>
        </article>
    );
}

function InstagramCard({ post }: { post: InstagramPost }) {
    const date = post.posted_at
        ? new Date(post.posted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    return (
        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            {post.thumbnail_url && (
                <a href={post.permalink ?? '#'} target="_blank" rel="noopener noreferrer">
                    <img src={post.thumbnail_url} alt={post.caption?.slice(0, 80) ?? 'Instagram post'} className="h-48 w-full object-cover" />
                </a>
            )}
            <div className="p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#E1306C]" fill="currentColor" aria-hidden="true">
                        <path d={instagramLogoPath} />
                    </svg>
                    {date && <span>{date}</span>}
                </div>
                {post.caption && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{post.caption}</p>
                )}
                {post.permalink && (
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#E1306C] hover:underline">
                        View on Instagram &rarr;
                    </a>
                )}
            </div>
        </article>
    );
}

function TikTokCard({ video }: { video: TikTokVideo }) {
    return (
        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-black">
                    {video.thumbnail ? (
                        <img
                            src={video.thumbnail}
                            alt={video.title}
                            loading="lazy"
                            className="h-full w-full object-cover opacity-80"
                        />
                    ) : (
                        <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="currentColor" aria-hidden="true">
                            <path d={tiktokLogoPath} />
                        </svg>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                            <svg className="ml-1 h-4 w-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="mb-1 text-sm font-semibold text-foreground leading-snug">{video.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <svg viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0" fill="currentColor" aria-hidden="true">
                            <path d={tiktokLogoPath} />
                        </svg>
                        <span>{video.date}</span>
                    </div>
                    {video.description && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{video.description}</p>
                    )}
                </div>
            </a>
        </article>
    );
}

function DiscordCard({ post }: { post: DiscordPost }) {
    const date = post.posted_at
        ? new Date(post.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;

    return (
        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            {post.image_url && (
                <img src={post.image_url} alt={post.title} className="h-44 w-full object-cover" />
            )}
            <div className="p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#5865F2]" fill="currentColor" aria-hidden="true">
                        <path d={discordLogoPath} />
                    </svg>
                    {post.channel && <span>#{post.channel}</span>}
                    {date && <span>{date}</span>}
                </div>
                <h3 className="mb-2 text-base font-semibold leading-snug">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">{post.content}</p>
                {post.jump_url && (
                    <a
                        href={post.jump_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#5865F2] hover:underline"
                    >
                        View in Discord &#x2197;
                    </a>
                )}
            </div>
        </article>
    );
}

export default function Welcome({ recentPosts, recentVideos, recentDiscord, recentFacebook = [], recentInstagram = [] }: Props) {
    const studioUrl = getProjectUrl('studio');
    const noteleksUrl = getProjectUrl('noteleks');
    const discordInvite = import.meta.env.VITE_DISCORD_INVITE_URL as string | undefined;

    return (
        <MainLayout>
            <Head>
                <title>GraveYard Jokes Studio</title>
                <meta
                    name="description"
                    content="The studio hub for GraveYardJokes — blog posts, TikTok videos, and Discord updates all in one place."
                />
                <meta property="og:title" content="GraveYard Jokes Studio" />
                <meta
                    property="og:description"
                    content="The studio hub for GraveYardJokes — blog posts, TikTok videos, and Discord updates."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={studioUrl} />
                <meta property="og:image" content={`${studioUrl}images/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="GraveYard Jokes Studio" />
                <meta name="twitter:description" content="Blog posts, TikToks, and Discord updates from GraveYardJokes Studios." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={studioUrl} />
            </Head>

            <div className="mx-auto max-w-6xl space-y-16 py-6">
                {/* Hero */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">The Studio</h1>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                        Blog posts, TikTok content, and Discord updates &mdash; everything from GraveYardJokes Studios in one place.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/blog"
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                        >
                            Read the Blog
                        </Link>
                        <Link
                            href="/video-log"
                            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                        >
                            TikTok Videos
                        </Link>
                        {discordInvite ? (
                            <a
                                href={discordInvite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4752C4]"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                    <path d={discordLogoPath} />
                                </svg>
                                Join Discord
                            </a>
                        ) : (
                            <Link
                                href="/discord"
                                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                            >
                                Discord
                            </Link>
                        )}
                        <Link
                            href="/facebook"
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1565d8]"
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                <path d={facebookLogoPath} />
                            </svg>
                            Facebook
                        </Link>
                        <Link
                            href="/instagram"
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#E1306C] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#c42d61]"
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                <path d={instagramLogoPath} />
                            </svg>
                            Instagram
                        </Link>
                        <a
                            href={noteleksUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                        >
                            🎮 Play Noteleks
                        </a>
                    </div>
                </div>

                {/* Blog Posts */}
                <section>
                    <SectionHeader title="Latest Posts" href="/blog" linkLabel="All posts" />
                    {recentPosts.length === 0 ? (
                        <p className="text-muted-foreground">No posts yet &mdash; check back soon.</p>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recentPosts.map((post) => (
                                <BlogCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </section>

                {/* TikTok */}
                <section>
                    <SectionHeader title="TikTok" href="/video-log" linkLabel="All videos" />
                    {recentVideos.length === 0 ? (
                        <p className="text-muted-foreground">No videos yet &mdash; check back soon.</p>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recentVideos.map((video) => (
                                <TikTokCard key={video.id} video={video} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Discord */}
                <section>
                    <SectionHeader title="Discord" href="/discord" linkLabel="All posts" />
                    {recentDiscord.length === 0 ? (
                        <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">Join our Discord server</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Stay up to date with announcements, behind-the-scenes updates, and community chat.
                                </p>
                            </div>
                            {discordInvite && (
                                <a
                                    href={discordInvite}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4752C4]"
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                        <path d={discordLogoPath} />
                                    </svg>
                                    Join Discord
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recentDiscord.map((post) => (
                                <DiscordCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Facebook */}
                {recentFacebook.length > 0 && (
                    <section>
                        <SectionHeader title="Facebook" href="/facebook" linkLabel="All posts" />
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recentFacebook.map((post) => (
                                <FacebookCard key={post.id} post={post} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Instagram */}
                {recentInstagram.length > 0 && (
                    <section>
                        <SectionHeader title="Instagram" href="/instagram" linkLabel="All posts" />
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recentInstagram.map((post) => (
                                <InstagramCard key={post.id} post={post} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Games */}
                <section>
                    <h2 className="mb-4 text-xl font-semibold tracking-tight">Games</h2>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">Noteleks — The Game</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    A browser-based action game from GraveYardJokes Studios. No download needed.
                                </p>
                            </div>
                            <a
                                href={noteleksUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                            >
                                Play Now &rarr;
                            </a>
                        </div>
                        <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">CryptEscape</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    A browser-based escape puzzle game from GraveYardJokes Studios. No download needed.
                                </p>
                            </div>
                            <a
                                href="https://d3fjkusrpksks7.cloudfront.net/cryptescape/games/CyrptEscape/CyrptEscape/index.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                            >
                                Play Now &rarr;
                            </a>
                        </div>
                    </div>
                </section>

                {/* Newsletter */}
                <section className="rounded-lg border border-border bg-card p-8">
                    <NewsletterSignup />
                </section>
            </div>
        </MainLayout>
    );
}
