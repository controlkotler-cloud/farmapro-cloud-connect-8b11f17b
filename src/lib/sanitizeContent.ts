import DOMPurify from 'dompurify';
import { sanitizationLogger } from './securityLogger';

// Enhanced DOMPurify configuration with strict security
const createSecurePurifyConfig = () => {
  const config = {
    // Allow only essential tags
    ALLOWED_TAGS: [
      'p', 'div', 'span', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img'
    ],
    
    // Allow only safe attributes
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'width', 'height', 'class', 'id'
    ],
    
    // Allowed URI schemes - strictly limited
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    
    // Security settings
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
    
    // Remove dangerous content
    KEEP_CONTENT: false,
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true,
    
    // Additional security
    ADD_TAGS: [],
    ADD_ATTR: [],
    FORBID_CONTENTS: ['script', 'style'],
    
    // Transform case
    LOWERCASE: true,
  };

  return config;
};

// Enhanced sanitizer with security logging
export const sanitizeHtmlContent = (content: string, userId?: string): string => {
  const originalContent = content;
  
  try {
    // Configure DOMPurify with ultra-strict settings
    const config = {
      ...createSecurePurifyConfig(),
      // Even more restrictive tags - remove img for security
      ALLOWED_TAGS: [
        'p', 'div', 'span', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code'
      ],
      // Only essential attributes
      ALLOWED_ATTR: ['title', 'class'],
      // Block all external content
      FORBID_ATTR: ['src', 'href', 'style', 'onclick', 'onerror', 'onload'],
      KEEP_CONTENT: false,
      WHOLE_DOCUMENT: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
    };
    
    // Add enhanced security hooks
    DOMPurify.addHook('uponSanitizeElement', (node, data) => {
      // Block any potentially dangerous elements
      const dangerousTags = ['script', 'object', 'embed', 'iframe', 'frame', 'form', 'input', 'textarea', 'select', 'button', 'meta', 'link'];
      if (data.tagName && dangerousTags.includes(data.tagName.toLowerCase())) {
        sanitizationLogger.logContentSanitization(
          `SECURITY BLOCK: Dangerous tag ${data.tagName}`,
          'High-risk element blocked',
          userId
        );
        // Use DOMPurify's removal approach instead of direct DOM manipulation
        data.allowedTags = data.allowedTags || {};
        data.allowedTags[data.tagName] = false;
      }
    });

    DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
      // Block all event handlers and suspicious attributes
      const dangerousAttrs = ['on', 'style', 'href', 'src', 'action', 'formaction', 'background', 'dynsrc', 'lowsrc'];
      if (data.attrName && dangerousAttrs.some(attr => data.attrName.toLowerCase().startsWith(attr))) {
        sanitizationLogger.logContentSanitization(
          `SECURITY BLOCK: Dangerous attribute ${data.attrName}=${data.attrValue}`,
          'High-risk attribute blocked',
          userId
        );
        data.attrValue = '';
        data.keepAttr = false;
      }
    });

    // Sanitize with strict config
    const sanitizedContent = DOMPurify.sanitize(content, config);
    
    // Final security check - ensure no dangerous patterns remain
    const finalSanitized = sanitizedContent
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    // Log if content was modified
    if (originalContent !== finalSanitized) {
      sanitizationLogger.logContentSanitization(originalContent, finalSanitized, userId);
    }
    
    // Clean up hooks
    DOMPurify.removeAllHooks();
    
    return finalSanitized;
    
  } catch (error) {
    console.error('SECURITY ERROR: Content sanitization failed:', error);
    
    // Log the error and return empty string as fallback
    sanitizationLogger.logContentSanitization(
      originalContent,
      'SECURITY_ERROR: Content completely blocked due to processing error',
      userId
    );
    
    return '';
  }
};

// Quick sanitizer for text content (removes all HTML)
export const sanitizeTextContent = (content: string): string => {
  return DOMPurify.sanitize(content, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true 
  });
};

// Sanitizer for rich text content (allows more formatting)
export const sanitizeRichContent = (content: string, userId?: string): string => {
  const config = {
    ...createSecurePurifyConfig(),
    ALLOWED_TAGS: [
      'p', 'div', 'span', 'br', 'strong', 'em', 'u', 'i', 'b',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'title', 'colspan', 'rowspan'
    ]
  };
  
  const sanitized = DOMPurify.sanitize(content, config);
  sanitizationLogger.logContentSanitization(content, sanitized, userId);
  
  return sanitized;
};