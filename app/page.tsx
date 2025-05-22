import DroneDashboard from "../drone-dashboard"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      <DroneDashboard />

      <div className="mt-8">
        <Link href="/minimal-dashboard" className="text-blue-400 hover:text-blue-300 underline">
          View Minimal Dashboard
        </Link>
      </div>
    </main>
  )
}
