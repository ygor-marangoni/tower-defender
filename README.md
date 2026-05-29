# Tower Defender

Tower Defender é um jogo de tower defense feito com HTML, CSS e JavaScript puro, renderizado em Canvas e sem etapa de build. O projeto tem dois modos completos, mapas responsivos, interface mobile dedicada e uma suíte simples de testes em JavaScript.

## Visão Geral

Escolha um modo, posicione torres fora da rota dos inimigos, inicie ondas e sobreviva o máximo possível. Cada modo muda a linguagem visual, os nomes do HUD, a base, a rota, os inimigos e as defesas, mas preserva a mesma lógica central do jogo.

## Modos

### Futurista

Defenda um núcleo tecnológico contra drones e unidades digitais. O mapa usa uma estética sci-fi, torres de energia e uma base em formato de nave espacial.

### Medieval

Proteja o castelo contra invasores em uma estrada de cerco. O modo usa paleta medieval, defesas temáticas, base em castelo de pedra e decorações no mapa.

## Inimigos por Tema

Todos os inimigos são desenhados diretamente com Canvas API, sem imagens externas, spritesheets ou bibliotecas de animação.

### Futurista

- Drone Vigia: inimigo comum com corpo tecnológico, lente ciano, motores laterais e flutuação sutil.
- Sonda Cortante: inimigo rápido em formato de dardo, com rastro energético e movimento agressivo.
- Colosso Blindado: inimigo tanque com placas de armadura, núcleo pulsante e explosão pesada.

### Medieval

- Goblin Saqueador: inimigo comum pequeno, com cabeça verde, orelhas pontudas e arma simples.
- Lobo Sombrio: inimigo rápido de silhueta alongada, patas animadas, cauda e olhos brilhantes.
- Ogro de Cerco: inimigo tanque largo e pesado, com clava, passo forte e poeira no impacto.

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
- Venda de torres com reembolso de 70% do total investido.
- Sistema roguelite de cartas de upgrade a cada 3 ondas concluidas.
- Cartas com raridades common, rare e epic, textos por tema e efeitos reais no gameplay.
- Inimigos personalizados por tema, com animação de movimento, dano e morte.
- Ondas progressivas com inimigos comuns, rápidos e tanques.
- Recordes separados por modo usando LocalStorage.
- Test runner próprio, sem dependências externas de teste.

## Posicionamento com grid

Ao selecionar uma torre ou defesa, o Canvas exibe uma grade cinza sutil com opacidade reduzida. O mouse destaca a célula atual: verde indica uma posição válida e vermelho indica uma posição inválida.

A preview da defesa e o range sempre usam o centro da célula mais próxima. Ao clicar, a defesa é criada exatamente nesse centro, sem usar coordenadas livres do mouse.

Não é possível construir sobre a estrada/rota, fora da arena, sem recursos suficientes ou em uma célula já ocupada por outra defesa. O sistema funciona nos temas Futurista e Medieval, usando as mesmas regras de snap e validação.

## Posicionamento mobile

No mobile, toque e arraste uma torre/defesa a partir do painel ate o campo. Um preview HTML acompanha o dedo com leve deslocamento para cima, evitando que o toque esconda a defesa.

Ao entrar no Canvas, o mesmo grid do desktop aparece. A defesa passa a encaixar no centro da celula mais proxima, o range aparece alinhado ao centro da celula e o destaque indica o resultado: verde permite construir, vermelho cancela.

Ao soltar em uma celula valida, a defesa e criada com snap-to-grid. Soltar fora do campo, sobre a estrada, sobre outra defesa ou sem recursos suficientes cancela a acao e mostra feedback. Toque simples no card continua selecionando a defesa normalmente para preservar acessibilidade e o fluxo tradicional.

## Venda de torres

- Clique em uma torre posicionada para seleciona-la.
- O painel lateral mostra os dados da torre e o valor de venda.
- Vender devolve `70%` do valor investido usando `Math.floor`.
- O calculo considera o custo inicial e upgrades ja aplicados.
- A venda funciona nos modos Futurista e Medieval.
- A venda pode ser feita durante uma onda ativa.
- Depois da venda, a torre sai do mapa, o dinheiro atualiza imediatamente e a selecao e limpa.

## Sistema de cartas

A cada 3 ondas concluidas, a partida pausa e abre uma escolha com 3 cartas aleatorias. O jogador escolhe apenas 1 carta, o efeito e aplicado imediatamente e a partida volta ao fluxo normal.

O gatilho acontece depois das ondas 3, 6, 9, 12 e assim por diante. A mesma onda nao abre a escolha duas vezes.

As cartas sao universais, mas o texto muda conforme o tema. No modo Futurista elas aparecem como protocolos, calibracoes e sistemas. No modo Medieval elas aparecem como bencaos, contratos, treinamento e reforcos do reino.

Categorias:

- Ataque: aumenta dano, alcance ou velocidade de disparo.
- Economia: melhora recompensas, custo de construcao, venda ou concede recursos imediatos.
- Defesa: adiciona vida, repara a base ou fortalece a defesa em situacoes criticas.
- Especializacao: melhora torres basic, rapid ou heavy.
- Utilidade: melhora alcance visual, torres ja posicionadas ou bonus por onda perfeita.

Raridades:

- common: cartas frequentes e moderadas.
- rare: cartas mais fortes e focadas.
- epic: cartas de impacto alto e mais raras.

Cartas iniciais:

- Projeteis Otimizados / Pontas Afiadas
- Sensor Expandido / Vigias Altas
- Recarga Acelerada / Maos Treinadas
- Nucleo Critico / Golpe Preciso
- Arsenal Sobrecarregado / Arsenal Real
- Protocolo de Recompensa / Cacadores de Recompensa
- Creditos Emergenciais / Tesouro do Reino
- Construcao Eficiente / Maos de Obra Local
- Contrato Logistico / Contrato Mercante
- Extracao de Dados / Saque de Guerra
- Blindagem do Nucleo / Muralhas Reforcadas
- Protocolo Ultima Linha / Ultima Muralha
- Drones de Reparo / Curandeiros do Reino
- Calibracao do Canhao / Treinamento dos Arqueiros
- Laser Sequencial / Mecanismo da Besta
- Plasma Pesado / Mestre de Cerco
- Engenheiro de Campo / Engenheiro Real
- Visao Tatica / Olhos da Fortaleza
- Unidades Veteranas / Defensores Veteranos
- Execucao Perfeita / Defesa Impecavel.

## Como Jogar

1. Abra `index.html` no navegador.
2. Escolha `Modo Futurista` ou `Modo Medieval`.
3. Selecione uma torre/defesa.
4. Clique fora da rota no desktop ou arraste a defesa ate o campo no mobile.
5. Inicie a onda.
6. Selecione torres posicionadas para melhorar ou vender.
7. A cada 3 ondas concluidas, escolha uma carta de upgrade.
8. Sobreviva e tente bater o recorde.

No teclado, use `ESC` para cancelar a seleção atual.

## Mobile

O jogo tem uma experiência mobile própria:

- Canvas vertical para melhor leitura no celular.
- Rotas ajustadas para inimigos avançarem de cima para baixo.
- Torres, inimigos e área de toque ampliados.
- Botão de ampliar arena no card do mapa.
- Modo foco em tela cheia com controles essenciais na parte inferior.

- Posicionamento por arrastar e soltar usando Pointer Events.
- Preview acompanha o dedo, com grid e feedback verde/vermelho ao entrar no campo.

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
- efeitos de morte;
- torres;
- deck de cartas;
- modificadores de upgrade;
- escolha de cartas entre ondas;
- projéteis;
- grid, snap e células ocupadas;
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
    enemyRenderer.js
    effects.js
    input.js
    mobilePlacement.js
    path.js
    collision.js
    grid.js
    deck.js
    upgrades.js
    cardChoice.js
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
    grid.test.js
    mobile-placement.test.js
    economy.test.js
    enemy.test.js
    effects.test.js
    deck.test.js
    upgrades.test.js
    card-choice.test.js
    tower.test.js
    projectile.test.js
    storage.test.js
    wave.test.js
```

## Arquitetura

Módulos específicos dos inimigos:

- `enemyRenderer.js`: concentra o desenho, silhueta, hit flash, barra de vida e efeitos de morte dos inimigos.
- `effects.js`: cria e atualiza efeitos visuais testáveis, incluindo mortes temáticas.

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
- Novos tipos de defesa.
- Animações especiais para upgrades.

## Licença

Este projeto ainda não define uma licença. Antes de publicar como open source, adicione um arquivo `LICENSE` com os termos desejados.
