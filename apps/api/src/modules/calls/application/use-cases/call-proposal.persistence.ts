import { ConflictException } from '@nestjs/common';
import type { CallProposal, Prisma } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { CHAT_RETENTION_DAYS } from '../../../chat/domain/chat.constants';
import type { CallParty } from '../../domain/call-proposal';
export const CALL_THREAD_INCLUDE = {
  client: { select: { archivedAt: true, coachMembershipId: true, email: true, organizationId: true } },
  coachMembership: {
    select: { archivedAt: true, isActive: true, organizationId: true, role: true, user: { select: { email: true } } },
  },
} as const;
export function callMessageExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + CHAT_RETENTION_DAYS);
  return expiresAt;
}
export async function postCallMessage(
  tx: Prisma.TransactionClient,
  context: AuthContext,
  proposal: Pick<CallProposal, 'id' | 'threadId'>,
  party: CallParty,
  text: string,
): Promise<void> {
  await tx.chatMessage.create({
    data: {
      callProposalId: proposal.id,
      expiresAt: callMessageExpiry(),
      senderRole: party,
      senderSubject: context.subject,
      text,
      threadId: proposal.threadId,
    },
  });
  await tx.chatThread.update({ where: { id: proposal.threadId }, data: { updatedAt: new Date() } });
}
/** La condición impide que una respuesta concurrente acepte una convocatoria obsoleta. */
export async function claimCallProposal(
  tx: Prisma.TransactionClient,
  proposal: CallProposal,
  status: 'accepted' | 'cancelled',
): Promise<void> {
  const result = await tx.callProposal.updateMany({
    where: {
      id: proposal.id,
      status: proposal.status,
      date: proposal.date,
      proposedTime: proposal.proposedTime,
      lastProposedBy: proposal.lastProposedBy,
    },
    data: { status },
  });
  if (result.count !== 1) throw new ConflictException('Call proposal has changed; refresh before responding');
}
export async function cancelCallProposal(
  tx: Prisma.TransactionClient,
  context: AuthContext,
  proposal: CallProposal,
  party: CallParty,
  reason = '',
): Promise<void> {
  await claimCallProposal(tx, proposal, 'cancelled');
  if (proposal.calendarEventId)
    await tx.calendarEvent.updateMany({
      where: { id: proposal.calendarEventId, coachMembershipId: proposal.coachMembershipId, archivedAt: null },
      data: { archivedAt: new Date() },
    });
  const date = proposal.date.toISOString().slice(0, 10);
  await postCallMessage(
    tx,
    context,
    proposal,
    party,
    'Convocatoria del ' + date + ' a las ' + proposal.proposedTime + ' anulada.' + reason,
  );
}
export async function replaceCallProposal(
  tx: Prisma.TransactionClient,
  context: AuthContext,
  proposal: CallProposal,
  party: CallParty,
  input: { date?: string; time?: string },
) {
  await cancelCallProposal(tx, context, proposal, party, ' Se ha enviado una nueva convocatoria con el cambio.');
  return tx.callProposal.create({
    data: {
      clientId: proposal.clientId,
      coachMembershipId: proposal.coachMembershipId,
      date: input.date ? new Date(input.date) : proposal.date,
      initiatedBy: party,
      lastProposedBy: party,
      proposedTime: input.time ?? proposal.proposedTime,
      threadId: proposal.threadId,
      messages: {
        create: {
          expiresAt: callMessageExpiry(),
          senderRole: party,
          senderSubject: context.subject,
          threadId: proposal.threadId,
        },
      },
    },
  });
}
