import MainLayout from '@/layouts/main';
import React from 'react';

const Welcome: React.FC = () => (
    <MainLayout>
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h1>Welcome to the Studio!</h1>
            <p>Coming Soon!</p>
        </div>
    </MainLayout>
);

export default Welcome;
