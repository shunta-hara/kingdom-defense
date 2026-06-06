import { useState } from 'react';
import { useGameStore, selectTotalDps } from './store/gameStore';
import { BattleField } from './components/game/BattleField';
import { UnitPanel } from './components/game/UnitPanel';
import { SkillPanel } from './components/game/SkillPanel';
import { ProphecyPanel } from './components/game/ProphecyPanel';
import { StatsPanel } from './components/game/StatsPanel';
import { RebirthModal } from './components/game/RebirthModal';
import { SaveButton } from './components/ui/SaveButton';
import { ResetModal } from './components/ui/ResetModal';
import { MuteButton } from './components/ui/MuteButton';
import { SettingsModal } from './components/ui/SettingsModal';
import { FadeText } from './components/ui/FadeText';
import { Toast } from './components/ui/Toast';
import { useGameLoop } from './hooks/useGameLoop';
import { useAutoSave } from './hooks/useAutoSave';
import { useAudio } from './hooks/useAudio';
import type { ActiveTab } from './types/game';
import './styles/app-layout.css';

// ---- ResourceBadge UI Component ----

type ResourceBadgeProps = {
  icon: string;
  value: string | number;
  label: string;
  color: string;
};

function ResourceBadge({ icon, value, label, color }: ResourceBadgeProps) {
  return (
    <div className="res-badge">
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ color, fontWeight: 700, fontFamily: "'Crimson Text', serif", fontSize: 16 }}>
        {value}
      </span>
      {label && <span style={{ color: '#888', fontSize: 11 }}>{label}</span>}
    </div>
  );
}

// ---- Tab definitions ----

const PANEL_TABS: { id: ActiveTab; label: string }[] = [
  { id: 'units', label: '兵種' },
  { id: 'skills', label: 'スキル' },
  { id: 'prophecy', label: '予知夢' },
  { id: 'stats', label: '統計' },
];

type MobileView = 'battlefield' | 'panel';

// ---- App ----

function App() {
  useGameLoop();
  useAutoSave();
  useAudio();

  const gold = useGameStore((s) => s.gold);
  const fragments = useGameStore((s) => s.fragments);
  const wave = useGameStore((s) => s.wave);
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const totalDps = useGameStore(selectTotalDps);
  const resetSave = useGameStore((s) => s.resetSave);

  const [showResetModal, setShowResetModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('battlefield');

  return (
    <div className="app-root">
      {/* Background particles */}
      <div className="bg-particles">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${(i * 17 + 3) % 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${4 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-title">
          <span className="crown-icon">👑</span>
          <span>王都防衛戦記</span>
          <span className="header-sub">〜予知夢の戦記〜</span>
        </div>
        <div className="header-resources">
          <ResourceBadge icon="🪙" value={Math.floor(gold)} label="金貨" color="#f1c40f" />
          <ResourceBadge icon="🔮" value={fragments} label="予知夢の欠片" color="#9b59b6" />
          <ResourceBadge icon="⚔️" value={`Wave ${wave}`} label="" color="#e74c3c" />
          <ResourceBadge icon="⚡" value={totalDps.toFixed(1)} label="DPS" color="#3498db" />
          <MuteButton />
          <SaveButton />
          <button
            className="reset-button"
            onClick={() => setShowSettingsModal(true)}
            aria-label="設定を開く"
            title="設定"
          >
            ⚙️
          </button>
          <button
            className="reset-button"
            onClick={() => setShowResetModal(true)}
            aria-label="データリセット"
          >
            リセット
          </button>
        </div>
      </header>

      {/* Mobile view tabs (hidden on desktop) */}
      <div className="mobile-view-tabs" role="tablist" aria-label="表示切り替え">
        <button
          className={`mobile-view-tab${mobileView === 'battlefield' ? ' mobile-view-tab--active' : ''}`}
          onClick={() => setMobileView('battlefield')}
          role="tab"
          aria-selected={mobileView === 'battlefield'}
          aria-label="戦場を表示"
        >
          ⚔️ 戦場
        </button>
        <button
          className={`mobile-view-tab${mobileView === 'panel' ? ' mobile-view-tab--active' : ''}`}
          onClick={() => setMobileView('panel')}
          role="tab"
          aria-selected={mobileView === 'panel'}
          aria-label="兵士パネルを表示"
        >
          🛡️ 兵士
        </button>
      </div>

      {/* Main Layout */}
      <div className="app-main">
        {/* Left: Battle Field */}
        <div className={`main-battlefield${mobileView === 'battlefield' ? ' mobile-visible' : ' mobile-hidden'}`}>
          <BattleField />
        </div>

        {/* Right: Panel */}
        <div className={`main-panel${mobileView === 'panel' ? ' mobile-visible' : ' mobile-hidden'}`}>
          {/* Panel Tabs */}
          <div className="panel-tabs">
            {PANEL_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`panel-tab${activeTab === tab.id ? ' panel-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-label={`${tab.label}タブ`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="panel-content">
            {activeTab === 'units' && <UnitPanel />}
            {activeTab === 'skills' && <SkillPanel />}
            {activeTab === 'prophecy' && <ProphecyPanel />}
            {activeTab === 'stats' && <StatsPanel />}
          </div>
        </div>
      </div>

      {/* Rebirth Modal */}
      <RebirthModal />

      {/* Rebirth Flavor Text */}
      <FadeText />

      {/* Toast Notifications */}
      <Toast />

      {/* Reset Modal */}
      <ResetModal
        isOpen={showResetModal}
        onConfirm={() => {
          resetSave();
          setShowResetModal(false);
        }}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}

export default App;
