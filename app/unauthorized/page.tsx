// app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="mb-4">You don't have permission to access this page.</p>
        <a href="/dashboard" className="text-blue-500 hover:text-blue-700">
          Return to Dashboard
        </a>
      </div>
    </div>
  )
}