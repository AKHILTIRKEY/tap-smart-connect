import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore'

import { auth, db } from './firebase'
import './App.css'
import BusinessProfile from './BusinessProfile'
import { QRCodeCanvas } from 'qrcode.react'
import BusinessProfileStudio from './BusinessProfileStudio'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [activePage, setActivePage] = useState('Overview')
  const [businesses, setBusinesses] = useState([])
  const [nfcCards, setNfcCards] = useState([])
  const [qrCodes, setQrCodes] = useState([])
  const [profileVisits, setProfileVisits] = useState([])
  const [profileEvents, setProfileEvents] = useState([])
  const [showQrForm, setShowQrForm] = useState(false)

const [qrForm, setQrForm] = useState({
  businessId: ''
})
const [showNfcForm, setShowNfcForm] = useState(false)
const [nfcForm, setNfcForm] = useState({
  cardId: '',
  businessId: ''
})
  const [showForm, setShowForm] = useState(false)
  const [editingBusinessId, setEditingBusinessId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [nfcSearch, setNfcSearch] = useState('')
const [nfcStatusFilter, setNfcStatusFilter] = useState('all')

  const [editingNfcCard, setEditingNfcCard] = useState(null)

const [nfcEditForm, setNfcEditForm] = useState({
  cardId: '',
  businessId: ''
})


const [form, setForm] = useState({
  productType: 'all_in_one',
  businessName: '',
  category: 'Gym',
  ownerName: '',
  phone: '',
  email: '',
  instagram: '',
  whatsapp: '',
  googleReview: '',
  address: ''
})


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
  if (user) {
    loadBusinesses()
    loadNfcCards()
    loadQrCodes()
    loadProfileAnalytics()
    loadProfileEvents()
  }
}, [user])

  const loadBusinesses = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'businesses'))

      const businessList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))

      setBusinesses(businessList)
    } catch (err) {
      console.error('Error loading businesses:', err)
      setError('Unable to load businesses. Check your database rules.')
    }
  }

  
const loadNfcCards = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'nfcCards'))

    const cardList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))

    setNfcCards(cardList)
  } catch (err) {
    console.error('Error loading NFC cards:', err)
    setError('Unable to load NFC cards. Check database permissions.')
  }
}

const loadQrCodes = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'qrCodes'))

    const qrList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))

    setQrCodes(qrList)

  } catch (err) {
    console.error('Error loading QR codes:', err)
    setError('Unable to load QR codes. Check database permissions.')
  }
}

const loadProfileAnalytics = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'profileAnalytics'))

    const analyticsList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))

    setProfileVisits(analyticsList)
  } catch (err) {
    console.error('Error loading profile analytics:', err)
  }
}

const loadProfileEvents = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'profileEvents'))

    const eventsList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))

    setProfileEvents(eventsList)

    console.log('Profile events loaded:', eventsList.length)
  } catch (err) {
    console.error('Error loading profile events:', err)
  }
}

const handleAddQrCode = async (e) => {
  e.preventDefault()
  setError('')

  if (!user) {
    setError('Please sign in again.')
    return
  }

  const business = businesses.find(
    (item) => item.id === qrForm.businessId
  )

  if (!business) {
    setError('Please select a business.')
    return
  }

  setSaving(true)

  try {
    const profileUrl = `https://tap-smart-card.web.app/?id=${encodeURIComponent(business.id)}&source=qr`

    await addDoc(collection(db, 'qrCodes'), {
      businessId: business.id,
      businessName: business.businessName,
      url: profileUrl,
      status: 'active',
      createdBy: user.uid,
      createdAt: serverTimestamp()
    })

    setQrForm({ businessId: '' })
    setShowQrForm(false)

    await loadQrCodes()

  } catch (err) {
    console.error('Error registering QR code:', err)
    setError('Could not register QR code. Check Firestore permissions.')
  } finally {
    setSaving(false)
  }
}

const handleAddNfcCard = async (e) => {
  e.preventDefault()
  setError('')

  if (!user) {
    setError('Please sign in again.')
    return
  }

  const cardId = nfcForm.cardId.trim()
  const business = businesses.find(
    (item) => item.id === nfcForm.businessId
  )

  if (!cardId || !business) {
    setError('Enter a card ID and select a business.')
    return
  }

  const alreadyExists = nfcCards.some(
    (card) => card.cardId?.toLowerCase() === cardId.toLowerCase()
  )

  if (alreadyExists) {
    setError('This NFC card ID is already registered.')
    return
  }

  setSaving(true)

  try {
    await addDoc(collection(db, 'nfcCards'), {
      cardId,
      businessId: business.id,
      businessName: business.businessName,
      status: 'active',
      createdBy: user.uid,
      createdAt: serverTimestamp()
    })

    setNfcForm({ cardId: '', businessId: '' })
    setShowNfcForm(false)
    await loadNfcCards()
  } catch (err) {
    console.error('Error registering NFC card:', err)
    setError('Could not register NFC card. Check Firestore permissions.')
  } finally {
    setSaving(false)
  }
}


const handleToggleNfcCard = async (card) => {
  const newStatus =
    card.status === 'active' ? 'inactive' : 'active'

  try {
    await updateDoc(doc(db, 'nfcCards', card.id), {
      status: newStatus
    })

    await loadNfcCards()
    setError('')
  } catch (err) {
    console.error('Error updating NFC card:', err)
    setError('Could not update NFC card status.')
  }
}

const handleDeleteNfcCard = async (card) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete NFC card "${card.cardId}"? This action cannot be undone.`
  )

  if (!confirmed) return

  setError('')
  setSaving(true)

  try {
    await deleteDoc(doc(db, 'nfcCards', card.id))

    await loadNfcCards()

    alert('NFC card deleted successfully.')
  } catch (err) {
    console.error('Error deleting NFC card:', err)
    setError('Could not delete NFC card.')
  } finally {
    setSaving(false)
  }
}

const handleEditNfcCard = (card) => {
  setEditingNfcCard(card)

  setNfcEditForm({
    cardId: card.cardId,
    businessId: card.businessId
  })
}

const handleUpdateNfcCard = async (e) => {
  e.preventDefault()
  setError('')

  const cardId = nfcEditForm.cardId.trim()

  const business = businesses.find(
    (item) => item.id === nfcEditForm.businessId
  )

  if (!cardId || !business) {
    setError('Enter a Card ID and select a business.')
    return
  }

  const alreadyExists = nfcCards.some(
    (card) =>
      card.id !== editingNfcCard.id &&
      card.cardId?.toLowerCase() === cardId.toLowerCase()
  )

  if (alreadyExists) {
    setError('This NFC Card ID is already registered.')
    return
  }

  setSaving(true)

  try {
    await updateDoc(doc(db, 'nfcCards', editingNfcCard.id), {
      cardId,
      businessId: business.id,
      businessName: business.businessName
    })

    setEditingNfcCard(null)
    await loadNfcCards()
  } catch (err) {
    console.error('Error updating NFC card:', err)
    setError('Could not update NFC card.')
  } finally {
    setSaving(false)
  }
}


  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoggingIn(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Login failed. Please check your email and password.')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    setActivePage('Overview')
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  const handleAddBusiness = async (e) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('Please sign in again.')
      return
    }

    setSaving(true)

    try {
      const businessRef = await addDoc(collection(db, 'businesses'), {
  ...form,
  businessName: form.businessName.trim(),
  ownerName: form.ownerName.trim(),
  phone: form.phone.trim(),
  email: form.email.trim(),
  address: form.address.trim(),
  status: 'active',
  createdBy: user.uid,
  createdAt: serverTimestamp()
})


await setDoc(doc(db, 'publicBusinesses', businessRef.id), {
  businessId: businessRef.id,
  productType: form.productType,
  businessName: form.businessName.trim(),
  category: form.category,
  phone: form.phone.trim(),
  instagram: form.instagram.trim(),
  whatsapp: form.whatsapp.trim(),
  googleReview: form.googleReview.trim(),
  address: form.address.trim(),
  status: 'active'
})

// Record individual profile visit and traffic source
const sourceParam = (params.get('source') || 'direct').toLowerCase();

const source = ['qr', 'nfc', 'direct'].includes(sourceParam)
  ? sourceParam
  : 'unknown';

await addDoc(collection(db, 'profileEvents'), {
  businessId,
  eventType: 'profile_view',
  linkName: 'Profile View',
  source,
  createdAt: serverTimestamp()
});

console.log('Profile visit tracked:', source);


      setForm({
        businessName: '',
        category: 'Gym',
        ownerName: '',
        phone: '',
        email: '',
        instagram: '',
        whatsapp: '',
        googleReview: '',
        address: ''
      })

      setShowForm(false)
      await loadBusinesses()

    } catch (err) {
      console.error('Error saving business:', err)
      setError('Could not save business. Please check Firestore permissions.')
    } finally {
      setSaving(false)
    }
  }

  
const handleUpdateBusiness = async (e) => {
  e.preventDefault()
  setError('')

  if (!editingBusinessId) return

  setSaving(true)

  try {
    await updateDoc(doc(db, 'businesses', editingBusinessId), {
      ...form,
      businessName: form.businessName.trim(),
      ownerName: form.ownerName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      instagram: form.instagram.trim(),
      whatsapp: form.whatsapp.trim(),
      googleReview: form.googleReview.trim(),
      address: form.address.trim(),
      updatedAt: serverTimestamp()
    })

const publicBusinessData = {
  businessId: editingBusinessId,
  productType: form.productType,
  businessName: form.businessName.trim(),
  category: form.category,
  phone: form.phone.trim(),
  instagram: form.instagram.trim(),
  whatsapp: form.whatsapp.trim(),
  googleReview: form.googleReview.trim(),
  address: form.address.trim(),
  status: 'active'
}

const publicBusinessQuery = query(
  collection(db, 'publicBusinesses'),
  where('businessId', '==', editingBusinessId)
)

const publicSnapshot = await getDocs(publicBusinessQuery)
console.log('PUBLIC DOCUMENTS FOUND:', publicSnapshot.size)
console.log('PUBLIC BUSINESS DATA TO SAVE:', publicBusinessData)
if (!publicSnapshot.empty) {
  await updateDoc(
    doc(db, 'publicBusinesses', publicSnapshot.docs[0].id),
    publicBusinessData
  )
  console.log('PUBLIC BUSINESS UPDATED SUCCESSFULLY')
} else {
  await setDoc(
    doc(db, 'publicBusinesses', editingBusinessId),
    publicBusinessData
  )
}

    setEditingBusinessId(null)
    setShowForm(false)

    setForm({
      businessName: '',
      category: 'Gym',
      ownerName: '',
      phone: '',
      email: '',
      instagram: '',
      whatsapp: '',
      googleReview: '',
      address: ''
    })

    await loadBusinesses()
  } catch (err) {
    console.error('Error updating business:', err)
    setError('Could not update business. Please try again.')
  } finally {
    setSaving(false)
  }
}


const handleDeleteBusiness = async (business) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${business.businessName}" and its QR codes? This action cannot be undone.`
  )

  if (!confirmed) return

  setError('')
  setSaving(true)

  try {
    // Delete the main business document
    await deleteDoc(doc(db, 'businesses', business.id))

    // Delete its public profile
    await deleteDoc(doc(db, 'publicBusinesses', business.id))

    // Delete any older public profile documents linked by businessId
    const publicQuery = query(
      collection(db, 'publicBusinesses'),
      where('businessId', '==', business.id)
    )

    const publicSnapshot = await getDocs(publicQuery)

    for (const publicDoc of publicSnapshot.docs) {
      await deleteDoc(publicDoc.ref)
    }

    // Delete all QR code records for this business
    const qrQuery = query(
      collection(db, 'qrCodes'),
      where('businessId', '==', business.id)
    )

    const qrSnapshot = await getDocs(qrQuery)

    for (const qrDoc of qrSnapshot.docs) {
      await deleteDoc(qrDoc.ref)
    }

    await loadBusinesses()
    await loadQrCodes()

    setError('')
    alert('Business and associated QR codes deleted successfully.')

  } catch (err) {
    console.error('Error deleting business:', err)
    setError('Could not delete business. Please check Firestore permissions.')
  } finally {
    setSaving(false)
  }
}


  const openBusinessForm = () => {
    setError('')
    setShowForm(true)
    setActivePage('Businesses')
  }

  const menuItems = [
    'Overview',
    'Businesses',
    'NFC Cards',
    'QR Codes',
    'Analytics',
    'Settings'
  ]

  const filteredBusinesses = businesses.filter((business) =>
    `${business.businessName} ${business.ownerName} ${business.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const filteredNfcCards = nfcCards.filter((card) => {
  const matchesSearch =
    `${card.cardId || ''} ${card.businessName || ''}`
      .toLowerCase()
      .includes(nfcSearch.toLowerCase())

  const matchesStatus =
    nfcStatusFilter === 'all' ||
    card.status === nfcStatusFilter

  return matchesSearch && matchesStatus
})

const params = new URLSearchParams(window.location.search)
const businessId = params.get('id')
const isStudio = params.get('studio') === '1'

if (isStudio && businessId) {
  return <BusinessProfileStudio />
}

if (businessId) {
  return <BusinessProfileStudio />
}

  if (loading) {
    return <div className="auth-loading">Loading TapConnect...</div>
  }

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-icon">T</div>
            <div>
              <h2>TapConnect</h2>
              <span>Business platform</span>
            </div>
          </div>

          <div className="login-heading">
            <span className="eyebrow">ADMINISTRATOR ACCESS</span>
            <h1>Welcome back</h1>
            <p>Sign in to manage your TapConnect platform.</p>
          </div>

          <form onSubmit={handleLogin}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <div className="login-error">{error}</div>}

            <button className="login-button" type="submit" disabled={loggingIn}>
              {loggingIn ? 'Signing in...' : 'Sign in to TapConnect'}
            </button>
          </form>

          <p className="login-footer">
            Restricted access · Authorized administrator only
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">T</div>
          <div>
            <h2>TapConnect</h2>
            <span>Business platform</span>
          </div>
        </div>

        <div className="menu-label">MENU</div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={`nav-item ${activePage === item ? 'active' : ''}`}
              onClick={() => {
                setActivePage(item)
                setShowForm(false)
                setError('')
              }}
            >
              <span className="nav-dot">◆</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>Super Admin</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace /</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <span className="status-dot"></span>
            System online
            <div className="top-avatar">A</div>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="dashboard">

          {activePage === 'Overview' && (
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">YOUR BUSINESS AT A GLANCE</span>
                  <h1>Overview</h1>
                  <p>Welcome to your TapConnect control center.</p>
                </div>

                <button className="primary-button" onClick={openBusinessForm}>
                  + Add Business
                </button>
              </div>

              <div className="stats-grid">
                {[
                  ['Total Businesses', businesses.length, '▦', 'Registered accounts'],
                  ['Active NFC Cards', nfcCards.filter((card) => card.status === 'active').length, '◉', 'Cards connected'],
                  ['QR Scans', 0, '▧', 'Total scans'],
                  ['Profile Visits', 0, '↗', 'Customer visits']
                ].map(([label, value, icon, description]) => (
                  <div className="stat-card" key={label}>
                    <div className="stat-top">
                      <span>{label}</span>
                      <div className="stat-icon">{icon}</div>
                    </div>
                    <h2>{value}</h2>
                    <p>{description}</p>
                  </div>
                ))}
              </div>

              <div className="content-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent Businesses</h3>
                      <p>Manage your registered businesses</p>
                    </div>
                    <button className="text-button" onClick={() => setActivePage('Businesses')}>
                      View all →
                    </button>
                  </div>

                  {businesses.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">▦</div>
                      <h3>No businesses yet</h3>
                      <p>Your registered businesses will appear here.</p>
                      <button className="primary-button" onClick={openBusinessForm}>
                        Add your first business
                      </button>
                    </div>
                  ) : (
                    <div className="recent-list">
                      {businesses.slice(0, 5).map((business) => (
                        <div className="recent-item" key={business.id}>
                          <strong>{business.businessName}</strong>
                          <span>{business.category}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Quick Actions</h3>
                      <p>Manage your platform</p>
                    </div>
                  </div>

                  <button className="action-item" onClick={openBusinessForm}>
                    <span className="action-icon">＋</span>
                    <span><strong>Add Business</strong><small>Register a new business</small></span>
                    <span className="arrow">→</span>
                  </button>

                  <button className="action-item" onClick={() => setActivePage('NFC Cards')}>
                    <span className="action-icon">◉</span>
                    <span><strong>Manage NFC Cards</strong><small>Activate and assign cards</small></span>
                    <span className="arrow">→</span>
                  </button>

                  <button className="action-item" onClick={() => setActivePage('QR Codes')}>
                    <span className="action-icon">▧</span>
                    <span><strong>Manage QR Codes</strong><small>Create and manage QR codes</small></span>
                    <span className="arrow">→</span>
                  </button>
                </section>
              </div>
            </>
          )}

          {activePage === 'Businesses' && (
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">BUSINESS MANAGEMENT</span>
                  <h1>Businesses</h1>
                  <p>Register and manage businesses on TapConnect.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => {
                    setError('')
                    setShowForm(!showForm)
                  }}
                >
                  {showForm ? 'Cancel' : '+ Add Business'}
                </button>
              </div>

              {error && <div className="form-error">{error}</div>}

              {showForm && (
                <section className="panel business-form-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Register a Business</h3>
                      <p>Enter the business details below.</p>
                    </div>
                  </div>

                  <form
  className="business-form"
  onSubmit={editingBusinessId ? handleUpdateBusiness : handleAddBusiness}
>



<div className="product-selection">
  <div className="product-selection-heading">
    <label>Select Product</label>
    <span>Choose the product you want to register</span>
  </div>

  <div className="product-options">
    {[
      { value: 'google_review', name: 'Google Review' },
      { value: 'instagram_follow', name: 'Instagram Follow' },
      { value: 'all_in_one', name: 'All-in-One' }
    ].map(product => (
      <button
        key={product.value}
        type="button"
        className={`product-option ${
          form.productType === product.value ? 'selected' : ''
        }`}
        onClick={() =>
          setForm(previous => ({
            ...previous,
            productType: product.value
          }))
        }
      >
        <span className="product-option-name">{product.name}</span>
        <span className="product-option-check">
          {form.productType === product.value ? '✓' : ''}
        </span>
      </button>
    ))}
  </div>
</div>



{form.productType === 'google_review' && (
  <div className="form-grid">
    <div>
      <label>Business Name *</label>
      <input
        name="businessName"
        value={form.businessName}
        onChange={handleFormChange}
        placeholder="Enter business name"
        required
      />
    </div>

    <div>
      <label>Google Review URL *</label>
      <input
        name="googleReview"
        type="url"
        value={form.googleReview}
        onChange={handleFormChange}
        placeholder="Paste Google Review link"
        required
      />
    </div>
  </div>
)}

{form.productType === 'instagram_follow' && (
  <div className="form-grid">
    <div>
      <label>Business Name *</label>
      <input
        name="businessName"
        value={form.businessName}
        onChange={handleFormChange}
        placeholder="Enter business name"
        required
      />
    </div>

    <div>
      <label>Instagram URL *</label>
      <input
        name="instagram"
        type="url"
        value={form.instagram}
        onChange={handleFormChange}
        placeholder="Paste Instagram profile link"
        required
      />
    </div>
  </div>
)}

{form.productType === 'all_in_one' && (
  <div className="form-grid">
    <div>
      <label>Business Name *</label>
      <input
        name="businessName"
        value={form.businessName}
        onChange={handleFormChange}
        placeholder="e.g. Elite Gym"
        required
      />
    </div>

    <div>
      <label>Business Category *</label>
      <select
        name="category"
        value={form.category}
        onChange={handleFormChange}
        required
      >
        <option>Gym</option>
        <option>Salon</option>
        <option>Hotel</option>
        <option>Restaurant</option>
        <option>Clinic</option>
        <option>Retail Store</option>
        <option>Other</option>
      </select>
    </div>

    <div>
      <label>Owner Name *</label>
      <input
        name="ownerName"
        value={form.ownerName}
        onChange={handleFormChange}
        placeholder="Business owner's name"
        required
      />
    </div>

    <div>
      <label>Phone Number *</label>
      <input
        name="phone"
        type="tel"
        value={form.phone}
        onChange={handleFormChange}
        placeholder="10-digit phone number"
        required
      />
    </div>

    <div>
      <label>Business Email</label>
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleFormChange}
        placeholder="business@example.com"
      />
    </div>

    <div>
      <label>WhatsApp Number</label>
      <input
        name="whatsapp"
        value={form.whatsapp}
        onChange={handleFormChange}
        placeholder="WhatsApp number"
      />
    </div>

    <div>
      <label>Instagram URL</label>
      <input
        name="instagram"
        type="url"
        value={form.instagram}
        onChange={handleFormChange}
        placeholder="https://instagram.com/..."
      />
    </div>

    <div>
      <label>Google Review URL</label>
      <input
        name="googleReview"
        type="url"
        value={form.googleReview}
        onChange={handleFormChange}
        placeholder="Google review link"
      />
    </div>

    <div className="full-width">
      <label>Business Address *</label>
      <textarea
        name="address"
        value={form.address}
        onChange={handleFormChange}
        placeholder="Complete business address"
        rows="3"
        required
      />
    </div>
  </div>
)}


                    <div className="form-actions">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </button>

                      <button className="primary-button" type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Business'}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              <section className="panel businesses-table-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Registered Businesses ({businesses.length})</h3>
                    <p>All businesses stored in your database.</p>
                  </div>

                  <input
                    className="search-input"
                    placeholder="Search businesses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {filteredBusinesses.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">▦</div>
                    <h3>{search ? 'No matching businesses' : 'No businesses registered'}</h3>
                    <p>{search ? 'Try another search term.' : 'Add your first business to get started.'}</p>
                    {!search && (
                      <button className="primary-button" onClick={() => setShowForm(true)}>
                        Add Business
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="business-table-wrap">
                    <table className="business-table">
                      <thead>
                        <tr>
                          <th>Business</th>
                          <th>Category</th>
                          <th>Owner</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBusinesses.map((business) => (
                          <tr key={business.id}>
                            <td><strong>{business.businessName}</strong></td>
                            <td>{business.category}</td>
                            <td>{business.ownerName}</td>
                            <td>{business.phone}</td>
                            <td><span className="business-status">{business.status}</span></td>
                            <td>
                              <button
                                className="primary-btn"
                                type="button"
                                onClick={() => {
                                  setEditingBusinessId(business.id)

                                  setForm({
                                    businessName: business.businessName || '',
                                    category: business.category || 'Gym',
                                    ownerName: business.ownerName || '',
                                    phone: business.phone || '',
                                    email: business.email || '',
                                    instagram: business.instagram || '',
                                    whatsapp: business.whatsapp || '',
                                    googleReview: business.googleReview || '',
                                    address: business.address || ''
                                  })

                                  setShowForm(true)
                                  setActivePage('Businesses')
                                }}
                              >
                                Edit
</button>

<button
  type="button"
  className="delete-business-btn"
  disabled={saving}
  onClick={() => handleDeleteBusiness(business)}
>
  Delete
</button>
</td>
                          </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

{activePage === 'NFC Cards' && (
  <section className="panel">
    <div className="section-heading">
      <div>
        <span className="eyebrow">CARD MANAGEMENT</span>
        <h1>NFC Cards</h1>
        <p>Register, assign and manage your NFC cards.</p>
      </div>

      <button
        className="primary-btn"
        onClick={() => setShowNfcForm(!showNfcForm)}
      >
        + Add NFC Card
      </button>
    </div>

    {showNfcForm && (
      <form onSubmit={handleAddNfcCard} className="business-form">
        <h3>Register New NFC Card</h3>

        <label>Card ID</label>
        <input
          type="text"
          placeholder="Enter unique NFC card ID"
          value={nfcForm.cardId}
          onChange={(e) =>
            setNfcForm({ ...nfcForm, cardId: e.target.value })
          }
          required
        />

        <label>Assign Business</label>
        <select
          value={nfcForm.businessId}
          onChange={(e) =>
            setNfcForm({ ...nfcForm, businessId: e.target.value })
          }
          required
        >
          <option value="">Select a business</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.businessName}
            </option>
          ))}
        </select>

        <button type="submit" className="primary-btn" disabled={saving}>
          {saving ? 'Registering...' : 'Register NFC Card'}
        </button>
      </form>
    )}

    {editingNfcCard && (
  <form onSubmit={handleUpdateNfcCard} className="business-form">
    <h3>Edit NFC Card</h3>

    <label>Card ID</label>
    <input
      type="text"
      value={nfcEditForm.cardId}
      onChange={(e) =>
        setNfcEditForm({
          ...nfcEditForm,
          cardId: e.target.value
        })
      }
      required
    />

    <label>Assign Business</label>
    <select
      value={nfcEditForm.businessId}
      onChange={(e) =>
        setNfcEditForm({
          ...nfcEditForm,
          businessId: e.target.value
        })
      }
      required
    >
      <option value="">Select a business</option>
      {businesses.map((business) => (
        <option key={business.id} value={business.id}>
          {business.businessName}
        </option>
      ))}
    </select>

    <div className="form-actions">
      <button
        type="button"
        className="cancel-button"
        onClick={() => setEditingNfcCard(null)}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="primary-button"
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Update Card'}
      </button>
    </div>
  </form>
)}

    {error && <p className="error-message">{error}</p>}

    <div className="stats-grid">
      <div className="stat-card">
        <h3>Total NFC Cards</h3>
        <h2>{nfcCards.length}</h2>
      </div>

      <div className="stat-card">
        <h3>Active Cards</h3>
        <h2>
          {nfcCards.filter((card) => card.status === 'active').length}
        </h2>
      </div>

      <div className="stat-card">
        <h3>Inactive Cards</h3>
        <h2>
          {nfcCards.filter((card) => card.status !== 'active').length}
        </h2>
      </div>
    </div>

    <div className="panel-heading">
  <div>
    <h3>Registered NFC Cards ({filteredNfcCards.length})</h3>
    <p>Search, filter, edit and manage your cards.</p>
  </div>

  <div className="nfc-filters">
    <input
      className="search-input"
      type="text"
      placeholder="Search Card ID or business..."
      value={nfcSearch}
      onChange={(e) => setNfcSearch(e.target.value)}
    />

    <select
      value={nfcStatusFilter}
      onChange={(e) => setNfcStatusFilter(e.target.value)}
    >
      <option value="all">All Cards</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  </div>
</div>

    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Card ID</th>
            <th>Business</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
  {filteredNfcCards.map((card) => (
    <tr key={card.id}>
      <td>{card.cardId}</td>
      <td>{card.businessName}</td>

      <td>
        <span className={
          card.status === 'active'
            ? 'status-active'
            : 'status-inactive'
        }>
          {card.status}
        </span>
      </td>

      <td>
        <div className="nfc-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => handleEditNfcCard(card)}
          >
            Edit
          </button>

          <button
            type="button"
            className={
              card.status === 'active'
                ? 'nfc-deactivate-btn'
                : 'nfc-activate-btn'
            }
            onClick={() => handleToggleNfcCard(card)}
          >
            {card.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
                
      <button
        type="button"
        className="delete-business-btn"
        disabled={saving}
        onClick={() => handleDeleteNfcCard(card)}
      >
        Delete
      </button>
    </div>
      </td>
    </tr>
  ))}

  {filteredNfcCards.length === 0 && (-
    <tr>
      <td colSpan="4">
        {nfcCards.length === 0
          ? 'No NFC cards registered yet.'
          : 'No matching NFC cards found.'}
      </td>
    </tr>
  )}
</tbody>
      </table>
    </div>
  </section>
)}
      
      {activePage === 'QR Codes' && (
  <section className="panel">
    <div className="section-heading">
      <div>
        <span className="eyebrow">QR CODE MANAGEMENT</span>
        <h1>QR Codes</h1>
        <p>Create, download and manage business QR codes.</p>
      </div>

      <button
        className="primary-btn"
        onClick={() => setShowQrForm(!showQrForm)}
      >
        + Create QR Code
      </button>
    </div>

    {error && <div className="error-message">{error}</div>}

    {showQrForm && (
      <form
        className="business-form"
        onSubmit={handleAddQrCode}
      >
        <h3>Create New QR Code</h3>

        <label>Select Business</label>

        <select
          value={qrForm.businessId}
          onChange={(e) =>
            setQrForm({ businessId: e.target.value })
          }
          required
        >
          <option value="">Choose a business</option>

          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.businessName}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="primary-btn"
          disabled={saving}
        >
          {saving ? 'Creating...' : 'Generate QR Code'}
        </button>
      </form>
    )}

    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Business</th>
            <th>QR Code</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {qrCodes.length === 0 ? (
            <tr>
              <td colSpan="4">
                No QR codes registered yet.
              </td>
            </tr>
          ) : (
            qrCodes.map((qr) => (
              <tr key={qr.id}>
                <td>{qr.businessName}</td>

                <td>
                  <QRCodeCanvas
                    id={`qr-${qr.id}`}
                    value={qr.url}
                    size={120}
                    level="H"
                  />
                </td>

                <td>{qr.status}</td>

                <td>
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      const canvas = document.getElementById(
                        `qr-${qr.id}`
                      )

                      if (!canvas) return

                      const link = document.createElement('a')
                      link.href = canvas.toDataURL('image/png')
                      link.download = `${qr.businessName}-QR.png`
                      link.click()
                    }}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </section>
)}


{activePage === 'Analytics' && (
  <section className="analytics-page">
    {(() => {
      const getEventDate = (event) => {
        if (!event.createdAt) return null

        const date = event.createdAt.toDate
          ? event.createdAt.toDate()
          : new Date(event.createdAt)

        return Number.isNaN(date.getTime()) ? null : date
      }

      const getEventName = (event) =>
        `${event.eventType || ''} ${event.linkName || ''}`.toLowerCase()

      const isProfileView = (event) =>
        getEventName(event).includes('profile_view') ||
        getEventName(event).includes('profile view')

      const countEvents = (keyword) =>
        profileEvents.filter(event =>
          getEventName(event).includes(keyword)
        ).length

      const profileViewEvents = profileEvents.filter(isProfileView)

const getTrafficSource = (event) => {
  const source = String(event.source || 'unknown')
    .toLowerCase()
    .trim()

  if (source === 'direct') return 'Direct'
  if (['qr', 'qr_code', 'qr-code', 'qrcode'].includes(source)) return 'QR Code'
  if (['nfc', 'nfc_tap', 'nfc-tap', 'nfctap'].includes(source)) return 'NFC Tap'

  return 'Other / Unknown'
}

const trafficSourceStats = [
  { name: 'Direct', color: '#64748b' },
  { name: 'QR Code', color: '#8b5cf6' },
  { name: 'NFC Tap', color: '#0d9488' },
  { name: 'Other / Unknown', color: '#94a3b8' }
].map(item => ({
  ...item,
  count: profileViewEvents.filter(
    event => getTrafficSource(event) === item.name
  ).length
}))

const maxTrafficSources = Math.max(
  ...trafficSourceStats.map(item => item.count),
  1
)


      const interactionEvents = profileEvents.filter(
        event => !isProfileView(event)
      )

      const whatsappClicks = countEvents('whatsapp')
      const instagramClicks = countEvents('instagram')
      const googleClicks =
        countEvents('google') + countEvents('review')
      const callClicks = countEvents('call')

      const totalVisits = profileVisits.reduce(
        (total, item) => total + (Number(item.totalVisits) || 0),
        0
      )

      const last7Days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - (6 - index))

        const count = profileEvents.filter(event => {
          const eventDate = getEventDate(event)

          return eventDate &&
            eventDate.toDateString() === date.toDateString()
        }).length

        return {
          label: date.toLocaleDateString('en-IN', {
            weekday: 'short'
          }),
          count
        }
      })

      const maxActivity = Math.max(
        ...last7Days.map(day => day.count),
        1
      )

      const businessPerformance = businesses.map(business => {
        const views = profileViewEvents.filter(
          event => event.businessId === business.id
        ).length

        return {
          ...business,
          views
        }
      }).sort((a, b) => b.views - a.views)

      const linkStats = [
        { name: 'WhatsApp', count: whatsappClicks, color: '#25D366' },
        { name: 'Instagram', count: instagramClicks, color: '#E1306C' },
        { name: 'Google Reviews', count: googleClicks, color: '#4285F4' },
        { name: 'Phone Calls', count: callClicks, color: '#3B82F6' }
      ]

const businessLinkPerformance = businesses.map(business => {
  const events = profileEvents.filter(
    event => event.businessId === business.id
  )

  const getCount = keyword =>
    events.filter(event =>
      getEventName(event).includes(keyword)
    ).length

  return {
    id: business.id,
    name: business.businessName,
    views: events.filter(isProfileView).length,
    direct: events.filter(
  event => isProfileView(event) &&
    getTrafficSource(event) === 'Direct'
).length,

qr: events.filter(
  event => isProfileView(event) &&
    getTrafficSource(event) === 'QR Code'
).length,

nfc: events.filter(
  event => isProfileView(event) &&
    getTrafficSource(event) === 'NFC Tap'
).length,

other: events.filter(
  event => isProfileView(event) &&
    getTrafficSource(event) === 'Other / Unknown'
).length,
    whatsapp: getCount('whatsapp'),
    instagram: getCount('instagram'),
    google: events.filter(event => {
  const name = getEventName(event)
  return name.includes('google') || name.includes('review')
}).length,
    calls: getCount('call')
  }
})


      const maxLinkClicks = Math.max(
        ...linkStats.map(item => item.count),
        1
      )

      return (
        <>
          <div className="section-heading">
            <div>
              <span className="eyebrow">BUSINESS INSIGHTS</span>
              <h1>Analytics</h1>
              <p>Understand how customers interact with TapConnect.</p>
            </div>
          </div>

          {/* OVERVIEW METRICS */}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Total Businesses</span>
                <div className="stat-icon">▦</div>
              </div>
              <h2>{businesses.length}</h2>
              <p>Registered accounts</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Total Profile Visits</span>
                <div className="stat-icon">👁</div>
              </div>
              <h2>{totalVisits}</h2>
              <p>Recorded customer visits</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Customer Interactions</span>
                <div className="stat-icon">↗</div>
              </div>
              <h2>{interactionEvents.length}</h2>
              <p>Recorded link interactions</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Profile View Events</span>
                <div className="stat-icon">◉</div>
              </div>
              <h2>{profileViewEvents.length}</h2>
              <p>Individual profile view events</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Active NFC Cards</span>
                <div className="stat-icon">◎</div>
              </div>
              <h2>
                {nfcCards.filter(card => card.status === 'active').length}
              </h2>
              <p>Active cards</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Total QR Codes</span>
                <div className="stat-icon">▧</div>
              </div>
              <h2>{qrCodes.length}</h2>
              <p>Generated QR codes</p>
            </div>
          </div>

          {/* DAILY ACTIVITY */}

          <div className="panel" style={{ marginTop: 24 }}>
            <h2>Daily Activity</h2>
            <p style={{ color: '#8490a5', marginTop: 6 }}>
              Customer activity over the last 7 days
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-around',
              gap: 14,
              height: 220,
              padding: '25px 10px 5px'
            }}>
              {last7Days.map((day, index) => (
                <div key={index} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'end',
                  gap: 9
                }}>
                  <strong style={{ fontSize: 12 }}>
                    {day.count}
                  </strong>

                  <div style={{
                    width: '100%',
                    maxWidth: 48,
                    height: `${Math.max(
                      (day.count / maxActivity) * 140,
                      5
                    )}px`,
                    background: 'linear-gradient(180deg, #8b5cf6, #673de6)',
                    borderRadius: '8px 8px 3px 3px',
                    transition: 'height 0.3s ease'
                  }} />

                  <span style={{
                    fontSize: 11,
                    color: '#8490a5'
                  }}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* LINK PERFORMANCE */}

          
{/* LINK PERFORMANCE */}

<div
  className="panel"
  style={{
    marginTop: 24,
    padding: '26px',
    borderRadius: 18,
    background: '#ffffff',
    border: '1px solid #e7eaf2',
    boxShadow: '0 4px 18px rgba(20, 30, 60, 0.035)'
  }}
>
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28
  }}>
    <div>
      <span style={{
        fontSize: 10,
        fontWeight: 750,
        letterSpacing: '1.2px',
        color: '#7950e8'
      }}>
        CUSTOMER ENGAGEMENT
      </span>

      <h2 style={{
        fontSize: 21,
        fontWeight: 750,
        color: '#172033',
        margin: '7px 0 5px'
      }}>
        Link Performance
      </h2>

      <p style={{
        color: '#8490a5',
        fontSize: 13,
        margin: 0
      }}>
        Understand which contact options customers use most.
      </p>
    </div>

    <div style={{
      padding: '12px 18px',
      background: '#f5f1ff',
      borderRadius: 12,
      minWidth: 115
    }}>
      <div style={{
        fontSize: 11,
        color: '#7d6aab',
        fontWeight: 600
      }}>
        Total Clicks
      </div>

      <div style={{
        fontSize: 25,
        fontWeight: 800,
        color: '#7048e8',
        marginTop: 3
      }}>
        {linkStats.reduce((total, item) => total + item.count, 0)}
      </div>
    </div>
  </div>

  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 23
  }}>
    {linkStats.map(item => (
      <div key={item.name}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: item.color,
              display: 'inline-block'
            }} />

            <strong style={{
              fontSize: 13,
              fontWeight: 650,
              color: '#263248'
            }}>
              {item.name}
            </strong>
          </div>

          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#263248'
          }}>
            {item.count} <span style={{
              color: '#94a0b3',
              fontWeight: 500
            }}>clicks</span>
          </span>
        </div>

        <div style={{
          width: '100%',
          height: 9,
          borderRadius: 20,
          background: '#edf0f6',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(item.count / maxLinkClicks) * 100}%`,
            height: '100%',
            background: item.color,
            borderRadius: 20,
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>
    ))}
  </div>
</div>



{/* TRAFFIC SOURCES */}

<div
  className="panel"
  style={{
    marginTop: 24,
    padding: 26,
    borderRadius: 18,
    background: '#ffffff',
    border: '1px solid #e7eaf2',
    boxShadow: '0 4px 18px rgba(20, 30, 60, 0.035)'
  }}
>
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 25
  }}>
    <div>
      <span style={{
        fontSize: 10,
        fontWeight: 750,
        letterSpacing: '1.2px',
        color: '#7950e8'
      }}>
        CUSTOMER ACQUISITION
      </span>

      <h2 style={{
        fontSize: 21,
        fontWeight: 750,
        color: '#172033',
        margin: '7px 0 5px'
      }}>
        Traffic Sources
      </h2>

      <p style={{
        color: '#8490a5',
        fontSize: 13,
        margin: 0
      }}>
        Understand how customers discover business profiles.
      </p>
    </div>

    <div style={{
      padding: '11px 16px',
      background: '#f5f1ff',
      borderRadius: 12
    }}>
      <div style={{
        fontSize: 11,
        color: '#7d6aab',
        fontWeight: 600
      }}>
        Total Visits
      </div>
      <div style={{
        fontSize: 24,
        fontWeight: 800,
        color: '#7048e8',
        marginTop: 3
      }}>
        {trafficSourceStats.reduce((total, item) => total + item.count, 0)}
      </div>
    </div>
  </div>

  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14
  }}>
    {trafficSourceStats.map(item => (
      <div key={item.name} style={{
        padding: 18,
        border: '1px solid #edf0f5',
        borderRadius: 14,
        background: '#fcfcfe'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8
        }}>
          <strong style={{
            color: '#465168',
            fontSize: 13
          }}>
            {item.name}
          </strong>

          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: item.color
          }} />
        </div>

        <div style={{
          color: '#172033',
          fontSize: 29,
          fontWeight: 800,
          marginTop: 17,
          letterSpacing: '-0.8px'
        }}>
          {item.count}
        </div>

        <div style={{
          color: '#929bad',
          fontSize: 11,
          marginTop: 3
        }}>
          Visits recorded
        </div>

        <div style={{
          height: 6,
          background: '#edf0f6',
          borderRadius: 20,
          overflow: 'hidden',
          marginTop: 17
        }}>
          <div style={{
            width: `${(item.count / maxTrafficSources) * 100}%`,
            height: '100%',
            background: item.color,
            borderRadius: 20,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    ))}
  </div>
</div>




{/* BUSINESS-WISE LINK PERFORMANCE */}

<div className="panel business-performance-panel">

  <div className="business-performance-header">
    <div>
      <span className="analytics-eyebrow">BUSINESS ANALYTICS</span>
      <h2>Business-wise Performance</h2>
      <p>Compare profile visits, discovery sources and customer interactions across businesses.</p>
    </div>

    <div className="business-count-badge">
      {businessLinkPerformance.length} Businesses
    </div>
  </div>

  <div className="business-performance-table-wrap">
    <table className="business-performance-table">
      <thead>
        <tr>
          <th>Business</th>
          <th>Views</th>
          <th>Direct</th>
          <th>QR Code</th>
          <th>NFC Tap</th>
          <th>Other</th>
          <th>WhatsApp</th>
          <th>Instagram</th>
          <th>Google Reviews</th>
          <th>Calls</th>
          <th>Total Clicks</th>
        </tr>
      </thead>

      <tbody>
        {businessLinkPerformance.map(business => (
          <tr key={business.id}>
            <td className="performance-business-name">
              <strong>{business.name}</strong>
            </td>

            <td><span className="performance-view-count">{business.views}</span></td>
            <td>{business.direct}</td>
            <td>{business.qr}</td>
            <td>{business.nfc}</td>
            <td>{business.other}</td>
            <td>{business.whatsapp}</td>
            <td>{business.instagram}</td>
            <td>{business.google}</td>
            <td>{business.calls}</td>

            <td>
              <span className="performance-total-clicks">
                {business.whatsapp +
                  business.instagram +
                  business.google +
                  business.calls}
              </span>
            </td>
          </tr>
        ))}

        {businessLinkPerformance.length === 0 && (
          <tr>
            <td colSpan="11" className="performance-empty">
              No businesses registered yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  <div className="business-performance-footer">
    Showing performance data for all registered businesses
  </div>

</div>


          
{/* TOP BUSINESSES */}

<div className="panel top-businesses-panel">

  <div className="top-businesses-header">
    <div>
      <span className="analytics-eyebrow">PERFORMANCE RANKING</span>
      <h2>Top Performing Businesses</h2>
      <p>Discover which businesses are attracting the most profile visits.</p>
    </div>

    <div className="business-count-badge">
      {businessPerformance.length} Businesses
    </div>
  </div>

  {businessPerformance.length > 0 ? (
    <div className="top-businesses-list">
      {businessPerformance.map((business, index) => {
        const maxViews = Math.max(
          ...businessPerformance.map(item => Number(item.views) || 0),
          1
        )

        const percentage =
          ((Number(business.views) || 0) / maxViews) * 100

        return (
          <div className="top-business-item" key={business.id}>

            <div className={`business-rank rank-${index + 1}`}>
              {index + 1}
            </div>

            <div className="top-business-info">
              <div className="top-business-details">
                <strong>{business.businessName}</strong>
                <span>{business.category || 'Business'}</span>
              </div>

              <div className="business-performance-bar">
                <div
                  className="business-performance-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="top-business-views">
              <strong>{business.views}</strong>
              <span>Profile views</span>
            </div>

          </div>
        )
      })}
    </div>
  ) : (
    <div className="top-businesses-empty">
      No profile view data available yet.
    </div>
  )}

  <div className="top-businesses-footer">
    Ranked by recorded profile view events
  </div>

</div>


          
          {/* REGISTERED BUSINESSES */}
          <div className="panel registered-businesses-panel">
            <div className="registered-businesses-header">
              <div>
                <span className="analytics-eyebrow">BUSINESS DIRECTORY</span>
                <h2>Registered Businesses</h2>
                <p>Overview of all businesses currently registered on TapConnect.</p>
              </div>

              <div className="business-count-badge">
                {businesses.length} Businesses
              </div>
            </div>

            {businesses.length > 0 ? (
              <div className="registered-businesses-table-wrap">
                <table className="registered-businesses-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Actions</th>
                      
                    </tr>
                  </thead>

                  <tbody>
                    {businesses.map((business) => (
                      <tr key={business.id}>
                        <td>
                          <div className="registered-business-name">
                            <div className="registered-business-avatar">
                              {(business.businessName || 'B')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <strong>{business.businessName}</strong>
                          </div>
                        </td>

                        <td>
                          <span className="registered-business-category">
                            {business.category || 'General'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`registered-business-status ${
                              (business.status || 'active').toLowerCase() === 'active'
                                ? 'status-active'
                                : 'status-inactive'
                            }`}
                          >
                            <span className="status-indicator"></span>
                            {business.status || 'Active'}
                          </span>
</td>

<td>
  <button
    type="button"
    className="delete-business-btn"
    onClick={() => handleDeleteBusiness(business)}
  >
    Delete
  </button>
</td>

</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="registered-businesses-empty">
                No businesses have been registered yet.
              </div>
            )}

            <div className="registered-businesses-footer">
              Showing {businesses.length} registered businesses
            </div>
          </div>
        </>
      )
    })()}
  </section>
)}
</section>

</main>
    </div>
  )
}

export default App
