# Mobile Features Setup Guide

## Overview

UnityVault now includes three mobile-focused features:

1. **Offline Mode** - View past transactions without internet
2. **Push Notifications** - Real-time alerts for payments and approvals
3. **Receipt Generation** - Download/email payment receipts

These features are implemented as a Progressive Web App (PWA) for mobile and desktop browsers.

## Features

### 1. Offline Mode

**What it does:**
- Caches API responses locally
- Allows viewing of previously loaded transactions when offline
- Shows offline indicator when internet is unavailable
- Automatically syncs when back online

**How to use:**
- The app automatically caches data as you browse
- When offline, you can still view previously loaded pages
- A banner will indicate when you're offline

**Files involved:**
- `/public/sw.js` - Service worker handling caching
- `/public/offline.html` - Offline fallback page
- `/src/hooks/use-offline.ts` - Offline detection and caching utilities

### 2. Push Notifications

**What it does:**
- Sends real-time browser notifications for important events
- Works even when the app is closed (if browser supports it)
- Notifications for: pending approvals, payment confirmations, loan updates

**How to use:**
1. Enable notifications in your profile settings
2. Grant browser permission when prompted
3. Receive notifications even when app is closed

**Setup required:**

1. **Generate VAPID keys** (backend):
   ```bash
   cd server
   npm install web-push
   npx web-push generate-vapid-keys
   ```

2. **Add keys to environment variables**:

   Backend (.env):
   ```env
   VAPID_PUBLIC_KEY=your_public_key_here
   VAPID_PRIVATE_KEY=your_private_key_here
   VAPID_SUBJECT=mailto:admin@unityvault.com
   ```

   Frontend (.env.local):
   ```env
   VITE_VAPID_PUBLIC_KEY=your_public_key_here
   ```

3. **Implement push sending in backend** (optional for now):
   ```typescript
   import { sendPushNotification } from "../controllers/pushNotificationController";
   
   // In your service when an event occurs:
   await sendPushNotification(userId, {
     title: "Payment Received",
     body: "Your contribution for January has been confirmed",
     url: "/dashboard/contributions"
   });
   ```

**Files involved:**
- `/public/sw.js` - Service worker handling push events
- `/src/hooks/use-push-notifications.ts` - Push subscription management
- `/server/src/controllers/pushNotificationController.ts` - Backend push endpoints
- `/server/src/routes/push.ts` - Push notification routes

### 3. Receipt Generation

**What it does:**
- Generates PDF receipts for payments
- Available for: contributions, loan payments
- Receipts include transaction details, member info, amounts, and timestamps

**How to use:**
1. After making a payment, a success dialog appears
2. Click "Download Receipt" to save the PDF
3. Receipt is automatically named with transaction ID

**API Endpoints:**
- `GET /api/receipts/contribution/:contributionId` - Download contribution receipt
- `GET /api/receipts/loan/:installmentId` - Download loan payment receipt
- `POST /api/receipts/email` - Email receipt to user

**Files involved:**
- `/server/src/controllers/receiptController.ts` - PDF generation logic
- `/server/src/routes/receipts.ts` - Receipt routes
- `/src/pages/MemberContributionPayment.tsx` - Frontend integration

## PWA Installation

### For Users

**Android:**
1. Visit the app in Chrome
2. Tap the menu (⋮) 
3. Select "Install app" or "Add to Home Screen"
4. Launch from home screen like a native app

**iOS:**
1. Visit the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. App will appear on home screen

**Desktop:**
- Chrome/Edge will show an install button in the address bar
- Click to install as desktop app

### For Developers

**PWA Files:**
- `/public/manifest.json` - PWA metadata
- `/public/sw.js` - Service worker
- `/src/main.tsx` - Service worker registration
- `/index.html` - Manifest link

**Customization:**
- Update app icons in `/public/manifest.json` (create 192x192 and 512x512 PNG icons)
- Modify theme color in manifest and HTML head
- Customize service worker caching strategy in `sw.js`

## Testing

### Test Offline Mode
1. Open browser DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Try navigating the app - cached pages should still work

### Test Push Notifications
1. Enable notifications in profile
2. Open another browser tab/window
3. Trigger a notification from admin panel
4. Should see browser notification

### Test Receipt Download
1. Make a test payment
2. Click "Download Receipt" in success modal
3. PDF should download with transaction details

## Browser Support

**Full PWA Support:**
- Chrome/Edge 90+
- Firefox 90+
- Safari 15+ (limited push notification support)
- Opera 76+

**Offline Mode:**
- All modern browsers with service worker support

**Push Notifications:**
- Chrome/Edge (Desktop & Android)
- Firefox (Desktop & Android)
- Safari 16+ (macOS only, iOS not supported)

## Production Deployment

1. **Environment Variables:**
   - Set all required env vars on your hosting platform
   - Ensure VAPID keys are secure (use secrets manager)

2. **HTTPS Required:**
   - PWA features require HTTPS in production
   - Service workers only work over HTTPS (except localhost)

3. **Icon Assets:**
   - Generate 192x192 and 512x512 PNG icons
   - Place in `/public/` folder
   - Update manifest.json references

4. **Web Push Library:**
   - Install in production: `npm install web-push`
   - Use for actual push notification sending (currently stubbed)

## Troubleshooting

**Service Worker Not Registering:**
- Check browser console for errors
- Ensure HTTPS (or localhost for dev)
- Clear browser cache and reload

**Push Notifications Not Working:**
- Verify VAPID keys are set correctly
- Check browser permissions (may need to reset)
- Ensure service worker is registered
- Safari has limited support

**Offline Mode Not Caching:**
- Check Network tab → Service Workers
- Verify caching strategy in sw.js
- Clear service worker and re-register

**Receipt Download Fails:**
- Check backend is running
- Verify authentication token is valid
- Check browser console for errors
- Ensure PDFKit dependency is installed

## Future Enhancements

- **Background Sync**: Queue transactions when offline, sync when online
- **Installment Payment Plans**: Split large payments over time
- **Biometric Authentication**: Fingerprint/Face ID login on mobile
- **Share Receipts**: Direct share to WhatsApp, email, etc.
- **Offline Payments**: Queue payments locally when offline

## Support

For issues or questions:
- Check browser console for errors
- Review this guide for setup steps
- Ensure all dependencies are installed
- Verify environment variables are set correctly
