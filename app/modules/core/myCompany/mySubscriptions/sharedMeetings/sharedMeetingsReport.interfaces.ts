import { IGraphBase } from '../../../partnerReports/partnerReportInterfaces';

export interface IMeetingData {
  TimeBucketStart: string;
  NumOfMtgs: number;
}

export interface ISharedMeetingTimeFilter {
  label: string;
  value: number;
}

export interface ISharedMeetingData extends IGraphBase {
  maxMeetings: number;
  meetings: number;
}

export interface ISharedMeetingCSV {
  MeetingTopic: string;
  StartTime: string;
  EndTime: string;
  ConfId: string;
  HostName: string;
  SiteName: string;
}

export interface IMaxConcurrentDataCSV {
  SiteName: string;
  Month: string;
  From: string;
  To: string;
  ConcurrentMeetingsPeak: string;
}
