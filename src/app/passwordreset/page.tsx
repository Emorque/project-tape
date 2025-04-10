import Link from 'next/link'
import './passwordreset.css' // TODO: Move the stlying of both signup and login pages to global.css

export default function VerifyEmailPage() {
  return (
    <div id='passwordreset_page'>
        <h1>Password Reset Request</h1>
        <h2>If there is an account associated with the email you provided, <br/>we will send a password reset link to that address shortly.</h2>
        <h2>Please check your inbox (and spam folder) for the email with the reset instructions.</h2>
        <h2>If you don&apos;t receive the email within a few minutes, you can <Link href="/passwordrecovery">try again</Link>.</h2>
</div>
  )
}