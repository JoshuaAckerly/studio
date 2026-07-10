import React from 'react';

interface PrivacyProps {
    content: string;
}

const Privacy: React.FC<PrivacyProps> = ({ content }) => {
    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            <section className="border-b border-gray-800 bg-[#1a1a1a] py-12 text-center">
                <h1 className="text-4xl font-bold text-[#6633ff]">Privacy Policy</h1>
            </section>

            <section className="px-6 py-12">
                <div className="legal-prose mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: content }} />
            </section>
        </div>
    );
};

export default Privacy;
