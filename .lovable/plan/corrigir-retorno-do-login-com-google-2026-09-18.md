# Corrigir retorno do login com Google

## Objetivo
Evitar que o retorno do Google caia novamente na tela de login antes de a sessão estar disponível.

## Alterações
- Direcionar o login do Google para uma página pública específica de retorno.
- Guardar com segurança a página que o usuário pretendia acessar.
- Nessa página, aguardar a confirmação da sessão antes de navegar.
- Mostrar um estado de carregamento durante a confirmação e uma mensagem com opção de tentar novamente se o login falhar.
- Disponibilizar essa página tanto antes quanto depois da autenticação para impedir redirecionamentos prematuros.

## Validação
- Confirmar que o projeto compila e os testes passam.
- Simular o retorno sem sessão para verificar que não ocorre loop.
- Verificar que uma sessão autenticada é encaminhada para a página pretendida.
