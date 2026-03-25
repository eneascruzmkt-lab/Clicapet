import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Clicapet</h1>
          <p className="mt-2 text-gray-500">Sistema de gestao veterinaria</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
          >
            Sou dono de clinica
          </Link>
          <Link
            href="/portal"
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-medium text-lg"
          >
            Sou tutor
          </Link>
        </div>
      </div>
    </div>
  )
}
