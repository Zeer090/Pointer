/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "divisi" | "mahasiswa";
  division_id: string | null;
  npm: string;
  jabatan?: string | null;
}

export interface Division {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export type ProgramStatus = "planning" | "ongoing" | "completed";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Program {
  id: string;
  title: string;
  description: string;
  event_date: string;
  status: ProgramStatus;
  approval_status: ApprovalStatus;
  division_id: string;
  created_by: string;
}

export interface Aspiration {
  id: string;
  student_name: string;
  category: "Akademik" | "Fasilitas" | "Lainnya" | "Beasiswa" | "Kegiatan";
  message: string;
  status: "pending" | "processing" | "completed";
  created_at: string;
}

export interface Talent {
  id: string;
  student_name: string;
  talent: string;
  achievement: string;
  certificate: string;
}

export interface Product {
  id: string;
  product_name: string;
  price: number;
  stock: number;
  image: string; // Emoji representing item
  sold?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  student_name: string;
  total: number;
  payment_status: "pending" | "success" | "failed";
  items_text: string;
  date: string;
}

export interface FinancialReport {
  id: string;
  title: string;
  income: number;
  expense: number;
  file: string;
  type: "income" | "expense";
  date: string;
}

export interface Attendance {
  id: string;
  event_name: string;
  participant_name: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alpa";
  npm: string;
  date?: string;
}

export interface Notulensi {
  id: string;
  title: string;
  date: string;
  author: string;
  summary: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
}

export interface ContentCalendar {
  id: string;
  post_title: string;
  platform: string;
  schedule_date: string;
  status: "draft" | "scheduled" | "published";
}

export interface ActivityLog {
  id: string;
  detail: string;
  time: string;
  color: "orange" | "green" | "blue" | "red" | "purple" | "yellow";
}

export interface Letter {
  id: string;
  num: string;
  subject: string;
  type: string;
  date: string;
  handler: string;
  file_name?: string | null;
}

export interface GalleryAlbum {
  id: string;
  emoji: string;
  title: string;
  link: string;
  count: number;
  size: string;
}

export interface FullDatabase {
  users: User[];
  divisions: Division[];
  programs: Program[];
  aspirations: Aspiration[];
  talents: Talent[];
  products: Product[];
  transactions: Transaction[];
  financial_reports: FinancialReport[];
  attendances: Attendance[];
  notulensi: Notulensi[];
  announcements: Announcement[];
  content_calendar: ContentCalendar[];
  activity_logs: ActivityLog[];
  letters?: Letter[];
  gallery_albums?: GalleryAlbum[];
}
