# Pacote UX Passaporte JRC — plano de implementação

Fonte: `UX Melhorias Passaporte JRC - Final.pdf` (24/09/2026). A branch de trabalho parte de `main` em `5f5b3f7`.

## Resultado esperado

O administrador altera a marca exibida no login sem editar código, gerencia convites com telefone persistido e prevenção de duplicidade, prepara ou envia campanhas em lote pelo canal configurado e consulta avaliações. O participante avalia cada evento depois de receber o carimbo e consegue recuperar o acesso com verificação de posse de um canal cadastrado. O favicon usa a marca JRC.

## Decisões e limites

- Dados e rate limiting permanecem em PostgreSQL/Prisma; nada de Redis, Firebase ou serviços proibidos em `AGENTS.md`.
- O cadastro permanece exclusivamente por convite e o QR continua opaco, efêmero e de uso único.
- Não presumir que links `api.whatsapp.com/send` entreguem mensagens automaticamente. A estratégia de envio depende da escolha do usuário sobre o canal disponível.
- Nunca registrar senhas, códigos, tokens brutos ou dados pessoais em auditoria. Recuperação usa token de curta validade e uso único; nenhum segredo é exposto na resposta pública.
- A regra do PDF cita setembro de 2027, enquanto a aplicação ainda usa dezembro de 2026. Ajustes de campanha serão limitados ao texto de convite até confirmação do calendário.

## Sequência

1. **Base e testes.** Instalar dependências, ler os guias locais do Next 16, executar `lint`, `typecheck` e testes unitários para registrar o estado inicial.
2. **Dados.** Criar migração Prisma para telefone normalizado em usuários/convites, logo do login no programa, avaliações únicas por passaporte/evento e pedidos de recuperação/entrega de mensagens. Definir índices e restrições no banco.
3. **Convites e duplicidade.** Validar telefone brasileiro, persistir no convite, impedir novo convite para telefone cadastrado em qualquer programa, vincular telefone ao usuário na ativação e cobrir concorrência.
4. **Marca.** Expor configuração pública de logo, adicionar controle em `/admin/temas`, renderizar no login com fallback e atualizar o favicon com a arte oficial disponível.
5. **Avaliação.** Criar endpoint do participante, permitir nota inteira de 0 a 10 e comentário após carimbo confirmado, oferecer tela de avaliação no passaporte e consulta administrativa por evento.
6. **Comunicação.** Criar seleção em lote de convites/participantes, separar mensagem de ativação da mensagem de login, registrar resultado individual e permitir reenvio sem duplicações acidentais. Integrar apenas canais realmente disponíveis.
7. **Recuperação.** Criar solicitação pública com resposta neutra, limite de taxa, expiração e consumo atômico; oferecer definição de nova senha pelo próprio participante após validação do link recebido no canal disponível.
8. **Documentação e verificação.** Atualizar variáveis de ambiente e operação, executar testes unitários, integração PostgreSQL, `lint`, `typecheck` e build. Revisar diff e riscos de implantação.

## Critérios de aceite

- Logo atualizada no painel aparece no login sem novo deploy.
- Telefone duplicado é rejeitado no servidor, inclusive com requisições concorrentes.
- Convites em lote distinguem participantes ativados dos pendentes; resultados são observáveis no painel.
- Avaliação só é aceita após carimbo confirmado e não cria duplicatas.
- Recuperação não revela se o telefone existe e permite uso único do token.
- Favicon é visível no navegador e documentação de produção descreve as migrações e configurações necessárias.
