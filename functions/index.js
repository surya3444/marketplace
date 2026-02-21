// NOTE: Added onDocumentUpdated to the import
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const twilio = require("twilio");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");

// NEW: Import Firestore and initialize Admin SDK to fetch vendor info
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = getFirestore();

// 1. Credentials from .env
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
// IMPORTANT: Ensure this is your PURCHASED number in your .env file
const myProductionNumber = process.env.TWILIO_PHONE; 

// 2. Your APPROVED Template IDs
const welcomeTemplateSid = "HXed0b6094f66d172174c727e3403ae879"; 
// NEW: Order Status Template SID
const orderStatusTemplateSid = "HX5e4df5057ca1586b8d2ea6b9d7cd3a9b";

const client = twilio(accountSid, authToken);

exports.sendVendorWelcome = onDocumentCreated("users/{userId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const newUser = snapshot.data();

  // Only send if the new user is a Vendor and has a phone number
  if (newUser.role === "vendor" && newUser.contactNumber) {
    try {
      let phone = newUser.contactNumber;
      // Ensure strict E.164 formatting (+91...)
      if (!phone.startsWith("+")) {
          phone = "+91" + phone;
      }

      // 3. Send using the Content API
      await client.messages.create({
        from: `whatsapp:${myProductionNumber}`, 
        to: `whatsapp:${phone}`,                
        contentSid: welcomeTemplateSid,         
        contentVariables: JSON.stringify({
          1: newUser.vendorName || "Partner",         // Fills {{1}} (Vendor Name)
          2: newUser.email                      // Fills {{2}} (Login ID)
        })
      });

      logger.log(`Production Welcome Message sent to ${phone}`);
      
      // Mark as sent in Firestore so we don't send duplicates
      return snapshot.ref.update({ welcomeMessageSent: true });

    } catch (error) {
      logger.error("Error sending WhatsApp:", error);
      return null;
    }
  }
  return null;
});

exports.updateUserPassword = onCall(async (request) => {
  // 1. Get data from the client
  const { uid, newPassword } = request.data;

  if (!uid || !newPassword) {
    throw new HttpsError('invalid-argument', 'The function must be called with a uid and newPassword.');
  }

  try {
    // 2. Use Admin SDK to update the Auth user
    await getAuth().updateUser(uid, {
      password: newPassword,
    });

    return { message: "Password updated successfully" };
  } catch (error) {
    console.error("Error updating password:", error);
    throw new HttpsError('internal', error.message);
  }
});

// ============================================================================
// NEW FUNCTION: Send Order Status Update to Customer
// ============================================================================
exports.sendOrderStatusUpdate = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only proceed if the status field actually changed
  if (!after || before.status === after.status) {
      return null;
  }

  // Ensure we have a customer phone number to send the message to
  if (after.customerPhone) {
    try {
      let phone = after.customerPhone;
      // Ensure strict E.164 formatting (+91...)
      if (!phone.startsWith("+")) {
          phone = "+91" + phone;
      }

      // --- NEW: Fetch Vendor Info from Users Collection ---
      let finalVendorName = "Partner";
      let finalVendorContact = "Support";

      if (after.vendorId) {
        const vendorDoc = await db.collection("users").doc(after.vendorId).get();
        if (vendorDoc.exists) {
            const vendorData = vendorDoc.data();
            // Use businessName, fallback to vendorName, fallback to "Partner"
            finalVendorName = vendorData.businessName || vendorData.vendorName || "Partner";
            finalVendorContact = vendorData.contactNumber || "Support";
        }
      }

      // Send using the Content API with the new template
      await client.messages.create({
        from: `whatsapp:${myProductionNumber}`, 
        to: `whatsapp:${phone}`,                
        contentSid: orderStatusTemplateSid,         
        contentVariables: JSON.stringify({
          1: after.customerName || "Customer",          // Fills {{1}} Customer Name
          2: event.params.orderId || after.orderId,     // Fills {{2}} Order ID
          3: after.status || "Updated",                 // Fills {{3}} Status
          4: finalVendorName,                           // Fills {{4}} Vendor Name
          5: finalVendorContact                         // Fills {{5}} Vendor Contact
        })
      });

      logger.log(`Order status update sent to customer ${phone} for order ${event.params.orderId}`);
      return null;

    } catch (error) {
      logger.error("Error sending WhatsApp order update:", error);
      return null;
    }
  }
  return null;
});