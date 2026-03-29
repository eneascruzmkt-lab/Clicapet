'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function getClinicId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('clinics')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return data?.id || null
}

export async function getTransactions() {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) return []

  const { data } = await supabase
    .from('transactions')
    .select('*, clients(name)')
    .eq('clinic_id', clinicId)
    .order('date', { ascending: false })
    .limit(50)

  return data ?? []
}

export async function getMonthlyStats() {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) return { revenue: 0, expenses: 0, byMethod: {} }

  const now = new Date()
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`

  const { data } = await supabase
    .from('transactions')
    .select('amount, type, payment_method')
    .eq('clinic_id', clinicId)
    .gte('date', firstDay)
    .lte('date', lastDay)

  const items = data ?? []
  let revenue = 0
  let expenses = 0
  const byMethod: Record<string, number> = {}

  for (const t of items) {
    const amt = parseFloat(t.amount)
    if (t.type === 'revenue') {
      revenue += amt
      const method = t.payment_method || 'pending'
      byMethod[method] = (byMethod[method] || 0) + amt
    } else {
      expenses += amt
    }
  }

  return { revenue: Math.round(revenue * 100) / 100, expenses: Math.round(expenses * 100) / 100, byMethod }
}

export async function createTransactionAction(formData: FormData) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) throw new Error('Clinica nao encontrada')

  const { error } = await supabase.from('transactions').insert({
    clinic_id: clinicId,
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    type: formData.get('type') as string,
    payment_method: (formData.get('payment_method') as string) || null,
    date: formData.get('date') as string,
    client_id: (formData.get('client_id') as string) || null,
    notes: (formData.get('notes') as string) || null,
  })

  if (error) throw new Error('Falha ao registrar transacao')

  redirect('/dashboard/financeiro')
}
