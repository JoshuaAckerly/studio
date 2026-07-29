import React, { useState } from 'react';
import { getLoginUrl, getMainSiteUrl } from '../env';
import ApplicationLogo from './ApplicationLogo';
import NotificationBell from './NotificationBell';

interface HeaderProps {
    minimalNav?: boolean;
}

const Header: React.FC<HeaderProps> = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { name: 'Studio', href: '/' },
        { name: 'Blog', href: '/blog' },
        { name: 'TikTok', href: '/video-log' },
        { name: 'Discord', href: '/discord' },
        { name: 'Login', href: getLoginUrl('studio') },
    ];

    return (
        <header className="border-b border-border bg-card/60 backdrop-blur-sm">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <a href={getMainSiteUrl()}>
                        <ApplicationLogo logoSize="h-10 w-10" />
                    </a>
                    <div>
                        <a href={getMainSiteUrl()} className="text-lg leading-none font-semibold text-foreground">
                            GraveYardJokes Studios
                        </a>
                        <p className="text-xs text-muted-foreground">Blog &middot; TikTok &middot; Discord</p>
                    </div>
                </div>

                <nav aria-label="Primary" className="hidden items-center gap-4 sm:flex">
                    {navLinks.map((link) => (
                        <a key={link.href} href={link.href} className="rounded-md px-2 py-1 text-sm text-foreground hover:text-primary-foreground/90">
                            {link.name}
                        </a>
                    ))}
                    <NotificationBell />
                </nav>

                <div className="flex items-center gap-2 sm:hidden">
                    <NotificationBell />
                    <button
                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen((o) => !o)}
                        className="rounded-md bg-muted/40 p-2 text-foreground"
                    >
                        {mobileOpen ? (
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <nav aria-label="Mobile" className="border-t border-border bg-card sm:hidden">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
                        >
                            {link.name}
                        </a>
                    ))}
                </nav>
            )}
        </header>
    );
};

export default Header;
