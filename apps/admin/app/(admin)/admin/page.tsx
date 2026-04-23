"use client"
import { redirect, usePathname } from "next/navigation"
import { useEffect } from "react"
const page = async () => {
    const pathname = usePathname()

    useEffect(() => {
        redirect(pathname.replace("/admin", ""))
    },[])

  return (
    <div className="w-full text-center h-full flex items-center justify-center">
      <h1 className="text-center">Redirecting...</h1>
    </div>
  )
}

export default page