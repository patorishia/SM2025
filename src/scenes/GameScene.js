export class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
    }

    preload() {
        // Carrega a imagem de fundo
        this.load.image('background', 'assets/images/spaceBase.png');

        // Carrega a imagem da linha de chegada
        this.load.image('finishLine', 'assets/images/finishLine.png');

        // Carrega a spritesheet da nave (cada frame tem 16x24 px)
        this.load.spritesheet('ship', 'assets/sprites/ship.png', { frameWidth: 16, frameHeight: 24 });

        this.load.spritesheet('asteroid', 'assets/sprites/asteroid.png', {
            frameWidth: 128,
            frameHeight: 128
        });

        // Carrega a spritesheet do combustível
        this.load.spritesheet('fuel', 'assets/sprites/star.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Carrega a spritesheet da explosão
        this.load.spritesheet('explosion', 'assets/sprites/explosion.png', {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create() {


        // Adiciona o fundo como tileSprite (permite movimento vertical infinito)
        this.background = this.add.tileSprite(240, 360, 480, 720, 'background');

        this.alturaDoPercurso = 10000; // altura total do percurso até a linha de chegada

        // Linha de chegada
        this.finishLine = this.physics.add.image(240, -100, 'finishLine');
        this.finishLine.setVisible(false); // começa invisível


        // Cria a nave como sprite físico (com Arcade Physics)
        this.ship = this.physics.add.sprite(240, 600, 'ship');
        this.ship.setScale(2);

        // -- Input - interação com as 4 setas de direção
        this.cursors = this.input.keyboard.createCursorKeys();




        //nave centrada
        this.anims.create({
            key: 'idle',
            frames: [
                { key: 'ship', frame: 2 },
                { key: 'ship', frame: 7 }
            ],
            frameRate: 4,
            repeat: -1
        });

        //virar para a esquerda
        this.anims.create({
            key: 'turnLeft',
            frames: this.anims.generateFrameNumbers('ship', { frames: [0, 5] }),
            frameRate: 6,
            repeat: 0
        });

        //virar para a direita
        this.anims.create({
            key: 'turnRight',
            frames: this.anims.generateFrameNumbers('ship', { frames: [4, 9] }),
            frameRate: 6,
            repeat: 0
        });

        // Inicia a animação idle
        this.ship.play('idle');


        // Definir limites do mundo
        this.physics.world.setBounds(0, 0, this.sys.game.config.width, this.sys.game.config.height);


        // Ativar física na nave
        this.physics.add.existing(this.ship);
        this.ship.setCollideWorldBounds(true);


        // Criar animação de rotação do asteroide
        this.anims.create({
            key: 'rotateAsteroid',
            frames: this.anims.generateFrameNumbers('asteroid', { start: 0, end: 63 }), // 8x8 = 64 frames
            frameRate: 12,
            repeat: -1
        });

        // Criar grupo de asteroides
        this.asteroids = this.physics.add.group();

        this.asteroidTimer = this.time.addEvent({
            delay: 1500,
            callback: () => {
                const x = Phaser.Math.Between(50, 430);
                const asteroid = this.asteroids.create(x, -100, 'asteroid');
                asteroid.setVelocityY(100);
                asteroid.play('rotateAsteroid');

                // Probabilidades de tamanho
                const chance = Phaser.Math.Between(0, 100);

                if (chance < 60) {
                    // 60% de probabilidade → pequeno
                    asteroid.setScale(0.5);
                } else if (chance < 90) {
                    // 30% de probabilidade → médio
                    asteroid.setScale(0.8);
                } else {
                    // 10% de probabilidade → grande
                    asteroid.setScale(1.2);
                }
            },
            loop: true,
            paused: true
        });


        this.lives = 3; // número inicial de vidas

        this.livesText = this.add.text(10, 10, '❤️❤️❤️', {
            fontSize: '20px',
            fill: '#fff'
        });

        //colisão nave-asteroide
        this.physics.add.overlap(this.ship, this.asteroids, this.hitAsteroid, null, this);

        this.fuelLevel = 100; // nível inicial de combustível

        const width = this.sys.game.config.width;

        // barra de combustível
        this.fuelBar = this.add.rectangle(width - 20, 20, this.fuelLevel, 10, 0x00ff00);
        this.fuelBar.setOrigin(1, 0.5); //origem no canto superior direito

        // Texto da percentagem de combustível
        this.fuelText = this.add.text(width - 120, 20, 'Fuel: 100%', {
            fontSize: '16px',
            fill: '#fff'
        });

        this.fuelText.setOrigin(1, 0.5); // origem no canto superior direito



        // Animação de piscar do combustível
        this.anims.create({
            key: 'blinkFuel',
            frames: this.anims.generateFrameNumbers('fuel', { start: 0, end: 3 }),
            frameRate: 4,   // velocidade do piscar
            repeat: -1      // repete para sempre
        });

        // Grupo de combustíveis
        this.fuels = this.physics.add.group();

        // Adiciona combustível periodicamente
        //const fuel = this.fuels.create(Phaser.Math.Between(50, 430), 0, 'fuel');
        //fuel.play('blinkFuel');
        //fuel.setVelocityY(100);

        // Colisão nave-combustível
        this.physics.add.overlap(this.ship, this.fuels, this.collectFuel, null, this);

        // Adiciona combustível periodicamente
        this.fuelTimer = this.time.addEvent({
            delay: 3000, // a cada 5 segundos
            callback: () => {
                const x = Phaser.Math.Between(50, 430);
                const fuel = this.fuels.create(x, -50, 'fuel');
                fuel.play('blinkFuel');
                fuel.setVelocityY(100);
            },
            loop: true,
            paused: true
        });

        // Texto de início do jogo

        this.startText = this.add.text(240, 360, 'Clique para começar', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Função para iniciar o jogo
        this.gameStarted = false;

        this.input.once('pointerdown', () => {
            let countdown = 3; // iniciar contagem regressiva de 3 segundos
            this.startText.setText(countdown); // mostrar o número inicial

            // Função para iniciar o jogo após a contagem regressiva
            const timer = this.time.addEvent({
                delay: 1000, // 1 segundo
                callback: () => {
                    countdown--;
                    if (countdown > 0) {
                        this.startText.setText(countdown);
                    } else {
                        this.startText.setText('GO!'); // mostrar "GO!" quando chegar a 0
                        // Iniciar o jogo após um breve atraso
                        this.time.delayedCall(500, () => {// 500 ms de atraso
                            this.startText.setVisible(false); // esconder o texto de início
                            this.startGame();// iniciar o jogo
                        });
                        timer.remove(); // parar o timer
                    }
                },
                loop: true // repetir até chegar a 0
            });
        });


        // Animação de explosão
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }),
            frameRate: 20,
            hideOnComplete: true
        });


        // Configurar colisão com a linha de chegada
        this.physics.add.existing(this.finishLine, true); // objeto estático
        this.physics.add.overlap(this.ship, this.finishLine, this.reachFinish, null, this);

    }

    update() {
        // Move o fundo para criar efeito de scroll vertical
        if (this.backgroundMoving) {
            this.background.tilePositionY -= 2;
        }

        if (this.background.tilePositionY <= -this.alturaDoPercurso) {
            // mostrar linha de meta
            this.finishLine.setVisible(true);
            // parar scroll
            this.finishLine.setVelocityY(100); // desce até colidir com a nave
        }

        if (this.gameStarted) {
            if (this.cursors.left.isDown) {
                this.ship.setVelocityX(-200); // move para a esquerda
                this.ship.play('turnLeft', true); // aplica animação de virar à esquerda
            } else if (this.cursors.right.isDown) {
                this.ship.setVelocityX(200); // move para a direita
                this.ship.play('turnRight', true); // aplica animação de virar à direita
            } else {
                this.ship.setVelocityX(0); // nave parada lateralmente
                this.ship.play('idle', true); // aplica animação idle
            }

        }


        this.asteroids.children.each((asteroid) => {
            if (asteroid.y > this.sys.game.config.height + 50) {
                asteroid.destroy();
            }
        });




        // dentro de update()
        if (this.gameStarted) {
            this.fuelLevel -= 0.05;

            if (this.fuelLevel < 0) {
                this.fuelLevel = 0;
                this.ship.setVelocityY(200);
                this.gameOver();
            }
        }

         // atualizar texto do combustível
        this.fuelText.setText('Fuel: ' + Math.floor(this.fuelLevel) + '%');


        // atualizar largura da barra
        this.fuelBar.width = this.fuelLevel;


        // mudar cor da barra conforme o nível de combustível
        if (this.fuelLevel > 60) {
            this.fuelBar.fillColor = 0x00ff00; // verde
        } else if (this.fuelLevel > 30) {
            this.fuelBar.fillColor = 0xffff00; // amarelo
        } else {
            this.fuelBar.fillColor = 0xff0000; // vermelho
        }




    }

    hitAsteroid(ship, asteroid) {
        asteroid.destroy(); // remove o asteroide ao colidir

        this.lives--; // perde uma vida

        // Atualiza o texto com o número de corações restantes
        this.livesText.setText('❤️'.repeat(this.lives));

        // Mudar cor da nave (vermelho)
        this.ship.setTint(0xff0000);

        // Voltar ao normal após 200ms
        this.time.delayedCall(200, () => {
            this.ship.clearTint();
        });

        if (this.lives <= 0) {
            this.explodeAndGameOver();
        }
    }

    gameOver() {
        // Nave cai antes de mudar de cena
        this.ship.setVelocityY(300);

        this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene');
        });
    }


    collectFuel(ship, fuel) {

        this.ship.setTint(0x00ff00); // muda a cor da nave para verde

        this.time.delayedCall(200, () => {
            this.ship.clearTint(); // volta à cor normal após 200ms
        }
        );

        fuel.destroy(); // remove o combustível coletado
        this.fuelLevel += 50; // aumenta o nível de combustível
        if (this.fuelLevel > 100) {
            this.fuelLevel = 100; // limita ao máximo
        }

    }


    startGame() {
        this.gameStarted = true;

        // Nave sobe até ao meio do ecrã
        this.tweens.add({
            targets: this.ship,
            y: 360, // posição final (meio do ecrã)
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                // Só depois de subir é que o fundo começa a mover
                this.backgroundMoving = true;
                this.asteroidTimer.paused = false; // começa spawn
                this.fuelTimer.paused = false;
            }
        });
    }


    explodeAndGameOver() {
        // Parar o movimento do fundo
        this.backgroundMoving = false;
        // Parar a nave
        this.ship.setVelocity(0, 0);

        // Criar sprite de explosão na posição da nave
        const explosion = this.add.sprite(this.ship.x, this.ship.y, 'explosion');
        explosion.setScale(5);
        explosion.play('explode');

        // Esconder nave
        this.ship.setVisible(false);
        // Mudar para a cena de Game Over após a animação
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene');
        }
        );
    }


    reachFinish() {
        // Parar movimento
        this.backgroundMoving = false;
        this.ship.setVelocity(0);

        // Mostrar mensagem de vitória
        this.add.text(240, 360, 'YOU WIN!', {
            fontSize: '32px',
            fill: '#0f0'
        }).setOrigin(0.5);

        // Após alguns segundos, ir para cena de vitória ou reinício
        this.time.delayedCall(2000, () => {
            this.scene.start('GameOverScene'); // ou criar uma VictoryScene
        });
    }


}
