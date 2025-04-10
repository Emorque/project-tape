'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type User } from '@supabase/supabase-js'
import Avatar from './components/avatar'

import "./account_form.css"
import Link from 'next/link'

export default function AccountForm({ user }: { user: User | null }) {
  const supabase = createClient()
  const [username, setUsername] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)

  const getProfile = useCallback(async () => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, avatar_url`)
        .eq('id', user?.id)
        .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (data) {
        setUsername(data.username)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      console.error('User error:', error) // Only used for eslint
      alert('Error loading user data!')
    } finally {
      console.log("Profile Successfully Obtained")
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function updateProfile({
    avatar_url,
  }: {
    avatar_url: string | null
  }) {
    try {
      const { error } = await supabase
      .from('profiles')
      .update({ "avatar_url": avatar_url, "updated_at": new Date().toISOString() })
      .eq('id', user?.id)
    
      if (error) {
        console.error('Supabase Profile error:', error) // Only used for eslint
        throw error
      }
    } catch (error) {
      console.error('Profile Update error:', error) // Only used for eslint
      alert('Error updating the data!')
    } finally {
    }
  }

  return (
    <div id='account_form' className="form-widget">
       <Avatar
        uid={user?.id ?? null}
        url={avatar_url}
        size={150}
        onUpload={(url) => {
          setAvatarUrl(url)
          updateProfile({ avatar_url: url })
        }}
      />

      <div className='account_div'>
        <label htmlFor="email">Email:</label>
        <h2>{user?.email}</h2>
      </div>

      <div className='account_div'>
        <label htmlFor="username">Username:</label>
        <h2 id='username'>{username || ''}</h2>
      </div>

      <div id='account_btns'>
        <form action="/auth/signout" method="post">
          <button className="button block" type="submit">
            Sign out
          </button>
        </form>
        {/* Link is too quick lol. I can bring back Link only I add a loading element to the main page */}
      </div>
      <div id='links_div'>
        <Link href={"/passwordrecovery"}>Reset Password</Link> 
        <a href={"/"}>Back to Project Tape</a> 
      </div>
    </div>
  )
}