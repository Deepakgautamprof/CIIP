import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Login.css"

const API_BASE = "http://127.0.0.1:8000/api"

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!username.trim() || !password) {
      alert("Please enter username and password.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${API_BASE}/users/login/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password,
          }),
        }
      )

      const data = await response.json()

      console.log("Login response:", data)

      if (!response.ok) {
        alert(data.detail || "Invalid username or password.")
        setPassword("")
        return
      }

      // ==================================================
      // SAVE LOGIN INFORMATION
      // ==================================================

      localStorage.setItem(
        "ciip_token",
        data.token
      )

      localStorage.setItem(
        "ciip_username",
        data.username || username.trim()
      )

      localStorage.setItem(
        "ciip_full_name",
        data.full_name || ""
      )

      localStorage.setItem(
        "ciip_role",
        data.role || ""
      )

      if (data.profile_photo_url) {
        localStorage.setItem(
          "ciip_profile_photo_url",
          data.profile_photo_url
        )
      } else {
        localStorage.removeItem(
          "ciip_profile_photo_url"
        )
      }

      setPassword("")

      alert("Login successful!")

      // ==================================================
      // ROLE-BASED DASHBOARD
      // ==================================================

      switch (data.role) {

        case "CITIZEN":
          navigate("/dashboard")
          break

        case "OFFICER":
          navigate("/officer-dashboard")
          break

        case "DEPARTMENT_ADMIN":
          navigate("/department-dashboard")
          break

        case "WARD_ADMIN":
          navigate("/ward-dashboard")
          break

        case "SUPER_ADMIN":
          navigate("/admin-dashboard")
          break

        default:
          alert(
            "Login successful, but user role is not configured."
          )
          navigate("/login")
      }

    } catch (error) {
      console.error("Login error:", error)

      alert(
        "Unable to connect to CIIP server. Make sure Django backend is running."
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      {/* ================================================
          LEFT BRANDING PANEL
      ================================================= */}

      <div className="login-visual">

        <div className="visual-overlay"></div>

        <div className="visual-content">

          <div className="brand-mark">
            <span className="brand-icon">⌂</span>
          </div>

          <div className="brand-text">
            <span>CIIP</span>
            <small>
              Civic Infrastructure
              <br />
              Intelligence Platform
            </small>
          </div>

          <div className="visual-divider"></div>

          <h2>
            Building Better
            <br />
            <span>Communities Together.</span>
          </h2>

          <p>
            Report civic infrastructure issues, track
            complaints and help create smarter,
            safer and better-connected communities.
          </p>

          <div className="visual-features">

            <div className="visual-feature">
              <div className="feature-icon">⌖</div>
              <div>
                <strong>Smart Reporting</strong>
                <span>Report issues with precise locations</span>
              </div>
            </div>

            <div className="visual-feature">
              <div className="feature-icon">◉</div>
              <div>
                <strong>Real-time Tracking</strong>
                <span>Follow the progress of your complaint</span>
              </div>
            </div>

            <div className="visual-feature">
              <div className="feature-icon">✦</div>
              <div>
                <strong>Intelligent Governance</strong>
                <span>Technology-powered civic management</span>
              </div>
            </div>

          </div>

        </div>

        <div className="visual-bottom">
          <span>CIIP • SMART CIVIC GOVERNANCE</span>
          <span>© 2026</span>
        </div>

      </div>


      {/* ================================================
          RIGHT LOGIN PANEL
      ================================================= */}

      <div className="login-panel">

        <div className="login-container">

          {/* Mobile Brand */}

          <div className="mobile-brand">
            <div className="mobile-brand-icon">⌂</div>
            <div>
              <strong>CIIP</strong>
              <span>Civic Infrastructure Intelligence Platform</span>
            </div>
          </div>


          {/* Header */}

          <div className="login-header">

            <div className="login-badge">
              <span className="status-dot"></span>
              Citizen Portal
            </div>

            <h1>
              Welcome back
            </h1>

            <p>
              Sign in to access your CIIP account
            </p>

          </div>


          {/* Login Form */}

          <form
            onSubmit={handleLogin}
            autoComplete="off"
            className="login-form"
          >

            {/* USERNAME */}

            <div className="login-input">

              <label htmlFor="ciip-username">
                Username
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ◉
                </span>

                <input
                  type="text"
                  name="ciip-username"
                  id="ciip-username"
                  autoComplete="off"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="login-input">

              <div className="password-label-row">

                <label htmlFor="ciip-password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert(
                      "Forgot Password feature will be added next."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>

              <div className="input-wrapper">

                <span className="input-icon">
                  ◆
                </span>

                <input
                  type="password"
                  name="ciip-password"
                  id="ciip-password"
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

              </div>

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >

              <span>
                {loading
                  ? "Signing in..."
                  : "Sign in to CIIP"}
              </span>

              {!loading && (
                <span className="btn-arrow">
                  →
                </span>
              )}

            </button>

          </form>


          {/* Divider */}

          <div className="login-divider">
            <span>OR</span>
          </div>


          {/* Register */}

          <div className="register-box">

            <div className="register-icon">
              +
            </div>

            <div className="register-content">

              <span>
                Don't have a citizen account?
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate("/register")
                }
              >
                Create an account →
              </button>

            </div>

          </div>


          {/* Security */}

          <div className="login-security">

            <span className="security-icon">
              ✓
            </span>

            <div>
              <strong>Secure Government Portal</strong>
              <span>
                Your information is protected
              </span>
            </div>

          </div>


          {/* Footer */}

          <div className="login-footer">
            <span>CIIP</span>
            <span>•</span>
            <span>Smart Civic Governance</span>
          </div>

        </div>

      </div>

    </div>
  )
}

export default Login
