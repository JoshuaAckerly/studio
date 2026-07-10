import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function NewsletterSignup() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus('success');
                setMessage("You're subscribed — check your inbox for a welcome email.");
                setEmail('');
            } else {
                const data = await res.json().catch(() => ({}));
                setStatus('error');
                setMessage((data as { message?: string }).message ?? 'Something went wrong. Please try again.');
            }
        } catch {
            setStatus('error');
            setMessage('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-1 text-lg font-semibold">Stay in the loop</h3>
            <p className="mb-4 text-sm text-muted-foreground">Get an email when a new post goes up. No spam — just new posts.</p>

            {status === 'success' ? (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">{message}</p>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === 'loading'}
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
                    </button>
                </form>
            )}

            {status === 'error' && <p className="mt-2 text-sm text-destructive">{message}</p>}
        </div>
    );
}
