# Melhorias de UX — operação

Este pacote implementa as solicitações do documento de 24/09/2026 no projeto que parte da branch `main` em `5f5b3f7`.

## Antes de disponibilizar

1. Publique a imagem construída a partir da branch aprovada e execute `npx prisma migrate deploy` no banco de produção antes de iniciar a nova aplicação. O `Dockerfile` já executa esse comando no boot.
2. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM` se quiser manter o envio individual por e-mail e usar a recuperação de acesso. A lista em massa de WhatsApp não depende de SMTP; a recuperação fica indisponível em produção sem ele.
3. No painel `/admin/participantes`, informe e confira o WhatsApp dos participantes antigos. O cadastro anterior não armazenava telefone; a prevenção de duplicidade por número e a recuperação por número só funcionam para registros com esse dado.
4. No painel `/admin/temas`, carregue a logo do login e salve. A página `/login` lê a imagem do programa ativo sem novo build. O favicon BAR JRC foi obtido da pasta indicada no PDF e é distribuído como arquivo estático.

## Convites e mensagens

- Convites nominais podem guardar WhatsApp e e-mail. O servidor impede novo convite com número já cadastrado em um participante ou vinculado a convite ativo.
- A ativação exige o WhatsApp vinculado ao convite, quando informado. As rotas públicas antigas de ativação por OTP retornam `410` porque não coletavam o número e permitiam contornar a associação.
- **Preparar lista de WhatsApp** processa convites e participantes em lotes de 50 e mostra nome, número e botão para abrir cada conversa. Convites pendentes recebem um novo link de ativação; participantes com convite usado recebem somente o link de login. Destinatários sem WhatsApp são marcados como ignorados. Uma falha individual aparece no resultado do lote.
- O botão de WhatsApp não envia mensagens automaticamente: o link `api.whatsapp.com/send` exige a confirmação de envio na conversa. Não há envio em massa por e-mail.
- Preparar ou reenviar um convite pendente cria um link adicional para o mesmo convite. Links anteriores continuam válidos até o convite ser usado ou revogado. O token bruto não é armazenado no banco.
- A redação da mensagem de login segue o PDF, inclusive a menção a setembro de 2027. Outras telas ainda descrevem a campanha de 2026 e dezembro; o calendário oficial deve ser confirmado antes de alterar eventos existentes.
- Cor e negrito da referência são reproduzidos no e-mail HTML. O WhatsApp mantém sua formatação de texto nativa e não oferece cor de fonte no link de conversa.

## Avaliação e recuperação

- Após carimbo confirmado, o participante vê a avaliação do evento no passaporte, com nota inteira de 0 a 10 e comentário opcional de até 2.000 caracteres. Há uma resposta por passaporte e evento. O administrador consulta as respostas em `/admin/avaliacoes`.
- Em `/recuperar-senha`, o participante informa o WhatsApp cadastrado. O sistema envia ao e-mail da conta um link de uso único válido por 15 minutos. A página de redefinição exige nova senha de 8 a 128 caracteres e encerra as sessões antigas. A resposta pública não confirma se o número existe.
- O envio automático de senha nova pelo WhatsApp depende de integração de envio autenticada, inexistente no projeto. O link temporário por e-mail evita transmitir senha em texto claro e usa o SMTP que a aplicação já suporta.

## Verificação

Use `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration` com o PostgreSQL de teste na porta 5433 e `npm run build`. As migrações `20260924150000_ux_passaporte` e `20260924160000_invitation_delivery_tokens` adicionam as colunas, índices e tabelas necessárias.
