import DatabaseManager from "@/components/DatabaseManager"

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Multi-DB Manager</h1>
      <DatabaseManager />
    </div>
  )
}

