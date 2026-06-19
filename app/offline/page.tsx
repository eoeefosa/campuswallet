export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <div className="text-6xl mb-4">📵</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You're offline</h1>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Check your internet connection. Your expense data is saved and will sync when you're back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
