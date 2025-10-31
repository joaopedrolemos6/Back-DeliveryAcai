Resumo
API Node + Express + TS para Delivery de Açaí — V1 com checkout apenas contra-entrega (CASH/PIX), raio 5 km, taxa R$ 5,00, mínimo R$ 20,00, horários por dia, sem integrações externas.

Requisitos

Node 18+

MySQL 8+

NPM/Yarn

MySQL Workbench (para executar o schema/seed manualmente)

Setup

Clone o repo e crie .env a partir de .env.example.

Instale deps: npm i.

Banco (MySQL Workbench):

Abra sql/schema.sql e Execute All.

Gere um hash bcrypt para a senha do admin (ex: admin123):
node -e "require('bcrypt').hash('admin123',12).then(h=>console.log(h))"

Substitua <<BCRYPT_HASH_ADMIN_PASSWORD>> em sql/seed.sql pelo hash gerado.

Execute sql/seed.sql.

Rode a API:

Dev: npm run dev

Prod: npm run build && npm start

Fluxos

Auth: /auth/register, /auth/login, /auth/refresh, /auth/logout

Catálogo: /products, /products/:id, /categories

Endereços: CRUD autenticado

Checkout: POST /orders → valida loja aberta, raio (5km), mínimo (R$20) e aplica taxa fixa (R$5).

Admin: PATCH /admin/orders/:id/status

ao CONFIRMED, faz baixa de estoque (quantidade dos itens) e audita a transição.

Decisões de Arquitetura (resumo)

Camadas (Controllers → Usecases → Repositories).

JWT access + refresh rotacionado (tabela refresh_tokens com jti).

Tabelas dedicadas para horários (store_hours) e config gerais (store_settings) incluindo coordenadas para geofiltro.

Logs pino + correlationId por request.

Zod nos boundaries (reject unknown + sanitize).

Sem Prisma; SQL parametrizado com mysql2/promise.

TODOs (próximos passos / V1.1+)

Recuperação de senha via e-mail.

Painel de admin com filtros avançados e export.

Eventual fila assíncrona (notificações e auditoria estendida).

Idempotência de criação de pedido (chave do cliente) — opcional.