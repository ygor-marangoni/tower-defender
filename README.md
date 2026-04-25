# Tower Defender

Tower Defender é um jogo de tower defense feito com HTML, CSS e JavaScript puro, renderizado em Canvas e sem etapa de build. O projeto tem dois modos completos, mapas responsivos, interface mobile dedicada e uma suíte simples de testes em JavaScript.

## Visão Geral

Escolha um modo, posicione torres fora da rota dos inimigos, inicie ondas e sobreviva o máximo possível. Cada modo muda a linguagem visual, os nomes do HUD, a base, a rota, os inimigos e as defesas, mas preserva a mesma lógica central do jogo.

## Modos

### Futurista

Defenda um núcleo tecnológico contra drones e unidades digitais. O mapa usa uma estética sci-fi, torres de energia e uma base em formato de nave espacial.

### Medieval

Proteja o castelo contra invasores em uma estrada de cerco. O modo usa paleta medieval, defesas temáticas, base em castelo de pedra e decorações no mapa.

## Recursos

- Gameplay completo de tower defense em Canvas.
- Dois temas jogáveis: Futurista e Medieval.
- Rotas diferentes por tema.
- Mapas responsivos com rotas mobile verticais.
- Modo foco em tela cheia no mobile.
- Navbar inferior compacta para jogar melhor no celular.
- HUD compacto no modo foco com vida, créditos/ouro e onda/cerco.
- Posicionamento de torres com validação de rota, bordas e colisão.
- Upgrades de torres durante a partida.
- Ondas progressivas com inimigos comuns, rápidos e tanques.
- Recordes separados por modo usando LocalStorage.
- Test runner próprio, sem dependências externas de teste.

## Como Jogar

1. Abra `index.html` no navegador.
2. Escolha `Modo Futurista` ou `Modo Medieval`.
3. Selecione uma torre/defesa.
4. Clique ou toque fora da rota para posicionar.
5. Inicie a onda.
6. Selecione torres posicionadas para melhorar.
7. Sobreviva e tente bater o recorde.

No teclado, use `ESC` para cancelar a seleção atual.

## Mobile

O jogo tem uma experiência mobile própria:

- Canvas vertical para melhor leitura no celular.
- Rotas ajustadas para inimigos avançarem de cima para baixo.
- Torres, inimigos e área de toque ampliados.
- Botão de ampliar arena no card do mapa.
- Modo foco em tela cheia com controles essenciais na parte inferior.

## Tecnologias

- HTML5
- CSS3 responsivo
- JavaScript puro
- Canvas API
- LocalStorage
- Lucide Icons via CDN
- Google Fonts via CDN

## Como Rodar

Não há instalação nem build.

Abra diretamente:

```text
index.html
```

Para uma experiência completa com ícones e fonte, use uma conexão com internet, pois o projeto carrega Lucide Icons e Google Fonts via CDN.

## Testes

Abra no navegador:

```text
tests/test-runner.html
```

A suíte cobre:

- temas e labels;
- rotas desktop e mobile;
- storage por modo;
- economia;
- ondas;
- inimigos;
- torres;
- projéteis;
- colisão e validação de posicionamento.

## Estrutura

```text
tower-defender/
  index.html
  style.css
  README.md
  src/
    config.js
    theme.js
    game.js
    renderer.js
    input.js
    path.js
    collision.js
    tower.js
    enemy.js
    projectile.js
    wave.js
    economy.js
    storage.js
    utils.js
  tests/
    test-runner.html
    test-utils.js
    theme.test.js
    game-theme.test.js
    collision.test.js
    economy.test.js
    enemy.test.js
    tower.test.js
    projectile.test.js
    storage.test.js
    wave.test.js
```

## Arquitetura

O projeto separa a lógica em módulos pequenos:

- `game.js`: orquestra estado, UI, ondas, seleção e loop principal.
- `renderer.js`: desenha mapa, torres, inimigos, projéteis, efeitos e bases no Canvas.
- `theme.js`: concentra temas, rotas, labels e informações visuais.
- `collision.js`: valida posicionamento e colisão.
- `path.js`: calcula segmentos, progresso e distância até a rota.
- `storage.js`: salva recordes e último modo no LocalStorage.

## Roadmap Possível

- Sons de tiro, impacto e derrota.
- Mais mapas por tema.
- Chefes a cada algumas ondas.
- Venda de torres.
- Novos tipos de defesa.
- Animações especiais para upgrades.

## Licença

Este projeto ainda não define uma licença. Antes de publicar como open source, adicione um arquivo `LICENSE` com os termos desejados.
