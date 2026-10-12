# PROJECT SYSTEM — primeira versão

## O que inclui
- Missões diárias e missões personalizadas com XP.
- Níveis e ranks de caçador.
- Atributos, estatísticas e sequência de dias ativos.
- Registro de sessões de idiomas.
- Cronômetro de foco com sessões de 15, 25 e 45 minutos.
- Diário pessoal.
- Exportação/importação de backup JSON e opção de apagar progresso.
- Salvamento local no navegador.
- Manifesto e service worker para instalação PWA em hospedagem HTTPS.

## Importante
Este projeto não está hospedado nem instalado no iPhone. Para instalar como PWA, publique estes arquivos em um endereço HTTPS (por exemplo, GitHub Pages). O progresso fica no armazenamento local do navegador; limpar os dados do Safari pode apagar o progresso. Exporte backups periodicamente.

## Como publicar usando GitHub Pages
1. Crie uma conta no GitHub, se não tiver.
2. Crie um repositório público chamado `project-system`.
3. Envie todos os arquivos desta pasta para a raiz do repositório.
4. No repositório, abra Settings → Pages.
5. Em Build and deployment, escolha Deploy from a branch, selecione `main` e `/ (root)`, e salve.
6. Aguarde o GitHub mostrar o endereço HTTPS publicado.

## Como adicionar ao iPhone
1. Abra o endereço HTTPS no Safari (não dentro de um navegador embutido).
2. Toque em Compartilhar.
3. Escolha “Adicionar à Tela de Início”.
4. Ative “Abrir como app da web”, se essa opção aparecer, e toque em Adicionar.

## Notas da versão
- A permissão de notificação é experimental e não garante lembretes automáticos em horários específicos; essa função precisaria de uma estratégia adicional para ser confiável no iOS.
- O cronômetro funciona enquanto a página está ativa; navegadores podem pausar timers em segundo plano.
- A fonte Inter é carregada de um CDN quando há internet; o restante funciona sem essa fonte.
