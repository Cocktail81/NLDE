'use client'

interface ActionButtonsProps {
  onPrint: () => void
  onExport: () => void
  onPdf?: () => void
}

export default function ActionButtons({ onPrint, onExport, onPdf }: ActionButtonsProps) {
  return (
    <div className="p-4 border-t flex justify-center gap-3 print:hidden bg-white">
      <button
        onClick={onPrint}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        🖨️ Print
      </button>
      <button
        onClick={onExport}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        📥 Export CSV
      </button>
      {onPdf && (
        <button
          onClick={onPdf}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          📄 Download PDF
        </button>
      )}
    </div>
  )
}