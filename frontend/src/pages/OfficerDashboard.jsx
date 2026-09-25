import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_BASE = "http://127.0.0.1:8000/api"

function OfficerDashboard() {
  const navigate = useNavigate()

  const token = localStorage.getItem("ciip_token")
  const role = localStorage.getItem("ciip_role")

  const [profile, setProfile] = useState(null)
  const [officer, setOfficer] = useState(null)
  const [complaints, setComplaints] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [activeMenu, setActiveMenu] = useState("dashboard")
  const [selectedComplaint, setSelectedComplaint] = useState(null)

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    if (role !== "OFFICER") {
      navigate("/login")
      return
    }

    loadDashboard()
  }, [])

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError("")

      const headers = {
        Authorization: `Token ${token}`,
      }

      // ---------------------------------------------
      // PROFILE
      // ---------------------------------------------

      const profileResponse = await fetch(
        `${API_BASE}/users/profile/`,
        {
          headers,
        }
      )

      if (!profileResponse.ok) {
        throw new Error("Unable to load profile.")
      }

      const profileData = await profileResponse.json()

      setProfile(profileData)

      // ---------------------------------------------
      // OFFICER DETAILS
      // ---------------------------------------------

      const officerResponse = await fetch(
        `${API_BASE}/officers/`,
        {
          headers,
        }
      )

      if (!officerResponse.ok) {
        throw new Error("Unable to load officer details.")
      }

      const officerData = await officerResponse.json()

      let officerInfo = null

      if (Array.isArray(officerData)) {
        officerInfo = officerData.find(
          (item) =>
            String(item.user) === String(profileData.id)
        )

        if (!officerInfo && officerData.length > 0) {
          officerInfo = officerData[0]
        }
      } else if (officerData.results) {
        officerInfo = officerData.results.find(
          (item) =>
            String(item.user) === String(profileData.id)
        )

        if (
          !officerInfo &&
          officerData.results.length > 0
        ) {
          officerInfo = officerData.results[0]
        }
      }

      setOfficer(officerInfo)

      // ---------------------------------------------
      // COMPLAINTS
      // ---------------------------------------------

      const complaintsResponse = await fetch(
        `${API_BASE}/complaints/`,
        {
          headers,
        }
      )

      if (!complaintsResponse.ok) {
        throw new Error("Unable to load complaints.")
      }

      const complaintsData =
        await complaintsResponse.json()

      if (Array.isArray(complaintsData)) {
        setComplaints(complaintsData)
      } else if (complaintsData.results) {
        setComplaints(complaintsData.results)
      } else {
        setComplaints([])
      }

    } catch (err) {
      console.error(err)
      setError(
        err.message ||
          "Unable to load officer dashboard."
      )
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("ciip_token")
    localStorage.removeItem("ciip_role")
    localStorage.removeItem("ciip_username")
    localStorage.removeItem("ciip_full_name")
    localStorage.removeItem(
      "ciip_profile_photo_url"
    )

    navigate("/login")
  }

  // =====================================================
  // UPDATE COMPLAINT STATUS
  // =====================================================

  const updateComplaintStatus = async (
    complaintId,
    newStatus
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/complaints/${complaintId}/status/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
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
          data.detail ||
            data.error ||
            "Unable to update complaint status."
        )
      }

      // Refresh dashboard
      await loadDashboard()

      setSelectedComplaint(null)

    } catch (err) {
      console.error(err)

      alert(
        err.message ||
          "Failed to update complaint."
      )
    }
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  const stats = useMemo(() => {

    const total = complaints.length

    const assigned = complaints.filter(
      (item) =>
        item.status === "ASSIGNED"
    ).length

    const inProgress = complaints.filter(
      (item) =>
        item.status === "IN_PROGRESS"
    ).length

    const resolved = complaints.filter(
      (item) =>
        item.status === "RESOLVED"
    ).length

    const verified = complaints.filter(
      (item) =>
        item.status === "VERIFIED"
    ).length

    const closed = complaints.filter(
      (item) =>
        item.status === "CLOSED"
    ).length

    return {
      total,
      assigned,
      inProgress,
      resolved,
      verified,
      closed,
    }

  }, [complaints])

  // =====================================================
  // PROFILE DATA
  // =====================================================

  const officerName =
    profile?.full_name ||
    officer?.full_name ||
    profile?.username ||
    "Officer"

  const profilePhoto =
    profile?.profile_photo_url ||
    localStorage.getItem(
      "ciip_profile_photo_url"
    )

  const officerInitial =
    officerName
      .charAt(0)
      .toUpperCase()

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingBox}>
          <div style={styles.loadingSpinner}>
            ⏳
          </div>

          <h2>Loading Officer Dashboard</h2>

          <p>
            Please wait while we load your data...
          </p>
        </div>
      </div>
    )
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div style={styles.page}>

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside style={styles.sidebar}>

        {/* LOGO */}

        <div style={styles.logoSection}>

          <div style={styles.logo}>
            CIIP
          </div>

          <div style={styles.logoSubtitle}>
            Civic Infrastructure
            Intelligence Platform
          </div>

        </div>


        {/* OFFICER MINI PROFILE */}

        <div
          style={styles.sidebarProfile}
          onClick={() =>
            navigate("/officer-profile")
          }
        >

          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Officer"
              style={styles.sidebarProfileImage}
            />
          ) : (
            <div style={styles.sidebarAvatar}>
              {officerInitial}
            </div>
          )}

          <div style={styles.sidebarProfileInfo}>

            <div style={styles.sidebarName}>
              {officerName}
            </div>

            <div style={styles.sidebarRole}>
              Officer
            </div>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav style={styles.nav}>

          <button
            style={{
              ...styles.navItem,
              ...(activeMenu === "dashboard"
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              setActiveMenu("dashboard")
            }
          >
            <span>📊</span>
            Dashboard
          </button>


          <button
            style={{
              ...styles.navItem,
              ...(activeMenu === "assigned"
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              setActiveMenu("assigned")
            }
          >
            <span>📋</span>
            Assigned Complaints

            {stats.assigned > 0 && (
              <span style={styles.navBadge}>
                {stats.assigned}
              </span>
            )}
          </button>


          <button
            style={{
              ...styles.navItem,
              ...(activeMenu === "work"
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              setActiveMenu("work")
            }
          >
            <span>🔧</span>
            My Work
          </button>


          <button
            style={{
              ...styles.navItem,
              ...(activeMenu === "statistics"
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              setActiveMenu("statistics")
            }
          >
            <span>📈</span>
            Statistics
          </button>


          <button
            style={{
              ...styles.navItem,
              ...(activeMenu === "gis"
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              setActiveMenu("gis")
            }
          >
            <span>🗺️</span>
            GIS Map
          </button>


          <button
            style={{
              ...styles.navItem,
              ...(activeMenu === "notifications"
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              setActiveMenu("notifications")
            }
          >
            <span>🔔</span>
            Notifications
          </button>

        </nav>


        {/* BOTTOM */}

        <div style={styles.sidebarBottom}>

          <button
            style={styles.profileButton}
            onClick={() =>
              navigate("/officer-profile")
            }
          >
            <span>👤</span>
            My Profile
          </button>


          <button
            style={styles.logoutButton}
            onClick={handleLogout}
          >
            <span>🚪</span>
            Logout
          </button>

        </div>

      </aside>


      {/* =================================================
          MAIN AREA
      ================================================= */}

      <main style={styles.main}>

        {/* HEADER */}

        <header style={styles.header}>

          <div>

            <h1 style={styles.pageTitle}>
              Officer Dashboard
            </h1>

            <p style={styles.pageSubtitle}>
              Manage and resolve assigned civic
              complaints
            </p>

          </div>


          {/* TOP RIGHT PROFILE */}

          <button
            style={styles.topProfile}
            onClick={() =>
              navigate("/officer-profile")
            }
          >

            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Officer"
                style={styles.topProfileImage}
              />
            ) : (
              <div style={styles.topAvatar}>
                {officerInitial}
              </div>
            )}

            <div style={styles.topProfileText}>

              <div style={styles.topProfileName}>
                {officerName}
              </div>

              <div style={styles.topProfileRole}>
                Officer
              </div>

            </div>

            <span style={styles.profileArrow}>
              ›
            </span>

          </button>

        </header>


        {/* ERROR */}

        {error && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error}

            <button
              onClick={loadDashboard}
              style={styles.retryButton}
            >
              Retry
            </button>
          </div>
        )}


        {/* =================================================
            DASHBOARD VIEW
        ================================================= */}

        {activeMenu === "dashboard" && (
          <>

            {/* STATS */}

            <div style={styles.statsGrid}>

              <StatCard
                icon="📋"
                title="Total Assigned"
                value={stats.total}
                subtitle="Complaints"
              />

              <StatCard
                icon="🟡"
                title="Assigned"
                value={stats.assigned}
                subtitle="Awaiting action"
              />

              <StatCard
                icon="🔵"
                title="In Progress"
                value={stats.inProgress}
                subtitle="Currently working"
              />

              <StatCard
                icon="🟢"
                title="Resolved"
                value={stats.resolved}
                subtitle="Completed work"
              />

            </div>


            {/* OFFICER INFO */}

            <div style={styles.infoGrid}>

              <div style={styles.infoCard}>

                <h3 style={styles.cardTitle}>
                  Officer Information
                </h3>

                <InfoRow
                  label="Employee ID"
                  value={
                    officer?.employee_id ||
                    "Not available"
                  }
                />

                <InfoRow
                  label="Designation"
                  value={
                    officer?.designation ||
                    "Not available"
                  }
                />

                <InfoRow
                  label="Department"
                  value={
                    officer?.department_name ||
                    "Not assigned"
                  }
                />

                <InfoRow
                  label="Ward"
                  value={
                    officer?.ward_number
                      ? `Ward ${officer.ward_number}${
                          officer?.ward_name
                            ? ` - ${officer.ward_name}`
                            : ""
                        }`
                      : "Not assigned"
                  }
                />

              </div>


              <div style={styles.infoCard}>

                <h3 style={styles.cardTitle}>
                  Work Summary
                </h3>

                <InfoRow
                  label="Resolved"
                  value={stats.resolved}
                />

                <InfoRow
                  label="Verified"
                  value={stats.verified}
                />

                <InfoRow
                  label="Closed"
                  value={stats.closed}
                />

                <InfoRow
                  label="Active Work"
                  value={
                    stats.assigned +
                    stats.inProgress
                  }
                />

              </div>

            </div>


            {/* RECENT COMPLAINTS */}

            <ComplaintSection
              title="Assigned Complaints"
              complaints={complaints}
              onSelect={setSelectedComplaint}
              limit={5}
            />

          </>
        )}


        {/* =================================================
            ASSIGNED COMPLAINTS
        ================================================= */}

        {activeMenu === "assigned" && (
          <ComplaintSection
            title="Assigned Complaints"
            complaints={complaints.filter(
              (item) =>
                item.status === "ASSIGNED"
            )}
            onSelect={setSelectedComplaint}
          />
        )}


        {/* =================================================
            MY WORK
        ================================================= */}

        {activeMenu === "work" && (
          <ComplaintSection
            title="My Work"
            complaints={complaints.filter(
              (item) =>
                item.status ===
                  "IN_PROGRESS" ||
                item.status ===
                  "RESOLVED"
            )}
            onSelect={setSelectedComplaint}
          />
        )}


        {/* =================================================
            STATISTICS
        ================================================= */}

        {activeMenu === "statistics" && (
          <div>

            <h2 style={styles.sectionHeading}>
              Work Statistics
            </h2>

            <div style={styles.statsGrid}>

              <StatCard
                icon="📋"
                title="Total"
                value={stats.total}
                subtitle="Assigned complaints"
              />

              <StatCard
                icon="🟡"
                title="Assigned"
                value={stats.assigned}
                subtitle="Pending start"
              />

              <StatCard
                icon="🔵"
                title="In Progress"
                value={stats.inProgress}
                subtitle="Active work"
              />

              <StatCard
                icon="🟢"
                title="Resolved"
                value={stats.resolved}
                subtitle="Resolved complaints"
              />

              <StatCard
                icon="✅"
                title="Verified"
                value={stats.verified}
                subtitle="Verified complaints"
              />

              <StatCard
                icon="✔️"
                title="Closed"
                value={stats.closed}
                subtitle="Closed complaints"
              />

            </div>

          </div>
        )}


        {/* =================================================
            GIS
        ================================================= */}

        {activeMenu === "gis" && (
          <div style={styles.placeholderCard}>

            <div style={styles.placeholderIcon}>
              🗺️
            </div>

            <h2>
              GIS Map
            </h2>

            <p>
              GIS complaint map will be integrated
              here in the next phase.
            </p>

          </div>
        )}


        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        {activeMenu === "notifications" && (
          <div style={styles.placeholderCard}>

            <div style={styles.placeholderIcon}>
              🔔
            </div>

            <h2>
              Notifications
            </h2>

            <p>
              Officer notifications will appear here.
            </p>

          </div>
        )}

      </main>


      {/* =================================================
          COMPLAINT DETAIL MODAL
      ================================================= */}

      {selectedComplaint && (
        <ComplaintModal
          complaint={selectedComplaint}
          onClose={() =>
            setSelectedComplaint(null)
          }
          onStatusUpdate={
            updateComplaintStatus
          }
        />
      )}

    </div>
  )
}


// =======================================================
// STAT CARD
// =======================================================

function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div style={styles.statCard}>

      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>

        <div style={styles.statTitle}>
          {title}
        </div>

        <div style={styles.statValue}>
          {value}
        </div>

        <div style={styles.statSubtitle}>
          {subtitle}
        </div>

      </div>

    </div>
  )
}


// =======================================================
// INFO ROW
// =======================================================

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>

      <span style={styles.infoLabel}>
        {label}
      </span>

      <span style={styles.infoValue}>
        {value}
      </span>

    </div>
  )
}


// =======================================================
// COMPLAINT SECTION
// =======================================================

function ComplaintSection({
  title,
  complaints,
  onSelect,
  limit,
}) {

  const displayedComplaints = limit
    ? complaints.slice(0, limit)
    : complaints

  return (
    <div style={styles.complaintCard}>

      <div style={styles.complaintHeader}>

        <h2 style={styles.sectionHeading}>
          {title}
        </h2>

        <span style={styles.complaintCount}>
          {complaints.length}
        </span>

      </div>


      {displayedComplaints.length === 0 ? (

        <div style={styles.emptyState}>

          <div style={styles.emptyIcon}>
            📭
          </div>

          <h3>
            No complaints found
          </h3>

          <p>
            There are currently no complaints
            in this section.
          </p>

        </div>

      ) : (

        <div style={styles.complaintList}>

          {displayedComplaints.map(
            (complaint) => (

              <div
                key={complaint.id}
                style={styles.complaintRow}
                onClick={() =>
                  onSelect(complaint)
                }
              >

                <div style={styles.complaintMain}>

                  <div style={styles.complaintId}>
                    {complaint.complaint_id ||
                      `Complaint #${complaint.id}`}
                  </div>

                  <div style={styles.complaintCategory}>
                    {formatCategory(
                      complaint.category
                    )}
                  </div>

                  <div style={styles.complaintDescription}>
                    {complaint.description ||
                      "No description provided"}
                  </div>

                  <div style={styles.complaintAddress}>
                    📍{" "}
                    {complaint.address ||
                      "Address not available"}
                  </div>

                </div>


                <div style={styles.complaintRight}>

                  <StatusBadge
                    status={complaint.status}
                  />

                  <PriorityBadge
                    priority={complaint.priority}
                  />

                  <span style={styles.viewArrow}>
                    →
                  </span>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>
  )
}


// =======================================================
// STATUS BADGE
// =======================================================

function StatusBadge({ status }) {

  const statusMap = {
    SUBMITTED: {
      label: "Submitted",
      background: "#f3f4f6",
      color: "#374151",
    },

    UNDER_REVIEW: {
      label: "Under Review",
      background: "#fef3c7",
      color: "#92400e",
    },

    APPROVED: {
      label: "Approved",
      background: "#dbeafe",
      color: "#1d4ed8",
    },

    ASSIGNED: {
      label: "Assigned",
      background: "#fef3c7",
      color: "#92400e",
    },

    IN_PROGRESS: {
      label: "In Progress",
      background: "#dbeafe",
      color: "#1d4ed8",
    },

    RESOLVED: {
      label: "Resolved",
      background: "#dcfce7",
      color: "#166534",
    },

    VERIFIED: {
      label: "Verified",
      background: "#dcfce7",
      color: "#166534",
    },

    CLOSED: {
      label: "Closed",
      background: "#e5e7eb",
      color: "#374151",
    },

    REOPENED: {
      label: "Reopened",
      background: "#fee2e2",
      color: "#991b1b",
    },
  }

  const current =
    statusMap[status] || {
      label: status || "Unknown",
      background: "#f3f4f6",
      color: "#374151",
    }

  return (
    <span
      style={{
        ...styles.badge,
        background: current.background,
        color: current.color,
      }}
    >
      {current.label}
    </span>
  )
}


// =======================================================
// PRIORITY BADGE
// =======================================================

function PriorityBadge({ priority }) {

  if (!priority) {
    return null
  }

  const map = {
    LOW: {
      background: "#f3f4f6",
      color: "#4b5563",
    },

    MEDIUM: {
      background: "#fef3c7",
      color: "#92400e",
    },

    HIGH: {
      background: "#fee2e2",
      color: "#b91c1c",
    },

    CRITICAL: {
      background: "#7f1d1d",
      color: "#ffffff",
    },
  }

  const current =
    map[priority] || map.MEDIUM

  return (
    <span
      style={{
        ...styles.priorityBadge,
        background: current.background,
        color: current.color,
      }}
    >
      {priority}
    </span>
  )
}


// =======================================================
// COMPLAINT MODAL
// =======================================================

function ComplaintModal({
  complaint,
  onClose,
  onStatusUpdate,
}) {

  const canStart =
    complaint.status === "ASSIGNED"

  const canResolve =
    complaint.status === "IN_PROGRESS"

  return (
    <div style={styles.modalOverlay}>

      <div style={styles.modal}>

        {/* HEADER */}

        <div style={styles.modalHeader}>

          <div>

            <div style={styles.modalComplaintId}>
              {complaint.complaint_id ||
                `Complaint #${complaint.id}`}
            </div>

            <h2 style={styles.modalTitle}>
              {formatCategory(
                complaint.category
              )}
            </h2>

          </div>

          <button
            onClick={onClose}
            style={styles.closeButton}
          >
            ×
          </button>

        </div>


        {/* BODY */}

        <div style={styles.modalBody}>

          <div style={styles.modalBadges}>

            <StatusBadge
              status={complaint.status}
            />

            <PriorityBadge
              priority={complaint.priority}
            />

          </div>


          <div style={styles.detailBlock}>

            <h4>Description</h4>

            <p>
              {complaint.description ||
                "No description available."}
            </p>

          </div>


          <div style={styles.detailBlock}>

            <h4>Location</h4>

            <p>
              📍{" "}
              {complaint.address ||
                "Address not available"}
            </p>

            {complaint.latitude &&
              complaint.longitude && (
                <p style={styles.coordinates}>
                  Coordinates:{" "}
                  {complaint.latitude},{" "}
                  {complaint.longitude}
                </p>
              )}

          </div>


          <div style={styles.detailGrid}>

            <div>
              <strong>Ward</strong>

              <div>
                {complaint.ward_number
                  ? `Ward ${complaint.ward_number}`
                  : "Not assigned"}
              </div>
            </div>


            <div>
              <strong>Department</strong>

              <div>
                {complaint.department_name ||
                  "Not assigned"}
              </div>
            </div>


            <div>
              <strong>Created</strong>

              <div>
                {complaint.created_at
                  ? formatDate(
                      complaint.created_at
                    )
                  : "N/A"}
              </div>
            </div>

          </div>


          {/* IMAGE */}

          {complaint.image && (
            <div style={styles.detailBlock}>

              <h4>Complaint Image</h4>

              <img
                src={complaint.image}
                alt="Complaint"
                style={styles.complaintImage}
              />

            </div>
          )}

        </div>


        {/* FOOTER */}

        <div style={styles.modalFooter}>

          <button
            onClick={onClose}
            style={styles.cancelButton}
          >
            Close
          </button>


          {canStart && (
            <button
              onClick={() =>
                onStatusUpdate(
                  complaint.id,
                  "IN_PROGRESS"
                )
              }
              style={styles.startButton}
            >
              ▶ Start Work
            </button>
          )}


          {canResolve && (
            <button
              onClick={() =>
                onStatusUpdate(
                  complaint.id,
                  "RESOLVED"
                )
              }
              style={styles.resolveButton}
            >
              ✓ Mark Resolved
            </button>
          )}

        </div>

      </div>

    </div>
  )
}


// =======================================================
// HELPERS
// =======================================================

function formatCategory(category) {

  if (!category) {
    return "Unknown Category"
  }

  return category
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
}


function formatDate(dateString) {

  if (!dateString) {
    return "N/A"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}


// =======================================================
// STYLES
// =======================================================

const styles = {

  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f4f7fb",
    color: "#1f2937",
  },

  // SIDEBAR

  sidebar: {
    width: "250px",
    minHeight: "100vh",
    background: "#111827",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
  },

  logoSection: {
    padding: "25px 22px",
    borderBottom: "1px solid #374151",
  },

  logo: {
    fontSize: "30px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  logoSubtitle: {
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "4px",
    lineHeight: "1.4",
  },

  sidebarProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px",
    borderBottom: "1px solid #374151",
    cursor: "pointer",
  },

  sidebarProfileImage: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  sidebarAvatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "700",
  },

  sidebarProfileInfo: {
    minWidth: 0,
  },

  sidebarName: {
    fontSize: "14px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "150px",
  },

  sidebarRole: {
    color: "#9ca3af",
    fontSize: "12px",
    marginTop: "3px",
  },

  nav: {
    padding: "18px 12px",
    flex: 1,
  },

  navItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    border: "none",
    background: "transparent",
    color: "#d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
    marginBottom: "5px",
  },

  navItemActive: {
    background: "#2563eb",
    color: "#ffffff",
  },

  navBadge: {
    marginLeft: "auto",
    background: "#ffffff",
    color: "#2563eb",
    borderRadius: "20px",
    minWidth: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
  },

  sidebarBottom: {
    padding: "14px 12px 20px",
    borderTop: "1px solid #374151",
  },

  profileButton: {
    width: "100%",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "12px 14px",
    border: "none",
    background: "transparent",
    color: "#d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
    marginBottom: "5px",
  },

  logoutButton: {
    width: "100%",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "12px 14px",
    border: "none",
    background: "transparent",
    color: "#fca5a5",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
  },

  // MAIN

  main: {
    marginLeft: "250px",
    width: "calc(100% - 250px)",
    minHeight: "100vh",
  },

  header: {
    height: "78px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
  },

  pageSubtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  topProfile: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: "7px 10px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  topProfileImage: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  topAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "17px",
  },

  topProfileText: {
    textAlign: "left",
  },

  topProfileName: {
    fontSize: "13px",
    fontWeight: "700",
  },

  topProfileRole: {
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "2px",
  },

  profileArrow: {
    color: "#9ca3af",
    fontSize: "22px",
  },

  // CONTENT

  statsGrid: {
    padding: "28px 30px 0",
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
  },

  statCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    border: "1px solid #e5e7eb",
  },

  statIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  statTitle: {
    fontSize: "12px",
    color: "#6b7280",
  },

  statValue: {
    fontSize: "27px",
    fontWeight: "700",
    marginTop: "3px",
  },

  statSubtitle: {
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "2px",
  },

  infoGrid: {
    padding: "22px 30px 0",
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px",
  },

  infoCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "22px",
  },

  cardTitle: {
    margin: "0 0 15px",
    fontSize: "17px",
    fontWeight: "700",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "11px 0",
    borderBottom: "1px solid #f3f4f6",
  },

  infoLabel: {
    fontSize: "13px",
    color: "#6b7280",
  },

  infoValue: {
    fontSize: "13px",
    fontWeight: "600",
    textAlign: "right",
  },

  complaintCard: {
    margin: "22px 30px 30px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
  },

  complaintHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "20px 22px",
    borderBottom: "1px solid #e5e7eb",
  },

  sectionHeading: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "700",
  },

  complaintCount: {
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: "20px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "700",
  },

  complaintList: {
    display: "flex",
    flexDirection: "column",
  },

  complaintRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    padding: "18px 22px",
    borderBottom: "1px solid #f3f4f6",
    cursor: "pointer",
  },

  complaintMain: {
    minWidth: 0,
    flex: 1,
  },

  complaintId: {
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "700",
  },

  complaintCategory: {
    fontSize: "15px",
    fontWeight: "700",
    marginTop: "5px",
  },

  complaintDescription: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "5px",
    lineHeight: "1.5",
  },

  complaintAddress: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "7px",
  },

  complaintRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "7px",
  },

  badge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  priorityBadge: {
    display: "inline-flex",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "9px",
    fontWeight: "700",
  },

  viewArrow: {
    color: "#9ca3af",
    fontSize: "18px",
  },

  emptyState: {
    padding: "55px 20px",
    textAlign: "center",
    color: "#6b7280",
  },

  emptyIcon: {
    fontSize: "40px",
  },

  placeholderCard: {
    margin: "30px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "80px 30px",
    textAlign: "center",
  },

  placeholderIcon: {
    fontSize: "50px",
    marginBottom: "15px",
  },

  // ERROR

  errorBox: {
    margin: "20px 30px 0",
    padding: "14px 16px",
    borderRadius: "9px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: "13px",
  },

  retryButton: {
    marginLeft: "12px",
    border: "none",
    background: "#991b1b",
    color: "#ffffff",
    padding: "7px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  // MODAL

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,24,39,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 100,
  },

  modal: {
    width: "100%",
    maxWidth: "720px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "15px",
    boxShadow:
      "0 25px 60px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #e5e7eb",
  },

  modalComplaintId: {
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "700",
  },

  modalTitle: {
    margin: "5px 0 0",
    fontSize: "21px",
  },

  closeButton: {
    width: "34px",
    height: "34px",
    border: "none",
    background: "#f3f4f6",
    borderRadius: "50%",
    fontSize: "23px",
    cursor: "pointer",
  },

  modalBody: {
    padding: "24px",
  },

  modalBadges: {
    display: "flex",
    gap: "8px",
    marginBottom: "22px",
  },

  detailBlock: {
    marginBottom: "22px",
  },


  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "15px",
    padding: "18px",
    background: "#f9fafb",
    borderRadius: "9px",
    marginBottom: "22px",
  },

  coordinates: {
    color: "#9ca3af",
    fontSize: "12px",
  },

  complaintImage: {
    width: "100%",
    maxHeight: "300px",
    objectFit: "cover",
    borderRadius: "10px",
    marginTop: "7px",
  },

  modalFooter: {
    padding: "17px 24px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  cancelButton: {
    padding: "10px 17px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  startButton: {
    padding: "10px 17px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  resolveButton: {
    padding: "10px 17px",
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  // LOADING

  loadingPage: {
    minHeight: "100vh",
    background: "#f4f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingBox: {
    background: "#ffffff",
    padding: "35px 45px",
    borderRadius: "15px",
    textAlign: "center",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.08)",
  },

  loadingSpinner: {
    fontSize: "30px",
  },
}

export default OfficerDashboard