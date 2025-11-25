// Google Analytics helper functions
// Uncomment and configure if you want to use Google Analytics

// Replace 'G-XXXXXXXXXX' with your actual Google Analytics tracking ID
// export const GA_TRACKING_ID = 'G-XXXXXXXXXX'

// Track page views
export const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.VITE_GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// Track custom events
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Example usage for tracking model uploads:
// import { event } from './utils/analytics'
// event({
//   action: 'model_uploaded',
//   category: 'Model Operations',
//   label: 'GLB Upload',
//   value: file.size
// })

// Example usage for tracking splits:
// event({
//   action: 'model_split',
//   category: 'Model Operations', 
//   label: 'Spatial Split',
//   value: tiles.length
// })

