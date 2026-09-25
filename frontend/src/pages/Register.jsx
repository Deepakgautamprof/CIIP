import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Register.css"

function Register() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: name,
            username: username,
            phone: phone,
            password: password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error(data)

        if (data.username) {
          alert(`Username error: ${data.username[0]}`)
        } else if (data.phone) {
          alert(`Phone error: ${data.phone[0]}`)
        } else if (data.password) {
          alert(`Password error: ${data.password[0]}`)
        } else {
          alert(data.detail || "Registration failed.")
        }

        return
      }

      // Clear form data
      setName("")
      setUsername("")
      setPhone("")
      setPassword("")
      setConfirmPassword("")

      alert("Registration successful! Please login.")

      navigate("/login")

    } catch (error) {
      console.error(error)
      alert("Unable to connect to CIIP server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">

      <div className="register-card">

        <div className="register-logo">
          🏛️
        </div>

        <h1>Create Citizen Account</h1>

        <p className="register-subtitle">
          Register on Civic Infrastructure Intelligence Platform
        </p>

        <form onSubmit={handleRegister}>

          {/* FULL NAME */}
          <div className="register-input">
            <label>Full Name</label>

            <input
              type="text"
              name="full_name"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>


          {/* USERNAME */}
          <div className="register-input">
            <label>Username</label>

            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Create username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>


          {/* PHONE */}
          <div className="register-input">
            <label>Phone Number</label>

            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>


          {/* PASSWORD */}
          <div className="register-input">
            <label>Password</label>

            <input
              type="password"
              name="new-password"
              autoComplete="new-password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>


          {/* CONFIRM PASSWORD */}
          <div className="register-input">
            <label>Confirm Password</label>

            <input
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>


          {/* REGISTER BUTTON */}
          <button
            type="submit"
            className="register-btn"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account →"}
          </button>

        </form>


        {/* LOGIN LINK */}
        <p className="login-link">
          Already have an account?{" "}

          <span onClick={() => navigate("/login")}>
            Login
          </span>
        </p>


        <div className="register-footer">
          🔒 Secure Government Citizen Portal
        </div>

      </div>

    </div>
  )
}

export default Register