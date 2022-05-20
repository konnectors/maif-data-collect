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

const client = cozyClient.new
const { Q } = require('cozy-client')
const get = require('lodash/get')

module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  const { azureapikey, dataCollectApiUrl } = cozyParameters.secret
  const { id, secret } = fields

  const requestOptions = {
    cheerio: false,
    json: true,
    // debug: 'json',
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
  // Payload present if called via webhook
  const rawPayload = JSON.parse(process.env.COZY_PAYLOAD || '{}')
  const payload = rawPayload.payloads[0]
  const baseUrl = dataCollectApiUrl + '/api/data-collect'

  if (
    payload.scopes &&
    Array.isArray(payload.scopes) &&
    // For now we need to launch both routine if scopes is empty
    payload.scopes.length > 0
  ) {
    if (payload.scopes.includes('fr.maif.events')) {
      log('info', 'Lauching Events routine')
      await getEvents.bind(this)(request, baseUrl, slug)
    }
    if (payload.scopes.includes('io.cozy.identities')) {
      log('info', 'Lauching Person routine')
      await savePerson.bind(this)(request, baseUrl, slug)
    }
  } else {
    // For now, we launch all 2 routines in all other cases
    log('info', 'Lauching both person and event routine')
    await savePerson.bind(this)(request, baseUrl, slug)
    await getEvents.bind(this)(request, baseUrl, slug)
  }
}

async function savePerson(request, baseUrl, slug) {
  let person
  try {
    person = await request.get(`${baseUrl}/persons/${slug}`)
  } catch (err) {
    if (err.statusCode === 401) {
      log('error', '401: ' + err.message)
      throw new Error(errors.LOGIN_FAILED)
    } else if (err.statusCode === 404) {
      log('warn', '404: ' + err.message)
      log('info', 'Found no person')
    } else {
      log('error', err.statusCode + ': ' + err.message)
      throw new Error(errors.VENDOR_DOWN)
    }
  }

  if (person) {
    if (!person.identifiant) {
      log('error', 'Missing mendatory identifiant field in person')
      throw new Error('VENDOR_DOWN')
    }

    const fullname =
      person.prenom && person.nom ? `${person.prenom} ${person.nom}` : undefined

    const identity = {
      fullname,
      name: {
        familyName: person.nom,
        givenName: person.prenom
      },
      birthday: person.dateNaissance,
      email: [
        {
          address: get(person, 'coordonnees.email')
        }
      ],
      address: [
        {
          street: get(person, 'adresse.numeroVoie'),
          postcode: get(person, 'adresse.codePostal'),
          city: get(person, 'adresse.commune')
        }
      ],
      phone: [
        {
          number: get(person, 'coordonnees.numeroTelephonePortable')
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
    const { data: existingIdentity } = await client.query(
      Q('io.cozy.identities')
        .where({ cozyMetadata: { createdByApp: manifest.data.slug } })
        .indexFields(['cozyMetadata.createdByApp'])
    )
    if (existingIdentity.length < 1) {
      log('warn', 'No person found in maif api and no existing identity')
    }
  }
}

async function getEvents(request, baseUrl, slug) {
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
