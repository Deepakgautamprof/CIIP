import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_BASE = "http://127.0.0.1:8000/api"

function OfficerProfile() {
  const navigate = useNavigate()

  const token = localStorage.getItem("ciip_token")
  const role = localStorage.getItem("ciip_role")

  const [profile, setProfile] = useState(null)
  const [officer, setOfficer] = useState(null)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [preview, setPreview] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    if (role !== "OFFICER") {
      navigate("/login")
      return
    }

    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError("")

      // --------------------------------
      // 1. USER PROFILE DATA
      // --------------------------------
      const profileResponse = await fetch(
        `${API_BASE}/users/profile/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      )

      if (!profileResponse.ok) {
        throw new Error("Unable to load user profile.")
      }

      const profileData = await profileResponse.json()

      setProfile(profileData)

      setFullName(profileData.full_name || "")
      setPhone(profileData.phone || "")

      if (profileData.profile_photo_url) {
        setPreview(profileData.profile_photo_url)
      }

      // --------------------------------
      // 2. OFFICER DATA
      // --------------------------------
      const officerResponse = await fetch(
        `${API_BASE}/officers/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      )

      if (!officerResponse.ok) {
        throw new Error("Unable to load officer details.")
      }

      const officerData = await officerResponse.json()

      console.log("Officer API response:", officerData)

      /*
        Officer API returns a list because it is a ViewSet.

        Example:
        [
          {
            "id": 1,
            "user": 5,
            "user_name": "...",
            "full_name": "...",
            "department": 1,
            "department_name": "...",
            "employee_id": "...",
            "designation": "...",
            "ward": 2,
            "ward_number": "42",
            "ward_name": "Gomati Nagar"
          }
        ]
      */

      let officerInfo = null

      if (Array.isArray(officerData)) {
        officerInfo = officerData.find(
          (item) =>
            String(item.user) === String(profileData.id)
        )

        // Agar filtering already current officer ka data de rahi hai
        if (!officerInfo && officerData.length > 0) {
          officerInfo = officerData[0]
        }
      } else if (officerData.results) {
        officerInfo = officerData.results.find(
          (item) =>
            String(item.user) === String(profileData.id)
        )

        if (!officerInfo && officerData.results.length > 0) {
          officerInfo = officerData.results[0]
        }
      }

      setOfficer(officerInfo)

    } catch (err) {
      console.error(err)
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    setProfilePhoto(file)

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setMessage("")
      setError("")

      const formData = new FormData()

      formData.append("full_name", fullName)
      formData.append("phone", phone)

      if (profilePhoto) {
        formData.append("profile_photo", profilePhoto)
      }

      const response = await fetch(
        `${API_BASE}/users/profile/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Token ${token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error(data)
        throw new Error(
          data.detail || "Unable to update profile."
        )
      }

      setProfile(data)

      setFullName(data.full_name || "")
      setPhone(data.phone || "")

      if (data.profile_photo_url) {
        setPreview(data.profile_photo_url)

        localStorage.setItem(
          "ciip_profile_photo_url",
          data.profile_photo_url
        )
      }

      localStorage.setItem(
        "ciip_full_name",
        data.full_name || ""
      )

      setProfilePhoto(null)

      setMessage("Profile updated successfully.")

    } catch (err) {
      console.error(err)
      setError(err.message || "Failed to update profile.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          Loading officer profile...
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <header style={styles.header}>

        <div>
          <h1 style={styles.logo}>
            CIIP
          </h1>

          <div style={styles.logoSubtitle}>
            Civic Infrastructure Intelligence Platform
          </div>
        </div>

        <button
          style={styles.backButton}
          onClick={() => navigate("/officer-dashboard")}
        >
          ← Dashboard
        </button>

      </header>


      {/* MAIN */}
      <main style={styles.main}>

        <div style={styles.card}>

          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.title}>
                Officer Profile
              </h2>

              <p style={styles.subtitle}>
                View and update your personal information
              </p>
            </div>
          </div>


          {/* PROFILE PHOTO */}
          <div style={styles.photoSection}>

            <div style={styles.photoWrapper}>

              {preview ? (
                <img
                  src={preview}
                  alt="Officer"
                  style={styles.profileImage}
                />
              ) : (
                <div style={styles.avatar}>
                  {(
                    fullName ||
                    profile?.username ||
                    "O"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

            </div>

            <div>
              <label style={styles.photoButton}>
                Change Profile Photo

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
              </label>

              <p style={styles.photoHint}>
                JPG, PNG or WEBP
              </p>
            </div>

          </div>


          {/* ERROR */}
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}


          {/* SUCCESS */}
          {message && (
            <div style={styles.success}>
              {message}
            </div>
          )}


          <form onSubmit={handleSave}>

            {/* ========================= */}
            {/* PERSONAL INFORMATION */}
            {/* ========================= */}

            <h3 style={styles.sectionTitle}>
              Personal Information
            </h3>

            <div style={styles.grid}>

              <div style={styles.field}>
                <label style={styles.label}>
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  style={styles.input}
                  placeholder="Enter full name"
                />
              </div>


              <div style={styles.field}>
                <label style={styles.label}>
                  Phone Number
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  style={styles.input}
                  placeholder="Enter phone number"
                />
              </div>


              <div style={styles.field}>
                <label style={styles.label}>
                  Username
                </label>

                <input
                  type="text"
                  value={profile?.username || ""}
                  readOnly
                  style={styles.readOnlyInput}
                />

                <span style={styles.readOnlyText}>
                  Username cannot be changed.
                </span>
              </div>


              <div style={styles.field}>
                <label style={styles.label}>
                  Role
                </label>

                <input
                  type="text"
                  value="Officer"
                  readOnly
                  style={styles.readOnlyInput}
                />
              </div>

            </div>


            {/* ========================= */}
            {/* OFFICIAL INFORMATION */}
            {/* ========================= */}

            <h3 style={styles.sectionTitle}>
              Official Information
            </h3>

            <div style={styles.grid}>

              {/* EMPLOYEE ID */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Employee ID
                </label>

                <input
                  type="text"
                  value={
                    officer?.employee_id || "Not available"
                  }
                  readOnly
                  style={styles.readOnlyInput}
                />

                <span style={styles.readOnlyText}>
                  Employee ID cannot be changed.
                </span>
              </div>


              {/* DESIGNATION */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Designation
                </label>

                <input
                  type="text"
                  value={
                    officer?.designation || "Not available"
                  }
                  readOnly
                  style={styles.readOnlyInput}
                />

                <span style={styles.readOnlyText}>
                  Designation is assigned by administration.
                </span>
              </div>


              {/* DEPARTMENT */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Department
                </label>

                <input
                  type="text"
                  value={
                    officer?.department_name ||
                    "Not assigned"
                  }
                  readOnly
                  style={styles.readOnlyInput}
                />

                <span style={styles.readOnlyText}>
                  Department can only be changed by administration.
                </span>
              </div>


              {/* WARD */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Assigned Ward
                </label>

                <input
                  type="text"
                  value={
                    officer?.ward_number
                      ? `Ward ${officer.ward_number}${
                          officer?.ward_name
                            ? ` - ${officer.ward_name}`
                            : ""
                        }`
                      : "Not assigned"
                  }
                  readOnly
                  style={styles.readOnlyInput}
                />

                <span style={styles.readOnlyText}>
                  Ward assignment cannot be changed here.
                </span>
              </div>

            </div>


            {/* SAVE */}
            <div style={styles.actions}>

              <button
                type="button"
                onClick={() =>
                  navigate("/officer-dashboard")
                }
                style={styles.cancelButton}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                style={styles.saveButton}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  )
}


/* ================================= */
/* STYLES */
/* ================================= */

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    color: "#1f2937",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f7fb",
  },

  loadingCard: {
    background: "#ffffff",
    padding: "30px 40px",
    borderRadius: "14px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    fontSize: "16px",
  },

  header: {
    height: "74px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
  },

  logo: {
    margin: 0,
    fontSize: "25px",
    fontWeight: "800",
    color: "#1d4ed8",
  },

  logoSubtitle: {
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "2px",
  },

  backButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },

  main: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "40px 20px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    padding: "32px",
  },

  cardHeader: {
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "700",
  },

  subtitle: {
    marginTop: "7px",
    color: "#6b7280",
    fontSize: "14px",
  },

  photoSection: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
    paddingBottom: "28px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "28px",
  },

  photoWrapper: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
  },

  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  avatar: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    fontWeight: "700",
  },

  photoButton: {
    display: "inline-block",
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    padding: "9px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },

  photoHint: {
    margin: "7px 0 0",
    color: "#9ca3af",
    fontSize: "12px",
  },

  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "12px 14px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  success: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
    padding: "12px 14px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  sectionTitle: {
    fontSize: "17px",
    fontWeight: "700",
    margin: "28px 0 18px",
    paddingBottom: "10px",
    borderBottom: "1px solid #e5e7eb",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
  },

  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "7px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 13px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },

  readOnlyInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 13px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#f3f4f6",
    color: "#4b5563",
    cursor: "not-allowed",
  },

  readOnlyText: {
    marginTop: "5px",
    fontSize: "11px",
    color: "#9ca3af",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "35px",
    paddingTop: "22px",
    borderTop: "1px solid #e5e7eb",
  },

  cancelButton: {
    padding: "11px 20px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  saveButton: {
    padding: "11px 22px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
}

export default OfficerProfile