# frontend

## dev

- `cp .env.example .env` and fill it out
- `yarn`

## deploy

- set up Vercel project
- add .env variables to Vercel project Settings > Environment Variables

## tips

### Using Google Docs sync in Chrome Debugger

Google won't accept OAuth flow in the Chrome Debugger. However, you can launch
the local website in normal Chrome, run the OAuth flow, and that environment
will transfer over to the Debugger.
