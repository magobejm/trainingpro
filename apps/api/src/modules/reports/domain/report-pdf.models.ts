export type ReportPdfInput = {
  clientId: string;
  from: Date;
  to: Date;
};

export type ReportPdfFile = {
  data: Buffer;
  fileName: string;
};
