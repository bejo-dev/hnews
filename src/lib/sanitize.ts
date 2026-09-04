import sanitizeHtml from 'sanitize-html';

export function sanitizeHtmlFragment(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
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
    allowedAttributes: {
      a: ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
  });
}
