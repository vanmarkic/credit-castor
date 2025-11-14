// Quick test script to verify Firestore save works
// Run this in the browser console on http://localhost:4323/credit-castor

console.log('🧪 Testing Firestore save...');

// Check if Firebase is configured
if (typeof window !== 'undefined' && window.firebase) {
  console.log('✅ Firebase is configured');
  
  // Monitor console for save attempts
  const originalLog = console.log;
  console.log = function(...args) {
    if (args[0]?.includes?.('Saving to Firestore') || 
        args[0]?.includes?.('updateDoc') || 
        args[0]?.includes?.('setDoc') ||
        args[0]?.includes?.('maxTotalLots')) {
      originalLog('🔍', ...args);
    }
    originalLog.apply(console, args);
  };
  
  console.log('👀 Monitoring Firestore save operations...');
  console.log('📝 Try editing a participant\'s surface to trigger a save');
} else {
  console.log('❌ Firebase not found - make sure you\'re on the app page');
}

