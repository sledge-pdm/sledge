import { css } from '@acab/ecsstatic';

export const wikiContentRoot = css`
  display: flex;
  flex-direction: column;
  padding: 4rem;
  gap: 24px;
  height: 100svh;
  background-color: var(--color-background);
  overflow-y: auto;
`;

export const wikiContentHeader = css`
  font-size: 36px;
  font-family: ZFB31;
  text-transform: uppercase;
  user-select: text;
`;

export const wikiMarkdown = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: ZFB08;
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-on-background);
  text-rendering: optimizeLegibility;
  pointer-events: all;

  * {
    font-family: k12x8;
    font-size: 8px;
    font-weight: normal;
    user-select: text;
  }

  h1,
  h2,
  h3,
  h4 {
    letter-spacing: 0.6px;
    margin: 0;
  }

  h1 {
    font-size: 32px;
    font-family: ZFB08;
  }

  h2 {
    font-size: 16px;
    font-family: ZFB09;
    margin-top: 8px;
  }

  h3 {
    font-size: 8px;
    font-family: ZFB20;
    text-transform: uppercase;
    margin-top: 8px;
  }

  h4 {
    font-size: 8px;
    font-family: ZFB09;
  }

  p {
    margin: 0;
  }

  strong {
    font-family: ZFB09;
  }

  ul,
  ol {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding-left: 24px;
    list-style-type: square;
  }

  li {
    line-height: 1.5;
  }

  blockquote {
    border-left: 2px solid #888888b0;
    padding-left: 8px;
    margin: 0;
    opacity: 0.85;
    font-size: 8px;
    line-height: 1;
    padding: 4px 12px;
    vertical-align: middle;
    font-style: italic;
  }

  code {
    font-size: 8px;
    background-color: #88888830;
    padding: 1px 4px;
    border-radius: 4px;
  }

  pre {
    padding: 12px;
    background-color: #88888830;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0;
  }

  table {
    border-collapse: collapse;
    width: fit-content;
    font-family: inherit;
  }

  th,
  td {
    font-size: 8px;
    font-family: k12x8;
    border: 1px solid var(--color-border-secondary);
    padding: 6px 8px;
    text-align: left;
  }

  th {
    font-size: 8px;
    font-family: ZFB09;
  }

  img {
    max-width: 50%;
    height: auto;
    border-radius: 12px;
    image-rendering: auto;
    border: 1px solid var(--color-border);

    margin-top: 8px;
    margin-bottom: 8px;
  }

  a {
    color: var(--color-accent);
    text-decoration: underline;
    text-decoration-thickness: 1px;
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-border-secondary);
    margin: 12px 0;
  }

  details {
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    padding: 8px;
  }

  summary {
    cursor: pointer;
    font-family: ZFB08;
    text-transform: uppercase;
    font-size: 8px;
    letter-spacing: 1px;
  }
`;
