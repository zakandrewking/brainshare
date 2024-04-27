# Functions

## dev

`cp .env.example .env.local` and fill it in

## deploy

```bash
supabase secrets set --env-file .env.production
supabase functions deploy $FN_NAME
```
