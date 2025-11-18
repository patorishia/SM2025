export class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
    }

    preload() {
        // Carrega a imagem de fundo
        this.load.image('background', 'assets/spaceBase.png');

        // Carrega a imagem da linha de chegada
        this.load.image('finishLine', 'assets/finishLine.png');

        // Carrega a spritesheet da nave (cada frame tem 16x24 px)
        this.load.spritesheet('ship', 'assets/ship.png', { frameWidth: 16, frameHeight: 24 });

        this.load.spritesheet('asteroid', 'assets/asteroid.png', {
            frameWidth: 128,
            frameHeight: 128
        });
    }

    create() {

        // Adiciona o fundo como tileSprite (permite movimento vertical infinito)
        this.background = this.add.tileSprite(240, 360, 480, 720, 'background');
        // this.finishLine = this.add.image(240, 200, 'finishLine');
        //this.finishLine.setVisible(false); // começa invisível

        this.alturaDoPercurso = 2000; // altura total do percurso até a linha de chegada

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

        this.time.addEvent({
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
            loop: true
        });




    }

    update() {
        // Move o fundo para criar efeito de scroll vertical
        this.background.tilePositionY -= 2;

        /*  if (this.background.tilePositionY <= -this.alturaDoPercurso) {
              // parar scroll
              this.background.tilePositionY = -this.alturaDoPercurso;
  
              // mostrar linha de meta
              this.finishLine.setVisible(true);
          }
  */
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


        // update()

        this.asteroids.children.each((asteroid) => {
            if (asteroid.y > this.sys.game.config.height + 50) {
                asteroid.destroy();
            }
        });



    }





}
