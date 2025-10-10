// Google Analytics utility functions

declare global {
    function gtag(...args: any[]): void;
}

export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Log for debugging
    console.log('Analytics Event:', eventName, parameters);
};

export const trackPageView = (pagePath: string, pageTitle?: string) => {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_path: pagePath,
            page_title: pageTitle
        });
    }
};

export const trackSubdomainVisit = (visitData: {
    referrer: string;
    subdomain: string;
    page_title: string;
    user_agent: string;
    timestamp: string;
}) => {
    trackEvent('subdomain_visit', {
        event_category: 'engagement',
        event_label: visitData.subdomain,
        custom_parameter_referrer: visitData.referrer,
        custom_parameter_subdomain: visitData.subdomain,
        custom_parameter_page_title: visitData.page_title
    });
};

export const trackGameAccess = (gameName: string) => {
    trackEvent('game_access', {
        event_category: 'games',
        event_label: gameName,
        custom_parameter_subdomain: window.location.hostname
    });
};

export const trackCustomEvent = (category: string, action: string, label?: string) => {
    trackEvent(action, {
        event_category: category,
        event_label: label,
        custom_parameter_subdomain: window.location.hostname
    });
};