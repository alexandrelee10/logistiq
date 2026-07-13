import SignIn from '@/app/components/auth/SignInForm'
import { Suspense } from 'react'

const page = () => {
  return (
    <Suspense fallback={null}>
      <SignIn />
    </Suspense>
  )
}

export default page
