import MainLayout from '@/layouts/main';
import { Head, Link } from '@inertiajs/react';
import { getProjectUrl } from '../../env';

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    featured_image: string | null;
    author: string | null;
    published_at: string;
}

interface Props {
    post: BlogPost;
}

export default function BlogShow({ post }: Props) {
    const canonicalUrl = getProjectUrl('studio') + '/blog/' + post.slug;

    return (
        <MainLayout minimalNav>
            <Head>
                <title>{post.title} - GraveYardJokes Studios Blog</title>
                <meta name="description" content={post.excerpt ?? post.title} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt ?? post.title} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                {post.featured_image && <meta property="og:image" content={post.featured_image} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={post.title} />
                <meta name="twitter:description" content={post.excerpt ?? post.title} />
                {post.featured_image && <meta name="twitter:image" content={post.featured_image} />}
                <link rel="canonical" href={canonicalUrl} />
            </Head>

            <div className="mx-auto max-w-3xl">
                <Link href="/blog" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    ← Back to Blog
                </Link>

                <article>
                    {post.featured_image && (
                        <img
                            src={post.featured_image}
                            alt={post.title}
                            className="mb-6 h-64 w-full rounded-lg object-cover"
                        />
                    )}

                    <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                        <time dateTime={post.published_at}>
                            {new Date(post.published_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </time>
                        {post.author && <span>· {post.author}</span>}
                    </div>

                    <h1 className="mb-6 text-3xl font-bold leading-tight">{post.title}</h1>

                    {post.excerpt && (
                        <p className="mb-6 text-lg text-muted-foreground border-l-4 border-primary pl-4 italic">
                            {post.excerpt}
                        </p>
                    )}

                    <div
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>
            </div>
        </MainLayout>
    );
}
