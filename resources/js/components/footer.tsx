import React from 'react';

const Footer: React.FC = () => (
    <footer className="border-t border-border bg-card/40">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
            <div className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} GraveYardJokes Studios</div>

            <div className="flex items-center gap-4 text-sm">
                <a href="/privacy" className="text-muted-foreground hover:text-foreground">
                    Privacy
                </a>
                <a href="/terms" className="text-muted-foreground hover:text-foreground">
                    Terms
                </a>
                <a href="/contact" className="text-muted-foreground hover:text-foreground">
                    Contact
                </a>
            </div>
        </div>
    </footer>
);

export default Footer;
