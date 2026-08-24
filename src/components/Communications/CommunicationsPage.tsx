import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  createCommGroup,
  deleteCommGroup,
  getCommGroups,
  getCommMembers,
  getCommunicationsNotices,
  publishCommunication as publishCommunicationApi,
  replyToCommunication as replyToCommunicationApi,
  voteOnPoll as voteOnPollApi,
} from '../../api';
import {
  colors,
  radius,
  spacing,
  typography,
  severityTokens,
  type SeverityLevel,
} from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import {
  mapCommGroups,
  mapCommMembers,
  mapCommunication,
  mapCommunicationsList,
} from './communicationsApiMapper';
import {
  audienceLabel,
  pollTotalVotes,
  sortCommunicationReplies,
  type AudienceMode,
  type CommGroup,
  type CommMember,
  type Communication,
} from './communicationsData';

const theme = colors.light;

type CommunicationsPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  /** Open Sent tab on this notice (from dashboard Reply) */
  initialThreadId?: string | null;
  onThreadSelect?: (id: string | null) => void;
};

type TabId = 'compose' | 'groups' | 'sent';

export function CommunicationsPage({
  onOpenMobileMenu,
  onOpenProfile,
  initialThreadId = null,
  onThreadSelect,
}: CommunicationsPageProps) {
  const [groups, setGroups] = useState<CommGroup[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [members, setMembers] = useState<CommMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<TabId>(initialThreadId ? 'sent' : 'compose');
  const [selectedId, setSelectedId] = useState<string | null>(initialThreadId);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('everyone');
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [composeError, setComposeError] = useState('');
  const [composeNotice, setComposeNotice] = useState('');

  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [includeCabRequest, setIncludeCabRequest] = useState(false);
  const [cabScanId, setCabScanId] = useState('');

  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [groupError, setGroupError] = useState('');

  const [replyDraft, setReplyDraft] = useState('');
  const [replyError, setReplyError] = useState('');
  const [seenModalItem, setSeenModalItem] = useState<Communication | null>(null);

  const loadState = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [notices, groups, members] = await Promise.all([
        getCommunicationsNotices(signal),
        getCommGroups(signal),
        getCommMembers(signal),
      ]);
      if (signal?.aborted) return;
      setCommunications(mapCommunicationsList(notices));
      setGroups(mapCommGroups(groups));
      setMembers(mapCommMembers(members));
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load communications.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadState(controller.signal);
    return () => controller.abort();
  }, [loadState]);

  useEffect(() => {
    if (!initialThreadId) return;
    setTab('sent');
    setSelectedId(initialThreadId);
  }, [initialThreadId]);

  useEffect(() => {
    if (tab !== 'sent') return;
    if (selectedId && communications.some((item) => item.id === selectedId)) return;
    setSelectedId(communications[0]?.id ?? null);
  }, [tab, communications, selectedId]);

  const selected = useMemo(
    () => communications.find((item) => item.id === selectedId) ?? null,
    [communications, selectedId]
  );

  const filteredPeople = useMemo(() => {
    const q = peopleQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    );
  }, [peopleQuery, members]);

  const selectThread = (id: string) => {
    setSelectedId(id);
    onThreadSelect?.(id);
  };

  const togglePerson = (id: string) => {
    setSelectedPeople((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectedGroup = (id: string) => {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleGroupMember = (id: string) => {
    setGroupMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  };

  const addPollOption = () => {
    if (pollOptions.length >= 6) return;
    setPollOptions((prev) => [...prev, '']);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    setComposeNotice('');
    if (!title.trim() || !body.trim()) {
      setComposeError('Add a title and message before publishing.');
      return;
    }
    if (audienceMode === 'people' && selectedPeople.length === 0) {
      setComposeError('Select at least one person, or choose Everyone / groups.');
      return;
    }
    if (audienceMode === 'groups' && selectedGroupIds.length === 0) {
      setComposeError('Select at least one group, or create one first.');
      return;
    }
    if (includePoll) {
      const filled = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!pollQuestion.trim() || filled.length < 2) {
        setComposeError('Poll needs a question and at least 2 options.');
        return;
      }
    }
    if (includeCabRequest && !cabScanId.trim()) {
      setComposeError('Enter the scan ID for the CAB request notice.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await publishCommunicationApi({
        title,
        body,
        severity,
        audience_mode: audienceMode,
        recipient_ids: selectedPeople.map(Number),
        group_ids: selectedGroupIds.map(Number),
        poll_question: includePoll ? pollQuestion : null,
        poll_options: includePoll ? pollOptions : [],
        cab_scan_id: includeCabRequest ? cabScanId.trim() : null,
      });
      const mapped = mapCommunication(created);
      setCommunications((prev) => [mapped, ...prev]);

      setTitle('');
      setBody('');
      setSeverity('medium');
      setAudienceMode('everyone');
      setSelectedPeople([]);
      setSelectedGroupIds([]);
      setIncludePoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setIncludeCabRequest(false);
      setCabScanId('');
      setComposeError('');
      setComposeNotice('Published — it will show on the dashboard notice board.');
      setTab('sent');
      if (mapped) selectThread(mapped.id);
    } catch {
      setComposeError('Publish failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setGroupError('Enter a group name.');
      return;
    }
    if (groupMembers.length === 0) {
      setGroupError('Select at least one member for the group.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createCommGroup(groupName, groupMembers.map(Number));
      const mapped = mapCommGroups([created])[0];
      setGroups((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
      setGroupName('');
      setGroupMembers([]);
      setGroupError('');
      if (mapped) {
        setSelectedGroupIds((prev) => [...prev, mapped.id]);
        setComposeNotice(`Group “${mapped.name}” created. You can broadcast to it from Compose.`);
      }
    } catch {
      setGroupError('Could not create group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selected) return;
    setReplyError('');
    const text = replyDraft.trim();
    if (!text) {
      setReplyError('Write a reply before sending.');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await replyToCommunicationApi(Number(selected.id), text);
      const mapped = mapCommunication(updated);
      setCommunications((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setReplyDraft('');
    } catch {
      setReplyError('Reply failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const result = await voteOnPollApi(Number(selected.id), Number(optionId));
      setCommunications((prev) =>
        prev.map((item) =>
          item.id === String(result.message_id) && item.poll
            ? {
                ...item,
                poll: {
                  question: result.poll.question,
                  options: result.poll.options.map((option) => ({
                    id: String(option.id),
                    label: option.label,
                    votes: option.votes,
                  })),
                },
              }
            : item,
        ),
      );
    } catch {
      setReplyError('Vote failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setSubmitting(true);
    try {
      await deleteCommGroup(Number(groupId));
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      setSelectedGroupIds((prev) => prev.filter((id) => id !== groupId));
    } catch {
      setGroupError('Could not delete group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'compose', label: 'Compose' },
    { id: 'groups', label: 'Groups' },
    { id: 'sent', label: 'Sent' },
  ];

  return (
    <section className="page-section comm-page">
      <div className="page-header">
        <div className="page-title-block" style={{ minWidth: 0, flex: 1 }}>
          <h1
            className="page-title"
            style={{
              margin: 0,
              fontSize: typography.roles.pageTitle.fontSize,
              lineHeight: typography.roles.pageTitle.lineHeight,
              fontWeight: typography.roles.pageTitle.fontWeight,
              letterSpacing: typography.roles.pageTitle.letterSpacing,
              color: theme['text-primary'],
            }}
          >
            Communications
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Broadcast notices, optional polls, and reply threads — not a live chat.
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      <div className="comm-tabs" role="tablist" aria-label="Communications sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`comm-tab${tab === item.id ? ' is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loadError && (
        <p role="alert" style={{ margin: `0 0 ${spacing[4]}`, color: theme.error, fontSize: 14 }}>
          {loadError}
        </p>
      )}

      {composeNotice && (
        <p
          role="status"
          style={{
            margin: `0 0 ${spacing[4]}`,
            padding: '10px 14px',
            borderRadius: radius.md,
            background: theme['success-bg'],
            color: theme.success,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {composeNotice}
        </p>
      )}

      {tab === 'compose' && (
        <div className="comm-compose-grid">
          <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>New notice</h2>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme['text-secondary'] }}>Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Holiday announcement"
                style={fieldStyle}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme['text-secondary'] }}>Message</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the notice members will see on their dashboard…"
                rows={5}
                style={textareaStyle}
              />
            </label>

            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme['text-secondary'] }}>Priority</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {(['low', 'medium', 'high'] as SeverityLevel[]).map((level) => {
                  const tone = severityTokens[level];
                  const selected = severity === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        padding: '7px 14px',
                        borderRadius: radius.pill,
                        background: selected ? tone.bg : theme['bg-muted'],
                        color: selected ? tone.text : theme['text-secondary'],
                        boxShadow: selected ? `inset 0 0 0 1px ${tone.icon}` : 'none',
                      }}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                borderTop: `1px solid ${theme.divider}`,
                paddingTop: spacing[4],
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[3],
              }}
            >
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeCabRequest}
                  onChange={(e) => setIncludeCabRequest(e.target.checked)}
                  style={{ accentColor: theme.primary, width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: theme['text-primary'] }}>
                  CAB request notice (notify admin to upload audio)
                </span>
              </label>

              {includeCabRequest && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: theme['text-secondary'] }}>Scan ID</span>
                  <input
                    value={cabScanId}
                    onChange={(e) => setCabScanId(e.target.value.toUpperCase())}
                    placeholder="e.g. S42701"
                    style={fieldStyle}
                  />
                </label>
              )}

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includePoll}
                  onChange={(e) => setIncludePoll(e.target.checked)}
                  style={{ accentColor: theme.primary, width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: theme['text-primary'] }}>
                  Add a poll to this notice
                </span>
              </label>

              {includePoll && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    padding: 14,
                    borderRadius: radius.md,
                    background: theme['bg-muted'],
                  }}
                >
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme['text-secondary'] }}>Poll question</span>
                    <input
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="e.g. Preferred training slot?"
                      style={fieldStyle}
                    />
                  </label>
                  {pollOptions.map((option, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        style={{ ...fieldStyle, flex: 1 }}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          className="btn-icon"
                          aria-label={`Remove option ${index + 1}`}
                          onClick={() => removePollOption(index)}
                          style={{ width: 32, height: 32, flexShrink: 0 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      className="btn-pill-secondary"
                      style={{ height: 32, fontSize: 12, padding: '6px 12px', alignSelf: 'flex-start' }}
                      onClick={addPollOption}
                    >
                      + Add option
                    </button>
                  )}
                </div>
              )}
            </div>

            {composeError && (
              <p role="alert" style={{ margin: 0, fontSize: 13, color: theme.error }}>
                {composeError}
              </p>
            )}

            <div className="comm-compose-actions" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn-pill-secondary"
                style={{ height: 36, fontSize: 13, padding: '8px 14px' }}
                onClick={() => {
                  setTitle('');
                  setBody('');
                  setComposeError('');
                  setIncludePoll(false);
                  setPollQuestion('');
                  setPollOptions(['', '']);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn-pill-primary"
                style={{ height: 36, fontSize: 13, padding: '8px 16px' }}
                onClick={handlePublish}
                disabled={submitting}
              >
                {submitting ? 'Publishing…' : 'Publish notice'}
              </button>
            </div>
          </div>

          <AudiencePanel
            audienceMode={audienceMode}
            setAudienceMode={setAudienceMode}
            filteredPeople={filteredPeople}
            peopleQuery={peopleQuery}
            setPeopleQuery={setPeopleQuery}
            selectedPeople={selectedPeople}
            togglePerson={togglePerson}
            groups={groups}
            selectedGroupIds={selectedGroupIds}
            toggleSelectedGroup={toggleSelectedGroup}
          />
        </div>
      )}

      {tab === 'groups' && (
        <div className="comm-groups-layout">
          <div className="dash-card comm-groups-card comm-groups-form">
            <div className="comm-groups-card-head">
              <h2 className="comm-groups-card-title">Create group</h2>
              <p className="comm-groups-card-subtitle">Name the group and pick who belongs in it.</p>
            </div>
            <div className="comm-groups-form-body">
              <label className="comm-groups-field">
                <span className="comm-groups-label">Group name</span>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Kerala MLAs"
                  className="comm-groups-input"
                />
              </label>
              <div className="comm-groups-field">
                <span className="comm-groups-label">Members</span>
                <div className="comm-groups-members">
                  {members.map((member) => {
                    const checked = groupMembers.includes(member.id);
                    return (
                      <label
                        key={member.id}
                        className={`comm-groups-member${checked ? ' is-checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGroupMember(member.id)}
                        />
                        <span className="comm-groups-member-name">{member.name}</span>
                        <span className="comm-groups-member-role">{member.role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {groupError && (
                <p role="alert" className="comm-groups-error">
                  {groupError}
                </p>
              )}
            </div>
            <div className="comm-groups-form-foot">
              <button type="button" className="btn-pill-secondary comm-groups-save" onClick={handleCreateGroup} disabled={submitting}>
                {submitting ? 'Saving…' : 'Save group'}
              </button>
            </div>
          </div>

          <div className="dash-card comm-groups-card comm-groups-saved">
            <div className="comm-groups-card-head">
              <h2 className="comm-groups-card-title">Saved groups</h2>
              <p className="comm-groups-card-subtitle">Reuse recipient lists for broadcasts.</p>
            </div>
            {groups.length === 0 ? (
              <EmptyState title="No groups yet" description="Create a group to reuse recipient lists." compact />
            ) : (
              <ul className="comm-groups-list">
                {groups.map((group) => (
                  <li key={group.id} className="comm-groups-item">
                    <div className="comm-groups-item-info">
                      <div className="comm-groups-item-name">{group.name}</div>
                      <div className="comm-groups-item-count">
                        {group.memberIds.length} member{group.memberIds.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-pill-secondary comm-groups-delete"
                      onClick={() => handleDeleteGroup(group.id)}
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'sent' && (
        <div className="comm-sent-layout">
          <div className="dash-card comm-sent-list" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: `${spacing[5]} ${spacing[6]}`, borderBottom: `1px solid ${theme.divider}` }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>Sent notices</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>
                {communications.length} broadcast{communications.length === 1 ? '' : 's'}
              </p>
            </div>
            {loading ? (
              <EmptyState title="Loading notices…" compact />
            ) : communications.length === 0 ? (
              <EmptyState title="Nothing sent yet" description="Published notices will appear here." compact />
            ) : (
              <ul className="comm-sent-scroll" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {communications.map((item) => {
                  const active = item.id === selectedId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`comm-sent-item${active ? ' is-active' : ''}`}
                        onClick={() => selectThread(item.id)}
                      >
                        <div className="comm-sent-item-head">
                          <span className="comm-sent-item-title">{item.title}</span>
                          <SeverityPill severity={item.severity} />
                        </div>
                        <div className="comm-sent-item-meta">
                          <span>{item.createdAt}</span>
                          <span className="comm-sent-item-dot" aria-hidden="true">
                            ·
                          </span>
                          <span>{audienceLabel(item)}</span>
                          {item.poll && <span className="comm-meta-pill">Poll</span>}
                          {item.replies.length > 0 && (
                            <span className="comm-meta-pill comm-meta-pill--muted">
                              {item.replies.length} repl{item.replies.length === 1 ? 'y' : 'ies'}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="dash-card comm-thread-panel">
            {!selected ? (
              <p style={{ padding: spacing[8], margin: 0, textAlign: 'center', color: theme['text-muted'] }}>
                Select a sent notice to open its thread.
              </p>
            ) : (
              <ThreadPanel
                item={selected}
                replyDraft={replyDraft}
                replyError={replyError}
                onReplyDraftChange={setReplyDraft}
                onReply={handleReply}
                onVote={handleVote}
                onOpenSeenBy={() => setSeenModalItem(selected)}
              />
            )}
          </div>
        </div>
      )}

      {seenModalItem && (
        <SeenByModal item={seenModalItem} onClose={() => setSeenModalItem(null)} />
      )}
    </section>
  );
}

function AudiencePanel({
  audienceMode,
  setAudienceMode,
  filteredPeople,
  peopleQuery,
  setPeopleQuery,
  selectedPeople,
  togglePerson,
  groups,
  selectedGroupIds,
  toggleSelectedGroup,
}: {
  audienceMode: AudienceMode;
  setAudienceMode: (mode: AudienceMode) => void;
  filteredPeople: CommMember[];
  peopleQuery: string;
  setPeopleQuery: (value: string) => void;
  selectedPeople: string[];
  togglePerson: (id: string) => void;
  groups: CommGroup[];
  selectedGroupIds: string[];
  toggleSelectedGroup: (id: string) => void;
}) {
  return (
    <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>Who receives this?</h2>
      <div className="comm-audience-options">
        {(
          [
            { id: 'everyone', label: 'Everyone' },
            { id: 'people', label: 'Selected people' },
            { id: 'groups', label: 'Selected groups' },
          ] as const
        ).map((option) => (
          <label
            key={option.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: radius.md,
              background: audienceMode === option.id ? theme['primary-soft'] : theme['bg-muted'],
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: theme['text-primary'],
            }}
          >
            <input
              type="radio"
              name="audience"
              checked={audienceMode === option.id}
              onChange={() => setAudienceMode(option.id)}
              style={{ accentColor: theme.primary }}
            />
            {option.label}
          </label>
        ))}
      </div>

      {audienceMode === 'people' && (
        <div>
          <input
            value={peopleQuery}
            onChange={(e) => setPeopleQuery(e.target.value)}
            placeholder="Search people"
            style={{ ...fieldStyle, width: '100%', marginBottom: 8 }}
          />
          <div className="comm-card-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredPeople.map((member) => {
              const checked = selectedPeople.includes(member.id);
              return (
                <label
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: radius.md,
                    background: checked ? theme['primary-soft'] : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePerson(member.id)}
                    style={{ accentColor: theme.primary }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: theme['text-primary'] }}>{member.name}</span>
                  <span style={{ fontSize: 11, color: theme['text-muted'], marginLeft: 'auto' }}>{member.role}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {audienceMode === 'groups' && (
        <div className="comm-card-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {groups.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: theme['text-muted'] }}>Create a group first.</p>
          ) : (
            groups.map((group) => {
              const checked = selectedGroupIds.includes(group.id);
              return (
                <label
                  key={group.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: radius.md,
                    background: checked ? theme['primary-soft'] : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelectedGroup(group.id)}
                    style={{ accentColor: theme.primary }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: theme['text-primary'] }}>{group.name}</span>
                  <span style={{ fontSize: 11, color: theme['text-muted'], marginLeft: 'auto' }}>
                    {group.memberIds.length}
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ThreadPanel({
  item,
  replyDraft,
  replyError,
  onReplyDraftChange,
  onReply,
  onVote,
  onOpenSeenBy,
}: {
  item: Communication;
  replyDraft: string;
  replyError: string;
  onReplyDraftChange: (value: string) => void;
  onReply: () => void;
  onVote: (optionId: string) => void;
  onOpenSeenBy: () => void;
}) {
  const totalVotes = pollTotalVotes(item.poll);
  const replies = sortCommunicationReplies(item.replies);

  return (
    <div className="comm-thread-shell">
      <div className="comm-thread-head">
        <div className="comm-thread-title-row">
          <h2 className="comm-thread-title">{item.title}</h2>
          <SeverityPill severity={item.severity} />
        </div>
        <p className="comm-thread-submeta">
          <span>{item.author}</span>
          <span className="comm-sent-item-dot" aria-hidden="true">
            ·
          </span>
          <span>{item.createdAt}</span>
          <span className="comm-sent-item-dot" aria-hidden="true">
            ·
          </span>
          <span>{audienceLabel(item)}</span>
          <span className="comm-sent-item-dot" aria-hidden="true">
            ·
          </span>
          {item.seenCount > 0 ? (
            <button type="button" className="comm-seen-link" onClick={onOpenSeenBy}>
              Seen {item.seenCount}
            </button>
          ) : (
            <span>Seen 0</span>
          )}
        </p>
        <p className="comm-thread-body">{item.body}</p>
      </div>

      <div className="comm-thread-scroll">
        {item.poll && (
          <div className="comm-poll-card">
            <p className="comm-poll-question">
              {item.poll.question}
              <span className="comm-poll-meta">
                · {totalVotes} vote{totalVotes === 1 ? '' : 's'} · click an option to vote
              </span>
            </p>
            <div className="comm-poll-options">
              {item.poll.options.map((option) => {
                const pct = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="comm-poll-option"
                    onClick={() => onVote(option.id)}
                  >
                    <div className="comm-poll-option-head">
                      <span className="comm-poll-option-label">{option.label}</span>
                      <span className="comm-poll-option-stat">
                        {option.votes} · {pct}%
                      </span>
                    </div>
                    <span className="comm-poll-bar" aria-hidden="true">
                      <span className="comm-poll-bar-fill" style={{ width: `${pct}%` }} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <h3 className="comm-thread-section-title">
          Thread · {item.replies.length} repl{item.replies.length === 1 ? 'y' : 'ies'}
        </h3>

        {replies.length === 0 ? (
          <p className="comm-thread-empty">No replies yet. Be the first to respond.</p>
        ) : (
          <ul className="comm-reply-list">
            {replies.map((reply) => (
              <li key={reply.id} className="comm-reply-item">
                <span className="comm-reply-avatar" aria-hidden="true">
                  {reply.authorInitials}
                </span>
                <div className="comm-reply-content">
                  <div className="comm-reply-meta">
                    <span className="comm-reply-author">{reply.author}</span>
                    <span className="comm-reply-time">{reply.createdAt}</span>
                  </div>
                  <p className="comm-reply-body">{reply.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="comm-reply-compose">
        <div className="comm-reply-bar">
          <textarea
            id={`reply-${item.id}`}
            className="comm-reply-input"
            value={replyDraft}
            onChange={(e) => onReplyDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onReply();
              }
            }}
            placeholder="Write a reply…"
            rows={1}
            aria-label="Write a reply"
          />
          <button
            type="button"
            className="comm-reply-send-btn"
            aria-label="Send reply"
            onClick={onReply}
            disabled={!replyDraft.trim()}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M22 2 11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m22 2-7 20-4-9-9-4z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {replyError ? (
          <p role="alert" className="comm-reply-error">
            {replyError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SeenByModal({ item, onClose }: { item: Communication; onClose: () => void }) {
  const viewers = [...item.viewers].sort((a, b) => b.seenAt.localeCompare(a.seenAt));

  return (
    <CommOverlay
      title={`Seen by ${item.seenCount}`}
      subtitle={item.title}
      onClose={onClose}
    >
      {viewers.length === 0 ? (
        <p className="comm-seen-empty">No one has viewed this notice yet.</p>
      ) : (
        <ul className="comm-seen-list">
          {viewers.map((viewer) => (
            <li key={viewer.id} className="comm-seen-row">
              <span className="comm-seen-avatar" aria-hidden="true">
                {viewer.initials}
              </span>
              <div className="comm-seen-info">
                <span className="comm-seen-name">{viewer.name}</span>
                <span className="comm-seen-dot" aria-hidden="true">
                  ·
                </span>
                <span className="comm-seen-role">{viewer.role}</span>
              </div>
              <time className="comm-seen-time">{viewer.seenAt}</time>
            </li>
          ))}
        </ul>
      )}
    </CommOverlay>
  );
}

function SeverityPill({ severity }: { severity: SeverityLevel }) {
  const tone = severityTokens[severity];
  return (
    <span className="comm-severity-pill" style={{ color: tone.text, background: tone.bg }}>
      {severity}
    </span>
  );
}

function CommOverlay({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mis-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="mis-overlay-backdrop" aria-label="Close" onClick={onClose} />
      <div className="mis-overlay-panel dash-card">
        <div className="mis-overlay-head">
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>{title}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-secondary'] }}>{subtitle}</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose} style={{ width: 32, height: 32 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="mis-overlay-body">{children}</div>
      </div>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  height: 40,
  borderRadius: radius.md,
  border: `1px solid ${theme.divider}`,
  background: theme['bg-surface'],
  color: theme['text-primary'],
  fontSize: 14,
  padding: '0 12px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const textareaStyle: CSSProperties = {
  borderRadius: radius.md,
  border: `1px solid ${theme.divider}`,
  background: theme['bg-surface'],
  color: theme['text-primary'],
  fontSize: 14,
  padding: 12,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%',
  resize: 'vertical',
  minHeight: 100,
  lineHeight: 1.5,
};
