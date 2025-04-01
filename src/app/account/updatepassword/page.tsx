
'use server'

import { redirect } from 'next/navigation'
import { updatePassword } from './actions'
import './passwordchange.css'
import { createClient } from '@/utils/supabase/server'


export default async function UpdatePasswordPage() {

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <form id='update_password_form'>
      <div>
        <label htmlFor="password">New Password:</label>
        <input id="password" name="password" type="password" required />  
      </div>
      <div>
        <button formAction={updatePassword}>Save New Password</button>
      </div>
    </form>
  )
}