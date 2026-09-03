export function buildInquiryMessage(productName) {
  return `Hola, estoy interesado en el producto ${productName}. ¿Está disponible?`
}

export function buildWhatsAppLink(phone, message) {
  const cleanPhone = String(phone).replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
