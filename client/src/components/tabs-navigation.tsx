import React from "react";

interface TabsNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TabsNavigation({ activeTab, setActiveTab }: TabsNavigationProps) {
  const tabs = [
    { id: "shifts", label: "Shifts" },
    { id: "pay", label: "Pay Overview" },
    { id: "notes", label: "Notes" },
    { id: "analytics", label: "Analytics" },
    { id: "profile", label: "Profile" },
  ];
  
  return (
    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === tab.id
              ? "tab-active"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
