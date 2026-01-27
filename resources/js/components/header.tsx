import React from 'react';
import ApplicationLogo from './ApplicationLogo';

const Header: React.FC = () => {
    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Games', href: '/games' },
        { name: 'About', href: '/about' },
        { name: 'Login', href: 'http://localhost:8007/login' },
    ];

    return (
        <header className="border-b border-border bg-card/60 backdrop-blur-sm">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <ApplicationLogo logoSize="h-10 w-10" />
                    <div>
                        <a href="/" className="text-lg leading-none font-semibold text-foreground">
                            GraveYardJokes Studios
                        </a>
                        <p className="text-xs text-muted-foreground">Games & Experiments</p>
                    </div>
                </div>

                <nav aria-label="Primary" className="hidden items-center gap-4 sm:flex">
                    {navLinks.map((link) => (
                        <a key={link.href} href={link.href} className="rounded-md px-2 py-1 text-sm text-foreground hover:text-primary-foreground/90">
                            {link.name}
                        </a>
                    ))}

                    <a
                        href="/play"
                        className="ml-4 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
                    >
                        Play Now
                    </a>
                </nav>

                {/* Mobile menu button placeholder - keeps header balanced on small screens */}
                <div className="sm:hidden">
                    <button aria-label="Open menu" className="rounded-md bg-muted/40 p-2 text-foreground">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
