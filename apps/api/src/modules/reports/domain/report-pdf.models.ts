export type ReportPdfInput = {
  clientId: string;
  timezoneOffset?: number;
  from: Date;
  to: Date;
};

export type ReportPdfFile = {
  data: Buffer;
  fileName: string;
};
