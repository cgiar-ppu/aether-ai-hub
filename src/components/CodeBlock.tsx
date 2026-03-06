import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

// Basic syntax highlighting for Python
const highlightPython = (code: string): string => {
  const keywords = /\b(import|from|as|def|class|return|if|else|elif|for|in|while|try|except|with|print|True|False|None|and|or|not|is|lambda|yield|pass|break|continue|raise|global|nonlocal|assert|del)\b/g;
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  const comments = /(#.*$)/gm;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
  const decorators = /(@\w+)/g;

  // Tokenize to avoid overlapping highlights
  type Token = { start: number; end: number; type: string; text: string };
  const tokens: Token[] = [];

  let match: RegExpExecArray | null;

  // Order matters: strings first, then comments, then others
  const strRegex = new RegExp(strings.source, 'g');
  while ((match = strRegex.exec(code)) !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length, type: 'string', text: match[0] });
  }

  const commentRegex = new RegExp(comments.source, 'gm');
  while ((match = commentRegex.exec(code)) !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length, type: 'comment', text: match[0] });
  }

  // Sort by start position and remove overlaps
  tokens.sort((a, b) => a.start - b.start);
  const merged: Token[] = [];
  for (const t of tokens) {
    if (merged.length === 0 || t.start >= merged[merged.length - 1].end) {
      merged.push(t);
    }
  }

  // Build highlighted string
  let result = '';
  let lastIdx = 0;

  for (const token of merged) {
    // Process the gap before this token
    const gap = code.slice(lastIdx, token.start);
    result += highlightPlain(gap, keywords, numbers, functions, decorators);

    if (token.type === 'string') {
      result += `<span class="text-emerald-400">${escapeHtml(token.text)}</span>`;
    } else if (token.type === 'comment') {
      result += `<span class="text-zinc-500">${escapeHtml(token.text)}</span>`;
    }
    lastIdx = token.end;
  }

  result += highlightPlain(code.slice(lastIdx), keywords, numbers, functions, decorators);
  return result;
};

const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const highlightPlain = (
  text: string,
  keywords: RegExp,
  numbers: RegExp,
  functions: RegExp,
  decorators: RegExp,
) => {
  let escaped = escapeHtml(text);
  escaped = escaped.replace(decorators, '<span class="text-yellow-400">$1</span>');
  escaped = escaped.replace(functions, '<span class="text-sky-300">$1</span>');
  escaped = escaped.replace(keywords, '<span class="text-violet-400 font-semibold">$1</span>');
  escaped = escaped.replace(numbers, '<span class="text-amber-300">$1</span>');
  return escaped;
};

const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = language === 'python' ? highlightPython(code) : escapeHtml(code);

  return (
    <div className="rounded-lg overflow-hidden bg-[#1E1E2E] my-2">
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-[#313244]">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
};

export default CodeBlock;
