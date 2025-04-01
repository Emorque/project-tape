'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    new_password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.updateUser({ password: data.new_password })

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/account')
}