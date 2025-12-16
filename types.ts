
export interface ReportData {
  collegeName: string;
  collegeAddress: string;
  eventTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  department: string;
  academicYear: string;
  venue: string;
  participants: number | string;
  resourcePersonName: string;
  resourcePersonDetails: string;
  coordinatorName: string;
  briefInfo: string;
  objectives: string;
  benefits: string;
  expenditure: number | string;
  showExpenditure: boolean;
}

export interface FileUploads {
  headerBanner: File | null;
  collegeLogo: File | null;
  invitation: File | null;
  photos: File[];
  attendance: File[];
}

export interface AIGeneratedContent {
    brief: string;
    objectives: string;
    benefits: string;
}
