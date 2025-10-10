import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useVisitorTracking } from '@/hooks/useTracking';

interface MainLayoutProps {
    children: React.ReactNode;
    enableTracking?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, enableTracking = true }) => {
    // Automatically track visitors when layout is used
    useVisitorTracking(enableTracking);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1, padding: '2rem' }}>
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;