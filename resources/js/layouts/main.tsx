import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    React.useEffect(() => {
        const trackVisit = async () => {
            try {
                await fetch('https://graveyardjokes.com/track-visit', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        referrer: window.location.href,
                        subdomain: window.location.hostname
                    })
                });
            } catch (error) {
                console.error('Failed to track visit:', error);
            }
        };
        trackVisit();
    }, []);

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