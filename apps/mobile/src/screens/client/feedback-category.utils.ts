import type { FeedbackCategory } from '../../data/hooks/useClientNotes';

/** The tag is mandatory: nothing is chosen by default and nothing can be sent without it. */
export function canSubmitFeedback(category: FeedbackCategory | null, text: string): boolean {
  return category !== null && text.trim().length > 0;
}
