import { useState } from 'react';
import './TabGroup.scss';

interface Tab {
  key: string;
  label: string;
}

interface TabGroupProps {
  tabs: Tab[];
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
}

function TabGroup({ tabs, defaultActiveKey, onChange }: TabGroupProps) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey || tabs[0]?.key);

  const handleTabClick = (key: string) => {
    setActiveKey(key);
    onChange?.(key);
  };

  return (
    <div className="tab-group">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`tab-group__item ${activeKey === tab.key ? 'active' : ''}`}
          onClick={() => handleTabClick(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default TabGroup;
