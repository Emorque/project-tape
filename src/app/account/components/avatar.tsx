'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'

const MaxFileSize = 1.0 * 1024 * 1024; 

export default function Avatar({
  uid,
  url,
  size,
  onUpload,
}: {
  uid: string | null
  url: string | null
  size: number
  onUpload: (url: string) => void
}) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        // const { data } = await supabase.storage.from('avatars').download(path)
        // Changed from the code below because I got the error 
        const { data, error } = await supabase.storage.from('avatars').download(path)
        if (error) {
          throw error
        }
        const url = URL.createObjectURL(data)
        // const url = data.publicUrl
        setAvatarUrl(url)
        console.log("Image downloaded")
      } catch (error) {
        console.log('Error downloading image: ', error)
      }
    }

    if (url) downloadImage(url)
  }, [url, supabase])

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      const oldUrl = url;
      // console.log(oldUrl, "oldUrl")
      // console.log(url)
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]

      if (file.size > MaxFileSize) {
        throw new Error('Max Avatar Size is 1MB.')
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}/${uid}-${Math.random()}.${fileExt}`

      // I can use the same file path here {filePath} to not only generate the filePath for the uploaded song, but also add it to the songs's links column when inserting in the sogns table 

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      // File is the actual file itself, and filepath is created manually on the client with user id, some Math.random and the extension of the file
      // 
      if (uploadError) {
        throw uploadError
      }
      else {
        if (oldUrl) {
          try {
            const { error : deleteError } = await supabase
              .storage
              .from('avatars')
              .remove([oldUrl])
            if (deleteError) {
               throw deleteError
            }
          }
          catch (error) {
            console.log("Error deleting old profile", error)
          }
        }

      }

      onUpload(filePath)
    } catch (error) {
      console.error('Avatar error:', error) // Only used for eslint
      alert(error)
    } finally {
      setTimeout(() => {
        setUploading(false)
      }, 1000) //Temporary fix. Without this, loading cas appears, then old avatar loads, finally the new avatar loads. (not good UX)
    }
  }

  return (
    <div id='avatar_div'>
      {(avatarUrl && !uploading) ? (
        <Image
          width={size}
          height={size}
          src={avatarUrl}
          alt="Avatar"
          className="avatar image"
          style={{ height: size, width: size }}
        />
      ) : (
        <div id='avatar_cas_wrapper' style={{width: size, height: size}}>
          <div id='avatar_cas'>
            <div className="l_left loading_eye">
              </div>
              <div className="l_right loading_eye">
                <span className="cas_teeth_loading"></span>
                <span className="cas_teeth_loading"></span>
                <span className="cas_teeth_loading"></span>
            </div>
          </div>
        </div>
      )}
      <div style={{ width: size }}>
        <label className="button primary block" style={{cursor: "pointer"}} htmlFor="single">
          {uploading ? 'Uploading ...' : 'Click to Upload'}
        </label>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  )
}