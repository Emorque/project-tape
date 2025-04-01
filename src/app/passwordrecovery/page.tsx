import { recoverPassword } from './actions'
import './passwordrecovery.css'

export default function PasswordRecoveryPage() {
  return (
    <form id='password_recovery_form'>
      <div>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />  
      </div>
      <div>
        <button formAction={recoverPassword}>Send Link</button>
      </div>
    </form>
  )
}