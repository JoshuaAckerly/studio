import Footer from '@/components/footer';
import Header from '@/components/header';
import { useVisitorTracking } from '@/hooks/useTracking';
import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
    enableTracking?: boolean;
    minimalNav?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, enableTracking = true, minimalNav = false }) => {
    // Automatically track visitors when layout is used
    useVisitorTracking(enableTracking);

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Header minimalNav={minimalNav} />

            <main className="container mx-auto flex-1 px-4 py-8">{children}</main>

            <Footer />
        </div>
    );
};

export default MainLayout;
