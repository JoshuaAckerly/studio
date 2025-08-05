import React from 'react';

const Footer: React.FC = () => (
    <footer style={{ padding: '1rem', textAlign: 'center', background: '#f5f5f5' }}>
        <small>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</small>
    </footer>
);

export default Footer;