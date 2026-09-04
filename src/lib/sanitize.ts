import DOMPurify from 'dompurify';

export function sanitizeHtmlFragment(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a',
      'b',
      'blockquote',
      'br',
      'code',
      'del',
      'em',
      'i',
      'li',
      'ol',
      'p',
      'pre',
      'strong',
      'sub',
      'sup',
      'u',
      'ul',
    ],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
  });
}
