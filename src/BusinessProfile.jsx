import { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  where,
  query,
  getDocs,
  doc,
  setDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

export default function BusinessProfile() {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const trackEvent = async (eventType, linkName = '') => {
  try {
    const params = new URLSearchParams(window.location.search)

    await addDoc(collection(db, 'profileEvents'), {
      businessId: params.get('id'),
      eventType,
      linkName,
      source: params.get('source') || 'direct',
      createdAt: serverTimestamp()
    })
  } catch (err) {
    console.error('Analytics event error:', err)
  }
}

  useEffect(() => {
    const loadBusiness = async () => {
      const params = new URLSearchParams(window.location.search)
      const businessId = params.get('id')

      if (!businessId) {
        setError('Business profile link is incomplete.')
        setLoading(false)
        return
      }

      try {
       const businessQuery = query(
  collection(db, 'publicBusinesses'),
  where('businessId', '==', businessId)
)

const snapshot = await getDocs(businessQuery)

let rawData = null

if (!snapshot.empty) {
  rawData = snapshot.docs[0].data()
} else {
  // Fallback: check whether the public document ID matches
  const publicDoc = await getDocs(
    query(collection(db, 'publicBusinesses'))
  )

  const matchingDoc = publicDoc.docs.find(
    item => item.id === businessId
  )

  if (matchingDoc) {
    rawData = matchingDoc.data()
  }
}

if (!rawData) {
  setError('Business profile not found.')
} else {
  const profileData = Object.fromEntries(
    Object.entries(rawData).map(([key, value]) => [
      key.trim(),
      typeof value === 'string' ? value.trim() : value
    ])
  )

  console.log('CLEAN PROFILE DATA:', profileData)
  setBusiness(profileData)
  await trackEvent('profile_view')
  // Record this business profile visit
try {
  await setDoc(
    doc(db, 'profileAnalytics', businessId),
    {
      businessId: businessId,
      totalVisits: increment(1),
      lastVisitedAt: serverTimestamp()
    },
    { merge: true }
  )
} catch (analyticsError) {
  console.error('Visit tracking error:', analyticsError)
}
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
    return <div style={styles.message}>Loading TapConnect...</div>
  }

  if (error) {
    return <div style={styles.message}>{error}</div>
  }

  const name = business.businessName || 'Business'
  const phone = business.phone || ''
  const whatsapp = business.whatsapp || phone
  const address = business.address || ''

  const cleanPhone = (value) => {
    let number = value.replace(/\D/g, '')
    if (number.length === 10) number = '91' + number
    return number
  }

  const makeUrl = (value) => {
    if (!value) return ''
    return /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`
  }

  const instagram = business.instagram
    ? business.instagram.startsWith('http')
      ? business.instagram
      : `https://instagram.com/${business.instagram.replace('@', '')}`
    : ''

  const googleReview =
    business.googleReview ||
    business.googleReviewLink ||
    business.googleReviews ||
    ''

  const website = makeUrl(business.website || '')

  const mapUrl = business.mapLink
    ? makeUrl(business.mapLink)
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : ''

  const mapEmbed = address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
    : ''

  const links = [
    {
      label: 'WhatsApp',
      subtitle: 'Chat with us directly',
      icon: '💬',
      url: whatsapp ? `https://wa.me/${cleanPhone(whatsapp)}` : '',
      color: '#16A34A'
    },
    {
      label: 'Call Us',
      subtitle: 'Speak with our team',
      icon: '📞',
      url: phone ? `tel:${phone.replace(/\s/g, '')}` : '',
      color: '#2563EB'
    },
    {
      label: 'Instagram',
      subtitle: 'Follow us on Instagram',
      icon: '📸',
      url: instagram,
      color: '#DB2777'
    },
    {
      label: 'Google Reviews',
      subtitle: 'Share your experience',
      icon: '⭐',
      url: googleReview,
      color: '#E5A000'
    },
    {
      label: 'Visit Website',
      subtitle: 'Explore our website',
      icon: '🌐',
      url: website,
      color: '#7045ED'
    },
    {
      label: 'Get Directions',
      subtitle: 'Find us on Google Maps',
      icon: '📍',
      url: mapUrl,
      color: '#EA580C'
    }
  ].filter(item => item.url)
  console.log('TAPCONNECT GENERATED LINKS:', links)

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.topBrand}>
          <div style={styles.brandIcon}>T</div>
          <span>TapConnect</span>
        </div>

        <section style={styles.profile}>

          <div style={styles.cover}>
            <div style={styles.logo}>
              {business.logoUrl
                ? <img src={business.logoUrl} alt={name} style={styles.logoImage} />
                : name.charAt(0).toUpperCase()
              }
            </div>
          </div>

          <div style={styles.businessInfo}>
            <h1>{name}</h1>

            <span style={styles.category}>
              {business.category || 'Local Business'}
            </span>

            {address && (
              <p style={styles.address}>
                📍 {address}
              </p>
            )}

            {business.description && (
              <p style={styles.description}>
                {business.description}
              </p>
            )}
          </div>

          <div style={styles.connectHeading}>
            <h2>Connect With Us</h2>
            <p>Everything you need, in one place.</p>
          </div>

          <div style={styles.links}>
            {links.map(item => (
              <a
                key={item.label}
                href={item.url}
                onClick={() => trackEvent('link_click', item.label)}
                target={item.url.startsWith('tel:') ? undefined : '_blank'}
                rel="noopener noreferrer"
                style={styles.link}
              >
                <div
                  style={{
                    ...styles.linkIcon,
                    background: `${item.color}15`
                  }}
                >
                  <span>{item.icon}</span>
                </div>

                <div style={styles.linkText}>
                  <strong>{item.label}</strong>
                  <small>{item.subtitle}</small>
                </div>

                <span style={styles.arrow}>↗</span>
              </a>
            ))}
          </div>

          {mapEmbed && (
            <div style={styles.mapSection}>
              <div style={styles.mapHeading}>
                <div>
                  <h2>Find Our Location</h2>
                  <p>{address}</p>
                </div>
                <span>📍</span>
              </div>

              <iframe
                title="Business location"
                src={mapEmbed}
                style={styles.map}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />

              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.directions}
              >
                Open Google Maps ↗
              </a>
            </div>
          )}

          <footer style={styles.footer}>
            <div style={styles.footerLogo}>T</div>
            <span>Powered by <strong>TapConnect</strong></span>
          </footer>

        </section>

        <p style={styles.bottomText}>
          One tap. Everything connected.
        </p>

      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F4F5FA',
    padding: '30px 16px',
    fontFamily: 'Inter, Arial, sans-serif',
    color: '#19182A'
  },

  container: {
    maxWidth: '540px',
    margin: '0 auto'
  },

  topBrand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    fontWeight: '800',
    fontSize: '17px',
    marginBottom: '22px',
    color: '#25203B'
  },

  brandIcon: {
    background: '#7045ED',
    color: '#fff',
    width: '30px',
    height: '30px',
    borderRadius: '9px',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 'bold'
  },

  profile: {
    background: '#fff',
    borderRadius: '25px',
    overflow: 'hidden',
    boxShadow: '0 15px 50px rgba(30,25,60,0.08)'
  },

  cover: {
    height: '100px',
    background: 'linear-gradient(120deg, #7045ED, #A78BFA)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end'
  },

  logo: {
    width: '88px',
    height: '88px',
    borderRadius: '25px',
    background: '#fff',
    color: '#7045ED',
    border: '5px solid white',
    fontSize: '38px',
    fontWeight: '800',
    display: 'grid',
    placeItems: 'center',
    transform: 'translateY(40px)',
    boxShadow: '0 5px 18px rgba(0,0,0,0.12)',
    overflow: 'hidden'
  },

  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  businessInfo: {
    textAlign: 'center',
    padding: '49px 25px 12px'
  },

  businessTitle: {
    fontSize: '27px'
  },

  category: {
    display: 'inline-block',
    background: '#F0ECFF',
    color: '#7045ED',
    padding: '6px 14px',
    borderRadius: '30px',
    fontSize: '12px',
    fontWeight: '700',
    marginTop: '5px'
  },

  address: {
    color: '#77768A',
    fontSize: '13px',
    marginTop: '14px'
  },

  description: {
    color: '#77768A',
    fontSize: '14px',
    lineHeight: 1.7,
    marginTop: '14px'
  },

  connectHeading: {
    padding: '20px 25px 10px'
  },

  links: {
    display: 'grid',
    gap: '11px',
    padding: '10px 22px 25px'
  },

  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    padding: '13px',
    border: '1px solid #ECEBF3',
    borderRadius: '15px',
    color: '#222136',
    textDecoration: 'none',
    background: '#fff',
    minHeight: '65px'
  },

  linkIcon: {
    width: '43px',
    height: '43px',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '21px',
    flexShrink: 0
  },

  linkText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },

  linkTextSmall: {
    color: '#888'
  },

  arrow: {
    marginLeft: 'auto',
    color: '#7045ED',
    fontSize: '20px',
    padding: '0 5px'
  },

  mapSection: {
    padding: '22px',
    borderTop: '1px solid #F0EFF5'
  },

  mapHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '13px'
  },

  map: {
    width: '100%',
    height: '210px',
    border: 0,
    borderRadius: '15px'
  },

  directions: {
    display: 'block',
    marginTop: '12px',
    background: '#7045ED',
    color: '#fff',
    textAlign: 'center',
    padding: '13px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '700'
  },

  footer: {
    borderTop: '1px solid #F0EFF5',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '9px',
    color: '#999',
    fontSize: '13px'
  },

  footerLogo: {
    width: '23px',
    height: '23px',
    borderRadius: '7px',
    background: '#7045ED',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 'bold'
  },

  bottomText: {
    textAlign: 'center',
    color: '#999',
    fontSize: '12px',
    marginTop: '20px'
  },

  message: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    fontFamily: 'Arial, sans-serif'
  }
}
