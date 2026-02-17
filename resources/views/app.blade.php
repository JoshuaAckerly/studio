<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="{{ ($appearance ?? 'system') === 'dark' ? 'dark' : '' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @if(config('services.google_analytics.tracking_id'))
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ config('services.google_analytics.tracking_id') }}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '{{ config('services.google_analytics.tracking_id') }}', {
                cookie_domain: '.graveyardjokes.com',
                cookie_flags: 'SameSite=None;Secure'
            });
        </script>
        @endif

        <script>
            (function() {
                const host = window.location.hostname;
                const isMainLocal = host === 'localhost' || host === '127.0.0.1' || host === 'graveyardjokes.local';
                const isMainTest = host === 'graveyardjokes.test';
                const isMainProd = host === 'graveyardjokes.com' || host === 'www.graveyardjokes.com';
                const isLocalSubdomain = host.endsWith('.graveyardjokes.local');
                const isTestSubdomain = host.endsWith('.graveyardjokes.test');

                let trackingUrl = '/api/track-visit';
                if (isLocalSubdomain) {
                    trackingUrl = 'http://graveyardjokes.local/api/track-visit';
                } else if (isTestSubdomain) {
                    trackingUrl = 'https://graveyardjokes.test/api/track-visit';
                } else if (!isMainLocal && !isMainTest && !isMainProd) {
                    trackingUrl = 'https://graveyardjokes.com/api/track-visit';
                }

                let lastTrackedPath = null;

                const sendVisit = () => {
                    const pagePath = window.location.pathname + window.location.search;
                    if (lastTrackedPath === pagePath) {
                        return;
                    }

                    lastTrackedPath = pagePath;

                    const payload = {
                        referrer: document.referrer || null,
                        subdomain: host,
                        page_title: document.title,
                        user_agent: navigator.userAgent,
                        timestamp: new Date().toISOString(),
                        page_path: window.location.pathname,
                        page_url: window.location.href,
                    };

                    if (typeof window.gtag === 'function') {
                        window.gtag('event', 'page_view', {
                            page_title: document.title,
                            page_location: window.location.href,
                            page_path: window.location.pathname,
                        });
                    }

                    const body = JSON.stringify(payload);

                    if (navigator.sendBeacon && trackingUrl.startsWith('https://')) {
                        const blob = new Blob([body], { type: 'application/json' });
                        navigator.sendBeacon(trackingUrl, blob);
                        return;
                    }

                    fetch(trackingUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        body,
                        credentials: trackingUrl.startsWith('https://') ? 'omit' : 'same-origin',
                    }).catch(() => {});
                };

                const originalPushState = history.pushState;
                history.pushState = function() {
                    originalPushState.apply(this, arguments);
                    setTimeout(sendVisit, 0);
                };

                const originalReplaceState = history.replaceState;
                history.replaceState = function() {
                    originalReplaceState.apply(this, arguments);
                    setTimeout(sendVisit, 0);
                };

                window.addEventListener('popstate', sendVisit);
                window.addEventListener('load', sendVisit);
                sendVisit();
            })();
        </script>

        <link rel="icon" href="/favicon.ico" sizes="any">

        {{-- Structured Data (JSON-LD) for SEO --}}
        <script type="application/ld+json">
        {
            "@@context": "https://schema.org",
            "@@type": "Organization",
            "name": "GraveYard Jokes Studio",
            "url": "https://studio.graveyardjokes.com",
            "logo": "https://studio.graveyardjokes.com/images/logo.png",
            "description": "Creative studio showcasing original music, game development, visual art, and creative growth documentation.",
            "sameAs": []
        }
        </script>

        <script type="application/ld+json">
        {
            "@@context": "https://schema.org",
            "@@type": "WebSite",
            "name": "GraveYard Jokes Studio",
            "url": "https://studio.graveyardjokes.com",
            "potentialAction": {
                "@@type": "SearchAction",
                "target": "https://studio.graveyardjokes.com/?s={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        }
        </script>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
