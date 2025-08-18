import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: 'content_sanitized' | 'admin_action' | 'content_modification' | 'suspicious_activity';
  user_id?: string;
  details: {
    description: string;
    metadata?: Record<string, any>;
    severity: 'low' | 'medium' | 'high';
  };
}

export const logSecurityEvent = async (event: SecurityEvent) => {
  try {
    // Log to console for immediate visibility
    console.warn('Security Event:', {
      type: event.event_type,
      user: event.user_id,
      details: event.details,
      timestamp: new Date().toISOString()
    });
    
    // Use secure RPC function for database logging
    const { error } = await supabase.rpc('log_security_event', {
      event_type: event.event_type,
      details: event.details,
      user_id_param: event.user_id
    });
    
    if (error) {
      console.error('Security logging RPC error:', error);
    }
  } catch (error) {
    console.error('Security logging error:', error);
  }
};

export const sanitizationLogger = {
  logContentSanitization: (content: string, sanitizedContent: string, userId?: string) => {
    if (content !== sanitizedContent) {
      logSecurityEvent({
        event_type: 'content_sanitized',
        user_id: userId,
        details: {
          description: 'HTML content was sanitized',
          metadata: {
            originalLength: content.length,
            sanitizedLength: sanitizedContent.length,
            potentialXSS: content.includes('<script>') || content.includes('javascript:')
          },
          severity: content.includes('<script>') ? 'high' : 'medium'
        }
      });
    }
  }
};