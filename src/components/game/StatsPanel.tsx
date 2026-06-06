import { useGameStore } from '../../store/gameStore';
import { ACHIEVEMENTS } from '../../constants/achievements';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}時間${m}分`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

export function StatsPanel() {
  const stats = useGameStore((s) => s.stats);
  const sessionStartTime = useGameStore((s) => s.sessionStartTime);

  const sessionSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
  const totalPlayTimeDisplay = stats.totalPlayTime + sessionSeconds;

  return (
    <div style={styles.container}>
      {/* 統計セクション */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>統計</h3>
        <div style={styles.statGrid}>
          <StatRow label="累計プレイ時間" value={formatTime(totalPlayTimeDisplay)} />
          <StatRow label="総クリック数" value={`${stats.totalClicks.toLocaleString()} 回`} />
          <StatRow label="最高Wave" value={`Wave ${stats.bestWave}`} />
          <StatRow label="転生回数" value={`${stats.rebirthCount} 回`} />
          <StatRow label="総撃破数" value={`${stats.totalKills.toLocaleString()} 体`} />
        </div>
      </section>

      {/* 実績セクション */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>
          実績{' '}
          <span style={styles.achievementCount}>
            {stats.unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </span>
        </h3>
        <div style={styles.achievementList}>
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = stats.unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                style={{
                  ...styles.achievementCard,
                  ...(unlocked ? styles.achievementUnlocked : styles.achievementLocked),
                }}
              >
                <span style={styles.achievementIcon}>
                  {unlocked ? ach.icon : '🔒'}
                </span>
                <div style={styles.achievementInfo}>
                  <div
                    style={{
                      ...styles.achievementName,
                      ...(unlocked ? styles.achievementNameUnlocked : {}),
                    }}
                  >
                    {ach.name}
                  </div>
                  <div style={styles.achievementDesc}>{ach.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

type StatRowProps = {
  label: string;
  value: string;
};

function StatRow({ label, value }: StatRowProps) {
  return (
    <div style={styles.statRow}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '4px 0',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#c19a6b',
    fontFamily: "'Crimson Text', serif",
    fontSize: 15,
    fontWeight: 700,
    margin: '0 0 10px 0',
    borderBottom: '1px solid rgba(193,154,107,0.3)',
    paddingBottom: 4,
  },
  achievementCount: {
    color: '#888',
    fontWeight: 400,
    fontSize: 13,
  },
  statGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
  },
  statValue: {
    color: '#e0d6c8',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Crimson Text', serif",
  },
  achievementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  achievementCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  achievementUnlocked: {
    background: 'rgba(241,196,15,0.08)',
    border: '1px solid rgba(241,196,15,0.3)',
  },
  achievementLocked: {
    background: 'rgba(255,255,255,0.02)',
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 20,
    minWidth: 28,
    textAlign: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#aaa',
    fontFamily: "'Crimson Text', serif",
  },
  achievementNameUnlocked: {
    color: '#f1c40f',
  },
  achievementDesc: {
    fontSize: 11,
    color: '#777',
    marginTop: 1,
  },
};
