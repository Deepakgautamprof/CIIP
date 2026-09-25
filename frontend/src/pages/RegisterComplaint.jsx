import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./RegisterComplaint.css"

const API_BASE = "http://127.0.0.1:8000/api"

function RegisterComplaint() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)

  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [ward, setWard] = useState("")
  const [image, setImage] = useState(null)
  const [location, setLocation] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const categories = [
    {
      value: "POTHOLE",
      icon: "🕳️",
      name: "Pothole",
    },
    {
      value: "ROAD_DAMAGE",
      icon: "🛣️",
      name: "Road Damage",
    },
    {
      value: "GARBAGE",
      icon: "🗑️",
      name: "Garbage",
    },
    {
      value: "STREETLIGHT",
      icon: "💡",
      name: "Streetlight",
    },
    {
      value: "WATER_LEAKAGE",
      icon: "💧",
      name: "Water Leakage",
    },
    {
      value: "DRAINAGE",
      icon: "🚰",
      name: "Drainage",
    },
    {
      value: "ENCROACHMENT",
      icon: "🏪",
      name: "Encroachment",
    },
    {
      value: "OTHER",
      icon: "•••",
      name: "Other",
    },
  ]

  // =====================================================
  // LOCATION
  // =====================================================

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert(
        "Location is not supported by your browser."
      )
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          Number(position.coords.latitude.toFixed(7))

        const longitude =
          Number(position.coords.longitude.toFixed(7))

        setLocation({
          latitude,
          longitude,
        })

        alert(
          "Location detected successfully."
        )
      },
      (error) => {
        console.error(
          "Geolocation error:",
          error
        )

        alert(
          "Unable to detect your location. Please allow location permission."
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // =====================================================
  // NEXT STEP
  // =====================================================

  const nextStep = () => {
    if (step === 1) {
      if (!category) {
        alert(
          "Please select a complaint category."
        )
        return
      }

      if (!description.trim()) {
        alert(
          "Please describe the problem."
        )
        return
      }
    }

    if (step === 2) {
      if (!address.trim()) {
        alert(
          "Please enter the address or landmark."
        )
        return
      }
    }

    setStep((previousStep) =>
      previousStep + 1
    )
  }

  // =====================================================
  // PREVIOUS STEP
  // =====================================================

  const previousStep = () => {
    if (step > 1) {
      setStep((previousStep) =>
        previousStep - 1
      )
    }
  }

  // =====================================================
  // SUBMIT COMPLAINT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (submitting) {
      return
    }

    const token =
      localStorage.getItem("ciip_token")

    if (!token) {
      alert(
        "Your session has expired. Please login again."
      )
      navigate("/login")
      return
    }

    // -----------------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------------

    if (!category) {
      alert(
        "Please select a complaint category."
      )
      setStep(1)
      return
    }

    if (!description.trim()) {
      alert(
        "Please describe the problem."
      )
      setStep(1)
      return
    }

    if (!address.trim()) {
      alert(
        "Please enter the address or landmark."
      )
      setStep(2)
      return
    }

    // -----------------------------------------------
    // GPS VALIDATION
    // -----------------------------------------------

    if (location) {
      const latitude =
        Number(location.latitude)

      const longitude =
        Number(location.longitude)

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        alert(
          "Invalid GPS coordinates. Please detect your location again."
        )
        return
      }

      if (
        latitude < -90 ||
        latitude > 90
      ) {
        alert(
          "Invalid latitude value."
        )
        return
      }

      if (
        longitude < -180 ||
        longitude > 180
      ) {
        alert(
          "Invalid longitude value."
        )
        return
      }
    }

    setSubmitting(true)

    try {
      // =================================================
      // FORM DATA
      // =================================================

      const formData =
        new FormData()

      formData.append(
        "category",
        category
      )

      formData.append(
        "description",
        description.trim()
      )

      formData.append(
        "address",
        address.trim()
      )

      // =================================================
      // WARD
      // =================================================
      //
      // IMPORTANT:
      // Backend ward is a ForeignKey.
      // The current text field cannot safely send
      // "Ward 42" to a ForeignKey field.
      //
      // Ward will be connected with a proper dropdown
      // using Ward IDs in the next step.
      //
      // Therefore we intentionally DO NOT send the
      // current text value here.
      //
      // =================================================

      // =================================================
      // GPS
      // =================================================

      if (location) {
        const latitude =
          Number(
            Number(location.latitude).toFixed(7)
          )

        const longitude =
          Number(
            Number(location.longitude).toFixed(7)
          )

        formData.append(
          "latitude",
          latitude.toString()
        )

        formData.append(
          "longitude",
          longitude.toString()
        )
      }

      // =================================================
      // IMAGE
      // =================================================

      if (image) {
        formData.append(
          "image",
          image
        )
      }

      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "Submitting complaint..."
      )

      console.log(
        "Category:",
        category
      )

      console.log(
        "Description:",
        description.trim()
      )

      console.log(
        "Address:",
        address.trim()
      )

      console.log(
        "Location:",
        location
      )

      // =================================================
      // API REQUEST
      // =================================================

      const response =
        await fetch(
          `${API_BASE}/complaints/`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Token ${token}`,
            },

            body: formData,
          }
        )

      // =================================================
      // RESPONSE
      // =================================================

      let data = {}

      try {
        data =
          await response.json()
      } catch (jsonError) {
        console.error(
          "Unable to parse API response:",
          jsonError
        )

        data = {}
      }

      console.log(
        "Complaint API Status:",
        response.status
      )

      console.log(
        "Complaint API Response:",
        data
      )

      // =================================================
      // SESSION EXPIRED
      // =================================================

      if (response.status === 401) {
        alert(
          "Your session has expired. Please login again."
        )

        localStorage.clear()

        navigate("/login")

        return
      }

      // =================================================
      // VALIDATION ERROR
      // =================================================

      if (!response.ok) {
        console.error(
          "Complaint submission error:",
          data
        )

        if (data.detail) {
          alert(
            data.detail
          )
        } else if (data.longitude) {
          alert(
            `Longitude error: ${data.longitude[0]}`
          )
        } else if (data.latitude) {
          alert(
            `Latitude error: ${data.latitude[0]}`
          )
        } else if (data.category) {
          alert(
            `Category error: ${data.category[0]}`
          )
        } else if (data.description) {
          alert(
            `Description error: ${data.description[0]}`
          )
        } else if (data.address) {
          alert(
            `Address error: ${data.address[0]}`
          )
        } else if (data.image) {
          alert(
            `Image error: ${data.image[0]}`
          )
        } else if (data.ward) {
          alert(
            `Ward error: ${data.ward[0]}`
          )
        } else {
          alert(
            "Complaint submission failed. Please check the entered information."
          )
        }

        return
      }

      // =================================================
      // SUCCESS
      // =================================================

      const complaintId =
        data.complaint_id ||
        "Generated successfully"

      alert(
        `Complaint submitted successfully!\n\nComplaint ID: ${complaintId}`
      )

      // =================================================
      // RESET FORM
      // =================================================

      setStep(1)
      setCategory("")
      setDescription("")
      setAddress("")
      setWard("")
      setImage(null)
      setLocation(null)

      // =================================================
      // GO TO DASHBOARD
      // =================================================

      navigate("/dashboard")

    } catch (error) {
      console.error(
        "Network error:",
        error
      )

      alert(
        "Unable to connect to CIIP server.\n\nPlease make sure Django server is running."
      )
    } finally {
      setSubmitting(false)
    }
  }

  // =====================================================
  // SELECTED CATEGORY
  // =====================================================

  const selectedCategory =
    categories.find(
      (item) =>
        item.value === category
    )

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="complaint-page">

      {/* ================= NAVBAR ================= */}

      <header className="complaint-navbar">

        <div className="brand">

          <div className="brand-logo">
            🏛️
          </div>

          <div>
            <h2>
              CIIP
            </h2>

            <span>
              Civic Infrastructure Intelligence
            </span>
          </div>

        </div>

        <div className="secure">
          🔒 Secure Citizen Portal
        </div>

      </header>

      {/* ================= MAIN ================= */}

      <main className="complaint-main">

        <div className="page-heading">

          <div>

            <p className="eyebrow">
              CITIZEN SERVICES
            </p>

            <h1>
              Report a Civic Issue
            </h1>

            <p>
              Help us identify and resolve problems in your neighbourhood.
            </p>

          </div>

          {/* ================= STEP INDICATOR ================= */}

          <div className="step-indicator">

            <div
              className={
                step >= 1
                  ? "step active-step"
                  : "step"
              }
            >
              <span>
                1
              </span>

              <small>
                Issue
              </small>
            </div>

            <div
              className={
                step >= 2
                  ? "step-line active-line"
                  : "step-line"
              }
            />

            <div
              className={
                step >= 2
                  ? "step active-step"
                  : "step"
              }
            >
              <span>
                2
              </span>

              <small>
                Location
              </small>
            </div>

            <div
              className={
                step >= 3
                  ? "step-line active-line"
                  : "step-line"
              }
            />

            <div
              className={
                step >= 3
                  ? "step active-step"
                  : "step"
              }
            >
              <span>
                3
              </span>

              <small>
                Review
              </small>
            </div>

          </div>

        </div>

        <form
          onSubmit={handleSubmit}
        >

          {/* =================================================
              STEP 1
              ================================================= */}

          {step === 1 && (

            <section className="form-card">

              <div className="card-title">

                <div className="title-icon">
                  📋
                </div>

                <div>

                  <h2>
                    What is the problem?
                  </h2>

                  <p>
                    Select the category that best describes the issue.
                  </p>

                </div>

              </div>

              {/* CATEGORY */}

              <div className="category-grid">

                {categories.map(
                  (item) => (

                    <button
                      type="button"
                      key={item.value}
                      className={
                        category === item.value
                          ? "category-card selected"
                          : "category-card"
                      }
                      onClick={() =>
                        setCategory(
                          item.value
                        )
                      }
                    >

                      <span>
                        {item.icon}
                      </span>

                      <strong>
                        {item.name}
                      </strong>

                    </button>

                  )
                )}

              </div>

              {/* DESCRIPTION */}

              <div className="input-group">

                <label>
                  Describe the problem{" "}
                  <span>*</span>
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Tell us what happened and provide any useful details..."
                  rows="7"
                />

                <small>
                  Clear information helps authorities understand the issue faster.
                </small>

              </div>

              {/* BUTTON */}

              <div className="form-actions">

                <div />

                <button
                  type="button"
                  className="submit-btn"
                  onClick={nextStep}
                >
                  Continue →
                </button>

              </div>

            </section>

          )}

          {/* =================================================
              STEP 2
              ================================================= */}

          {step === 2 && (

            <div className="form-layout">

              {/* ================= PHOTO ================= */}

              <section className="form-card">

                <div className="card-title">

                  <div className="title-icon">
                    📷
                  </div>

                  <div>

                    <h2>
                      Add a photo
                    </h2>

                    <p>
                      Photos help verify and understand the issue.
                    </p>

                  </div>

                </div>

                <label className="upload-box">

                  {image ? (

                    <div className="selected-file">

                      <div className="file-icon">
                        🖼️
                      </div>

                      <strong>
                        {image.name}
                      </strong>

                      <small>
                        Photo selected
                      </small>

                    </div>

                  ) : (

                    <>

                      <div className="upload-icon">
                        ☁️
                      </div>

                      <strong>
                        Upload a photo
                      </strong>

                      <span>
                        PNG, JPG or JPEG
                      </span>

                      <span className="browse">
                        Browse files
                      </span>

                    </>

                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => {

                      const selectedImage =
                        e.target.files?.[0]

                      if (
                        selectedImage
                      ) {

                        if (
                          !selectedImage.type.startsWith(
                            "image/"
                          )
                        ) {
                          alert(
                            "Please select a valid image."
                          )
                          return
                        }

                        if (
                          selectedImage.size >
                          5 * 1024 * 1024
                        ) {
                          alert(
                            "Image must be smaller than 5 MB."
                          )
                          return
                        }

                        setImage(
                          selectedImage
                        )
                      }

                    }}
                  />

                </label>

              </section>

              {/* ================= LOCATION ================= */}

              <section className="form-card">

                <div className="card-title">

                  <div className="title-icon">
                    📍
                  </div>

                  <div>

                    <h2>
                      Where is the issue?
                    </h2>

                    <p>
                      Provide the location so authorities can respond.
                    </p>

                  </div>

                </div>

                {/* CURRENT LOCATION */}

                <button
                  type="button"
                  className="location-btn"
                  onClick={
                    getLocation
                  }
                >
                  📍 Use my current location
                </button>

                {location && (

                  <div className="location-success">

                    ✅ Location detected

                    <small>
                      {Number(
                        location.latitude
                      ).toFixed(7)}
                      {", "}
                      {Number(
                        location.longitude
                      ).toFixed(7)}
                    </small>

                  </div>

                )}

                <div className="location-divider">

                  <span>
                    OR ENTER MANUALLY
                  </span>

                </div>

                {/* ADDRESS */}

                <div className="input-group">

                  <label>
                    Address / Landmark{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    value={address}
                    onChange={(e) =>
                      setAddress(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Near City Mall, Main Road"
                  />

                </div>

                {/* WARD */}

                <div className="input-group">

                  <label>
                    Ward
                  </label>

                  <input
                    type="text"
                    value={ward}
                    onChange={(e) =>
                      setWard(
                        e.target.value
                      )
                    }
                    placeholder="Optional — Ward will be assigned by CIIP"
                  />

                  <small>
                    Ward assignment will be handled by the CIIP government workflow.
                  </small>

                </div>

              </section>

              {/* ================= BUTTONS ================= */}

              <div className="form-actions full-width">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    previousStep
                  }
                >
                  ← Back
                </button>

                <button
                  type="button"
                  className="submit-btn"
                  onClick={
                    nextStep
                  }
                >
                  Continue →
                </button>

              </div>

            </div>

          )}

          {/* =================================================
              STEP 3
              ================================================= */}

          {step === 3 && (

            <section className="form-card review-card">

              <div className="card-title">

                <div className="title-icon">
                  🔍
                </div>

                <div>

                  <h2>
                    Review your complaint
                  </h2>

                  <p>
                    Please check the information before submitting.
                  </p>

                </div>

              </div>

              {/* REVIEW */}

              <div className="review-grid">

                <div className="review-item">

                  <span>
                    Complaint Category
                  </span>

                  <strong>

                    {selectedCategory?.icon}

                    {" "}

                    {selectedCategory?.name ||
                      "Not selected"}

                  </strong>

                </div>

                <div className="review-item">

                  <span>
                    Location
                  </span>

                  <strong>
                    {address ||
                      "Not provided"}
                  </strong>

                </div>

                <div className="review-item">

                  <span>
                    Ward
                  </span>

                  <strong>
                    {ward ||
                      "Will be assigned by CIIP"}
                  </strong>

                </div>

                <div className="review-item">

                  <span>
                    GPS Coordinates
                  </span>

                  <strong>

                    {location
                      ? `${Number(
                          location.latitude
                        ).toFixed(7)}, ${Number(
                          location.longitude
                        ).toFixed(7)}`
                      : "Not detected"}

                  </strong>

                </div>

                <div className="review-item">

                  <span>
                    Photo
                  </span>

                  <strong>
                    {image
                      ? image.name
                      : "No photo uploaded"}
                  </strong>

                </div>

                <div className="review-description">

                  <span>
                    Description
                  </span>

                  <p>
                    {description}
                  </p>

                </div>

              </div>

              {/* ================= AI NOTICE ================= */}

              <div className="ai-notice">

                <div className="ai-icon">
                  🤖
                </div>

                <div>

                  <strong>
                    AI-assisted prioritization
                  </strong>

                  <p>
                    After submission, CIIP will analyze the complaint
                    and recommend its severity and priority to the
                    concerned authority.
                  </p>

                </div>

              </div>

              {/* ================= BUTTONS ================= */}

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    previousStep
                  }
                  disabled={
                    submitting
                  }
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Complaint ✓"}
                </button>

              </div>

            </section>

          )}

        </form>

      </main>

    </div>
  )
}

export default RegisterComplaint