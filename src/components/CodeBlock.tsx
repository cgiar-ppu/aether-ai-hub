import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

type TokenColor = 'default' | 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'builtin' | 'operator';

type Token = {
  start: number;
  end: number;
  color: TokenColor;
};

const codeBlockStyles = {
  container: {
    backgroundColor: '#1a1b2e',
    borderRadius: '8px',
    padding: '16px',
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
    fontSize: '13px',
    lineHeight: '1.6',
    overflowX: 'auto' as const,
    position: 'relative' as const,
  },
  defaultText: {
    color: '#e4e4e7',
  },
  keyword: { color: '#c792ea' },
  string: { color: '#c3e88d' },
  comment: { color: '#676e95' },
  number: { color: '#f78c6c' },
  function: { color: '#82aaff' },
  builtin: { color: '#ffcb6b' },
  operator: { color: '#89ddff' },
  label: {
    color: '#676e95',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  copyButton: {
    color: '#676e95',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    position: 'absolute' as const,
    top: '8px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};

function sanitizeCode(code: string): string {
  let clean = code.replace(/<[^>]*>/g, '');
  clean = clean.replace(/\d{3,4}\s*(?:font-\w+\s*)?'?>/g, '');
  clean = clean.replace(/class="[^"]*"/g, '');
  clean = clean.replace(/style="[^"]*"/g, '');
  clean = clean.replace(/  +/g, ' ');
  clean = clean.replace(/\n\s*\n\s*\n/g, '\n\n');
  return clean.trim();
}

const keywords = new Set([
  'import', 'from', 'as', 'def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'with', 'try', 'except',
  'finally', 'raise', 'yield', 'lambda', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None',
]);

const builtins = new Set(['print', 'int', 'len', 'str', 'float', 'dict', 'list', 'set', 'tuple', 'range']);

const colorStyleMap: Record<TokenColor, { color: string }> = {
  default: codeBlockStyles.defaultText,
  keyword: codeBlockStyles.keyword,
  string: codeBlockStyles.string,
  comment: codeBlockStyles.comment,
  number: codeBlockStyles.number,
  function: codeBlockStyles.function,
  builtin: codeBlockStyles.builtin,
  operator: codeBlockStyles.operator,
};

const addToken = (tokens: Token[], candidate: Token) => {
  const overlaps = tokens.some(
    (token) => candidate.start < token.end && candidate.end > token.start,
  );
  if (!overlaps) tokens.push(candidate);
};

const tokenizeLine = (line: string): Token[] => {
  const tokens: Token[] = [];

  const commentIndex = line.indexOf('#');
  if (commentIndex >= 0) {
    addToken(tokens, { start: commentIndex, end: line.length, color: 'comment' });
  }

  const stringRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  let match: RegExpExecArray | null;
  while ((match = stringRegex.exec(line)) !== null) {
    addToken(tokens, { start: match.index, end: match.index + match[0].length, color: 'string' });
  }

  const wordRegex = /\b[a-zA-Z_]\w*\b/g;
  while ((match = wordRegex.exec(line)) !== null) {
    const value = match[0];
    if (keywords.has(value)) {
      addToken(tokens, { start: match.index, end: match.index + value.length, color: 'keyword' });
    } else if (builtins.has(value)) {
      addToken(tokens, { start: match.index, end: match.index + value.length, color: 'builtin' });
    }
  }

  const functionRegex = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
  while ((match = functionRegex.exec(line)) !== null) {
    const value = match[1];
    if (!builtins.has(value)) {
      addToken(tokens, { start: match.index, end: match.index + value.length, color: 'function' });
    }
  }

  const numberRegex = /\b\d+\.?\d*\b/g;
  while ((match = numberRegex.exec(line)) !== null) {
    addToken(tokens, { start: match.index, end: match.index + match[0].length, color: 'number' });
  }

  const operatorRegex = /==|!=|<=|>=|\+|-|\*|\/|=|%/g;
  while ((match = operatorRegex.exec(line)) !== null) {
    addToken(tokens, { start: match.index, end: match.index + match[0].length, color: 'operator' });
  }

  return tokens.sort((a, b) => a.start - b.start);
};

const renderHighlightedLine = (line: string, lineIndex: number) => {
  if (!line) return <div key={lineIndex}>&nbsp;</div>;

  const tokens = tokenizeLine(line);
  if (tokens.length === 0) {
    return (
      <div key={lineIndex} style={codeBlockStyles.defaultText}>
        {line}
      </div>
    );
  }

  const parts: JSX.Element[] = [];
  let lastEnd = 0;

  tokens.forEach((token, index) => {
    if (token.start > lastEnd) {
      parts.push(
        <span key={`${lineIndex}-plain-${index}`} style={codeBlockStyles.defaultText}>
          {line.slice(lastEnd, token.start)}
        </span>,
      );
    }

    parts.push(
      <span key={`${lineIndex}-tok-${index}`} style={colorStyleMap[token.color]}>
        {line.slice(token.start, token.end)}
      </span>,
    );

    lastEnd = token.end;
  });

  if (lastEnd < line.length) {
    parts.push(
      <span key={`${lineIndex}-tail`} style={codeBlockStyles.defaultText}>
        {line.slice(lastEnd)}
      </span>,
    );
  }

  return <div key={lineIndex}>{parts}</div>;
};

const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const cleanCode = useMemo(() => sanitizeCode(code), [code]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={codeBlockStyles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={codeBlockStyles.label}>{language}</span>
        <button onClick={handleCopy} style={codeBlockStyles.copyButton}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre', color: '#e4e4e7' }}>
        <code>{cleanCode.split('\n').map((line, i) => renderHighlightedLine(line, i))}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
