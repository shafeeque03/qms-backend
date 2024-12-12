import twilio from 'twilio';

const accountSid = process.env.WP_ACCOUNTSID;
const authToken = process.env.WP_AUTHTOKEN;
const contentSidIs = process.env.WP_CONTENTSID;
const fromNum = process.env.WP_FROM;
const client = twilio(accountSid, authToken);

export const sendWhatsAppMessage = async (user, data, admin) => {
    try {
      const message = await client.messages.create({
        from: `whatsapp:${fromNum}`,
        to: `whatsapp:${user.phone}`,
        body: `Hello ${user.name},\n\nThank you for considering our services. Please find the proposal(# ${data.quotationId} ) attached below. You can view and download the PDF using the link:\n\n📄 ${data.proposal} \n\nFeel free to reach out if you have any questions.\n\nBest regards,\n ${admin}`
      });
  
      console.log('Message sent successfully:', message.sid);
      return message;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.message);
      throw error;
    }
  };
  
