import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="10" fill="#0D9488" />
              <ellipse cx="14.5" cy="12" rx="2.2" ry="2.8" fill="white" />
              <ellipse cx="21.5" cy="12" rx="2.2" ry="2.8" fill="white" />
              <ellipse cx="10.5" cy="17" rx="2" ry="2.5" fill="white" />
              <ellipse cx="25.5" cy="17" rx="2" ry="2.5" fill="white" />
              <path d="M18 29c-4.5 0-7.5-3.5-7.5-6.5 0-3 2.5-6 7.5-6s7.5 3 7.5 6c0 3-3 6.5-7.5 6.5z" fill="white" />
            </svg>
            <span className="text-xl font-bold text-gray-900">ClicaPet</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/login?cadastro=1"
              className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Cadastrar clínica
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-1.5 bg-teal-50 text-teal-700 text-sm font-medium rounded-full mb-6">
              Gestão veterinária simplificada
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Sua clínica veterinária{' '}
              <span className="text-teal-600">na palma da mão</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500 max-w-lg leading-relaxed">
              O ClicaPet conecta veterinários e tutores em uma única plataforma.
              Gerencie consultas, prontuários, vacinas e lembretes com facilidade.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/login?cadastro=1"
                className="px-8 py-4 text-lg font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/25 text-center"
              >
                Comece gratuitamente
              </Link>
              <a
                href="#funcionalidades"
                className="px-8 py-4 text-lg font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-center"
              >
                Conhecer mais
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-teal-100/50 rounded-3xl blur-2xl" />
            <Image
              src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop&q=80"
              alt="Veterinário cuidando de um cachorro"
              width={800}
              height={600}
              className="relative rounded-2xl shadow-2xl object-cover w-full"
              priority
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-teal-50/50 border-y border-teal-100/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-teal-600">100%</p>
            <p className="text-sm text-gray-500 mt-1">Gratuito</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-teal-600">24/7</p>
            <p className="text-sm text-gray-500 mt-1">Acesso online</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-teal-600">5 min</p>
            <p className="text-sm text-gray-500 mt-1">Para começar</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-teal-600">Seguro</p>
            <p className="text-sm text-gray-500 mt-1">Dados protegidos</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Tudo que sua clínica precisa
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Ferramentas pensadas para o dia a dia da clínica veterinária e para a tranquilidade do tutor.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-1.997M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              }
              title="Gestão de clientes"
              description="Cadastre tutores e seus pets com todos os dados importantes em um só lugar."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75m0-3H12a2.25 2.25 0 0 1-2.25-2.25v-6.75" />
                </svg>
              }
              title="Prontuários digitais"
              description="Registre consultas, exames e tratamentos com histórico completo do animal."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              }
              title="Controle de vacinas"
              description="Acompanhe o calendário vacinal de cada pet com alertas automáticos."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              }
              title="Agendamento online"
              description="Tutores agendam consultas direto pelo portal, sem precisar ligar."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              }
              title="Lembretes automáticos"
              description="Envie lembretes de vacinas e retornos por email automaticamente."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              }
              title="Controle financeiro"
              description="Acompanhe receitas e despesas da clínica de forma simples e organizada."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Como funciona
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Comece a usar em poucos minutos, sem complicação.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              step="1"
              title="Cadastre sua clínica"
              description="Crie sua conta, adicione os dados da clínica e pronto, seu painel já está ativo."
            />
            <StepCard
              step="2"
              title="Convide seus tutores"
              description="Compartilhe o código de convite para que os tutores se cadastrem no portal."
            />
            <StepCard
              step="3"
              title="Gerencie tudo online"
              description="Consultas, vacinas, prontuários e financeiro. Tudo em um só lugar."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden min-h-[400px] flex items-end">
            <Image
              src="https://images.unsplash.com/photo-1629740067905-bd3f515aa739?w=800&h=600&fit=crop&q=80"
              alt="Veterinária examinando um pet"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/90 via-teal-900/40 to-transparent" />
            <div className="relative p-10 text-white max-w-2xl">
              <h3 className="text-3xl font-bold mb-3">Transforme a gestão da sua clínica</h3>
              <p className="text-teal-100 mb-6 leading-relaxed text-lg">
                Prontuários digitais, controle de vacinas, agenda de consultas, gestão financeira
                e um portal exclusivo para os tutores dos seus pacientes. Tudo gratuito.
              </p>
              <Link
                href="/login?cadastro=1"
                className="inline-block px-8 py-4 bg-white text-teal-700 font-semibold text-lg rounded-xl hover:bg-teal-50 transition-colors"
              >
                Cadastrar minha clínica
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / Trust */}
      <section className="py-24 px-6 bg-teal-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Feito por quem entende a rotina veterinária
          </h2>
          <p className="text-teal-100 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            O ClicaPet foi criado para simplificar o dia a dia de clínicas veterinárias
            e oferecer mais transparência e praticidade para os tutores.
            Sem complicação, sem custo.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-white text-teal-700 font-semibold text-lg rounded-xl hover:bg-teal-50 transition-colors shadow-lg"
          >
            Criar conta gratuita
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 pb-12 border-b border-gray-800">
            {/* Logo + descrição */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold">ClicaPet</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Sistema de gestão veterinária que conecta clínicas e tutores em uma única plataforma. Simples, completo e gratuito.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Navegação</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#funcionalidades" className="text-sm text-gray-300 hover:text-white transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
                    Como funciona
                  </a>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link href="/login?cadastro=1" className="text-sm text-gray-300 hover:text-white transition-colors">
                    Cadastrar clínica
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Contato</h4>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:contato@clicapet.com" className="text-sm text-gray-300 hover:text-white transition-colors">
                    contato@clicapet.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} ClicaPet. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-600/5 transition-all group">
      <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}
