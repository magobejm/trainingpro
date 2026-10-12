import type { QueryStatus } from '../data/classify-query-status';

export const FAILURE_KINDS = new Set<QueryStatus>(['forbidden', 'network', 'server', 'sessionExpired']);

export type AsyncStatusCopyInput = {
  emptyMessage?: string;
  emptyTitle: string;
  kind: Exclude<QueryStatus, 'ready'>;
  messageOverride?: string;
  titleOverride?: string;
};

type Copy = { action: string; message: string; title: string };

export function readCopy(props: AsyncStatusCopyInput, t: (key: string) => string): Copy {
  const base = readBaseCopy(props, t);
  if (!FAILURE_KINDS.has(props.kind)) return base;
  return { ...base, message: props.messageOverride ?? base.message, title: props.titleOverride ?? base.title };
}

function readBaseCopy(props: AsyncStatusCopyInput, t: (key: string) => string): Copy {
  if (props.kind === 'empty') {
    return { action: '', message: props.emptyMessage ?? '', title: props.emptyTitle };
  }
  if (props.kind === 'noResults') {
    return { action: '', message: t('coach.status.noResults.message'), title: t('coach.status.noResults.title') };
  }
  if (props.kind === 'sessionExpired') {
    return {
      action: t('coach.status.signIn'),
      message: t('auth.login.sessionExpired'),
      title: t('coach.status.sessionExpired.title'),
    };
  }
  return {
    action: t('coach.status.retry'),
    message: t(`coach.status.${props.kind}.message`),
    title: t(`coach.status.${props.kind}.title`),
  };
}
