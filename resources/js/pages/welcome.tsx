'use client';

import { Dialog, DialogPanel } from '@headlessui/react';
import { ArrowPathIcon, Bars3Icon, CubeIcon, FingerPrintIcon, MusicalNoteIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

import { Head } from '@inertiajs/react';
import { getProjectUrl } from '../env';

const navigation = [
    { name: '3D Art', href: '#3d' },
    { name: 'Music', href: '#music' },
    { name: 'Games', href: getProjectUrl('studio') },
    { name: 'Gallery', href: '/illustrations' },
    { name: 'Video Logs', href: '/video-log' },
    { name: 'About', href: '#about' },
];
const features = [
    {
        name: 'Game Development',
        description:
            'Building Noteleks Heroes - a 2D action platformer with working combat system, enemy AI, physics-based knockback, and WebP animations. Features include player movement, attack mechanics, enemy spawning, and score tracking.',
        icon: CubeIcon,
    },
    {
        name: 'Original Music',
        description:
            'Music is my core passion. Creating collaborative compositions with my sister, blending our creativity and emotions while developing our unique sound through dedicated practice.',
        icon: MusicalNoteIcon,
    },
    {
        name: 'Creative Growth Journey',
        description:
            'Expanding from my musical foundation into game development, visual art, and storytelling. Learning to become a more well-rounded creative person while staying true to my values.',
        icon: ArrowPathIcon,
    },
    {
        name: 'Creative Documentation',
        description:
            'Sharing the journey of creative growth through video logs, process insights, and life updates. Documenting how a musician explores other artistic mediums.',
        icon: FingerPrintIcon,
    },
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
        answer: 'I start by creating 2D character concepts and designs, then collaborate with talented 3D modelers on Fiverr to bring them to life. Currently, I have one completed model, but the process of turning 2D visions into 3D reality is incredibly rewarding.',
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
    {
        id: 7,
        question: 'What can I expect from Noteleks Heroes?',
        answer: 'Noteleks Heroes is my first playable game - a 2D action platformer built with Phaser 3. It features a weaponless skeleton character with smooth movement, attack mechanics with knockback physics, enemy AI with multiple types, and a scoring system. The game uses WebP animations and has working combat with proper collision detection.',
    },
];
const footerNavigation = {
    creative: [
        { name: 'Music Projects', href: '#music' },
        { name: '2D Concepts', href: '#concepts' },
        { name: '3D Collaborations', href: '#3d' },
        { name: 'Games', href: '#games' },
        { name: 'Video Logs', href: '/video-log' },
    ],
    connect: [
        { name: 'Contact', href: '#contact' },
        { name: 'Fiverr Partners', href: '#partners' },
        { name: 'Updates', href: '#updates' },
    ],
    journey: [
        { name: 'Musical Foundation', href: '#music-foundation' },
        { name: 'Creative Growth', href: '#growth' },
        { name: 'Learning Path', href: '#learning' },
        { name: 'Values', href: '#values' },
    ],
    resources: [
        { name: 'Creative Process', href: '#process' },
        { name: 'Collaboration Tips', href: '#tips' },
        { name: 'Inspiration', href: '#inspiration' },
    ],
};

export default function Welcome() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const cdn = import.meta.env.VITE_ASSET_URL as string;
    const studioUrl = getProjectUrl('studio');

    // Tracking is handled by the main layout to avoid duplicate events
    return (
        <div className="bg-[var(--foreground)] dark:bg-[var(--background)]">
            <Head>
                <title>GraveYard Jokes Studio - Creative Arts, Music & Game Development</title>
                <meta name="description" content="Creative studio showcasing original music, game development, visual art, and creative growth. Building Noteleks Heroes, creating collaborative music, and documenting the artistic journey." />
                <meta name="keywords" content="game development, original music, creative studio, Noteleks Heroes, 2D platformer, visual art, illustrations, video logs, indie games" />

                {/* Open Graph */}
                <meta property="og:title" content="GraveYard Jokes Studio - Creative Arts, Music & Game Development" />
                <meta property="og:description" content="Creative studio showcasing original music, game development, visual art, and creative growth. Building Noteleks Heroes and documenting the artistic journey." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={studioUrl} />
                <meta property="og:image" content={`${studioUrl}images/og-image.jpg`} />
                <meta property="og:site_name" content="GraveYard Jokes Studio" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="GraveYard Jokes Studio - Creative Arts & Game Development" />
                <meta name="twitter:description" content="Creative studio showcasing original music, game development, visual art, and creative growth." />
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
                                    <a
                                        href="/noteleks"
                                        className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                                    >
                                        Play Noteleks Heroes ⚔️ (Alpha)
                                    </a>
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
