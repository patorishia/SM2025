# SM2025  
Projeto em Phaser3 de uma Corrida Intergaláctica.  
Um jogo arcade desenvolvido para o projeto académico da disciplina de **Sistemas Multimédia**.  
O objetivo é controlar uma nave espacial, evitar obstáculos e gerir o combustível até ao fim da corrida, acumulando pontos.

---

## Funcionalidades

- Menu inicial com instruções de jogo  
- Sistema de pontuação e tempo  
- Consumo de combustível durante a corrida  
- Obstáculos com colisões e penalizações  
- Sprites animados e controlo por teclado  
- Colisões com Arcade Physics  
- Efeitos sonoros integrados  
- Fluxo completo: Menu → Game → Win/GameOver 

---

## Funcionalidades Extra

- **HUD**: barra de combustível dinâmica (verde, amarelo, vermelho), barra de progresso ligada à distância percorrida, timer que inicia após countdown  
- **Feedback visual adicional**: nave muda de cor em estados críticos, explosão animada em colisões, countdown inicial interativo  
- **Gestão modular de funções**: `updateFuelBar`, `updateProgress`, `updateScore`, `collectFuel`, `onAsteroidHit`  
- **Integração de sons**: áudio inicia apenas após gesto do utilizador (respeitando restrições do browser)  
- **VirtualJoystick (rexVirtualJoystick plugin)**: controlo em dispositivos móveis, integrado com teclado para jogabilidade multiplataforma  

---

## Estrutura do projeto

- `src/` → código fonte (scenes, lógica do jogo)  
- `assets/` → imagens, sprites, sons  
- `README.md` → documentação do projeto  


---

## Créditos

Projeto desenvolvido por **Patrícia Pereira**.  
Framework: [Phaser](https://phaser.io/)  
Plugin: rexVirtualJoystick (para controlo mobile).  
