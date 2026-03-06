export const metricStyles = {
  metricCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe7f5',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: 160,
    padding: 10,
  },
  compactMetricRow: {
    gap: 4,
  },
  compactRowPair: {
    flexDirection: 'row',
    gap: 10,
  },
  compactMetricLabelWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactMetricHalf: {
    flex: 1,
    minWidth: 140,
  },
  compactMetricInput: {
    minHeight: 32,
  },
  compactMetricValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  metricHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#0f172a',
    fontSize: 19,
    fontWeight: '800',
  },
  metricValueLarge: {
    fontSize: 32,
    lineHeight: 34,
  },
  metricBigValue: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 32,
  },
  metricDateValue: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  metricInput: {
    minHeight: 34,
  },
  metricInputLarge: {
    fontSize: 19,
    fontWeight: '700',
    minHeight: 40,
  },
  pencilButton: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderColor: '#dbe7f5',
    borderRadius: 8,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  pencilLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
} as const;
