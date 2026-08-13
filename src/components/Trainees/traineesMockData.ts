/** Legacy mock mentors/trainees for modules not yet wired to `/api/trainees`. */

import type { Mentor, Trainee } from './traineesData';

export const mentors: Mentor[] = [
  { id: 'mentor-madhu', name: 'Madhu Sharma', email: 'madhu@midna.com', role: 'Admin · Mentor', region: 'Chennai HO' },
  { id: 'mentor-priya', name: 'Priya Nair', email: 'priya@midna.com', role: 'MLA Member · Mentor', region: 'Kerala' },
  { id: 'mentor-arjun', name: 'Arjun Dev', email: 'arjun@midna.com', role: 'Counsellor · Mentor', region: 'Coimbatore' },
  { id: 'mentor-rathina', name: 'Rathinaswamy A', email: 'rathina@midna.com', role: 'Senior Mentor', region: 'Tamil Nadu' },
  { id: 'mentor-riya', name: 'Riya Saravanan', email: 'riya@midna.com', role: 'MLA Member · Mentor', region: 'Chennai' },
  { id: 'mentor-suresh', name: 'Suresh Kumar', email: 'suresh@midna.com', role: 'Counsellor · Mentor', region: 'Bangalore' },
  { id: 'mentor-lakshmi', name: 'Lakshmi Venkat', email: 'lakshmi@midna.com', role: 'MLA Member · Mentor', region: 'Hyderabad' },
  { id: 'mentor-gopal', name: 'Gopal Menon', email: 'gopal@midna.com', role: 'Senior Mentor', region: 'Kerala' },
  { id: 'mentor-neha', name: 'Neha Gupta', email: 'neha@midna.com', role: 'Counsellor · Mentor', region: 'Mumbai' },
  { id: 'mentor-karthik', name: 'Karthik Reddy', email: 'karthik@midna.com', role: 'MLA Member · Mentor', region: 'Andhra Pradesh' },
];

export const trainees: Trainee[] = [
  { id: 't1', mentorId: 'mentor-madhu', name: 'Robert Fox', email: 'robert.fox@midna.com', doj: '12 Jan 2025', billingPercent: 10, scanCount: 42, doex: '—', status: 'Active', role: 'Trainee' },
  { id: 't2', mentorId: 'mentor-madhu', name: 'Esther Howard', email: 'esther.h@midna.com', doj: '03 Feb 2025', billingPercent: 15, scanCount: 18, doex: '—', status: 'Active', role: 'Trainee' },
  { id: 't3', mentorId: 'mentor-madhu', name: 'Rubia Richards', email: 'rubia.r@midna.com', doj: '18 Mar 2025', billingPercent: 20, scanCount: 7, doex: '15 Mar 2026', status: 'Inactive', role: 'Trainee' },
  { id: 't4', mentorId: 'mentor-madhu', name: 'Jane Cooper', email: 'jane.c@midna.com', doj: '22 Apr 2025', billingPercent: 25, scanCount: 55, doex: '—', status: 'Inactive', role: 'Trainee' },
  { id: 't5', mentorId: 'mentor-madhu', name: 'Devon Lane', email: 'devon.l@midna.com', doj: '05 May 2025', billingPercent: 30, scanCount: 31, doex: '—', status: 'Active', role: 'Junior Counsellor' },
  { id: 't6', mentorId: 'mentor-priya', name: 'Courtney Henry', email: 'courtney.h@midna.com', doj: '14 Jun 2025', billingPercent: 12, scanCount: 12, doex: '—', status: 'Active', role: 'Trainee' },
  { id: 't7', mentorId: 'mentor-priya', name: 'Cameron Williamson', email: 'cameron.w@midna.com', doj: '28 Jul 2025', billingPercent: 18, scanCount: 28, doex: '—', status: 'Inactive', role: 'Trainee' },
  { id: 't8', mentorId: 'mentor-priya', name: 'Leslie Alexander', email: 'leslie.a@midna.com', doj: '09 Aug 2025', billingPercent: 22, scanCount: 3, doex: '02 Feb 2026', status: 'Inactive', role: 'Trainee' },
  { id: 't9', mentorId: 'mentor-arjun', name: 'Ananya Krishnan', email: 'ananya.k@midna.com', doj: '20 May 2025', billingPercent: 15, scanCount: 9, doex: '—', status: 'Active', role: 'Trainee' },
  { id: 't10', mentorId: 'mentor-arjun', name: 'Kiran Mohan', email: 'kiran.m@midna.com', doj: '01 Jun 2025', billingPercent: 18, scanCount: 14, doex: '—', status: 'Active', role: 'Trainee' },
  { id: 't11', mentorId: 'mentor-rathina', name: 'Sneha Iyer', email: 'sneha.i@midna.com', doj: '11 Jul 2025', billingPercent: 16, scanCount: 6, doex: '—', status: 'Active', role: 'Trainee' },
];

export function traineeCountFor(mentorId: string): number {
  return trainees.filter((trainee) => trainee.mentorId === mentorId).length;
}
