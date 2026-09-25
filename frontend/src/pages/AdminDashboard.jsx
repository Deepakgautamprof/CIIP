import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./AdminDashboard.css"

const API_BASE = "http://127.0.0.1:8000/api"

const menuItems = [
  { id: "overview", icon: "⌂", label: "Overview" },
  { id: "departments", icon: "▦", label: "Departments" },
  { id: "officers", icon: "♙", label: "Officers" },
  { id: "admins", icon: "♜", label: "Government Admins" },
  { id: "citizens", icon: "♟", label: "Citizens" },
  { id: "complaints", icon: "▤", label: "Complaints" },
  { id: "wards", icon: "⌖", label: "Ward Management" },
  { id: "gis", icon: "◉", label: "GIS Intelligence" },
  { id: "ai", icon: "✦", label: "AI Intelligence" },
  { id: "analytics", icon: "▥", label: "Analytics & Reports" },
  { id: "audit", icon: "◷", label: "Audit Logs" },
  { id: "settings", icon: "⚙", label: "System Settings" },
]

const emptyOfficer = {
  full_name: "",
  username: "",
  password: "",
  phone: "",
  department: "",
  employee_id: "",
  designation: "",
  ward: "",
}

const emptyAdmin = {
  full_name: "",
  username: "",
  password: "",
  phone: "",
  department: "",
}

const emptyWardAdmin = {
  full_name: "",
  username: "",
  password: "",
  phone: "",
  ward: "",
}

function getInitials(name) {
  if (!name) return "DG"

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")
}

function getWardLabel(ward) {
  if (!ward) return "Not assigned"

  if (typeof ward === "object") {
    return `Ward ${ward.ward_number || ward.id || ""}${
      ward.name ? ` - ${ward.name}` : ""
    }`
  }

  return String(ward)
}

function normalizeWardValue(ward) {
  if (!ward) return ""

  if (typeof ward === "object") {
    return String(ward.id || "")
  }

  return String(ward)
}

function getStatusClass(status) {
  if (!status) return "badge neutral"

  const value = status.toLowerCase()

  if (
    value.includes("resolved") ||
    value.includes("closed") ||
    value.includes("verified")
  ) {
    return "badge success"
  }

  if (
    value.includes("progress") ||
    value.includes("review") ||
    value.includes("assigned")
  ) {
    return "badge warning"
  }

  if (
    value.includes("critical") ||
    value.includes("reopen")
  ) {
    return "badge danger"
  }

  return "badge neutral"
}

function getPriorityClass(priority) {
  if (!priority) return "badge neutral"

  const value = priority.toLowerCase()

  if (value === "critical") return "badge danger"
  if (value === "high") return "badge high"
  if (value === "medium") return "badge warning"

  return "badge success"
}

function extractList(data) {
  if (Array.isArray(data)) return data

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}

function getErrorMessage(data, fallback) {
  if (!data) return fallback

  if (typeof data === "string") {
    return data
  }

  if (data.detail) {
    return data.detail
  }

  for (const key of Object.keys(data)) {
    const value = data[key]

    if (Array.isArray(value) && value.length) {
      return `${key}: ${value[0]}`
    }

    if (typeof value === "string") {
      return `${key}: ${value}`
    }
  }

  return fallback
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("overview")

  /* MENU BUTTON STATE */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [profile, setProfile] = useState(null)

  const [profileName, setProfileName] = useState(
    localStorage.getItem("ciip_full_name") || "Deepak Gautam"
  )

  const [departments, setDepartments] = useState([])
  const [wards, setWards] = useState([])
  const [officers, setOfficers] = useState([])
  const [complaints, setComplaints] = useState([])
  const [departmentAdmins, setDepartmentAdmins] = useState([])
  const [wardAdmins, setWardAdmins] = useState([])
  const [citizens, setCitizens] = useState([])

  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileUploading, setProfileUploading] = useState(false)
  const [wardAdminLoading, setWardAdminLoading] = useState(false)

  const [search, setSearch] = useState("")

  const [showOfficerModal, setShowOfficerModal] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState(null)
  const [officerForm, setOfficerForm] = useState({
    ...emptyOfficer,
  })

  const [showAdminModal, setShowAdminModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [adminForm, setAdminForm] = useState({
    ...emptyAdmin,
  })

  const [showWardAdminModal, setShowWardAdminModal] = useState(false)
  const [editingWardAdmin, setEditingWardAdmin] = useState(null)
  const [wardAdminForm, setWardAdminForm] = useState({
    ...emptyWardAdmin,
  })

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [theme, setTheme] = useState(
    localStorage.getItem("ciip_theme") || "light"
  )

  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showProfilePreview, setShowProfilePreview] = useState(false)

  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImage, setCropImage] = useState("")

  const [cropRect, setCropRect] = useState({
    x: 50,
    y: 50,
    width: 220,
    height: 220,
  })

  const [cropBox, setCropBox] = useState({
    width: 500,
    height: 400,
  })

  const cropImageRef = useRef(null)
  const cropContainerRef = useRef(null)
  const cropInteractionRef = useRef(null)

  const token = localStorage.getItem("ciip_token")
  const role = localStorage.getItem("ciip_role")

  const headers = {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
  }

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    )

    localStorage.setItem("ciip_theme", theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    )
  }

  useEffect(() => {
    if (!token || role !== "SUPER_ADMIN") {
      navigate("/login")
      return
    }

    loadProfile()
    loadData()
    loadDepartmentAdmins()
    loadWardAdmins()
    loadWards()
  }, [])

  async function loadProfile() {
    try {
      setProfileLoading(true)

      const response = await fetch(
        `${API_BASE}/users/profile/`,
        {
          headers,
        }
      )

      if (!response.ok) return

      const data = await response.json()

      setProfile(data)

      if (data.full_name) {
        setProfileName(data.full_name)

        localStorage.setItem(
          "ciip_full_name",
          data.full_name
        )
      }

      if (data.profile_photo) {
        localStorage.setItem(
          "ciip_profile_photo_url",
          data.profile_photo
        )
      }
    } catch (err) {
      console.error("Profile loading error:", err)
    } finally {
      setProfileLoading(false)
    }
  }

  async function updateProfileName() {
    if (!profileName.trim()) {
      showError("Name cannot be empty.")
      return
    }

    try {
      setProfileUploading(true)

      const response = await fetch(
        `${API_BASE}/users/profile/`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            full_name: profileName.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to update profile."
          )
        )
      }

      setProfile(data)

      localStorage.setItem(
        "ciip_full_name",
        profileName.trim()
      )

      showSuccess("Profile updated successfully.")
    } catch (err) {
      showError(err.message)
    } finally {
      setProfileUploading(false)
    }
  }

  function openCropper(file) {
    if (!file || !file.type.startsWith("image/")) {
      showError("Please select a valid image.")
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setCropImage(reader.result)

      setCropRect({
        x: 50,
        y: 50,
        width: 220,
        height: 220,
      })

      setShowCropModal(true)
    }

    reader.readAsDataURL(file)
  }

  function handlePhotoSelect(event) {
    const file = event.target.files?.[0]

    if (file) {
      openCropper(file)
    }

    event.target.value = ""
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max))
  }

  function startCropInteraction(event, mode) {
    event.preventDefault()

    cropInteractionRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      initial: {
        ...cropRect,
      },
    }

    window.addEventListener(
      "pointermove",
      handleCropInteraction
    )

    window.addEventListener(
      "pointerup",
      stopCropInteraction
    )
  }

  function handleCropInteraction(event) {
    const interaction = cropInteractionRef.current

    if (!interaction) return

    const dx = event.clientX - interaction.startX
    const dy = event.clientY - interaction.startY

    const initial = interaction.initial

    let next = {
      ...initial,
    }

    if (interaction.mode === "move") {
      next.x = initial.x + dx
      next.y = initial.y + dy

      next.x = clamp(
        next.x,
        0,
        cropBox.width - next.width
      )

      next.y = clamp(
        next.y,
        0,
        cropBox.height - next.height
      )
    }

    if (interaction.mode === "resize") {
      const size = clamp(
        Math.max(
          initial.width + dx,
          initial.height + dy
        ),
        80,
        Math.min(
          cropBox.width - initial.x,
          cropBox.height - initial.y
        )
      )

      next.width = size
      next.height = size
    }

    setCropRect(next)
  }

  function stopCropInteraction() {
    cropInteractionRef.current = null

    window.removeEventListener(
      "pointermove",
      handleCropInteraction
    )

    window.removeEventListener(
      "pointerup",
      stopCropInteraction
    )
  }

  async function cropAndUpload() {
    if (!cropImageRef.current) return

    try {
      setProfileUploading(true)

      const image = cropImageRef.current

      const naturalWidth = image.naturalWidth
      const naturalHeight = image.naturalHeight

      const displayedWidth = image.clientWidth
      const displayedHeight = image.clientHeight

      const scaleX =
        naturalWidth / displayedWidth

      const scaleY =
        naturalHeight / displayedHeight

      const sourceX =
        cropRect.x * scaleX

      const sourceY =
        cropRect.y * scaleY

      const sourceWidth =
        cropRect.width * scaleX

      const sourceHeight =
        cropRect.height * scaleY

      const canvas =
        document.createElement("canvas")

      canvas.width = 700
      canvas.height = 700

      const context =
        canvas.getContext("2d")

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        700,
        700
      )

      const blob = await new Promise(
        (resolve) => {
          canvas.toBlob(
            resolve,
            "image/jpeg",
            0.92
          )
        }
      )

      if (!blob) {
        throw new Error(
          "Unable to process image."
        )
      }

      const formData = new FormData()

      formData.append(
        "profile_photo",
        blob,
        "profile-photo.jpg"
      )

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
        throw new Error(
          getErrorMessage(
            data,
            "Unable to upload profile photo."
          )
        )
      }

      setProfile(data)

      const photo =
        data.profile_photo ||
        data.profile_photo_url ||
        ""

      if (photo) {
        localStorage.setItem(
          "ciip_profile_photo_url",
          photo
        )
      }

      setShowCropModal(false)
      setCropImage("")

      showSuccess(
        "Profile photo updated successfully."
      )
    } catch (err) {
      showError(err.message)
    } finally {
      setProfileUploading(false)
    }
  }

  async function loadData() {
    try {
      setLoading(true)

      const [
        departmentResponse,
        officerResponse,
        complaintResponse,
        citizenResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE}/departments/`,
          { headers }
        ),
        fetch(
          `${API_BASE}/officers/`,
          { headers }
        ),
        fetch(
          `${API_BASE}/complaints/`,
          { headers }
        ),
        fetch(
          `${API_BASE}/users/`,
          { headers }
        ),
      ])

      const departmentData =
        await departmentResponse.json()

      const officerData =
        await officerResponse.json()

      const complaintData =
        await complaintResponse.json()

      const citizenData =
        await citizenResponse.json()

      setDepartments(
        extractList(departmentData)
      )

      setOfficers(
        extractList(officerData)
      )

      setComplaints(
        extractList(complaintData)
      )

      const users =
        extractList(citizenData)

      setCitizens(
        users.filter(
          (user) =>
            user.role === "CITIZEN" ||
            !user.role
        )
      )
    } catch (err) {
      console.error(err)

      showError(
        "Unable to load dashboard data."
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadWards() {
    try {
      let response = await fetch(
        `${API_BASE}/wards/`,
        { headers }
      )

      if (!response.ok) {
        response = await fetch(
          `${API_BASE}/departments/wards/`,
          { headers }
        )
      }

      if (!response.ok) return

      const data =
        await response.json()

      setWards(
        extractList(data)
      )
    } catch (err) {
      console.error(
        "Ward loading error:",
        err
      )
    }
  }

  async function loadDepartmentAdmins() {
    try {
      const response =
        await fetch(
          `${API_BASE}/users/department-admins/`,
          { headers }
        )

      if (!response.ok) return

      const data =
        await response.json()

      setDepartmentAdmins(
        extractList(data)
      )
    } catch (err) {
      console.error(err)
    }
  }

  async function loadWardAdmins() {
    try {
      const response =
        await fetch(
          `${API_BASE}/users/ward-admins/`,
          { headers }
        )

      if (!response.ok) return

      const data =
        await response.json()

      setWardAdmins(
        extractList(data)
      )
    } catch (err) {
      console.error(err)
    }
  }

  function showSuccess(text) {
    setMessage(text)
    setError("")

    setTimeout(() => {
      setMessage("")
    }, 3000)
  }

  function showError(text) {
    setError(text)
    setMessage("")

    setTimeout(() => {
      setError("")
    }, 4000)
  }

  function getDepartmentName(id) {
    const department =
      departments.find(
        (item) =>
          String(item.id) === String(id)
      )

    return (
      department?.name ||
      "Not assigned"
    )
  }

  function getWardName(id) {
    const ward =
      wards.find(
        (item) =>
          String(item.id) === String(id)
      )

    if (!ward) {
      return "Not assigned"
    }

    return `Ward ${
      ward.ward_number || ward.id
    }${
      ward.name
        ? ` - ${ward.name}`
        : ""
    }`
  }

  const stats = useMemo(() => {
    const activeDepartments =
      departments.filter(
        (item) =>
          item.is_active !== false
      ).length

    const activeOfficers =
      officers.filter(
        (item) =>
          item.is_active !== false
      ).length

    const activeAdmins =
      departmentAdmins.filter(
        (item) =>
          item.is_active !== false
      ).length

    const activeWardAdmins =
      wardAdmins.filter(
        (item) =>
          item.is_active !== false
      ).length

    const pending =
      complaints.filter((item) =>
        [
          "SUBMITTED",
          "UNDER_REVIEW",
          "ASSIGNED",
        ].includes(item.status)
      ).length

    const inProgress =
      complaints.filter(
        (item) =>
          item.status === "IN_PROGRESS"
      ).length

    const resolved =
      complaints.filter((item) =>
        [
          "RESOLVED",
          "VERIFIED",
          "CLOSED",
        ].includes(item.status)
      ).length

    const critical =
      complaints.filter(
        (item) =>
          item.priority?.toUpperCase() ===
          "CRITICAL"
      ).length

    return {
      activeDepartments,
      activeOfficers,
      activeAdmins,
      activeWardAdmins,
      pending,
      inProgress,
      resolved,
      critical,
      citizens: citizens.length,
      complaints: complaints.length,
    }
  }, [
    departments,
    officers,
    departmentAdmins,
    wardAdmins,
    complaints,
    citizens,
  ])

  const filteredOfficers =
    useMemo(() => {
      const value =
        search.toLowerCase().trim()

      if (!value) {
        return officers
      }

      return officers.filter(
        (officer) => {
          const text = [
            officer.full_name,
            officer.username,
            officer.user_name,
            officer.employee_id,
            officer.designation,
            officer.department_name,
            getWardLabel(
              officer.ward
            ),
          ]
            .join(" ")
            .toLowerCase()

          return text.includes(value)
        }
      )
    }, [
      officers,
      search,
      wards,
      departments,
    ])

  const filteredComplaints =
    useMemo(() => {
      const value =
        search.toLowerCase().trim()

      if (!value) {
        return complaints
      }

      return complaints.filter(
        (complaint) => {
          const text = [
            complaint.complaint_id,
            complaint.category,
            complaint.address,
            complaint.status,
            complaint.priority,
          ]
            .join(" ")
            .toLowerCase()

          return text.includes(value)
        }
      )
    }, [complaints, search])

  const filteredWardAdmins =
    useMemo(() => {
      const value =
        search.toLowerCase().trim()

      if (!value) {
        return wardAdmins
      }

      return wardAdmins.filter(
        (admin) => {
          const text = [
            admin.full_name,
            admin.username,
            admin.phone,
            getWardLabel(
              admin.ward
            ),
            admin.ward_number,
            admin.ward_name,
          ]
            .join(" ")
            .toLowerCase()

          return text.includes(value)
        }
      )
    }, [wardAdmins, search])

  function openCreateOfficer() {
    setEditingOfficer(null)

    setOfficerForm({
      ...emptyOfficer,
    })

    setShowOfficerModal(true)
  }

  function openEditOfficer(officer) {
    setEditingOfficer(officer)

    setOfficerForm({
      full_name:
        officer.full_name || "",

      username:
        officer.username ||
        officer.user_name ||
        "",

      password: "",

      phone:
        officer.phone || "",

      department:
        officer.department?.id ||
        officer.department ||
        "",

      employee_id:
        officer.employee_id || "",

      designation:
        officer.designation || "",

      ward:
        normalizeWardValue(
          officer.ward
        ),
    })

    setShowOfficerModal(true)
  }

  async function saveOfficer(event) {
    event.preventDefault()

    try {
      const payload = {
        ...officerForm,

        department:
          officerForm.department ||
          null,

        ward:
          officerForm.ward ||
          null,
      }

      if (
        editingOfficer &&
        !payload.password
      ) {
        delete payload.password
      }

      const url = editingOfficer
        ? `${API_BASE}/officers/${editingOfficer.id}/`
        : `${API_BASE}/officers/`

      const response =
        await fetch(url, {
          method:
            editingOfficer
              ? "PATCH"
              : "POST",

          headers,

          body:
            JSON.stringify(payload),
        })

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to save officer."
          )
        )
      }

      setShowOfficerModal(false)

      await loadData()

      showSuccess(
        editingOfficer
          ? "Officer updated successfully."
          : "Officer created successfully."
      )
    } catch (err) {
      showError(err.message)
    }
  }

  async function deleteOfficer(
    officer
  ) {
    if (
      !window.confirm(
        `Delete officer "${officer.full_name}"?`
      )
    ) {
      return
    }

    try {
      const response =
        await fetch(
          `${API_BASE}/officers/${officer.id}/`,
          {
            method: "DELETE",
            headers,
          }
        )

      if (!response.ok) {
        const data =
          await response.json()

        throw new Error(
          getErrorMessage(
            data,
            "Unable to delete officer."
          )
        )
      }

      await loadData()

      showSuccess(
        "Officer deleted successfully."
      )
    } catch (err) {
      showError(err.message)
    }
  }

  async function toggleOfficerStatus(
    officer
  ) {
    try {
      const response =
        await fetch(
          `${API_BASE}/officers/${officer.id}/`,
          {
            method: "PATCH",
            headers,

            body: JSON.stringify({
              is_active:
                !officer.is_active,
            }),
          }
        )

      if (!response.ok) {
        const data =
          await response.json()

        throw new Error(
          getErrorMessage(
            data,
            "Unable to change officer status."
          )
        )
      }

      await loadData()

      showSuccess(
        officer.is_active
          ? "Officer deactivated."
          : "Officer activated."
      )
    } catch (err) {
      showError(err.message)
    }
  }

  function openCreateAdmin() {
    setEditingAdmin(null)

    setAdminForm({
      ...emptyAdmin,
    })

    setShowAdminModal(true)
  }

  function openEditAdmin(admin) {
    setEditingAdmin(admin)

    setAdminForm({
      full_name:
        admin.full_name || "",

      username:
        admin.username || "",

      password: "",

      phone:
        admin.phone || "",

      department:
        admin.department?.id ||
        admin.department ||
        "",
    })

    setShowAdminModal(true)
  }

  async function saveAdmin(event) {
    event.preventDefault()

    try {
      const payload = {
        ...adminForm,

        department:
          adminForm.department ||
          null,
      }

      if (
        editingAdmin &&
        !payload.password
      ) {
        delete payload.password
      }

      const url = editingAdmin
        ? `${API_BASE}/users/department-admins/${editingAdmin.id}/`
        : `${API_BASE}/users/create-department-admin/`

      const response =
        await fetch(url, {
          method:
            editingAdmin
              ? "PATCH"
              : "POST",

          headers,

          body:
            JSON.stringify(payload),
        })

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to save government admin."
          )
        )
      }

      setShowAdminModal(false)

      await loadDepartmentAdmins()

      showSuccess(
        editingAdmin
          ? "Government admin updated."
          : "Government admin created."
      )
    } catch (err) {
      showError(err.message)
    }
  }

  async function deleteAdmin(admin) {
    if (
      !window.confirm(
        `Delete "${admin.full_name}"?`
      )
    ) {
      return
    }

    try {
      const response =
        await fetch(
          `${API_BASE}/users/department-admins/${admin.id}/delete/`,
          {
            method: "DELETE",
            headers,
          }
        )

      if (!response.ok) {
        const data =
          await response.json()

        throw new Error(
          getErrorMessage(
            data,
            "Unable to delete admin."
          )
        )
      }

      await loadDepartmentAdmins()

      showSuccess(
        "Government admin deleted."
      )
    } catch (err) {
      showError(err.message)
    }
  }

  /* =======================================================
     WARD ADMIN
  ======================================================= */

  async function openCreateWardAdmin() {
    setEditingWardAdmin(null)

    setWardAdminForm({
      ...emptyWardAdmin,
    })

    setShowWardAdminModal(true)

    await loadWards()
  }

  async function openEditWardAdmin(
    admin
  ) {
    setEditingWardAdmin(admin)

    setWardAdminForm({
      full_name:
        admin.full_name || "",

      username:
        admin.username || "",

      password: "",

      phone:
        admin.phone || "",

      ward:
        normalizeWardValue(
          admin.ward
        ),
    })

    setShowWardAdminModal(true)

    await loadWards()
  }

  async function saveWardAdmin(
    event
  ) {
    event.preventDefault()

    if (!wardAdminForm.ward) {
      showError(
        "Please select a ward."
      )

      return
    }

    try {
      setWardAdminLoading(true)

      const payload = {
        ...wardAdminForm,

        ward:
          wardAdminForm.ward,
      }

      if (
        editingWardAdmin &&
        !payload.password
      ) {
        delete payload.password
      }

      const url = editingWardAdmin
        ? `${API_BASE}/users/ward-admins/${editingWardAdmin.id}/`
        : `${API_BASE}/users/create-ward-admin/`

      const response =
        await fetch(url, {
          method:
            editingWardAdmin
              ? "PATCH"
              : "POST",

          headers,

          body:
            JSON.stringify(payload),
        })

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to save ward admin."
          )
        )
      }

      setShowWardAdminModal(false)

      await loadWardAdmins()

      showSuccess(
        editingWardAdmin
          ? "Ward admin updated."
          : "Ward admin created."
      )
    } catch (err) {
      showError(err.message)
    } finally {
      setWardAdminLoading(false)
    }
  }

  async function toggleWardAdminStatus(
    admin
  ) {
    try {
      const response =
        await fetch(
          `${API_BASE}/users/ward-admins/${admin.id}/`,
          {
            method: "PATCH",

            headers,

            body: JSON.stringify({
              is_active:
                !admin.is_active,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to update status."
          )
        )
      }

      await loadWardAdmins()

      showSuccess(
        admin.is_active
          ? "Ward admin deactivated."
          : "Ward admin activated."
      )
    } catch (err) {
      showError(err.message)
    }
  }

  async function deleteWardAdmin(
    admin
  ) {
    if (
      !window.confirm(
        `Delete "${admin.full_name}"?`
      )
    ) {
      return
    }

    try {
      const response =
        await fetch(
          `${API_BASE}/users/ward-admins/${admin.id}/delete/`,
          {
            method: "DELETE",
            headers,
          }
        )

      if (!response.ok) {
        const data =
          await response.json()

        throw new Error(
          getErrorMessage(
            data,
            "Unable to delete ward admin."
          )
        )
      }

      await loadWardAdmins()

      showSuccess(
        "Ward admin deleted."
      )
    } catch (err) {
      showError(err.message)
    }
  }

  /* =======================================================
     CSV
  ======================================================= */

  function exportComplaints() {
    const rows = [
      [
        "Complaint ID",
        "Category",
        "Status",
        "Priority",
        "Address",
        "Created At",
      ],

      ...complaints.map(
        (item) => [
          item.complaint_id || "",
          item.category || "",
          item.status || "",
          item.priority || "",
          item.address || "",
          item.created_at || "",
        ]
      ),
    ]

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replaceAll(
                '"',
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n")

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    )

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement("a")

    link.href = url

    link.download =
      "ciip_complaints.csv"

    document.body.appendChild(link)

    link.click()

    link.remove()

    URL.revokeObjectURL(url)

    showSuccess(
      "Complaint report exported."
    )
  }

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function changeTab(tab) {
    setActiveTab(tab)
    setSearch("")

    /* CLOSE MENU AFTER SELECTION */
    setMobileMenuOpen(false)

    setProfileMenuOpen(false)
  }

  function logout() {
    localStorage.removeItem(
      "ciip_token"
    )

    localStorage.removeItem(
      "ciip_username"
    )

    localStorage.removeItem(
      "ciip_full_name"
    )

    localStorage.removeItem(
      "ciip_role"
    )

    localStorage.removeItem(
      "ciip_profile_photo_url"
    )

    navigate("/login")
  }

  /* =======================================================
     OVERVIEW
  ======================================================= */

  function renderOverview() {
    const recentComplaints =
      [...complaints]
        .sort(
          (a, b) =>
            new Date(
              b.created_at || 0
            ) -
            new Date(
              a.created_at || 0
            )
        )
        .slice(0, 6)

    return (
      <div className="dashboard-page">
        <section className="welcome-panel">
          <div>
            <span className="eyebrow">
              SUPER ADMIN COMMAND CENTER
            </span>

            <h1>
              Welcome back,{" "}
              <span>{profileName}</span>
            </h1>

            <p>
              Monitor departments, officers,
              citizens, complaints and civic
              infrastructure operations from
              one central dashboard.
            </p>
          </div>

          <div className="welcome-mark">
            <strong>CI</strong>
            <span>CIIP</span>
          </div>
        </section>

        <div className="stats-grid">
          <StatCard
            icon="▤"
            label="Total Complaints"
            value={stats.complaints}
            className="blue"
          />

          <StatCard
            icon="!"
            label="Pending Action"
            value={stats.pending}
            className="orange"
          />

          <StatCard
            icon="↗"
            label="In Progress"
            value={stats.inProgress}
            className="purple"
          />

          <StatCard
            icon="✓"
            label="Resolved"
            value={stats.resolved}
            className="green"
          />
        </div>

        <div className="secondary-stats">
          <MiniStat
            icon="▦"
            label="Departments"
            value={
              stats.activeDepartments
            }
          />

          <MiniStat
            icon="♙"
            label="Officers"
            value={
              stats.activeOfficers
            }
          />

          <MiniStat
            icon="♜"
            label="Government Admins"
            value={
              stats.activeAdmins
            }
          />

          <MiniStat
            icon="⌖"
            label="Ward Admins"
            value={
              stats.activeWardAdmins
            }
          />

          <MiniStat
            icon="♟"
            label="Citizens"
            value={stats.citizens}
          />

          <MiniStat
            icon="!"
            label="Critical Issues"
            value={stats.critical}
            danger
          />
        </div>

        <div className="content-grid">
          <section className="panel">
            <PanelHeader
              title="Recent Complaints"
              subtitle="Latest civic issues reported in the system."
              action={
                <button
                  className="text-button"
                  onClick={() =>
                    changeTab(
                      "complaints"
                    )
                  }
                >
                  View All →
                </button>
              }
            />

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentComplaints.length ? (
                    recentComplaints.map(
                      (complaint) => (
                        <tr
                          key={
                            complaint.id
                          }
                        >
                          <td>
                            <strong>
                              {complaint.complaint_id ||
                                `#${complaint.id}`}
                            </strong>
                          </td>

                          <td>
                            {complaint.category ||
                              "Other"}
                          </td>

                          <td>
                            <span
                              className={getPriorityClass(
                                complaint.priority
                              )}
                            >
                              {complaint.priority ||
                                "Normal"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={getStatusClass(
                                complaint.status
                              )}
                            >
                              {complaint.status ||
                                "Unknown"}
                            </span>
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <EmptyRow
                      colSpan={4}
                      text="No complaints available."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <PanelHeader
              title="System Overview"
              subtitle="Current CIIP operational activity."
            />

            <div className="activity-list">
              <Activity
                icon="▤"
                title={`${stats.complaints} complaints`}
                text="Total complaints currently recorded."
              />

              <Activity
                icon="♙"
                title={`${stats.activeOfficers} active officers`}
                text="Officers available in departments."
              />

              <Activity
                icon="▦"
                title={`${stats.activeDepartments} departments`}
                text="Active government departments."
              />

              <Activity
                icon="♜"
                title={`${stats.activeAdmins} government admins`}
                text="Department administration accounts."
              />

              <Activity
                icon="⌖"
                title={`${stats.activeWardAdmins} ward admins`}
                text="Ward-level administrators."
              />

              <Activity
                icon="!"
                title={`${stats.critical} critical issues`}
                text="Complaints requiring high priority attention."
                danger
              />
            </div>
          </section>
        </div>
      </div>
    )
  }

  /* =======================================================
     DEPARTMENTS
  ======================================================= */

  function renderDepartments() {
    return (
      <section className="panel full-panel">
        <PanelHeader
          title="Departments"
          subtitle="Government departments connected with CIIP."
          action={
            <button
              className="secondary-button"
              onClick={loadData}
            >
              ↻ Refresh
            </button>
          }
        />

        <div className="department-grid">
          {departments.length ? (
            departments.map(
              (department) => (
                <article
                  className="department-card"
                  key={department.id}
                >
                  <div className="department-icon">
                    ▦
                  </div>

                  <div className="department-info">
                    <h3>
                      {department.name}
                    </h3>

                    <p>
                      {department.description ||
                        "Government civic department connected with CIIP."}
                    </p>
                  </div>

                  <span
                    className={
                      department.is_active ===
                      false
                        ? "badge danger"
                        : "badge success"
                    }
                  >
                    {department.is_active ===
                    false
                      ? "Inactive"
                      : "Active"}
                  </span>
                </article>
              )
            )
          ) : (
            <div className="empty-state">
              No departments found.
            </div>
          )}
        </div>
      </section>
    )
  }

  /* =======================================================
     OFFICERS
  ======================================================= */

  function renderOfficers() {
    return (
      <section className="panel full-panel">
        <PanelHeader
          title="Officers"
          subtitle="Manage government field officers."
          action={
            <button
              className="primary-button"
              onClick={
                openCreateOfficer
              }
            >
              + Add Officer
            </button>
          }
        />

        <Toolbar
          value={search}
          onChange={setSearch}
          placeholder="Search officers..."
          onRefresh={() => {
            setSearch("")
            loadData()
          }}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Officer</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Ward</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOfficers.length ? (
                filteredOfficers.map(
                  (officer) => (
                    <tr
                      key={officer.id}
                    >
                      <td>
                        <div className="person-cell">
                          <div className="small-avatar">
                            {getInitials(
                              officer.full_name
                            )}
                          </div>

                          <div>
                            <strong>
                              {officer.full_name ||
                                "Unnamed"}
                            </strong>

                            <span>
                              {officer.username ||
                                officer.user_name ||
                                ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {officer.employee_id ||
                          "—"}
                      </td>

                      <td>
                        {officer.department_name ||
                          getDepartmentName(
                            officer.department
                              ?.id ||
                              officer.department
                          )}
                      </td>

                      <td>
                        {officer.designation ||
                          "—"}
                      </td>

                      <td>
                        {getWardLabel(
                          officer.ward
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            officer.is_active ===
                            false
                              ? "badge danger"
                              : "badge success"
                          }
                        >
                          {officer.is_active ===
                          false
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="icon-button"
                            title="Edit"
                            onClick={() =>
                              openEditOfficer(
                                officer
                              )
                            }
                          >
                            ✎
                          </button>

                          <button
                            className="icon-button"
                            title="Toggle Status"
                            onClick={() =>
                              toggleOfficerStatus(
                                officer
                              )
                            }
                          >
                            {officer.is_active
                              ? "⏸"
                              : "▶"}
                          </button>

                          <button
                            className="icon-button danger-icon"
                            title="Delete"
                            onClick={() =>
                              deleteOfficer(
                                officer
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <EmptyRow
                  colSpan={7}
                  text="No officers found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  /* =======================================================
     GOVERNMENT ADMINS
  ======================================================= */

  function renderAdmins() {
    return (
      <section className="panel full-panel">
        <PanelHeader
          title="Government Admins"
          subtitle="Manage department-level administration accounts."
          action={
            <button
              className="primary-button"
              onClick={openCreateAdmin}
            >
              + Add Government Admin
            </button>
          }
        />

        <Toolbar
          value={search}
          onChange={setSearch}
          placeholder="Search government admins..."
          onRefresh={() => {
            setSearch("")
            loadDepartmentAdmins()
          }}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {departmentAdmins.length ? (
                departmentAdmins.map(
                  (admin) => (
                    <tr
                      key={admin.id}
                    >
                      <td>
                        <div className="person-cell">
                          <div className="small-avatar">
                            {getInitials(
                              admin.full_name
                            )}
                          </div>

                          <div>
                            <strong>
                              {admin.full_name ||
                                "Unnamed"}
                            </strong>
                          </div>
                        </div>
                      </td>

                      <td>
                        {admin.username}
                      </td>

                      <td>
                        {admin.phone ||
                          "—"}
                      </td>

                      <td>
                        {admin.department_name ||
                          getDepartmentName(
                            admin.department
                              ?.id ||
                              admin.department
                          )}
                      </td>

                      <td>
                        <span
                          className={
                            admin.is_active ===
                            false
                              ? "badge danger"
                              : "badge success"
                          }
                        >
                          {admin.is_active ===
                          false
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="icon-button"
                            onClick={() =>
                              openEditAdmin(
                                admin
                              )
                            }
                          >
                            ✎
                          </button>

                          <button
                            className="icon-button danger-icon"
                            onClick={() =>
                              deleteAdmin(
                                admin
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <EmptyRow
                  colSpan={6}
                  text="No government admins found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  /* =======================================================
     WARD MANAGEMENT
  ======================================================= */

  function renderWardManagement() {
    const active =
      wardAdmins.filter(
        (item) =>
          item.is_active !== false
      ).length

    return (
      <section className="panel full-panel">
        <PanelHeader
          title="Ward Management"
          subtitle="Manage ward-level government administrators."
          action={
            <button
              className="primary-button"
              onClick={
                openCreateWardAdmin
              }
            >
              + Add Ward Admin
            </button>
          }
        />

        <div className="ward-summary">
          <MiniStat
            icon="⌖"
            label="Total Ward Admins"
            value={
              wardAdmins.length
            }
          />

          <MiniStat
            icon="✓"
            label="Active"
            value={active}
          />

          <MiniStat
            icon="!"
            label="Inactive"
            value={
              wardAdmins.length -
              active
            }
            danger
          />
        </div>

        <Toolbar
          value={search}
          onChange={setSearch}
          placeholder="Search ward admins..."
          onRefresh={() => {
            setSearch("")
            loadWardAdmins()
          }}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ward Admin</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Assigned Ward</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredWardAdmins.length ? (
                filteredWardAdmins.map(
                  (admin) => (
                    <tr
                      key={admin.id}
                    >
                      <td>
                        <div className="person-cell">
                          <div className="small-avatar">
                            {getInitials(
                              admin.full_name
                            )}
                          </div>

                          <strong>
                            {admin.full_name ||
                              "Unnamed"}
                          </strong>
                        </div>
                      </td>

                      <td>
                        {admin.username}
                      </td>

                      <td>
                        {admin.phone ||
                          "—"}
                      </td>

                      <td>
                        <span className="ward-badge">
                          {getWardLabel(
                            admin.ward
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            admin.is_active ===
                            false
                              ? "badge danger"
                              : "badge success"
                          }
                        >
                          {admin.is_active ===
                          false
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>

                      <td>
                        {admin.date_joined
                          ? new Date(
                              admin.date_joined
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="icon-button"
                            onClick={() =>
                              openEditWardAdmin(
                                admin
                              )
                            }
                          >
                            ✎
                          </button>

                          <button
                            className="icon-button"
                            onClick={() =>
                              toggleWardAdminStatus(
                                admin
                              )
                            }
                          >
                            {admin.is_active
                              ? "⏸"
                              : "▶"}
                          </button>

                          <button
                            className="icon-button danger-icon"
                            onClick={() =>
                              deleteWardAdmin(
                                admin
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <EmptyRow
                  colSpan={7}
                  text="No ward admins found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  /* =======================================================
     CITIZENS
  ======================================================= */

  function renderCitizens() {
    return (
      <section className="panel full-panel">
        <PanelHeader
          title="Citizens"
          subtitle="Registered citizens using the CIIP platform."
        />

        <Toolbar
          value={search}
          onChange={setSearch}
          placeholder="Search citizens..."
          onRefresh={() => {
            setSearch("")
            loadData()
          }}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {citizens.length ? (
                citizens.map(
                  (citizen) => (
                    <tr
                      key={citizen.id}
                    >
                      <td>
                        <div className="person-cell">
                          <div className="small-avatar">
                            {getInitials(
                              citizen.full_name
                            )}
                          </div>

                          <strong>
                            {citizen.full_name ||
                              "Unnamed"}
                          </strong>
                        </div>
                      </td>

                      <td>
                        {citizen.username}
                      </td>

                      <td>
                        {citizen.phone ||
                          "—"}
                      </td>

                      <td>
                        <span className="badge neutral">
                          {citizen.role ||
                            "CITIZEN"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            citizen.is_active ===
                            false
                              ? "badge danger"
                              : "badge success"
                          }
                        >
                          {citizen.is_active ===
                          false
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <EmptyRow
                  colSpan={5}
                  text="No citizens found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  /* =======================================================
     COMPLAINTS
  ======================================================= */

  function renderComplaints() {
    return (
      <section className="panel full-panel">
        <PanelHeader
          title="Complaints"
          subtitle="Monitor civic complaints submitted through CIIP."
          action={
            <button
              className="primary-button"
              onClick={
                exportComplaints
              }
            >
              ↓ Export CSV
            </button>
          }
        />

        <Toolbar
          value={search}
          onChange={setSearch}
          placeholder="Search complaints..."
          onRefresh={() => {
            setSearch("")
            loadData()
          }}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Category</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {filteredComplaints.length ? (
                filteredComplaints.map(
                  (complaint) => (
                    <tr
                      key={complaint.id}
                    >
                      <td>
                        <strong>
                          {complaint.complaint_id ||
                            `#${complaint.id}`}
                        </strong>
                      </td>

                      <td>
                        {complaint.category ||
                          "Other"}
                      </td>

                      <td className="location-cell">
                        {complaint.address ||
                          "Location unavailable"}
                      </td>

                      <td>
                        <span
                          className={getPriorityClass(
                            complaint.priority
                          )}
                        >
                          {complaint.priority ||
                            "Normal"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            complaint.status
                          )}
                        >
                          {complaint.status ||
                            "Unknown"}
                        </span>
                      </td>

                      <td>
                        {complaint.created_at
                          ? new Date(
                              complaint.created_at
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  )
                )
              ) : (
                <EmptyRow
                  colSpan={6}
                  text="No complaints found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  /* =======================================================
     MODULE PAGES
  ======================================================= */

  function renderModule(
    title,
    subtitle,
    icon
  ) {
    return (
      <div className="module-page">
        <section className="module-hero">
          <div className="module-icon">
            {icon}
          </div>

          <div>
            <span className="eyebrow">
              CIIP MODULE
            </span>

            <h1>{title}</h1>

            <p>{subtitle}</p>
          </div>
        </section>

        <div className="module-grid">
          <article className="module-card">
            <span>01</span>

            <h3>
              Module Ready
            </h3>

            <p>
              This module is connected to
              the Super Admin command center.
            </p>
          </article>

          <article className="module-card">
            <span>02</span>

            <h3>
              Data Integration
            </h3>

            <p>
              Data integration points are
              ready for the next development
              phase.
            </p>
          </article>

          <article className="module-card">
            <span>03</span>

            <h3>
              CIIP Intelligence
            </h3>

            <p>
              Intelligence and analytics can
              be expanded without changing the
              core dashboard structure.
            </p>
          </article>
        </div>
      </div>
    )
  }

  /* =======================================================
     CONTENT SWITCH
  ======================================================= */

  function renderContent() {
    if (loading) {
      return (
        <div className="loading-screen">
          <div className="loader" />

          <p>
            Loading CIIP command center...
          </p>
        </div>
      )
    }

    switch (activeTab) {
      case "departments":
        return renderDepartments()

      case "officers":
        return renderOfficers()

      case "admins":
        return renderAdmins()

      case "citizens":
        return renderCitizens()

      case "complaints":
        return renderComplaints()

      case "wards":
        return renderWardManagement()

      case "gis":
        return renderModule(
          "GIS Intelligence",
          "Geospatial intelligence and civic issue mapping.",
          "◉"
        )

      case "ai":
        return renderModule(
          "AI Intelligence",
          "AI-assisted civic issue analysis and recommendations.",
          "✦"
        )

      case "analytics":
        return renderModule(
          "Analytics & Reports",
          "Operational reports and civic infrastructure analytics.",
          "▥"
        )

      case "audit":
        return renderModule(
          "Audit Logs",
          "Track administrative actions and system activity.",
          "◷"
        )

      case "settings":
        return (
          <ProfileSettings
            profile={profile}
            profileName={profileName}
            setProfileName={setProfileName}
            updateProfileName={
              updateProfileName
            }
            handlePhotoSelect={
              handlePhotoSelect
            }
            profileUploading={
              profileUploading
            }
            onViewPhoto={() =>
              setShowProfilePreview(
                true
              )
            }
          />
        )

      default:
        return renderOverview()
    }
  }

  const photoUrl =
    profile?.profile_photo ||
    profile?.profile_photo_url ||
    localStorage.getItem(
      "ciip_profile_photo_url"
    )

  return (
    <div className="admin-layout">
      {/* =================================================
          FULL BACKGROUND
      ================================================= */}

      <div className="dashboard-background" />

      {/* =================================================
          MENU PANEL
          SIDEBAR COMPLETELY REMOVED
      ================================================= */}

      {mobileMenuOpen && (
        <>
          <button
            className="menu-panel-overlay"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            aria-label="Close menu"
          />

          <aside className="command-menu">
            <div className="command-menu-header">
              <div>
                <span className="menu-kicker">
                  CIIP
                </span>

                <strong>
                  Command Center
                </strong>
              </div>

              <button
                className="menu-close"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="command-menu-heading">
              COMMAND CENTER
            </div>

            <nav className="command-menu-list">
              {menuItems.map(
                (item) => {
                  const count =
                    item.id ===
                    "complaints"
                      ? stats.pending
                      : item.id ===
                        "wards"
                      ? stats.activeWardAdmins
                      : null

                  return (
                    <button
                      key={item.id}
                      className={`command-menu-item ${
                        activeTab ===
                        item.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        changeTab(
                          item.id
                        )
                      }
                    >
                      <span className="command-menu-icon">
                        {item.icon}
                      </span>

                      <span className="command-menu-label">
                        {item.label}
                      </span>

                      {count > 0 && (
                        <span className="command-menu-count">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                }
              )}
            </nav>

            <div className="command-menu-divider" />

            <div className="command-menu-system">
              <div className="command-menu-status">
                <span />

                <div>
                  <strong>
                    System Secure
                  </strong>

                  <small>
                    CIIP services online
                  </small>
                </div>
              </div>

              <button
                className="command-menu-logout"
                onClick={logout}
              >
                <span>⇥</span>
                Logout
              </button>
            </div>
          </aside>
        </>
      )}

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="admin-main">
        {/* =================================================
            TOPBAR
        ================================================= */}

        <header className="topbar">
          <div className="topbar-left">
            <button
              className="desktop-menu-button"
              onClick={() =>
                setMobileMenuOpen(
                  (value) => !value
                )
              }
              aria-label="Open command menu"
              aria-expanded={
                mobileMenuOpen
              }
            >
              <span>☰</span>
              <b>MENU</b>
            </button>

            <div className="breadcrumb">
              <span>
                CIIP
              </span>

              <b>/</b>

              <strong>
                {
                  menuItems.find(
                    (item) =>
                      item.id ===
                      activeTab
                  )?.label
                }
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-status">
              <span className="status-dot" />

              <span>
                System Online
              </span>
            </div>

            <button
              className="theme-toggle"
              onClick={
                toggleTheme
              }
              title={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
            >
              {theme ===
              "light"
                ? "☾"
                : "☀"}
            </button>

            <div className="profile-wrapper">
              <button
                className="profile-trigger"
                onClick={() =>
                  setProfileMenuOpen(
                    (value) =>
                      !value
                  )
                }
              >
                <div className="profile-avatar">
                  {photoUrl ? (
                    <img
                      src={
                        photoUrl
                      }
                      alt="Profile"
                    />
                  ) : (
                    getInitials(
                      profileName
                    )
                  )}
                </div>

                <div className="profile-info">
                  <strong>
                    {profileName}
                  </strong>

                  <span>
                    Super Admin
                  </span>
                </div>

                <span className="profile-arrow">
                  ▾
                </span>
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-profile">
                    <div className="dropdown-avatar">
                      {photoUrl ? (
                        <img
                          src={
                            photoUrl
                          }
                          alt="Profile"
                        />
                      ) : (
                        getInitials(
                          profileName
                        )
                      )}
                    </div>

                    <div>
                      <strong>
                        {profileName}
                      </strong>

                      <span>
                        SUPER ADMIN
                      </span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    onClick={() => {
                      setShowProfilePreview(
                        true
                      )

                      setProfileMenuOpen(
                        false
                      )
                    }}
                  >
                    ◉ View Photo
                  </button>

                  <label className="dropdown-upload">
                    ↑ Change Photo

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handlePhotoSelect
                      }
                    />
                  </label>

                  <button
                    onClick={() => {
                      changeTab(
                        "settings"
                      )

                      setProfileMenuOpen(
                        false
                      )
                    }}
                  >
                    ⚙ Profile Settings
                  </button>

                  <button
                    className="dropdown-logout"
                    onClick={logout}
                  >
                    ⇥ Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="admin-content">
          {(message || error) && (
            <div
              className={`toast ${
                error
                  ? "toast-error"
                  : "toast-success"
              }`}
            >
              <span>
                {error ? "!" : "✓"}
              </span>

              {error || message}
            </div>
          )}

          {renderContent()}
        </div>
      </main>

      {/* =================================================
          PROFILE PREVIEW
      ================================================= */}

      {showProfilePreview && (
        <div
          className="modal-backdrop preview-backdrop"
          onClick={() =>
            setShowProfilePreview(
              false
            )
          }
        >
          <div
            className="profile-preview-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-button"
              onClick={() =>
                setShowProfilePreview(
                  false
                )
              }
            >
              ×
            </button>

            <div className="profile-preview-image">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile preview"
                />
              ) : (
                <span>
                  {getInitials(
                    profileName
                  )}
                </span>
              )}
            </div>

            <h3>
              {profileName}
            </h3>

            <p>
              Super Administrator
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          CROP MODAL
      ================================================= */}

      {showCropModal && (
        <div className="modal-backdrop">
          <div className="crop-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  PROFILE PHOTO
                </span>

                <h2>
                  Adjust & Crop
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowCropModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <p className="crop-help">
              Drag the selected area to
              choose the part of the image
              you want to use. Resize it
              from the corner.
            </p>

            <div
              className="crop-workspace"
              ref={
                cropContainerRef
              }
              style={{
                width:
                  cropBox.width,
                height:
                  cropBox.height,
              }}
            >
              <img
                ref={
                  cropImageRef
                }
                src={cropImage}
                alt="Crop"
                className="crop-source-image"
                onLoad={(event) => {
                  const image =
                    event.currentTarget

                  const maxWidth =
                    500

                  const maxHeight =
                    400

                  const ratio =
                    Math.min(
                      maxWidth /
                        image.naturalWidth,
                      maxHeight /
                        image.naturalHeight
                    )

                  const width =
                    image.naturalWidth *
                    ratio

                  const height =
                    image.naturalHeight *
                    ratio

                  setCropBox({
                    width,
                    height,
                  })

                  setCropRect({
                    x: Math.max(
                      0,
                      width / 2 -
                        110
                    ),

                    y: Math.max(
                      0,
                      height / 2 -
                        110
                    ),

                    width: Math.min(
                      220,
                      width,
                      height
                    ),

                    height: Math.min(
                      220,
                      width,
                      height
                    ),
                  })
                }}
              />

              <div
                className="crop-selection"
                style={{
                  left:
                    cropRect.x,

                  top:
                    cropRect.y,

                  width:
                    cropRect.width,

                  height:
                    cropRect.height,
                }}
                onPointerDown={(
                  event
                ) =>
                  startCropInteraction(
                    event,
                    "move"
                  )
                }
              >
                <span className="crop-corner top-left" />
                <span className="crop-corner top-right" />
                <span className="crop-corner bottom-left" />

                <span
                  className="crop-corner bottom-right"
                  onPointerDown={(
                    event
                  ) => {
                    event.stopPropagation()

                    startCropInteraction(
                      event,
                      "resize"
                    )
                  }}
                />
              </div>
            </div>

            <div className="crop-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setShowCropModal(
                    false
                  )
                }
                disabled={
                  profileUploading
                }
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={
                  cropAndUpload
                }
                disabled={
                  profileUploading
                }
              >
                {profileUploading
                  ? "Saving..."
                  : "Crop & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          OFFICER MODAL
      ================================================= */}

      {showOfficerModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  OFFICER MANAGEMENT
                </span>

                <h2>
                  {editingOfficer
                    ? "Edit Officer"
                    : "Add Officer"}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowOfficerModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                saveOfficer
              }
              className="modal-form"
            >
              <div className="form-grid">
                <FormField
                  label="Full Name"
                  required
                  value={
                    officerForm.full_name
                  }
                  onChange={(value) =>
                    setOfficerForm({
                      ...officerForm,
                      full_name:
                        value,
                    })
                  }
                />

                <FormField
                  label="Username"
                  required
                  value={
                    officerForm.username
                  }
                  onChange={(value) =>
                    setOfficerForm({
                      ...officerForm,
                      username:
                        value,
                    })
                  }
                />

                <FormField
                  label={
                    editingOfficer
                      ? "Password (optional)"
                      : "Password"
                  }
                  type="password"
                  required={
                    !editingOfficer
                  }
                  value={
                    officerForm.password
                  }
                  onChange={(value) =>
                    setOfficerForm({
                      ...officerForm,
                      password:
                        value,
                    })
                  }
                />

                <FormField
                  label="Phone"
                  value={
                    officerForm.phone
                  }
                  onChange={(value) =>
                    setOfficerForm({
                      ...officerForm,
                      phone:
                        value,
                    })
                  }
                />

                <FormField
                  label="Employee ID"
                  value={
                    officerForm.employee_id
                  }
                  onChange={(value) =>
                    setOfficerForm({
                      ...officerForm,
                      employee_id:
                        value,
                    })
                  }
                />

                <FormField
                  label="Designation"
                  value={
                    officerForm.designation
                  }
                  onChange={(value) =>
                    setOfficerForm({
                      ...officerForm,
                      designation:
                        value,
                    })
                  }
                />

                <div className="form-field">
                  <label>
                    Department
                  </label>

                  <select
                    value={
                      officerForm.department
                    }
                    onChange={(
                      event
                    ) =>
                      setOfficerForm({
                        ...officerForm,
                        department:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments.map(
                      (
                        department
                      ) => (
                        <option
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {
                            department.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-field">
                  <label>
                    Ward
                  </label>

                  <select
                    value={
                      officerForm.ward
                    }
                    onChange={(
                      event
                    ) =>
                      setOfficerForm({
                        ...officerForm,
                        ward:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Select ward
                    </option>

                    {wards.map(
                      (ward) => (
                        <option
                          key={
                            ward.id
                          }
                          value={
                            ward.id
                          }
                        >
                          Ward{" "}
                          {ward.ward_number ||
                            ward.id}

                          {ward.name
                            ? ` - ${ward.name}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowOfficerModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingOfficer
                    ? "Update Officer"
                    : "Create Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          ADMIN MODAL
      ================================================= */}

      {showAdminModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  GOVERNMENT ADMIN
                </span>

                <h2>
                  {editingAdmin
                    ? "Edit Admin"
                    : "Add Government Admin"}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowAdminModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                saveAdmin
              }
              className="modal-form"
            >
              <div className="form-grid">
                <FormField
                  label="Full Name"
                  required
                  value={
                    adminForm.full_name
                  }
                  onChange={(value) =>
                    setAdminForm({
                      ...adminForm,
                      full_name:
                        value,
                    })
                  }
                />

                <FormField
                  label="Username"
                  required
                  value={
                    adminForm.username
                  }
                  onChange={(value) =>
                    setAdminForm({
                      ...adminForm,
                      username:
                        value,
                    })
                  }
                />

                <FormField
                  label={
                    editingAdmin
                      ? "Password (optional)"
                      : "Password"
                  }
                  type="password"
                  required={
                    !editingAdmin
                  }
                  value={
                    adminForm.password
                  }
                  onChange={(value) =>
                    setAdminForm({
                      ...adminForm,
                      password:
                        value,
                    })
                  }
                />

                <FormField
                  label="Phone"
                  value={
                    adminForm.phone
                  }
                  onChange={(value) =>
                    setAdminForm({
                      ...adminForm,
                      phone:
                        value,
                    })
                  }
                />

                <div className="form-field">
                  <label>
                    Department
                  </label>

                  <select
                    value={
                      adminForm.department
                    }
                    onChange={(
                      event
                    ) =>
                      setAdminForm({
                        ...adminForm,
                        department:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments.map(
                      (
                        department
                      ) => (
                        <option
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {
                            department.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowAdminModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingAdmin
                    ? "Update Admin"
                    : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          WARD ADMIN MODAL
      ================================================= */}

      {showWardAdminModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  WARD MANAGEMENT
                </span>

                <h2>
                  {editingWardAdmin
                    ? "Edit Ward Admin"
                    : "Add Ward Admin"}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowWardAdminModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                saveWardAdmin
              }
              className="modal-form"
            >
              <div className="form-grid">
                <FormField
                  label="Full Name"
                  required
                  value={
                    wardAdminForm.full_name
                  }
                  onChange={(value) =>
                    setWardAdminForm({
                      ...wardAdminForm,
                      full_name:
                        value,
                    })
                  }
                />

                <FormField
                  label="Username"
                  required
                  value={
                    wardAdminForm.username
                  }
                  onChange={(value) =>
                    setWardAdminForm({
                      ...wardAdminForm,
                      username:
                        value,
                    })
                  }
                />

                <FormField
                  label={
                    editingWardAdmin
                      ? "Password (optional)"
                      : "Password"
                  }
                  type="password"
                  required={
                    !editingWardAdmin
                  }
                  value={
                    wardAdminForm.password
                  }
                  onChange={(value) =>
                    setWardAdminForm({
                      ...wardAdminForm,
                      password:
                        value,
                    })
                  }
                />

                <FormField
                  label="Phone"
                  value={
                    wardAdminForm.phone
                  }
                  onChange={(value) =>
                    setWardAdminForm({
                      ...wardAdminForm,
                      phone:
                        value,
                    })
                  }
                />

                <div className="form-field">
                  <label>
                    Assigned Ward
                  </label>

                  <select
                    required
                    value={
                      wardAdminForm.ward
                    }
                    onChange={(
                      event
                    ) =>
                      setWardAdminForm({
                        ...wardAdminForm,
                        ward:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Select ward
                    </option>

                    {wards.map(
                      (ward) => (
                        <option
                          key={
                            ward.id
                          }
                          value={
                            ward.id
                          }
                        >
                          Ward{" "}
                          {ward.ward_number ||
                            ward.id}

                          {ward.name
                            ? ` - ${ward.name}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowWardAdminModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    wardAdminLoading
                  }
                >
                  {wardAdminLoading
                    ? "Saving..."
                    : editingWardAdmin
                    ? "Update Ward Admin"
                    : "Create Ward Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
            )}

      {/* =================================================
          CIIP FOOTER
      ================================================= */}

      <footer className="admin-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>CIIP</h3>
            <p>Civic Infrastructure Intelligence Platform</p>
          </div>

          <div className="footer-info">
            <p>© 2026 CIIP. All rights reserved.</p>
            <p>Smart Civic Infrastructure Management System</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

/* =========================================================
   HELPER COMPONENTS
========================================================= */

function StatCard({
  icon,
  label,
  value,
  className = "",
}) {
  return (
    <article
      className={`stat-card ${className}`}
    >
      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </article>
  )
}

function MiniStat({
  icon,
  label,
  value,
  danger = false,
}) {
  return (
    <article
      className={`mini-stat ${
        danger
          ? "danger-stat"
          : ""
      }`}
    >
      <div className="mini-stat-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </article>
  )
}

function PanelHeader({
  title,
  subtitle,
  action,
}) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>

        <p>{subtitle}</p>
      </div>

      {action && (
        <div className="panel-header-action">
          {action}
        </div>
      )}
    </div>
  )
}

function Activity({
  icon,
  title,
  text,
  danger = false,
}) {
  return (
    <div className="activity">
      <div
        className={`activity-icon ${
          danger
            ? "activity-danger"
            : ""
        }`}
      >
        {icon}
      </div>

      <div>
        <strong>{title}</strong>

        <span>{text}</span>
      </div>
    </div>
  )
}

function EmptyRow({
  colSpan,
  text,
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="empty-row"
      >
        {text}
      </td>
    </tr>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <div className="form-field">
      <label>
        {label}

        {required && (
          <span className="required">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </div>
  )
}

function Toolbar({
  value,
  onChange,
  placeholder,
  onRefresh,
}) {
  return (
    <div className="toolbar">
      <div className="search-box">
        <span>⌕</span>

        <input
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
        />

        {value && (
          <button
            onClick={() =>
              onChange("")
            }
          >
            ×
          </button>
        )}
      </div>

      <button
        className="secondary-button refresh-button"
        onClick={onRefresh}
      >
        ↻ Refresh
      </button>
    </div>
  )
}

function ProfileSettings({
  profile,
  profileName,
  setProfileName,
  updateProfileName,
  handlePhotoSelect,
  profileUploading,
  onViewPhoto,
}) {
  const photoUrl =
    profile?.profile_photo ||
    profile?.profile_photo_url ||
    localStorage.getItem(
      "ciip_profile_photo_url"
    )

  return (
    <section className="panel full-panel profile-settings">
      <PanelHeader
        title="Profile Settings"
        subtitle="Manage your Super Admin profile."
      />

      <div className="profile-settings-layout">
        <div className="profile-card">
          <div className="settings-avatar">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
              />
            ) : (
              getInitials(
                profileName
              )
            )}
          </div>

          <h3>
            {profileName}
          </h3>

          <span>
            SUPER ADMIN
          </span>

          <div className="profile-actions">
            <button
              className="secondary-button"
              onClick={
                onViewPhoto
              }
            >
              View Photo
            </button>

            <label className="primary-button upload-button">
              Change Photo

              <input
                type="file"
                accept="image/*"
                onChange={
                  handlePhotoSelect
                }
              />
            </label>
          </div>

          <small>
            Select a photo and choose
            the exact area you want to
            use.
          </small>
        </div>

        <div className="profile-form-card">
          <h3>
            Account Information
          </h3>

          <div className="form-field">
            <label>
              Full Name
            </label>

            <input
              value={profileName}
              onChange={(event) =>
                setProfileName(
                  event.target.value
                )
              }
            />
          </div>

          <div className="form-field">
            <label>
              Username
            </label>

            <input
              value={
                profile?.username ||
                localStorage.getItem(
                  "ciip_username"
                ) ||
                ""
              }
              disabled
            />
          </div>

          <div className="form-field">
            <label>
              Role
            </label>

            <input
              value="SUPER ADMIN"
              disabled
            />
          </div>

          <button
            className="primary-button"
            onClick={
              updateProfileName
            }
            disabled={
              profileUploading
            }
          >
            {profileUploading
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </section>
  )
}