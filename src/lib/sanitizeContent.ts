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
    // Configure DOMPurify with strict settings
    const config = createSecurePurifyConfig();
    
    // Add hooks for security monitoring
    DOMPurify.addHook('uponSanitizeElement', (node, data) => {
      // Log potentially dangerous elements that were removed
      if (data.tagName && config.FORBID_TAGS?.includes(data.tagName.toLowerCase())) {
        sanitizationLogger.logContentSanitization(
          `Blocked dangerous tag: ${data.tagName}`,
          'Tag removed by DOMPurify',
          userId
        );
      }
    });

    DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
      // Log potentially dangerous attributes that were removed
      if (data.attrName && config.FORBID_ATTR?.includes(data.attrName.toLowerCase())) {
        sanitizationLogger.logContentSanitization(
          `Blocked dangerous attribute: ${data.attrName}`,
          'Attribute removed by DOMPurify',
          userId
        );
      }
      
      // Check for suspicious URL schemes
      if (data.attrValue && (data.attrName === 'href' || data.attrName === 'src')) {
        const suspiciousPatterns = [
          /javascript:/i,
          /data:/i,
          /vbscript:/i,
          /on\w+=/i
        ];
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(data.attrValue)) {
            sanitizationLogger.logContentSanitization(
              `Blocked suspicious URL: ${data.attrValue}`,
              'Suspicious URL scheme detected',
              userId
            );
            data.attrValue = '#'; // Replace with safe placeholder
            break;
          }
        }
      }
    });

    // Sanitize the content
    const sanitizedContent = DOMPurify.sanitize(content, config);
    
    // Log if content was modified
    sanitizationLogger.logContentSanitization(originalContent, sanitizedContent, userId);
    
    // Clean up hooks to prevent memory leaks
    DOMPurify.removeAllHooks();
    
    return sanitizedContent;
    
  } catch (error) {
    console.error('Error during content sanitization:', error);
    
    // Log the error and return empty string as fallback
    sanitizationLogger.logContentSanitization(
      originalContent,
      'SANITIZATION_ERROR: Content blocked due to processing error',
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