// People naturally phrase searches as questions when typing or (especially)
// dictating — "where is my keys?", "where did I put my passport", "find my
// charger" — but the underlying matcher requires every word to appear in the
// saved item's text, so "where is my keys" fails to match an item literally
// named "keys" because it also has to contain "where", "is" and "my".
// This strips that filler so only the actual object being searched for is
// used for matching, while the raw query is still shown to the user as-is.

const FILLER_PREFIX_REGEX =
  /^(where\s+(is|are|was|were)|where\s+did\s+i\s+(put|leave|place|store)|where'?s|find|show\s+me|do\s+i\s+have|have\s+i\s+got|has\s+anyone\s+seen|have\s+you\s+seen|i\s+(can'?t\s+find|lost|need)|looking\s+for)\s+/i;

const POSSESSIVE_PREFIX_REGEX = /^(my|the|our|your|his|her|their|a|an)\s+/i;

export function cleanSearchQuery(raw: string): string {
  const original = raw.trim();
  let q = original;
  if (!q) return q;

  // Iteratively strip stacked filler + possessive prefixes, since natural
  // speech often stacks them: "where is my keys" -> "my keys" -> "keys".
  for (let i = 0; i < 4; i++) {
    const before = q;
    q = q.replace(FILLER_PREFIX_REGEX, "").trim();
    q = q.replace(POSSESSIVE_PREFIX_REGEX, "").trim();
    if (q === before) break;
  }

  q = q.replace(/[?!.]+$/g, "").trim();

  // If stripping left nothing (e.g. the whole query was just "where is"),
  // fall back to the original so the search still has something to work with.
  return q || original;
}
