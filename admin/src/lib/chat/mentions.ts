import type { ContentBlock, RecordReference } from "@/lib/data/contracts";
import { matchesSearch, type SearchRecord } from "@/lib/search";

export type DraftMention = {
  start: number;
  end: number;
  label: string;
  reference: RecordReference;
};

export function mentionQuery(
  text: string,
  caret: number,
  mentions: DraftMention[],
) {
  if (mentions.some((mention) => caret > mention.start && caret <= mention.end))
    return null;
  const match = /(?:^|\s)@([^@\n]{0,100})$/.exec(text.slice(0, caret));
  return match
    ? { start: caret - match[1].length - 1, end: caret, query: match[1] }
    : null;
}

/** Preserve untouched references through edits; editing a mention drops its binding. */
export function updateMentions(
  before: string,
  after: string,
  mentions: DraftMention[],
) {
  let start = 0;
  while (
    start < before.length &&
    start < after.length &&
    before[start] === after[start]
  )
    start++;
  let oldEnd = before.length;
  let newEnd = after.length;
  while (
    oldEnd > start &&
    newEnd > start &&
    before[oldEnd - 1] === after[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }
  return mentions.flatMap((mention) => {
    if (mention.end <= start) {
      // Extending a name turns it back into plain text, not a partial binding.
      if (
        mention.end === start &&
        newEnd > start &&
        /[\p{L}\p{N}_]/u.test(after[start])
      )
        return [];
      return [mention];
    }
    if (mention.start >= oldEnd)
      return [
        {
          ...mention,
          start: mention.start + newEnd - oldEnd,
          end: mention.end + newEnd - oldEnd,
        },
      ];
    return [];
  });
}

export function mentionBlocks(
  text: string,
  mentions: DraftMention[],
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let cursor = 0;
  for (const mention of [...mentions].sort((a, b) => a.start - b.start)) {
    if (
      mention.start < cursor ||
      text.slice(mention.start, mention.end) !== `@${mention.label}`
    )
      continue;
    if (mention.start > cursor)
      blocks.push({ type: "text", text: text.slice(cursor, mention.start) });
    blocks.push({
      type: "mention",
      reference: mention.reference,
      label: mention.label,
    });
    cursor = mention.end;
  }
  if (cursor < text.length)
    blocks.push({ type: "text", text: text.slice(cursor) });
  return blocks;
}

export function mentionSuggestions(records: SearchRecord[], query: string) {
  return records
    .filter((record) => matchesSearch(record.keywords, query))
    .sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
    )
    .slice(0, 12);
}
