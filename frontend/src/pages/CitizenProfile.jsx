import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./CitizenProfile.css"

const API_BASE = "http://127.0.0.1:8000/api"

function CitizenProfile() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    id: "",
    username: "",
    full_name: "",
    phone: "",
    role: "CITIZEN",
    profile_photo: null,
    profile_photo_url: null,
  })

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  })

  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [previewPhoto, setPreviewPhoto] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  const fetchProfile = async () => {
    const token = localStorage.getItem("ciip_token")

    if (!token) {
      navigate("/login")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${API_BASE}/users/profile/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        localStorage.clear()
        navigate("/login")
        return
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load profile."
        )
      }

      setProfile(data)

      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
      })

      if (data.profile_photo_url) {
        setPreviewPhoto(data.profile_photo_url)
      } else {
        setPreviewPhoto(null)
      }

    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Unable to load profile."
      )
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const token =
      localStorage.getItem("ciip_token")

    const role =
      localStorage.getItem("ciip_role")

    if (!token) {
      navigate("/login")
      return
    }

    if (role && role !== "CITIZEN") {
      navigate("/login")
      return
    }

    fetchProfile()
  }, [navigate])

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setSuccess("")
    setError("")
  }

  // =====================================================
  // PHOTO CHANGE
  // =====================================================

  const handlePhotoChange = (event) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      )
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile photo must be smaller than 5 MB."
      )
      return
    }

    setSelectedPhoto(file)

    const imageUrl =
      URL.createObjectURL(file)

    setPreviewPhoto(imageUrl)

    setSuccess("")
    setError("")
  }

  // =====================================================
  // REMOVE PHOTO PREVIEW
  // =====================================================

  const handleRemovePhoto = () => {
    setSelectedPhoto(null)

    if (profile.profile_photo_url) {
      setPreviewPhoto(
        profile.profile_photo_url
      )
    } else {
      setPreviewPhoto(null)
    }
  }

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    const token =
      localStorage.getItem("ciip_token")

    if (!token) {
      navigate("/login")
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const data = new FormData()

      data.append(
        "full_name",
        formData.full_name
      )

      data.append(
        "phone",
        formData.phone
      )

      if (selectedPhoto) {
        data.append(
          "profile_photo",
          selectedPhoto
        )
      }

      const response = await fetch(
        `${API_BASE}/users/profile/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Token ${token}`,
          },
          body: data,
        }
      )

      const responseData =
        await response.json()

      if (response.status === 401) {
        localStorage.clear()
        navigate("/login")
        return
      }

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
            "Unable to update profile."
        )
      }

      setProfile(responseData)

      setFormData({
        full_name:
          responseData.full_name || "",
        phone:
          responseData.phone || "",
      })

      if (
        responseData.profile_photo_url
      ) {
        setPreviewPhoto(
          responseData.profile_photo_url
        )
      } else {
        setPreviewPhoto(null)
      }

      setSelectedPhoto(null)

      localStorage.setItem(
        "ciip_full_name",
        responseData.full_name || ""
      )

      setSuccess(
        "Profile updated successfully."
      )

    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Unable to update profile."
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  // =====================================================
  // AVATAR
  // =====================================================

  const getInitial = () => {
    const name =
      profile.full_name ||
      profile.username ||
      "C"

    return name
      .charAt(0)
      .toUpperCase()
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="profile-loading-page">

        <div className="profile-loading-card">

          <div className="profile-loading-icon">
            ⏳
          </div>

          <h2>
            Loading Profile
          </h2>

          <p>
            Please wait while we fetch your profile.
          </p>

        </div>

      </div>
    )
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="profile-page">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="profile-sidebar">

        <div className="profile-sidebar-brand">

          <div className="profile-sidebar-logo">
            🏛️
          </div>

          <div>
            <h2>CIIP</h2>

            <span>
              Citizen Portal
            </span>
          </div>

        </div>

        <div className="profile-sidebar-title">
          MAIN MENU
        </div>

        <nav className="profile-sidebar-menu">

          {/* FIXED: /citizen-dashboard → /dashboard */}
          <button
            className="profile-sidebar-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>
              🏠
            </span>

            Dashboard
          </button>

          <button
            className="profile-sidebar-item"
            onClick={() =>
              navigate("/complaint")
            }
          >
            <span>
              ➕
            </span>

            Register Complaint
          </button>

          <button
            className="profile-sidebar-item"
            onClick={() =>
              navigate("/my-complaints")
            }
          >
            <span>
              📋
            </span>

            My Complaints
          </button>

          <button
            className="profile-sidebar-item"
            onClick={() =>
              navigate("/my-complaints")
            }
          >
            <span>
              🔎
            </span>

            Track Complaint
          </button>

        </nav>

        <div className="profile-sidebar-title">
          SYSTEM
        </div>

        <nav className="profile-sidebar-menu">

          <button
            className="profile-sidebar-item active"
          >
            <span>
              👤
            </span>

            My Profile
          </button>

          <button
            className="profile-sidebar-item"
            onClick={() =>
              alert(
                "Settings module will be added soon."
              )
            }
          >
            <span>
              ⚙️
            </span>

            Settings
          </button>

          <button
            className="profile-sidebar-item logout"
            onClick={handleLogout}
          >
            <span>
              🚪
            </span>

            Logout
          </button>

        </nav>

        <div className="profile-sidebar-bottom">

          <div className="profile-sidebar-user">

            <div className="profile-small-avatar">
              {getInitial()}
            </div>

            <div>

              <strong>
                {profile.full_name ||
                  profile.username}
              </strong>

              <span>
                Citizen
              </span>

            </div>

          </div>

          <div className="profile-security">
            🔒 Secure Citizen Portal
          </div>

        </div>

      </aside>

      {/* =================================================
          MAIN
          ================================================= */}

      <div className="profile-main">

        {/* =================================================
            NAVBAR
            ================================================= */}

        <nav className="profile-navbar">

          <div className="profile-navbar-title">

            <span>
              Citizen Portal
            </span>

            <strong>
              My Profile
            </strong>

          </div>

          <div className="profile-navbar-right">

            <div className="profile-nav-user">

              <div className="profile-nav-avatar">
                {getInitial()}
              </div>

              <div>

                <strong>
                  {profile.full_name ||
                    profile.username}
                </strong>

                <span>
                  Citizen
                </span>

              </div>

            </div>

            <button
              className="profile-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </nav>

        {/* =================================================
            CONTENT
            ================================================= */}

        <main className="profile-container">

          <div className="profile-page-heading">

            <div>

              <span>
                ACCOUNT
              </span>

              <h1>
                My Profile
              </h1>

              <p>
                View and manage your CIIP citizen account information.
              </p>

            </div>

            {/* FIXED: /citizen-dashboard → /dashboard */}
            <button
              className="profile-back-btn"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </div>

          {/* =================================================
              MESSAGES
              ================================================= */}

          {error && (

            <div className="profile-alert error">

              <span>
                ⚠️
              </span>

              <div>
                <strong>
                  Something went wrong
                </strong>

                <p>
                  {error}
                </p>
              </div>

            </div>

          )}

          {success && (

            <div className="profile-alert success">

              <span>
                ✅
              </span>

              <div>
                <strong>
                  Success
                </strong>

                <p>
                  {success}
                </p>
              </div>

            </div>

          )}

          {/* =================================================
              PROFILE LAYOUT
              ================================================= */}

          <div className="profile-layout">

            {/* =================================================
                PROFILE CARD
                ================================================= */}

            <section className="profile-card profile-overview">

              <div className="profile-card-header">

                <div>

                  <h2>
                    Profile Overview
                  </h2>

                  <p>
                    Your citizen account
                  </p>

                </div>

                <span className="profile-role-badge">
                  CITIZEN
                </span>

              </div>

              <div className="profile-photo-area">

                <div className="profile-photo-wrapper">

                  {previewPhoto ? (

                    <img
                      src={previewPhoto}
                      alt="Profile"
                      className="profile-photo"
                    />

                  ) : (

                    <div className="profile-photo-placeholder">
                      {getInitial()}
                    </div>

                  )}

                </div>

                <div className="profile-photo-info">

                  <h3>
                    Profile Photo
                  </h3>

                  <p>
                    Upload a clear photo for your citizen profile.
                  </p>

                  <div className="photo-buttons">

                    <label
                      className="upload-photo-btn"
                    >
                      📷 Choose Photo

                      <input
                        type="file"
                        accept="image/*"
                        onChange={
                          handlePhotoChange
                        }
                      />
                    </label>

                    {selectedPhoto && (

                      <button
                        type="button"
                        className="remove-photo-btn"
                        onClick={
                          handleRemovePhoto
                        }
                      >
                        Remove
                      </button>

                    )}

                  </div>

                  <small>
                    JPG, PNG or WEBP • Maximum 5 MB
                  </small>

                </div>

              </div>

              <div className="profile-divider" />

              <div className="profile-account-info">

                <div className="account-info-row">

                  <span>
                    Account ID
                  </span>

                  <strong>
                    {profile.id ||
                      "Not available"}
                  </strong>

                </div>

                <div className="account-info-row">

                  <span>
                    Username
                  </span>

                  <strong>
                    {profile.username ||
                      "Not available"}
                  </strong>

                </div>

                <div className="account-info-row">

                  <span>
                    Account Type
                  </span>

                  <strong>
                    Citizen
                  </strong>

                </div>

              </div>

            </section>

            {/* =================================================
                EDIT PROFILE
                ================================================= */}

            <section className="profile-card profile-edit-card">

              <div className="profile-card-header">

                <div>

                  <h2>
                    Personal Information
                  </h2>

                  <p>
                    Update your account details
                  </p>

                </div>

              </div>

              <form
                className="profile-form"
                onSubmit={handleSubmit}
              >

                {/* FULL NAME */}

                <div className="profile-field">

                  <label htmlFor="full_name">
                    Full Name
                  </label>

                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={
                      formData.full_name
                    }
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    maxLength={150}
                  />

                </div>

                {/* USERNAME */}

                <div className="profile-field">

                  <label htmlFor="username">
                    Username
                  </label>

                  <input
                    id="username"
                    type="text"
                    value={
                      profile.username
                    }
                    disabled
                  />

                  <small>
                    Username cannot be changed here.
                  </small>

                </div>

                {/* PHONE */}

                <div className="profile-field">

                  <label htmlFor="phone">
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={
                      formData.phone
                    }
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    maxLength={15}
                  />

                </div>

                {/* ROLE */}

                <div className="profile-field">

                  <label>
                    Account Role
                  </label>

                  <div className="profile-role-field">

                    <span>
                      👤
                    </span>

                    <div>

                      <strong>
                        Citizen
                      </strong>

                      <small>
                        Registered CIIP citizen account
                      </small>

                    </div>

                  </div>

                </div>

                {/* BUTTON */}

                <div className="profile-form-actions">

                  <button
                    type="button"
                    className="profile-cancel-btn"
                    onClick={() => {
                      setFormData({
                        full_name:
                          profile.full_name ||
                          "",
                        phone:
                          profile.phone ||
                          "",
                      })

                      setSelectedPhoto(null)

                      setPreviewPhoto(
                        profile.profile_photo_url ||
                          null
                      )

                      setError("")
                      setSuccess("")
                    }}
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    className="profile-save-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </form>

            </section>

          </div>

          {/* =================================================
              SECURITY INFO
              ================================================= */}

          <section className="profile-security-card">

            <div className="security-icon">
              🔐
            </div>

            <div>

              <h3>
                Your account is protected
              </h3>

              <p>
                CIIP uses authenticated access to protect your citizen account and complaint information.
              </p>

            </div>

            <span>
              Secure
            </span>

          </section>

        </main>

        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="profile-footer">

          <span>
            🔒 CIIP — Civic Infrastructure Intelligence Platform
          </span>

          <span>
            Citizen Portal
          </span>

        </footer>

      </div>

    </div>
  )
}

export default CitizenProfile