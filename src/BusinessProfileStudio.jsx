
import { useEffect, useState, useRef } from 'react'
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore'

import { db } from './firebase'
import './BusinessProfileStudio.css'

function cleanPhone(value = '') {
  let number = String(value).replace(/\D/g, '')
  if (number.length === 10) number = '91' + number
  return number
}

function makeUrl(value = '') {
  if (!value) return ''
  const url = String(value).trim()
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function BrandIcon({ type }) {
  const common = {
    width: 25,
    height: 25,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  }

  if (type === 'instagram') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  
if (type === 'whatsapp') {
  return (
    <svg
      {...common}
      viewBox="0 0 24 24"
      fill="#25D366"
      stroke="none"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.768.966-.942 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.297-.497.1-.198.05-.372-.025-.521-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.793.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
      <path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.946L.057 24l6.305-1.654a11.89 11.89 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413A11.815 11.815 0 0 0 12.05 0Zm0 21.78h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.437-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884Z" />
    </svg>
  )
}

  if (type === 'google') {
    return (
      <svg viewBox="0 0 24 24" width="26" height="26">
        <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z" />
        <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" />
        <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z" />
      </svg>
    )
  }

  if (type === 'phone') {
    return (
      <svg {...common}>
        <path d="M7 3H5a2 2 0 0 0-2 2c0 8.8 7.2 16 16 16a2 2 0 0 0 2-2v-2l-5-2-2 2a13 13 0 0 1-5-5l2-2-2-5Z" />
      </svg>
    )
  }

  if (type === 'website') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    )
  }

  return null
}

export default function BusinessProfileStudio() { 
  const trackLinkClick = async (item) => {
  try {
    const params = new URLSearchParams(window.location.search)
    const businessId = params.get('id')

    if (!businessId) return

    const eventType =
      item.type === 'google' ? 'google' :
      item.type === 'phone' ? 'call' :
      item.type

    const linkName =
      item.type === 'google' ? 'Google' :
      item.type === 'phone' ? 'Phone' :
      item.label

    await addDoc(collection(db, 'profileEvents'), {
      businessId,
      eventType,
      linkName,
      createdAt: serverTimestamp()
    })

    console.log('Link click tracked:', eventType)

  } catch (error) {
    console.error('Link tracking error:', error)
  }
}
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const viewTrackedRef = useRef(false)

  useEffect(() => {
    const loadBusiness = async () => {
      const params = new URLSearchParams(window.location.search)
      const businessId = params.get('id')

      if (!businessId) {
        setError('Business ID is missing.')
        setLoading(false)
        return
      }

      try {
        const businessRef = doc(db, 'publicBusinesses', businessId)
        const allBusinesses = await getDocs(collection(db, 'publicBusinesses'))

console.log(
  'ALL BUSINESS DOCUMENT IDS:',
  allBusinesses.docs.map(item => item.id)
)
        // DEBUG: List actual documents visible to this application
const allBusinessesSnapshot = await getDocs(
  collection(db, 'publicBusinesses')
)

console.log('ALL PUBLIC BUSINESSES:')
console.table(
  allBusinessesSnapshot.docs.map((businessDoc) => ({
    id: businessDoc.id,
    businessName: businessDoc.data().businessName
  }))
)

console.log('REQUESTED ID:', JSON.stringify(businessId))
console.log(
  'REQUESTED ID CHARACTER CODES:',
  [...businessId].map(char => char.charCodeAt(0))
)
        console.log('FIREBASE APP:', db.app.options.projectId)
        console.log('DOCUMENT PATH:', businessRef.path)
        console.log('DOCUMENT ID:', JSON.stringify(businessId))
        console.log('ID CHARACTERS:', [...businessId].map(c => c.charCodeAt(0)))
        console.log('Firebase project:', db.app.options.projectId)
        console.log('Business ID:', JSON.stringify(businessId))
        console.log('Business ID length:', businessId.length)
        const snapshot = await getDoc(businessRef)
        console.log('Requested business ID:', businessId)
        console.log('Profile document exists:', snapshot.exists())
        console.log('Profile document data:', snapshot.data())

        if (!snapshot.exists()) {
          setError('Business profile not found.')
          return
        }

        const data = snapshot.data()
        setBusiness(data)

        // TRACK PROFILE VIEW SOURCE
if (!viewTrackedRef.current) {
  viewTrackedRef.current = true

  const sourceParam = params.get('source')

  const visitSource =
    sourceParam === 'nfc' ? 'nfc' :
    sourceParam === 'qr' ? 'qr' :
    'direct'

  try {
    await addDoc(collection(db, 'profileEvents'), {
      businessId,
      eventType: 'profile_view',
      linkName: 'Profile View',
      source: visitSource,
      createdAt: serverTimestamp()
    })

    console.log('Profile view tracked:', visitSource)

  } catch (trackingError) {
    console.error('Profile view tracking error:', trackingError)
  }
}

        try {
          await setDoc(
            doc(db, 'profileAnalytics', businessId),
            {
              businessId,
              totalVisits: increment(1),
              lastVisitedAt: serverTimestamp()
            },
            { merge: true }
          )
        } catch (analyticsError) {
          console.error('Analytics error:', analyticsError)
        }
      } catch (err) {
        console.error('Profile loading error:', err)
        setError('Unable to load this business profile.')
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [])

  if (loading) {
    return <div className="tc-studio-message">Loading TapConnect...</div>
  }

  if (error || !business) {
    return (
      <div className="tc-studio-message">
        {error || 'Business not found.'}
      </div>
    )
  }

  const name = business.businessName || 'Your Business'
  const category = business.category || 'Business'
  const phone = cleanPhone(business.phone || '')
  const whatsapp = cleanPhone(business.whatsapp || business.phone || '')

  const rawInstagram = String(business.instagram || '').trim()
  const instagram = rawInstagram
    ? rawInstagram.startsWith('http')
      ? rawInstagram
      : `https://instagram.com/${rawInstagram.replace(/^@/, '')}`
    : ''

  const googleReview = makeUrl(
    business.googleReview ||
    business.googleReviewLink ||
    business.googleReviews ||
    ''
  )

  const website = makeUrl(business.website || '')
  const address = business.address || ''
  const cover = business.coverUrl || business.bannerUrl || ''
  const logo = business.logoUrl || ''

 
const allLinks = [
  {
    label: 'Google Reviews',
    detail: 'Share your experience',
    type: 'google',
    className: 'tc-google',
    url: googleReview
  },
  {
    label: 'Instagram',
    detail: 'Follow our latest updates',
    type: 'instagram',
    className: 'tc-instagram',
    url: instagram
  },
  {
    label: 'WhatsApp',
    detail: 'Chat with our team',
    type: 'whatsapp',
    className: 'tc-whatsapp',
    url: whatsapp ? `https://wa.me/${whatsapp}` : ''
  },
  {
    label: 'Call Business',
    detail: 'Speak directly with us',
    type: 'phone',
    className: 'tc-call',
    url: phone ? `tel:${phone}` : ''
  }
]

const links = allLinks.filter(item => {
  if (business.productType === 'google_review') {
    return item.type === 'google' && item.url
  }

  if (business.productType === 'instagram_follow') {
    return item.type === 'instagram' && item.url
  }

  if (business.productType === 'all_in_one') {
    return Boolean(item.url)
  }

  return false
})

  const mapUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : ''

  const mapEmbed = address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
    : ''

  return (
    <main className="tc-studio">
      <div className="tc-profile-card">

        <section className="tc-cover">
          {cover && <img src={cover} alt="" />}
          <div className="tc-cover-glow" />

          <div className="tc-profile-brand">
            <span className="tc-brand-mark">T</span>
            <span>TAPCONNECT</span>
          </div>

          <div className="tc-cover-caption">
            <span>THE DIGITAL EXPERIENCE</span>
            <span className="tc-cover-line" />
          </div>
        </section>

        <section className="tc-profile-intro">
          <div className="tc-logo">
            {logo
              ? <img src={logo} alt={`${name} logo`} />
              : name.charAt(0).toUpperCase()
            }
          </div>

          <span className="tc-category">{category}</span>

          <h1>{name}</h1>

          {business.productType === 'all_in_one' && address && (
            <p className="tc-address">
              <span>⌖</span> {address}
            </p>
          )}

          <p className="tc-description">
            Welcome to {name}. Discover our services, connect with our team
            and stay connected with us.
          </p>

          <div className="tc-intro-rule" />

          <div className="tc-connect-heading">
            <span className="tc-section-eyebrow">STAY CONNECTED</span>
            <h2>Connect With Us</h2>
            <p>Everything you need, beautifully connected.</p>
          </div>
        
        </section>

        <section className="tc-links"></section>

        <section className="tc-links">

          {links.map(item => (
            <a
              key={item.label}
              className={`tc-action-card ${item.className}`}
              href={item.url}
              onClick={() => trackLinkClick(item)}
              target={item.url.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
            >
              <span className="tc-link-icon">
                <BrandIcon type={item.type} />
              </span>

              <span className="tc-link-copy">
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>

              <span className="tc-link-arrow">↗</span>
            </a>
          ))}
        </section>

        {address && (
          <section className="tc-map-section">
            <div className="tc-map-heading">
              <div>
                <span className="tc-section-eyebrow">COME VISIT</span>
                <h2>Find Our Location</h2>
                <p>{address}</p>
              </div>
              <span className="tc-map-pin">⌖</span>
            </div>

            <div className="tc-map-frame">
              <iframe
                title="Business location"
                src={mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <a
              className="tc-directions"
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Directions <span>↗</span>
            </a>
          </section>
        )}

        <footer className="tc-profile-footer">
          <span className="tc-footer-mark">T</span>
          <span>Crafted with <strong>TapConnect</strong></span>
        </footer>
      </div>

      <p className="tc-studio-footnote">
        One tap. Every connection.
      </p>
    </main>
  )
}
