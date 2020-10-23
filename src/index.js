process.env.SENTRY_DSN =
  process.env.SENTRY_DSN ||
  'https://eb3bcb69e2d54604972c0564c9b98d05@sentry.cozycloud.cc/138'

const {
  BaseKonnector,
  requestFactory,
  errors,
  log
} = require('cozy-konnector-libs')

const baseUrl = 'https://epaapi.preprod.opunmaif.fr/api/data-collect'

module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  const { id, secret } = cozyParameters.secret
  const request = requestFactory({
    cheerio: false,
    json: true,
    auth: {
      user: id,
      pass: secret
    }
    // debug: true
  })

  const slug = getSlugFromDomain()

  let person
  try {
    person = await request.get(`${baseUrl}/persons/${slug}`)
  } catch (err) {
    log('error', err.message)
    throw new Error(errors.LOGIN_FAILED)
  }

  const identity = {
    fullname: `${person.prenom} ${person.nom}`,
    name: {
      familyName: person.nom,
      givenName: person.prenom
    },
    birthday: person.dateNaissance,
    email: [
      {
        address: person.coordonnees.email
      }
    ],
    address: [
      {
        street: person.adresse.numeroVoie,
        postcode: person.adresse.codePostal,
        city: person.adresse.commune
      }
    ],
    phone: [
      {
        number: person.coordonnees.numeroTelephonePortable
      }
    ],
    maif: {
      codeCivilite: person.codeCivilite,
      numeroPaysNaissance: person.numeroPaysNaissance,
      paysNaissance: person.paysNaissance,
      identifiant: person.identifiant,
      numeroSocietaire: person.numeroSocietaire,
      codeSexe: person.codeSexe,
      profession: person.profession
    }
  }

  await this.saveIdentity(identity, slug)

  log('info', `identity saved`)

  log('info', `Getting events`)
  const events = await request.get(`${baseUrl}/events/${slug}`)
  log('info', `found ${events.length} card(s)`)
  await this.updateOrCreate(events, 'fr.maif.events', ['cardID', 'personID'])
  log('info', `events saved`)
}

function getSlugFromDomain() {
  const matching = process.env.COZY_URL.match(/^https?:\/\/(.*)\.(.*)\.(.*)$/)
  if (!matching) {
    log('error', `wrong COZY_URL : ${process.env.COZY_URL}`)
    throw new Error(errors.VENDOR_DOWN)
  }

  const slug = matching[1]
  log('info', `Found slug ${slug}`)
  return slug
}
