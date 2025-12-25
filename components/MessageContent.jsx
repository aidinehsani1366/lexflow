"use client";

import { Fragment } from "react";

const codeFenceRegex = /^```/;
const listItemRegex = /^[-*]\s+/;
const boldRegex = /\*\*(.*?)\*\*/g;

function renderInline(text) {
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function renderList(block) {
  const items = block.split("\n").filter(Boolean);
  return (
    <ul className="list-disc space-y-2 pl-6">
      {items.map((line, idx) => (
        <li key={idx} className="leading-relaxed text-slate-700">
          {renderInline(line.replace(listItemRegex, "").trim())}
        </li>
      ))}
    </ul>
  );
}

function renderParagraph(block, idx) {
  const lines = block.split("\n");
  return (
    <p key={idx} className="leading-relaxed text-slate-700">
      {lines.map((line, lineIdx) => (
        <Fragment key={lineIdx}>
          {renderInline(line)}
          {lineIdx < lines.length - 1 ? <br /> : null}
        </Fragment>
      ))}
    </p>
  );
}

function renderCode(block, idx) {
  const cleaned = block.replace(/```/g, "").trim();
  return (
    <pre
      key={idx}
      className="overflow-x-auto rounded-2xl bg-slate-900/95 p-4 text-xs text-slate-100 shadow-inner"
    >
      <code>{cleaned}</code>
    </pre>
  );
}

export default function MessageContent({ content = "" }) {
  const normalized = content.trim();
  if (!normalized) return null;
  const blocks = normalized.split(/\n{2,}/);

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        if (codeFenceRegex.test(trimmed)) {
          return renderCode(trimmed, idx);
        }
        if (trimmed.split("\n").every((line) => listItemRegex.test(line))) {
          return <Fragment key={idx}>{renderList(trimmed)}</Fragment>;
        }
        return renderParagraph(trimmed, idx);
      })}
    </div>
  );
}
