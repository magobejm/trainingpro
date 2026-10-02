export function buildMeetingRequestMessage(
  dateStr: string,
  translate: (key: string, options?: { date: string }) => string,
): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const formatted = Number.isNaN(date.getTime())
    ? dateStr
    : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', weekday: 'long' });
  return translate('client.calendar.detail.meetingRequestMessage', { date: formatted });
}
