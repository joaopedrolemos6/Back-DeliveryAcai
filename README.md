Documentação Técnica – API Delivery Açaí
Visão Geral da API

A API Delivery Açaí é uma interface backend para um sistema de delivery de açaí, fornecendo funcionalidades de cadastro e autenticação de usuários, exibição de produtos e categorias disponíveis, gerenciamento de pedidos de compra e controle de configurações gerais da loja (como área de entrega). A API é organizada em endpoints REST seguindo a versãoamento v1 (por exemplo, /v1/usuarios, /v1/produtos, etc.). As principais funcionalidades incluem:

Autenticação de Usuários: registro de novos clientes, login com geração de token JWT, refresh de tokens e logout.

Consulta de Produtos e Categorias: listagem de produtos de açaí e seus complementos, categorizados, com detalhes como descrição, preço e imagem.

Gerenciamento de Pedidos: clientes podem criar pedidos contendo itens (produtos e quantidades desejadas), escolhendo um endereço de entrega e método de pagamento; administradores podem visualizar todos os pedidos e atualizar seu status.

Gerenciamento de Endereços: clientes podem cadastrar múltiplos endereços de entrega (rua, bairro, CEP, etc.) para seus pedidos.

Configurações da Loja: definição de parâmetros globais, como raio de entrega máximo (usado para validar se um endereço está na área atendida) e possivelmente status de loja aberta/fechada, dentre outros.

A API utiliza JSON para representação de dados nas requisições e respostas. A autenticação é baseada em JWT (JSON Web Token) e o controle de acesso se dá por meio de papéis de usuário: um usuário pode ser do tipo CLIENTE (usuário comum, consumidor) ou ADMIN (administrador da plataforma). A seguir detalhamos os mecanismos de autenticação, cada endpoint disponível (com suas regras de acesso, exemplos e códigos de erro) e a estrutura de dados/banco de dados subjacente.

Autenticação e Autorização (JWT)

A API implementa autenticação via JWT para proteger endpoints sensíveis. O fluxo geral consiste em:

Registro (Signup): Aberto a todos. Um novo usuário do tipo cliente se cadastra fornecendo dados como nome, email e senha. Em caso de sucesso, o usuário é criado no banco de dados e já pode realizar login.

Login: Aberto a usuários registrados. O cliente fornece suas credenciais (email e senha) e, se válidas, a API retorna um Access Token JWT de curta duração e um Refresh Token JWT de longa duração【13†】. O Access Token deve ser enviado nas próximas requisições autenticadas para autorizar o acesso.

Access Token: É um JWT assinado contendo informações do usuário (ID, papel etc.). Deve ser enviado no header HTTP Authorization em formato Bearer <token> para endpoints que requerem autenticação. Ele expira após um intervalo curto (ex: 15 minutos), exigindo obtenção de um novo token via refresh ao expirar.

Refresh Token: JWT de longa duração usado para obter novos access tokens sem exigir novo login. Geralmente tem validade mais extensa (ex: dias). Não deve ser usado para acessar recursos diretamente. É retornado no login junto com o access token.

Refresh (Renovação de Token): Endpoint dedicado onde o usuário envia seu refresh token válido (geralmente no corpo da requisição) e a API, se o token for válido e não revogado, responde com um novo par access token + refresh token【13†】. Esse processo permite que o usuário permaneça logado sem precisar submeter credenciais novamente.

Logout: Endpoint onde o usuário autentica a intenção de sair/invalidar sua sessão. A API espera receber o refresh token vigente (geralmente no corpo da requisição). Em seguida, esse refresh token é invalidado (removido da base ou marcado como revogado), impedindo seu uso futuro. Assim, mesmo que o access token atual ainda não tenha expirado, a realização do logout garante que nenhum novo token possa ser gerado com aquele refresh token. O logout efetivamente encerra a sessão do usuário no dispositivo.

Estrutura JWT: Ambos tokens JWT são gerados pelo servidor usando uma chave secreta. O payload do access token inclui identificação do usuário e seu papel (CLIENT ou ADMIN) para uso na autorização. Por exemplo, um payload JWT pode conter:

{
  "userId": "11111111-1111-1111-1111-111111111111",
  "role": "ADMIN",
  "exp": 1728000000  // timestamp de expiração
}


No caso do refresh token, o payload pode ser similar ou mais simplificado (podendo incluir apenas um ID de usuário e um ID de token/sessão, dependendo da implementação).

Segurança: Os tokens JWT devem ser mantidos em sigilo pelo cliente. O access token, por ter curta duração, é geralmente armazenado em memória ou Secure Storage, enquanto o refresh token, de longa duração, deve ser armazenado com segurança (por exemplo, HttpOnly cookie ou storage seguro) para evitar roubo e uso indevido. Além disso, nas respostas de login/refresh, a API indica sucesso ou falha de forma consistente – por exemplo, retornando um campo success: true/false e, em caso de erro, códigos e mensagens adequadas (como AUTH_UNAUTHORIZED para credenciais inválidas ou INTERNAL_ERROR para erros do servidor).

Exemplo – Fluxo de autenticação:

Registro: O usuário faz POST /v1/auth/register com JSON contendo nome, email e senha. Se os dados forem válidos (e-mail não existe ainda, etc.), obtém sucesso (201 Created) ou mensagens de erro se houver problemas (por exemplo, email já cadastrado).

Login: Em seguida, faz POST /v1/auth/login com JSON de credenciais. Exemplo de corpo:

{
  "identifier": "joao@gmail.com",
  "password": "123456"
}


Em caso de sucesso, a resposta traz código 200 e um JSON contendo os tokens. Exemplo de resposta de login bem-sucedido:

{
  "success": true,
  "data": {
    "accessToken": "<JWT_ACCESS_TOKEN>",
    "refreshToken": "<JWT_REFRESH_TOKEN>"
  }
}


Aqui accessToken e refreshToken são strings JWT normalmente longas【13†】. Esses tokens devem ser armazenados pelo cliente para uso posterior. Se as credenciais estiverem incorretas, a resposta será um erro 401 Unauthorized com um corpo indicando falha, por exemplo:

{
  "success": false,
  "error": {
    "code": "AUTH_UNAUTHORIZED",
    "message": "Credenciais inválidas."
  }
}


Acesso a endpoints protegidos: O cliente então envia o accessToken no header Authorization para acessar recursos protegidos (ex: listar seus pedidos, cadastrar endereço, etc). Exemplo de header:
Authorization: Bearer <JWT_ACCESS_TOKEN>

Refresh Token: Quando o access token expirar (recebendo um 401 indicando token inválido ou expirado), o cliente usa o refresh token. Ele faz POST /v1/auth/refresh enviando no corpo JSON o refresh token obtido no login:

{
  "refreshToken": "<JWT_REFRESH_TOKEN>"
}


Se o token for válido, a API retorna 200 OK com novo par de tokens (geralmente um novo access token e possivelmente um novo refresh token rotacionado). Se o refresh token já estiver expirado ou inválido (por exemplo, já usado em logout ou não reconhecido), a resposta será um erro 401 ou 403 (dependendo da política), informando que o refresh token não é mais aceito.

Logout: Para finalizar a sessão, o cliente autenticado pode fazer POST /v1/auth/logout. Este endpoint também espera o refresh token atual no corpo:

{
  "refreshToken": "<JWT_REFRESH_TOKEN>"
}


Em caso de sucesso, retorna um status 204 No Content (ou 200 com success=true) indicando que o refresh token foi invalidado. Chamadas subsequentes usando aquele token (se alguém tentar reutilizar) não serão mais aceitas. Esse endpoint requer autenticação (é recomendado que o usuário esteja autenticado para chamar logout, embora o essencial seja o refresh token válido). Após logout, o cliente deve descartar também o seu access token localmente.

Validação de Acesso (Autorização): Além da autenticação via JWT, a API verifica o papel (role) do usuário contido no token para autorizar determinadas rotas. Ou seja, mesmo com token válido, um CLIENTE não pode acessar rotas exclusivas de ADMIN e vice-versa. A seguir, cada endpoint listará quais papéis têm permissão.

Endpoints da API

Abaixo está a documentação detalhada de cada endpoint, organizada por funcionalidade. Para cada endpoint, são fornecidos: caminho, método HTTP, descrição, quem pode acessar (CLIENTE autenticado, ADMIN autenticado ou público), exemplos de requisição/response e códigos de erro comuns.

1. Endpoints de Autenticação (/v1/auth/...)

Estes endpoints lidam com registro e gerenciamento de sessão de usuários.

POST /v1/auth/register – Registrar novo usuário

Descrição: Cria um novo usuário no sistema. Usado para cadastro de clientes.

Acesso: Público (não requer token). Deve ser usado apenas por usuários não logados.

Corpo da Requisição: JSON com os dados do novo usuário. Campos esperados:

name (string) – Nome do usuário.

email (string) – Email do usuário (deve ser único no sistema).

password (string) – Senha desejada.
(Exemplo: {"name": "João Pedro", "email": "joao@gmail.com", "password": "123456"} )

Resposta de Sucesso: HTTP 201 Created. Retorna os dados básicos do usuário criado ou uma mensagem de sucesso. Por segurança, a senha nunca é retornada. Exemplo:

{
  "id": "de305d54-75b4-431b-adb2-eb6b9e546014",
  "name": "João Pedro",
  "email": "joao@gmail.com",
  "role": "CLIENT"
}


(Possivelmente o servidor pode já retornar um JWT para evitar passo extra de login, mas no design atual espera-se que o cliente faça login manualmente após registro, pois não há indicação de token aqui.)

Erros Comuns:

400 Bad Request – Dados inválidos (por exemplo, email em formato incorreto, campos obrigatórios faltando). Pode retornar um objeto de erro com detalhes (ex: código VALIDATION_ERROR).

409 Conflict – Email já cadastrado no sistema. Retorna erro indicando conflito/duplicação.

500 Internal Server Error – Qualquer erro inesperado no servidor ao criar usuário (ex: falha de banco). O corpo pode trazer um código INTERNAL_ERROR e um correlationId para rastrear o incidente.

POST /v1/auth/login – Autenticar (login)

Descrição: Valida as credenciais do usuário e inicia uma sessão, emitindo tokens JWT.

Acesso: Público (não requer token).

Corpo da Requisição: JSON com credenciais:

identifier (string) – Identificador do usuário. Pode ser o email (ou telefone, se implementado) do usuário.

password (string) – Senha.
(Exemplo: {"identifier": "joao@gmail.com", "password": "123456"} ).

Resposta de Sucesso: HTTP 200 OK. Retorna um JSON com success: true e os tokens de acesso:

{
  "success": true,
  "data": {
    "accessToken": "<jwt_access_token>",
    "refreshToken": "<jwt_refresh_token>"
  }
}


O access token é uma string JWT (ex: eyJhbGciOi...) que deve ser usado nas próximas requisições autenticadas. O refresh token é uma JWT de atualização. Ambos tokens podem vir acompanhados do tipo (Bearer) ou outras informações se necessário, mas geralmente são strings puras no JSON.

Erros Comuns:

400 Bad Request – Se o JSON estiver malformado ou faltando campos.

401 Unauthorized – Credenciais inválidas (email/senha incorretos). O corpo virá com success: false e detalhes do erro, por exemplo código AUTH_UNAUTHORIZED.

500 Internal Server Error – Erro inesperado durante o login (ex: problema ao gerar token). Exemplo de retorno:

{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Erro inesperado no login."
  }
}

POST /v1/auth/refresh – Refresh Token

Descrição: Gera um novo access token (e possivelmente um novo refresh token) a partir de um refresh token válido. Permite prolongar a sessão sem pedir senha novamente.

Acesso: Público no sentido de não exigir um access token ativo (já que geralmente o access token pode ter expirado quando se usa este endpoint). Requer o refresh token válido fornecido no corpo.

Corpo da Requisição: JSON com:

refreshToken (string) – O token de refresh fornecido no login/último refresh.
(Exemplo: {"refreshToken": "<jwt_refresh_token>"} ).

Resposta de Sucesso: HTTP 200 OK. Retorna um novo par de tokens (accessToken e refreshToken), similar à resposta do login. Exemplo:

{
  "success": true,
  "data": {
    "accessToken": "<novo_jwt_access_token>",
    "refreshToken": "<novo_jwt_refresh_token>"
  }
}


O cliente deve substituir os tokens antigos por esses novos. (Observação: Se a implementação não rotacionar refresh tokens, o refreshToken novo pode ser igual ao antigo; porém, por segurança, é comum rotacionar).

Erros Comuns:

400 Bad Request – Caso o refresh token não seja fornecido no corpo ou esteja em formato inválido.

401/403 Unauthorized/Forbidden – Se o refresh token for inválido, expirou ou já tiver sido revogado (ex.: se já foi usado em um logout). O retorno pode ser success: false com código de erro como AUTH_UNAUTHORIZED ou TOKEN_EXPIRED.

500 Internal Server Error – Para falhas imprevistas (ex: erro de assinatura, etc.).

POST /v1/auth/logout – Logout (Encerrar sessão)

Descrição: Invalida o refresh token atual, efetivamente encerrando a sessão do usuário. Opcionalmente, o servidor também pode invalidar o access token presente (embora geralmente basta não aceitar mais o refresh).

Acesso: Protegido – é recomendado que apenas usuários autenticados utilizem (ou seja, envie também um header Authorization com o access token junto, para confirmar a identidade). Contudo, o principal requisito é fornecer um refresh token válido para revogação.

Corpo da Requisição: JSON contendo:

refreshToken (string) – O refresh token a ser invalidado. (Exemplo: {"refreshToken": "<jwt_refresh_token>"} ).

Resposta de Sucesso: HTTP 200 OK (ou 204 No Content). Pode retornar um JSON simples confirmando sucesso, por exemplo: {"success": true}. Após isso, o refresh token enviado não poderá mais ser usado. O cliente deve descartar os tokens que possui localmente.

Erros Comuns:

400 Bad Request – Corpo ausente ou token em formato inválido.

401 Unauthorized – Se o user não estiver autenticado (por exemplo, se exigido token no header e não enviado ou inválido).

403 Forbidden – Se o refresh token fornecido não for válido ou já foi deslogado.

500 Internal Server Error – Em caso de erro imprevisto ao processar o logout (ex: falha de conexão ao banco na hora de marcar token como revogado).

2. Endpoints de Usuários e Perfis

(Nota: Além dos endpoints de autenticação acima, a API pode ter endpoints para gerenciar usuários, mas no escopo atual apenas cadastro/login/logout são expostos para clientes. Não há, por exemplo, um endpoint público para listar todos usuários, exceto possivelmente endpoints de administrador.)

Para ADMINs, se necessário, poderia haver:

GET /v1/users – Listar todos os usuários cadastrados (somente ADMIN).

GET /v1/users/{id} – Obter detalhes de um usuário específico (somente ADMIN ou o próprio usuário via token).

PUT /v1/users/{id} – Atualizar dados de um usuário (somente ADMIN ou o próprio, em casos permitidos).

DELETE /v1/users/{id} – Remover um usuário (somente ADMIN).

Entretanto, tais endpoints não foram explicitamente detalhados no repositório. Provavelmente apenas administradores via banco de dados gerenciam usuários (exceto registro). Portanto, não nos aprofundaremos nesses endpoints não confirmados.

3. Endpoints de Produtos (/v1/products)

Os endpoints de produtos permitem acessar e gerenciar os produtos de açaí e adicionais disponíveis na loja.

GET /v1/products – Listar produtos

Descrição: Retorna a lista de todos os produtos disponíveis na loja, com suas informações detalhadas. Os produtos podem incluir açaís em tamanhos/versões diferentes e complementos (adicionais). Geralmente utilizados pelo app cliente para mostrar o menu.

Acesso: Público (em muitos casos, permite exibir o catálogo mesmo sem login). Se a implementação exigir login, então CLIENTE ou ADMIN autenticados podem acessar. (Pressupondo a política: aqui vamos considerar aberto a todos, pois não envolve dados sensíveis.)

Exemplo de Chamada: GET /v1/products

Resposta de Sucesso: HTTP 200 OK. O corpo é um array JSON de objetos de produto. Cada objeto de produto pode conter:

id – UUID do produto.

name – Nome do produto (ex: "Açaí 300ml").

description – Descrição do produto (ex: "Copo de açaí 300ml com banana e granola").

price – Preço do produto (possivelmente em centavos ou no formato decimal). No banco, por exemplo, é armazenado em centavos como um inteiro (campo price_cents)【59†】.

imageUrl – URL de uma imagem ilustrativa do produto (ou null se não houver).

categoryId – ID da categoria à qual o produto pertence (referenciando um objeto categoria, veja endpoints de categoria).

isAvailable – (boolean) indica se o produto está disponível para pedido (útil para o admin retirar temporariamente um item do menu).

Campos de auditoria: createdAt, updatedAt – timestamps de criação/atualização do registro.

Exemplo de resposta (lista reduzida):

[
  {
    "id": "c1111111-1111-1111-1111-111111111111",
    "name": "Açaí 300ml",
    "description": "Copo de açaí 300ml com banana e granola",
    "price": 15.00,
    "imageUrl": "https://images.unsplash.com/photo1.jpg",
    "categoryId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "isAvailable": true
  },
  {
    "id": "c3333333-3333-3333-3333-333333333333",
    "name": "Granola",
    "description": "Porção de granola artesanal",
    "price": 5.00,
    "imageUrl": "https://images.unsplash.com/photo_granola.jpg",
    "categoryId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "isAvailable": true
  }
]


(Obs: Os preços foram convertidos para formato decimal com ponto para clareza; a API real pode retornar centavos ou string monetária. No banco vemos 1500 para R$15.00, 500 para R$5.00, etc. O importante é documentar a unidade.)

Erros Comuns:

500 Internal Server Error – Qualquer erro inesperado ao buscar os produtos (ex: falha de conexão com DB). O retorno padrão de erro interno pode trazer código INTERNAL_SERVER_ERROR com mensagem genérica.

401 Unauthorized – (Se a rota exigir autenticação e o token estiver faltando ou inválido).

GET /v1/products/{id} – Detalhar um produto (opcional)

Descrição: Retorna os detalhes de um produto específico pelo seu ID. Não é estritamente necessário se o cliente já obtém todos via listagem, mas pode existir para atualizar dados em tempo real ou pegar informação de um item específico.

Acesso: Público ou Autenticado, similar ao GET /products.

Resposta de Sucesso: HTTP 200. Corpo contendo o objeto do produto requisitado (mesmos campos descritos acima). Se o ID não existir, deve retornar 404.

Erros Comuns:

404 Not Found – Produto com ID especificado não existe.

400 Bad Request – ID malformado (não é um UUID válido, por exemplo).

500 Internal Server Error – Erro inesperado.

POST /v1/products – Cadastrar novo produto

Descrição: Adiciona um novo produto ao catálogo da loja. Geralmente usado por um administrador via painel para incluir um novo sabor de açaí ou complemento.

Acesso: Protegido (ADMIN somente). Clientes não têm permissão para criar produtos.

Corpo da Requisição: JSON com os dados do produto a ser criado:

name (string, obrigatório) – Nome do produto.

description (string, opcional) – Descrição detalhada.

price (number, obrigatório) – Preço do produto (em decimal ou centavos).

imageUrl (string, opcional) – URL da imagem do produto.

categoryId (UUID, obrigatório) – ID da categoria em que o produto se encaixa (deve corresponder a uma categoria existente).

isAvailable (boolean, padrão true) – Se omitido, assume true (produto ativo).
(Exemplo: {"name": "Açaí 700ml", "description": "Copo de açaí 700ml com adicionais", "price": 25.00, "imageUrl": "https://imgs.com/acai700.png", "categoryId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"} ).

Resposta de Sucesso: HTTP 201 Created. Retorna o objeto do produto criado com suas informações e ID gerado. Exemplo:

{
  "id": "d4444444-4444-4444-4444-444444444444",
  "name": "Açaí 700ml",
  "description": "Copo de açaí 700ml com adicionais",
  "price": 25.00,
  "imageUrl": "https://imgs.com/acai700.png",
  "categoryId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "isAvailable": true,
  "createdAt": "2025-10-01T12:00:00Z",
  "updatedAt": "2025-10-01T12:00:00Z"
}


Erros Comuns:

400 Bad Request – Dados faltantes ou inválidos (ex: campos obrigatórios não fornecidos, preço negativo, UUID de categoria inválido). Pode retornar erro de validação com detalhes.

401 Unauthorized – Se o usuário não estiver autenticado.

403 Forbidden – Se o usuário autenticado for CLIENT e tentar usar este endpoint (falha de autorização por papel).

404 Not Found – Se a categoryId fornecida não existe no sistema (o servidor pode retornar 400 ou 404, dependendo de como trata referência inválida).

500 Internal Server Error – Falha inesperada ao criar (ex: erro no banco). Se o nome do produto tiver que ser único, um 409 Conflict pode ocorrer caso haja duplicata.

PUT /v1/products/{id} – Atualizar produto

Descrição: Atualiza os dados de um produto existente (nome, descrição, preço, disponibilidade, etc.).

Acesso: Protegido (ADMIN somente).

Corpo da Requisição: JSON com os campos a serem alterados. Pode incluir qualquer campo permitido no cadastro (name, description, price, imageUrl, categoryId, isAvailable). Campos não presentes permanecem inalterados.

Resposta de Sucesso: HTTP 200 OK. Retorna o objeto do produto atualizado ou uma mensagem de sucesso.

Erros Comuns:

400 Bad Request – Formato de ID inválido ou dados de atualização inválidos.

401/403 – Não autenticado ou não autorizado (se não admin).

404 Not Found – ID do produto não existe.

409 Conflict – Tentativa de mudar para um nome já existente (se houver restrição de unicidade).

500 Internal Server Error – Erro na atualização.

DELETE /v1/products/{id} – Remover produto

Descrição: Remove um produto do catálogo (pode ser deleção real ou apenas marcar como indisponível, conforme a implementação). Aqui assumimos deleção lógica ou física no banco.

Acesso: Protegido (ADMIN somente).

Resposta de Sucesso: HTTP 204 No Content (sem corpo) indicando que o produto foi removido com sucesso. Alternativamente, HTTP 200 com um body {"success": true}.

Erros Comuns:

401/403 – Não autorizado (somente admin pode remover).

404 Not Found – Produto não encontrado pelo ID (pode já ter sido removido).

500 Internal Server Error – Erro ao remover (por exemplo, falha no banco, ou violação de integridade referencial se itens de pedido referenciam o produto – nesses casos a API poderia retornar 400 informando que não pode remover um produto que tem pedidos associados, se esse for o caso).

4. Endpoints de Categorias (/v1/categories)

As categorias servem para agrupar os produtos (por exemplo, categorias "Açaí Tradicional" e "Complementos" conforme o domínio da aplicação).

GET /v1/categories – Listar categorias

Descrição: Retorna todas as categorias de produto disponíveis. Cada produto pertence a uma categoria.

Acesso: Público (geralmente não sensível, pode ser acessado sem login).

Resposta de Sucesso: HTTP 200 OK. Corpo JSON como array de objetos categoria, cada um contendo:

id – UUID da categoria.

name – Nome da categoria (ex: "Açaí Tradicional", "Complementos").

sortOrder – (opcional) ordem de exibição (número inteiro, categorias com número menor podem ser exibidas primeiro).

Campos de auditoria (se existirem): createdAt, updatedAt.

Exemplo de resposta:

[
  {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "name": "Açaí Tradicional",
    "sortOrder": 1
  },
  {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "name": "Complementos",
    "sortOrder": 2
  }
]


Exemplo de categorias cadastradas no banco (duas categorias com seus IDs e nomes).

Erros Comuns:

500 Internal Server Error – Em caso de falha ao buscar as categorias.

(Se exigir login, 401, mas aqui assumido público.)

POST /v1/categories – Criar nova categoria

Descrição: Adiciona uma nova categoria de produtos (ex: um novo grupo de produtos).

Acesso: Protegido (ADMIN somente).

Corpo da Requisição: JSON com campos: name (obrigatório) e opcionalmente sortOrder.

Resposta de Sucesso: HTTP 201 Created. Objeto da categoria criada (com id gerado).

Erros Comuns:

400 Bad Request – Dados inválidos (ex: nome vazio).

401/403 – Não autorizado se não admin.

409 Conflict – Nome duplicado (se for único).

500 Internal Server Error – Falha inesperada.

PUT /v1/categories/{id} – Atualizar categoria

Descrição: Altera nome ou ordem da categoria existente.

Acesso: Protegido (ADMIN somente).

Corpo: JSON com name e/ou sortOrder novos.

Resposta: HTTP 200 OK com categoria atualizada.

Erros: Semelhantes a PUT products: 400 se ID inválido, 404 se não existe, 401/403 se não autorizado, etc.

DELETE /v1/categories/{id} – Remover categoria

Descrição: Remove uma categoria. Atenção: Se existirem produtos vinculados a essa categoria, eles precisariam ser removidos ou atualizados para outra categoria antes.

Acesso: Protegido (ADMIN somente).

Resposta de Sucesso: HTTP 204 No Content.

Erros Comuns:

403 Forbidden – se tentar remover categoria padrão ou que possui produtos associados (a API pode bloquear).

404 Not Found – ID não existe.

500 Internal Server Error – Falha na deleção.

5. Endpoints de Pedidos (/v1/orders)

Estes endpoints permitem que clientes façam pedidos e que administradores consultem e gerenciem esses pedidos.

POST /v1/orders – Criar novo pedido

Descrição: Endpoint para um cliente realizar um pedido de compra. Cria o pedido com itens, calculando total e registrando no sistema para processamento.

Acesso: Protegido (CLIENTE autenticado). (Um ADMIN poderia criar um pedido em nome de um cliente teoricamente, mas em geral pedidos são feitos por usuários clientes no app).

Corpo da Requisição: JSON representando o pedido. Deve incluir:

addressId (UUID) – Identificador do endereço de entrega selecionado pelo usuário para este pedido. O endereço deve estar previamente cadastrado pelo usuário.

paymentMethod (string) – Método de pagamento escolhido. Exemplo de valores: "PIX", "CASH", "CREDIT_CARD", etc., conforme os métodos suportados.

note (string, opcional) – Observação do pedido feita pelo cliente (ex: "Sem granola", "Entregar no portão dos fundos"). Caso o cliente não tenha observações, pode ser omitido ou string vazia.

items (array) – Lista de itens no pedido, onde cada item é um objeto contendo:

productId (UUID) – ID do produto escolhido.

quantity (int) – Quantidade desse produto no pedido.
(Exemplo de corpo:)

{
  "addressId": "17524994-5c67-428f-a7eb-ef8209235850",
  "paymentMethod": "PIX",
  "note": "Sem granola",
  "items": [
    { "productId": "c1111111-1111-1111-1111-111111111111", "quantity": 1 },
    { "productId": "c3333333-3333-3333-3333-333333333333", "quantity": 2 }
  ]
}


Esse exemplo representa um pedido com dois itens: 1 unidade do produto c111... (por ex. Açaí 300ml) e 2 unidades do produto c333... (por ex. Granola adicional), entregues no endereço especificado, pagamento via PIX e observação "Sem granola".

Resposta de Sucesso: HTTP 201 Created. Retorna os detalhes do pedido criado, incluindo um ID do pedido e resumos dos itens. Exemplo de resposta (campos principais):

{
  "id": "e7777777-7777-7777-7777-777777777777",
  "userId": "de305d54-75b4-431b-adb2-eb6b9e546014",
  "addressId": "17524994-5c67-428f-a7eb-ef8209235850",
  "paymentMethod": "PIX",
  "note": "Sem granola",
  "items": [
    {
      "productId": "c1111111-1111-1111-1111-111111111111",
      "name": "Açaí 300ml",
      "quantity": 1,
      "unitPrice": 15.00,
      "total": 15.00
    },
    {
      "productId": "c3333333-3333-3333-3333-333333333333",
      "name": "Granola",
      "quantity": 2,
      "unitPrice": 5.00,
      "total": 10.00
    }
  ],
  "totalPrice": 25.00,
  "status": "PENDING",
  "createdAt": "2025-11-10T16:00:00Z"
}


Na resposta, além dos dados enviados (endereço, método, itens), o servidor calculou e retornou:

id do pedido,

userId do cliente,

items detalhados incluindo nomes e preços (facilitando a conferência no front-end),

totalPrice calculado (soma dos itens),

status inicial do pedido (por exemplo, "PENDING" ou "EM PROCESSAMENTO"),

timestamp de criação.

Regras e Validações: Ao criar o pedido, a API deve validar:

Se o addressId pertence ao usuário que está fazendo o pedido e se o endereço existe. Caso contrário, retorna erro (provavelmente 400 ou 403).

Se todos os produtos em items existem e estão disponíveis. Se algum produto não for encontrado ou estiver indisponível (isAvailable=false), retorna erro 400 (Bad Request) possivelmente listando o item inválido.

Pode também validar restrições como valor mínimo de pedido ou área de entrega. Por exemplo, antes de aceitar, pode verificar a distância do endereço de entrega. O sistema possui lógica de validação de raio de entrega: se o endereço estiver fora do raio permitido, o pedido é rejeitado com erro 400 BAD_REQUEST e uma mensagem indicando entrega fora da área.

Erros Comuns:

400 Bad Request – Qualquer validação falhou. Exemplos: endereço inválido ou fora da área de cobertura (erro do tipo BAD_REQUEST com mensagem específica), falta de itens no pedido, formato do JSON incorreto.

401 Unauthorized – Se o usuário não estiver autenticado (token ausente/expirado). Nesse caso, o retorno pode ser um erro AUTH_UNAUTHORIZED indicando falta de autenticação.

403 Forbidden – Se, por hipótese, um ADMIN tentar criar pedido (pode não ser proibido, mas normalmente um ADMIN não precisaria fazer pedido; de toda forma, a lógica de backend poderia permitir já que um admin também tem um usuário).

404 Not Found – Se algum ID (endereço ou produto) não for encontrado, pode retornar 404.

500 Internal Server Error – Erro inesperado no servidor ao criar pedido. Por exemplo, um erro de código não tratado poderia retornar um stacktrace (como houve em testes, e.g. storeRepo is not defined ou addressesRepo.findById is not a function indicando falhas internas). Em produção, idealmente retornaria apenas um código INTERNAL_ERROR genérico.

GET /v1/orders – Listar pedidos

Descrição: Retorna a lista de pedidos feitos. O comportamento depende do papel do usuário:

Se o usuário for CLIENTE, provavelmente a API retorna apenas os pedidos daquele usuário (histórico pessoal).

Se for ADMIN, a API retorna todos os pedidos realizados na plataforma, para gerenciamento.

Acesso: Protegido. CLIENTE autenticado obtém seus pedidos; ADMIN autenticado obtém todos.

Exemplo de Chamada: GET /v1/orders (com token do usuário ou admin).

Resposta de Sucesso: HTTP 200 OK. O corpo é um array de pedidos (formato semelhante ao do POST /orders, mas possivelmente resumido). Por exemplo, um cliente poderia receber:

[
  {
    "id": "e7777777-7777-7777-7777-777777777777",
    "totalPrice": 25.00,
    "status": "PENDING",
    "createdAt": "2025-11-10T16:00:00Z"
  },
  {
    "id": "e8888888-8888-8888-8888-888888888888",
    "totalPrice": 15.00,
    "status": "DELIVERED",
    "createdAt": "2025-11-05T10:30:00Z"
  }
]


Ou seja, lista os pedidos do usuário, com status atual e valor. Já um ADMIN veria todos os pedidos com possivelmente identificação do cliente junto:

[
  {
    "id": "e7777777-7777-7777-7777-777777777777",
    "user": { "id": "...", "name": "João Pedro", "email": "joao@gmail.com" },
    "totalPrice": 25.00,
    "status": "PENDING",
    "createdAt": "2025-11-10T16:00:00Z"
  },
  {
    "id": "e8888888-8888-8888-8888-888888888888",
    "user": { "id": "...", "name": "Maria Silva", "email": "maria@example.com" },
    "totalPrice": 40.00,
    "status": "DELIVERED",
    "createdAt": "2025-11-09T12:00:00Z"
  },
  ...
]


(Note que a inclusão de detalhes do usuário em cada pedido para admin é conveniente para identificar quem fez, mas depende da implementação).

Erros Comuns:

401 Unauthorized – Se não fornecer token ou ele estiver inválido.

403 Forbidden – Se um cliente tentar ver pedidos de outro (a lógica do servidor deve filtrar automaticamente).

500 Internal Server Error – Em caso de erro geral na busca de pedidos.

GET /v1/orders/{id} – Detalhar um pedido específico

Descrição: Retorna os detalhes completos de um pedido identificado por {id}.

Acesso: Protegido. Um cliente só pode acessar se o pedido for seu; um admin pode acessar qualquer pedido.

Resposta de Sucesso: HTTP 200 com JSON do pedido (mesmo formato retornado no POST /orders). Isso permite ver itens, endereço, etc.

Erros Comuns:

401/403 – Token inválido ou usuário sem acesso a esse pedido (por exemplo, cliente tentando acessar pedido de outro cliente).

404 Not Found – Pedido não encontrado (ID não existe ou não pertence ao usuário no caso de cliente).

500 Internal Server Error – Falha interna.

PUT /v1/orders/{id} – Atualizar pedido (Status)

Descrição: Permite atualizar informações do pedido. Normalmente, clientes não podem alterar pedidos após criação (exceto possivelmente cancelamento antes de aprovado). Administradores usam esse endpoint para atualizar o status do pedido (ex: de "PENDING" para "CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERED", etc.). Também poderia permitir cancelar um pedido.

Acesso: Protegido. ADMIN pode alterar status de qualquer pedido; um CLIENTE talvez possa cancelar seu próprio pedido se ainda não processado (isso dependeria de lógica adicional).

Corpo da Requisição: JSON com campos a alterar. O principal seria:

status – Novo status do pedido (ex: "CONFIRMED", "CANCELLED"). O conjunto de status pode ser definido pela aplicação (por ex: PENDING, CONFIRMED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED).

(Opcionalmente, talvez permitir alterar endereço ou itens se fosse uma funcionalidade, mas geralmente não se edita pedido depois de feito, exceto status.)

Resposta de Sucesso: HTTP 200 OK, retornando o pedido atualizado (ou apenas confirmação). Por exemplo, após marcar como entregue:

{
  "id": "e7777777-7777-7777-7777-777777777777",
  "status": "DELIVERED",
  "updatedAt": "2025-11-10T17:00:00Z"
}


Erros Comuns:

400 Bad Request – Status inválido ou mudança não permitida (ex: tentar confirmar um pedido já cancelado, etc.).

401/403 – Se não admin tentando mudar status (ou cliente sem permissão).

404 Not Found – Pedido não encontrado.

500 Internal Server Error – Falha ao atualizar (ex: problemas de banco).

(Nota: Não havia indicação explícita no repositório sobre como o status do pedido é representado ou modificado, mas estas operações são típicas. Implementações simples podem não ter um PUT de pedido, mas pelo pedido do usuário de documentar, assumimos que existe ao menos para admin atualizar status.)

DELETE /v1/orders/{id} – Cancelar/Excluir pedido

Descrição: Cancela um pedido (se ele ainda não foi processado) ou remove-o. Essa funcionalidade depende de regras de negócio – possivelmente somente ADMIN poderia remover pedidos (por limpeza) ou marcar como cancelado.

Acesso: Protegido. Talvez CLIENTE possa chamar para cancelar seu próprio pedido se estiver em status PENDING; ADMIN pode cancelar qualquer pedido.

Resposta: HTTP 204 No Content em caso de sucesso (pedido cancelado/removido).

Erros Comuns: semelhantes aos acima (401/403/404/500), e possivelmente 400 se não puder cancelar devido ao estado atual.

6. Endpoints de Endereços (/v1/addresses)

Endpoints para gerenciar os endereços de entrega dos usuários. Cada usuário pode ter vários endereços cadastrados.

GET /v1/addresses – Listar endereços do usuário

Descrição: Retorna todos os endereços cadastrados pelo usuário autenticado. Permite que no aplicativo o usuário selecione ou gerencie seus locais de entrega.

Acesso: Protegido (CLIENTE autenticado). Um ADMIN poderia teoricamente listar endereços de qualquer usuário se passasse um parâmetro, mas não há indicação disso; assumimos que admin não precisa listar endereços de outros via API.

Resposta de Sucesso: HTTP 200. JSON array com endereços do usuário. Cada endereço inclui:

id – UUID do endereço.

street – Rua/Logradouro.

number – Número.

district – Bairro.

city – Cidade.

state – Estado (UF).

cep – CEP (código postal).

complement – Complemento (apartamento, referência, etc., se houver).

(Possivelmente latitude e longitude se geocodificado para uso interno de cálculo de distância, mas se presentes podem ou não ser retornados na API.)

Campos de auditoria: createdAt, updatedAt.

Exemplo de resposta:

[
  {
    "id": "17524994-5c67-428f-a7eb-ef8209235850",
    "street": "Av. Esperança",
    "number": "150",
    "district": "Tambaú",
    "city": "João Pessoa",
    "state": "PB",
    "cep": "58000-000",
    "complement": "Ap 302"
  },
  {
    "id": "99f5c3a0-1234-4d56-8910-111213141516",
    "street": "Rua das Amoras",
    "number": "20",
    "district": "Centro",
    "city": "João Pessoa",
    "state": "PB",
    "cep": "58040-000",
    "complement": ""
  }
]


Esse usuário tem dois endereços cadastrados.

Erros Comuns:

401 Unauthorized – Se não estiver logado.

500 Internal Server Error – Erro ao buscar endereços do banco.

POST /v1/addresses – Cadastrar novo endereço

Descrição: Adiciona um novo endereço à conta do usuário.

Acesso: Protegido (CLIENTE).

Corpo da Requisição: JSON com os campos do endereço: street, number, district, city, state, cep, complement (este último opcional). Todos campos de endereço são strings, exceto talvez number que pode ser string ou número se forem apenas dígitos. Exemplo:

{
  "street": "Av. Esperança",
  "number": "150",
  "district": "Tambaú",
  "city": "João Pessoa",
  "state": "PB",
  "cep": "58000-000",
  "complement": "Ap 302"
}


Resposta de Sucesso: HTTP 201 Created. Retorna o objeto do endereço criado, incluindo seu id gerado. Exemplo:

{
  "id": "17524994-5c67-428f-a7eb-ef8209235850",
  "street": "Av. Esperança",
  "number": "150",
  "district": "Tambaú",
  "city": "João Pessoa",
  "state": "PB",
  "cep": "58000-000",
  "complement": "Ap 302"
}


Observação: Em alguns casos, ao cadastrar um endereço a API pode realizar geocodificação para obter latitude/longitude para uso interno. Não há evidência de que retorne isso no JSON, então provavelmente não. Porém, internamente poderá salvar coordenadas para calcular distância de entrega.

Erros Comuns:

400 Bad Request – Dados inválidos (ex: CEP em formato errado, campos obrigatórios ausentes). Pode retornar erro de validação.

401 Unauthorized – Não autenticado.

500 Internal Server Error – Falha ao salvar no DB.

PUT /v1/addresses/{id} – Atualizar endereço

Descrição: Atualiza os dados de um endereço existente do usuário.

Acesso: Protegido (CLIENTE, proprietário do endereço).

Corpo: JSON com campos a modificar (mesma estrutura do cadastro, mas só enviar os que quer mudar).

Resposta: HTTP 200 com endereço atualizado.

Erros Comuns:

400 Bad Request – Formato de dados inválido.

401/403 – Usuário não autenticado ou tentando alterar endereço de outro usuário.

404 Not Found – Endereço não existe (ou não pertence ao usuário).

500 Internal Server Error – Falha interna.

DELETE /v1/addresses/{id} – Remover endereço

Descrição: Remove um endereço do usuário (ex: se ele não usa mais aquele local).

Acesso: Protegido (CLIENTE, proprietário).

Resposta: HTTP 204 No Content em caso de sucesso.

Erros Comuns:

401/403 – Não autorizado (endereço de outro usuário ou token inválido).

404 Not Found – Endereço não encontrado.

500 Internal Server Error – Falha ao deletar.

(Nota: Remover endereços que estejam associados a pedidos anteriores pode ser restrito dependendo da lógica – possivelmente permitido pois pedidos antigos manteriam cópia do endereço ou referência. A documentação não especifica isso, então assumimos remoção livre, já que o pedido guarda o endereço id mas pode referenciar um registro removido; ideal é que pedidos guardem uma cópia ou não permitam remover endereço usado recentemente.)

7. Endpoints de Configurações da Loja (/v1/store ou /v1/config)

A API possui configurações globais da loja, como por exemplo limitar a área de entrega e indicar se a loja está aberta ou fechada para pedidos.

GET /v1/store – Obter configurações da loja

Descrição: Retorna informações gerais da loja que podem ser relevantes para o aplicativo cliente. Isso pode incluir: se a loja/serviço de entrega está ativo no momento, horário de funcionamento, raio máximo de entrega, etc. O front-end pode usar isso para exibir mensagens do tipo "Loja fechada agora" ou "Endereços até 5km".

Acesso: Público. (Clientes e visitantes podem precisar saber se a loja está aberta antes de tentar pedir.)

Resposta de Sucesso: HTTP 200. Exemplo de corpo:

{
  "open": true,
  "openingHours": "10:00-20:00",
  "deliveryRadiusKm": 5,
  "storeAddress": "Av. Central, 123, João Pessoa - PB",
  "coordinates": { "lat": -7.11532, "lng": -34.861 } 
}


Aqui open indica se a loja está aceitando pedidos atualmente, openingHours poderia ser um texto ou objeto mais detalhado de horários, deliveryRadiusKm é o raio máximo de entrega em quilômetros, storeAddress e coordinates dão a localização da loja (usada internamente para cálculo de raio).

Erros Comuns: 500 Internal Server Error (falha ao obter configs, mas improvável).

PUT /v1/store – Atualizar configurações da loja

Descrição: Permite que um ADMIN atualize as configurações globais, por exemplo alterar o raio de entrega ou marcar a loja como aberta/fechada.

Acesso: Protegido (ADMIN).

Corpo da Requisição: JSON com os campos configuráveis, e.g. open, deliveryRadiusKm, etc.

Resposta: HTTP 200 OK com as novas configurações ou confirmação de sucesso.

Erros Comuns:

400 Bad Request – Dados inválidos (ex: valor negativo para raio).

401/403 – Não autorizado (somente admin).

500 Internal Server Error – Falha ao salvar.

(Observação: Os nomes exatos dos campos podem variar conforme implementação. Deduções baseadas no contexto: sabemos que há uma função validateAddressInRadius no backend, o que implica que deliveryRadius está armazenado em algum lugar (provavelmente nas configurações da loja). Assim, documentamos como campos prováveis.)

Modelos de Dados (Entidades)

A seguir, descrevemos os principais modelos/entidades do domínio da API e seus atributos:

Usuário (User): Representa os usuários do sistema.

Campos:

id (UUID) – Identificador único do usuário.

name (string) – Nome do usuário.

email (string) – Email do usuário (único).

passwordHash (string) – Hash da senha do usuário (a senha em si nunca é armazenada em texto claro).

role (string) – Papel do usuário, geralmente "CLIENT" ou "ADMIN".

createdAt, updatedAt (datetime) – registro de criação/atualização.

Possivelmente phone (string) – número de telefone (se login puder ser via telefone). Não ficou claro se implementado, mas há indícios de login por telefone/email.

Relações: Um usuário CLIENTE pode ter vários endereços e vários pedidos. Um usuário ADMIN normalmente não faz pedidos, mas pode ter endereços associados (ou não, dependendo do uso).

Produto (Product): Representa um item disponível para compra (açaí ou adicional).

Campos:

id (UUID) – ID do produto.

name (string) – Nome do produto.

description (string) – Descrição do produto.

priceCents (inteiro) – Preço em centavos (ex: 1500 = R$15,00). Na API, isso pode ser exposto como campo price em formato real.

imageUrl (string) – URL da imagem ilustrativa.

isAvailable (boolean) – Indica se o produto está ativo/disponível para pedidos.

categoryId (UUID) – Referência à categoria do produto.

createdAt, updatedAt – timestamps.

Relações: Muitos produtos pertencem a uma categoria (relacionamento N:1 com Category). Produtos são referenciados em itens de pedido (OrderItem).

Categoria (Category): Agrupa produtos similares.

Campos:

id (UUID) – ID da categoria.

name (string) – Nome da categoria (ex: "Açaí Tradicional", "Complementos").

sortOrder (int) – Ordem de exibição.

createdAt, updatedAt.

Relações: Uma categoria tem vários produtos.

Endereço (Address): Endereço de entrega do usuário.

Campos:

id (UUID) – ID do endereço.

userId (UUID) – Referência ao usuário dono do endereço.

street (string) – Logradouro.

number (string) – Número (pode ser string pois pode incluir complemento tipo "S/N").

district (string) – Bairro.

city (string) – Cidade.

state (string) – Estado (UF).

cep (string) – CEP.

complement (string) – Complemento.

latitude, longitude (decimal, opcional) – Coordenadas geográficas calculadas para o endereço (para checar raio de entrega).

createdAt, updatedAt.

Relações: Um usuário tem vários endereços. Um endereço pertence a um usuário. Um endereço pode ser usado em vários pedidos (relacionamento 1:N com Order).

Pedido (Order): Representa um pedido de compra feito por um usuário.

Campos:

id (UUID) – ID do pedido.

userId (UUID) – ID do usuário que fez o pedido.

addressId (UUID) – ID do endereço usado para entrega.

paymentMethod (string) – Método de pagamento (e.g., "PIX", "CASH").

note (string) – Nota/observação do cliente.

status (string) – Status atual do pedido. Por exemplo: "PENDING", "CONFIRMED", "DELIVERED", "CANCELLED".

totalPrice (inteiro centavos ou decimal) – Valor total do pedido. Pode ser armazenado ou calculado sob demanda. Para consistência histórica, costuma-se armazenar.

createdAt, updatedAt.

Relações: Um pedido é feito por um usuário (User) e contém vários itens (OrderItem). O addressId relaciona com Address. Poderia haver relação com um entregador (courier) no futuro.

Item do Pedido (OrderItem): Representa cada produto dentro de um pedido.

Campos:

id (UUID) – ID do item (pode ser gerado, ou a chave pode ser composta do orderId+productId).

orderId (UUID) – Referência ao pedido pai.

productId (UUID) – Referência ao produto.

quantity (int) – Quantidade do produto no pedido.

unitPrice (inteiro/decimal) – Preço unitário cobrado do produto naquele pedido. Importante armazenar para histórico, pois mesmo que o preço do produto mude no futuro, o pedido mantém o preço que foi cobrado.

totalPrice (inteiro/decimal) – Preço total do item (unitário * quantidade). Pode ser calculado na consulta ou armazenado por redundância.

Relações: Vários OrderItems pertencem a um Order. Cada OrderItem referencia um Product (mesmo se o produto for deletado posteriormente, o registro do item costuma permanecer para histórico).

Configurações da Loja (StoreConfig): Guarda parâmetros globais da aplicação.

Campos:

id (opcional, pode ser único fixo) – Se houver vários registros (por exemplo, multi-lojas), mas aqui deve ser único.

deliveryRadius (int ou decimal) – Raio máximo de entrega em km.

open (boolean) – Indica se a loja está aceitando pedidos no momento.

openingHours (string ou outros campos) – Horário de funcionamento (informativo).

storeAddress (string) – Endereço físico da loja/base (pode não ser usado diretamente pelo sistema, mas informativo).

latitude, longitude (decimal) – Coordenadas da loja base para cálculo de distâncias.

... (outros parâmetros possíveis: taxa de entrega, etc.).

Relações: Tipicamente apenas um registro. Poderia ser expandido se houvesse múltiplas lojas.

Controle de Acesso por Papel (Roles)

A API define dois papéis principais de usuário, controlando o acesso a recursos:

CLIENTE (CLIENT): É o usuário comum do aplicativo, que realiza pedidos. Esse papel:

Permissões: Pode registrar-se e fazer login; acessar e atualizar seus próprios dados (endereço, eventualmente perfil); visualizar produtos e categorias; criar pedidos e ver seus pedidos; utilizar endpoints de logout/refresh.

Restrições: Não pode criar/editar produtos ou categorias; não pode ver pedidos de outros usuários; não pode alterar status de pedidos; não pode acessar configurações de loja ou dados administrativos.

ADMINISTRADOR (ADMIN): Usuário com privilégios administrativos (geralmente cadastrado manualmente no sistema). Esse papel:

Permissões: Pode fazer tudo que um cliente faz (se necessário), mas principalmente pode gerenciar recursos: adicionar/editar/remover produtos e categorias; acessar a lista de todos os pedidos; atualizar status dos pedidos (por exemplo, marcar como entregue); gerenciar configurações globais da aplicação (ex: fechar loja, ajustar raio de entrega).

Restrições: Um admin normalmente não usaria certas funções do cliente no contexto de operação (por ex, não faz pedidos reais, embora tecnicamente pudesse). A API deve validar o papel antes de permitir operações sensíveis. Por exemplo, se um CLIENT tentar acessar uma rota exclusiva de ADMIN, a resposta será 403 Forbidden.

O controle de acesso é implementado checando o campo role presente no JWT do usuário que faz a requisição. Assim:

Endpoints marcados como "ADMIN" exigem que role do token seja "ADMIN".

Endpoints de CLIENTE permitem role "CLIENT" (geralmente também permitem admin por segurança, exceto quando não faz sentido). Por exemplo, um admin poderia chamar GET /v1/products sem problemas.

Algumas rotas estão abertas (Públicas), não exigindo nenhum token (ex: registro, login, listagem de produtos/categorias possivelmente).

Estrutura do Banco de Dados

O banco de dados utilizado é relacional (indícios sugerem MySQL pela porta 3306 e sintaxe observada). As tabelas principais refletem os modelos acima. Abaixo uma possível representação simplificada das tabelas SQL:

users – armazena os usuários.
Colunas: id (PK), name, email (unique), password_hash, role, created_at, updated_at.
Exemplo: Um admin inicial pode ter id 11111111-1111-1111-1111-111111111111, name "Admin", email "admin@acai.local", role "ADMIN"【40†】.

products – armazena produtos do menu.
Colunas: id (PK), category_id (FK -> categories.id), name, description, price_cents, image_url, is_available, created_at, updated_at.
Exemplo: Produto "Açaí 300ml" com price_cents 1500 e category_id apontando para categoria "Açaí Tradicional"; produto "Granola" price_cents 500 na categoria "Complementos"【59†】.

categories – categorias de produtos.
Colunas: id (PK), name, sort_order, created_at, updated_at.
Exemplo: Categoria "Açaí Tradicional" (id aaaaaaaa-...aaaa, sort_order 1), Categoria "Complementos" (id bbbbbbbb-...bbbb, sort_order 2)【57†】.

addresses – endereços dos usuários.
Colunas: id (PK), user_id (FK -> users.id), street, number, district, city, state, cep, complement, latitude, longitude, created_at, updated_at.
(Latitude/longitude podem ser NULL se não calculados.)
Exemplo: Endereço com id 17524994-5c67-..., user_id referenciando o usuário João, city "João Pessoa", state "PB", cep "58000-000".

orders – pedidos realizados.
Colunas: id (PK), user_id (FK -> users.id), address_id (FK -> addresses.id), payment_method, note, status, total_price_cents, created_at, updated_at.
Exemplo: Um pedido pode ter status "PENDING" inicialmente e total_price_cents 2500 (R$25,00) conforme os itens.

order_items – itens dos pedidos.
Colunas: id (PK) [ou talvez (order_id, product_id) como chave composta], order_id (FK -> orders.id), product_id (FK -> products.id), quantity, unit_price_cents, total_price_cents.
Vários itens associados a um pedido.

store_config (ou store/settings) – configurações da loja.
Colunas: id (PK – possivelmente único), delivery_radius_km, open (bool), store_address, latitude, longitude, etc.
Pode haver somente uma linha nesta tabela. Alternativamente, algumas implementações armazenam configurações em tabela de pares chave/valor, mas assumiremos uma tabela única.

Além dessas, pode haver tabelas auxiliares, por exemplo, se refresh tokens forem persistidos (tabela refresh_tokens com campos token, user_id, expiração, etc.). Não foi confirmado no repositório, mas o fluxo de logout sugere que ou há uma lista de tokens inválidos ou a aplicação confia apenas em expiração. Se implementado, haveria algo como:

refresh_tokens – id, user_id, token_hash, is_revoked, created_at, expires_at.

Todas as chaves primárias parecem ser do tipo UUID (padrão v4, 128-bit), o que facilita identificadores únicos distribuídos. Isso é evidenciado pelos valores vistos (muitas sequências hexadecimais separadas por hífens).

Integridade referencial: As FKs garantem consistência (ex: não existir order com user_id inexistente). Por isso, deleções em cascade ou bloqueios podem existir: não se pode deletar um produto se houver order_items referenciando-o, a menos que se apague os itens também (ou use ON DELETE CASCADE). Provavelmente a API evita remover produtos com pedidos históricos por segurança.

Rotas que Requerem Autenticação vs. Rotas Públicas

Para recapitular de forma objetiva:

Sem necessidade de autenticação (Públicas):

POST /v1/auth/register – cadastro de novo usuário.

POST /v1/auth/login – login (obtenção de tokens).

POST /v1/auth/refresh – refresh token (desde que o token de refresh válido seja fornecido).

GET /v1/products – listar produtos (para permitir navegação aberta do catálogo).

GET /v1/categories – listar categorias.

(Possivelmente) GET /v1/store – obter informações públicas da loja (ex: se está aberta).

Requerem autenticação JWT: (ou seja, Obrigatório enviar header Authorization: Bearer <accessToken>)

POST /v1/auth/logout – para segurança, exige que o usuário esteja logado ao solicitar logout (embora o refresh token seja o principal necessário).

Todos os endpoints de Pedidos: POST /v1/orders (fazer pedido), GET /v1/orders (listar pedidos do usuário ou todos para admin), GET/PUT/DELETE /v1/orders/{id} – todos requerem token válido.

Todos os endpoints de Endereços: GET /v1/addresses, POST /v1/addresses, PUT/DELETE /v1/addresses/{id} – requer token (usuário só gerencia seus endereços).

Produtos (admin): POST /v1/products, PUT/DELETE /v1/products/{id} – requer token de admin. (A listagem de produtos é pública).

Categorias (admin): POST /v1/categories, PUT/DELETE /v1/categories/{id} – requer token de admin. (Listagem de categorias é pública).

Configurações: PUT /v1/store – requer token de admin. (GET /v1/store é público).

Em resumo, qualquer rota que modifica dados ou recupera dados sensíveis requer autenticação. Apenas rotas de leitura gerais (produtos, categorias) e rotas de autenticação em si ficam abertas.

A API utiliza códigos HTTP adequados para quando a autenticação falha:

401 Unauthorized se faltar ou estiver inválido o token (por exemplo, "Token expirado ou inválido").

403 Forbidden se o token é válido mas o usuário não tem permissão para aquela ação (por exemplo, um CLIENT tentando acessar um endpoint de ADMIN).

Essas distinções ajudam o cliente a entender o motivo da falha (401 costuma significar "faça login novamente" enquanto 403 é "você não tem direitos para isso").

Possibilidades de Expansão Futuras

A arquitetura atual da API pode ser expandida para suportar novas funcionalidades. Algumas sugestões de módulos e melhorias futuras:

Módulo de Entregadores (Delivery/Courier): Implementar um novo papel de usuário ENTREGADOR. Isso incluiria:

Entidades e endpoints para entregadores se registrarem ou serem cadastrados (provavelmente administradores cadastrando entregadores).

Atribuição de pedidos a entregadores e endpoints para eles verem pedidos pendentes/atribuídos e atualizarem status (ex: marcar que saíram para entrega, entregue ao cliente, etc.).

Isso exigiria adicionar talvez um campo de courierId em pedidos ou uma tabela de relação pedido-entregador, além de endpoints do tipo GET /v1/orders/available para entregadores pegarem entregas, etc.

Controle de acesso adicional: endpoints exclusivos de entregador, e possivelmente um app/site separado para eles.

Avaliações e Feedback: Permitir que clientes avaliem pedidos/produtos. Expansões possíveis:

Tabela de reviews/ratings associada a pedidos ou produtos, contendo nota (estrelas) e comentário.

Endpoint POST /v1/orders/{id}/rating onde cliente autenticado, após concluir o pedido, envia sua avaliação.

Permitir ADMIN visualizar estatísticas de avaliações, ou até mesmo entregar essas avaliações em endpoints de produtos (ex: média de estrelas por produto).

Cupons de Desconto: Implementar sistema de cupons/promos:

Entidade Coupon com código, descrição, desconto (fixo ou percentual), validade, usos restantes, etc.

Endpoint para validar um cupom (GET /v1/coupons/VALIDAR?code=XYZ) e aplicá-lo a um pedido. Ou integrar no endpoint de criação de pedido (POST /v1/orders aceitar um campo opcional couponCode e então calcular desconto no total).

Admin endpoints para criar/gerir cupons (ex: POST /v1/coupons para lançar uma promoção).

Notificações em tempo real: Embora não seja exatamente um endpoint REST, uma melhoria seria integrar websockets ou push notifications para:

Notificar admins imediatamente quando um novo pedido for feito.

Notificar clientes quando seu pedido mudar de status (confirmado, saiu para entrega, etc.).

Isso complementaria os endpoints de status.

Melhorias em segurança e usabilidade:

Implementar refresh token via cookie HttpOnly para maior segurança (evitar exposição via JS).

Limitar tentativas de login (anti-bruteforce).

Registro de auditoria (quem criou produtos, etc.).

Multi-loja / Franquias: Se no futuro a aplicação abranger múltiplas lojas físicas:

Adicionar uma entidade Loja e vincular produtos e pedidos a uma loja específica.

Endpoints para selecionar loja ou listar lojas disponíveis, etc.

Configurações por loja ao invés de globais únicas.

Upload de Imagens de Produtos: Atualmente, produtos têm campo imageUrl para referência. Poderia-se ter um endpoint para upload de imagem (ex: POST /v1/products/{id}/image) que permite admin enviar uma imagem e a API armazenar (em disco ou nuvem) e atualizar o imageUrl.

Todas essas expansões manteriam o padrão de projeto REST e usariam estrutura similar de autenticação/roles já existente. A base construída permite adicionar esses novos recursos sem grandes mudanças disruptivas, garantindo crescimento da plataforma de forma organizada.
