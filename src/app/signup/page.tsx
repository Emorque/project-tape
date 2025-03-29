import Link from 'next/link'
import { signup } from './actions'
import './signup.css' // TODO: Move the stlying of both signup and login pages to global.css

export default function SignUpPage() {
  return (
    <form id='login_form'>
      <div>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />  
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />  
      </div>
      <div>
        <label htmlFor="username">Username:</label>
        <input id="username" name="username" type="string" required />  
      </div>
      <div>
        <button formAction={signup}>Sign Up</button>
      </div>
      <div>
        <h1>Already Have an Acccount?</h1>
        <Link href={"/login"}>Log in Here</Link>
      </div>
    </form>
  )
}