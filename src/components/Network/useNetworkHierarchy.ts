import { useEffect, useState } from 'react';
import { getMentors, getMlasState, getNetworkAdmins, getTraineesState } from '../../api';
import type { MentorRowApi, NetworkAdminApi } from '../../api/types';
import { mapMlasState } from '../Mlas/mlasApiMapper';
import { mapTraineesState } from '../Trainees/traineesApiMapper';

export type MenteeType = 'Counselor' | 'MLA';

export type MenteeNode = { id: number; mentorId: number; name: string; email: string; type: MenteeType };

export type NetworkHierarchy = {
  admins: NetworkAdminApi[];
  mentors: MentorRowApi[];
  mentees: MenteeNode[];
  loading: boolean;
  error: string;
};

const EMPTY: NetworkHierarchy = { admins: [], mentors: [], mentees: [], loading: false, error: '' };

/** Admin → mentor → counselor / MLA tree for head-office pages. Pass `enabled=false` for other roles. */
export function useNetworkHierarchy(enabled: boolean): NetworkHierarchy {
  const [state, setState] = useState<NetworkHierarchy>({ ...EMPTY, loading: enabled });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([getNetworkAdmins(signal), getMentors(signal), getTraineesState(signal), getMlasState(signal)])
      .then(([admins, mentors, traineesState, mlasState]) => {
        const toNode = (type: MenteeType) => (row: { id: string; mentorId: string; name: string; email: string }) => ({
          id: Number(row.id),
          mentorId: Number(row.mentorId),
          name: row.name,
          email: row.email,
          type,
        });
        const mentees = [
          ...mapTraineesState(traineesState).trainees.map(toNode('Counselor')),
          ...mapMlasState(mlasState).mlas.map(toNode('MLA')),
        ].sort((a, b) => a.name.localeCompare(b.name));
        setState({ admins, mentors, mentees, loading: false, error: '' });
      })
      .catch(() => {
        if (!signal.aborted) setState({ ...EMPTY, error: 'Unable to load your network.' });
      });
    return () => controller.abort();
  }, [enabled]);

  return enabled ? state : EMPTY;
}
