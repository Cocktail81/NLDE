type ReportTab = 'daily' | 'history' | 'customer' | 'daterange'

interface ReportTabsProps {
  activeTab: ReportTab
  onTabChange: (tab: ReportTab) => void
}

export default function ReportTabs({ activeTab, onTabChange }: ReportTabsProps) {
  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'daily', label: 'Daily Summary' },
    { id: 'history', label: 'Change History' },
    { id: 'customer', label: 'Customer-wise' },
    { id: 'daterange', label: 'Date Range' },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-6 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}