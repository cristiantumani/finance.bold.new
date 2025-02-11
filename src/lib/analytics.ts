import { supabase } from './supabase';

type EventName = 
  | 'sign_up'
  | 'sign_in'
  | 'profile_created'
  | 'transaction_created'
  | 'transaction_updated'
  | 'transaction_deleted'
  | 'budget_created'
  | 'budget_updated'
  | 'category_created'
  | 'category_updated'
  | 'import_started'
  | 'import_completed'
  | 'page_view';

type EventProperties = {
  [key: string]: any;
};

export async function trackEvent(
  eventName: EventName,
  properties: EventProperties = {}
) {
  try {
    // Get current user synchronously
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('No user found when tracking event:', eventName);
      return;
    }

    const { error } = await supabase
      .from('analytics_events')
      .insert([{
        event_name: eventName,
        properties,
        session_id: getSessionId(),
        user_id: user.id,
        url: window.location.pathname,
        referrer: document.referrer,
        user_agent: navigator.userAgent
      }]);

    if (error) {
      console.error('Error tracking event:', error);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

// Generate a unique session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Track page views
export function initializeAnalytics() {
  // Track initial page view
  trackEvent('page_view', {
    path: window.location.pathname,
    title: document.title
  });

  // Track navigation changes for SPA
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    trackEvent('page_view', {
      path: window.location.pathname,
      title: document.title
    });
  };
}