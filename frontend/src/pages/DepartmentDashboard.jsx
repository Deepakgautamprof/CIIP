import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import "./DepartmentDashboard.css"

const API_BASE = "http://127.0.0.1:8000/api"

const STATUS_LABELS = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  VERIFIED: "Verified",
  CLOSED: "Closed",
  REOPENED: "Reopened",
}

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
}

const CATEGORY_LABELS = {
  POTHOLE: "Pothole",
  ROAD_DAMAGE: "Road Damage",
  GARBAGE: "Garbage",
  STREETLIGHT: "Streetlight",
  WATER_LEAKAGE: "Water Leakage",
  DRAINAGE: "Drainage",
  ILLEGAL_DUMPING: "Illegal Dumping",
  ENCROACHMENT: "Encroachment",
  TRAFFIC_SIGNAL: "Traffic Signal",
  OTHER: "Other",
}

const STATUS_FLOW = {
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "ASSIGNED"],
  APPROVED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["VERIFIED", "REOPENED"],
  VERIFIED: ["CLOSED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["UNDER_REVIEW"],
}

const SECTION_TITLES = {
  overview: "Department Overview",
  complaints: "Complaint Management",
  officers: "Officer Management",
  reports: "Reports & Analytics",
  gis: "GIS Intelligence",
  ai: "AI Intelligence",
}

function getAuthToken() {
  return (
    localStorage.getItem("ciip_token") ||
    sessionStorage.getItem("ciip_token") ||
    ""
  )
}

function getStoredUsername() {
  return (
    localStorage.getItem("ciip_username") ||
    sessionStorage.getItem("ciip_username") ||
    ""
  )
}

async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken()

  const headers = {
    ...(options.headers || {}),
    Authorization: `Token ${token}`,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

function formatDate(dateValue) {
  if (!dateValue) return "—"

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status?.replaceAll("_", " ") || "Unknown"
}

function getPriorityLabel(priority) {
  return PRIORITY_LABELS[priority] || priority || "Unknown"
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category?.replaceAll("_", " ") || "Other"
}

function getStatusClass(status) {
  return `status-${String(status || "")
    .toLowerCase()
    .replaceAll("_", "-")}`
}

function getPriorityClass(priority) {
  return `priority-${String(priority || "").toLowerCase()}`
}

function getOfficerWorkload(officer, complaints) {
  const officerComplaints = complaints.filter(
    (complaint) => Number(complaint.officer) === Number(officer.id)
  )

  return {
    total: officerComplaints.length,
    active: officerComplaints.filter((c) =>
      ["ASSIGNED", "IN_PROGRESS"].includes(c.status)
    ).length,
    resolved: officerComplaints.filter((c) =>
      ["RESOLVED", "VERIFIED", "CLOSED"].includes(c.status)
    ).length,
  }
}

function EmptyState({ title, text }) {
  return (
    <div className="department-empty-state">
      <div className="empty-icon">📭</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function DepartmentDashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [officers, setOfficers] = useState([])
  const [complaints, setComplaints] = useState([])

  const [activeSection, setActiveSection] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [wardFilter, setWardFilter] = useState("ALL")
  const [assignmentFilter, setAssignmentFilter] = useState("ALL")

  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [selectedOfficer, setSelectedOfficer] = useState(null)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)

  const [selectedOfficerId, setSelectedOfficerId] = useState("")

  const loadProfile = async () => {
    const response = await authenticatedFetch(`${API_BASE}/users/profile/`)

    if (!response.ok) {
      throw new Error("Unable to load department profile.")
    }

    const data = await response.json()
    setProfile(data)
    return data
  }

  const loadOfficers = async () => {
    const response = await authenticatedFetch(`${API_BASE}/officers/`)

    if (!response.ok) {
      throw new Error("Unable to load officers.")
    }

    const data = await response.json()

    const officerList = Array.isArray(data)
      ? data
      : data.results || []

    setOfficers(officerList)
    return officerList
  }

  const loadComplaints = async () => {
    const response = await authenticatedFetch(`${API_BASE}/complaints/`)

    if (!response.ok) {
      throw new Error("Unable to load complaints.")
    }

    const data = await response.json()

    const complaintList = Array.isArray(data)
      ? data
      : data.results || []

    setComplaints(complaintList)
    return complaintList
  }

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError("")

      const token = getAuthToken()

      if (!token) {
        navigate("/login")
        return
      }

      await Promise.all([
        loadProfile(),
        loadOfficers(),
        loadComplaints(),
      ])
    } catch (err) {
      console.error(err)
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const departmentName =
    profile?.department_details?.name ||
    profile?.department_details?.code ||
    "Department Administration"

  const departmentCode = profile?.department_details?.code || ""

  const stats = useMemo(() => {
    return {
      total: complaints.length,

      needsReview: complaints.filter((c) =>
        ["SUBMITTED", "UNDER_REVIEW"].includes(c.status)
      ).length,

      unassigned: complaints.filter(
        (c) => !c.officer && !["CLOSED", "VERIFIED"].includes(c.status)
      ).length,

      assigned: complaints.filter((c) =>
        ["ASSIGNED", "IN_PROGRESS"].includes(c.status)
      ).length,

      inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,

      resolved: complaints.filter((c) =>
        ["RESOLVED", "VERIFIED", "CLOSED"].includes(c.status)
      ).length,

      verification: complaints.filter((c) => c.status === "RESOLVED").length,

      critical: complaints.filter((c) => c.priority === "CRITICAL").length,

      activeOfficers: officers.filter((o) => o.is_active !== false).length,
    }
  }, [complaints, officers])

  const wards = useMemo(() => {
    const map = new Map()

    complaints.forEach((complaint) => {
      const key = complaint.ward_number || complaint.ward || "Unassigned"

      if (!map.has(key)) {
        map.set(key, {
          ward: complaint.ward_number
            ? `Ward ${complaint.ward_number}`
            : "Unassigned",
          name: complaint.ward_name || "",
          count: 0,
        })
      }

      map.get(key).count += 1
    })

    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [complaints])

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const searchText = search.trim().toLowerCase()

      const matchesSearch =
        !searchText ||
        String(complaint.complaint_id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(complaint.description || "")
          .toLowerCase()
          .includes(searchText) ||
        String(complaint.ward_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(complaint.ward_number || "")
          .toLowerCase()
          .includes(searchText)

      const matchesStatus =
        statusFilter === "ALL" || complaint.status === statusFilter

      const matchesPriority =
        priorityFilter === "ALL" || complaint.priority === priorityFilter

      const matchesCategory =
        categoryFilter === "ALL" || complaint.category === categoryFilter

      const matchesWard =
        wardFilter === "ALL" ||
        String(complaint.ward_number || complaint.ward || "") === wardFilter

      const matchesAssignment =
        assignmentFilter === "ALL" ||
        (assignmentFilter === "ASSIGNED" && complaint.officer) ||
        (assignmentFilter === "UNASSIGNED" && !complaint.officer)

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesWard &&
        matchesAssignment
      )
    })
  }, [
    complaints,
    search,
    statusFilter,
    priorityFilter,
    categoryFilter,
    wardFilter,
    assignmentFilter,
  ])

  const statusChartData = useMemo(() => {
    return Object.entries(STATUS_LABELS)
      .map(([key, label]) => ({
        name: label,
        count: complaints.filter((c) => c.status === key).length,
      }))
      .filter((item) => item.count > 0)
  }, [complaints])

  const categoryChartData = useMemo(() => {
    return Object.entries(CATEGORY_LABELS)
      .map(([key, label]) => ({
        name: label,
        count: complaints.filter((c) => c.category === key).length,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [complaints])

  const priorityChartData = useMemo(() => {
    return Object.entries(PRIORITY_LABELS).map(([key, label]) => ({
      name: label,
      value: complaints.filter((c) => c.priority === key).length,
    }))
  }, [complaints])

  const uniqueWards = useMemo(() => {
    return Array.from(
      new Set(
        complaints
          .map((c) => String(c.ward_number || c.ward || ""))
          .filter(Boolean)
      )
    ).sort()
  }, [complaints])

  const resetComplaintFilters = () => {
    setSearch("")
    setStatusFilter("ALL")
    setPriorityFilter("ALL")
    setCategoryFilter("ALL")
    setWardFilter("ALL")
    setAssignmentFilter("ALL")
  }

  const openComplaint = (complaint) => {
    setSelectedComplaint(complaint)
    setShowComplaintModal(true)
  }

  const openAssignModal = (complaint) => {
    setSelectedComplaint(complaint)
    setSelectedOfficerId(complaint.officer ? String(complaint.officer) : "")
    setShowAssignModal(true)
  }

  const assignOfficer = async () => {
    if (!selectedComplaint) return

    if (!selectedOfficerId) {
      setError("Please select an officer.")
      return
    }

    try {
      setActionLoading(true)
      setError("")

      const response = await authenticatedFetch(
        `${API_BASE}/complaints/${selectedComplaint.id}/assign/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            officer: Number(selectedOfficerId),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "Unable to assign complaint."
        )
      }

      setShowAssignModal(false)
      setSelectedOfficerId("")

      await loadComplaints()
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to assign complaint.")
    } finally {
      setActionLoading(false)
    }
  }

  const updateComplaintStatus = async (complaint, newStatus) => {
    if (!complaint || !newStatus) return

    try {
      setActionLoading(true)
      setError("")

      const response = await authenticatedFetch(
        `${API_BASE}/complaints/${complaint.id}/status/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "Unable to update complaint status."
        )
      }

      await loadComplaints()

      setSelectedComplaint((current) =>
        current
          ? {
              ...current,
              status: newStatus,
            }
          : null
      )
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to update status.")
    } finally {
      setActionLoading(false)
    }
  }

  const verifyComplaint = async (complaint, action) => {
    if (!complaint) return

    try {
      setActionLoading(true)
      setError("")

      const response = await authenticatedFetch(
        `${API_BASE}/complaints/${complaint.id}/verify/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "Unable to process verification."
        )
      }

      await loadComplaints()

      setSelectedComplaint((current) =>
        current
          ? {
              ...current,
              status: action === "verify" ? "VERIFIED" : "REOPENED",
            }
          : null
      )
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to process verification.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("ciip_token")
    localStorage.removeItem("ciip_username")
    localStorage.removeItem("ciip_role")
    localStorage.removeItem("ciip_full_name")

    sessionStorage.removeItem("ciip_token")
    sessionStorage.removeItem("ciip_username")
    sessionStorage.removeItem("ciip_role")
    sessionStorage.removeItem("ciip_full_name")

    navigate("/login")
  }

  const goToProfile = () => {
    navigate("/department-profile")
  }

  const getNextStatuses = (status) => {
    return STATUS_FLOW[status] || []
  }

  if (loading) {
    return (
      <div className="department-loading">
        <div className="department-spinner"></div>
        <h3>Loading Department Portal</h3>
        <p>Fetching complaints, officers and department information...</p>
      </div>
    )
  }

  return (
    <div className="department-dashboard">
      <aside className="department-sidebar">
        <div className="department-brand">
          <div className="department-brand-icon">CI</div>

          <div>
            <h2>CIIP</h2>
            <span>Government Portal</span>
          </div>
        </div>

        <div className="department-sidebar-profile">
          <div className="department-avatar">
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt="Profile"
              />
            ) : (
              <span>
                {(profile?.full_name || profile?.username || "D")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <strong>
              {profile?.full_name || profile?.username || "Department Admin"}
            </strong>
            <small>Department Admin</small>
          </div>
        </div>

        <nav className="department-nav">
          <div className="nav-section-title">MAIN</div>

          <button
            className={`nav-item ${
              activeSection === "overview" ? "active" : ""
            }`}
            onClick={() => setActiveSection("overview")}
          >
            <span className="nav-icon">▦</span>
            Overview
          </button>

          <button
            className={`nav-item ${
              activeSection === "complaints" ? "active" : ""
            }`}
            onClick={() => setActiveSection("complaints")}
          >
            <span className="nav-icon">⚑</span>
            Complaints
            {stats.needsReview > 0 && (
              <span className="nav-count">{stats.needsReview}</span>
            )}
          </button>

          <button
            className={`nav-item ${
              activeSection === "officers" ? "active" : ""
            }`}
            onClick={() => setActiveSection("officers")}
          >
            <span className="nav-icon">♙</span>
            Officers
          </button>

          <div className="nav-section-title">REPORTS</div>

          <button
            className={`nav-item ${
              activeSection === "reports" ? "active" : ""
            }`}
            onClick={() => setActiveSection("reports")}
          >
            <span className="nav-icon">▤</span>
            Reports
          </button>

          <div className="nav-section-title">INTELLIGENCE</div>

          <button
            className={`nav-item ${
              activeSection === "gis" ? "active" : ""
            }`}
            onClick={() => setActiveSection("gis")}
          >
            <span className="nav-icon">⌖</span>
            GIS Intelligence
            <span className="coming-soon">Soon</span>
          </button>

          <button
            className={`nav-item ${
              activeSection === "ai" ? "active" : ""
            }`}
            onClick={() => setActiveSection("ai")}
          >
            <span className="nav-icon">✦</span>
            AI Intelligence
            <span className="coming-soon">Soon</span>
          </button>

          <div className="nav-section-title">ACCOUNT</div>

          <button className="nav-item" onClick={goToProfile}>
            <span className="nav-icon">◎</span>
            My Profile
          </button>

          <button className="nav-item nav-logout" onClick={handleLogout}>
            <span className="nav-icon">↪</span>
            Logout
          </button>
        </nav>
      </aside>

      <main className="department-main">
        <header className="department-topbar">
          <div>
            <span className="topbar-label">Department Portal</span>
            <h1>{SECTION_TITLES[activeSection]}</h1>
          </div>

          <div className="topbar-right">
            <div className="department-name-box">
              <strong>{departmentName}</strong>
              {departmentCode && <span>{departmentCode}</span>}
            </div>

            <button
              className="topbar-profile"
              onClick={goToProfile}
              title="Open profile"
            >
              <div className="topbar-avatar">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt="Profile"
                  />
                ) : (
                  (profile?.full_name ||
                    profile?.username ||
                    "D")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
            </button>
          </div>
        </header>

        {error && (
          <div className="department-alert">
            <span>⚠</span>
            <div>{error}</div>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {activeSection === "overview" && (
          <section className="department-content">
            <div className="section-intro">
              <div>
                <span className="eyebrow">COMMAND CENTER</span>
                <h2>Department workload at a glance</h2>
                <p>
                  Monitor complaints, officer workload and resolution progress
                  for {departmentName}.
                </p>
              </div>

              <button
                className="primary-btn"
                onClick={() => setActiveSection("complaints")}
              >
                Manage Complaints →
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">▦</div>
                <div>
                  <span>Total Complaints</span>
                  <strong>{stats.total}</strong>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon orange">!</div>
                <div>
                  <span>Needs Review</span>
                  <strong>{stats.needsReview}</strong>
                </div>
              </div>

              <div className="stat-card danger">
                <div className="stat-icon red">●</div>
                <div>
                  <span>Critical</span>
                  <strong>{stats.critical}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">♙</div>
                <div>
                  <span>Unassigned</span>
                  <strong>{stats.unassigned}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon cyan">↻</div>
                <div>
                  <span>In Progress</span>
                  <strong>{stats.inProgress}</strong>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon green">✓</div>
                <div>
                  <span>Resolved</span>
                  <strong>{stats.resolved}</strong>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon yellow">◷</div>
                <div>
                  <span>Needs Verification</span>
                  <strong>{stats.verification}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon teal">♙</div>
                <div>
                  <span>Active Officers</span>
                  <strong>{stats.activeOfficers}</strong>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card chart-card">
                <div className="card-header">
                  <div>
                    <h3>Complaint Status</h3>
                    <p>Current department workflow distribution</p>
                  </div>
                </div>

                <div className="chart-container">
                  {statusChartData.length === 0 ? (
                    <EmptyState
                      title="No complaint data"
                      text="Status analytics will appear when complaints are available."
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Complaints"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="dashboard-card chart-card">
                <div className="card-header">
                  <div>
                    <h3>Priority Distribution</h3>
                    <p>Complaint priority breakdown</p>
                  </div>
                </div>

                <div className="chart-container">
                  {complaints.length === 0 ? (
                    <EmptyState
                      title="No priority data"
                      text="Priority distribution will appear here."
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={105}
                          label
                        >
                          {priorityChartData.map((_, index) => (
                            <Cell key={index} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="dashboard-card chart-card full-width">
                <div className="card-header">
                  <div>
                    <h3>Complaint Categories</h3>
                    <p>Most frequently reported civic issues</p>
                  </div>
                </div>

                <div className="chart-container category-chart">
                  {categoryChartData.length === 0 ? (
                    <EmptyState
                      title="No category data"
                      text="Category analytics will appear here."
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryChartData}
                        layout="vertical"
                        margin={{
                          left: 25,
                          right: 25,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Complaints"
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-card recent-card">
              <div className="card-header">
                <div>
                  <h3>Recent Complaints</h3>
                  <p>Latest complaints requiring department attention</p>
                </div>

                <button
                  className="text-btn"
                  onClick={() => setActiveSection("complaints")}
                >
                  View All →
                </button>
              </div>

              {complaints.length === 0 ? (
                <EmptyState
                  title="No complaints"
                  text="There are currently no complaints assigned to this department."
                />
              ) : (
                <div className="recent-list">
                  {complaints.slice(0, 6).map((complaint) => (
                    <button
                      className="recent-item"
                      key={complaint.id}
                      onClick={() => openComplaint(complaint)}
                    >
                      <div className="recent-main">
                        <strong>{complaint.complaint_id}</strong>
                        <span>
                          {getCategoryLabel(complaint.category)}
                        </span>
                      </div>

                      <div className="recent-middle">
                        <span>
                          {complaint.ward_number
                            ? `Ward ${complaint.ward_number}`
                            : "Ward not assigned"}
                        </span>
                        <small>
                          {formatDate(complaint.created_at)}
                        </small>
                      </div>

                      <div className="recent-right">
                        <span
                          className={`priority-badge ${getPriorityClass(
                            complaint.priority
                          )}`}
                        >
                          {getPriorityLabel(complaint.priority)}
                        </span>

                        <span
                          className={`status-badge ${getStatusClass(
                            complaint.status
                          )}`}
                        >
                          {getStatusLabel(complaint.status)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "complaints" && (
          <section className="department-content">
            <div className="section-intro">
              <div>
                <span className="eyebrow">CASE MANAGEMENT</span>
                <h2>Department Complaints</h2>
                <p>
                  Review, assign, monitor and verify complaints handled by
                  your department.
                </p>
              </div>

              <div className="section-summary">
                <strong>{filteredComplaints.length}</strong>
                <span>visible complaints</span>
              </div>
            </div>

            <div className="dashboard-card complaint-management-card">
              <div className="complaint-toolbar">
                <div className="search-box">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search complaint ID, ward or description..."
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="ALL">All Priorities</option>
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                >
                  <option value="ALL">All Wards</option>
                  {uniqueWards.map((ward) => (
                    <option value={ward} key={ward}>
                      Ward {ward}
                    </option>
                  ))}
                </select>

                <select
                  value={assignmentFilter}
                  onChange={(e) =>
                    setAssignmentFilter(e.target.value)
                  }
                >
                  <option value="ALL">All Assignments</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="UNASSIGNED">Unassigned</option>
                </select>

                <button
                  className="reset-btn"
                  onClick={resetComplaintFilters}
                >
                  Reset
                </button>
              </div>

              <div className="table-wrapper">
                <table className="complaints-table">
                  <thead>
                    <tr>
                      <th>Complaint</th>
                      <th>Issue</th>
                      <th>Location</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Officer</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredComplaints.length === 0 ? (
                      <tr>
                        <td colSpan="8">
                          <EmptyState
                            title="No matching complaints"
                            text="Try changing the search or filters."
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredComplaints.map((complaint) => (
                        <tr key={complaint.id}>
                          <td>
                            <strong className="complaint-id">
                              {complaint.complaint_id}
                            </strong>
                          </td>

                          <td>
                            <div className="issue-cell">
                              <strong>
                                {getCategoryLabel(complaint.category)}
                              </strong>
                              <span>
                                {(complaint.description || "No description")
                                  .slice(0, 60)}
                                {(complaint.description || "").length > 60
                                  ? "..."
                                  : ""}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="location-cell">
                              <strong>
                                {complaint.ward_number
                                  ? `Ward ${complaint.ward_number}`
                                  : "Unassigned"}
                              </strong>
                              <span>
                                {complaint.ward_name || "Ward not available"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`priority-badge ${getPriorityClass(
                                complaint.priority
                              )}`}
                            >
                              {getPriorityLabel(complaint.priority)}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${getStatusClass(
                                complaint.status
                              )}`}
                            >
                              {getStatusLabel(complaint.status)}
                            </span>
                          </td>

                          <td>
                            {complaint.officer_name ? (
                              <div className="assigned-officer">
                                <div className="mini-avatar">
                                  {complaint.officer_name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <span>{complaint.officer_name}</span>
                              </div>
                            ) : (
                              <span className="not-assigned">
                                Not Assigned
                              </span>
                            )}
                          </td>

                          <td>
                            <span className="date-cell">
                              {formatDate(complaint.created_at)}
                            </span>
                          </td>

                          <td>
                            <div className="table-actions">
                              <button
                                className="small-btn view"
                                onClick={() =>
                                  openComplaint(complaint)
                                }
                              >
                                View
                              </button>

                              <button
                                className="small-btn assign"
                                onClick={() =>
                                  openAssignModal(complaint)
                                }
                              >
                                {complaint.officer
                                  ? "Reassign"
                                  : "Assign"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeSection === "officers" && (
          <section className="department-content">
            <div className="section-intro">
              <div>
                <span className="eyebrow">FIELD STAFF</span>
                <h2>Officer Management</h2>
                <p>
                  Monitor officer assignments and current workload.
                </p>
              </div>

              <div className="section-summary">
                <strong>{stats.activeOfficers}</strong>
                <span>active officers</span>
              </div>
            </div>

            {officers.length === 0 ? (
              <div className="dashboard-card">
                <EmptyState
                  title="No officers found"
                  text="No officers are currently available for this department."
                />
              </div>
            ) : (
              <div className="officers-grid">
                {officers.map((officer) => {
                  const workload = getOfficerWorkload(
                    officer,
                    complaints
                  )

                  return (
                    <div className="officer-card" key={officer.id}>
                      <div className="officer-card-top">
                        <div className="officer-avatar">
                          {(officer.full_name ||
                            officer.user_name ||
                            "O")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span
                          className={`officer-active ${
                            officer.is_active !== false
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {officer.is_active !== false
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <div className="officer-info">
                        <h3>
                          {officer.full_name ||
                            officer.user_name ||
                            "Officer"}
                        </h3>

                        <p>{officer.designation || "Officer"}</p>

                        <div className="officer-meta">
                          <span>
                            <b>Employee ID:</b>{" "}
                            {officer.employee_id || "—"}
                          </span>

                          <span>
                            <b>Ward:</b>{" "}
                            {officer.ward_number
                              ? `Ward ${officer.ward_number}`
                              : "Not assigned"}
                          </span>

                          <span>
                            <b>Department:</b>{" "}
                            {officer.department_name || departmentName}
                          </span>
                        </div>
                      </div>

                      <div className="workload-grid">
                        <div>
                          <strong>{workload.total}</strong>
                          <span>Total</span>
                        </div>

                        <div>
                          <strong>{workload.active}</strong>
                          <span>Active</span>
                        </div>

                        <div>
                          <strong>{workload.resolved}</strong>
                          <span>Resolved</span>
                        </div>
                      </div>

                      <button
                        className="officer-action-btn"
                        onClick={() => {
                          setSelectedOfficer(officer)
                          setShowAssignModal(true)
                          setSelectedComplaint(null)
                        }}
                      >
                        View Workload
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {activeSection === "reports" && (
          <section className="department-content">
            <div className="section-intro">
              <div>
                <span className="eyebrow">REPORTING</span>
                <h2>Reports & Analytics</h2>
                <p>
                  Review department-level complaint and workload metrics.
                </p>
              </div>
            </div>

            <div className="report-summary-grid">
              <div className="report-summary-card">
                <span>Total Complaints</span>
                <strong>{stats.total}</strong>
              </div>

              <div className="report-summary-card">
                <span>Resolution Count</span>
                <strong>{stats.resolved}</strong>
              </div>

              <div className="report-summary-card">
                <span>Active Cases</span>
                <strong>{stats.assigned}</strong>
              </div>

              <div className="report-summary-card">
                <span>Critical Cases</span>
                <strong>{stats.critical}</strong>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div>
                  <h3>Ward Complaint Distribution</h3>
                  <p>
                    Complaint volume based on available ward information.
                  </p>
                </div>
              </div>

              {wards.length === 0 ? (
                <EmptyState
                  title="No ward data"
                  text="Ward analytics will appear once complaints contain ward information."
                />
              ) : (
                <div className="ward-report-list">
                  {wards.map((ward) => (
                    <div className="ward-report-row" key={ward.ward}>
                      <div>
                        <strong>{ward.ward}</strong>
                        <span>{ward.name || "Ward"}</span>
                      </div>

                      <div className="ward-progress">
                        <span
                          style={{
                            width: `${Math.min(
                              100,
                              (ward.count /
                                Math.max(
                                  ...wards.map((item) => item.count)
                                )) *
                                100
                            )}%`,
                          }}
                        ></span>
                      </div>

                      <strong>{ward.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "gis" && (
          <section className="department-content">
            <div className="section-intro">
              <div>
                <span className="eyebrow">INTELLIGENCE</span>
                <h2>GIS Intelligence</h2>
                <p>
                  Geographic complaint intelligence will be integrated here.
                </p>
              </div>
            </div>

            <div className="intelligence-placeholder">
              <div className="intelligence-icon">⌖</div>
              <h2>GIS Intelligence Module</h2>
              <p>
                This module is reserved for the CIIP GIS layer. Future
                functionality can include complaint mapping, ward heatmaps,
                hotspot detection, location clustering and geographic
                infrastructure analysis.
              </p>

              <div className="future-features">
                <span>Complaint Heatmap</span>
                <span>Ward Map</span>
                <span>Hotspot Detection</span>
                <span>Location Clustering</span>
              </div>

              <div className="coming-banner">
                GIS Intelligence — Coming in the next development phase
              </div>
            </div>
          </section>
        )}

        {activeSection === "ai" && (
          <section className="department-content">
            <div className="section-intro">
              <div>
                <span className="eyebrow">INTELLIGENCE</span>
                <h2>AI Intelligence</h2>
                <p>
                  AI-assisted recommendations will be integrated here.
                </p>
              </div>
            </div>

            <div className="intelligence-placeholder ai-placeholder">
              <div className="intelligence-icon">✦</div>
              <h2>AI Intelligence Module</h2>
              <p>
                This module is reserved for the CIIP AI Agent. The future AI
                layer can analyze complaints and provide recommendations to
                department administrators without automatically taking
                government actions.
              </p>

              <div className="future-features">
                <span>Priority Recommendation</span>
                <span>Duplicate Detection</span>
                <span>Severity Analysis</span>
                <span>Officer Recommendation</span>
              </div>

              <div className="coming-banner">
                AI Intelligence — Coming in the next development phase
              </div>
            </div>
          </section>
        )}
      </main>

      {showAssignModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAssignModal(false)
            setSelectedOfficer(null)
          }}
        >
          <div
            className="department-modal assignment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">ASSIGNMENT</span>
                <h2>
                  {selectedComplaint
                    ? "Assign Complaint"
                    : "Officer Workload"}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedOfficer(null)
                }}
              >
                ×
              </button>
            </div>

            {selectedComplaint ? (
              <>
                <div className="assignment-case">
                  <strong>{selectedComplaint.complaint_id}</strong>
                  <span>
                    {getCategoryLabel(selectedComplaint.category)}
                  </span>
                  <span>
                    {selectedComplaint.ward_number
                      ? `Ward ${selectedComplaint.ward_number}`
                      : "Ward not assigned"}
                  </span>
                </div>

                <label className="modal-label">
                  Select Officer
                </label>

                <select
                  className="modal-select"
                  value={selectedOfficerId}
                  onChange={(e) =>
                    setSelectedOfficerId(e.target.value)
                  }
                >
                  <option value="">Choose an officer</option>

                  {officers
                    .filter((officer) => officer.is_active !== false)
                    .map((officer) => {
                      const workload = getOfficerWorkload(
                        officer,
                        complaints
                      )

                      return (
                        <option
                          value={officer.id}
                          key={officer.id}
                        >
                          {officer.full_name ||
                            officer.user_name} — Active cases:{" "}
                          {workload.active}
                        </option>
                      )
                    })}
                </select>

                <div className="assignment-officer-preview">
                  {selectedOfficerId &&
                    (() => {
                      const officer = officers.find(
                        (item) =>
                          String(item.id) ===
                          String(selectedOfficerId)
                      )

                      if (!officer) return null

                      const workload = getOfficerWorkload(
                        officer,
                        complaints
                      )

                      return (
                        <>
                          <div className="mini-avatar large">
                            {(officer.full_name ||
                              officer.user_name ||
                              "O")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {officer.full_name ||
                                officer.user_name}
                            </strong>
                            <span>
                              {officer.designation || "Officer"}
                            </span>
                            <small>
                              {workload.total} total •{" "}
                              {workload.active} active •{" "}
                              {workload.resolved} resolved
                            </small>
                          </div>
                        </>
                      )
                    })()}
                </div>

                <div className="modal-actions">
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      setShowAssignModal(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="primary-btn"
                    onClick={assignOfficer}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Assigning..."
                      : "Assign Officer"}
                  </button>
                </div>
              </>
            ) : selectedOfficer ? (
              <>
                <div className="selected-officer-panel">
                  <div className="officer-avatar large">
                    {(selectedOfficer.full_name ||
                      selectedOfficer.user_name ||
                      "O")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3>
                      {selectedOfficer.full_name ||
                        selectedOfficer.user_name}
                    </h3>
                    <p>
                      {selectedOfficer.designation ||
                        "Officer"}
                    </p>
                    <span>
                      Employee ID:{" "}
                      {selectedOfficer.employee_id || "—"}
                    </span>
                  </div>
                </div>

                {(() => {
                  const workload = getOfficerWorkload(
                    selectedOfficer,
                    complaints
                  )

                  return (
                    <div className="workload-large-grid">
                      <div>
                        <strong>{workload.total}</strong>
                        <span>Total Cases</span>
                      </div>

                      <div>
                        <strong>{workload.active}</strong>
                        <span>Active Cases</span>
                      </div>

                      <div>
                        <strong>{workload.resolved}</strong>
                        <span>Resolved</span>
                      </div>
                    </div>
                  )
                })()}

                <button
                  className="secondary-btn full-btn"
                  onClick={() => setShowAssignModal(false)}
                >
                  Close
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {showComplaintModal && selectedComplaint && (
        <div
          className="modal-overlay"
          onClick={() => setShowComplaintModal(false)}
        >
          <div
            className="department-modal complaint-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">CASE FILE</span>
                <h2>{selectedComplaint.complaint_id}</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowComplaintModal(false)}
              >
                ×
              </button>
            </div>

            <div className="case-status-row">
              <span
                className={`status-badge ${getStatusClass(
                  selectedComplaint.status
                )}`}
              >
                {getStatusLabel(selectedComplaint.status)}
              </span>

              <span
                className={`priority-badge ${getPriorityClass(
                  selectedComplaint.priority
                )}`}
              >
                {getPriorityLabel(selectedComplaint.priority)}
              </span>
            </div>

            <div className="case-grid">
              <div className="case-field">
                <label>Category</label>
                <strong>
                  {getCategoryLabel(selectedComplaint.category)}
                </strong>
              </div>

              <div className="case-field">
                <label>Ward</label>
                <strong>
                  {selectedComplaint.ward_number
                    ? `Ward ${selectedComplaint.ward_number}`
                    : "Not assigned"}
                </strong>
              </div>

              <div className="case-field">
                <label>Ward Name</label>
                <strong>
                  {selectedComplaint.ward_name || "—"}
                </strong>
              </div>

              <div className="case-field">
                <label>Officer</label>
                <strong>
                  {selectedComplaint.officer_name ||
                    "Not Assigned"}
                </strong>
              </div>

              <div className="case-field">
                <label>Created</label>
                <strong>
                  {formatDate(selectedComplaint.created_at)}
                </strong>
              </div>

              <div className="case-field">
                <label>Updated</label>
                <strong>
                  {formatDate(selectedComplaint.updated_at)}
                </strong>
              </div>
            </div>

            <div className="case-description">
              <label>Description</label>
              <p>
                {selectedComplaint.description ||
                  "No description provided."}
              </p>
            </div>

            {selectedComplaint.address && (
              <div className="case-description">
                <label>Address</label>
                <p>{selectedComplaint.address}</p>
              </div>
            )}

            {selectedComplaint.image && (
              <div className="case-image">
                <label>Evidence</label>
                <img
                  src={selectedComplaint.image}
                  alt="Complaint evidence"
                />
              </div>
            )}

            <div className="workflow-section">
              <div className="workflow-title">
                <div>
                  <h3>Workflow Action</h3>
                  <p>
                    Only valid next workflow states are shown.
                  </p>
                </div>
              </div>

              <div className="workflow-actions">
                {getNextStatuses(selectedComplaint.status).map(
                  (nextStatus) => (
                    <button
                      key={nextStatus}
                      className="workflow-btn"
                      disabled={actionLoading}
                      onClick={() =>
                        updateComplaintStatus(
                          selectedComplaint,
                          nextStatus
                        )
                      }
                    >
                      Move to {getStatusLabel(nextStatus)}
                    </button>
                  )
                )}

                {selectedComplaint.status === "RESOLVED" && (
                  <>
                    <button
                      className="workflow-btn verify"
                      disabled={actionLoading}
                      onClick={() =>
                        verifyComplaint(
                          selectedComplaint,
                          "verify"
                        )
                      }
                    >
                      ✓ Verify Complaint
                    </button>

                    <button
                      className="workflow-btn reopen"
                      disabled={actionLoading}
                      onClick={() =>
                        verifyComplaint(
                          selectedComplaint,
                          "reopen"
                        )
                      }
                    >
                      ↻ Reopen
                    </button>
                  </>
                )}

                {getNextStatuses(selectedComplaint.status)
                  .length === 0 &&
                  selectedComplaint.status !== "RESOLVED" && (
                    <span className="workflow-complete">
                      No further workflow action available.
                    </span>
                  )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() =>
                  openAssignModal(selectedComplaint)
                }
              >
                {selectedComplaint.officer
                  ? "Reassign Officer"
                  : "Assign Officer"}
              </button>

              <button
                className="primary-btn"
                onClick={() =>
                  setShowComplaintModal(false)
                }
              >
                Close Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentDashboard