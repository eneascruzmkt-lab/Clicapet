import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-teal-600">?</span>
        </div>
        <h1 className="text-6xl font-extrabold text-gray-900 mb-2">404</h1>
        <p className="text-lg text-gray-500 mb-8">Pagina nao encontrada</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
          >
            Voltar ao inicio
          </Link>
          <Link
            href="/portal"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Portal do tutor
          </Link>
        </div>
      </div>
    </div>
  )
}
