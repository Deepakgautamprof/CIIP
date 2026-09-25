import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./DepartmentProfile.css"

const API_BASE = "http://127.0.0.1:8000/api"

function getToken() {
  return (
    localStorage.getItem("ciip_token") ||
    sessionStorage.getItem("ciip_token") ||
    ""
  )
}

function DepartmentProfile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  })

  const [photoPreview, setPhotoPreview] = useState("")
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  /* =========================
     LOAD PROFILE
  ========================= */

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError("")

      const token = getToken()

      if (!token) {
        navigate("/login")
        return
      }

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

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to load profile."
        )
      }

      /* Department Admin protection */
      if (data.role !== "DEPARTMENT_ADMIN") {
        if (data.role === "CITIZEN") {
          navigate("/dashboard")
          return
        }

        if (data.role === "OFFICER") {
          navigate("/officer-dashboard")
          return
        }

        if (data.role === "WARD_ADMIN") {
          navigate("/ward-dashboard")
          return
        }

        if (data.role === "SUPER_ADMIN") {
          navigate("/admin-dashboard")
          return
        }
      }

      setProfile(data)

      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
      })

      setPhotoPreview(data.profile_photo_url || "")
    } catch (err) {
      console.error(err)
      setError(
        err.message || "Unable to load profile."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  /* =========================
     INPUT CHANGE
  ========================= */

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setMessage("")
    setError("")
  }

  /* =========================
     PHOTO CHANGE
  ========================= */

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]

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

    setPhotoPreview(
      URL.createObjectURL(file)
    )

    setMessage("")
    setError("")
  }

  /* =========================
     SAVE PROFILE
  ========================= */

  const handleSave = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setMessage("")
      setError("")

      const token = getToken()

      if (!token) {
        navigate("/login")
        return
      }

      const body = new FormData()

      body.append(
        "full_name",
        formData.full_name.trim()
      )

      body.append(
        "phone",
        formData.phone.trim()
      )

      if (selectedPhoto) {
        body.append(
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
          body,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to update profile."
        )
      }

      setProfile(data)

      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
      })

      setPhotoPreview(
        data.profile_photo_url || ""
      )

      setSelectedPhoto(null)

      /* Update local storage */
      localStorage.setItem(
        "ciip_full_name",
        data.full_name || ""
      )

      if (data.profile_photo_url) {
        localStorage.setItem(
          "ciip_profile_photo",
          data.profile_photo_url
        )
      }

      setMessage(
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

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("ciip_token")
    localStorage.removeItem("ciip_username")
    localStorage.removeItem("ciip_role")
    localStorage.removeItem("ciip_full_name")
    localStorage.removeItem("ciip_profile_photo")

    sessionStorage.removeItem("ciip_token")
    sessionStorage.removeItem("ciip_username")
    sessionStorage.removeItem("ciip_role")
    sessionStorage.removeItem("ciip_full_name")
    sessionStorage.removeItem("ciip_profile_photo")

    navigate("/login")
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="dap-loading-page">
        <div className="dap-spinner"></div>

        <h3>Loading Profile</h3>

        <p>
          Please wait...
        </p>
      </div>
    )
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <div className="dap-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="dap-header">

        <div className="dap-header-left">

          <button
            type="button"
            className="dap-back-btn"
            onClick={() =>
              navigate(
                "/department-dashboard"
              )
            }
          >
            ←
          </button>

          <div className="dap-header-title">

            <span>
              CIIP GOVERNMENT PORTAL
            </span>

            <h1>
              My Profile
            </h1>

          </div>

        </div>

        <button
          type="button"
          className="dap-dashboard-btn"
          onClick={() =>
            navigate(
              "/department-dashboard"
            )
          }
        >
          Dashboard
        </button>

      </header>

      {/* =========================
          MAIN
      ========================= */}

      <main className="dap-main">

        {/* INTRO */}

        <div className="dap-intro">

          <span>
            ACCOUNT SETTINGS
          </span>

          <h2>
            Department Administrator Profile
          </h2>

          <p>
            Update your personal information while
            official department information remains
            controlled by the system.
          </p>

        </div>

        {/* SUCCESS */}

        {message && (
          <div className="dap-alert dap-success">

            <span>
              ✓
            </span>

            <span>
              {message}
            </span>

          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="dap-alert dap-error">

            <span>
              ⚠
            </span>

            <span>
              {error}
            </span>

          </div>
        )}

        {/* =========================
            PROFILE LAYOUT
        ========================= */}

        <div className="dap-layout">

          {/* =========================
              LEFT SIDEBAR
          ========================= */}

          <aside className="dap-sidebar">

            {/* PHOTO */}

            <div className="dap-photo-wrapper">

              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Department Administrator"
                  className="dap-photo"
                />
              ) : (
                <div className="dap-photo-placeholder">
                  {(
                    profile?.full_name ||
                    profile?.username ||
                    "D"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <button
                type="button"
                className="dap-photo-edit"
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                ✎
              </button>

            </div>

            {/* HIDDEN FILE INPUT */}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />

            {/* NAME */}

            <h3 className="dap-sidebar-name">
              {profile?.full_name ||
                profile?.username ||
                "Department Admin"}
            </h3>

            {/* ROLE TEXT */}

            <p className="dap-sidebar-role">
              Department Administrator
            </p>

            {/* DIVIDER */}

            <div className="dap-sidebar-divider"></div>

            {/* =========================
                ACCOUNT INFORMATION
            ========================= */}

            <div className="dap-info-list">

              {/* USERNAME */}

              <div className="dap-info-row">

                <span className="dap-info-label">
                  Username
                </span>

                <strong className="dap-info-value">
                  {profile?.username || "—"}
                </strong>

              </div>

              {/* ROLE */}

              <div className="dap-info-row">

                <span className="dap-info-label">
                  Role
                </span>

                <strong className="dap-info-value">
                  {profile?.role ||
                    "DEPARTMENT_ADMIN"}
                </strong>

              </div>

              {/* DEPARTMENT */}

              <div className="dap-info-row">

                <span className="dap-info-label">
                  Department
                </span>

                <strong className="dap-info-value">
                  {profile
                    ?.department_details
                    ?.name || "—"}
                </strong>

              </div>

              {/* DEPARTMENT CODE */}

              <div className="dap-info-row">

                <span className="dap-info-label">
                  Department Code
                </span>

                <strong className="dap-info-value">
                  {profile
                    ?.department_details
                    ?.code || "—"}
                </strong>

              </div>

              {/* WARD */}

              {profile?.ward_details && (
                <div className="dap-info-row">

                  <span className="dap-info-label">
                    Ward
                  </span>

                  <strong className="dap-info-value">
                    Ward{" "}
                    {
                      profile
                        .ward_details
                        .ward_number
                    }
                  </strong>

                </div>
              )}

            </div>

            {/* LOGOUT */}

            <button
              type="button"
              className="dap-logout-btn"
              onClick={handleLogout}
            >
              ↪ Logout
            </button>

          </aside>

          {/* =========================
              RIGHT FORM
          ========================= */}

          <section className="dap-form-card">

            {/* PERSONAL INFORMATION HEADER */}

            <div className="dap-section-header">

              <div>
                <span>
                  PERSONAL INFORMATION
                </span>

                <h3>
                  Edit Profile
                </h3>
              </div>

              <span className="dap-editable-badge">
                Editable
              </span>

            </div>

            <form onSubmit={handleSave}>

              {/* =========================
                  EDITABLE FIELDS
              ========================= */}

              <div className="dap-form-grid">

                {/* FULL NAME */}

                <div className="dap-field">

                  <label htmlFor="dap-full-name">
                    Full Name
                  </label>

                  <input
                    id="dap-full-name"
                    type="text"
                    name="full_name"
                    value={
                      formData.full_name
                    }
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />

                  <small>
                    This name will be displayed
                    across the portal.
                  </small>

                </div>

                {/* PHONE */}

                <div className="dap-field">

                  <label htmlFor="dap-phone">
                    Phone Number
                  </label>

                  <input
                    id="dap-phone"
                    type="tel"
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />

                  <small>
                    Keep your active contact
                    number updated.
                  </small>

                </div>

              </div>

              {/* DIVIDER */}

              <div className="dap-section-divider"></div>

              {/* =========================
                  OFFICIAL INFORMATION
              ========================= */}

              <div className="dap-section-header dap-official-header">

                <div>
                  <span>
                    OFFICIAL INFORMATION
                  </span>

                  <h3>
                    System Managed Information
                  </h3>
                </div>

                <span className="dap-readonly-badge">
                  Read Only
                </span>

              </div>

              {/* READ ONLY GRID */}

              <div className="dap-readonly-grid">

                {/* USERNAME */}

                <div className="dap-readonly-card">

                  <label>
                    Username
                  </label>

                  <div>
                    {profile?.username ||
                      "—"}
                  </div>

                </div>

                {/* ROLE */}

                <div className="dap-readonly-card">

                  <label>
                    Role
                  </label>

                  <div>
                    {profile?.role ||
                      "DEPARTMENT_ADMIN"}
                  </div>

                </div>

                {/* DEPARTMENT */}

                <div className="dap-readonly-card">

                  <label>
                    Department
                  </label>

                  <div>
                    {profile
                      ?.department_details
                      ?.name || "—"}
                  </div>

                </div>

                {/* DEPARTMENT CODE */}

                <div className="dap-readonly-card">

                  <label>
                    Department Code
                  </label>

                  <div>
                    {profile
                      ?.department_details
                      ?.code || "—"}
                  </div>

                </div>

                {/* WARD */}

                <div className="dap-readonly-card">

                  <label>
                    Ward
                  </label>

                  <div>
                    {profile?.ward_details
                      ? `Ward ${profile.ward_details.ward_number} - ${profile.ward_details.name}`
                      : "Not assigned"}
                  </div>

                </div>

                {/* STATUS */}

                <div className="dap-readonly-card">

                  <label>
                    Account Status
                  </label>

                  <div className="dap-active-status">
                    Active
                  </div>

                </div>

              </div>

              {/* =========================
                  FOOTER
              ========================= */}

              <div className="dap-form-footer">

                <div className="dap-photo-help">

                  <strong>
                    Profile Photo
                  </strong>

                  <span>
                    JPG, PNG or WEBP • Maximum
                    5 MB
                  </span>

                </div>

                <div className="dap-form-actions">

                  <button
                    type="button"
                    className="dap-cancel-btn"
                    onClick={() =>
                      navigate(
                        "/department-dashboard"
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="dap-save-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </div>

            </form>

          </section>

        </div>

      </main>

    </div>
  )
}

export default DepartmentProfile