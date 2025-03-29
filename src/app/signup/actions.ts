'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string | null
  const password = formData.get('password') as string | null
  const username = formData.get('username') as string | null
  if (!email || !password || !username) {
    console.error('Missing email, password, or username')
    redirect('/error')
    // redirect('/error?message=Missing email, password, or username') //Pass an error message
  }
//   const data = {
//     email: formData.get('email') as string,
//     password: formData.get('password') as string,
//     // username: formData.get('username') as string
//   }

    const { error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options : {
        data: {
            username: username
        }
    }
  })

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/account')
}