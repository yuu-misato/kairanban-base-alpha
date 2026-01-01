import React from 'react';
import { Kairanban, VolunteerMission, Community } from '../types';

interface ChokaiPanelProps {
  kairanbans: Kairanban[];
  missions: VolunteerMission[];
  onReadKairanban: (id: string, points: number) => void;
  onJoinMission: (id: string, points: number) => void;
  selectedAreas: string[];
  userRole?: 'resident' | 'business' | 'admin' | 'chokai_leader';
  onOpenCreateMission?: () => void;
  myCommunities: Community[];
  joinedMissionIds?: Set<string>;
  isLoading?: boolean;
}

const ChokaiPanel: React.FC<ChokaiPanelProps> = ({ kairanbans, missions, onReadKairanban, onJoinMission, selectedAreas, userRole, onOpenCreateMission, myCommunities, joinedMissionIds, isLoading }) => {
  // Area filter OR Community ID match
  const filteredKairanbans = kairanbans.filter(k =>
    selectedAreas.includes(k.area) ||
    (k.communityId && myCommunities.some(c => c.id === k.communityId))
  );

  const filteredMissions = missions.filter(m => selectedAreas.includes(m.area));

  const createCalendarUrl = (title: string, description: string, dateStr: string) => {
    // Simple parsing for "MM/DD HH:mm" or "YYYY-MM-DD"
    let startDate = new Date();
    let isValid = true;

    try {
      const currentYear = new Date().getFullYear();
      if (dateStr && dateStr.includes('/')) {
        const parts = dateStr.split(' ');
        const dateParts = parts[0].split('/');
        const timeParts = parts[1] ? parts[1].split(':') : ['00', '00'];

        const month = parseInt(dateParts[0]);
        const day = parseInt(dateParts[1]);
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1]);

        if (isNaN(month) || isNaN(day)) {
          isValid = false;
        } else {
          startDate.setFullYear(currentYear, month - 1, day);
          startDate.setHours(isNaN(hour) ? 0 : hour, isNaN(minute) ? 0 : minute, 0, 0);
        }
      } else {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          isValid = false;
        } else {
          startDate = d;
        }
      }
    } catch (e) {
      console.error("Date parse error", e);
      isValid = false;
    }

    if (!isValid || isNaN(startDate.getTime())) {
      return '#';
    }

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration by default

    const format = (d: Date) => {
      try {
        return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
      } catch {
        return '';
      }
    };

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&dates=${format(startDate)}/${format(endDate)}`;
  };

  // State for "Show More" functionality
  const [showAllKairanbans, setShowAllKairanbans] = React.useState(false);
  const [showAllMissions, setShowAllMissions] = React.useState(false);

  const kairanbanLimit = 3;
  // Missions display in a grid, so multiples of 2 are better.
  const missionLimit = 4;

  const displayKairanbans = showAllKairanbans ? filteredKairanbans : filteredKairanbans.slice(0, kairanbanLimit);
  const displayMissions = showAllMissions ? filteredMissions : filteredMissions.slice(0, missionLimit);

  // Restore local state to track processing IDs
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());

  const handleRead = async (id: string, points: number) => {
    if (processingIds.has(id)) return;
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await onReadKairanban(id, points);
    } finally {
      setTimeout(() => {
        setProcessingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold text-sm animate-pulse">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Kairanban Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">デジタル回覧板</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Neighborhood Circulars</p>
          </div>
        </div>

        <div className="space-y-4">
          {displayKairanbans.length > 0 ? (
            <>
              {displayKairanbans.map(k => (
                <div key={k.id} className={`bg-white border rounded-3xl p-6 transition-all ${k.isRead ? 'border-slate-100 opacity-80' : 'border-indigo-100 shadow-xl shadow-indigo-50 border-l-8 border-l-indigo-600'}`}>
                  {/* ... same card content ... */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{k.author}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(k.createdAt).toLocaleDateString()}</span>
                        {k.communityId && myCommunities.find(c => c.id === k.communityId) && (
                          <span className="text-[9px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded-lg">
                            <i className="fas fa-users mr-1"></i>
                            {myCommunities.find(c => c.id === k.communityId)?.name}
                          </span>
                        )}
                        {k.sentToLine && (
                          <span className="text-[9px] font-black text-[#06C755] bg-[#06C755]/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <i className="fab fa-line"></i> LINE通知済み
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-black text-slate-800 leading-tight">{k.title}</h4>
                    </div>
                    {!k.isRead && (
                      <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black animate-pulse whitespace-nowrap">
                        未読: +{k.points}pts
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium whitespace-pre-wrap">{k.content}</p>

                  {k.date && (
                    <div className="mb-4">
                      <a
                        href={createCalendarUrl(k.title, k.content, k.date)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        <i className="fab fa-google"></i> Googleカレンダーに追加
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    <div className="text-[10px] text-slate-400 font-bold">
                      <i className="fas fa-eye mr-1"></i> {k.readCount}人が確認済み
                    </div>
                    {!k.isRead ? (
                      <button
                        onClick={() => handleRead(k.id, k.points)}
                        disabled={processingIds.has(k.id)}
                        className={`bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center gap-2 ${processingIds.has(k.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {processingIds.has(k.id) && <i className="fas fa-spinner fa-spin"></i>}
                        {processingIds.has(k.id) ? '処理中...' : '内容を確認しました'}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-slate-300 text-white px-6 py-2 rounded-xl font-black text-xs cursor-not-allowed flex items-center gap-2 shadow-none"
                      >
                        <i className="fas fa-check"></i> 確認済み
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Show More Button */}
              {filteredKairanbans.length > kairanbanLimit && (
                <button
                  onClick={() => setShowAllKairanbans(!showAllKairanbans)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 group"
                >
                  <span className="text-xs">{showAllKairanbans ? '閉じる' : 'もっと見る'}</span>
                  <i className={`fas fa-chevron-down transition-transform ${showAllKairanbans ? 'rotate-180' : ''}`}></i>
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold italic">現在、回覧板はありません</p>
            </div>
          )}
        </div>
      </section >

      {/* Volunteer Missions Section */}
      < section >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
              <i className="fas fa-handshake-angle"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">地域お手伝いミッション</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Local Missions</p>
            </div>
          </div>
          {(userRole === 'admin' || userRole === 'chokai_leader') && onOpenCreateMission && (
            <button
              onClick={onOpenCreateMission}
              className="bg-rose-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> 追加
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayMissions.length > 0 ? (
            <>
              {displayMissions.map(m => (
                <div key={m.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group">
                  {/* ... same mission card content ... */}
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-black text-slate-800 leading-tight group-hover:text-rose-600 transition-colors">{m.title}</h4>
                    <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap">
                      +{m.points}pts
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-6 font-medium line-clamp-3">{m.description}</p>

                  {/* Date & Calendar */}
                  <div className="mb-6 flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-700"><i className="far fa-clock mr-1"></i> {m.date}</span>
                    <a
                      href={createCalendarUrl(m.title, m.description, m.date)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black text-slate-400 hover:text-[#4285F4] transition-colors flex items-center gap-1"
                    >
                      <i className="fab fa-google"></i> Calendar
                    </a>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>参加状況</span>
                      <span className="text-slate-700">{m.currentParticipants} / {m.maxParticipants}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full transition-all duration-1000" style={{ width: `${(m.currentParticipants / m.maxParticipants) * 100}%` }}></div>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinMission(m.id, m.points)}
                    disabled={m.currentParticipants >= m.maxParticipants || joinedMissionIds?.has(m.id)}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${joinedMissionIds?.has(m.id)
                      ? 'bg-emerald-500 text-white cursor-not-allowed'
                      : m.currentParticipants >= m.maxParticipants
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-rose-600'
                      }`}
                  >
                    {joinedMissionIds?.has(m.id) ? (
                      <>
                        <i className="fas fa-check"></i> 参加済み
                      </>
                    ) : m.currentParticipants >= m.maxParticipants ? (
                      '募集終了'
                    ) : (
                      'ミッションに参加する'
                    )}
                  </button>
                </div>
              ))}

              {/* Show More Button for Missions */}
              {filteredMissions.length > missionLimit && (
                <div className="md:col-span-2">
                  <button
                    onClick={() => setShowAllMissions(!showAllMissions)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 group"
                  >
                    <span className="text-xs">{showAllMissions ? '閉じる' : 'もっと見る'}</span>
                    <i className={`fas fa-chevron-down transition-transform ${showAllMissions ? 'rotate-180' : ''}`}></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="md:col-span-2 text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold italic">募集中のミッションはありません</p>
            </div>
          )}
        </div>
      </section >
    </div >
  );
};

export default ChokaiPanel;
