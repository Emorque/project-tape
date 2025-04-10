import Link from 'next/link'
import { login } from './actions'
import './login.css'

export default function LoginPage() {
  return (
    <form id='login_form'>
      <div>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />  
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />  
        <Link href={"/passwordrecovery"}>Forgot Password?</Link>
      </div>
      <div>
        <button formAction={login}>Log in</button>
      </div>
      <div>
        <h1>Don&apos;t Have an Acccount?</h1>
        <Link className='links' href={"/signup"}>Sign Up Here</Link>
      </div>
      <div>
        <a className='links' href={"/"}>Back to Project Tape</a> 
      </div>
    </form>
  )
}