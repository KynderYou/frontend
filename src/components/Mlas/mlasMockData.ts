/** Legacy mock MLAs for mentor-scoped view not yet on API. */

import { mentors } from '../Trainees/traineesMockData';
import type { Mla } from './mlasData';

export { mentors };

export const mlas: Mla[] = [
  { id: 'm1', mentorId: 'mentor-madhu', name: 'Anita Joseph', email: 'anita.j@midna.com', doj: '12 Mar 2025', billingPercent: 35, scanCount: 120, doex: '—', status: 'Active', role: 'MLA Member' },
  { id: 'm2', mentorId: 'mentor-madhu', name: 'Farhan Ali', email: 'farhan.a@midna.com', doj: '08 Jun 2025', billingPercent: 40, scanCount: 85, doex: '—', status: 'Active', role: 'MLA Member' },
  { id: 'm3', mentorId: 'mentor-madhu', name: 'Geetha Krishnan', email: 'geetha.k@midna.com', doj: '02 Jan 2025', billingPercent: 28, scanCount: 40, doex: '—', status: 'Inactive', role: 'MLA Member' },
  { id: 'm4', mentorId: 'mentor-madhu', name: 'Imran Khan', email: 'imran.k@midna.com', doj: '19 Nov 2024', billingPercent: 20, scanCount: 22, doex: '05 Dec 2025', status: 'Inactive', role: 'MLA Member' },
  { id: 'm5', mentorId: 'mentor-priya', name: 'Nisha Varghese', email: 'nisha.v@midna.com', doj: '14 Feb 2025', billingPercent: 45, scanCount: 156, doex: '—', status: 'Active', role: 'MLA Member' },
  { id: 'm6', mentorId: 'mentor-priya', name: 'Arun Thomas', email: 'arun.t@midna.com', doj: '30 Apr 2025', billingPercent: 38, scanCount: 98, doex: '—', status: 'Active', role: 'MLA Counsellor' },
  { id: 'm7', mentorId: 'mentor-priya', name: 'Sneha George', email: 'sneha.g@midna.com', doj: '11 Sep 2024', billingPercent: 22, scanCount: 31, doex: '—', status: 'Inactive', role: 'MLA Member' },
];

export function mlaCountFor(mentorId: string): number {
  return mlas.filter((mla) => mla.mentorId === mentorId).length;
}
