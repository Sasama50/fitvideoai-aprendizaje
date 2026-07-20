This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Checklist de despliegue

Antes de dar por buena una release en Vercel Production, verificar en el
dashboard de Vercel (Project Settings → Environment Variables → Production)
que ninguna de estas claves sea una clave de test/sandbox:

- `STRIPE_SECRET_KEY` debe empezar por `sk_live_`, no `sk_test_`.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` debe empezar por `pk_live_`, no `pk_test_`.
- `STRIPE_WEBHOOK_SECRET` debe corresponder al webhook endpoint registrado en
  modo **Live** en el dashboard de Stripe, no al de modo Test.
- `HEYGEN_API_KEY`, `ANTHROPIC_API_KEY`, `RESEND_FROM_EMAIL` y cualquier otra
  clave de proveedor externo: confirmar que es la clave/dominio de producción
  real, no una de desarrollo/sandbox copiada sin querer desde `.env.local`.
- Stripe Live: webhook configurado, pero la cuenta NO está activada para
  cobros reales (falta verificación de negocio en el onboarding de Stripe).
  No asumir que el modo Live está operativo hasta completar esa activación.

Este es un fallo recurrente en este proyecto (ha pasado ya con varias claves
distintas) — revisarlo explícitamente en cada release, no asumir que quedó
bien configurado la vez anterior.
