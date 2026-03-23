import MainLayout from '@/layouts/main';
import { Head, Link } from '@inertiajs/react';
import { getProjectUrl } from '../../env';

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    author: string | null;
    published_at: string;
}

interface Props {
    posts: BlogPost[];
}

export default function BlogIndex({ posts }: Props) {
    return (
        <MainLayout minimalNav>
            <Head>
                <title>Blog - GraveYardJokes Studios</title>
                <meta
                    name="description"
                    content="Thoughts, updates, and stories from the GraveYardJokes Studios team. Covering game dev, music, creative process, and studio life."
                />
                <meta name="keywords" content="game development blog, music blog, creative process, studio updates, indie dev, GraveYardJokes" />
                <meta property="og:title" content="Blog - GraveYardJokes Studios" />
                <meta property="og:description" content="Thoughts, updates, and stories from the GraveYardJokes Studios team." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={getProjectUrl('studio') + '/blog'} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Blog - GraveYardJokes Studios" />
                <meta name="twitter:description" content="Thoughts, updates, and stories from the GraveYardJokes Studios team." />
                <link rel="canonical" href={getProjectUrl('studio') + '/blog'} />
            </Head>

            <div className="mx-auto max-w-3xl">
                <h1 className="mb-2 text-3xl font-semibold">Blog</h1>
                <p className="mb-8 text-muted-foreground">Thoughts, updates, and stories from the studio.</p>

                {posts.length === 0 ? (
                    <p className="text-muted-foreground">No posts yet — check back soon.</p>
                ) : (
                    <div className="flex flex-col gap-8">
                        {posts.map((post) => (
                            <article
                                key={post.id}
                                className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                            >
                                {post.featured_image && (
                                    <Link href={`/blog/${post.slug}`}>
                                        <img src={post.featured_image} alt={post.title} className="mb-4 h-48 w-full rounded-md object-cover" />
                                    </Link>
                                )}
                                <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                                    <time dateTime={post.published_at}>
                                        {new Date(post.published_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </time>
                                    {post.author && <span>· {post.author}</span>}
                                </div>
                                <h2 className="mb-2 text-xl leading-snug font-semibold">
                                    <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                                        {post.title}
                                    </Link>
                                </h2>
                                {post.excerpt && <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>}
                                <Link href={`/blog/${post.slug}`} className="text-sm font-medium text-primary hover:underline">
                                    Read more →
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
