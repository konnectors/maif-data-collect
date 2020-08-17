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
  const idSiebel = fields.login
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

  const personnes = await request.get(`${baseUrl}/personnes/${idSiebel}`)
  log('info', `found ${personnes.length} personne(s)`)
  if (!personnes || !personnes.length) {
    throw new Error(errors.LOGIN_FAILED)
  }

  const identities = personnes.map(personne => ({
    fullname: `${personne.prenom} ${personne.nom}`,
    name: {
      familyName: personne.nom,
      givenName: personne.prenom
    },
    birthday: personne.dateNaissance,
    email: [
      {
        address: personne.coordonnees.email
      }
    ],
    address: [
      {
        street: personne.adresse.numeroVoie,
        postcode: personne.adresse.codePostal,
        city: personne.adresse.commune
      }
    ],
    phone: [
      {
        number: personne.coordonnees.numeroTelephonePortable
      }
    ],
    maif: {
      codeCivilite: personne.codeCivilite,
      numeroPaysNaissance: personne.numeroPaysNaissance,
      paysNaissance: personne.paysNaissance,
      identifiant: personne.identifiant,
      numeroSocietaire: personne.numeroSocietaire,
      codeSexe: personne.codeSexe,
      profession: personne.profession
    }
  }))

  for (const identity of identities) {
    await this.saveIdentity(identity, idSiebel)
  }
  log('info', `identities saved`)

  log('info', `Getting timelines`)
  const timelines = await request.get(
    `https://epaapi.preprod.opunmaif.fr/api/timelines/${idSiebel}`
  )
  log('info', `found ${timelines.length} card(s)`)
  await this.updateOrCreate(timelines, 'fr.maif.timelines', [
    'cardID',
    'idPerson'
  ])
  log('info', `timeline saved`)
}
