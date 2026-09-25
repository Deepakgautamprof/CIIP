import React, { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./CitizenDashboard.css"

const API_BASE = "http://127.0.0.1:8000/api"

function CitizenDashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const [token, setToken] = useState(
    () => localStorage.getItem("ciip_token")
  )

  const username =
    localStorage.getItem("ciip_username") || "Citizen"

  const savedName =
    localStorage.getItem("ciip_full_name")

  const savedPhoto =
    localStorage.getItem("ciip_profile_photo_url")

  const savedWardNumber =
    localStorage.getItem("ciip_ward_number")

  const savedWardName =
    localStorage.getItem("ciip_ward_name")

  const savedWardCity =
    localStorage.getItem("ciip_ward_city")

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [profile, setProfile] = useState({
    name: savedName || username,
    photo: savedPhoto || "",
  })

  const [ward, setWard] = useState({
    id: null,
    number: savedWardNumber || "",
    name: savedWardName || "",
    city: savedWardCity || "",
    assigned: Boolean(
      savedWardNumber || savedWardName
    ),
  })

  // ==========================================================
  // AUTH CHECK
  // ==========================================================

  useEffect(() => {
    const currentToken =
      localStorage.getItem("ciip_token")

    if (!currentToken) {
      navigate("/login", { replace: true })
      return
    }

    setToken(currentToken)
  }, [navigate])

  // ==========================================================
  // LOAD DASHBOARD DATA
  // ==========================================================

  useEffect(() => {
    if (!token) return

    loadProfile()
    loadComplaints()
  }, [token])

  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  const loadProfile = async () => {
    const currentToken =
      localStorage.getItem("ciip_token")

    if (!currentToken) {
      navigate("/login", { replace: true })
      return
    }

    try {
      const response = await fetch(
        `${API_BASE}/users/profile/`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Token ${currentToken}`,
          },
        }
      )

      // ------------------------------------------------------
      // TOKEN INVALID / EXPIRED / MISSING
      // ------------------------------------------------------

      if (response.status === 401) {
        console.log(
          "Profile authentication failed."
        )

        localStorage.removeItem("ciip_token")
        localStorage.removeItem("ciip_username")
        localStorage.removeItem("ciip_full_name")
        localStorage.removeItem("ciip_role")
        localStorage.removeItem(
          "ciip_profile_photo_url"
        )

        localStorage.removeItem(
          "ciip_ward_number"
        )
        localStorage.removeItem(
          "ciip_ward_name"
        )
        localStorage.removeItem(
          "ciip_ward_city"
        )

        navigate("/login", { replace: true })
        return
      }

      if (!response.ok) {
        console.log(
          "Profile API failed:",
          response.status
        )
        return
      }

      const data = await response.json()

      console.log(
        "CIIP PROFILE RESPONSE:",
        data
      )

      // ======================================================
      // PROFILE DATA
      // ======================================================

      const name =
        data.full_name ||
        data.username ||
        username

      const photo =
        data.profile_photo_url || ""

      setProfile({
        name,
        photo,
      })

      localStorage.setItem(
        "ciip_full_name",
        name
      )

      if (photo) {
        localStorage.setItem(
          "ciip_profile_photo_url",
          photo
        )
      }

      // ======================================================
      // WARD DATA
      // ======================================================

      /*
       * ProfileSerializer should return:
       *
       * ward: 2
       *
       * ward_details: {
       *     id: 2,
       *     ward_number: "42",
       *     name: "Gomati Nagar",
       *     city: "Lucknow"
       * }
       */

      let wardData = null

      if (
        data.ward_details &&
        typeof data.ward_details === "object"
      ) {
        wardData = data.ward_details
      }

      /*
       * Fallback:
       * Some backend responses may return the
       * complete ward object directly.
       */

      if (
        !wardData &&
        data.ward &&
        typeof data.ward === "object"
      ) {
        wardData = data.ward
      }

      // ------------------------------------------------------
      // WARD FOUND
      // ------------------------------------------------------

      if (wardData) {
        const wardId =
          wardData.id ||
          null

        const wardNumber =
          wardData.ward_number ||
          wardData.number ||
          ""

        const wardName =
          wardData.name ||
          wardData.ward_name ||
          ""

        const wardCity =
          wardData.city ||
          wardData.city_name ||
          ""

        console.log(
          "CIIP WARD:",
          wardData
        )

        setWard({
          id: wardId,
          number: wardNumber,
          name: wardName,
          city: wardCity,
          assigned: Boolean(
            wardNumber || wardName
          ),
        })

        if (wardNumber) {
          localStorage.setItem(
            "ciip_ward_number",
            String(wardNumber)
          )
        }

        if (wardName) {
          localStorage.setItem(
            "ciip_ward_name",
            String(wardName)
          )
        }

        if (wardCity) {
          localStorage.setItem(
            "ciip_ward_city",
            String(wardCity)
          )
        }

        return
      }

      // ------------------------------------------------------
      // BACKEND ONLY RETURNS ward = 2
      // ------------------------------------------------------
      //
      // If ProfileSerializer doesn't currently return
      // ward_details, fetch the ward directly.
      //

      if (
        data.ward &&
        typeof data.ward === "number"
      ) {
        try {
          const wardResponse =
            await fetch(
              `${API_BASE}/wards/${data.ward}/`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  Authorization:
                    `Token ${currentToken}`,
                },
              }
            )

          if (wardResponse.ok) {
            const wardObject =
              await wardResponse.json()

            console.log(
              "CIIP WARD API RESPONSE:",
              wardObject
            )

            const wardNumber =
              wardObject.ward_number || ""

            const wardName =
              wardObject.name || ""

            const wardCity =
              wardObject.city || ""

            setWard({
              id: wardObject.id || data.ward,
              number: wardNumber,
              name: wardName,
              city: wardCity,
              assigned: Boolean(
                wardNumber || wardName
              ),
            })

            if (wardNumber) {
              localStorage.setItem(
                "ciip_ward_number",
                String(wardNumber)
              )
            }

            if (wardName) {
              localStorage.setItem(
                "ciip_ward_name",
                String(wardName)
              )
            }

            if (wardCity) {
              localStorage.setItem(
                "ciip_ward_city",
                String(wardCity)
              )
            }

            return
          }
        } catch (wardError) {
          console.log(
            "Ward API failed:",
            wardError
          )
        }
      }

      // ------------------------------------------------------
      // NO WARD
      // ------------------------------------------------------

      setWard({
        id: null,
        number: "",
        name: "",
        city: "",
        assigned: false,
      })

      localStorage.removeItem(
        "ciip_ward_number"
      )

      localStorage.removeItem(
        "ciip_ward_name"
      )

      localStorage.removeItem(
        "ciip_ward_city"
      )

    } catch (err) {
      console.log(
        "Profile loading failed:",
        err
      )
    }
  }

  // ==========================================================
  // LOAD COMPLAINTS
  // ==========================================================

  const loadComplaints = async () => {
    const currentToken =
      localStorage.getItem("ciip_token")

    if (!currentToken) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${API_BASE}/complaints/`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization:
              `Token ${currentToken}`,
          },
        }
      )

      if (response.status === 401) {
        localStorage.removeItem(
          "ciip_token"
        )

        navigate("/login", {
          replace: true,
        })

        return
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load complaints"
        )
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setComplaints(data)
      } else if (
        Array.isArray(data.results)
      ) {
        setComplaints(data.results)
      } else {
        setComplaints([])
      }

    } catch (err) {
      console.log(
        "Complaint loading failed:",
        err
      )

      setComplaints([])

      setError(
        "Complaints could not be loaded. Please refresh the page."
      )

    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {

    localStorage.removeItem("ciip_token")
    localStorage.removeItem("ciip_username")
    localStorage.removeItem("ciip_full_name")
    localStorage.removeItem("ciip_role")
    localStorage.removeItem(
      "ciip_profile_photo_url"
    )

    localStorage.removeItem(
      "ciip_ward_number"
    )

    localStorage.removeItem(
      "ciip_ward_name"
    )

    localStorage.removeItem(
      "ciip_ward_city"
    )

    setToken(null)

    navigate("/login", {
      replace: true,
    })
  }

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const goTo = (path) => {
    setSidebarOpen(false)
    navigate(path)
  }

  const isOverview =
    location.pathname === "/dashboard"

  // ==========================================================
  // COMPLAINT STATISTICS
  // ==========================================================

  const totalComplaints =
    complaints.length

  const activeComplaints =
    complaints.filter((complaint) =>
      [
        "SUBMITTED",
        "UNDER_REVIEW",
        "APPROVED",
        "ASSIGNED",
        "IN_PROGRESS",
        "REOPENED",
      ].includes(complaint.status)
    ).length

  const resolvedComplaints =
    complaints.filter((complaint) =>
      [
        "RESOLVED",
        "VERIFIED",
        "CLOSED",
      ].includes(complaint.status)
    ).length

  const submittedComplaints =
    complaints.filter((complaint) =>
      [
        "SUBMITTED",
        "UNDER_REVIEW",
      ].includes(complaint.status)
    ).length

  // ==========================================================
  // STATUS HELPERS
  // ==========================================================

  const getStatusClass = (status) => {

    switch (status) {

      case "SUBMITTED":
        return "status-submitted"

      case "UNDER_REVIEW":
        return "status-review"

      case "APPROVED":
        return "status-approved"

      case "ASSIGNED":
        return "status-assigned"

      case "IN_PROGRESS":
        return "status-progress"

      case "RESOLVED":
        return "status-resolved"

      case "VERIFIED":
        return "status-verified"

      case "CLOSED":
        return "status-closed"

      case "REOPENED":
        return "status-reopened"

      default:
        return "status-default"
    }
  }

  const getPriorityClass = (priority) => {

    switch (priority) {

      case "CRITICAL":
        return "priority-critical"

      case "HIGH":
        return "priority-high"

      case "MEDIUM":
        return "priority-medium"

      case "LOW":
        return "priority-low"

      default:
        return "priority-default"
    }
  }

  const formatStatus = (status) => {

    if (!status) return "Unknown"

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      )
  }

  const formatCategory = (category) => {

    if (!category) {
      return "Civic Issue"
    }

    return category
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      )
  }

  const formatDate = (date) => {

    if (!date) {
      return "Date unavailable"
    }

    const parsedDate =
      new Date(date)

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Date unavailable"
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    )
  }

  const recentComplaints =
    complaints.slice(0, 5)

  // ==========================================================
  // NO TOKEN
  // ==========================================================

  if (!token) {
    return null
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="citizen-dashboard">

      {/* MOBILE HEADER */}

      <div className="mobile-header">

        <button
          className="mobile-menu-button"
          onClick={() =>
            setSidebarOpen(!sidebarOpen)
          }
        >
          ☰
        </button>

        <div className="mobile-brand">

          <div className="mobile-brand-icon">
            CI
          </div>

          <span>
            CIIP
          </span>

        </div>

        <button
          className="mobile-profile-button"
          onClick={() =>
            goTo("/profile")
          }
        >

          {profile.photo ? (

            <img
              src={profile.photo}
              alt="Profile"
            />

          ) : (

            <span>
              {profile.name
                .charAt(0)
                .toUpperCase()}
            </span>

          )}

        </button>

      </div>

      {/* OVERLAY */}

      {sidebarOpen && (

        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />

      )}

      {/* SIDEBAR */}

      <aside
        className={`citizen-sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >

        <div className="sidebar-brand">

          <div className="brand-logo">
            CI
          </div>

          <div>

            <h2>
              CIIP
            </h2>

            <span>
              Civic Intelligence
            </span>

          </div>

        </div>

        <div className="citizen-mini-profile">

          <div className="mini-profile-photo">

            {profile.photo ? (

              <img
                src={profile.photo}
                alt="Profile"
              />

            ) : (

              <span>
                {profile.name
                  .charAt(0)
                  .toUpperCase()}
              </span>

            )}

          </div>

          <div className="mini-profile-info">

            <strong>
              {profile.name}
            </strong>

            <span>
              Citizen
            </span>

          </div>

        </div>

        <div className="sidebar-section-title">
          MAIN MENU
        </div>

        <nav className="sidebar-navigation">

          <button
            className={`sidebar-item ${
              isOverview
                ? "active"
                : ""
            }`}
            onClick={() =>
              goTo("/dashboard")
            }
          >
            <span className="sidebar-icon">
              ⌂
            </span>

            <span>
              Overview
            </span>

          </button>

          <button
            className="sidebar-item"
            onClick={() =>
              goTo("/complaint")
            }
          >

            <span className="sidebar-icon">
              ＋
            </span>

            <span>
              Register Complaint
            </span>

          </button>

          <button
            className="sidebar-item"
            onClick={() =>
              goTo("/my-complaints")
            }
          >

            <span className="sidebar-icon">
              ▤
            </span>

            <span>
              My Complaints
            </span>

          </button>

          <button
            className="sidebar-item"
            onClick={() =>
              goTo("/my-complaints")
            }
          >

            <span className="sidebar-icon">
              ⌖
            </span>

            <span>
              Track Complaint
            </span>

          </button>

        </nav>

        <div className="sidebar-section-title second-section">
          ACCOUNT
        </div>

        <nav className="sidebar-navigation">

          <button
            className="sidebar-item"
            onClick={() =>
              goTo("/profile")
            }
          >

            <span className="sidebar-icon">
              ◉
            </span>

            <span>
              My Profile
            </span>

          </button>

          <button
            className="sidebar-item"
            onClick={() =>
              alert(
                "Settings will be available soon."
              )
            }
          >

            <span className="sidebar-icon">
              ⚙
            </span>

            <span>
              Settings
            </span>

          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="help-card">

            <div className="help-icon">
              ?
            </div>

            <div>

              <strong>
                Need Help?
              </strong>

              <span>
                Contact civic support
              </span>

            </div>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >

            <span>
              ↪
            </span>

            Logout

          </button>

        </div>

      </aside>

      {/* MAIN AREA */}

      <main className="citizen-main">

        {/* TOP BAR */}

        <header className="citizen-topbar">

          <div className="topbar-left">

            <div>

              <span className="topbar-label">
                CITIZEN PORTAL
              </span>

              <h1>
                Dashboard Overview
              </h1>

            </div>

          </div>

          <div className="topbar-right">

            <button
              className="notification-button"
              title="Notifications"
            >
              🔔
              <span className="notification-dot" />
            </button>

            <div
              className="top-profile"
              onClick={() =>
                goTo("/profile")
              }
            >

              <div className="top-profile-photo">

                {profile.photo ? (

                  <img
                    src={profile.photo}
                    alt="Profile"
                  />

                ) : (

                  <span>
                    {profile.name
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                )}

              </div>

              <div className="top-profile-text">

                <strong>
                  {profile.name}
                </strong>

                <span>
                  Citizen
                </span>

              </div>

              <span className="profile-arrow">
                ⌄
              </span>

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <section className="dashboard-content">

          {/* WELCOME */}

          <div className="welcome-section">

            <div>

              <p className="welcome-small">
                Welcome back,
              </p>

              <h2>
                {profile.name} 👋
              </h2>

              <p className="welcome-description">
                Track your civic complaints and help improve
                your community.
              </p>

            </div>

            <button
              className="primary-complaint-button"
              onClick={() =>
                goTo("/complaint")
              }
            >

              <span>
                ＋
              </span>

              Register New Complaint

            </button>

          </div>

          {/* MY WARD */}

          <div
            style={{
              marginBottom: "24px",
              padding: "20px 22px",
              borderRadius: "16px",
              background: ward.assigned
                ? "linear-gradient(135deg, #eef6ff 0%, #f8fbff 100%)"
                : "#f8f8f8",
              border: ward.assigned
                ? "1px solid #d6e7ff"
                : "1px solid #e5e5e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >

              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: ward.assigned
                    ? "#e1efff"
                    : "#eeeeee",
                  fontSize: "25px",
                }}
              >
                🏙️
              </div>

              <div>

                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "1px",
                    color: "#6b7280",
                    marginBottom: "5px",
                  }}
                >
                  MY WARD
                </span>

                {ward.assigned ? (

                  <>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "19px",
                        color: "#172033",
                        marginBottom: "3px",
                      }}
                    >
                      Ward {ward.number}

                      {ward.name
                        ? ` — ${ward.name}`
                        : ""}

                    </strong>

                    <span
                      style={{
                        fontSize: "13px",
                        color: "#667085",
                      }}
                    >
                      {ward.city ||
                        "City information unavailable"}
                    </span>

                  </>

                ) : (

                  <>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "18px",
                        color: "#4b5563",
                        marginBottom: "3px",
                      }}
                    >
                      Ward Not Assigned
                    </strong>

                    <span
                      style={{
                        fontSize: "13px",
                        color: "#7b8190",
                      }}
                    >
                      Your ward has not been assigned yet.
                    </span>

                  </>

                )}

              </div>

            </div>

            <div
              style={{
                padding: "8px 13px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "700",
                background: ward.assigned
                  ? "#dcfce7"
                  : "#eeeeee",
                color: ward.assigned
                  ? "#166534"
                  : "#6b7280",
              }}
            >
              {ward.assigned
                ? "WARD ASSIGNED"
                : "PENDING ASSIGNMENT"}
            </div>

          </div>

          {/* ERROR */}

          {error && (

            <div className="dashboard-error">

              <span>
                ⚠
              </span>

              <div>

                <strong>
                  Unable to load complaint data
                </strong>

                <p>
                  {error}
                </p>

              </div>

              <button
                onClick={loadComplaints}
              >
                Retry
              </button>

            </div>

          )}

          {/* STAT CARDS */}

          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-card-top">

                <div className="stat-icon total-icon">
                  ▤
                </div>

                <span className="stat-label">
                  TOTAL
                </span>

              </div>

              <div className="stat-value">
                {loading
                  ? "—"
                  : totalComplaints}
              </div>

              <div className="stat-description">
                All complaints submitted
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-card-top">

                <div className="stat-icon submitted-icon">
                  ◷
                </div>

                <span className="stat-label">
                  SUBMITTED
                </span>

              </div>

              <div className="stat-value">
                {loading
                  ? "—"
                  : submittedComplaints}
              </div>

              <div className="stat-description">
                Waiting for action
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-card-top">

                <div className="stat-icon active-icon">
                  ↻
                </div>

                <span className="stat-label">
                  ACTIVE
                </span>

              </div>

              <div className="stat-value">
                {loading
                  ? "—"
                  : activeComplaints}
              </div>

              <div className="stat-description">
                Currently being processed
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-card-top">

                <div className="stat-icon resolved-icon">
                  ✓
                </div>

                <span className="stat-label">
                  RESOLVED
                </span>

              </div>

              <div className="stat-value">
                {loading
                  ? "—"
                  : resolvedComplaints}
              </div>

              <div className="stat-description">
                Successfully resolved
              </div>

            </div>

          </div>

          {/* TWO COLUMN AREA */}

          <div className="dashboard-columns">

            {/* RECENT COMPLAINTS */}

            <div className="dashboard-panel complaints-panel">

              <div className="panel-header">

                <div>

                  <span className="panel-kicker">
                    ACTIVITY
                  </span>

                  <h3>
                    Recent Complaints
                  </h3>

                </div>

                <button
                  className="view-all-button"
                  onClick={() =>
                    goTo("/my-complaints")
                  }
                >
                  View All →
                </button>

              </div>

              <div className="complaints-list">

                {loading ? (

                  <div className="empty-state">

                    <div className="loading-spinner" />

                    <p>
                      Loading complaints...
                    </p>

                  </div>

                ) : recentComplaints.length === 0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">
                      ▤
                    </div>

                    <h4>
                      No complaints yet
                    </h4>

                    <p>
                      You have not registered any civic complaint.
                    </p>

                    <button
                      onClick={() =>
                        goTo("/complaint")
                      }
                    >
                      Register Your First Complaint
                    </button>

                  </div>

                ) : (

                  recentComplaints.map(
                    (complaint) => (

                      <div
                        className="complaint-row"
                        key={
                          complaint.id ||
                          complaint.complaint_id
                        }
                      >

                        <div className="complaint-main">

                          <div className="complaint-category-icon">

                            {complaint.category ===
                            "POTHOLE"
                              ? "🚧"
                              : complaint.category ===
                                "GARBAGE"
                                ? "🗑"
                                : complaint.category ===
                                  "STREETLIGHT"
                                  ? "💡"
                                  : complaint.category ===
                                    "WATER_LEAKAGE"
                                    ? "💧"
                                    : complaint.category ===
                                      "DRAINAGE"
                                      ? "🌊"
                                      : "🏙"}

                          </div>

                          <div className="complaint-info">

                            <strong>
                              {formatCategory(
                                complaint.category
                              )}
                            </strong>

                            <span>
                              {complaint.complaint_id ||
                                `Complaint #${complaint.id}`}
                            </span>

                            <small>
                              {formatDate(
                                complaint.created_at
                              )}
                            </small>

                          </div>

                        </div>

                        <div className="complaint-middle">

                          <span
                            className={`status-badge ${getStatusClass(
                              complaint.status
                            )}`}
                          >
                            {formatStatus(
                              complaint.status
                            )}
                          </span>

                          <span
                            className={`priority-badge ${getPriorityClass(
                              complaint.priority
                            )}`}
                          >
                            {complaint.priority ||
                              "N/A"}
                          </span>

                        </div>

                        <button
                          className="complaint-view-button"
                          onClick={() =>
                            goTo(
                              "/my-complaints"
                            )
                          }
                        >
                          View
                        </button>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

            {/* QUICK ACTIONS */}

            <div className="dashboard-panel quick-panel">

              <div className="panel-header">

                <div>

                  <span className="panel-kicker">
                    ACTIONS
                  </span>

                  <h3>
                    Quick Actions
                  </h3>

                </div>

              </div>

              <div className="quick-actions">

                <button
                  className="quick-action complaint-action"
                  onClick={() =>
                    goTo("/complaint")
                  }
                >

                  <div className="quick-action-icon">
                    ＋
                  </div>

                  <div>

                    <strong>
                      Register Complaint
                    </strong>

                    <span>
                      Report a civic issue
                    </span>

                  </div>

                  <b>
                    →
                  </b>

                </button>

                <button
                  className="quick-action"
                  onClick={() =>
                    goTo("/my-complaints")
                  }
                >

                  <div className="quick-action-icon">
                    ▤
                  </div>

                  <div>

                    <strong>
                      My Complaints
                    </strong>

                    <span>
                      View all your complaints
                    </span>

                  </div>

                  <b>
                    →
                  </b>

                </button>

                <button
                  className="quick-action"
                  onClick={() =>
                    goTo("/my-complaints")
                  }
                >

                  <div className="quick-action-icon">
                    ⌖
                  </div>

                  <div>

                    <strong>
                      Track Complaint
                    </strong>

                    <span>
                      Check complaint progress
                    </span>

                  </div>

                  <b>
                    →
                  </b>

                </button>

                <button
                  className="quick-action"
                  onClick={() =>
                    goTo("/profile")
                  }
                >

                  <div className="quick-action-icon">
                    ◉
                  </div>

                  <div>

                    <strong>
                      My Profile
                    </strong>

                    <span>
                      Update your information
                    </span>

                  </div>

                  <b>
                    →
                  </b>

                </button>

              </div>

            </div>

          </div>

          {/* CIVIC INFO */}

          <div className="civic-info-banner">

            <div className="civic-info-icon">
              🏙
            </div>

            <div className="civic-info-content">

              <span>
                CIIP COMMUNITY
              </span>

              <h3>
                Your complaint helps improve the city
              </h3>

              <p>
                Every complaint submitted through CIIP
                helps government departments identify
                and resolve civic infrastructure problems.
              </p>

            </div>

            <button
              onClick={() =>
                goTo("/complaint")
              }
            >
              Report an Issue →
            </button>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="citizen-footer">

          <span>
            © 2026 CIIP
          </span>

          <span>
            Civic Infrastructure Intelligence Platform
          </span>

          <span>
            Citizen Portal
          </span>

        </footer>

      </main>

    </div>
  )
}

export default CitizenDashboard