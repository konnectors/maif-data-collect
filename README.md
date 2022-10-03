[Cozy][cozy] Maif EPA connector
=======================================

What's Cozy?
------------

![Cozy Logo](https://cdn.rawgit.com/cozy/cozy-guidelines/master/templates/cozy_logo_small.svg)

[Cozy] is a personal data platform that brings all your web services in the same private space. With it, your webapps and your devices can share data easily, providing you with a new experience. You can install Cozy on your own hardware where no one's tracking you.

What is this konnector about ?
------------------------------

This konnector retrieves io.cozy.identities data from you maif account at the moment


```javascript
{
  "cozyMetadata": {
    "doctypeVersion": 1,
    "metadataVersion": 1,
    "createdAt": "2020-07-31T13:57:55.524Z",
    "createdByApp": "maif-epa",
    "createdByAppVersion": "0.0.1",
    "updatedAt": "2020-07-31T13:57:55.524Z",
    "updatedByApps": [
      {
        "slug": "maif-epa",
        "date": "2020-07-31T13:57:55.524Z",
        "version": "0.0.1"
      }
    ],
    "sourceAccount": "default_account_id",
    "sourceAccountIdentifier": "1EPT28571"
  },
  "identifier": "testaccount",
  "contact": {
    "fullname": "John Doe",
    "name": {
      "familyName": "Doe",
      "givenName": "John"
    },
    "birthday": "1958-02-04",
    "email": [
      {
        "address": "maif@test.fr"
      }
    ],
    "address": [
      {
        "street": "2 RUE DU MOULIN",
        "postcode": "75000",
        "city": "PARIS"
      }
    ],
    "phone": [
      {
        "number": "+330900000001"
      }
    ],
    "maif": {
      "codeCivilite": "CODE_03",
      "numeroPaysNaissance": "France",
      "paysNaissance": "France",
      "identifiant": "1-EPT-28571",
      "numeroSocietaire": "1355575P",
      "codeSexe": "CODE_1",
      "profession": {
        "codeDomaineActivite": "CODE_026",
        "codeEmployeur": "A renseigner",
        "codeProfession": "CODE_06",
        "codeSecteurActivite": "CODE_03"
      }
    }
  },
  "_id": "c99fc8e6-b5a8-44df-b7af-6be4ce51bbd4"
}
```


### Open a Pull-Request

If you want to work on this konnector and submit code modifications, feel free to open pull-requests!
</br>See :
* the [contributing guide][contribute] for more information about how to properly open pull-requests.
* the [konnectors development guide](https://docs.cozy.io/en/tutorials/konnector/)

### Run and test

Create a `konnector-dev-config.json` file at the root with your test credentials :

```javascript
{
  "COZY_URL": "http://cozy.tools:8080",
  "fields": {"login":"zuck.m@rk.fb"}
}
```
Then :

```sh
yarn
yarn standalone
```
For running the konnector connected to a Cozy server and more details see [konnectors tutorial](https://docs.cozy.io/en/tutorials/konnector/)

### Cozy-konnector-libs

This connector uses [cozy-konnector-libs](https://github.com/cozy/cozy-konnector-libs). It brings a bunch of helpers to interact with the Cozy server and to fetch data from an online service.

### Maintainer

The lead maintainers for this konnector is Cozy


### Get in touch

You can reach the Cozy Community by:

- [Konnectors tutorial](https://docs.cozy.io/en/tutorials/konnector/)
- Chatting with us on IRC [#cozycloud on Libera.Chat][libera]
- Posting on our [Forum]
- Posting issues on the [Github repos][github]
- Say Hi! on [Twitter]


License
-------

<YOUR KONNECTOR NAME> is developed by <your name> and distributed under the [AGPL v3 license][agpl-3.0].

[cozy]: https://cozy.io "Cozy Cloud"
[agpl-3.0]: https://www.gnu.org/licenses/agpl-3.0.html
[libera]: https://web.libera.chat/#cozycloud
[forum]: https://forum.cozy.io/
[github]: https://github.com/cozy/
[nodejs]: https://nodejs.org/
[standard]: https://standardjs.com
[twitter]: https://twitter.com/mycozycloud
[webpack]: https://webpack.js.org
[yarn]: https://yarnpkg.com
[travis]: https://travis-ci.org
[contribute]: CONTRIBUTING.md
