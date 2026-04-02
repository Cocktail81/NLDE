interface EmptyStateProps {
  icon: string
  title: string
  message: string
}

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border p-12 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-gray-700 font-medium">{title}</p>
      <p className="text-gray-500 text-sm mt-2">{message}</p>
    </div>
  )
}