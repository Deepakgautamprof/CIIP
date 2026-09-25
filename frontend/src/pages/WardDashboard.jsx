import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./WardDashboard.css"

const API_BASE = "http://127.0.0.1:8000/api"

function WardDashboard() {
  const navigate = useNavigate()

  const [complaints, setComplaints] = useState([])
  const [profile, setProfile] = useState(null)
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeMenu, setActiveMenu] = useState("overview")
  const [selectedComplaint, setSelectedComplaint] = useState(null)

  const token = localStorage.getItem("ciip_token")
  const role = localStorage.getItem("ciip_role")

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    if (role !== "WARD_ADMIN") {
      navigate("/login")
      return
    }

    loadDashboard()
  }, [])

  const authHeaders = {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
  }

  const loadDashboard = async () => {
    setLoading(true)
    setError("")

    try {
      await Promise.all([
        fetchProfile(),
        fetchComplaints(),
        fetchOfficers(),
      ])
    } catch (err) {
      console.error(err)
      setError("Unable to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    const response = await fetch(`${API_BASE}/users/profile/`, {
      headers: authHeaders,
    })

    if (!response.ok) {
      throw new Error("Profile request failed")
    }

    const data = await response.json()
    setProfile(data)
  }

  const fetchComplaints = async () => {
    const response = await fetch(`${API_BASE}/complaints/`, {
      headers: authHeaders,
    })

    if (!response.ok) {
      throw new Error("Complaints request failed")
    }

    const data = await response.json()

    if (Array.isArray(data)) {
      setComplaints(data)
    } else if (Array.isArray(data.results)) {
      setComplaints(data.results)
    } else {
      setComplaints([])
    }
  }

  const fetchOfficers = async () => {
    try {
      const response = await fetch(`${API_BASE}/officers/`, {
        headers: authHeaders,
      })

      if (!response.ok) {
        setOfficers([])
        return
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setOfficers(data)
      } else if (Array.isArray(data.results)) {
        setOfficers(data.results)
      } else {
        setOfficers([])
      }
    } catch (err) {
      console.log("Officer API unavailable")
      setOfficers([])
    }
  }

  const logout = () => {
    localStorage.removeItem("ciip_token")
    localStorage.removeItem("ciip_username")
    localStorage.removeItem("ciip_full_name")
    localStorage.removeItem("ciip_role")
    localStorage.removeItem("ciip_ward")
    navigate("/login")
  }

  const ward = profile?.ward_details || profile?.ward

  const wardNumber =
    ward?.ward_number ||
    localStorage.getItem("ciip_ward") ||
    "N/A"

  const wardName =
    ward?.name ||
    "Ward Administration"

  const city =
    ward?.city ||
    "Lucknow"

  const statistics = useMemo(() => {
    const total = complaints.length

    const submitted = complaints.filter(
      (item) =>
        String(item.status || "").toUpperCase() === "SUBMITTED"
    ).length

    const underReview = complaints.filter(
      (item) =>
        String(item.status || "").toUpperCase() === "UNDER_REVIEW"
    ).length

    const assigned = complaints.filter(
      (item) =>
        String(item.status || "").toUpperCase() === "ASSIGNED"
    ).length

    const inProgress = complaints.filter(
      (item) =>
        String(item.status || "").toUpperCase() === "IN_PROGRESS"
    ).length

    const resolved = complaints.filter(
      (item) =>
        ["RESOLVED", "VERIFIED", "CLOSED"].includes(
          String(item.status || "").toUpperCase()
        )
    ).length

    const critical = complaints.filter(
      (item) =>
        String(item.priority || "").toUpperCase() === "CRITICAL"
    ).length

    const high = complaints.filter(
      (item) =>
        String(item.priority || "").toUpperCase() === "HIGH"
    ).length

    return {
      total,
      submitted,
      underReview,
      assigned,
      inProgress,
      resolved,
      critical,
      high,
    }
  }, [complaints])

  const recentComplaints = [...complaints]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })
    .slice(0, 8)

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase()

    if (value === "resolved" || value === "closed") {
      return "status-success"
    }

    if (value === "in_progress") {
      return "status-progress"
    }

    if (value === "assigned") {
      return "status-assigned"
    }

    if (value === "under_review") {
      return "status-review"
    }

    if (value === "reopened") {
      return "status-danger"
    }

    return "status-pending"
  }

  const getPriorityClass = (priority) => {
    const value = String(priority || "").toLowerCase()

    if (value === "critical") return "priority-critical"
    if (value === "high") return "priority-high"
    if (value === "medium") return "priority-medium"

    return "priority-low"
  }

  const formatStatus = (status) => {
    if (!status) return "Unknown"

    return String(status)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  const formatCategory = (category) => {
    if (!category) return "Other"

    return String(category)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  const formatDate = (date) => {
    if (!date) return "N/A"

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A"
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const menuItems = [
    {
      id: "overview",
      icon: "▦",
      label: "Overview",
    },
    {
      id: "complaints",
      icon: "▤",
      label: "Ward Complaints",
    },
    {
      id: "officers",
      icon: "♙",
      label: "Ward Officers",
    },
    {
      id: "map",
      icon: "⌖",
      label: "Ward Map",
    },
    {
      id: "analytics",
      icon: "▥",
      label: "Analytics",
    },
    {
      id: "ai",
      icon: "✦",
      label: "AI Recommendations",
    },
  ]

  const renderOverview = () => (
    <div className="ward-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WARD ADMINISTRATION</p>
          <h1>Ward Dashboard</h1>
          <p className="page-description">
            Monitor civic complaints and infrastructure issues
            within your assigned ward.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="ward-banner">
        <div>
          <span className="banner-label">CURRENT WARD</span>
          <h2>
            Ward {wardNumber}
            {wardName !== "Ward Administration"
              ? ` — ${wardName}`
              : ""}
          </h2>
          <p>{city}</p>
        </div>

        <div className="banner-badge">
          <span className="online-dot"></span>
          Active Ward Admin
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">▤</div>
          <div>
            <span>Total Complaints</span>
            <strong>{statistics.total}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending-icon">◷</div>
          <div>
            <span>Pending Review</span>
            <strong>
              {statistics.submitted + statistics.underReview}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon progress-icon">↻</div>
          <div>
            <span>In Progress</span>
            <strong>
              {statistics.assigned + statistics.inProgress}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved-icon">✓</div>
          <div>
            <span>Resolved</span>
            <strong>{statistics.resolved}</strong>
          </div>
        </div>

        <div className="stat-card alert-card">
          <div className="stat-icon critical-icon">!</div>
          <div>
            <span>Critical Issues</span>
            <strong>{statistics.critical}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-columns">
        <section className="panel complaints-panel">
          <div className="panel-header">
            <div>
              <h3>Recent Ward Complaints</h3>
              <p>Latest civic issues reported in your ward</p>
            </div>

            <button
              className="text-button"
              onClick={() => setActiveMenu("complaints")}
            >
              View All →
            </button>
          </div>

          {recentComplaints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h4>No complaints found</h4>
              <p>
                Complaints submitted to this ward will appear here.
              </p>
            </div>
          ) : (
            <div className="complaint-list">
              {recentComplaints.map((complaint, index) => (
                <div
                  className="complaint-row"
                  key={
                    complaint.id ||
                    complaint.complaint_id ||
                    index
                  }
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="complaint-main">
                    <strong>
                      {complaint.complaint_id ||
                        `Complaint #${complaint.id || index + 1}`}
                    </strong>

                    <span>
                      {formatCategory(complaint.category)}
                    </span>

                    <small>
                      {complaint.address || "Location unavailable"}
                    </small>
                  </div>

                  <div className="complaint-meta">
                    <span
                      className={`priority-badge ${getPriorityClass(
                        complaint.priority
                      )}`}
                    >
                      {complaint.priority || "LOW"}
                    </span>

                    <span
                      className={`status-badge ${getStatusClass(
                        complaint.status
                      )}`}
                    >
                      {formatStatus(complaint.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel priority-panel">
          <div className="panel-header">
            <div>
              <h3>Priority Overview</h3>
              <p>Issues requiring attention</p>
            </div>
          </div>

          <div className="priority-item">
            <div>
              <span className="priority-dot critical"></span>
              Critical
            </div>
            <strong>{statistics.critical}</strong>
          </div>

          <div className="priority-item">
            <div>
              <span className="priority-dot high"></span>
              High
            </div>
            <strong>{statistics.high}</strong>
          </div>

          <div className="priority-item">
            <div>
              <span className="priority-dot medium"></span>
              Medium
            </div>
            <strong>
              {
                complaints.filter(
                  (item) =>
                    String(item.priority || "").toUpperCase() ===
                    "MEDIUM"
                ).length
              }
            </strong>
          </div>

          <div className="priority-item">
            <div>
              <span className="priority-dot low"></span>
              Low
            </div>
            <strong>
              {
                complaints.filter(
                  (item) =>
                    String(item.priority || "").toUpperCase() ===
                    "LOW"
                ).length
              }
            </strong>
          </div>

          <div className="quick-alert">
            <span>⚠</span>
            <div>
              <strong>Attention required</strong>
              <p>
                Critical and high-priority complaints should be
                reviewed promptly.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )

  const renderComplaints = () => (
    <div className="ward-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WARD OPERATIONS</p>
          <h1>Ward Complaints</h1>
          <p className="page-description">
            Review civic complaints associated with your ward.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
        >
          ↻ Refresh
        </button>
      </div>

      <section className="panel full-panel">
        <div className="panel-header">
          <div>
            <h3>Complaint Registry</h3>
            <p>
              {complaints.length} complaint
              {complaints.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {complaints.length === 0 ? (
          <div className="empty-state large-empty">
            <div className="empty-icon">▤</div>
            <h4>No complaints available</h4>
            <p>
              There are currently no complaints visible for this
              ward.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {complaints.map((complaint, index) => (
                  <tr
                    key={
                      complaint.id ||
                      complaint.complaint_id ||
                      index
                    }
                  >
                    <td>
                      <strong>
                        {complaint.complaint_id ||
                          `#${complaint.id || index + 1}`}
                      </strong>
                    </td>

                    <td>
                      {formatCategory(complaint.category)}
                    </td>

                    <td className="location-cell">
                      {complaint.address || "Not available"}
                    </td>

                    <td>
                      <span
                        className={`priority-badge ${getPriorityClass(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority || "LOW"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          complaint.status
                        )}`}
                      >
                        {formatStatus(complaint.status)}
                      </span>
                    </td>

                    <td>
                      {formatDate(complaint.created_at)}
                    </td>

                    <td>
                      <button
                        className="view-button"
                        onClick={() =>
                          setSelectedComplaint(complaint)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )

  const renderOfficers = () => (
    <div className="ward-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WARD TEAM</p>
          <h1>Ward Officers</h1>
          <p className="page-description">
            Officers associated with civic operations.
          </p>
        </div>
      </div>

      <section className="panel full-panel">
        <div className="panel-header">
          <div>
            <h3>Assigned Officers</h3>
            <p>Officer information available to the dashboard</p>
          </div>
        </div>

        {officers.length === 0 ? (
          <div className="empty-state large-empty">
            <div className="empty-icon">♙</div>
            <h4>No officers available</h4>
            <p>
              Officer assignments will appear here once configured
              by the administration.
            </p>
          </div>
        ) : (
          <div className="officer-grid">
            {officers.map((officer, index) => (
              <div
                className="officer-card"
                key={officer.id || index}
              >
                <div className="officer-avatar">
                  {String(
                    officer.full_name ||
                      officer.username ||
                      officer.user_name ||
                      "O"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="officer-info">
                  <h4>
                    {officer.full_name ||
                      officer.username ||
                      officer.user_name ||
                      "Officer"}
                  </h4>

                  <p>
                    {officer.designation ||
                      officer.department_name ||
                      officer.department ||
                      "Civic Officer"}
                  </p>

                  <span>
                    {officer.employee_id
                      ? `Employee ID: ${officer.employee_id}`
                      : "Government Officer"}
                  </span>
                </div>

                <span className="officer-status">
                  {officer.is_active === false
                    ? "Inactive"
                    : "Active"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )

  const renderMap = () => (
    <div className="ward-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">GEOSPATIAL VIEW</p>
          <h1>Ward Map</h1>
          <p className="page-description">
            Geographic view of civic infrastructure complaints.
          </p>
        </div>
      </div>

      <section className="map-placeholder">
        <div className="map-grid"></div>

        <div className="map-center">
          <div className="map-pin">⌖</div>
          <h3>Ward {wardNumber}</h3>
          <p>
            {wardName}, {city}
          </p>

          <span>
            GIS integration ready
          </span>
        </div>
      </section>

      <div className="map-info-grid">
        <div className="panel map-info-card">
          <span>Complaints with location</span>
          <strong>
            {
              complaints.filter(
                (item) =>
                  item.latitude !== null &&
                  item.latitude !== undefined &&
                  item.longitude !== null &&
                  item.longitude !== undefined
              ).length
            }
          </strong>
        </div>

        <div className="panel map-info-card">
          <span>Ward</span>
          <strong>{wardNumber}</strong>
        </div>

        <div className="panel map-info-card">
          <span>City</span>
          <strong>{city}</strong>
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="ward-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WARD INSIGHTS</p>
          <h1>Analytics</h1>
          <p className="page-description">
            Current complaint distribution for your ward.
          </p>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="panel analytics-card">
          <span>Total Complaints</span>
          <strong>{statistics.total}</strong>
          <small>All reported issues</small>
        </div>

        <div className="panel analytics-card">
          <span>Pending</span>
          <strong>
            {statistics.submitted + statistics.underReview}
          </strong>
          <small>Needs review</small>
        </div>

        <div className="panel analytics-card">
          <span>In Progress</span>
          <strong>
            {statistics.assigned + statistics.inProgress}
          </strong>
          <small>Currently being handled</small>
        </div>

        <div className="panel analytics-card">
          <span>Resolved</span>
          <strong>{statistics.resolved}</strong>
          <small>Resolved / verified / closed</small>
        </div>
      </div>

      <section className="panel category-panel">
        <div className="panel-header">
          <div>
            <h3>Complaint Categories</h3>
            <p>Distribution of reported civic issues</p>
          </div>
        </div>

        {[
          "POTHOLE",
          "ROAD_DAMAGE",
          "GARBAGE",
          "STREETLIGHT",
          "WATER_LEAKAGE",
          "DRAINAGE",
          "ENCROACHMENT",
          "OTHER",
        ].map((category) => {
          const count = complaints.filter(
            (item) =>
              String(item.category || "").toUpperCase() ===
              category
          ).length

          const percentage =
            statistics.total > 0
              ? Math.round((count / statistics.total) * 100)
              : 0

          return (
            <div className="category-row" key={category}>
              <div className="category-name">
                {formatCategory(category)}
              </div>

              <div className="category-bar">
                <div
                  className="category-fill"
                  style={{
                    width: `${percentage}%`,
                  }}
                ></div>
              </div>

              <strong>{count}</strong>
            </div>
          )
        })}
      </section>
    </div>
  )

  const renderAI = () => (
    <div className="ward-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">AI AGENT LAYER</p>
          <h1>AI Recommendations</h1>
          <p className="page-description">
            AI-assisted recommendations for ward-level civic
            management.
          </p>
        </div>
      </div>

      <section className="ai-banner">
        <div className="ai-symbol">✦</div>

        <div>
          <span>RECOMMENDATION ENGINE</span>
          <h2>AI assistance is recommendation-only</h2>
          <p>
            The AI layer can analyze complaint patterns and
            suggest priorities. Government officials remain
            responsible for reviewing and taking action.
          </p>
        </div>
      </section>

      <div className="ai-grid">
        <div className="panel ai-card">
          <div className="ai-card-icon">⚡</div>
          <h3>Priority Recommendation</h3>
          <p>
            Review critical and high-priority complaints first
            based on reported severity.
          </p>
          <span className="recommendation-label">
            Recommendation
          </span>
        </div>

        <div className="panel ai-card">
          <div className="ai-card-icon">⌖</div>
          <h3>Hotspot Detection</h3>
          <p>
            Future GIS and AI models can identify areas where
            multiple similar complaints are concentrated.
          </p>
          <span className="recommendation-label">
            Planned
          </span>
        </div>

        <div className="panel ai-card">
          <div className="ai-card-icon">◈</div>
          <h3>Duplicate Detection</h3>
          <p>
            Similar complaints can be grouped to reduce duplicate
            work and improve response coordination.
          </p>
          <span className="recommendation-label">
            Planned
          </span>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (activeMenu === "complaints") {
      return renderComplaints()
    }

    if (activeMenu === "officers") {
      return renderOfficers()
    }

    if (activeMenu === "map") {
      return renderMap()
    }

    if (activeMenu === "analytics") {
      return renderAnalytics()
    }

    if (activeMenu === "ai") {
      return renderAI()
    }

    return renderOverview()
  }

  if (loading) {
    return (
      <div className="ward-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Ward Dashboard</h3>
        <p>Fetching ward information...</p>
      </div>
    )
  }

  return (
    <div className="ward-dashboard">
      <aside className="ward-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">CI</div>

          <div>
            <strong>CIIP</strong>
            <span>Civic Intelligence</span>
          </div>
        </div>

        <div className="admin-profile-mini">
          <div className="mini-avatar">
            {String(
              profile?.full_name ||
                localStorage.getItem("ciip_full_name") ||
                "W"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {profile?.full_name ||
                localStorage.getItem("ciip_full_name") ||
                "Ward Admin"}
            </strong>

            <span>Ward Administrator</span>
          </div>
        </div>

        <nav className="ward-navigation">
          <span className="nav-section-title">WORKSPACE</span>

          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                activeMenu === item.id ? "active" : ""
              }`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() => navigate("/profile")}
          >
            <span className="nav-icon">◎</span>
            <span>My Profile</span>
          </button>

          <button
            className="nav-item logout-item"
            onClick={logout}
          >
            <span className="nav-icon">↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="ward-main">
        <header className="ward-topbar">
          <div>
            <span className="topbar-title">
              Government Civic Infrastructure Platform
            </span>
          </div>

          <div className="topbar-right">
            <div className="ward-chip">
              Ward {wardNumber}
            </div>

            <div className="notification-icon">
              ♢
            </div>

            <div className="topbar-user">
              <div className="topbar-avatar">
                {String(
                  profile?.full_name ||
                    localStorage.getItem("ciip_full_name") ||
                    "W"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {profile?.full_name ||
                    localStorage.getItem("ciip_full_name") ||
                    "Ward Admin"}
                </strong>
                <span>Ward Admin</span>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="dashboard-error">
            <strong>Data loading issue:</strong> {error}
            <button onClick={loadDashboard}>
              Retry
            </button>
          </div>
        )}

        {renderContent()}
      </main>

      {selectedComplaint && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedComplaint(null)}
        >
          <div
            className="complaint-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  COMPLAINT DETAILS
                </span>

                <h2>
                  {selectedComplaint.complaint_id ||
                    `Complaint #${selectedComplaint.id}`}
                </h2>
              </div>

              <button
                className="close-modal"
                onClick={() => setSelectedComplaint(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-grid">
              <div>
                <span>Category</span>
                <strong>
                  {formatCategory(
                    selectedComplaint.category
                  )}
                </strong>
              </div>

              <div>
                <span>Priority</span>
                <strong
                  className={`modal-priority ${getPriorityClass(
                    selectedComplaint.priority
                  )}`}
                >
                  {selectedComplaint.priority || "LOW"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {formatStatus(selectedComplaint.status)}
                </strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {formatDate(
                    selectedComplaint.created_at
                  )}
                </strong>
              </div>

              <div className="modal-full">
                <span>Address</span>
                <strong>
                  {selectedComplaint.address ||
                    "Address not available"}
                </strong>
              </div>

              <div className="modal-full">
                <span>Description</span>
                <p>
                  {selectedComplaint.description ||
                    "No description available."}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <span>
                Ward {wardNumber} • {city}
              </span>

              <button
                className="modal-close-button"
                onClick={() => setSelectedComplaint(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WardDashboard