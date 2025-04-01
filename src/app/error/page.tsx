import Link from "next/link"
import "./error.css"

export default function ErrorPage() {
    return (
        <div id="error_page">
            <h1>Sorry, something went wrong</h1>
            <div>
                <Link href={"/login"}>Back to Login</Link>
                <a href={"/"}>Back to Project Tape</a>    
            </div>
        </div>
    )
}