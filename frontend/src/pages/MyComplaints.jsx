import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./MyComplaints.css"

function MyComplaints() {
  const navigate = useNavigate()

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchComplaints = async () => {
    const token = localStorage.getItem("ciip_token")

    if (!token) {
      navigate("/login")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        "http://127.0.0.1:8000/api/complaints/",
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear()
          navigate("/login")
          return
        }

        setError("Unable to load complaints.")
        return
      }

      if (Array.isArray(data)) {
        setComplaints(data)
      } else if (Array.isArray(data.results)) {
        setComplaints(data.results)
      } else {
        setComplaints([])
      }

    } catch (err) {
      console.error(err)
      setError("Unable to connect to CIIP server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const getCategoryName = (category) => {
    const categories = {
      POTHOLE: "Pothole",
      ROAD_DAMAGE: "Road Damage",
      GARBAGE: "Garbage",
      STREETLIGHT: "Broken Streetlight",
      WATER_LEAKAGE: "Water Leakage",
      DRAINAGE: "Drainage Problem",
      ILLEGAL_DUMPING: "Illegal Dumping",
      ENCROACHMENT: "Encroachment",
      TRAFFIC_SIGNAL: "Traffic Signal Problem",
      OTHER: "Other",
    }

    return categories[category] || category
  }

  const getIcon = (category) => {
    const icons = {
      POTHOLE: "🕳️",
      ROAD_DAMAGE: "🛣️",
      GARBAGE: "🗑️",
      STREETLIGHT: "💡",
      WATER_LEAKAGE: "💧",
      DRAINAGE: "🚰",
      ILLEGAL_DUMPING: "🗑️",
      ENCROACHMENT: "🏪",
      TRAFFIC_SIGNAL: "🚦",
      OTHER: "📋",
    }

    return icons[category] || "📋"
  }

  const getStatusName = (status) => {
    const names = {
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

    return names[status] || status
  }

  const getStatusClass = (status) => {
    if (
      ["RESOLVED", "VERIFIED", "CLOSED"].includes(status)
    ) {
      return "resolved"
    }

    if (
      ["ASSIGNED", "IN_PROGRESS"].includes(status)
    ) {
      return "progress"
    }

    if (status === "REOPENED") {
      return "reopened"
    }

    return "pending"
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "critical"
      case "HIGH":
        return "high"
      case "MEDIUM":
        return "medium"
      case "LOW":
        return "low"
      default:
        return "medium"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Date unavailable"

    const date = new Date(dateString)

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="complaints-page">

      {/* Navbar */}
      <nav className="complaints-navbar">

        <div className="complaints-brand">
          <div className="brand-icon">🏛️</div>

          <div>
            <h2>CIIP</h2>
            <span>
              Civic Infrastructure Intelligence Platform
            </span>
          </div>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </nav>

      {/* Main */}
      <main className="complaints-main">

        <div className="complaints-header">

          <div>
            <h1>My Complaints</h1>

            <p>
              View and track all your submitted civic complaints.
            </p>
          </div>

          <button
            className="new-complaint-btn"
            onClick={() => navigate("/complaint")}
          >
            + New Complaint
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="error-box">
            {error}

            <button onClick={fetchComplaints}>
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="complaints-empty">
            <div className="empty-icon">⏳</div>

            <h3>Loading complaints...</h3>

            <p>
              Please wait while we fetch your complaints.
            </p>
          </div>
        )}

        {/* No complaints */}
        {!loading && complaints.length === 0 && (
          <div className="complaints-empty">

            <div className="empty-icon">📭</div>

            <h3>No complaints found</h3>

            <p>
              You have not submitted any civic complaints yet.
            </p>

            <button
              className="new-complaint-btn"
              onClick={() => navigate("/complaint")}
            >
              Register Complaint
            </button>

          </div>
        )}

        {/* Complaints */}
        {!loading && complaints.length > 0 && (

          <div className="complaints-list">

            {complaints.map((complaint) => (

              <div
                className="complaint-card"
                key={complaint.id}
              >

                <div className="complaint-top">

                  <div className="complaint-title">

                    <div className="complaint-icon">
                      {getIcon(complaint.category)}
                    </div>

                    <div>
                      <h3>
                        {getCategoryName(
                          complaint.category
                        )}
                      </h3>

                      <span>
                        {complaint.complaint_id}
                      </span>
                    </div>

                  </div>

                  <span
                    className={`status-badge ${getStatusClass(
                      complaint.status
                    )}`}
                  >
                    {getStatusName(complaint.status)}
                  </span>

                </div>

                <div className="complaint-details">

                  <div className="detail-item">
                    <span>📅 Date</span>
                    <strong>
                      {formatDate(
                        complaint.created_at
                      )}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>⚡ Priority</span>

                    <strong
                      className={`priority-text ${getPriorityClass(
                        complaint.priority
                      )}`}
                    >
                      {complaint.priority || "MEDIUM"}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>📍 Ward</span>

                    <strong>
                      {complaint.ward || "Not specified"}
                    </strong>
                  </div>

                </div>

                <div className="complaint-description">

                  <span>Description</span>

                  <p>
                    {complaint.description}
                  </p>

                </div>

                {complaint.address && (
                  <div className="complaint-address">

                    <span>📍 Location</span>

                    <p>
                      {complaint.address}
                    </p>

                  </div>
                )}

                <div className="complaint-footer">

                  <span>
                    Department:{" "}
                    {complaint.department
                      ? `Department #${complaint.department}`
                      : "Not assigned"}
                  </span>

                  <button
                    onClick={() =>
                      alert(
                        `Complaint ${complaint.complaint_id}\n\nStatus: ${getStatusName(
                          complaint.status
                        )}\nPriority: ${
                          complaint.priority
                        }`
                      )
                    }
                  >
                    Track Complaint →
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  )
}

export default MyComplaints