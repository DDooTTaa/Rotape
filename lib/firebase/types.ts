export type Gender = "M" | "F";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface User {
  uid: string;
  name: string;
  gender: Gender;
  birthday: string;
  age: number;
  createdAt: Date;
  phone?: string;
  isAdmin: boolean;
}

export interface Application {
  uid: string;
  eventId?: string; // 행사 ID (선택사항, 행사별 지원 시 사용)
  age?: number; // 나이 (선택사항)
  height: number;
  job: string;
  intro: string;
  idealType: string;
  loveStyle: string;
  loveLanguage: string[];
  photos: string[];
  phone?: string; // 전화번호
  status: ApplicationStatus;
  createdAt: Date;
}

export interface Profile {
  uid: string;
  eventId: string;
  displayName: string;
  intro: string;
  job: string;
  loveLanguage: string[];
  photos: string[];
  qrCode: string;
}

export interface Event {
  eventId: string;
  title: string;
  date: Date;
  location: string;
  schedule: {
    intro?: string;
    part1?: string;
    part2?: string;
    break?: string;
  };
  maxParticipants: number;
  createdAt: Date;
}

export interface Round {
  eventId: string;
  roundNumber: number;
  participants: string[];
  startTime: Date;
  endTime?: Date;
}

export interface Like {
  eventId: string;
  uid: string;
  first: string;
  second: string;
  third: string;
  message: string;
  createdAt: Date;
}

export interface Match {
  eventId: string;
  userA: string;
  userB: string;
  score: number;
  createdAt: Date;
}

export interface Feedback {
  eventId: string;
  uid: string;
  answers: Record<string, any>;
  createdAt: Date;
}

export interface Notification {
  id: string;
  uid: string;
  type: "sms" | "web";
  message: string;
  createdAt: Date;
}

