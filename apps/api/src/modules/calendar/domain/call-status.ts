import type { CalendarEventEntity, CallStatus } from './calendar.repository.port';

export type PendingCallProposal = {
  clientId: string;
  clientName?: string;
  coachMembershipId: string;
  date: Date;
  id: string;
  proposedTime: string;
};

/** Las llamadas aceptadas salen confirmadas y los recordatorios antiguos quedan sin confirmar. */
export function withCallStatus(event: CalendarEventEntity): CalendarEventEntity {
  if (event.type === 'call') return { ...event, callStatus: 'accepted' };
  if (event.type === 'reminder') return { ...event, callStatus: 'unconfirmed' };
  return event;
}

/** Una propuesta pendiente se muestra como una llamada que aún no está en el calendario. */
export function pendingProposalAsEvent(proposal: PendingCallProposal): CalendarEventEntity {
  return {
    callStatus: 'pending' satisfies CallStatus,
    clientId: proposal.clientId,
    clientName: proposal.clientName,
    coachMembershipId: proposal.coachMembershipId,
    color: null,
    content: null,
    createdAt: proposal.date,
    date: proposal.date,
    id: proposal.id,
    originDate: null,
    planDayId: null,
    time: proposal.proposedTime,
    title: null,
    type: 'call',
    updatedAt: proposal.date,
  };
}
