import MainLayout from '@/layouts/main';
import { Head } from '@inertiajs/react';
import { getProjectUrl } from '../env';

interface InstagramPost {
    id: number;
    instagram_id: string;
    media_type: string;
    media_url: string | null;
    thumbnail_url: string | null;
    caption: string | null;
    permalink: string | null;
    posted_at: string | null;
}

interface Props {
    posts: InstagramPost[];
}

const instagramLogoPath =
    'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';

function InstagramCard({ post }: { post: InstagramPost }) {
    const date = post.posted_at
        ? new Date(post.posted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    const imageUrl = post.thumbnail_url ?? post.media_url;

    return (
        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            {imageUrl && (
                <a href={post.permalink ?? '#'} target="_blank" rel="noopener noreferrer">
                    <img src={imageUrl} alt={post.caption?.slice(0, 80) ?? 'Instagram post'} className="h-64 w-full object-cover" />
                </a>
            )}
            <div className="p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#E1306C]" fill="currentColor" aria-hidden="true">
                        <path d={instagramLogoPath} />
                    </svg>
                    {date && <span>{date}</span>}
                    <span className="ml-auto text-xs uppercase tracking-wide opacity-60">{post.media_type}</span>
                </div>
                {post.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">{post.caption}</p>
                )}
                {post.permalink && (
                    <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#E1306C] hover:underline"
                    >
                        View on Instagram &rarr;
                    </a>
                )}
            </div>
        </article>
    );
}

export default function InstagramPage({ posts }: Props) {
    const studioUrl = getProjectUrl('studio');

    return (
        <MainLayout minimalNav>
            <Head>
                <title>Instagram - GraveYardJokes Studios</title>
                <meta name="description" content="Photos and posts from the GraveYardJokes Studios Instagram account." />
                <meta property="og:title" content="Instagram - GraveYardJokes Studios" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={studioUrl + '/instagram'} />
                <link rel="canonical" href={studioUrl + '/instagram'} />
            </Head>

            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex items-center gap-3">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#E1306C]" fill="currentColor" aria-hidden="true">
                        <path d={instagramLogoPath} />
                    </svg>
                    <h1 className="text-3xl font-bold">Instagram</h1>
                    <a
                        href="https://www.instagram.com/graveyardjokes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-sm font-medium text-[#E1306C] hover:underline"
                    >
                        Follow on Instagram &rarr;
                    </a>
                </div>

                {posts.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-10 text-center">
                        <p className="text-muted-foreground">No posts yet — check back soon.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <InstagramCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
