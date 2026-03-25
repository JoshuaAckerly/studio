'use client';

import { Dialog, DialogPanel, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

import { Head, Link } from '@inertiajs/react';
import { getProjectUrl } from '../env';

const navigation = [
    { name: 'Gallery', href: '/illustrations' },
    { name: 'Video Logs', href: '/video-log' },
    { name: 'Blog', href: '/blog' },
];

const creativeAreas = [
    {
        id: 'music',
        label: 'Music',
        emoji: '🎵',
        status: 'Active',
        statusColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        headline: 'Original Music & Collaboration',
        description:
            'Music is my foundation. Creating original compositions and collaborating with my sister to blend our emotions and creativity into a shared sound.',
        cta: null,
        bg: 'from-violet-500/10 to-purple-500/10 dark:from-violet-900/20 dark:to-purple-900/20',
        border: 'border-violet-200 dark:border-violet-800',
    },
    {
        id: 'art',
        label: 'Visual Art',
        emoji: '🎨',
        status: 'Active',
        statusColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        headline: 'Illustrations & 3D Concepts',
        description:
            'From hand-drawn character concepts to 3D collaborations via Fiverr modelers — turning imagination into visual reality one design at a time.',
        cta: { label: 'View Gallery →', href: '/illustrations' },
        bg: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-900/20 dark:to-cyan-900/20',
        border: 'border-blue-200 dark:border-blue-800',
    },
    {
        id: 'games',
        label: 'Games',
        emoji: '🎮',
        status: 'In Development',
        statusColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        headline: 'Indie Game Development',
        description:
            'Building 2D action games with Phaser 3 — learning game design, physics, enemy AI, and interactive storytelling from scratch.',
        cta: null,
        bg: 'from-amber-500/10 to-orange-500/10 dark:from-amber-900/20 dark:to-orange-900/20',
        border: 'border-amber-200 dark:border-amber-800',
    },
    {
        id: 'video',
        label: 'Video Logs',
        emoji: '📹',
        status: 'Ongoing',
        statusColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
        headline: 'Documenting the Journey',
        description:
            "Raw and honest video logs capturing what it's like to grow from one creative medium into many — the wins, the struggles, and everything in between.",
        cta: { label: 'Watch Logs →', href: '/video-log' },
        bg: 'from-rose-500/10 to-pink-500/10 dark:from-rose-900/20 dark:to-pink-900/20',
        border: 'border-rose-200 dark:border-rose-800',
    },
];

const nowItems = [
    { emoji: '🎸', text: 'Writing and recording original tracks with my sister' },
    { emoji: '🖼️', text: 'Adding new illustrations to the gallery' },
    { emoji: '🎮', text: 'Developing Noteleks Heroes — 2D action platformer' },
    { emoji: '📝', text: 'Posting updates on the creative journey via the blog' },
];

const faqs = [
    {
        id: 1,
        question: 'What drives your creative philosophy?',
        answer: 'Peace, fun, moderation, defense, thinking, and non-judging. These core values guide every creative decision, from music composition to visual concepts. I believe art should bring people together and promote positive interaction.',
    },
    {
        id: 2,
        question: 'How do you collaborate on music with your sister?',
        answer: 'Music is my primary passion and strength. Our collaboration is built on shared creative vision and mutual respect. We practice together regularly, experimenting with different sounds and styles while developing our unique sound.',
    },
    {
        id: 3,
        question: 'How does your 3D character creation process work?',
        answer: 'I start by creating 2D character concepts and designs, then collaborate with talented 3D modelers on Fiverr to bring them to life. The process of turning 2D visions into 3D reality is incredibly rewarding.',
    },
    {
        id: 4,
        question: 'Why are you expanding beyond music?',
        answer: "While music is my core strength, I want to become a more well-rounded creative person. I'm exploring game development, visual art, and storytelling to round out my edges and grow as an artist while staying true to my musical foundation.",
    },
    {
        id: 5,
        question: 'How do you document your creative growth journey?',
        answer: 'Through video logs that capture my journey from being primarily a musician to exploring other creative mediums. I share the challenges, insights, and discoveries of learning new artistic skills.',
    },
    {
        id: 6,
        question: 'What does "vibe coding" mean to your development process?',
        answer: "Vibe coding means developing organically and letting creativity flow naturally. It's about putting things out there based on how they feel at the time, allowing for authentic expression and iterative improvement as I learn new skills.",
    },
];

const footerNavigation = {
    explore: [
        { name: 'Gallery', href: '/illustrations' },
        { name: 'Video Logs', href: '/video-log' },
        { name: 'Blog', href: '/blog' },
    ],
    connect: [
        { name: 'Graveyard Jokes Studios', href: getProjectUrl('graveyardjokes') },
    ],
};

export default function Welcome() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const cdn = import.meta.env.VITE_ASSET_URL as string;
    const studioUrl = getProjectUrl('studio');

    return (
        <div className="bg-white dark:bg-gray-950">
            <Head>
                <title>GraveYard Jokes Studio - Creative Arts, Music & Game Development</title>
                <meta
                    name="description"
                    content="Creative studio showcasing original music, game development, visual art, and creative growth. Creating collaborative music, illustrations, games, and documenting the artistic journey."
                />
                <meta
                    name="keywords"
                    content="game development, original music, creative studio, 2D platformer, visual art, illustrations, video logs, indie games"
                />
                <meta property="og:title" content="GraveYard Jokes Studio - Creative Arts, Music & Game Development" />
                <meta
                    property="og:description"
                    content="Creative studio showcasing original music, game development, visual art, and creative growth."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={studioUrl} />
                <meta property="og:image" content={`${studioUrl}images/og-image.jpg`} />
                <meta property="og:site_name" content="GraveYard Jokes Studio" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="GraveYard Jokes Studio - Creative Arts & Game Development" />
                <meta
                    name="twitter:description"
                    content="Creative studio showcasing original music, game development, visual art, and creative growth."
                />
                <meta name="twitter:image" content={`${studioUrl}images/og-image.jpg`} />
                <meta name="author" content="GraveYard Jokes" />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={studioUrl} />
            </Head>

            {/* Header */}
            <header className="absolute inset-x-0 top-0 z-50">
                <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                    <div className="flex">
                        <a href="/" className="-m-1.5 p-1.5">
                            <span className="sr-only">Creative Studio</span>
                            <img
                                alt="GraveYard Jokes Studio Logo"
                                src={`${cdn}/images/GraveYardJokesLogoJester.svg`}
                                className="h-16 w-auto"
                            />
                        </a>
                    </div>
                    <div className="flex lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-200"
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mx-auto hidden items-center gap-x-12 lg:flex">
                        {navigation.map((item) => (
                            <a key={item.name} href={item.href} className="text-sm/6 font-semibold text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300">
                                {item.name}
                            </a>
                        ))}
                    </div>
                </nav>
                <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                    <div className="fixed inset-0 z-50" />
                    <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-950 dark:sm:ring-white/10">
                        <div className="flex items-center justify-between">
                            <a href="/" className="-m-1.5 p-1.5">
                                <span className="sr-only">GraveYard Jokes Studios</span>
                                <img alt="GraveYard Jokes Studios Logo" src={`${cdn}/images/GraveYardJokesLogoJester.svg`} className="h-20 w-auto" />
                            </a>
                            <button type="button" onClick={() => setMobileMenuOpen(false)} className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-200">
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon aria-hidden="true" className="size-6" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-gray-500/10 dark:divide-white/10">
                                <div className="space-y-2 py-6">
                                    {navigation.map((item) => (
                                        <a
                                            key={item.name}
                                            href={item.href}
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
                                        >
                                            {item.name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogPanel>
                </Dialog>
            </header>

            <main>
                {/* Hero */}
                <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20 dark:from-indigo-900/10">
                    <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div
                            style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-gradient-to-tr from-indigo-300 to-purple-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75 dark:from-indigo-800 dark:to-purple-900 dark:opacity-30"
                        />
                    </div>

                    <div className="mx-auto max-w-7xl px-6 pt-32 pb-20 sm:pt-48 sm:pb-32 lg:px-8 lg:pt-40">
                        <div className="mx-auto max-w-2xl text-center">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                                </span>
                                Actively creating
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl dark:text-white">
                                Creative Studio
                            </h1>
                            <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-400">
                                A musician's journey into becoming a well-rounded creative. Music, visual art, game development, and honest documentation of the process — growing with peace, fun, and intention.
                            </p>
                            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                <Link
                                    href="/illustrations"
                                    className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    View Gallery
                                </Link>
                                <Link href="/video-log" className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                                    Video Logs
                                </Link>
                                <Link href="/blog" className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                                    Read the Blog <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="border-y border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
                    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                        <dl className="grid grid-cols-2 gap-x-8 gap-y-6 text-center sm:grid-cols-4">
                            {[
                                { label: 'Creative Areas', value: '4' },
                                { label: 'Original Tracks', value: '2+' },
                                { label: 'Illustrations', value: '20+' },
                                { label: 'Video Logs', value: '10+' },
                            ].map((stat) => (
                                <div key={stat.label} className="flex flex-col gap-y-1">
                                    <dt className="text-sm/6 text-gray-600 dark:text-gray-400">{stat.label}</dt>
                                    <dd className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stat.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                {/* Creative areas */}
                <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">What I Create</h2>
                        <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
                            Four creative pillars
                        </p>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                            Each area feeds the others — music inspires visuals, visuals inspire games, games inspire stories.
                        </p>
                    </div>

                    <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
                        {creativeAreas.map((area) => (
                            <div
                                key={area.id}
                                className={`relative flex flex-col rounded-2xl border bg-gradient-to-br p-6 ${area.bg} ${area.border}`}
                            >
                                <div className="flex items-start justify-between">
                                    <span className="text-3xl">{area.emoji}</span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${area.statusColor}`}>
                                        {area.status}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-1 flex-col">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{area.label}</p>
                                    <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{area.headline}</h3>
                                    <p className="mt-3 flex-1 text-sm text-gray-600 dark:text-gray-400">{area.description}</p>
                                    {area.cta && (
                                        <a href={area.cta.href} className="mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                                            {area.cta.label}
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* What I'm working on now */}
                <div className="bg-gray-50 dark:bg-white/5">
                    <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:mx-0">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">What I'm working on now</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                                A snapshot of active creative work — updated as the journey evolves.
                            </p>
                        </div>
                        <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-none lg:gap-6">
                            {nowItems.map((item, i) => (
                                <li key={i} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                                    <span className="text-2xl">{item.emoji}</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.text}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link href="/blog" className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                                Read the blog for updates
                            </Link>
                            <Link href="/video-log" className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                                Watch video logs
                            </Link>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">About the creative process</h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Common questions about how and why I create.</p>
                    </div>
                    <dl className="mx-auto mt-14 max-w-2xl divide-y divide-gray-900/10 dark:divide-white/10">
                        {faqs.map((faq) => (
                            <Disclosure key={faq.id} as="div" className="py-6 first:pt-0">
                                <dt>
                                    <DisclosureButton className="group flex w-full items-start justify-between text-left text-gray-900 dark:text-white">
                                        <span className="text-base/7 font-semibold">{faq.question}</span>
                                        <span className="ml-6 flex h-7 items-center">
                                            <ChevronDownIcon aria-hidden="true" className="size-6 transition-transform group-data-open:rotate-180" />
                                        </span>
                                    </DisclosureButton>
                                </dt>
                                <DisclosurePanel as="dd" className="mt-2 pr-12">
                                    <p className="text-base/7 text-gray-600 dark:text-gray-400">{faq.answer}</p>
                                </DisclosurePanel>
                            </Disclosure>
                        ))}
                    </dl>
                </div>

                {/* CTA */}
                <div className="bg-indigo-600 dark:bg-indigo-900">
                    <div className="mx-auto max-w-7xl px-6 py-20 text-center lg:px-8">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Follow the journey</h2>
                        <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-200">
                            Whether it's new music, fresh art, or the next chapter of game dev — it all lives here.
                        </p>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            <Link href="/illustrations" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50">
                                View Gallery
                            </Link>
                            <Link href="/blog" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
                                Read the Blog
                            </Link>
                            <Link href="/video-log" className="text-sm/6 font-semibold text-indigo-200 hover:text-white">
                                Video Logs <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mx-auto max-w-7xl px-6 pb-12 pt-16 lg:px-8">
                <div className="flex flex-col items-start justify-between gap-8 border-t border-gray-900/10 pt-10 sm:flex-row dark:border-white/10">
                    <div>
                        <img alt="GraveYard Jokes Studios" src={`${cdn}/images/GraveYardJokesLogoJester.svg`} className="h-14" />
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">A musician becoming a well-rounded creative.</p>
                    </div>
                    <div className="flex gap-12">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Explore</h3>
                            <ul className="mt-4 space-y-3">
                                {footerNavigation.explore.map((item) => (
                                    <li key={item.name}>
                                        <a href={item.href} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Connect</h3>
                            <ul className="mt-4 space-y-3">
                                {footerNavigation.connect.map((item) => (
                                    <li key={item.name}>
                                        <a href={item.href} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <p className="mt-10 text-xs text-gray-500 dark:text-gray-600">&copy; {new Date().getFullYear()} GraveYard Jokes Studios. All rights reserved.</p>
            </footer>
        </div>
    );
}
            <Head>
                <title>GraveYard Jokes Studio - Creative Arts, Music & Game Development</title>
                <meta
                    name="description"
                    content="Creative studio showcasing original music, game development, visual art, and creative growth. Building Noteleks Heroes, creating collaborative music, and documenting the artistic journey."
                />
                <meta
                    name="keywords"
                    content="game development, original music, creative studio, Noteleks Heroes, 2D platformer, visual art, illustrations, video logs, indie games"
                />

                {/* Open Graph */}
                <meta property="og:title" content="GraveYard Jokes Studio - Creative Arts, Music & Game Development" />
                <meta
                    property="og:description"
                    content="Creative studio showcasing original music, game development, visual art, and creative growth. Building Noteleks Heroes and documenting the artistic journey."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={studioUrl} />
                <meta property="og:image" content={`${studioUrl}images/og-image.jpg`} />
                <meta property="og:site_name" content="GraveYard Jokes Studio" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="GraveYard Jokes Studio - Creative Arts & Game Development" />
                <meta
                    name="twitter:description"
                    content="Creative studio showcasing original music, game development, visual art, and creative growth."
                />
                <meta name="twitter:image" content={`${studioUrl}images/og-image.jpg`} />

                {/* Additional Meta */}
                <meta name="author" content="GraveYard Jokes" />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={studioUrl} />
            </Head>
            {/* Header */}
            <header className="absolute inset-x-0 top-0 z-50">
                <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                    <div className="flex">
                        <a href="#" className="-m-1.5 p-1.5">
                            <span className="sr-only">Creative Studio</span>
                            <img
                                alt="GraveYard Jokes Studio Logo"
                                src={`${cdn}/images/GraveYardJokesLogoJester.svg`}
                                className="h-16 w-auto dark:hidden"
                            />
                            <img
                                alt="GraveYard Jokes Studio Logo"
                                src={`${cdn}/images/GraveYardJokesLogoJester.svg`}
                                className="h-16 w-auto not-dark:hidden"
                            />
                        </a>
                    </div>
                    <div className="flex lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-200"
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mx-auto hidden items-center lg:flex lg:gap-x-12">
                        {navigation.map((item) => (
                            <a key={item.name} href={item.href} className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                                {item.name}
                            </a>
                        ))}
                    </div>
                </nav>
                <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                    <div className="fixed inset-0 z-50" />
                    <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[var(--background)] p-6 sm:max-w-sm sm:ring-1 sm:ring-[var(--primary)] dark:bg-[var(--background)] dark:sm:ring-[var(--primary)]">
                        <div className="flex items-center justify-between">
                            <a href="#" className="-m-1.5 p-1.5">
                                <span className="sr-only">GraveYard Jokes Studios</span>
                                <img
                                    alt="GraveYard Jokes Studios Logo"
                                    src={`${cdn}/images/GraveYardJokesLogoJester.svg`}
                                    className="h-24 w-auto dark:hidden"
                                />
                                <img
                                    alt="GraveYard Jokes Studios Logo"
                                    src={`${cdn}/images/GraveYardJokesLogoJester.svg`}
                                    className="h-24 w-auto not-dark:hidden"
                                />
                            </a>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-200"
                            >
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon aria-hidden="true" className="size-6" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-[var(--border)] dark:divide-[var(--border)]">
                                <div className="space-y-2 py-6">
                                    {navigation.map((item) => (
                                        <a
                                            key={item.name}
                                            href={item.href}
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
                                        >
                                            {item.name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogPanel>
                </Dialog>
            </header>

            <main className="isolate">
                {/* Hero section */}
                <div className="relative pt-8">
                    <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[var(--card)] to-[var(--primary)] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75 dark:opacity-20"
                        />
                    </div>
                    <div className="py-12 sm:py-32 lg:pb-40">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="mx-auto max-w-2xl text-center">
                                <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl dark:text-white">
                                    Creative Studio
                                </h1>
                                <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">
                                    A musician's journey into becoming a well-rounded creative. From collaborative music-making to 2D concepts brought
                                    to life through 3D modeling partnerships, games, and beyond. Growing creatively with peace, fun, and intention.
                                </p>
                                <div className="mt-10 flex items-center justify-center gap-x-6">
                                    <a href="/illustrations" className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                                        View Gallery <span aria-hidden="true">→</span>
                                    </a>

                                    <a
                                        href="/video-log"
                                        className="ml-2 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
                                    >
                                        Video Logs
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div aria-hidden="true" className="absolute inset-x-0 -z-10 transform-gpu overflow-hidden blur-3xl">
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[var(--card)] to-[var(--primary)] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75 dark:opacity-40"
                        />
                    </div>
                </div>

                {/* Feature section */}
                <div className="mx-auto max-w-3xl px-6 sm:mt-10 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base/7 font-semibold text-gray-600 dark:text-gray-400">Creative Journey</h2>
                        <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance dark:text-white">
                            Music, Games & Growth
                        </p>
                        <p className="mt-6 text-lg/8 text-gray-700 dark:text-gray-300">
                            Starting with music as my foundation, I'm expanding into game development, visual concepts, and collaborative 3D creation.
                            Noteleks Heroes is my first playable game - a 2D action platformer with working combat, enemy AI, and physics.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            {features.map((feature) => (
                                <div key={feature.name} className="relative pl-16">
                                    <dt className="text-base/7 font-semibold text-gray-900 dark:text-white">
                                        <div className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg bg-gray-600 dark:bg-gray-500">
                                            <feature.icon aria-hidden="true" className="size-6 text-white" />
                                        </div>
                                        {feature.name}
                                    </dt>
                                    <dd className="mt-2 text-base/7 text-gray-600 dark:text-gray-400">{feature.description}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                {/* FAQs */}
                <div className="mx-auto mt-12 max-w-2xl px-6 pb-8 sm:pt-12 sm:pb-24 lg:max-w-7xl lg:px-8 lg:pb-32">
                    <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">About the Creative Process</h2>
                    <dl className="mt-20 divide-y divide-gray-900/10 dark:divide-white/10">
                        {faqs.map((faq) => (
                            <div key={faq.id} className="py-8 first:pt-0 last:pb-0 lg:grid lg:grid-cols-12 lg:gap-8">
                                <dt className="text-base/7 font-semibold text-gray-900 lg:col-span-5 dark:text-white">{faq.question}</dt>
                                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                                    <p className="text-base/7 text-gray-600 dark:text-gray-400">{faq.answer}</p>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* CTA section */}
                <div className="relative -z-10 mt-32 px-6 lg:px-8">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-1/2 -z-10 flex -translate-y-1/2 transform-gpu justify-center overflow-hidden blur-3xl sm:top-auto sm:right-[calc(50%-6rem)] sm:bottom-0 sm:translate-y-0 sm:justify-end"
                    >
                        <div
                            style={{
                                clipPath:
                                    'polygon(73.6% 48.6%, 91.7% 88.5%, 100% 53.9%, 97.4% 18.1%, 92.5% 15.4%, 75.7% 36.3%, 55.3% 52.8%, 46.5% 50.9%, 45% 37.4%, 50.3% 13.1%, 21.3% 36.2%, 0.1% 0.1%, 5.4% 49.1%, 21.4% 36.4%, 58.9% 100%, 73.6% 48.6%)',
                            }}
                            className="aspect-1108/632 w-277 flex-none bg-linear-to-r from-[var(--card)] to-[var(--primary)] opacity-40"
                        />
                    </div>
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-4xl font-semibold tracking-tight text-balance text-gray-900 sm:text-5xl dark:text-white">
                            Ready to explore creativity together?
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg/8 text-pretty text-gray-600 dark:text-gray-300">
                            Join me on this journey of creative growth. Follow along for music collaborations with my sister, 2D-to-3D character
                            creation partnerships, game development experiments, and the adventure of a musician becoming more well-rounded.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <a
                                href="/illustrations"
                                className="rounded-md bg-gray-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 dark:bg-gray-500 dark:shadow-none dark:hover:bg-gray-400 dark:focus-visible:outline-gray-500"
                            >
                                Explore Gallery
                            </a>
                            <a href="#about" className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                                Learn more <span aria-hidden="true">→</span>
                            </a>
                        </div>
                    </div>
                    <div
                        aria-hidden="true"
                        className="absolute top-full right-0 left-1/2 -z-10 hidden -translate-y-1/2 transform-gpu overflow-hidden blur-3xl sm:block"
                    >
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="aspect-1155/678 w-288.75 bg-linear-to-tr from-[var(--card)] to-[var(--primary)] opacity-30"
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative mx-auto mt-32 max-w-7xl px-6 lg:px-8">
                <div className="border-t border-gray-900/10 py-16 sm:py-24 lg:py-32 dark:border-white/10">
                    <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                        <img alt="GraveYard Jokes Studios" src={`${cdn}/images/GraveYardJokesLogoJester.svg`} className="h-18 dark:hidden" />
                        <img alt="GraveYard Jokes Studios" src={`${cdn}/images/GraveYardJokesLogoJester.svg`} className="h-18 not-dark:hidden" />
                        <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                            <div className="md:grid md:grid-cols-2 md:gap-8">
                                <div>
                                    <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Creative Work</h3>
                                    <ul role="list" className="mt-6 space-y-4">
                                        {footerNavigation.creative.map((item) => (
                                            <li key={item.name}>
                                                <a
                                                    href={item.href}
                                                    className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-10 md:mt-0">
                                    <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Connect</h3>
                                    <ul role="list" className="mt-6 space-y-4">
                                        {footerNavigation.connect.map((item) => (
                                            <li key={item.name}>
                                                <a
                                                    href={item.href}
                                                    className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="md:grid md:grid-cols-2 md:gap-8">
                                <div>
                                    <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Journey</h3>
                                    <ul role="list" className="mt-6 space-y-4">
                                        {footerNavigation.journey.map((item) => (
                                            <li key={item.name}>
                                                <a
                                                    href={item.href}
                                                    className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-10 md:mt-0">
                                    <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Resources</h3>
                                    <ul role="list" className="mt-6 space-y-4">
                                        {footerNavigation.resources.map((item) => (
                                            <li key={item.name}>
                                                <a
                                                    href={item.href}
                                                    className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
