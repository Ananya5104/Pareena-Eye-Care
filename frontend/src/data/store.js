// Shop details shown across the site. Edit them here once.
export const STORE = {
  name: 'Pareena Eye Care Center',
  addressLines: ['Shop no. 1, #8-3-903/3, Omega Apartments', 'Nagarjuna Nagar, Ameerpet, Hyderabad'],
  phoneDisplay: '+91 99630 06059',
  phoneHref: 'tel:+919963006059',
  whatsappHref: 'https://wa.me/919963006059',
  email: 'pareenaeyecare@gmail.com',
  hours: [
    // Keep in step with Admin → Business hours, which controls the booking slots.
    { days: 'Monday to Saturday', short: 'Mon to Sat', time: '10 am to 9 pm' },
    { days: 'Sunday', short: 'Sunday', time: '11 am to 8 pm' },
  ],
  directionsHref: 'https://www.google.com/maps/search/?api=1&query=Pareena+Eye+Care+Center+Ameerpet+Hyderabad',
  mapEmbedSrc:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d951.6446662831966!2d78.44544452852834!3d17.43199629896212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb90ceaf7b6e4b%3A0x8b531265a8506a69!2sPareena%20Eye%20Care%20Center!5e0!3m2!1sen!2sin!4v1749571843788!5m2!1sen!2sin',
  googleReviewsHref: 'https://www.google.com/maps/search/?api=1&query=Pareena+Eye+Care+Center+Ameerpet+Hyderabad',
  // TODO: fill these in
  owner: '[Owner name]',
  since: '[year]',
  optometrist: {
    name: '[Optometrist name]',
    qualification: '[Qualification, for example B.Optom]',
    registration: '[Registration no.]',
    experience: '[25 years]',
    languages: '[Telugu, Hindi, English]',
    interest: "[Children's eye tests, contact lenses]",
  },
  readyIn: '3 to 5 days',
  consultReplyWithin: '2 hours',
  consultFee: '[Fee, or Free]',
}
