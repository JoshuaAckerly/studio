import MainLayout from '@/layouts/main';
import { Head } from '@inertiajs/react';
import { getProjectUrl } from '../env';

interface FacebookPost {
    id: number;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    post_url: string;
    posted_at: string | null;
}

interface Props {
    posts: FacebookPost[];
}

const facebookLogoPath =
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';

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
                <h2 className="mb-2 text-base font-semibold text-foreground leading-snug line-clamp-2">{post.title}</h2>
                {post.description && (
                    <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line">{post.description}</p>
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

export default function FacebookPage({ posts }: Props) {
    const studioUrl = getProjectUrl('studio');

    return (
        <MainLayout minimalNav>
            <Head>
                <title>Facebook - GraveYardJokes Studios</title>
                <meta name="description" content="Photos and posts from the GraveYardJokes Studios Facebook page." />
                <meta property="og:title" content="Facebook - GraveYardJokes Studios" />
                <meta property="og:description" content="Photos and posts from the GraveYardJokes Studios Facebook page." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={studioUrl + '/facebook'} />
                <link rel="canonical" href={studioUrl + '/facebook'} />
            </Head>

            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex items-center gap-3">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#1877F2]" fill="currentColor" aria-hidden="true">
                        <path d={facebookLogoPath} />
                    </svg>
                    <h1 className="text-3xl font-bold">Facebook</h1>
                    <a
                        href="https://www.facebook.com/graveyardjokes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-sm font-medium text-[#1877F2] hover:underline"
                    >
                        Follow on Facebook &rarr;
                    </a>
                </div>

                {posts.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-10 text-center">
                        <p className="text-muted-foreground">No posts yet — check back soon.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <FacebookCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
