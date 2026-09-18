# Mentor de IA para concursos

## Objetivo
Adicionar um mentor especializado em concursos de alto nível, com conversas separadas e histórico salvo na conta.

## Experiência
- Criar uma área “Mentor IA” acessível pela navegação principal.
- Exibir uma lista de conversas, ação para iniciar conversa e uma página própria para cada conversa.
- Oferecer atalhos para montar plano personalizado, criar ciclo 80/20, organizar revisão espaçada e analisar questões.
- Permitir escolher um concurso cadastrado para contextualizar a conversa.
- Mostrar respostas detalhadas em texto formatado, raciocínio resumido durante o processamento e controles de enviar/parar.

## Inteligência do mentor
- Configurar o mentor como especialista em Cebraspe, FGV e Vunesp.
- Orientá-lo a usar diagnóstico, priorização 80/20, revisão espaçada e explicação passo a passo de questões.
- Enviar ao mentor o contexto do concurso e das disciplinas vinculadas selecionadas pelo usuário.
- Manter todas as chamadas de IA protegidas no servidor e transmitir respostas progressivamente.

## Histórico e segurança
- Criar conversas e mensagens vinculadas à conta do usuário.
- Aplicar acesso privado para que cada pessoa veja e altere apenas o próprio histórico.
- Salvar mensagens completas da conversa e restaurá-las ao abrir ou atualizar a página.
- Validar no servidor que a conversa pertence ao usuário antes de consultar ou salvar mensagens.

## Implementação técnica
- Usar Lovable AI com o modelo padrão `openai/gpt-6-astra` e API Responses em streaming.
- Usar AI SDK e componentes AI Elements para conversa, mensagens, campo de envio e carregamento.
- Criar uma função protegida para receber a conversa completa, consultar o mentor e persistir a resposta concluída.
- Criar rotas `/mentor` e `/mentor/:threadId`, com o identificador da conversa vindo da URL.
- Corrigir também a dependência circular no retorno de autenticação que pode disparar o erro de contexto atual.

## Validação
- Testar criação e troca entre pelo menos duas conversas, envio de mensagem, resposta em streaming e restauração após recarregar.
- Confirmar que os históricos não se misturam e que acesso a conversa alheia é bloqueado.
- Executar verificação de tipos, testes e validação visual em telas grandes e pequenas.
