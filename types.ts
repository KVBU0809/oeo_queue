
export interface Ticket {
  id: string;
  ticketNumber: string;
  name: string;
  applicationType: string;
  barangay: string;
  voterType: string;
  civilStatus: string;
  remarks: string; // SENIOR, PWD, PREGNANT
  queueStatus: 'W' | 'C' | 'S' | 'R' | 'A';
  timestamp: number;
  counter?: number;
}

export interface AppConfig {
  officeName: string;
  videoUrl: string;
  marqueeText: string;
}
