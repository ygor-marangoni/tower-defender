# Tower Defender

Tower Defender é um tower defense web feito com HTML5, CSS3 e JavaScript puro. O jogo usa Canvas API para renderização, LocalStorage para recordes por modo, Lucide Icons via CDN para a interface e um test-runner simples sem bibliotecas externas.

## Como abrir o jogo

Abra `index.html` diretamente no navegador. A primeira tela mostra o menu de modos com duas experiências:

- **Modo Futurista**: defenda o núcleo com torres de energia, lasers e inimigos digitais.
- **Modo Medieval**: proteja o castelo com arqueiros, besteiros, canhões e uma estrada de terra própria.

O projeto não exige backend, framework ou build step.

## Como jogar

- Escolha um modo no menu inicial.
- Clique em uma carta de torre/defesa para selecioná-la.
- Clique no mapa para posicionar fora da rota ou estrada.
- Use `ESC` para cancelar a seleção.
- Clique em uma torre posicionada para selecioná-la.
- Use `Melhorar defesa` para evoluir a torre selecionada.
- Clique em `Iniciar onda` ou `Iniciar cerco` para chamar a próxima onda.
- Use `Reiniciar` para resetar a partida atual.
- Use `Trocar modo` para voltar ao menu inicial.

## Modos e temas

Os modos compartilham a mesma lógica central de tower defense. A diferença fica centralizada na camada de tema:

- labels do HUD e Game Over;
- nomes e descrições visuais das torres;
- nomes visuais dos inimigos;
- paleta de UI;
- path/mapa usado por movimento e colisão;
- renderização do Canvas;
- recordes separados no LocalStorage.

Os tipos internos continuam estáveis:

- Torres: `basic`, `rapid`, `heavy`.
- Inimigos: `common`, `fast`, `tank`.

## Recordes

Os recordes são salvos separadamente por modo:

- `towerDefender.futuristic.bestScore`
- `towerDefender.futuristic.bestWave`
- `towerDefender.medieval.bestScore`
- `towerDefender.medieval.bestWave`
- `towerDefender.lastTheme`

Se houver recordes antigos globais, o modo futurista usa esses valores como compatibilidade inicial.

## Como rodar os testes

Abra `tests/test-runner.html` no navegador. A página mostra o total de testes, aprovados, falhados e a mensagem de erro quando houver falha.

Os testes cobrem:

- configuração de temas;
- storage por tema;
- colisão com path por tema;
- estado inicial do jogo por tema;
- inimigos, torres, projéteis, economia e ondas existentes.

## Estrutura

```text
tower-defender/
  index.html
  style.css
  src/
    game.js
    config.js
    theme.js
    path.js
    enemy.js
    tower.js
    projectile.js
    wave.js
    economy.js
    collision.js
    renderer.js
    input.js
    storage.js
    utils.js
  tests/
    test-runner.html
    test-utils.js
    theme.test.js
    storage.test.js
    game-theme.test.js
    enemy.test.js
    tower.test.js
    projectile.test.js
    economy.test.js
    wave.test.js
    collision.test.js
  README.md
```

## Possíveis melhorias futuras

- Adicionar sons curtos de tiro, impacto e Game Over.
- Criar mais mapas por tema.
- Adicionar chefes temáticos a cada 5 ondas.
- Permitir vender torres.
- Criar upgrades visuais diferentes por modo.
