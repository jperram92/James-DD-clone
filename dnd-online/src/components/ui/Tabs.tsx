import { ReactNode, useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;
  className?: string;
}

/**
 * Tabs component for tabbed content
 * @param props Component props
 * @returns Tabs component
 */
const Tabs = ({
  tabs,
  defaultTabId,
  onChange,
  variant = 'default',
  fullWidth = false,
  className = '',
}: TabsProps) => {
  // Set default active tab
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : '')
  );

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  // Get active tab content
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Generate class names
  const tabsClass = `tabs tabs-${variant} ${
    fullWidth ? 'tabs-full-width' : ''
  } ${className}`;

  return (
    <div className={tabsClass}>
      <div className="tabs-header" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab ${activeTabId === tab.id ? 'tab-active' : ''}`}
            role="tab"
            aria-selected={activeTabId === tab.id ? "true" : "false"}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            type="button"
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tabs-content">
        {activeTab && (
          <div
            id={`tabpanel-${activeTab.id}`}
            className="tab-panel"
            role="tabpanel"
            aria-labelledby={`tab-${activeTab.id}`}
          >
            {activeTab.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;
