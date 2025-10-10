import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { trackSubdomainVisit } from '@/lib/analytics';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    React.useEffect(() => {
        const trackVisit = async () => {
            try {
                const visitData = {
                    referrer: window.location.href,
                    subdomain: window.location.hostname,
                    page_title: document.title,
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                };

                // Custom server tracking (for email notifications)
                await fetch('/api/track-visit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(visitData)
                });

                // Google Analytics tracking
                trackSubdomainVisit(visitData);
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