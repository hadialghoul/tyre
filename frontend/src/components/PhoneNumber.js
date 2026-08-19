import React from 'react';

const PHONE_RE = /(?:\+?\d[\d\s./()-]{5,}\d)/g;

const ltrMarks = (value) => `\u202D${String(value ?? '')}\u202C`;

const PhoneNumber = ({ children, className = '', style, ...props }) => (
  <span
    dir="ltr"
    className={`phone-number ${className}`.trim()}
    style={{
      display: 'inline-block',
      direction: 'ltr',
      unicodeBidi: 'bidi-override',
      whiteSpace: 'nowrap',
      ...style,
    }}
    {...props}
  >
    {ltrMarks(children)}
  </span>
);

export const PhoneInText = ({ children }) => {
  const text = String(children ?? '');
  if (!text) return null;

  const nodes = [];
  const matcher = new RegExp(PHONE_RE.source, 'g');
  let lastIndex = 0;
  let match;

  while ((match = matcher.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<PhoneNumber key={`phone-${match.index}`}>{match[0]}</PhoneNumber>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
};

export default PhoneNumber;
