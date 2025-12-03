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

        // Carrega a spritesheet dos asteroides
        this.load.spritesheet('asteroid', 'assets/sprites/asteroid.png', { frameWidth: 128, frameHeight: 128 });

        // Carrega a spritesheet do combustível
        this.load.spritesheet('fuel', 'assets/sprites/star.png', { frameWidth: 32, frameHeight: 32 });

        // Carrega a spritesheet da explosão
        this.load.spritesheet('explosion', 'assets/sprites/explosion.png', { frameWidth: 16, frameHeight: 16 });
    }

    create() {
        const width = this.sys.game.config.width;

        // Fundo
        this.background = this.add.tileSprite(240, 360, 480, 720, 'background');

        this.alturaDoPercurso = 10000; // altura total do percurso
        this.distanceTravelled = 0; // distância percorrida

        // Linha de chegada
        this.finishLine = this.physics.add.image(240, -100, 'finishLine');
        this.finishLine.setVisible(false);

        // Nave
        this.ship = this.physics.add.sprite(240, 600, 'ship');
        this.ship.setScale(2);
        this.cursors = this.input.keyboard.createCursorKeys();

        // Animações da nave
        this.anims.create({ key: 'idle', frames: [{ key: 'ship', frame: 2 }, { key: 'ship', frame: 7 }], frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'turnLeft', frames: this.anims.generateFrameNumbers('ship', { frames: [0, 5] }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'turnRight', frames: this.anims.generateFrameNumbers('ship', { frames: [4, 9] }), frameRate: 6, repeat: 0 });
        this.ship.play('idle');

        this.physics.world.setBounds(0, 0, width, this.sys.game.config.height);
        this.physics.add.existing(this.ship);
        this.ship.setCollideWorldBounds(true);

        // Animação dos asteroides
        this.anims.create({ key: 'rotateAsteroid', frames: this.anims.generateFrameNumbers('asteroid', { start: 0, end: 63 }), frameRate: 12, repeat: -1 });
        this.asteroids = this.physics.add.group();

        this.asteroidTimer = this.time.addEvent({
            delay: 1500,
            callback: () => {
                const x = Phaser.Math.Between(50, 430);
                const asteroid = this.asteroids.create(x, -100, 'asteroid');
                asteroid.setVelocityY(100);
                asteroid.play('rotateAsteroid');

                const chance = Phaser.Math.Between(0, 100);
                if (chance < 60) asteroid.setScale(0.5);
                else if (chance < 90) asteroid.setScale(0.8);
                else asteroid.setScale(1.2);
            },
            loop: true,
            paused: true
        });

        // Vidas
        this.lives = 3;
        this.livesText = this.add.text(width - 20, 50, '❤️❤️❤️', { fontSize: '16px', fill: '#fff' }).setOrigin(1, 0);

        this.physics.add.overlap(this.ship, this.asteroids, this.hitAsteroid, null, this);

        // Fuel
        this.fuelLevel = 100;
        this.fuelBarBox = this.add.graphics();
        this.fuelBarBox.fillStyle(0x222222, 0.8);
        this.fuelBarBox.fillRect(width - 130, 20, 120, 8);
        this.fuelBar = this.add.graphics();
        this.fuelText = this.add.text(width - 20, 5, 'Fuel: 100%', { fontSize: '12px', fill: '#fff' }).setOrigin(1, 0);

        this.anims.create({ key: 'blinkFuel', frames: this.anims.generateFrameNumbers('fuel', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        this.fuels = this.physics.add.group();
        this.physics.add.overlap(this.ship, this.fuels, this.collectFuel, null, this);

        this.fuelTimer = this.time.addEvent({
            delay: 3000,
            callback: () => {
                const x = Phaser.Math.Between(50, 430);
                const fuel = this.fuels.create(x, -50, 'fuel');
                fuel.play('blinkFuel');
                fuel.setVelocityY(100);
            },
            loop: true,
            paused: true
        });

        // Texto inicial
        this.startText = this.add.text(240, 360, 'Clique para começar', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.gameStarted = false;

        this.input.once('pointerdown', () => {
            let countdown = 3;
            this.startText.setText(countdown);

            const timer = this.time.addEvent({
                delay: 1000,
                callback: () => {
                    countdown--;
                    if (countdown > 0) this.startText.setText(countdown);
                    else {
                        this.startText.setText('GO!');
                        this.time.delayedCall(500, () => {
                            this.startText.setVisible(false);
                            this.startGame();
                        });
                        timer.remove();
                    }
                },
                loop: true
            });
        });

        // Explosão
        this.anims.create({ key: 'explode', frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }), frameRate: 20, hideOnComplete: true });

        // Linha de chegada
        this.physics.add.existing(this.finishLine, true);
        this.physics.add.overlap(this.ship, this.finishLine, this.reachFinish, null, this);

        // Score e timer
        this.score = 0;
        this.lastElapsed = 0; // inicializa o tempo decorrido
        this.scoreText = this.add.text(16, 10, 'Score: 0', { fontSize: '12px', fill: '#fff' });
        this.startTime = 0; // só começa quando o jogo inicia
        this.timerText = this.add.text(16, 28, 'Time: 0', { fontSize: '12px', fill: '#fff' });

        // Progress bar
        this.progressLabel = this.add.text(width / 2, 5, 'Progress', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5, 0);
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 2 - 75, 20, 150, 8);
        this.progressBar = this.add.graphics();
    }

    update() {

        // Timer e pontuação
        if (this.gameStarted) {

            // Timer
            if (!this.startTime) this.startTime = this.time.now;
            let elapsed = Math.floor((this.time.now - this.startTime) / 1000);
            this.timerText.setText('Time: ' + elapsed);

            // Pontos por sobrevivência (1 por segundo)
            if (elapsed > this.lastElapsed) {
                this.updateScore(1);
                this.lastElapsed = elapsed;
            }
        }


        // Atualiza progresso
        if (this.backgroundMoving) {
            this.background.tilePositionY -= 2;
            this.distanceTravelled += 2;
        }
        let progress = Phaser.Math.Clamp(this.distanceTravelled / this.alturaDoPercurso, 0, 1);
        this.updateProgress(progress);

        // Fuel
        this.fuelText.setText('Fuel: ' + Math.floor(this.fuelLevel) + '%');
        this.updateFuelBar(this.fuelLevel / 100);

        // Movimento da nave
        if (this.gameStarted) {
            if (this.cursors.left.isDown) {
                this.ship.setVelocityX(-200);
                this.ship.play('turnLeft', true);
            } else if (this.cursors.right.isDown) {
                this.ship.setVelocityX(200);
                this.ship.play('turnRight', true);
            } else {
                this.ship.setVelocityX(0);
                this.ship.play('idle', true);
            }

            this.fuelLevel -= 0.05;
            if (this.fuelLevel < 0) {
                this.fuelLevel = 0;
                this.ship.setVelocityY(200);
                this.gameOver();
            }
        }

        this.asteroids.children.each((asteroid) => {
            // verifica se o objecto existe e está ativo antes de trabalhar com ele
            if (asteroid && asteroid.active && asteroid.y > this.sys.game.config.height + 50) {
                asteroid.destroy();

                // só dá pontos se o jogo já começou
                if (this.gameStarted) {
                    this.avoidAsteroid();
                }
            }
        }, this);

        // Cor da fuel bar
        let color = this.fuelLevel > 60 ? 0x00ff00 : this.fuelLevel > 30 ? 0xffff00 : 0xff0000;
        this.fuelBar.fillColor = color;

        // Linha de chegada
        if (this.background.tilePositionY <= -this.alturaDoPercurso) {
            this.finishLine.setVisible(true);
            this.finishLine.setVelocityY(100);
        }
    }

   hitAsteroid(ship, asteroid) {
    asteroid.destroy();

    this.updateScore(-50); // popup automático correto

    this.lives--;
    this.livesText.setText('❤️'.repeat(Math.max(0, this.lives)));

    this.ship.setTint(0xff0000);
    this.time.delayedCall(200, () => this.ship.clearTint());

    if (this.lives <= 0) this.explodeAndGameOver();
}



avoidAsteroid() {
    if (!this.gameStarted) return;
    this.updateScore(10);  
}




    gameOver() {
        this.ship.setVelocityY(300);
        this.time.delayedCall(1500, () => { this.scene.start('GameOverScene'); });
    }

   collectFuel(ship, fuel) {
    this.updateScore(20); // popup correto +20

    this.ship.setTint(0x00ff00);
    this.time.delayedCall(200, () => this.ship.clearTint());

    fuel.destroy();

    this.fuelLevel += 50;
    if (this.fuelLevel > 100) this.fuelLevel = 100;
}



    startGame() {
        this.gameStarted = true;
        this.tweens.add({
            targets: this.ship,
            y: 360,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                this.backgroundMoving = true;
                this.asteroidTimer.paused = false;
                this.fuelTimer.paused = false;
            }
        });
    }

    explodeAndGameOver() {
        this.backgroundMoving = false;
        this.ship.setVelocity(0, 0);
        const explosion = this.add.sprite(this.ship.x, this.ship.y, 'explosion');
        explosion.setScale(5);
        explosion.play('explode');
        this.ship.setVisible(false);
        this.time.delayedCall(1000, () => { this.scene.start('GameOverScene'); });
    }

    reachFinish() {
        this.backgroundMoving = false;
        this.ship.setVelocity(0);
        this.add.text(240, 360, 'YOU WIN!', { fontSize: '32px', fill: '#0f0' }).setOrigin(0.5);
        this.time.delayedCall(2000, () => { this.scene.start('GameOverScene'); });
    }

    updateProgress(value) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x00ff00, 1);
        this.progressBar.fillRect(this.sys.game.config.width / 2 - 75, 20, 150 * value, 8);
    }

    updateFuelBar(value) {
        this.fuelBar.clear();
        let color = this.fuelLevel > 60 ? 0x00ff00 : this.fuelLevel > 30 ? 0xffff00 : 0xff0000;
        this.fuelBar.fillStyle(color, 1);
        this.fuelBar.fillRect(this.sys.game.config.width - 130, 20, 120 * value, 8);
    }

    updateScore(amount, popup = true) {
    this.score += amount;
    if (this.score < 0) this.score = 0;

    this.scoreText.setText('Score: ' + this.score);

    if (popup) {
        this.showScoreChange(amount, this.ship.x, this.ship.y - 40);
    }
}


showScoreChange(amount, x, y) {
    const color = amount >= 0 ? '#0f0' : '#f00';

    let text = this.add.text(x, y, (amount > 0 ? "+" : "") + amount,
        { fontSize: '16px', fill: color });

    this.tweens.add({
        targets: text,
        y: y - 20,
        alpha: 0,
        duration: 800,
        onComplete: () => text.destroy()
    });
}


}
