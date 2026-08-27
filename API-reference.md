https://enablebanking.com/docs/api/reference/#flow-diagrams

API reference
Scroll down for example requests and responses.

Base URLs:

https://api.enablebanking.com

https://api.tilisy.com (deprecated)

Flow diagrams
Account information flow
AIS flow diagram

Application (i.e. API client) makes GET /aspsps request to obtain a list of available ASPSPs along with necessary meta data. Alternatively, the list of ASPSP can be displayed using the ASPSP selection UI widget.

List of available ASPSPs is returned and displayed to a PSU.

The PSU selects desired ASPSP and an application makes POST /auth request, specifying desired ASPSP and providing information about needed access rights.

Enable Banking starts authorisation in a desired ASPSP.

Enable Banking responds to the client with a redirect url to a Enable Banking page, where PSU needs to be redirected.

The PSU is redirected to the Enable Banking page.

After the PSU is redirected, Enable Banking does interactions with an ASPSP necessary to get authorised access to the PSU's account.

These actions are ASPSP-specific and may be different depending of the authentication method (which may be specified at step 3).

The PSU is redirected to the callback URL provided by the application with additional parameters added in its query string.

If the authorisation went successfully then query string from step 8 will contain code parameter, which needs to be sent in POST /sessions request.

The Enable Banking API will respond with created session_id along with a list of accessible accounts and their details.

Note that some of the information returned in that call is shown only once.

After successfull response to POST /sessions request the application can start making requests to Enable Banking API to fetch information about session, account balances and transactions.

Possible query parameters returned in the step 8 (parameters follow The OAuth 2.0 Authorization Framework (opens new window)):

code — authorisation code.
state — same as state, provided in the step 3.
error — error code
error_description — human-readable error description
Possible error descriptions:

Denied data sharing consent — user cancelled authentication before accepting data sharing consent (error code is access_denied)
Cancelled by user — user cancelled authorisation of access to account information (error code is access_denied). There are also arbitrary error descriptions possible, which are coming from ASPSPs.
Payment initiation flow
PIS flow diagram

Application (i.e. API client) makes GET /aspsps request to obtain a list of available ASPSPs along with necessary meta data. Alternatively, the list of ASPSP can be displayed using the ASPSP selection UI widget.

List of available ASPSPs is returned and displayed to a PSU.

The PSU selects desired ASPSP and the application makes POST /payments request, specifying a desired ASPSP, providing details for the payment to be initiated and other details such as callback URL, preferred authentication method, etc.

Enable Banking responds to the application with an ID assigned to the payment and a URL of the page, where PSU needs to be redirected.

The PSU is redirected to the Enable Banking page, where they shall review payment details and terms of the service.

After the PSU accepted term of service, Enable Banking does interactions with the ASPSP necessary to initiate the payment and complete its authorisation.

These actions are ASPSP-specific and may be different depending of the authentication method (which may be specified at step 3).

The PSU is redirected to the callback URL provided by the application with additional parameters added in its query string.

If the return URL does not contain the error GET parameter, the initiated payment should have been successfully authorised by the end user. The application can then retrieve the payment details to determine its status and additional information such as the debtor's name and account number.

If the selected ASPSP payment type supports deferred submission for execution ("deferred_submission_supported": true is visible in the GET /aspsps response) and the payment was created with "defer_submission": true, the payment won't be automatically submitted for execution after it's authorised by the PSU. The application can call GET /payments/{payment_id} to inspect the payment details (including the debtor's name and account number, where the ASPSP provides them) and then explicitly submit the payment for execution by calling POST /payments/{payment_id}/submit. If the submit call is not made, the payment will remain unexecuted.

If a webhook URL was provided when the application created the payment, the payment status will be retrieved in the background, and the webhook will be triggered whenever the payment status changes.

Possible query parameters returned in the step 7:

state — same as state, provided in the step 3.
error — error code
error_description — human-readable error description
Possible error descriptions:

Cancelled by user — user cancelled authorisation of the payment (error code is access_denied). There are also arbitrary error descriptions possible, which are coming from ASPSPs.
Authentication
In order to get access to this API you need to:

Generate a private RSA key and a self-signed certificate;
Upload the certificate to enablebanking.com and get application ID;
Construct JWT with the data described below and signed with your private key;
Send the JWT in the Authorization header.
Private key and certificate generation
Generating private RSA key

openssl genrsa -out private.key 4096
OpenSSL CLI can be used for generation of a private key and self-signed certificate.

Make sure you keep the private key in secret (e.g. don't expose it to client, share with anyone nor embed into mobile or other apps intalled to user devices).

Generating self-signed certificate

openssl req -new -x509 -days 365 -key private.key -out public.crt -subj "/C=FI/ST=Uusima/L=Helsinki/O=ExampleOrganisation/CN=www.bigorg.com"
You should replace values under -subj with appropriate values.

Alternatively you can use the private key generated in your browser when registering a new application. Just choose Generate in the browser (using SubtleCrypto) and export private key option when registering an application, and the private key will be exported after the application has been registered (the corresponding certificate will be used for the app registration).

Certificate upload and application registration
To register a new application you need to have an account on the Enable Banking Control Panel (opens new window). You can create one by visiting https://enablebanking.com/sign-in/ (opens new window)and entering your email address (a one-time authentication link will be sent to your email address).

In the app registration form (opens new window)you will be asked to upload the public certificate that you created for the application being registered.

An application can be registered to either PRODUCTION (aka "live") or SANDBOX (aka "simulation") environment. Applications can not be transferred from the sandbox to the production environment and vice versa.

Applications registered into the sandbox environment are activated automatically. Applications registered to the production environment at first appear as pending and will be activated either after contractual formalities for the use of the API are cleared or after you whitelist your own accounts. For more information please contact us at info@enablebanking.com.

Application registration API
You can also register an application sending POST request containing JSON with the application details and public certificate to https://enablebanking.com/api/applications endpoint.

The JSON body for the endpoint is to include the following fields:

"certificate": Content of the certificate or public key of the application (always required)
"environment": Environment (SANDBOX or PRODUCTION) in which the application will operate (always required)
"name": Name of the application being registered (always required)
"redirect_urls": List of allowed redirect URLs for the application (always required)
"description": Description of the application being registered (required when the environment field is set to PRODUCTION)
"gdpr_email": Email address for data protection matters (required when the environment field is set to PRODUCTION)
"privacy_url": URL of the application's privacy policy (required when the environment field is set to PRODUCTION)
"terms_url": URL of the application's terms of service (required when the environment field is set to PRODUCTION)
App registration example using curl

curl -X POST -H "Authorization: Bearer YOUR-JWT-ON-ENABLEBANKING-COM" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"My app\",\"certificate\":\"$(cat public.crt | tr '\n' '|' | sed 's/|/\\n/g')\",\"environment\":\"SANDBOX\",\"redirect_urls\":[\"https://example.org/\"]}" \
  https://enablebanking.com/api/applications
In response to the app registration request, you will receive an ID assigned to your application, which is to be used when forming JTW token.

Example response

{
  "app_id": "cf589be3-3755-465b-a8df-a90a16a31403"
}
JWT format and signature
JWT example

eyJ0eXAiOiAiSldUIiwgImFsZyI6ICJSUzI1NiIsICJraWQiOiAiY2Y1ODliZTMtMzc1NS00NjViLWE4ZGYtYTkwYTE2YTMxNDAzIn0.eyJpc3MiOiAiZW5hYmxlYmFua2luZy5jb20iLCAiYXVkIjogImFwaS50aWxpc3kuY29tIiwgImlhdCI6IDE2MDE0NTY3NjgsICJleHAiOiAxNjAxNTQzMTY4fQ.daO3ENSYIA3ud7Ay7uGQ0xxqq9r4_WLcM5SbrN_6_fqsFZXFdoGQA5nKiyP8Ot4nWdYcZvaNWxEAOIodUFndOP8pjihF9-rMXuNGEjde1cq2WjYzKwiIeodUej8okDWdB--szcgurzGMd8RRMjqr951PWqnXS-PbrRsavDHp8l2q4YBjh2m80nRruKnQCAn0dtm4A5G9rZaEowo9z-c8HJU101jKddyOpHhl9UvxVrERzHtyO4LdidiP4rP1hmaVMWybSbcIMI_h30qjqWP21kYRH9ENITTttbf0uZIa8s74jKYxNIdiiDyRaq9WjoPolrHI_ZxcMjp8mmCKX-N-1w
You can read more about JWT here: https://jwt.io/introduction/

JWT header must contain following fields:

"typ": "JWT" (always the same)
"alg": "RS256" (always the same, only RS256 is supported)
"kid": "<application_id>" (application id obtained after certificate upload)
JWT body must contain following fields:

"iss": "enablebanking.com" (always the same)
"aud": "api.enablebanking.com" (always the same, formerly had to be "api.tilisy.com", which is now deprecated)
"iat": 1601456603 (timestamp when the token is being created)
"exp": 1601460262 (timestamp when the token expires)
Maximum allowed time-to-live for token is 86400 seconds (24 hours). Tokens created with longer TTL are not accepted by the API.

Check code samples in C#, Node.js, PHP, Python and Ruby in our GitHub repository(opens new window)

https://github.com/enablebanking/enablebanking-api-samples
Send request with JWT provided
Example request

GET https://api.enablebanking.com/application HTTP/1.1
Host: api.enablebanking.com
Authorization: Bearer eyJ0eXAiOiAiSldUIiwgImFsZyI6ICJSUzI1NiIsICJraWQiOiAiY2Y1ODliZTMtMzc1NS00NjViLWE4ZGYtYTkwYTE2YTMxNDAzIn0.eyJpc3MiOiAiZW5hYmxlYmFua2luZy5jb20iLCAiYXVkIjogImFwaS5lbmFibGViYW5raW5nLmNvbSIsICJpYXQiOiAxNjAxNDU2NzY4LCAiZXhwIjogMTYwMTU0MzE2OH0.daO3ENSYIA3ud7Ay7uGQ0xxqq9r4_WLcM5SbrN_6_fqsFZXFdoGQA5nKiyP8Ot4nWdYcZvaNWxEAOIodUFndOP8pjihF9-rMXuNGEjde1cq2WjYzKwiIeodUej8okDWdB--szcgurzGMd8RRMjqr951PWqnXS-PbrRsavDHp8l2q4YBjh2m80nRruKnQCAn0dtm4A5G9rZaEowo9z-c8HJU101jKddyOpHhl9UvxVrERzHtyO4LdidiP4rP1hmaVMWybSbcIMI_h30qjqWP21kYRH9ENITTttbf0uZIa8s74jKYxNIdiiDyRaq9WjoPolrHI_ZxcMjp8mmCKX-N-1w
In order to authenticate your application, you need to provide JWT in the "Authorization" header of your request.

User sessions
The following operations can be used to initiate and complete end-user authorization for access to account information. The other operations provide possibility to retrieve session status and other details and to close (delete) a session.

Start user authorization

POST /auth

Start authorization by getting a redirect link and redirecting a PSU to that link

Parameters
Name	In	Type	Required	Description
body	body	StartAuthorizationRequest	true	none
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

POST https://api.enablebanking.com/auth HTTP/1.1
Host: api.enablebanking.com
Content-Type: application/json
Accept: application/json
Authorization: Bearer <JWT>

Request body

{
  "access": {
    "valid_until": "2019-08-24T14:15:22Z"
  },
  "aspsp": {
    "name": "Nordea",
    "country": "FI"
  },
  "state": "3a57e2d3-2e0c-4336-af9b-7fa94f0606a3",
  "redirect_url": "http://example.com",
  "psu_type": "business",
  "auth_method": "methodName",
  "credentials": {
    "userId": "MyUsername"
  },
  "credentials_autosubmit": true,
  "language": "fi",
  "psu_id": "string"
}
Responses
Status	Description	Schema
200	Successful Response	StartAuthorizationResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "url": "https://auth.enablebanking.com/ais/start?sessionid=73100c65-c54d-46a1-87d1-aa3effde435a",
  "authorization_id": "73100c65-c54d-46a1-87d1-aa3effde435a",
  "psu_id_hash": "12427b547618d01d46cabfdd6fd7e832bb42076fb210d40e56783e0d1f4798fd"
}
Authorize user session

POST /sessions

Authorize user session by provided authorization code

Parameters
Name	In	Type	Required	Description
body	body	AuthorizeSessionRequest	true	none
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

POST https://api.enablebanking.com/sessions HTTP/1.1
Host: api.enablebanking.com
Content-Type: application/json
Accept: application/json
Authorization: Bearer <JWT>

Request body

{
  "code": "string"
}
Responses
Status	Description	Schema
200	Successful Response	AuthorizeSessionResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "session_id": "string",
  "accounts": [
    {
      "account_id": {
        "iban": "FI0455231152453547"
      },
      "all_account_ids": [
        {
          "identification": "123456",
          "scheme_name": "BBAN"
        }
      ],
      "account_servicer": {
        "bic_fi": "string",
        "clearing_system_member_id": {
          "clearing_system_id": "NZNCC",
          "member_id": 20368
        },
        "name": "string"
      },
      "name": "string",
      "details": "string",
      "usage": "PRIV",
      "cash_account_type": "CACC",
      "product": "string",
      "currency": "string",
      "psu_status": "string",
      "credit_limit": {
        "currency": "EUR",
        "amount": "1.23"
      },
      "legal_age": true,
      "postal_address": {
        "address_type": "Business",
        "department": "Department of resources",
        "sub_department": "Sub Department of resources",
        "street_name": "Vasavagen",
        "building_number": "4",
        "post_code": "00123",
        "town_name": "Helsinki",
        "country_sub_division": "Uusimaa",
        "country": "FI",
        "address_line": [
          "Mr Asko Teirila PO Box 511",
          "39140 AKDENMAA FINLAND"
        ]
      },
      "uid": "07cc67f4-45d6-494b-adac-09b5cbc7e2b5",
      "identification_hash": "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
      "identification_hashes": [
        "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
        "WwpbCiJhc3BzcF9uYW1lIgpdLApbCiJhc3BzcF9jb3VudHJ5IgpdLApbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoib3RoZXIiLAoic2NoZW1lX25hbWUiCl0sClsKImFjY291bnQiLAoiYWNjb3VudF9pZCIsCiJvdGhlciIsCiJpZGVudGlmaWNhdGlvbiIKXQpd.AOm/TULGPD4a4GdcWhR9xh0GPlPUZuB2O1S9SYFWEz0="
      ]
    }
  ],
  "aspsp": {
    "name": "Nordea",
    "country": "FI"
  },
  "psu_type": "business",
  "access": {
    "valid_until": "2019-08-24T14:15:22Z"
  }
}
Get session data

GET /sessions/{session_id}

Get session data by session ID

Parameters
Name	In	Type	Required	Description
session_id	path	string(uuid)	true	Previously authorized session ID
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

GET https://api.enablebanking.com/sessions/{session_id} HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	GetSessionResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "access": {
    "valid_until": "2020-12-01T12:00:00.000000+00:00"
  },
  "accounts": [
    "497f6eca-6276-4993-bfeb-53cbbbba6f08"
  ],
  "accounts_data": [
    {
      "identification_hash": "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
      "uid": "497f6eca-6276-4993-bfeb-53cbbbba6f08"
    }
  ],
  "aspsp": {
    "country": "FI",
    "name": "Nordea"
  },
  "authorized": "2020-12-01T12:00:00.000000+00:00",
  "created": "2020-12-01T12:00:00.000000+00:00",
  "psu_type": "business",
  "status": "AUTHORIZED"
}
Delete session

DELETE /sessions/{session_id}

Delete session by session ID. PSU's bank consent will be closed automatically if possible

Parameters
Name	In	Type	Required	Description
session_id	path	string(uuid)	true	Previously authorized session ID
Psu-Ip-Address	header	string	false	PSU IP address
Psu-User-Agent	header	string	false	PSU browser User Agent
Psu-Referer	header	string	false	PSU Referer
Psu-Accept	header	string	false	PSU accept header
Psu-Accept-Charset	header	string	false	PSU charset
Psu-Accept-Encoding	header	string	false	PSU accept encoding
Psu-Accept-language	header	string	false	PSU accept language
Psu-Geo-Location	header	string	false	Comma separated latitude and longitude coordinates without spaces
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

DELETE https://api.enablebanking.com/sessions/{session_id} HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Psu-Ip-Address: string
Psu-User-Agent: string
Psu-Referer: string
Psu-Accept: string
Psu-Accept-Charset: string
Psu-Accept-Encoding: string
Psu-Accept-language: string
Psu-Geo-Location: -1.2345,6.789
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	SuccessResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "message": "OK"
}
Accounts data
Get account details

GET /accounts/{account_id}/details

Fetching account details from ASPSP for an account by its ID

Parameters
Name	In	Type	Required	Description
account_id	path	string(uuid)	true	Account ID
Psu-Ip-Address	header	string	false	PSU IP address
Psu-User-Agent	header	string	false	PSU browser User Agent
Psu-Referer	header	string	false	PSU Referer
Psu-Accept	header	string	false	PSU accept header
Psu-Accept-Charset	header	string	false	PSU charset
Psu-Accept-Encoding	header	string	false	PSU accept encoding
Psu-Accept-language	header	string	false	PSU accept language
Psu-Geo-Location	header	string	false	Comma separated latitude and longitude coordinates without spaces
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

GET https://api.enablebanking.com/accounts/{account_id}/details HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Psu-Ip-Address: string
Psu-User-Agent: string
Psu-Referer: string
Psu-Accept: string
Psu-Accept-Charset: string
Psu-Accept-Encoding: string
Psu-Accept-language: string
Psu-Geo-Location: -1.2345,6.789
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	AccountResource
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "account_id": {
    "iban": "FI0455231152453547"
  },
  "all_account_ids": [
    {
      "identification": "123456",
      "scheme_name": "BBAN"
    }
  ],
  "account_servicer": {
    "bic_fi": "string",
    "clearing_system_member_id": {
      "clearing_system_id": "NZNCC",
      "member_id": 20368
    },
    "name": "string"
  },
  "name": "string",
  "details": "string",
  "usage": "PRIV",
  "cash_account_type": "CACC",
  "product": "string",
  "currency": "string",
  "psu_status": "string",
  "credit_limit": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "legal_age": true,
  "postal_address": {
    "address_type": "Business",
    "department": "Department of resources",
    "sub_department": "Sub Department of resources",
    "street_name": "Vasavagen",
    "building_number": "4",
    "post_code": "00123",
    "town_name": "Helsinki",
    "country_sub_division": "Uusimaa",
    "country": "FI",
    "address_line": [
      "Mr Asko Teirila PO Box 511",
      "39140 AKDENMAA FINLAND"
    ]
  },
  "uid": "07cc67f4-45d6-494b-adac-09b5cbc7e2b5",
  "identification_hash": "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
  "identification_hashes": [
    "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
    "WwpbCiJhc3BzcF9uYW1lIgpdLApbCiJhc3BzcF9jb3VudHJ5IgpdLApbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoib3RoZXIiLAoic2NoZW1lX25hbWUiCl0sClsKImFjY291bnQiLAoiYWNjb3VudF9pZCIsCiJvdGhlciIsCiJpZGVudGlmaWNhdGlvbiIKXQpd.AOm/TULGPD4a4GdcWhR9xh0GPlPUZuB2O1S9SYFWEz0="
  ]
}
Get account balances

GET /accounts/{account_id}/balances

Fetching account balances from ASPSP for an account by its ID

Parameters
Name	In	Type	Required	Description
account_id	path	string(uuid)	true	PSU account ID accessible in the provided session
Psu-Ip-Address	header	string	false	PSU IP address
Psu-User-Agent	header	string	false	PSU browser User Agent
Psu-Referer	header	string	false	PSU Referer
Psu-Accept	header	string	false	PSU accept header
Psu-Accept-Charset	header	string	false	PSU charset
Psu-Accept-Encoding	header	string	false	PSU accept encoding
Psu-Accept-language	header	string	false	PSU accept language
Psu-Geo-Location	header	string	false	Comma separated latitude and longitude coordinates without spaces
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

GET https://api.enablebanking.com/accounts/{account_id}/balances HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Psu-Ip-Address: string
Psu-User-Agent: string
Psu-Referer: string
Psu-Accept: string
Psu-Accept-Charset: string
Psu-Accept-Encoding: string
Psu-Accept-language: string
Psu-Geo-Location: -1.2345,6.789
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	HalBalances
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "balances": [
    {
      "name": "Booked balance",
      "balance_amount": {
        "currency": "EUR",
        "amount": "1.23"
      },
      "balance_type": "CLAV",
      "last_change_date_time": "2019-08-24T14:15:22Z",
      "reference_date": "2019-08-24",
      "last_committed_transaction": "4604aa90f8a8418092d80c3270846f0a"
    }
  ]
}
Get account transactions

GET /accounts/{account_id}/transactions

Fetching account transactions from ASPSP for an account by its ID

Parameters
Name	In	Type	Required	Description
account_id	path	string(uuid)	true	PSU account ID accessible in the provided session
date_from	query	string(date)	false	Date to fetch transactions from (including the date, UTC timezone is assumed)
date_to	query	string(date)	false	Date to fetch transactions to (including the date, UTC timezone is assumed)
continuation_key	query	string	false	Key, allowing iterate over multiple API pages of transactions
transaction_status	query	TransactionStatus	false	Filter transactions by provided status
strategy	query	TransactionsFetchStrategy	false	Strategy how transaction are fetched
Psu-Ip-Address	header	string	false	PSU IP address
Psu-User-Agent	header	string	false	PSU browser User Agent
Psu-Referer	header	string	false	PSU Referer
Psu-Accept	header	string	false	PSU accept header
Psu-Accept-Charset	header	string	false	PSU charset
Psu-Accept-Encoding	header	string	false	PSU accept encoding
Psu-Accept-language	header	string	false	PSU accept language
Psu-Geo-Location	header	string	false	Comma separated latitude and longitude coordinates without spaces
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

GET https://api.enablebanking.com/accounts/{account_id}/transactions HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Psu-Ip-Address: string
Psu-User-Agent: string
Psu-Referer: string
Psu-Accept: string
Psu-Accept-Charset: string
Psu-Accept-Encoding: string
Psu-Accept-language: string
Psu-Geo-Location: -1.2345,6.789
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	HalTransactions
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "transactions": [
    {
      "entry_reference": "5561990681",
      "merchant_category_code": "5511",
      "transaction_amount": {
        "currency": "EUR",
        "amount": "1.23"
      },
      "creditor": {
        "name": "MyPreferredAisp",
        "postal_address": {
          "address_line": [
            "Mr Asko Teirila PO Box 511",
            "39140 AKDENMAA FINLAND"
          ],
          "address_type": "Business",
          "building_number": "4",
          "country": "FI",
          "country_sub_division": "Uusimaa",
          "department": "Department of resources",
          "post_code": "00123",
          "street_name": "Vasavagen",
          "sub_department": "Sub Department of resources",
          "town_name": "Helsinki"
        }
      },
      "creditor_account": {
        "iban": "FI0455231152453547"
      },
      "creditor_agent": {
        "bic_fi": "string",
        "clearing_system_member_id": {
          "clearing_system_id": "NZNCC",
          "member_id": 20368
        },
        "name": "string"
      },
      "debtor": {
        "name": "MyPreferredAisp",
        "postal_address": {
          "address_line": [
            "Mr Asko Teirila PO Box 511",
            "39140 AKDENMAA FINLAND"
          ],
          "address_type": "Business",
          "building_number": "4",
          "country": "FI",
          "country_sub_division": "Uusimaa",
          "department": "Department of resources",
          "post_code": "00123",
          "street_name": "Vasavagen",
          "sub_department": "Sub Department of resources",
          "town_name": "Helsinki"
        }
      },
      "debtor_account": {
        "iban": "FI0455231152453547"
      },
      "debtor_agent": {
        "bic_fi": "string",
        "clearing_system_member_id": {
          "clearing_system_id": "NZNCC",
          "member_id": 20368
        },
        "name": "string"
      },
      "bank_transaction_code": {
        "description": "Utlandsbetalning",
        "code": "12",
        "sub_code": "32"
      },
      "credit_debit_indicator": "CRDT",
      "status": "BOOK",
      "booking_date": "2020-01-03",
      "value_date": "2020-01-02",
      "transaction_date": "2020-01-01",
      "balance_after_transaction": {
        "currency": "EUR",
        "amount": "1.23"
      },
      "reference_number": "RF07850352502356628678117",
      "reference_number_schema": "SEBG",
      "remittance_information": [
        "RF07850352502356628678117",
        "Gift for Alex"
      ],
      "debtor_account_additional_identification": {
        "identification": "12345678",
        "scheme_name": "CPAN"
      },
      "creditor_account_additional_identification": {
        "identification": "12345678",
        "scheme_name": "BBAN"
      },
      "exchange_rate": {
        "unit_currency": "EUR",
        "exchange_rate": "string",
        "rate_type": "SPOT",
        "contract_identification": "string",
        "instructed_amount": {
          "currency": "EUR",
          "amount": "1.23"
        }
      },
      "note": "string",
      "transaction_id": "string"
    }
  ],
  "continuation_key": "string"
}
Get transaction details

GET /accounts/{account_id}/transactions/{transaction_id}

Fetching transaction details from ASPSP for an account transaction by its ID

Parameters
Name	In	Type	Required	Description
account_id	path	string(uuid)	true	Account ID
transaction_id	path	string	true	Transaction ID
Psu-Ip-Address	header	string	false	PSU IP address
Psu-User-Agent	header	string	false	PSU browser User Agent
Psu-Referer	header	string	false	PSU Referer
Psu-Accept	header	string	false	PSU accept header
Psu-Accept-Charset	header	string	false	PSU charset
Psu-Accept-Encoding	header	string	false	PSU accept encoding
Psu-Accept-language	header	string	false	PSU accept language
Psu-Geo-Location	header	string	false	Comma separated latitude and longitude coordinates without spaces
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

GET https://api.enablebanking.com/accounts/{account_id}/transactions/{transaction_id} HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Psu-Ip-Address: string
Psu-User-Agent: string
Psu-Referer: string
Psu-Accept: string
Psu-Accept-Charset: string
Psu-Accept-Encoding: string
Psu-Accept-language: string
Psu-Geo-Location: -1.2345,6.789
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	Transaction
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "entry_reference": "5561990681",
  "merchant_category_code": "5511",
  "transaction_amount": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "creditor": {
    "name": "MyPreferredAisp",
    "postal_address": {
      "address_line": [
        "Mr Asko Teirila PO Box 511",
        "39140 AKDENMAA FINLAND"
      ],
      "address_type": "Business",
      "building_number": "4",
      "country": "FI",
      "country_sub_division": "Uusimaa",
      "department": "Department of resources",
      "post_code": "00123",
      "street_name": "Vasavagen",
      "sub_department": "Sub Department of resources",
      "town_name": "Helsinki"
    }
  },
  "creditor_account": {
    "iban": "FI0455231152453547"
  },
  "creditor_agent": {
    "bic_fi": "string",
    "clearing_system_member_id": {
      "clearing_system_id": "NZNCC",
      "member_id": 20368
    },
    "name": "string"
  },
  "debtor": {
    "name": "MyPreferredAisp",
    "postal_address": {
      "address_line": [
        "Mr Asko Teirila PO Box 511",
        "39140 AKDENMAA FINLAND"
      ],
      "address_type": "Business",
      "building_number": "4",
      "country": "FI",
      "country_sub_division": "Uusimaa",
      "department": "Department of resources",
      "post_code": "00123",
      "street_name": "Vasavagen",
      "sub_department": "Sub Department of resources",
      "town_name": "Helsinki"
    }
  },
  "debtor_account": {
    "iban": "FI0455231152453547"
  },
  "debtor_agent": {
    "bic_fi": "string",
    "clearing_system_member_id": {
      "clearing_system_id": "NZNCC",
      "member_id": 20368
    },
    "name": "string"
  },
  "bank_transaction_code": {
    "description": "Utlandsbetalning",
    "code": "12",
    "sub_code": "32"
  },
  "credit_debit_indicator": "CRDT",
  "status": "BOOK",
  "booking_date": "2020-01-03",
  "value_date": "2020-01-02",
  "transaction_date": "2020-01-01",
  "balance_after_transaction": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "reference_number": "RF07850352502356628678117",
  "reference_number_schema": "SEBG",
  "remittance_information": [
    "RF07850352502356628678117",
    "Gift for Alex"
  ],
  "debtor_account_additional_identification": {
    "identification": "12345678",
    "scheme_name": "CPAN"
  },
  "creditor_account_additional_identification": {
    "identification": "12345678",
    "scheme_name": "BBAN"
  },
  "exchange_rate": {
    "unit_currency": "EUR",
    "exchange_rate": "string",
    "rate_type": "SPOT",
    "contract_identification": "string",
    "instructed_amount": {
      "currency": "EUR",
      "amount": "1.23"
    }
  },
  "note": "string",
  "transaction_id": "string"
}
Payments
The following operations can be used to initiate a payment and get its status indicating whether the payment was executed, cancelled or rejected.

Please note that in the PRODUCTION environment payment initiation functionality is only available to companies holding a PISP license. To enable payment initiation functionality for your application, please get in touch with us at support.api@enablebanking.com.

In the SANDBOX enviroment payment initiation functionality is automatically enabled for all newly registered applications.

If you are using "on-premise" version on the payment initiation service please consult with this page (opens new window).

Create payment

POST /payments

Creating a payment consisting of one or multiple payment transactions

Parameters
Name	In	Type	Required	Description
body	body	CreatePaymentRequest	true	none
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

POST https://api.enablebanking.com/payments HTTP/1.1
Host: api.enablebanking.com
Content-Type: application/json
Accept: application/json
Authorization: Bearer <JWT>

Request body

{
  "aspsp": {
    "country": "FI",
    "name": "S-Pankki"
  },
  "payment_request": {
    "credit_transfer_transaction": [
      {
        "beneficiary": {
          "creditor": {
            "name": "Organisation/Person Name"
          },
          "creditor_account": {
            "identification": "FI0455231152453547",
            "scheme_name": "IBAN"
          }
        },
        "instructed_amount": {
          "amount": "10.33",
          "currency": "EUR"
        }
      }
    ]
  },
  "payment_type": "SEPA",
  "psu_type": "personal",
  "redirect_url": "https://google.com/",
  "state": "b463a960-9616-4df6-909f-f80884190c22"
}
Responses
Status	Description	Schema
200	Successful Response	CreatePaymentResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "payment_id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "psu_id_hash": "12427b547618d01d46cabfdd6fd7e832bb42076fb210d40e56783e0d1f4798fd",
  "status": "RCVD",
  "url": "https://auth.enablebanking.com/pis/start?payment_id=497f6eca-6276-4993-bfeb-53cbbbba6f08"
}
Get payment

GET /payments/{payment_id}

Fetching payment status and details

Parameters
Name	In	Type	Required	Description
payment_id	path	string	true	Payment ID
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

GET https://api.enablebanking.com/payments/{payment_id} HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	GetPaymentResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "payment_id": "d43b87f9-9e28-4802-8eaa-6ee91a40ea71",
  "status": "ACCC",
  "payment_details": {
    "credit_transfer_transaction": [
      {
        "beneficiary": {
          "creditor": {
            "name": "Organisation/Person Name"
          },
          "creditor_account": {
            "identification": "FI0455231152453547",
            "scheme_name": "IBAN"
          }
        },
        "instructed_amount": {
          "amount": "10.33",
          "currency": "EUR"
        }
      }
    ],
    "debtor_account": {
      "identification": "FI7727551317119265",
      "scheme_name": "IBAN"
    }
  },
  "payment_type": "SEPA",
  "aspsp": {
    "name": "Nordea",
    "country": "FI"
  },
  "final_status": true,
  "status_reason_information": {
    "status_reason_code": "string",
    "status_reason_description": "string"
  },
  "psu_id_hash": "12427b547618d01d46cabfdd6fd7e832bb42076fb210d40e56783e0d1f4798fd"
}
Delete payment

DELETE /payments/{payment_id}

Delete finished or failed payment

Parameters
Name	In	Type	Required	Description
payment_id	path	string	true	Payment ID
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

DELETE https://api.enablebanking.com/payments/{payment_id} HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	SuccessResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "message": "OK"
}
Submit payment for execution

POST /payments/{payment_id}/submit

Explicitly submit a payment for execution. The payment must have been created with defer_submission=true, be in authorized state (PSU has completed authorization at the ASPSP), and not yet submitted for execution.

Parameters
Name	In	Type	Required	Description
payment_id	path	string	true	Payment ID
body	body	object	false	none
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

POST https://api.enablebanking.com/payments/{payment_id}/submit HTTP/1.1
Host: api.enablebanking.com
Content-Type: application/json
Accept: application/json
Authorization: Bearer <JWT>

Request body

{}
Responses
Status	Description	Schema
200	Successful Response	SubmitPaymentResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "payment_id": "d43b87f9-9e28-4802-8eaa-6ee91a40ea71",
  "status": "ACCC",
  "final_status": true,
  "status_reason_information": {
    "status_reason_code": "string",
    "status_reason_description": "string"
  }
}
Get payment transaction

GET /payments/{payment_id}/transactions/{transaction_id}

Fetching transaction details for a single transaction within a bulk payment

Parameters
Name	In	Type	Required	Description
payment_id	path	string	true	Payment ID
transaction_id	path	string	true	Transaction ID
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

GET https://api.enablebanking.com/payments/{payment_id}/transactions/{transaction_id} HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	GetPaymentTransactionResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "payment_id": "d43b87f9-9e28-4802-8eaa-6ee91a40ea71",
  "transaction_details": {
    "instructed_amount": {
      "currency": "EUR",
      "amount": "1.23"
    },
    "beneficiary": {
      "creditor": {
        "name": "Organisation/Person Name"
      },
      "creditor_account": {
        "identification": "FI0455231152453547",
        "scheme_name": "IBAN"
      }
    },
    "payment_id": {
      "instruction_id": "string",
      "end_to_end_id": "string"
    },
    "requested_execution_date": "2019-08-24",
    "reference_number": "string",
    "end_date": "2019-08-24",
    "execution_rule": "FWNG",
    "frequency": "DAIL",
    "ultimate_debtor": {
      "name": "MyPreferredAisp",
      "postal_address": {
        "address_line": [
          "Mr Asko Teirila PO Box 511",
          "39140 AKDENMAA FINLAND"
        ],
        "address_type": "Business",
        "building_number": "4",
        "country": "FI",
        "country_sub_division": "Uusimaa",
        "department": "Department of resources",
        "post_code": "00123",
        "street_name": "Vasavagen",
        "sub_department": "Sub Department of resources",
        "town_name": "Helsinki"
      }
    },
    "ultimate_creditor": {
      "name": "MyPreferredAisp",
      "postal_address": {
        "address_line": [
          "Mr Asko Teirila PO Box 511",
          "39140 AKDENMAA FINLAND"
        ],
        "address_type": "Business",
        "building_number": "4",
        "country": "FI",
        "country_sub_division": "Uusimaa",
        "department": "Department of resources",
        "post_code": "00123",
        "street_name": "Vasavagen",
        "sub_department": "Sub Department of resources",
        "town_name": "Helsinki"
      }
    },
    "regulatory_reporting": [
      {
        "authority": {
          "country": "string",
          "name": "string"
        },
        "details": {
          "amount": {
            "currency": "EUR",
            "amount": "1.23"
          },
          "code": "string",
          "information": "string"
        }
      }
    ],
    "remittance_information": [
      "string"
    ],
    "transaction_id": "string",
    "transaction_status": "ACCC"
  }
}
Misc
Operations in this section are auxiliary. One provides the possibility to retrieve a list of ASPSPs (i.e. banks and similar institutions), which are available for retrieval of account information and initiation of payments. The other provides details of the API client application making corresponding request.

Get list of ASPSPs

GET /aspsps

Get list of ASPSPs with their meta information

Parameters
Name	In	Type	Required	Description
country	query	string	false	Display only ASPSPs from specified country
psu_type	query	PSUType	false	Display only ASPSPs which support specified psu type
service	query	Service	false	Display only ASPSPs which support specified service
payment_type	query	PaymentType	false	Display only ASPSPs which support specified payment type
Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

GET https://api.enablebanking.com/aspsps HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	GetAspspsResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "aspsps": [
    {
      "auth_methods": [
        {
          "approach": "REDIRECT",
          "credentials": [
            {
              "description": "Business identity code (Y-tunnus) in 1234567-8 format",
              "name": "companyId",
              "required": true,
              "template": "^\\d{7}-\\d$",
              "title": "Company ID"
            }
          ],
          "hidden_method": false,
          "name": "MTA",
          "psu_type": "business"
        }
      ],
      "beta": false,
      "bic": "NDEAFIHH",
      "country": "FI",
      "logo": "https://enablebanking.com/brands/FI/Nordea/",
      "maximum_consent_validity": 15552000,
      "name": "Nordea",
      "payments": [
        {
          "allowed_auth_methods": [
            "MTA"
          ],
          "charge_bearer_values": [
            "SLEV"
          ],
          "creditor_account_schemas": [
            "IBAN"
          ],
          "creditor_agent_bic_fi_required": false,
          "creditor_agent_clearing_system_member_id_required": false,
          "creditor_country_required": false,
          "creditor_name_required": false,
          "creditor_postal_address_required": false,
          "currencies": [
            "EUR"
          ],
          "debtor_account_required": true,
          "debtor_account_schemas": [
            "IBAN"
          ],
          "debtor_contact_email_required": false,
          "debtor_contact_phone_required": false,
          "debtor_currency_required": false,
          "max_transactions": 1,
          "payment_type": "SEPA",
          "priority_codes": [
            "NORM"
          ],
          "psu_type": "business",
          "reference_number_schemas": [
            "FIRF",
            "INTL"
          ],
          "reference_number_supported": true,
          "regulatory_reporting_code_required": false,
          "remittance_information_lines": [
            {
              "max_length": 140,
              "min_length": 1,
              "pattern": "^.{1,140}$"
            }
          ],
          "remittance_information_required": true,
          "requested_execution_date_max_period": 365,
          "requested_execution_date_supported": true
        }
      ],
      "psu_types": [
        "business"
      ],
      "required_psu_headers": [
        "Psu-Ip-Address"
      ]
    }
  ]
}
Get application

GET /application

Get application associated with provided JWT key ID

Authentication

To perform this operation, API requests must include Authorization header containing JWT calculated using private RSA key of the client application making the request. See jwtAuthentication.

Example request

GET https://api.enablebanking.com/application HTTP/1.1
Host: api.enablebanking.com
Accept: application/json
Authorization: Bearer <JWT>

Responses
Status	Description	Schema
200	Successful Response	GetApplicationResponse
400	Bad Request	ErrorResponse
401	Unauthorized	ErrorResponse
403	Forbidden	ErrorResponse
404	Not Found	ErrorResponse
408	Request Timeout	ErrorResponse
422	Unprocessable Entity	ErrorResponse
429	Too Many Requests	ErrorResponse
500	Internal Server Error	ErrorResponse
Example responses

200 Response

{
  "name": "string",
  "description": "string",
  "kid": "string",
  "environment": "SANDBOX",
  "redirect_urls": [
    "http://example.com"
  ],
  "active": true,
  "countries": [
    "string"
  ],
  "services": [
    "AIS"
  ]
}
Schemas
ASPSP

Properties
Name	Type	Required	Description
name	string	true	Name of the ASPSP (i.e. a bank or a similar financial institution)
country	string	true	Two-letter ISO 3166 code of the country, in which ASPSP operates
{
  "name": "Nordea",
  "country": "FI"
}

ASPSPData

Properties
Name	Type	Required	Description
name	string	true	Name of the ASPSP (i.e. a bank or a similar financial institution)
country	string	true	Two-letter ISO 3166 code of the country, in which ASPSP operates
logo	string(uri)	true	ASPSP logo URL. It is possible to transform (e.g. resize) the logo by adding special suffixes at the end of the URL. For example, -/resize/500x/. For full list of possible transformations, please refer to https://uploadcare.com/docs/transformations/image/
psu_types	[PSUType]	true	List of PSU types supported by ASPSP
auth_methods	[AuthMethod]	true	List of available authentication methods. Provided in case multiple methods are available or it is possible to supply authentication credentials while initiating authorization.
maximum_consent_validity	integer	true	Maximum consent validity which bank supports in seconds
sandbox	SandboxInfo	false	Applicable only to sandbox environment. Additional information necessary to use sandbox environment.
beta	boolean	true	Flag showing whether implementation is in beta mode
bic	string	false	BIC of the ASPSP
required_psu_headers	[string]	false	List of the headers required to indicate to data retrieval endpoints that PSU is online. Either all required PSU headers or none of PSU headers are to be provided, otherwise PSU_HEADER_NOT_PROVIDED error will be returned.
payments	[ResponsePaymentType]	false	Supported payment types by country and their properties
group	ASPSPGroup	false	Group, which the ASPSP belongs to
{
  "auth_methods": [
    {
      "approach": "REDIRECT",
      "credentials": [
        {
          "description": "Business identity code (Y-tunnus) in 1234567-8 format",
          "name": "companyId",
          "required": true,
          "template": "^\\d{7}-\\d$",
          "title": "Company ID"
        }
      ],
      "hidden_method": false,
      "name": "MTA",
      "psu_type": "business"
    }
  ],
  "beta": false,
  "bic": "NDEAFIHH",
  "country": "FI",
  "logo": "https://enablebanking.com/brands/FI/Nordea/",
  "maximum_consent_validity": 15552000,
  "name": "Nordea",
  "payments": [
    {
      "allowed_auth_methods": [
        "MTA"
      ],
      "charge_bearer_values": [
        "SLEV"
      ],
      "creditor_account_schemas": [
        "IBAN"
      ],
      "creditor_agent_bic_fi_required": false,
      "creditor_agent_clearing_system_member_id_required": false,
      "creditor_country_required": false,
      "creditor_name_required": false,
      "creditor_postal_address_required": false,
      "currencies": [
        "EUR"
      ],
      "debtor_account_required": true,
      "debtor_account_schemas": [
        "IBAN"
      ],
      "debtor_contact_email_required": false,
      "debtor_contact_phone_required": false,
      "debtor_currency_required": false,
      "max_transactions": 1,
      "payment_type": "SEPA",
      "priority_codes": [
        "NORM"
      ],
      "psu_type": "business",
      "reference_number_schemas": [
        "FIRF",
        "INTL"
      ],
      "reference_number_supported": true,
      "regulatory_reporting_code_required": false,
      "remittance_information_lines": [
        {
          "max_length": 140,
          "min_length": 1,
          "pattern": "^.{1,140}$"
        }
      ],
      "remittance_information_required": true,
      "requested_execution_date_max_period": 365,
      "requested_execution_date_supported": true
    }
  ],
  "psu_types": [
    "business"
  ],
  "required_psu_headers": [
    "Psu-Ip-Address"
  ]
}

ASPSPGroup

Properties
Name	Type	Required	Description
name	string	true	Name of the group, which the ASPSP belongs to
logo	string(uri)	true	URL of the logo for the group to which the ASPSP belongs. This URL supports the same transformation postfixes as ASPSP logo URLs.
{
  "name": "Volksbanken Raiffeisenbanken",
  "logo": "https://enablebanking.com/brands/DE/Volksbanken%20Raiffeisenbanken/"
}

Access

Properties
Name	Type	Required	Description
accounts	[AccountIdentification]	false	List of accounts access to which is requested. If not set behaviour depends on the
bank: some banks allow users to choose list of accessible accounts through their
access consent UI, while other may provide access to all accounts or just access to
the list of accounts.
balances	boolean	false	Request consent with balances access
transactions	boolean	false	Request consent with transactions access
valid_until	string(date-time)	true	This parameter specifies the date and time until which the authorised session
remains valid. The value must be in the RFC3339 date-time format with a timezone
offset, e.g. 2025-12-01T12:00:00.000000+00:00. The provided value cannot exceed
the date and time, calculated as "now" + maximum_consent_validity (provided in
seconds for each ASPSP in response to the GET /aspsps request). The provided value
is subject to adjustment to comply with the ASPSP's requirements. Specifically, if
the provided value is less than the minimum consent validity allowed by the ASPSP
(e.g., some ASPSPs require a minimum of 1 hour or 1 day), the consent validity will
be adjusted to meet these requirements. However, the session validity will remain
exactly as specified. This means that even if the consent remains valid on the
ASPSP's side, the session will expire based on the initially provided value.
{
  "valid_until": "2019-08-24T14:15:22Z"
}

AccountIdentification

Properties
Name	Type	Required	Description
iban	string	false	International Bank Account Number (IBAN) - identification used internationally by financial institutions to uniquely identify the account of a customer. Further specifications of the format and content of the IBAN can be found in the standard ISO 13616 "Banking and related financial services - International Bank Account Number (IBAN)" version 1997-10-01, or later revisions.
other	GenericIdentification	false	Other identification if iban is not provided
{
  "iban": "FI0455231152453547"
}

AccountResource

Properties
Name	Type	Required	Description
account_id	AccountIdentification	false	Primary account identifier
all_account_ids	[GenericIdentification]	false	All account identifiers provided by ASPSPs (including primary identifier available in the accountId field)
account_servicer	FinancialInstitutionIdentification	false	Information about the financial institution servicing the account
name	string	false	Account holder(s) name
details	string	false	Account description set by PSU or provided by ASPSP
usage	Usage	false	Specifies the usage of the account
cash_account_type	CashAccountType	true	Specifies the type of the account
product	string	false	Product Name of the Bank for this account, proprietary definition
currency	string	true	Specifies the currency of the account
psu_status	string	false	Relationship between the PSU and the account - Account Holder - Co-account Holder - Attorney
credit_limit	AmountType	false	Specifies the maximum credit or overdraft allowed on the account
legal_age	boolean	false	Specifies whether Enable Banking is confident that the account holder is of legal age or is a minor. The field takes the following values:
true if the account holder is of legal age;
false if the account holder is a minor;
null (or the field is not set) if it is not possible to determine whether the account holder is of legal age or a minor or if the legal age check is not applicable (in cases such as if the account holder is a legal entity or there are multiple account co-holders)
postal_address	PostalAddress	false	Postal address of the account holder
uid	string(uuid)	false	Unique account identificator used for fetching account balances and transactions. It is valid only until the session to which the account belongs is in the AUTHORIZED status. It can be not set in case it is know that it is not possible to fetch balances and transactions for the account (for example, in case the account is blocked or closed at the ASPSP side).
identification_hash	string	true	Primary account identification hash. It can be used for matching accounts between multiple sessions (even in case the sessions are authorized by different PSUs).
identification_hashes	[string]	true	List of possible account identification hashes. Identification hash is based on the account number. Some accounts may have multiple account numbers (e.g. IBAN and BBAN). This field contains all possible hashes. Not all of these hashes can be used to uniquely identify an account and that the primary goal of them is to be able to fuzzy matching of accounts by certain properties. Primary hash is included in this list.
{
  "account_id": {
    "iban": "FI0455231152453547"
  },
  "all_account_ids": [
    {
      "identification": "123456",
      "scheme_name": "BBAN"
    }
  ],
  "account_servicer": {
    "bic_fi": "string",
    "clearing_system_member_id": {
      "clearing_system_id": "NZNCC",
      "member_id": 20368
    },
    "name": "string"
  },
  "name": "string",
  "details": "string",
  "usage": "PRIV",
  "cash_account_type": "CACC",
  "product": "string",
  "currency": "string",
  "psu_status": "string",
  "credit_limit": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "legal_age": true,
  "postal_address": {
    "address_type": "Business",
    "department": "Department of resources",
    "sub_department": "Sub Department of resources",
    "street_name": "Vasavagen",
    "building_number": "4",
    "post_code": "00123",
    "town_name": "Helsinki",
    "country_sub_division": "Uusimaa",
    "country": "FI",
    "address_line": [
      "Mr Asko Teirila PO Box 511",
      "39140 AKDENMAA FINLAND"
    ]
  },
  "uid": "07cc67f4-45d6-494b-adac-09b5cbc7e2b5",
  "identification_hash": "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
  "identification_hashes": [
    "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
    "WwpbCiJhc3BzcF9uYW1lIgpdLApbCiJhc3BzcF9jb3VudHJ5IgpdLApbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoib3RoZXIiLAoic2NoZW1lX25hbWUiCl0sClsKImFjY291bnQiLAoiYWNjb3VudF9pZCIsCiJvdGhlciIsCiJpZGVudGlmaWNhdGlvbiIKXQpd.AOm/TULGPD4a4GdcWhR9xh0GPlPUZuB2O1S9SYFWEz0="
  ]
}

AddressType

Enumerated Values
Value	Description
Business	Business address
Correspondence	Correspondence address
DeliveryTo	Delivery address
MailTo	Mail to address
POBox	PO Box address
Postal	Postal address
Residential	Residential address
Statement	Statement address
"Business"

AmountType

Properties
Name	Type	Required	Description
currency	string	true	ISO 4217 code of the currency of the amount
amount	string	true	Numerical value or monetary figure associated with a particular transaction, representing balance on an account, a fee or similar. Represented as a decimal number, using . (dot) as a decimal separator. Allowed precision (number of digits after the decimal separator) varies depending on the currency and is validated differently depending on the context.
{
  "currency": "EUR",
  "amount": "1.23"
}

AuthMethod

Properties
Name	Type	Required	Description
name	string	false	Internal name of the authentication method
title	string	false	Human-readable title of the authentication method
psu_type	PSUType	true	PSU type to which the authentication method is applicable
credentials	[Credential]	false	List of credentials which are possible to supply while initiating authorization
approach	AuthenticationApproach	true	Authentication approach used in the current authentication method
hidden_method	boolean	true	Flag showing whether the current authentication method is hidden from the user. If true then the user will not be able to select this authentication method. It is only possible to select this authentication method via API.
{
  "name": "string",
  "title": "string",
  "psu_type": "business",
  "credentials": [
    {
      "name": "userId",
      "title": "User ID",
      "required": true,
      "description": "Your identifier used for logging in to online banking",
      "template": "^\\d{8}$"
    }
  ],
  "approach": "REDIRECT",
  "hidden_method": true
}

AuthenticationApproach

Enumerated Values
Value	Description
DECOUPLED	The TPP identifies the PSU and forwards the identification to the ASPSP which processes the authentication through a decoupled device
EMBEDDED	The TPP identifies the PSU and forwards the identification to the ASPSP which starts the authentication. The TPP forwards one authentication factor of the PSU (e.g. OTP or response to a challenge)
REDIRECT	The PSU is redirected by the TPP to the ASPSP which processes identification and authentication
"DECOUPLED"

AuthorizeSessionRequest

Properties
Name	Type	Required	Description
code	string	true	Authorization code returned when redirecting PSU
{
  "code": "string"
}

AuthorizeSessionResponse

Properties
Name	Type	Required	Description
session_id	string(uuid4)	true	ID of the PSU session
accounts	[AccountResource]	true	List of authorized accounts
aspsp	ASPSP	true	ASPSP used with the session
psu_type	PSUType	true	PSU type used with the session
access	Access	true	Scope of access requested from ASPSP and confirmed by PSU
{
  "session_id": "string",
  "accounts": [
    {
      "account_id": {
        "iban": "FI0455231152453547"
      },
      "all_account_ids": [
        {
          "identification": "123456",
          "scheme_name": "BBAN"
        }
      ],
      "account_servicer": {
        "bic_fi": "string",
        "clearing_system_member_id": {
          "clearing_system_id": "NZNCC",
          "member_id": 20368
        },
        "name": "string"
      },
      "name": "string",
      "details": "string",
      "usage": "PRIV",
      "cash_account_type": "CACC",
      "product": "string",
      "currency": "string",
      "psu_status": "string",
      "credit_limit": {
        "currency": "EUR",
        "amount": "1.23"
      },
      "legal_age": true,
      "postal_address": {
        "address_type": "Business",
        "department": "Department of resources",
        "sub_department": "Sub Department of resources",
        "street_name": "Vasavagen",
        "building_number": "4",
        "post_code": "00123",
        "town_name": "Helsinki",
        "country_sub_division": "Uusimaa",
        "country": "FI",
        "address_line": [
          "Mr Asko Teirila PO Box 511",
          "39140 AKDENMAA FINLAND"
        ]
      },
      "uid": "07cc67f4-45d6-494b-adac-09b5cbc7e2b5",
      "identification_hash": "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
      "identification_hashes": [
        "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
        "WwpbCiJhc3BzcF9uYW1lIgpdLApbCiJhc3BzcF9jb3VudHJ5IgpdLApbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoib3RoZXIiLAoic2NoZW1lX25hbWUiCl0sClsKImFjY291bnQiLAoiYWNjb3VudF9pZCIsCiJvdGhlciIsCiJpZGVudGlmaWNhdGlvbiIKXQpd.AOm/TULGPD4a4GdcWhR9xh0GPlPUZuB2O1S9SYFWEz0="
      ]
    }
  ],
  "aspsp": {
    "name": "Nordea",
    "country": "FI"
  },
  "psu_type": "business",
  "access": {
    "valid_until": "2019-08-24T14:15:22Z"
  }
}

BalanceResource

Properties
Name	Type	Required	Description
name	string	true	Label of the balance
balance_amount	AmountType	true	Structure aiming to embed the amount and the currency to be used
balance_type	BalanceStatus	true	Available balance type values
last_change_date_time	string(date-time)	false	Timestamp of the last change of the balance amount
reference_date	string(date)	false	Reference date for the balance
last_committed_transaction	string	false	Entry reference of the last transaction contributing to the balance value
{
  "name": "Booked balance",
  "balance_amount": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "balance_type": "CLAV",
  "last_change_date_time": "2019-08-24T14:15:22Z",
  "reference_date": "2019-08-24",
  "last_committed_transaction": "4604aa90f8a8418092d80c3270846f0a"
}

BalanceStatus

Enumerated Values
Value	Description
CLAV	(ISO20022 Closing Available) Closing available balance
CLBD	(ISO20022 ClosingBooked) Accounting Balance
FWAV	(ISO20022 ForwardAvailable) Balance that is at the disposal of account holders on the date specified
INFO	(ISO20022 Information) Balance for informational purposes
ITAV	(ISO20022 InterimAvailable) Available balance calculated in the course of the day
ITBD	(ISO20022 InterimBooked) Booked balance calculated in the course of the day
OPAV	(ISO20022 OpeningAvailable) Opening balance that is at the disposal of account holders at the beginning of the date specified
OPBD	(ISO20022 OpeningBooked) Book balance of the account at the beginning of the account reporting period. It always equals the closing book balance from the previous report
OTHR	Other Balance
PRCD	(ISO20022 PreviouslyClosedBooked) Balance of the account at the end of the previous reporting period
VALU	Value-date balance
XPCD	(ISO20022 Expected) Instant Balance
"CLAV"

BankTransactionCode

Properties
Name	Type	Required	Description
description	string	false	Arbitrary transaction categorization description
code	string	false	Specifies the family of a transaction within the domain
sub_code	string	false	Specifies the sub-product family of a transaction within a specific family
{
  "description": "Utlandsbetalning",
  "code": "12",
  "sub_code": "32"
}

Beneficiary

Properties
Name	Type	Required	Description
creditor_agent	FinancialInstitutionIdentification	false	Identification of the financial institution where the account receiving funds is held
creditor	PartyIdentification	false	Identification of the party receiving funds
creditor_account	GenericIdentification	true	Identification of the account receiving funds
creditor_currency	string	false	ISO 4217 currency code, in which the account receiving funds is held
{
  "creditor": {
    "name": "Organisation/Person Name"
  },
  "creditor_account": {
    "identification": "FI0455231152453547",
    "scheme_name": "IBAN"
  }
}

CashAccountType

Enumerated Values
Value	Description
CACC	Account used to post debits and credits when no specific account has been nominated
CARD	Account used for card payments only
CASH	Account used for the payment of cash
LOAN	Account used for loans
OTHR	Account not otherwise specified
SVGS	Account used for savings
"CACC"

CategoryPurposeCode

Enumerated Values
Value	Description
BONU	Bonus Payment: Transaction is the payment of a bonus
CASH	Cash Management Transfer: Transaction is a general cash management instruction
CBLK	Card Bulk Clearing: A Service that is settling money for a bulk of card transactions, while referring to a specific transaction file or other information like terminal ID, card acceptor ID or other transaction details
CCRD	Credit Card Payment: Transaction is related to a payment of credit card
CORT	Trade Settlement Payment: Transaction is related to settlement of a trade, eg a foreign exchange deal or a securities transaction
DCRD	Debit Card Payment: Transaction is related to a payment of debit card
DIVI	Dividend: Transaction is the payment of dividends
DVPM	Deliver Against Payment: Code used to pre-advise the account servicer of a forthcoming deliver against payment instruction
EPAY	Epayment: Transaction is related to ePayment
FCOL	Fee Collection: A Service that is settling card transaction related fees between two parties
GOVT	Government Payment: Transaction is a payment to or from a government department
HEDG	Hedging: Transaction is related to the payment of a hedging operation
ICCP	Irrevocable Credit Card Payment: Transaction is reimbursement of credit card payment
IDCP	Irrevocable Debit Card Payment: Transaction is reimbursement of debit card payment
INTC	Intra Company Payment: Transaction is an intra-company payment, ie, a payment between two companies belonging to the same group
INTE	Interest: Transaction is the payment of interest
LOAN	Loan: Transaction is related to the transfer of a loan to a borrower
MP2B	Commercial Mobile P2B Payment
MP2P	Consumer Mobile P2P Payment
OTHR	Other Payment: Other payment purpose
PENS	Pension Payment: Transaction is the payment of pension
RPRE	Represented: Collection used to re-present previously reversed or returned direct debit transactions
RRCT	Reimbursement Received Credit Transfer: Transaction is related to a reimbursement for commercial reasons of a correctly received credit transfer
RVPM	Receive Against Payment: Code used to pre-advise the account servicer of a forthcoming receive against payment instruction
SALA	Salary Payment: Transaction is the payment of salaries
SECU	Securities: Transaction is the payment of securities
SSBE	Social Security Benefit: Transaction is a social security benefit, ie payment made by a government to support individuals
SUPP	Supplier Payment: Transaction is related to a payment to a supplier
TAXS	Tax Payment: Transaction is the payment of taxes
TRAD	Trade: Transaction is related to the payment of a trade finance transaction
TREA	Treasury Payment: Transaction is related to treasury operations. E.g. financial contract settlement
VATX	Value Added Tax Payment: Transaction is the payment of value added tax
WHLD	With Holding: Transaction is the payment of withholding tax
"BONU"

ChargeBearerCode

Enumerated Values
Value	Description
CRED	The Payee (recipient of the payment) will incur all of the payment transaction fees
DEBT	The Payer (sender of the payment) will bear all of the payment transaction fees
SHAR	Shared. Transaction charges on the sender side are to be borne by the debtor, transaction charges on the receiver side are to be borne by the creditor
SLEV	Service level. Charges are to be applied following the rules agreed in the service level and/or scheme
"CRED"

ClearingSystemMemberIdentification

Properties
Name	Type	Required	Description
clearing_system_id	string	false	Specification of a pre-agreed offering between clearing agents or the channel through which the payment instruction is processed.
member_id	string	false	Identification of a member of a clearing system.
{
  "clearing_system_id": "NZNCC",
  "member_id": 20368
}

ContactDetails

Properties
Name	Type	Required	Description
email_address	string	false	Email address of a person
phone_number	string	false	Phone number of a person
{
  "email_address": "string",
  "phone_number": "string"
}

CreatePaymentRequest

Properties
Name	Type	Required	Description
payment_type	PaymentType	true	Specifies the type of payment used
payment_request	PaymentRequestResource	true	Specifies the details required to initiate a payment
aspsp	ASPSP	true	ASPSP that PSU is going to be authenticated to
state	string	true	Arbitrary string. Same string will be returned in query parameter when redirecting to the URL passed via redirect_url parameter
redirect_url	string(uri)	true	URL that PSU will be redirected to after authorization
psu_type	PSUType	true	PSU type used for the authorization flow. This parameter affects how the authorization is performed at the ASPSP (e.g., whether a personal or business login page is shown). A mismatch between the provided psu_type and the PSU's actual account type can result in authorization failures or the inability to see expected accounts. Since the default value depends on the specific connector, it is highly recommended to always provide this value for consistent behavior. If the application cannot determine the PSU type, it should be requested from the end user (PSU).
auth_method	string	false	Desired authorization method (in case ASPSP integration supports multiple). Supported methods can be obtained from the auth_methods field available in ASPSP details.
credentials	object	false	PSU credentials (e.g., user and/or company ID). If not provided through the API, they will be requested from the PSU during authorization. Credentials can be supplied only if auth_method is specified; otherwise, a WRONG_REQUEST_PARAMETERS error will be returned.
language	string	false	Preferred PSU language. Two-letter lowercase language code
webhook_url	string(uri)	false	URL that will receive POST requests notifying about payment changes. See the webhooks documentation for more details
psu_id	string	false	Unique identification of a PSU used by the client application. It can be used to match payments of the same user. Although only hashed value is stored, it is recommended to use anonymised identifiers (i.e. digital ID instead of email or social security number). In case the parameter is not passed by the application, random value will be used.
defer_submission	boolean	false	Controls whether the payment submission for execution is deferred after PSU authorization. When set to true, the payment will not be automatically submitted for execution after PSU completes authorization at the ASPSP. Instead, an explicit call to POST /payments/{payment_id}/submit is required to submit the payment for execution. Only effective when the selected ASPSP payment type has deferred_submission_supported: true. Defaults to false.
{
  "aspsp": {
    "country": "FI",
    "name": "S-Pankki"
  },
  "payment_request": {
    "credit_transfer_transaction": [
      {
        "beneficiary": {
          "creditor": {
            "name": "Organisation/Person Name"
          },
          "creditor_account": {
            "identification": "FI0455231152453547",
            "scheme_name": "IBAN"
          }
        },
        "instructed_amount": {
          "amount": "10.33",
          "currency": "EUR"
        }
      }
    ]
  },
  "payment_type": "SEPA",
  "psu_type": "personal",
  "redirect_url": "https://google.com/",
  "state": "b463a960-9616-4df6-909f-f80884190c22"
}

CreatePaymentResponse

Properties
Name	Type	Required	Description
payment_id	string(uuid)	true	Payment ID
status	PaymentStatus	true	Payment status
url	string(uri)	true	URL to redirect a PSU to
psu_id_hash	string	true	Hashed unique identification of a PSU used by the client application. In case PSU ID is not passed by the client application, the hash is calculated based on a random value. The hash also inherits the application ID, so different hashes will be calculated when using the same PSU ID with different applications.
{
  "payment_id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "psu_id_hash": "12427b547618d01d46cabfdd6fd7e832bb42076fb210d40e56783e0d1f4798fd",
  "status": "RCVD",
  "url": "https://auth.enablebanking.com/pis/start?payment_id=497f6eca-6276-4993-bfeb-53cbbbba6f08"
}

Credential

Properties
Name	Type	Required	Description
name	string	true	Internal name of the credential. The name is to be used when passing credentials to the "start user authorization" request
title	string	true	Title for the credential to be displayed to PSU
required	boolean	true	Indication whether the credential is required
description	string	false	Description of the credential to be displayed to PSU
template	string	false	Perl compatible regular expression used for check of the credential format
{
  "name": "userId",
  "title": "User ID",
  "required": true,
  "description": "Your identifier used for logging in to online banking",
  "template": "^\\d{8}$"
}

CreditDebitIndicator

Enumerated Values
Value	Description
CRDT	Credit type transaction
DBIT	Debit type transaction
"CRDT"

CreditTransferTransaction

Properties
Name	Type	Required	Description
instructed_amount	AmountType	true	Structure aiming to embed the amount and the currency to be used
beneficiary	Beneficiary	true	Specification of a beneficiary
payment_id	PaymentIdentification	false	Set of elements used to reference a payment instruction
requested_execution_date	RequestedExecutionDate	false	Date at which the initiating party requests the clearing agent to process the payment.
API:
This date can be used in the following cases:
- the single requested execution date for a payment having several instructions. In this case, this field must be set at the payment level.
- the requested execution date for a given instruction within a payment. In this case, this field must be set at each instruction level.
- The first date of execution for a standing order.
When the payment cannot be processed at this date, the ASPSP is allowed to shift the applied execution date to the next possible execution date for non-standing orders.
For standing orders, the [executionRule] parameter helps to compute the execution date to be applied.
reference_number	ReferenceNumber	false	This field specifies the reference assigned by the sender to unambiguously identify the message.
end_date	EndDate	false	The last applicable day of execution for a given standing order.
If not given, the standing order is considered as endless.
execution_rule	ExecutionRule	false	Execution date shifting rule for standing orders
frequency	FrequencyCode	false	Frequency rule for standing orders
ultimate_debtor	PartyIdentification	false	Identifies the original party from whom the funds originate in the payment transaction
ultimate_creditor	PartyIdentification	false	Identifies the final party receiving the funds in the payment transaction
regulatory_reporting	[RegulatoryReporting]	false	List of needed regulatory reporting codes for international payments
remittance_information	UnstructuredRemittanceInformation	false	Payment details. For credit transfers may contain free text, reference number or both at the same time (in case Extended Remittance Information is supported). When it is known that remittance information contains a reference number (either based on ISO 11649 or a local scheme), the reference number is also available via the referenceNumber field of the Transaction data structure.
{
  "instructed_amount": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "beneficiary": {
    "creditor": {
      "name": "Organisation/Person Name"
    },
    "creditor_account": {
      "identification": "FI0455231152453547",
      "scheme_name": "IBAN"
    }
  },
  "payment_id": {
    "instruction_id": "string",
    "end_to_end_id": "string"
  },
  "requested_execution_date": "2019-08-24",
  "reference_number": "string",
  "end_date": "2019-08-24",
  "execution_rule": "FWNG",
  "frequency": "DAIL",
  "ultimate_debtor": {
    "name": "MyPreferredAisp",
    "postal_address": {
      "address_line": [
        "Mr Asko Teirila PO Box 511",
        "39140 AKDENMAA FINLAND"
      ],
      "address_type": "Business",
      "building_number": "4",
      "country": "FI",
      "country_sub_division": "Uusimaa",
      "department": "Department of resources",
      "post_code": "00123",
      "street_name": "Vasavagen",
      "sub_department": "Sub Department of resources",
      "town_name": "Helsinki"
    }
  },
  "ultimate_creditor": {
    "name": "MyPreferredAisp",
    "postal_address": {
      "address_line": [
        "Mr Asko Teirila PO Box 511",
        "39140 AKDENMAA FINLAND"
      ],
      "address_type": "Business",
      "building_number": "4",
      "country": "FI",
      "country_sub_division": "Uusimaa",
      "department": "Department of resources",
      "post_code": "00123",
      "street_name": "Vasavagen",
      "sub_department": "Sub Department of resources",
      "town_name": "Helsinki"
    }
  },
  "regulatory_reporting": [
    {
      "authority": {
        "country": "string",
        "name": "string"
      },
      "details": {
        "amount": {
          "currency": "EUR",
          "amount": "1.23"
        },
        "code": "string",
        "information": "string"
      }
    }
  ],
  "remittance_information": [
    "string"
  ]
}

CreditTransferTransactionDetails

Properties
Name	Type	Required	Description
instructed_amount	AmountType	true	Structure aiming to embed the amount and the currency to be used
beneficiary	Beneficiary	true	Specification of a beneficiary
payment_id	PaymentIdentification	false	Set of elements used to reference a payment instruction
requested_execution_date	RequestedExecutionDate	false	Date at which the initiating party requests the clearing agent to process the payment.
API:
This date can be used in the following cases:
- the single requested execution date for a payment having several instructions. In this case, this field must be set at the payment level.
- the requested execution date for a given instruction within a payment. In this case, this field must be set at each instruction level.
- The first date of execution for a standing order.
When the payment cannot be processed at this date, the ASPSP is allowed to shift the applied execution date to the next possible execution date for non-standing orders.
For standing orders, the [executionRule] parameter helps to compute the execution date to be applied.
reference_number	ReferenceNumber	false	This field specifies the reference assigned by the sender to unambiguously identify the message.
end_date	EndDate	false	The last applicable day of execution for a given standing order.
If not given, the standing order is considered as endless.
execution_rule	ExecutionRule	false	Execution date shifting rule for standing orders
frequency	FrequencyCode	false	Frequency rule for standing orders
ultimate_debtor	PartyIdentification	false	Identifies the original party from whom the funds originate in the payment transaction
ultimate_creditor	PartyIdentification	false	Identifies the final party receiving the funds in the payment transaction
regulatory_reporting	[RegulatoryReporting]	false	List of needed regulatory reporting codes for international payments
remittance_information	UnstructuredRemittanceInformation	false	Payment details. For credit transfers may contain free text, reference number or both at the same time (in case Extended Remittance Information is supported). When it is known that remittance information contains a reference number (either based on ISO 11649 or a local scheme), the reference number is also available via the referenceNumber field of the Transaction data structure.
transaction_id	string	false	Unique identifier of the payment transaction, which can be used for fetching details through the get payment transaction endpoint
transaction_status	PaymentStatus	false	Status of the payment transaction
{
  "instructed_amount": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "beneficiary": {
    "creditor": {
      "name": "Organisation/Person Name"
    },
    "creditor_account": {
      "identification": "FI0455231152453547",
      "scheme_name": "IBAN"
    }
  },
  "payment_id": {
    "instruction_id": "string",
    "end_to_end_id": "string"
  },
  "requested_execution_date": "2019-08-24",
  "reference_number": "string",
  "end_date": "2019-08-24",
  "execution_rule": "FWNG",
  "frequency": "DAIL",
  "ultimate_debtor": {
    "name": "MyPreferredAisp",
    "postal_address": {
      "address_line": [
        "Mr Asko Teirila PO Box 511",
        "39140 AKDENMAA FINLAND"
      ],
      "address_type": "Business",
      "building_number": "4",
      "country": "FI",
      "country_sub_division": "Uusimaa",
      "department": "Department of resources",
      "post_code": "00123",
      "street_name": "Vasavagen",
      "sub_department": "Sub Department of resources",
      "town_name": "Helsinki"
    }
  },
  "ultimate_creditor": {
    "name": "MyPreferredAisp",
    "postal_address": {
      "address_line": [
        "Mr Asko Teirila PO Box 511",
        "39140 AKDENMAA FINLAND"
      ],
      "address_type": "Business",
      "building_number": "4",
      "country": "FI",
      "country_sub_division": "Uusimaa",
      "department": "Department of resources",
      "post_code": "00123",
      "street_name": "Vasavagen",
      "sub_department": "Sub Department of resources",
      "town_name": "Helsinki"
    }
  },
  "regulatory_reporting": [
    {
      "authority": {
        "country": "string",
        "name": "string"
      },
      "details": {
        "amount": {
          "currency": "EUR",
          "amount": "1.23"
        },
        "code": "string",
        "information": "string"
      }
    }
  ],
  "remittance_information": [
    "string"
  ],
  "transaction_id": "string",
  "transaction_status": "ACCC"
}

CurrencyCode

Properties
Name	Type	Required	Description
CurrencyCode	string	false	Specifies the currency of the amount or of the account according the ISO 4217 standard
"EUR"

EndDate

Properties
Name	Type	Required	Description
EndDate	string(date)	false	The last applicable day of execution for a given standing order.
If not given, the standing order is considered as endless.
"2019-08-24"

Environment

Enumerated Values
Value	Description
PRODUCTION	Live production environment
SANDBOX	Simulation environment used for testing purposes
"PRODUCTION"

ErrorCode

Enumerated Values
Value	Description
ACCESS_DENIED	Access to this resource is denied. Check services available for your application.
ACCOUNT_DOES_NOT_EXIST	No account found matching provided id
ALREADY_AUTHORIZED	Session is already authorized
ASPSP_ACCOUNT_NOT_ACCESSIBLE	The PSU does not have access to the requested account or it doesn't exist
ASPSP_ERROR	Error interacting with ASPSP
ASPSP_PAYMENT_NOT_ACCESSIBLE	Payment can not be requested from the ASPSP
ASPSP_PSU_ACTION_REQUIRED	PSU action is required to proceed
ASPSP_RATE_LIMIT_EXCEEDED	ASPSP Rate limit exceeded
ASPSP_TIMEOUT	Timeout interacting with ASPSP
AUTHORIZATION_NOT_PROVIDED	Authorization header is not provided
CLOSED_SESSION	Session is closed
DATE_FROM_IN_FUTURE	date_from can not be in the future
DATE_TO_WITHOUT_DATE_FROM	date_from must be provided if date_to provided
EXPIRED_AUTHORIZATION_CODE	Authorization code is expired
EXPIRED_SESSION	Session is expired
INVALID_ACCOUNT_ID	Either iban or other account identification is required
INVALID_HOST	Invalid host
INVALID_PAYMENT	Invalid or expired payment provided
NO_ACCOUNTS_ADDED	No allowed accounts added to the application
PAYMENT_LIMIT_EXCEEDED	The amount value or the the number of transactions exceeds the limit
PAYMENT_NOT_AUTHORIZED	Payment has not been authorized yet
PAYMENT_NOT_FINALIZED	You can not delete a payment that is not finalized or cancelled
PAYMENT_NOT_FOUND	Payment not found
PAYMENT_SUBMISSION_NOT_DEFERRED	Payment was not created with deferred submission enabled
PAYMENT_SUBMISSION_NOT_SUPPORTED	Deferred submission is not supported for this ASPSP payment type
PSU_HEADER_INVALID	Provided PSU header contains invalid value
PSU_HEADER_NOT_PROVIDED	Required PSU header is not provided
REDIRECT_URI_NOT_ALLOWED	Redirect URI not allowed
REVOKED_SESSION	Session is revoked
SESSION_DOES_NOT_EXIST	No session found matching provided id
TRANSACTION_DOES_NOT_EXIST	No transaction found matching provided id
UNAUTHORIZED_ACCESS	Unauthorized access
UNAUTHORIZED_IP	Used IP address is not authorized to access the resource
UNTRUSTED_PAYMENT_PARTY	Either creditor or debtor account is not trusted
WEBHOOK_URI_NOT_ALLOWED	Webhook URI not allowed
WRONG_ASPSP_PROVIDED	Wrong ASPSP name provided
WRONG_AUTHORIZATION_CODE	Wrong authorization code provided
WRONG_CONTINUATION_KEY	Wrong continuation key provided
WRONG_CREDENTIALS_PROVIDED	Wrong credentials provided
WRONG_DATE_INTERVAL	date_from should be less than or equal date_to
WRONG_REQUEST_PARAMETERS	Wrong request parameters provided
WRONG_SESSION_STATUS	Wrong session status
WRONG_TRANSACTIONS_PERIOD	Wrong transactions period requested
"ACCESS_DENIED"

ErrorResponse

Properties
Name	Type	Required	Description
message	string	true	Error message
code	integer	false	Error code, identical to the http response code
error	ErrorCode	false	Text error code
detail	any	false	Detailed explanation of an error
{
  "message": "Required PSU header is not provided",
  "code": 422,
  "error": "ACCESS_DENIED",
  "detail": "PSU header psuIpAddress is not provided"
}

ExchangeRate

Properties
Name	Type	Required	Description
unit_currency	CurrencyCode	false	ISO 4217 code of the currency, in which the rate of exchange is expressed in a currency exchange. In the example 1GBP = xxxCUR, the unit currency is GBP.
exchange_rate	string	false	The factor used for conversion of an amount from one currency to another. This reflects the price at which one currency was bought with another currency.
rate_type	RateType	false	Specifies the type of exchange rate applied to the transaction
contract_identification	string	false	Unique and unambiguous reference to the foreign exchange contract agreed between the initiating party/creditor and the debtor agent.
instructed_amount	AmountType	false	Original amount, in which transaction was initiated. In particular, for cross-currency card transactions, the value represents original value of a purchase or a withdrawal in a currency different from the card's native or default currency.
{
  "unit_currency": "EUR",
  "exchange_rate": "string",
  "rate_type": "SPOT",
  "contract_identification": "string",
  "instructed_amount": {
    "currency": "EUR",
    "amount": "1.23"
  }
}

ExecutionRule

Enumerated Values
Value	Description
FWNG	Following
PREC	Preceding
"FWNG"

FinancialInstitutionIdentification

Properties
Name	Type	Required	Description
bic_fi	string	false	Code allocated to a financial institution by the ISO 9362 Registration Authority as described in ISO 9362 "Banking - Banking telecommunication messages - Business identification code (BIC)".
clearing_system_member_id	ClearingSystemMemberIdentification	false	Information used to identify a member within a clearing system.
name	string	false	Name of the financial institution
{
  "bic_fi": "string",
  "clearing_system_member_id": {
    "clearing_system_id": "NZNCC",
    "member_id": 20368
  },
  "name": "string"
}

FrequencyCode

Enumerated Values
Value	Description
DAIL	Daily
MNTH	Monthly
QUTR	Quarterly
SEMI	Semi annual
TOMN	Every two months
TOWK	Every two weeks
WEEK	Weekly
YEAR	Annual
"DAIL"

GenericIdentification

Properties
Name	Type	Required	Description
identification	string	true	An identifier
scheme_name	SchemeName	true	Name of the identification scheme. Partially based on ISO20022 external code list
issuer	string	false	Entity that assigns the identification. This could be a country code or any organisation name or identifier that can be recognized by both parties
{
  "identification": "123456",
  "scheme_name": "BBAN"
}

GetApplicationResponse

Properties
Name	Type	Required	Description
name	string	true	Application name
description	string	false	Application description
kid	string(uuid4)	true	Application key id
environment	Environment	true	Application environment
redirect_urls	[string]	true	List of allowed redirect urls
active	boolean	true	Indication whether the application is active
countries	[string]	true	List of supported countries
services	[Service]	true	List of supported services
{
  "name": "string",
  "description": "string",
  "kid": "string",
  "environment": "PRODUCTION",
  "redirect_urls": [
    "http://example.com"
  ],
  "active": true,
  "countries": [
    "string"
  ],
  "services": [
    "AIS"
  ]
}

GetAspspsResponse

Properties
Name	Type	Required	Description
aspsps	[ASPSPData]	true	List of available ASPSPs and countries
{
  "aspsps": [
    {
      "auth_methods": [
        {
          "approach": "REDIRECT",
          "credentials": [
            {
              "description": "Business identity code (Y-tunnus) in 1234567-8 format",
              "name": "companyId",
              "required": true,
              "template": "^\\d{7}-\\d$",
              "title": "Company ID"
            }
          ],
          "hidden_method": false,
          "name": "MTA",
          "psu_type": "business"
        }
      ],
      "beta": false,
      "bic": "NDEAFIHH",
      "country": "FI",
      "logo": "https://enablebanking.com/brands/FI/Nordea/",
      "maximum_consent_validity": 15552000,
      "name": "Nordea",
      "payments": [
        {
          "allowed_auth_methods": [
            "MTA"
          ],
          "charge_bearer_values": [
            "SLEV"
          ],
          "creditor_account_schemas": [
            "IBAN"
          ],
          "creditor_agent_bic_fi_required": false,
          "creditor_agent_clearing_system_member_id_required": false,
          "creditor_country_required": false,
          "creditor_name_required": false,
          "creditor_postal_address_required": false,
          "currencies": [
            "EUR"
          ],
          "debtor_account_required": true,
          "debtor_account_schemas": [
            "IBAN"
          ],
          "debtor_contact_email_required": false,
          "debtor_contact_phone_required": false,
          "debtor_currency_required": false,
          "max_transactions": 1,
          "payment_type": "SEPA",
          "priority_codes": [
            "NORM"
          ],
          "psu_type": "business",
          "reference_number_schemas": [
            "FIRF",
            "INTL"
          ],
          "reference_number_supported": true,
          "regulatory_reporting_code_required": false,
          "remittance_information_lines": [
            {
              "max_length": 140,
              "min_length": 1,
              "pattern": "^.{1,140}$"
            }
          ],
          "remittance_information_required": true,
          "requested_execution_date_max_period": 365,
          "requested_execution_date_supported": true
        }
      ],
      "psu_types": [
        "business"
      ],
      "required_psu_headers": [
        "Psu-Ip-Address"
      ]
    }
  ]
}

GetPaymentResponse

Properties
Name	Type	Required	Description
payment_id	string(uuid)	true	Payment ID
status	PaymentStatus	true	Payment status
payment_details	PaymentRequestResourceDetails	true	Payment request
payment_type	PaymentType	true	Specifies the type of payment used
aspsp	ASPSP	true	ASPSP used for the payment
final_status	boolean	true	Indicates whether the payment has reached the status expected to be final (i.e. if the value of the field is true, the payment status is not expected to change on later requests)
status_reason_information	StatusReasonInformation	false	Details explaining the payment status, provided when the cause can be determined unambiguously, mainly for rejected payments
psu_id_hash	string	true	Hashed unique identification of a PSU used by the client application. In case PSU ID is not passed by the client application, the hash is calculated based on a random value. The hash also inherits the application ID, so different hashes will be calculated when using the same PSU ID with different applications.
{
  "payment_id": "d43b87f9-9e28-4802-8eaa-6ee91a40ea71",
  "status": "ACCC",
  "payment_details": {
    "credit_transfer_transaction": [
      {
        "beneficiary": {
          "creditor": {
            "name": "Organisation/Person Name"
          },
          "creditor_account": {
            "identification": "FI0455231152453547",
            "scheme_name": "IBAN"
          }
        },
        "instructed_amount": {
          "amount": "10.33",
          "currency": "EUR"
        }
      }
    ],
    "debtor_account": {
      "identification": "FI7727551317119265",
      "scheme_name": "IBAN"
    }
  },
  "payment_type": "SEPA",
  "aspsp": {
    "name": "Nordea",
    "country": "FI"
  },
  "final_status": true,
  "status_reason_information": {
    "status_reason_code": "string",
    "status_reason_description": "string"
  },
  "psu_id_hash": "12427b547618d01d46cabfdd6fd7e832bb42076fb210d40e56783e0d1f4798fd"
}

GetPaymentTransactionResponse

Properties
Name	Type	Required	Description
payment_id	string(uuid)	true	Payment ID
transaction_details	CreditTransferTransactionDetails	true	Payment transaction details
{
  "payment_id": "d43b87f9-9e28-4802-8eaa-6ee91a40ea71",
  "transaction_details": {
    "instructed_amount": {
      "currency": "EUR",
      "amount": "1.23"
    },
    "beneficiary": {
      "creditor": {
        "name": "Organisation/Person Name"
      },
      "creditor_account": {
        "identification": "FI0455231152453547",
        "scheme_name": "IBAN"
      }
    },
    "payment_id": {
      "instruction_id": "string",
      "end_to_end_id": "string"
    },
    "requested_execution_date": "2019-08-24",
    "reference_number": "string",
    "end_date": "2019-08-24",
    "execution_rule": "FWNG",
    "frequency": "DAIL",
    "ultimate_debtor": {
      "name": "MyPreferredAisp",
      "postal_address": {
        "address_line": [
          "Mr Asko Teirila PO Box 511",
          "39140 AKDENMAA FINLAND"
        ],
        "address_type": "Business",
        "building_number": "4",
        "country": "FI",
        "country_sub_division": "Uusimaa",
        "department": "Department of resources",
        "post_code": "00123",
        "street_name": "Vasavagen",
        "sub_department": "Sub Department of resources",
        "town_name": "Helsinki"
      }
    },
    "ultimate_creditor": {
      "name": "MyPreferredAisp",
      "postal_address": {
        "address_line": [
          "Mr Asko Teirila PO Box 511",
          "39140 AKDENMAA FINLAND"
        ],
        "address_type": "Business",
        "building_number": "4",
        "country": "FI",
        "country_sub_division": "Uusimaa",
        "department": "Department of resources",
        "post_code": "00123",
        "street_name": "Vasavagen",
        "sub_department": "Sub Department of resources",
        "town_name": "Helsinki"
      }
    },
    "regulatory_reporting": [
      {
        "authority": {
          "country": "string",
          "name": "string"
        },
        "details": {
          "amount": {
            "currency": "EUR",
            "amount": "1.23"
          },
          "code": "string",
          "information": "string"
        }
      }
    ],
    "remittance_information": [
      "string"
    ],
    "transaction_id": "string",
    "transaction_status": "ACCC"
  }
}

GetSessionResponse

Properties
Name	Type	Required	Description
status	SessionStatus	true	Session status
accounts	[string]	true	List of account ids available in the session
accounts_data	[SessionAccount]	true	Accounts data stored in the session
aspsp	ASPSP	true	ASPSP used with the session
psu_type	PSUType	true	PSU type used with the session
psu_id_hash	string	true	Hashed unique identification of a PSU used by the client application. In case PSU ID is not passed by the client application, the hash is calculated based on a random value. The hash also inherits the application ID, so different hashes will be calculated when using the same PSU ID with different applications.
access	Access	true	Scope of access requested from ASPSP and confirmed by PSU
created	string(date-time)	true	Date and time when the session was created
authorized	string(date-time)	false	Date and time when the session was authorized
closed	string(date-time)	false	Date and time when the session was closed
{
  "access": {
    "valid_until": "2020-12-01T12:00:00.000000+00:00"
  },
  "accounts": [
    "497f6eca-6276-4993-bfeb-53cbbbba6f08"
  ],
  "accounts_data": [
    {
      "identification_hash": "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.E8GzhnnsFC7K+4e3YMYYKpyM83Zx6toXrjgcvPP/Lqc=",
      "uid": "497f6eca-6276-4993-bfeb-53cbbbba6f08"
    }
  ],
  "aspsp": {
    "country": "FI",
    "name": "Nordea"
  },
  "authorized": "2020-12-01T12:00:00.000000+00:00",
  "created": "2020-12-01T12:00:00.000000+00:00",
  "psu_type": "business",
  "status": "AUTHORIZED"
}

HalBalances

Properties
Name	Type	Required	Description
balances	[BalanceResource]	true	List of account balances
{
  "balances": [
    {
      "name": "Booked balance",
      "balance_amount": {
        "currency": "EUR",
        "amount": "1.23"
      },
      "balance_type": "CLAV",
      "last_change_date_time": "2019-08-24T14:15:22Z",
      "reference_date": "2019-08-24",
      "last_committed_transaction": "4604aa90f8a8418092d80c3270846f0a"
    }
  ]
}

HalTransactions

Properties
Name	Type	Required	Description
transactions	[Transaction]	true	List of transactions
continuation_key	string	false	Value to retrieve next page of transactions. Null if there are no more pages. Only valid in current session.
{
  "transactions": [
    {
      "entry_reference": "5561990681",
      "merchant_category_code": "5511",
      "transaction_amount": {
        "currency": "EUR",
        "amount": "1.23"
      },
      "creditor": {
        "name": "MyPreferredAisp",
        "postal_address": {
          "address_line": [
            "Mr Asko Teirila PO Box 511",
            "39140 AKDENMAA FINLAND"
          ],
          "address_type": "Business",
          "building_number": "4",
          "country": "FI",
          "country_sub_division": "Uusimaa",
          "department": "Department of resources",
          "post_code": "00123",
          "street_name": "Vasavagen",
          "sub_department": "Sub Department of resources",
          "town_name": "Helsinki"
        }
      },
      "creditor_account": {
        "iban": "FI0455231152453547"
      },
      "creditor_agent": {
        "bic_fi": "string",
        "clearing_system_member_id": {
          "clearing_system_id": "NZNCC",
          "member_id": 20368
        },
        "name": "string"
      },
      "debtor": {
        "name": "MyPreferredAisp",
        "postal_address": {
          "address_line": [
            "Mr Asko Teirila PO Box 511",
            "39140 AKDENMAA FINLAND"
          ],
          "address_type": "Business",
          "building_number": "4",
          "country": "FI",
          "country_sub_division": "Uusimaa",
          "department": "Department of resources",
          "post_code": "00123",
          "street_name": "Vasavagen",
          "sub_department": "Sub Department of resources",
          "town_name": "Helsinki"
        }
      },
      "debtor_account": {
        "iban": "FI0455231152453547"
      },
      "debtor_agent": {
        "bic_fi": "string",
        "clearing_system_member_id": {
          "clearing_system_id": "NZNCC",
          "member_id": 20368
        },
        "name": "string"
      },
      "bank_transaction_code": {
        "description": "Utlandsbetalning",
        "code": "12",
        "sub_code": "32"
      },
      "credit_debit_indicator": "CRDT",
      "status": "BOOK",
      "booking_date": "2020-01-03",
      "value_date": "2020-01-02",
      "transaction_date": "2020-01-01",
      "balance_after_transaction": {
        "currency": "EUR",
        "amount": "1.23"
      },
      "reference_number": "RF07850352502356628678117",
      "reference_number_schema": "SEBG",
      "remittance_information": [
        "RF07850352502356628678117",
        "Gift for Alex"
      ],
      "debtor_account_additional_identification": {
        "identification": "12345678",
        "scheme_name": "CPAN"
      },
      "creditor_account_additional_identification": {
        "identification": "12345678",
        "scheme_name": "BBAN"
      },
      "exchange_rate": {
        "unit_currency": "EUR",
        "exchange_rate": "string",
        "rate_type": "SPOT",
        "contract_identification": "string",
        "instructed_amount": {
          "currency": "EUR",
          "amount": "1.23"
        }
      },
      "note": "string",
      "transaction_id": "string"
    }
  ],
  "continuation_key": "string"
}

PSUType

Enumerated Values
Value	Description
business	Business/corporate users
personal	Private/retail users
"business"

PartyIdentification

Properties
Name	Type	Required	Description
name	string	false	Name by which a party is known and which is usually used to identify that party.
postal_address	PostalAddress	false	Information that locates and identifies a specific address, as defined by postal services
organisation_id	GenericIdentification	false	Unique identification of an account, a person or an organisation, as assigned by an issuer
private_id	GenericIdentification	false	Unique identification of an account, a person or an organisation, as assigned by an issuer
contact_details	ContactDetails	false	Specifies the contact details associated with a person or an organisation
{
  "name": "MyPreferredAisp",
  "postal_address": {
    "address_line": [
      "Mr Asko Teirila PO Box 511",
      "39140 AKDENMAA FINLAND"
    ],
    "address_type": "Business",
    "building_number": "4",
    "country": "FI",
    "country_sub_division": "Uusimaa",
    "department": "Department of resources",
    "post_code": "00123",
    "street_name": "Vasavagen",
    "sub_department": "Sub Department of resources",
    "town_name": "Helsinki"
  }
}

PaymentIdentification

Properties
Name	Type	Required	Description
instruction_id	string	false	Unique identification as assigned by an instructing party for an instructed party to unambiguously identify the instruction.

API: Unique identification shared between the PISP and the ASPSP
end_to_end_id	string	false	Unique identification assigned by the initiating party to unambiguously identify the transaction. This identification is passed on, unchanged, throughout the entire end-to-end chain.

API: Unique identification shared between the merchant and the PSU
{
  "instruction_id": "string",
  "end_to_end_id": "string"
}

PaymentInformationId

Properties
Name	Type	Required	Description
PaymentInformationId	string	false	Reference assigned by a sending party to unambiguously identify the payment information block within the message.
"string"

PaymentRequestResource

Properties
Name	Type	Required	Description
payment_information_id	PaymentInformationId	false	Reference assigned by a sending party to unambiguously identify the payment information block within the message
payment_type_information	PaymentTypeInformation	false	Set of elements used to further specify the type of payment
debtor	PartyIdentification	false	Identification of the party sending funds
debtor_account	GenericIdentification	false	Identification of the account from which funds are sent when the payment is executed. When the debtor account is not provided it is to be chosen by the PSU during payment authorisation flow.
debtor_agent	FinancialInstitutionIdentification	false	Identification of the financial institution where the debtor account is held. To be provided only in case the financial institution can not be unambiguously identified the ASPSP name towards which the payment is initiated.
debtor_currency	string	false	ISO 4217 code, in which debtor account is held
purpose	PurposeCode	false	Underlying reason for the payment
charge_bearer	ChargeBearerCode	false	Specifies which party/parties will bear the charges associated with the processing of the payment
credit_transfer_transaction	[CreditTransferTransaction]	true	Payment instructions to be executed towards one or multiple beneficiaries in the payment process. Maximum number of transactions depend on the ASPSP and type of the payment taking into accounts its specificities about payment request handling.
{
  "credit_transfer_transaction": [
    {
      "beneficiary": {
        "creditor": {
          "name": "Organisation/Person Name"
        },
        "creditor_account": {
          "identification": "FI0455231152453547",
          "scheme_name": "IBAN"
        }
      },
      "instructed_amount": {
        "amount": "10.33",
        "currency": "EUR"
      }
    }
  ],
  "debtor_account": {
    "identification": "FI7727551317119265",
    "scheme_name": "IBAN"
  }
}

PaymentRequestResourceDetails

Properties
Name	Type	Required	Description
payment_information_id	PaymentInformationId	false	Reference assigned by a sending party to unambiguously identify the payment information block within the message
payment_type_information	PaymentTypeInformation	false	Set of elements used to further specify the type of payment
debtor	PartyIdentification	false	Identification of the party sending funds
debtor_account	GenericIdentification	false	Identification of the account from which funds are sent when the payment is executed. When the debtor account is not provided it is to be chosen by the PSU during payment authorisation flow.
debtor_agent	FinancialInstitutionIdentification	false	Identification of the financial institution where the debtor account is held. To be provided only in case the financial institution can not be unambiguously identified the ASPSP name towards which the payment is initiated.
debtor_currency	string	false	ISO 4217 code, in which debtor account is held
purpose	PurposeCode	false	Underlying reason for the payment
charge_bearer	ChargeBearerCode	false	Specifies which party/parties will bear the charges associated with the processing of the payment
credit_transfer_transaction	[CreditTransferTransactionDetails]	false	[Details of the payment instruction executed (to be executed) by the ASPSP]
{
  "credit_transfer_transaction": [
    {
      "beneficiary": {
        "creditor": {
          "name": "Organisation/Person Name"
        },
        "creditor_account": {
          "identification": "FI0455231152453547",
          "scheme_name": "IBAN"
        }
      },
      "instructed_amount": {
        "amount": "10.33",
        "currency": "EUR"
      }
    }
  ],
  "debtor_account": {
    "identification": "FI7727551317119265",
    "scheme_name": "IBAN"
  }
}

PaymentStatus

Enumerated Values
Value	Description
ACCC	AcceptedCreditSettlementCompleted. Settlement on the creditor's account has been completed.
ACCP	AcceptedCustomerProfile. Preceding check of technical validation was successful. Customer profile check was also successful.
ACCR	AcceptedCancellationRequest. Cancellation is accepted.
ACPT	Accepted. Request is accepted.
ACSC	AcceptedSettlementCompleted. Settlement on the debtor's account has been completed.
ACSP	AcceptedSettlementInProcess. All preceding checks such as technical validation and customer profile were successful. Dynamic risk assessment is now also successful and therefore the Payment Request has been accepted for execution.
ACTC	AcceptedTechnicalValidation. Authentication and syntactical and semantical validation are successful.
ACWC	AcceptedWithChange. Instruction is accepted but a change will be made, such as date or remittance not sent.
ACWP	AcceptedWithoutPosting. Payment instruction included in the credit transfer is accepted without being posted to the creditor's account.
CNCL	PaymentCancelled. Payment is cancelled.
NULL	NoCancellationProcess. There is no cancellation process ongoing.
PACR	PartiallyAcceptedCancellationRequest. Cancellation is partially accepted.
PART	PartiallyAccepted. A number of transactions have been accepted, whereas another number of transactions have not yet achieved 'accepted' status.
PDCR	PendingCancellationRequest. Cancellation request is pending.
PDNG	Pending. Payment request or individual transaction included in the Payment Request is pending. Further checks and status update will be performed.
RCVD	Received. Payment initiation has been received by the receiving agent.
RJCR	RejectedCancellationRequest. Cancellation request is rejected.
RJCT	Rejected. Payment request has been rejected.
"ACCC"

PaymentType

Enumerated Values
Value	Description
BULK_DOMESTIC	Domestic bulk credit transfers
BULK_DOMESTIC_SE_GIRO	Swedish domestic bulk Giro payments (BankGiro/PlusGiro)
BULK_SEPA	SEPA bulk credit transfers
CROSSBORDER	Crossborder credit transfers
DOMESTIC	Domestic credit transfers
DOMESTIC_PL_BLUE_CASH	Polish instant domestic credit transfers via the BlueCash system
DOMESTIC_PL_ELIXIR	Polish domestic credit transfers via the Elixir clearing system
DOMESTIC_PL_EXPRESS_ELIXIR	Polish instant domestic credit transfers via the Express Elixir system
DOMESTIC_PL_SORBNET	Polish high-value domestic credit transfers via the SORBNET system
DOMESTIC_SE_GIRO	Swedish domestic Giro payments (BankGiro/PlusGiro)
INST_SEPA	Instant SEPA credit transfers (without fallback to SEPA)
INTERNAL	Transfer made within an ASPSP
SEPA	SEPA credit transfers
"BULK_DOMESTIC"

PaymentTypeInformation

Properties
Name	Type	Required	Description
instruction_priority	PriorityCode	false	Indicator of the urgency or order of importance that the instructing party would like the instructed party to apply
service_level	ServiceLevelCode	false	Agreement under which or rules under which the transaction should be processed. Specifies a pre-agreed service or level of service between the parties, as published in an external service level code list
category_purpose	CategoryPurposeCode	false	Specifies the high level purpose of the instruction based on a set of pre-defined categories. This is used by the initiating party to provide information concerning the processing of the payment. It is likely to trigger special processing by any of the agents involved in the payment chain.
local_instrument	string	false	User community specific instrument
{
  "instruction_priority": "HIGH",
  "service_level": "BKTR",
  "category_purpose": "BONU",
  "local_instrument": "string"
}

PostalAddress

Properties
Name	Type	Required	Description
address_type	AddressType	false	Available address type values
department	string	false	Identification of a division of a large organisation or building.
sub_department	string	false	Identification of a sub-division of a large organisation or building.
street_name	string	false	Name of a street or thoroughfare.
building_number	string	false	Number that identifies the position of a building on a street.
post_code	string	false	Identifier consisting of a group of letters and/or numbers that is
added to a postal address to assist the sorting of mail.
town_name	string	false	Name of a built-up area, with defined boundaries, and a local government.
country_sub_division	string	false	Identifies a subdivision of a country such as state, region, county.
country	string	false	Two-letter ISO 3166 code of the country in which a person resides (the place of a person's home). In the case of a company, it is the country from which the affairs of that company are directed.
address_line	[string]	false	Unstructured address. The two lines must embed zip code and town name
{
  "address_type": "Business",
  "department": "Department of resources",
  "sub_department": "Sub Department of resources",
  "street_name": "Vasavagen",
  "building_number": "4",
  "post_code": "00123",
  "town_name": "Helsinki",
  "country_sub_division": "Uusimaa",
  "country": "FI",
  "address_line": [
    "Mr Asko Teirila PO Box 511",
    "39140 AKDENMAA FINLAND"
  ]
}

PriorityCode

Enumerated Values
Value	Description
EXPR	Express priority. Polish-specific priority code
HIGH	High priority
NORM	Normal priority
"EXPR"

PurposeCode

Enumerated Values
Value	Description
ACCT	Funds moved between 2 accounts of same account holder at the same bank
CASH	General cash management instruction, may be used for Transfer Initiation
COMC	Transaction is related to a payment of commercial credit or debit
CPKC	General Carpark Charges Transaction is related to carpark charges
TRPT	Transport RoadPricing Transaction is for the payment to top-up pre-paid card and electronic road pricing for the purpose of transportation
"ACCT"

RateType

Enumerated Values
Value	Description
AGRD	Exchange rate applied is the rate agreed between the parties
SALE	Exchange rate applied is the market rate at the time of the sale.
SPOT	Exchange rate applied is the spot rate.
"AGRD"

ReferenceNumber

Properties
Name	Type	Required	Description
ReferenceNumber	string	false	This field specifies the reference assigned by the sender to unambiguously identify the message.
"string"

ReferenceNumberScheme

Enumerated Values
Value	Description
BERF	Belgian reference number
FIRF	Finnish reference number
INTL	International reference number (starting with RF)
NORF	Norwegian KID (OCR)
SDDM	SEPA Direct Debit Mandate ID
SEBG	Swedish Bankgiro OCR
"BERF"

RegulatoryAuthority

Properties
Name	Type	Required	Description
country	string	true	Two-letter ISO 3166 code of the country in which the regulatory authority operates
name	string	true	Name of the regulatory authority
{
  "country": "string",
  "name": "string"
}

RegulatoryReporting

Properties
Name	Type	Required	Description
authority	RegulatoryAuthority	false	Regulatory authority to which reporting shall be made
details	RegulatoryReportingDetails	true	Details to provide on the regulatory reporting information
{
  "authority": {
    "country": "string",
    "name": "string"
  },
  "details": {
    "amount": {
      "currency": "EUR",
      "amount": "1.23"
    },
    "code": "string",
    "information": "string"
  }
}

RegulatoryReportingCode

Properties
Name	Type	Required	Description
value	string	true	Value of the code, i.e. what needs to be passed as a code when filling in regulatory reporting details.
description	string	true	Regulatory authority to which reporting shall be made
{
  "value": "string",
  "description": "string"
}

RegulatoryReportingDetails

Properties
Name	Type	Required	Description
amount	AmountType	false	Amount of money to be reported. If not provided the total instructed amount of the transaction is assumed.
code	string	false	A code specifying the nature, purpose, and/or reason for the transaction. Codes to be used depend on the regulatory authority, to which they are being reported.
information	string	true	Additional details that cater for specific domestic regulatory requirements.
{
  "amount": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "code": "string",
  "information": "string"
}

RemittanceInformationLineInfo

Properties
Name	Type	Required	Description
min_length	integer	false	Minimum length of remittance information line
max_length	integer	false	Maximum length of remittance information line
pattern	string	false	Specifies a regexp pattern for the remittance information line
{
  "min_length": 0,
  "max_length": 0,
  "pattern": "string"
}

RequestedExecutionDate

Properties
Name	Type	Required	Description
RequestedExecutionDate	string(date)	false	Date at which the initiating party requests the clearing agent to process the payment.
API:
This date can be used in the following cases:
- the single requested execution date for a payment having several instructions. In this case, this field must be set at the payment level.
- the requested execution date for a given instruction within a payment. In this case, this field must be set at each instruction level.
- The first date of execution for a standing order.
When the payment cannot be processed at this date, the ASPSP is allowed to shift the applied execution date to the next possible execution date for non-standing orders.
For standing orders, the [executionRule] parameter helps to compute the execution date to be applied.
"2019-08-24"

ResponsePaymentType

Properties
Name	Type	Required	Description
payment_type	PaymentType	true	Payment type name
max_transactions	integer	false	Maximum number of transactions per payment
currencies	[string]	false	List of supported currencies
debtor_account_required	boolean	false	States if debtor account is required for payment initiation request. When the debtor account is not provided it is to be chosen by the PSU during payment authorisation flow. Create payment body field: payment_request.debtor_account
debtor_account_schemas	[SchemeName]	false	List of supported debtor account schemas
creditor_account_schemas	[SchemeName]	false	List of supported creditor account schemas
priority_codes	[PriorityCode]	false	List of supported priority codes
charge_bearer_values	[ChargeBearerCode]	false	List of supported charge bearer codes
creditor_country_required	boolean	false	States if creditor country is required. Create payment body field: payment_request.credit_transfer_transaction[*].beneficiary.creditor.postal_address.country
creditor_name_required	boolean	false	States if creditor name is required. Create payment body field: payment_request.credit_transfer_transaction[*].beneficiary.creditor.postal_address.country
creditor_postal_address_required	boolean	false	States if creditor postal address is required. Create payment body field: payment_request.credit_transfer_transaction[*].beneficiary.creditor.postal_address
remittance_information_required	boolean	false	States if remittance information is required. Create payment body field: payment_request.credit_transfer_transaction[*].remittance_information
remittance_information_lines	[RemittanceInformationLineInfo]	false	Properties of remittance information. Each item of the array correspond to the remittance information line with the same index. When provided, the number of lines in the remittance information should be the same as the length of this array.
debtor_currency_required	boolean	false	States if debtor currency is required. Create payment body field: payment_request.debtor_currency
debtor_contact_email_required	boolean	false	States if debtor's contact email is required when a payment this type is being initiated. Create payment body field: payment_request.debtor.contact_details.email_address
debtor_contact_phone_required	boolean	false	States if debtor's contact phone is required when a payment this type is being initiated. Create payment body field: payment_request.debtor.contact_details.phone_number
creditor_agent_bic_fi_required	boolean	false	States if creditor agent bicFi is required. Create payment body field: payment_request.credit_transfer_transaction[*].beneficiary.creditor_agent.bic_fi
creditor_agent_clearing_system_member_id_required	boolean	false	States if creditor agent clearing system member ID is required. Create payment body field: payment_request.credit_transfer_transaction[*].beneficiary.creditor_agent.clearing_system_member_id
allowed_auth_methods	[string]	false	List of supported auth methods for this payment type
regulatory_reporting_codes	[RegulatoryReportingCode]	false	List of supported codes for regulatory reporting details
regulatory_reporting_code_required	boolean	false	States if regulatory reporting shall be provided for credit transfer transactions. Create payment body field: payment_request.credit_transfer_transaction[*].regulatory_reporting.details.code
reference_number_supported	boolean	false	States if reference number can be provided for credit transfer transactions
reference_number_schemas	[ReferenceNumberScheme]	false	List of reference number schemas supported by a payment method
requested_execution_date_supported	boolean	false	States if requested execution date supported by a payment method
requested_execution_date_max_period	integer	false	Maximum requested execution date interval in the future
remittance_reference_supported	boolean	false	States if both reference number and remittance information can be provided simultaneously
deferred_submission_supported	boolean	false	Indicates whether this payment type supports deferred submission for execution. When true, the automatic submission of the payment for execution after PSU authorization can be deferred — the client must call POST /payments/{payment_id}/submit to explicitly submit the payment for execution.
final_successful_statuses	[PaymentStatus]	false	List of the final successful statuses for the payment type. Please note that when a payment reaches one of the statuses provided in this list, it is not yet guaranteed that the funds will be credited to the creditor's account specified in the payment request. It is up to the application that created the payment to conclude whether the funds are (or will be) received, depending on the actual payment status and other factors.
psu_type	PSUType	true	PSU type
{
  "allowed_auth_methods": [
    "string"
  ],
  "charge_bearer_values": [
    "SLEV"
  ],
  "creditor_account_schemas": [
    "IBAN"
  ],
  "creditor_agent_bic_fi_required": false,
  "creditor_agent_clearing_system_member_id_required": false,
  "creditor_country_required": false,
  "creditor_name_required": false,
  "creditor_postal_address_required": false,
  "currencies": [
    "EUR"
  ],
  "debtor_account_required": false,
  "debtor_account_schemas": [
    "IBAN"
  ],
  "debtor_contact_email_required": false,
  "debtor_contact_phone_required": false,
  "debtor_currency_required": false,
  "max_transactions": 1,
  "payment_type": "SEPA",
  "priority_codes": [
    "NORM"
  ],
  "psu_type": "business",
  "reference_number_schemas": [
    "FIRF",
    "INTL"
  ],
  "reference_number_supported": true,
  "regulatory_reporting_code_required": false,
  "remittance_information_lines": [
    {
      "max_length": 140,
      "min_length": 1,
      "pattern": "^.{1,140}$"
    }
  ],
  "remittance_information_required": false,
  "requested_execution_date_max_period": 365,
  "requested_execution_date_supported": true
}

SandboxInfo

Properties
Name	Type	Required	Description
users	[SandboxUser]	false	List of sandbox users which can be used to test sandbox environment
{
  "users": [
    {
      "username": "MyUsername",
      "password": "MySecretPassword",
      "otp": "123456"
    }
  ]
}

SandboxUser

Properties
Name	Type	Required	Description
username	string	false	Username
password	string	false	Password
otp	string	false	One time password
{
  "username": "MyUsername",
  "password": "MySecretPassword",
  "otp": "123456"
}

SchemeName

Enumerated Values
Value	Description
ARNU	AlienRegistrationNumber
BANK	BankPartyIdentification. Unique and unambiguous assignment made by a specific bank or similar financial institution to identify a relationship as defined between the bank and its client.
BBAN	Basic Bank Account Number. Represents a country-specific bank account number.
BGNR	Swedish BankGiro account number. Used in domestic Swedish giro payments
CCPT	PassportNumber
CHID	Clearing Identification Number
COID	CountryIdentificationCode. Country authority given organisation identification (e.g., corporate registration number)
CPAN	Card PAN (masked or plain)
CUSI	CustomerIdentificationNumberIndividual. Handelsbanken-specific code
CUST	CorporateCustomerNumber
DRLC	DriversLicenseNumber
DUNS	Data Universal Numbering System
EMPL	EmployerIdentificationNumber
GS1G	GS1GLNIdentifier
IBAN	International Bank Account Number (IBAN) - identification used internationally by financial institutions to uniquely identify the account of a customer.
MIBN	Masked IBAN
NIDN	NationalIdentityNumber. Number assigned by an authority to identify the national identity number of a person.
OAUT	OAUTH2 access token that is owned by the PISP being also an AISP and that can be used in order to identify the PSU
OTHC	OtherCorporate. Handelsbanken-specific code
OTHI	OtherIndividual. Handelsbanken-specific code
PGNR	Swedish PlusGiro account number. Used in domestic Swedish giro payments
SOSE	SocialSecurityNumber
SREN	The SIREN number is a 9 digit code assigned by INSEE, the French National Institute for Statistics and Economic Studies, to identify an organisation in France.
SRET	The SIRET number is a 14 digit code assigned by INSEE, the French National Institute for Statistics and Economic Studies, to identify an organisation unit in France. It consists of the SIREN number, followed by a five digit classification number, to identify the local geographical unit of that entity.
TXID	TaxIdentificationNumber
"ARNU"

Service

Enumerated Values
Value	Description
AIS	Account Information Service
PIS	Payment Initiation Service
"AIS"

ServiceLevelCode

Enumerated Values
Value	Description
BKTR	Book Transaction: Payment through internal book transfer
G001	Tracked Customer Credit Transfer: Tracked Customer Credit Transfer
G002	Tracked Stop And Recall: Tracked Stop and Recall
G003	Tracked Corporate Transfer: Tracked Corporate Transfer
G004	Tracked Financial Institution Transfer: Tracked Financial Institution Transfer
NUGP	Non-urgent Priority Payment: Payment must be executed as a non-urgent transaction with priority settlement
NURG	Non-urgent Payment: Payment must be executed as a non-urgent transaction, which is typically identified as an ACH or low value transaction
PRPT	EBA Priority Service: Transaction must be processed according to the EBA Priority Service
SDVA	Same Day Value: Payment must be executed with same day value to the creditor
SEPA	Single Euro Payments Area: Payment must be executed following the Single Euro Payments Area scheme
SVDE	Domestic Cheque Clearing and Settlement: Payment execution following the cheque agreement and traveller cheque agreement of the German Banking Industry Committee (Die Deutsche Kreditwirtschaft - DK) and Deutsche Bundesbank – Scheck Verrechnung Deutschland
URGP	Urgent Payment: Payment must be executed as an urgent transaction cleared through a real-time gross settlement system, which is typically identified as a wire or high value transaction
URNS	Urgent Payment Net Settlement: Payment must be executed as an urgent transaction cleared through a real-time net settlement system, which is typically identified as a wire or high value transaction
"BKTR"

SessionAccount

Properties
Name	Type	Required	Description
uid	string(uuid)	true	Account identificator within the session
identification_hash	string	true	Global account identification hash
identification_hashes	[string]	true	List of possible account identification hashes. Identification hash is based on the account number. Some accounts may have multiple account numbers (e.g. IBAN and BBAN). This field contains all possible hashes.
{
  "uid": "07cc67f4-45d6-494b-adac-09b5cbc7e2b5",
  "identification_hash": "string",
  "identification_hashes": [
    "string"
  ]
}

SessionStatus

Enumerated Values
Value	Description
AUTHORIZED	Session is authorised for access to account information
CANCELLED	Session authorisation has been cancelled by the end-user
CLOSED	Session has been closed by the application
EXPIRED	Session has expired
INVALID	Session authorisation has failed
PENDING_AUTHORIZATION	Session authorisation by the end-user is pending
RETURNED_FROM_BANK	Session authorisation has completed successfully by the end-user
REVOKED	Session has been revoked by the end-user
"AUTHORIZED"

StartAuthorizationRequest

Properties
Name	Type	Required	Description
access	Access	true	Scope of access to be request from ASPSP and to be confirmed by PSU
aspsp	ASPSP	true	ASPSP that PSU is going to be authenticated to
state	string	true	Arbitrary string. Same string will be returned in query parameter when redirecting to the URL passed via redirect_url parameter
redirect_url	string(uri)	true	URL that PSU will be redirected to after authorization
psu_type	PSUType	false	PSU type used for the authorization flow. This parameter affects how the authorization is performed at the ASPSP (e.g., whether a personal or business login page is shown). A mismatch between the provided psu_type and the PSU's actual account type can result in authorization failures or the inability to see expected accounts. Since the default value depends on the specific connector, it is highly recommended to always provide this value for consistent behavior. If the application cannot determine the PSU type, it should be requested from the end user (PSU).
auth_method	string	false	Desired authorization method (in case ASPSP integration supports multiple). Supported methods can be obtained from the auth_methods field available in ASPSP details.
credentials	object	false	PSU credentials (e.g., user and/or company ID). If not provided through the API, they will be requested from the PSU during authorization. Credentials can be supplied only if auth_method is specified; otherwise, a WRONG_REQUEST_PARAMETERS error will be returned.
credentials_autosubmit	boolean	false	Controls whether user credentials will be autosubmitted (if passed). If set to false then credentials form will be prefilled with passed credentials
language	string	false	Preferred PSU language. Two-letter lowercase language code
psu_id	string	false	Unique identification of a PSU used by the client application. It can be used to match sessions of the same user. Although only hashed value is stored, it is recommended to use anonymised identifiers (i.e. digital ID instead of email or social security number). In case the parameter is not passed by the application, random value will be used.
{
  "access": {
    "valid_until": "2019-08-24T14:15:22Z"
  },
  "aspsp": {
    "name": "Nordea",
    "country": "FI"
  },
  "state": "3a57e2d3-2e0c-4336-af9b-7fa94f0606a3",
  "redirect_url": "http://example.com",
  "psu_type": "business",
  "auth_method": "methodName",
  "credentials": {
    "userId": "MyUsername"
  },
  "credentials_autosubmit": true,
  "language": "fi",
  "psu_id": "string"
}

StartAuthorizationResponse

Properties
Name	Type	Required	Description
url	string(uri)	true	URL to redirect PSU to
authorization_id	string(uuid)	true	PSU authorisation ID, a value used to identify an authorisation session. Please note that another session ID will used to fetch account data.
psu_id_hash	string	true	Hashed unique identification of a PSU used by the client application. In case PSU ID is not passed by the client application, the hash is calculated based on a random value. The hash also inherits the application ID, so different hashes will be calculated when using the same PSU ID with different applications.
{
  "url": "https://auth.enablebanking.com/ais/start?sessionid=73100c65-c54d-46a1-87d1-aa3effde435a",
  "authorization_id": "73100c65-c54d-46a1-87d1-aa3effde435a",
  "psu_id_hash": "12427b547618d01d46cabfdd6fd7e832bb42076fb210d40e56783e0d1f4798fd"
}

StatusReasonInformation

Properties
Name	Type	Required	Description
status_reason_code	string	true	ISO20022 status reason code
status_reason_description	string	true	Status reason description
{
  "status_reason_code": "string",
  "status_reason_description": "string"
}

SubmitPaymentResponse

Properties
Name	Type	Required	Description
payment_id	string(uuid)	true	Payment ID
status	PaymentStatus	true	Current payment status
final_status	boolean	true	Indicates whether the payment has reached the status expected to be final (i.e. if the value of the field is true, the payment status is not expected to change on later requests)
status_reason_information	StatusReasonInformation	false	Additional information about the status reason
{
  "payment_id": "d43b87f9-9e28-4802-8eaa-6ee91a40ea71",
  "status": "ACCC",
  "final_status": true,
  "status_reason_information": {
    "status_reason_code": "string",
    "status_reason_description": "string"
  }
}

SuccessResponse

Properties
Name	Type	Required	Description
message	string	false	Returns "OK" in case of successful request
{
  "message": "OK"
}

Transaction

Properties
Name	Type	Required	Description
entry_reference	string	false	Unique transaction identifier provided by ASPSP. This identifier is both unique and immutable for accounts with the same identification hashes and can be used for matching transactions across multiple PSU authentication sessions. Usually the same identifier is available for transactions in ASPSP's online/mobile interface and is called archive ID or similarly. Please note that this identifier is not globally unique and same entry references are likely to occur for transactions belonging to different accounts.
merchant_category_code	string	false	Category code conform to ISO 18245, related to the type of services or goods the merchant provides for the transaction
transaction_amount	AmountType	true	Monetary sum of the transaction
creditor	PartyIdentification	false	Identification of the party receiving funds in the transaction
creditor_account	AccountIdentification	false	Identification of the account on which the transaction is credited
creditor_agent	FinancialInstitutionIdentification	false	Identification of the creditor agent
debtor	PartyIdentification	false	Identification of the party sending funds in the transaction
debtor_account	AccountIdentification	false	Identification of the account on which the transaction is debited
debtor_agent	FinancialInstitutionIdentification	false	Identification of the debtor agent
bank_transaction_code	BankTransactionCode	false	Allows the account servicer to correctly report a transaction, which in its turn will help account holders to perform their cash management and reconciliation operations.
credit_debit_indicator	CreditDebitIndicator	true	Accounting flow of the transaction
status	TransactionStatus	true	Available transaction status values
booking_date	string(date)	false	Booking date of the transaction on the account, i.e. the date at which the transaction has been recorded on books
value_date	string(date)	false	Value date of the transaction on the account, i.e. the date at which funds become available to the account holder (in case of a credit transaction), or cease to be available to the account holder (in case of a debit transaction)
transaction_date	string(date)	false	Date used for specific purposes:
- for card transaction: date of the transaction
- for credit transfer: acquiring date of the transaction
- for direct debit: receiving date of the transaction
balance_after_transaction	AmountType	false	Funds on the account after execution of the transaction
reference_number	string	false	Credit transfer reference number (also known as the creditor reference or the structured creditor reference). The value is set when it is known that the transaction data contains a reference number (in either ISO 11649 or another format). If the format is known it is provided in the reference_number_schema field.
reference_number_schema	ReferenceNumberScheme	false	Indicates what kind of reference number is used.
remittance_information	[string]	false	Payment details. For credit transfers may contain free text, reference number or both at the same time (in case Extended Remittance Information is supported). When it is known that remittance information contains a reference number (either based on ISO 11649 or a local scheme), the reference number is also available via the reference_number field.
debtor_account_additional_identification	[GenericIdentification]	false	All other debtor account identifiers provided by ASPSPs
creditor_account_additional_identification	[GenericIdentification]	false	All other creditor account identifiers provided by ASPSPs
exchange_rate	ExchangeRate	false	Provides details on the currency exchange rate and contract.
note	string	false	The internal note made by PSU
transaction_id	string	false	Identification used for fetching transaction details.This value can not be used to uniquely identify transactions and may change if the list of transactions is retrieved again. Null if fetching transaction details is not supported.
{
  "entry_reference": "5561990681",
  "merchant_category_code": "5511",
  "transaction_amount": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "creditor": {
    "name": "MyPreferredAisp",
    "postal_address": {
      "address_line": [
        "Mr Asko Teirila PO Box 511",
        "39140 AKDENMAA FINLAND"
      ],
      "address_type": "Business",
      "building_number": "4",
      "country": "FI",
      "country_sub_division": "Uusimaa",
      "department": "Department of resources",
      "post_code": "00123",
      "street_name": "Vasavagen",
      "sub_department": "Sub Department of resources",
      "town_name": "Helsinki"
    }
  },
  "creditor_account": {
    "iban": "FI0455231152453547"
  },
  "creditor_agent": {
    "bic_fi": "string",
    "clearing_system_member_id": {
      "clearing_system_id": "NZNCC",
      "member_id": 20368
    },
    "name": "string"
  },
  "debtor": {
    "name": "MyPreferredAisp",
    "postal_address": {
      "address_line": [
        "Mr Asko Teirila PO Box 511",
        "39140 AKDENMAA FINLAND"
      ],
      "address_type": "Business",
      "building_number": "4",
      "country": "FI",
      "country_sub_division": "Uusimaa",
      "department": "Department of resources",
      "post_code": "00123",
      "street_name": "Vasavagen",
      "sub_department": "Sub Department of resources",
      "town_name": "Helsinki"
    }
  },
  "debtor_account": {
    "iban": "FI0455231152453547"
  },
  "debtor_agent": {
    "bic_fi": "string",
    "clearing_system_member_id": {
      "clearing_system_id": "NZNCC",
      "member_id": 20368
    },
    "name": "string"
  },
  "bank_transaction_code": {
    "description": "Utlandsbetalning",
    "code": "12",
    "sub_code": "32"
  },
  "credit_debit_indicator": "CRDT",
  "status": "BOOK",
  "booking_date": "2020-01-03",
  "value_date": "2020-01-02",
  "transaction_date": "2020-01-01",
  "balance_after_transaction": {
    "currency": "EUR",
    "amount": "1.23"
  },
  "reference_number": "RF07850352502356628678117",
  "reference_number_schema": "BERF",
  "remittance_information": [
    "RF07850352502356628678117",
    "Gift for Alex"
  ],
  "debtor_account_additional_identification": {
    "identification": "12345678",
    "scheme_name": "CPAN"
  },
  "creditor_account_additional_identification": {
    "identification": "12345678",
    "scheme_name": "BBAN"
  },
  "exchange_rate": {
    "unit_currency": "EUR",
    "exchange_rate": "string",
    "rate_type": "AGRD",
    "contract_identification": "string",
    "instructed_amount": {
      "currency": "EUR",
      "amount": "1.23"
    }
  },
  "note": "string",
  "transaction_id": "string"
}

TransactionStatus

Enumerated Values
Value	Description
BOOK	Accounted transaction (ISO20022 Closing Booked)
CNCL	Cancelled transaction
HOLD	Account hold
OTHR	Transaction with unknown status or not fitting the other options
PDNG	Instant Balance Transaction (ISO20022 Expected)
RJCT	Rejected transaction
SCHD	Scheduled transaction
"BOOK"

TransactionsFetchStrategy

Enumerated Values
Value	Description
default	Fetches transactions as requested by the user by passing the date_from and date_to parameters to an ASPSP. If not date_from or date_to is passed, then meaningful defaults are used.
longest	Tries to find the longest possible period of transactions and fetches transactions for that period. Passed date_from is also taken into account. This strategy may use extra ASPSP calls. date_to is ignored in this strategy.
"default"

UnstructuredRemittanceInformation

Properties
Name	Type	Required	Description
UnstructuredRemittanceInformation	[string]	false	Payment details. For credit transfers may contain free text, reference number or both at the same time (in case Extended Remittance Information is supported). When it is known that remittance information contains a reference number (either based on ISO 11649 or a local scheme), the reference number is also available via the referenceNumber field of the Transaction data structure.
[
  "string"
]

Usage

Enumerated Values
Value	Description
ORGA	professional account
PRIV	private personal account
"ORGA"
