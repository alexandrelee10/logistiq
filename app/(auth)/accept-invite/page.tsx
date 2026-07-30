import AcceptInvite from '@/app/components/auth/AcceptInviteForm'
import { Suspense } from 'react'

const page = () => {
  return (
    <Suspense fallback={null}>
      <AcceptInvite />
    </Suspense>
  )
}

export default page
