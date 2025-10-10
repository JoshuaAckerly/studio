import { useEffect } from 'react';

// Declare gtag for TypeScript
declare global {
    function gtag(...args: any[]): void;
}

interface VisitData {
    referrer: string;
    subdomain: string;
    page_title: string;
    user_agent: string;
    timestamp: string;
}

export const useVisitorTracking = (enabled: boolean = true) => {
    useEffect(() => {
        if (!enabled) return;

        const trackVisit = async () => {
            try {
                const visitData: VisitData = {
                    referrer: window.location.href,
                    subdomain: window.location.hostname,
                    page_title: document.title,
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                };

                console.log('🎯 Tracking visitor:', visitData.subdomain, visitData.page_title);

                // Send to server for email notifications
                const response = await fetch('/api/track-visit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(visitData)
                });

                const result = await response.json();
                console.log('✅ Server tracking:', result.status);

                // Send to Google Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'subdomain_visit', {
                        event_category: 'engagement',
                        event_label: visitData.subdomain,
                        custom_parameter_referrer: visitData.referrer,
                        custom_parameter_subdomain: visitData.subdomain,
                        custom_parameter_page_title: visitData.page_title
                    });
                    console.log('📊 Google Analytics event sent');
                } else {
                    console.log('⚠️ Google Analytics not available');
                }
            } catch (error) {
                console.error('❌ Tracking failed:', error);
            }
        };

        trackVisit();
    }, [enabled]);
};

// Game-specific tracking
export const useGameTracking = (gameName: string) => {
    useEffect(() => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_access', {
                event_category: 'games',
                event_label: gameName,
                custom_parameter_subdomain: window.location.hostname
            });
            console.log('🎮 Game access tracked:', gameName);
        }
    }, [gameName]);
};

// Custom event tracking
export const trackCustomEvent = (eventName: string, category: string, label?: string) => {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            event_category: category,
            event_label: label,
            custom_parameter_subdomain: window.location.hostname
        });
        console.log('🎯 Custom event:', eventName, category, label);
    }
};