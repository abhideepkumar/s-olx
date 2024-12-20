'use client'
import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const LogoutPage = () => {
const router = useRouter()

    useEffect(() => {
      if(typeof window !== 'undefined') {
          localStorage.clear()
      }
      router.push('/login')
    }, [])
    
  return (
    <div className='text-center text-red-500  '>Logging Out......PLease Wait</div>
  )
}

export default LogoutPage