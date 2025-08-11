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
    // For now, log to console until the security_audit_log table is available in types
    console.warn('Security Event:', {
      type: event.event_type,
      user: event.user_id,
      details: event.details,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Implement database logging once types are regenerated
    // const { error } = await supabase
    //   .from('security_audit_log')
    //   .insert({
    //     event_type: event.event_type,
    //     user_id: event.user_id,
    //     details: event.details,
    //     timestamp: new Date().toISOString()
    //   });
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