'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function recoverPassword(formData: FormData) {
  const supabase = await createClient()

  // Check if a user's logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
  }

  // const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
  //   redirectTo: `${getURL()}account/updatepassword`,
  // })

  const { error } = await supabase.auth.resetPasswordForEmail(data.email)


  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/passwordreset')
}