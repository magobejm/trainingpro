/** The exercise label already has a default, so only the text can block sending. */
export function canSubmitFeedback(text: string): boolean {
  return text.trim().length > 0;
}
