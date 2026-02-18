const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const twilio = require("twilio");

// 1. Credentials from .env
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
// IMPORTANT: Ensure this is your PURCHASED number in your .env file
const myProductionNumber = process.env.TWILIO_PHONE; 

// 2. Your APPROVED Template ID (From your screenshot)
const welcomeTemplateSid = "HXed0b6094f66d172174c727e3403ae879"; 

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