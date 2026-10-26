# Especificação - Document Management System

> Especificação funcional e técnica da primeira versão do DMS. Os comportamentos
> descritos como requisitos são propostas para implementação; não indicam que já
> estejam disponíveis no seed atual.

## 1. Objetivo

Entregar uma aplicação web para usuários autenticados enviarem, listarem e baixarem seus documentos, com arquivos armazenados exclusivamente no filesystem local e metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Login e logout de usuários pré-cadastrados, sem cadastro público.
- Upload de um documento por requisição.
- Listagem dos documentos pertencentes ao usuário autenticado.
- Download de um documento pertencente ao usuário autenticado.
- Interface React para autenticação e operações de documentos, com estados de carregamento, vazio, sucesso e erro.
- Arquivos locais em `backend/storage`, gravados com Multer `diskStorage`.
- Metadados de documentos, usuários carregados e sessões mantidos em memória nesta versão.

### Fora do escopo

- Armazenamento externo, em nuvem ou em banco de dados.
- Versionamento, edição, compartilhamento ou exclusão de documentos.
- Cadastro público, recuperação de senha, gestão administrativa de usuários ou controle por papéis.
- Pré-visualização e processamento do conteúdo dos arquivos.
- Resiliência a múltiplas instâncias do backend ou persistência dos metadados entre reinicializações.
- Restrições por extensão ou lista permitida de tipos MIME. O limite de tamanho continua obrigatório.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode autenticar-se com credenciais de uma conta pré-cadastrada. Não há endpoint de registro público. |
| RF-02 | O usuário autenticado pode consultar sua sessão atual e encerrar a sessão. |
| RF-03 | O usuário autenticado pode enviar um arquivo por requisição, com tamanho máximo de 10 MiB. |
| RF-04 | Após um upload válido, o sistema cria um identificador único e registra os metadados do documento, incluindo o usuário autenticado como proprietário. |
| RF-05 | O usuário autenticado pode listar somente os documentos de sua propriedade. Uma lista sem documentos retorna sucesso com uma coleção vazia. |
| RF-06 | O usuário autenticado pode baixar um documento próprio pelo identificador. O arquivo é entregue como anexo usando o nome original informado no upload. |
| RF-07 | Documento inexistente ou pertencente a outro usuário resulta em `404`, sem revelar se o identificador existe para outro proprietário. |
| RF-08 | Requisições protegidas sem sessão válida são rejeitadas com `401`. |
| RF-09 | A interface permite entrar e sair da sessão, enviar documentos, atualizar a listagem e iniciar o download de um documento. |
| RF-10 | A interface informa estados de carregamento, sucesso, lista vazia e falha, sem exibir detalhes internos do servidor. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são gravados no filesystem local em `backend/storage`, utilizando Multer com `diskStorage`. Nenhum provedor externo é permitido. |
| RNF-02 | Os metadados dos documentos são mantidos em memória e seguem o modelo da seção 5. Eles não sobrevivem à reinicialização do processo. |
| RNF-03 | Configurações operacionais e credenciais de inicialização são fornecidas por variáveis de ambiente, sem valores secretos no código-fonte. |
| RNF-04 | O backend usa Express e CommonJS, organizado nas camadas `routes`, `controllers`, `services` e `repositories`, com dependências no sentido `routes -> controllers -> services -> repositories`. |
| RNF-05 | O frontend usa React e Vite. As chamadas HTTP usam `fetch` com o prefixo `/api`, conforme o proxy existente do Vite. |
| RNF-06 | A autenticação usa sessão por cookie `HttpOnly`, com `SameSite=Lax`; o atributo `Secure` deve ser habilitado em produção sobre HTTPS. A sessão é mantida em memória nesta versão. |
| RNF-07 | Senhas não são armazenadas em texto puro: as contas pré-cadastradas fornecem hashes de senha. Segredos e hashes são configurados fora do repositório. |
| RNF-08 | O tamanho máximo do upload é configurável por ambiente, com valor padrão de 10 MiB. A rejeição ocorre antes de persistir metadados. |
| RNF-09 | O nome original é usado apenas como metadado e nome de download. O nome físico local é gerado pelo sistema e não pode ser controlado pelo cliente. |
| RNF-10 | A autorização é aplicada no backend para cada operação sobre documentos; a sessão deve ser validada antes do middleware Multer gravar o upload; ocultar ações na interface não substitui a validação de propriedade. |
| RNF-11 | Falhas de entrada e de recursos inexistentes têm respostas previsíveis. A resposta não inclui stack trace, caminho local ou credenciais. |
| RNF-12 | Como arquivos são locais e metadados/sessões são voláteis, a primeira versão atende uma instância do backend. Reiniciar o processo invalida sessões e metadados; arquivos já gravados podem permanecer sem referência. |

### Configuração prevista

| Variável | Uso |
| --- | --- |
| `PORT` | Porta HTTP do backend. |
| `DMS_USERS_JSON` | Lista JSON de contas pré-cadastradas com `id`, `username` e `passwordHash`; nunca incluir senhas em texto puro. |
| `SESSION_SECRET` | Segredo aleatório usado para proteger a sessão. Obrigatório fora de desenvolvimento local. |
| `UPLOAD_MAX_BYTES` | Limite máximo do upload em bytes; padrão de 10 MiB (`10485760`). |

O diretório de armazenamento permanece fixo em `backend/storage` para cumprir a restrição de armazenamento local definida para o projeto. O seed atual só confirma a configuração de `PORT`; as demais variáveis são propostas desta especificação.

## 5. Modelo de dados (metadados do documento)

### Documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único e não previsível do documento, gerado pelo servidor. |
| `originalName` | string | Nome original fornecido pelo cliente, preservado para exibição e download. |
| `size` | number | Tamanho do arquivo em bytes, inteiro não negativo. |
| `uploadedAt` | string | Data e hora de recebimento em ISO 8601, em UTC. |
| `owner` | string | Identificador (`id`) do usuário autenticado que enviou o documento. |

O registro de metadados também precisa associar internamente o `id` a um nome físico gerado para o arquivo em `backend/storage`. Esse nome interno não é exposto pela API. O nome original nunca é usado para construir um caminho no filesystem.

### Usuário e sessão

- **Usuário pré-cadastrado:** `id`, `username` e `passwordHash`. Os dados são carregados na inicialização a partir de `DMS_USERS_JSON` e mantidos em memória; não há persistência nem endpoints de administração.
- **Sessão:** identificador de sessão associado ao `id` do usuário autenticado, mantido em memória e transportado por cookie `HttpOnly`. A sessão expira conforme configuração da aplicação; logout invalida a sessão no servidor e limpa o cookie.

### Regras de consistência

- `id` é único entre os documentos conhecidos pelo processo.
- `owner` é obtido exclusivamente da sessão autenticada, nunca do corpo da requisição.
- `size` corresponde ao tamanho efetivamente recebido e não pode exceder `UPLOAD_MAX_BYTES`.
- A listagem e o download verificam a propriedade antes de retornar dados ou conteúdo.
- Metadados e sessões são voláteis. Após reinicialização, arquivos locais podem existir sem metadados associados; recuperação e limpeza automática desses arquivos estão fora do escopo inicial.

## 6. Contratos de API

Os caminhos abaixo são os caminhos expostos pelo backend. No frontend, o proxy do Vite encaminha as mesmas chamadas com o prefixo `/api` e o remove antes de encaminhá-las ao backend. Por exemplo, o frontend chama `/api/documents` e o backend recebe `/documents`.

Todas as respostas JSON usam `Content-Type: application/json`. Exceto login, consulta de sessão e logout, os endpoints exigem sessão válida. O cookie é enviado automaticamente em chamadas same-origin; o frontend deve usar o proxy `/api`.

### `POST /auth/login`

- **Entrada:** JSON `{ "username": "...", "password": "..." }`.
- **Sucesso:** `200 OK`, define cookie de sessão `HttpOnly` e retorna `{ "user": { "id": "...", "username": "..." } }`.
- **Falha:** `400 Bad Request` para corpo inválido; `401 Unauthorized` para credenciais inválidas.
- A resposta nunca retorna hash ou senha.

### `GET /auth/session`

- **Sucesso:** `200 OK` com `{ "user": { "id": "...", "username": "..." } }`.
- **Falha:** `401 Unauthorized` se não houver sessão válida.

### `POST /auth/logout`

- **Sucesso:** `204 No Content`; invalida a sessão e remove o cookie.
- Pode ser chamado sem sessão ativa, mantendo resultado idempotente.

### `POST /upload`

- **Entrada:** `multipart/form-data`, com exatamente um campo de arquivo chamado `file`. Outros campos enviados pelo cliente não definem proprietário nem metadados confiáveis.
- **Sucesso:** `201 Created`, com o metadado criado:

```json
{
  "id": "document-id",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-26T12:00:00.000Z",
  "owner": "user-id"
}
```

- **Falha:** `400 Bad Request` se o arquivo estiver ausente ou a requisição for inválida; `401 Unauthorized` sem sessão; `413 Payload Too Large` se exceder o limite; `500 Internal Server Error` em falha inesperada de armazenamento.
- Tipos de arquivo não têm allowlist nesta versão. O servidor não interpreta nem executa o conteúdo enviado.

### `GET /documents`

- **Sucesso:** `200 OK` com `{ "documents": [Document, ...] }`. Retorna somente documentos cujo `owner` corresponde ao usuário autenticado; sem documentos, `documents` é `[]`.
- **Falha:** `401 Unauthorized` sem sessão; `500 Internal Server Error` em falha inesperada.

### `GET /documents/:id/download`

- **Sucesso:** `200 OK` com conteúdo binário, `Content-Type` apropriado quando conhecido ou `application/octet-stream` e `Content-Disposition: attachment` com o nome original devidamente codificado.
- **Falha:** `401 Unauthorized` sem sessão; `404 Not Found` para identificador inexistente, documento de outro usuário ou arquivo local indisponível; `500 Internal Server Error` para falhas inesperadas de leitura.

### Formato comum de erro

Erros JSON seguem `{ "error": { "code": "...", "message": "..." } }`. Mensagens são seguras para exibição e não incluem detalhes internos.

| HTTP | `code` sugerido | Uso |
| --- | --- | --- |
| `400` | `INVALID_REQUEST` | JSON, multipart ou campos obrigatórios inválidos. |
| `401` | `UNAUTHENTICATED` | Credenciais inválidas ou sessão ausente/inválida. |
| `404` | `DOCUMENT_NOT_FOUND` | Documento inexistente, não pertencente ao usuário ou arquivo indisponível. |
| `413` | `FILE_TOO_LARGE` | Upload acima do limite configurado. |
| `500` | `INTERNAL_ERROR` | Falha inesperada; sem stack trace na resposta. |

## 7. Decisões arquiteturais

- **Estado do seed:** o backend Express já expõe `GET /health` e configura `PORT`; as rotas de documentos e autenticação ainda não estão implementadas. O frontend React é um placeholder. Multer já está listado como dependência do backend.
- **Backend planejado:** as rotas declaram caminhos e aplicam primeiro o middleware de sessão e depois o middleware de upload; controllers fazem a adaptação HTTP e validação básica; services concentram autenticação, autorização e regras de documentos; repositories isolam usuários e metadados em memória e o acesso ao filesystem local.
- **Upload local:** Multer usa `diskStorage` para gravar em `backend/storage` com nome físico gerado pelo servidor. O serviço registra metadados somente após um upload válido. Falhas ao gravar não devem criar metadados.
- **Autenticação:** usuários pré-cadastrados são carregados de configuração de ambiente; autenticação por sessão em cookie `HttpOnly`; armazenamento de sessão em memória. Registro público, banco de dados e provedores de identidade externos não fazem parte desta versão.
- **Frontend planejado:** componentes funcionais React; comunicação por `fetch` através de `/api`; Vite remove o prefixo antes de encaminhar para o backend. A interface não é fonte de autorização.
- **Persistência e implantação:** os arquivos residem apenas no filesystem local. Metadados, usuários carregados e sessões ficam em memória. Não há garantia de recuperação dos metadados após reinicialização, sincronização entre processos ou limpeza de órfãos.
- **Princípio de dependência:** camadas internas não dependem de Express, React ou detalhes de transporte. A persistência concreta permanece substituível dentro da arquitetura, sem introduzir um provedor externo nesta fase.

## 8. Plano de execução

Etapas de entrega em nível de produto. Este plano não detalha a execução por arquivos e não inclui a implementação de arquivos de backend ou frontend.

1. Validar os requisitos, as configurações de ambiente e os contratos HTTP desta especificação.
2. Preparar a base de autenticação e autorização com usuários pré-cadastrados e sessões em memória.
3. Entregar o fluxo de upload local, aplicação do limite de tamanho e registro em memória dos metadados.
4. Entregar listagem e download com isolamento por proprietário e tratamento uniforme de erros.
5. Integrar os fluxos de autenticação e documentos à experiência web, incluindo estados de carregamento, vazio, sucesso e erro.
6. Validar os fluxos ponta a ponta, as restrições de armazenamento e os limites conhecidos de persistência antes da primeira entrega.