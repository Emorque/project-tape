'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`
  return url
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string | null
  const password = formData.get('password') as string | null
  const username = formData.get('username') as string | null
  if (!email || !password || !username) {
    console.error('Missing email, password, or username')
    redirect('/error')
  }

  // Check if the username is unique. 
  let { data: profiles, error : usernameError } = await supabase
  .from('profiles')
  .select()
  .ilike('username', username) // Very important that it is a case insensitive check. I want "Zhalo" and "zhaLo" to be considered the same username

  if (usernameError) {
    redirect('/error')
  }

  if (profiles && profiles.length > 0){
    redirect(`/signup?error=Username+is+already+taken`)
  }
  else {
    console.log("username is Available")
  }

  const { error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options : {
    emailRedirectTo: `${getURL()}welcome`,
    data: {
        username: username
    }
  }
  })

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/verifyemail')
}