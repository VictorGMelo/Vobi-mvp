# Vobi Service — Checklist de Revisão (MVP)

Validação de uma nova vertical da Vobi: empresas de serviços técnicos pós-instalação.
Fluxo coberto: **revisão de ar-condicionado já instalado**.

## Stack

| Camada    | Ferramenta                                  |
|-----------|---------------------------------------------|
| Framework | Next.js 14 (App Router)                     |
| Auth + DB | Supabase (Postgres + RLS + Storage)         |
| UI        | Tailwind CSS — tokens Vobi                  |
| IA        | Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| E-mail    | Resend                                      |
| Deploy    | Vercel                                      |

---

## 1. Pré-requisitos

- Node.js 18+
- Conta [Supabase](https://supabase.com)
- Chave [Anthropic](https://console.anthropic.com)
- Chave [Resend](https://resend.com) (domínio verificado para produção; em dev, qualquer destino do dono da conta)
- Vercel (opcional, para deploy)

---

## 2. Configuração local

### 2.1 Instalar
```bash
npm install
```

### 2.2 Variáveis de ambiente
Crie `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Vobi <onboarding@resend.dev>   # ou seu domínio verificado
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2.3 Banco de dados Supabase
1. Supabase → **SQL Editor** → **New query** → cole `supabase-schema.sql` → **Run**.
   - Cria tabelas `profiles`, `servicos`, `checklist_items`, `service_photos`, RLS, e o bucket Storage `service-photos`.
2. Supabase → **Authentication** → **Providers** → **Email**: confirme que o e-mail/senha está ativo.
3. Supabase → **Authentication** → **Sessions** → defina **JWT expiry** para `86400` (24h, conforme PRD §7).

### 2.4 Rodar
```bash
npm run dev
```
Abra http://localhost:3000.

---

## 3. Fluxo principal (PRD)

1. **Login** → técnico autentica com e-mail/senha.
2. **Nova visita** (`/servicos/novo`) → cliente, endereço, e-mail (opcional para envio automático), telefone, BTUs, nº de série, observação inicial.
3. **Checklist** (`/servicos/[id]`) com 4 categorias × 15 itens (PRD §8). Cada item: **OK / Ajustado / Problema**. Itens "Problema" exigem observação. Itens numéricos (temperatura °C, pressão psi) aceitam o valor medido.
4. **Fotos** — até 5 (JPG/PNG/HEIC, 5MB com compressão client-side), no Supabase Storage.
5. **Diagnóstico IA** — botão habilitado a partir de **50% marcados**. Sugestão técnica em 2-3 linhas, com disclaimer.
6. **Finalizar** — botão exige **100% marcados** + observação em todo "Problema". Modal pede status final: `OK`, `Ajuste Realizado` ou `Retorno Necessário`. Após confirmação:
   - Serviço fica **read-only**.
   - IA gera **resumo natural** para o cliente leigo.
   - `public_token` é criado.
   - **E-mail é enviado automaticamente** ao cliente (Resend) se houver `cliente_email`.
7. **Resumo** (`/servicos/[id]/resumo`) — link público, status do envio, **reenvio manual** se falhou.
8. **Página pública** (`/servico/public/[token]`) — sem login, sem expiração, mostra resumo, fotos e checklist.

---

## 4. Estrutura

```
app/
├── layout.tsx, page.tsx, globals.css
├── (auth)/login, (auth)/register
├── (app)/
│   ├── layout.tsx (auth guard + Sidebar responsiva)
│   └── servicos/
│       ├── page.tsx                         (lista — em andamento + finalizados)
│       ├── novo/page.tsx                    (criar visita)
│       └── [id]/
│           ├── page.tsx                     (checklist + fotos + finalize)
│           ├── ChecklistItem.tsx
│           ├── Photos.tsx
│           ├── DiagnoseButton.tsx           (≥50%, disclaimer)
│           ├── FinalizeDialog.tsx           (modal status final)
│           └── resumo/
│               ├── page.tsx
│               └── ResumoActions.tsx        (regerar resumo, copiar link, reenviar e-mail)
├── servico/public/[token]/page.tsx          (visão pública)
└── api/
    ├── ai/diagnose/route.ts                 (POST — sugestão técnica)
    ├── ai/summarize/route.ts                (POST — resumo natural)
    ├── checklist/update/route.ts            (PATCH — status/obs/numeric_value, bloqueia se finalizado)
    ├── servicos/finalize/route.ts           (POST — finaliza, gera token, dispara e-mail)
    └── email/send-summary/route.ts          (POST — reenvio manual)

components/ui/
├── Button, Input, Card, Badge, Sidebar (responsiva md)

lib/
├── ai.ts                                    (Anthropic client + prompts diagnose/resumo)
├── email.ts                                 (Resend + template HTML Vobi)
├── types.ts
├── utils.ts
├── supabase/{client,server}.ts
└── data/checklist-template.ts               (PRD §8 — 4 categorias × 15 itens)

middleware.ts
supabase-schema.sql
```

---

## 5. Deploy Vercel

1. Suba o repositório e importe na Vercel.
2. Variáveis de ambiente: as mesmas de `.env.local`, atualizando `NEXT_PUBLIC_BASE_URL` para o domínio Vercel após o primeiro deploy.

---

## 6. Troubleshooting

| Sintoma | Causa provável |
|---------|----------------|
| `Cannot find module '@/lib/...'` | `tsconfig.json` sem `paths` |
| 401 nas API routes | Cookies do Supabase não chegando — confira `middleware.ts` |
| Upload de foto falha | Bucket `service-photos` não criado, ou Storage policies não aplicadas — rode `supabase-schema.sql` de novo |
| E-mail não chega | `RESEND_API_KEY` ausente ou `RESEND_FROM_EMAIL` com domínio não verificado |
| Diagnóstico IA não aparece | Marque ≥50% dos itens primeiro |
| "Serviço finalizado (read-only)" | Esperado — finalização trava o serviço (PRD CA-US-08) |
