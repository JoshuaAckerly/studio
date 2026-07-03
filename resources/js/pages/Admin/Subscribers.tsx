import MainLayout from '@/layouts/main';
import { Head, Link } from '@inertiajs/react';

interface Subscriber {
    id: number;
    email: string;
    confirmed_at: string | null;
    created_at: string;
}

interface PaginatedSubscribers {
    data: Subscriber[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    subscribers: PaginatedSubscribers;
    total: number;
}

export default function AdminSubscribers({ subscribers, total }: Props) {
    return (
        <MainLayout>
            <Head>
                <title>Subscribers — Admin</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{total} total subscriber{total !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {subscribers.data.length === 0 ? (
                    <p className="text-muted-foreground">No subscribers yet.</p>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Email</th>
                                    <th className="px-4 py-3 text-left font-medium">Subscribed</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {subscribers.data.map((sub) => (
                                    <tr key={sub.id} className="bg-card hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs">{sub.email}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(sub.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            {sub.confirmed_at ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    Confirmed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {(subscribers.prev_page_url || subscribers.next_page_url) && (
                    <div className="mt-4 flex justify-between">
                        {subscribers.prev_page_url ? (
                            <Link href={subscribers.prev_page_url} className="text-sm text-primary hover:underline">
                                ← Previous
                            </Link>
                        ) : <span />}
                        {subscribers.next_page_url && (
                            <Link href={subscribers.next_page_url} className="text-sm text-primary hover:underline">
                                Next →
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
