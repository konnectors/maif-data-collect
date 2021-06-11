process.env.SENTRY_DSN =
  process.env.SENTRY_DSN ||
  'https://eb3bcb69e2d54604972c0564c9b98d05@sentry.cozycloud.cc/138'

const {
  BaseKonnector,
  requestFactory,
  errors,
  log,
  cozyClient,
  manifest
} = require('cozy-konnector-libs')

module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  const { azureapikey, dataCollectApiUrl } = cozyParameters.secret
  const { id, secret } = fields

  const requestOptions = {
    cheerio: false,
    json: true,
    // debug: true,
    auth: {
      user: 'epa-apikey',
      pass: azureapikey
    }
  }

  if (id && secret) {
    Object.assign(requestOptions, {
      headers: {
        'Epa-Auth-Id': id,
        'Epa-Auth-Secret': secret
      }
    })
  }

  const request = requestFactory(requestOptions)

  const { slug } = parseUrl(process.env.COZY_URL)

  const baseUrl = dataCollectApiUrl + '/api/data-collect'

  let person
  try {
    person = await request.get(`${baseUrl}/persons/${slug}`)
  } catch (err) {
    if (err.statusCode === 404) {
      log('info', '404: ' + err.message)
      log('info', 'Found no person')
    } else {
      log('error', err.message)
      throw new Error(errors.LOGIN_FAILED)
    }
  }

  if (person) {
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
  } else {
    const existingIdentity = (await cozyClient.data.findAll(
      'io.cozy.identities'
    )).find(doc => doc.cozyMetadata.createdByApp === manifest.data.slug)
    if (!existingIdentity) {
      log('warn', 'No person found in maif api and no existing identity')
    }
  }

  log('info', `Getting events`)
  const events = await request.get(`${baseUrl}/events/${slug}`)
  log('info', `found ${events.length} card(s)`)
  await this.updateOrCreate(events, 'fr.maif.events', ['cardId', 'personId'])
  log('info', `events saved`)
}

function parseUrl(url) {
  const matching = url.match(/^https?:\/\/(.*)\.(.*)\.(.*)$/)
  if (!matching) {
    log('error', `wrong COZY_URL : ${process.env.COZY_URL}`)
    throw new Error(errors.VENDOR_DOWN)
  }

  const slug = matching[1]
  log('info', `Found slug ${slug}`)

  return { slug }
}
