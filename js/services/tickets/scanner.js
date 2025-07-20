function verifyTicketQR(payload, secret) {
    const parts = payload.split('|');
    if (parts.length !== 5) {
      throw new Error('Invalid QR format');
    }
  
    const [eventID, ticketID, uniqueCode, timestampStr, receivedSig] = parts;
    const data = `${eventID}|${ticketID}|${uniqueCode}|${timestampStr}`;
  
    // Recompute HMAC
    const key = new TextEncoder().encode(secret);
    const msg = new TextEncoder().encode(data);
  
    return crypto.subtle.importKey(
      'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    ).then(cryptoKey =>
      crypto.subtle.sign('HMAC', cryptoKey, msg)
    ).then(sigBuf => {
      const actualSig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  
      // Compare base64 strings
      if (actualSig !== receivedSig) {
        throw new Error('Invalid signature');
      }
  
      // Check timestamp
      const now = Math.floor(Date.now() / 1000);
      const qrTimestamp = parseInt(timestampStr, 10);
      const drift = Math.abs(now - qrTimestamp);
      if (drift > 300) {
        throw new Error('QR code expired');
      }
  
      return { eventID, ticketID, uniqueCode };
    });
  }
  

  /**********Example Usage***********/

//   const payload = "evt123|tkt456|codeXYZ|1714584792|abcDEFbase64==";
// verifyTicketQR(payload, "your-very-secret-key")
//   .then(data => {
//     console.log("Ticket verified:", data);
//     // Proceed with local verification or send to server
//   })
//   .catch(err => {
//     console.error("Ticket invalid:", err.message);
//   });
