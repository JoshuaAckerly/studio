import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, padding: '2rem' }}>
            {children}
        </main>
        <Footer />
    </div>
);

export default MainLayout;