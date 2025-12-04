export class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
    }

    preload() {
        // Imagens
        this.load.image('background', 'assets/images/spaceBase.png');
        this.load.image('finishLine', 'assets/images/finishLine.png');

        // Spritesheets
        this.load.spritesheet('ship', 'assets/sprites/ship.png', { frameWidth: 16, frameHeight: 24 });
        this.load.spritesheet('asteroid', 'assets/sprites/asteroid.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('fuel', 'assets/sprites/star.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('explosion', 'assets/sprites/explosion.png', { frameWidth: 16, frameHeight: 16 });


        // Sons 
        this.load.audio('fuelSound', 'assets/audio/fuel.wav');
        this.load.audio('explosionSound', 'assets/audio/explosion.mp3');
        this.load.audio('countdownSound', 'assets/audio/321.wav');
        this.load.audio('winSound', 'assets/audio/win1.wav');
        this.load.audio('gameOverSound', 'assets/audio/gameOver.mp3');
        this.load.audio('rocketSound', 'assets/audio/rocket.wav');
        this.load.audio('loseSound', 'assets/audio/fire.mp3');
        this.load.audio('backgroundMusic', 'assets/audio/bck.mp3');

        this.load.plugin(
            'rexvirtualjoystickplugin',
            'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js',
            true
        );


    }

    create() {

        

        // Sons
        this.fuelSound = this.sound.add('fuelSound');
        this.explosionSound = this.sound.add('explosionSound');
        this.countdownSound = this.sound.add('countdownSound');
        this.winSound = this.sound.add('winSound');
        this.gameOverSound = this.sound.add('gameOverSound');
        this.rocketSound = this.sound.add('rocketSound');
        this.loseSound = this.sound.add('loseSound');
        this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.7 });


        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // Fundo
        this.background = this.add.tileSprite(240, 360, 480, 720, 'background');

        // Distância total
        this.alturaDoPercurso = 10000;
        this.distanceTravelled = 0;

        // Linha de chegada
        this.finishLine = this.physics.add.image(240, -100, 'finishLine');
        this.finishLine.setVisible(false);

        // Nave
        this.ship = this.physics.add.sprite(240, 600, 'ship');
        this.ship.setScale(2);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.ship.setCollideWorldBounds(true);

        // Animações da nave
        this.anims.create({ key: 'idle', frames: [{ key: 'ship', frame: 2 }, { key: 'ship', frame: 7 }], frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'turnLeft', frames: this.anims.generateFrameNumbers('ship', { frames: [0, 5] }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'turnRight', frames: this.anims.generateFrameNumbers('ship', { frames: [4, 9] }), frameRate: 6, repeat: 0 });
        this.ship.play('idle');

        // Asteroides
        this.asteroids = this.physics.add.group();
        this.anims.create({ key: 'rotateAsteroid', frames: this.anims.generateFrameNumbers('asteroid', { start: 0, end: 63 }), frameRate: 12, repeat: -1 });

        this.asteroidTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnAsteroid,
            callbackScope: this,
            loop: true,
            paused: true
        });

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
            callback: this.spawnFuel,
            callbackScope: this,
            loop: true,
            paused: true
        });

        // Vidas
        this.lives = 3;
        this.livesText = this.add.text(width - 20, 50, '❤️❤️❤️', { fontSize: '16px', fill: '#fff' }).setOrigin(1, 0);

        // Texto inicial
        this.startText = this.add.text(240, 360, 'Clique para começar', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.gameStarted = false;

        this.input.once('pointerdown', () => this.startCountdown());

        // Explosão
        this.anims.create({ key: 'explode', frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }), frameRate: 20 });

        this.physics.add.overlap(this.ship, this.finishLine, this.reachFinish, null, this);

        // Score e timer
        this.score = 0;
        this.lastElapsed = 0;
        this.scoreText = this.add.text(16, 10, 'Score: 0', { fontSize: '12px', fill: '#fff' });

        this.startTime = 0;
        this.timerText = this.add.text(16, 28, 'Time: 0', { fontSize: '12px', fill: '#fff' });

        // Progress bar
        this.progressLabel = this.add.text(width / 2, 5, 'Race Progress', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5, 0);
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 2 - 75, 20, 150, 8);

        this.progressBar = this.add.graphics();

        // Criar joystick
        this.joystick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
            x: width - 100,
            y: height - 100,
            radius: 60,
            base: this.add.circle(0, 0, 60, 0x888888),
            thumb: this.add.circle(0, 0, 30, 0xcccccc),
        });

        // Criar cursorKeys a partir do joystick
        this.cursorKeys = this.joystick.createCursorKeys();


    }

    update() {

        // Timer e pontos por segundo
        if (this.gameStarted) {
            if (!this.startTime) {
                this.startTime = this.time.now;
            }

            let elapsed = Math.floor((this.time.now - this.startTime) / 1000);
            this.timerText.setText('Time: ' + elapsed);

            // 1 ponto por segundo
            if (elapsed > this.lastElapsed) {
                this.updateScore(1);
                this.lastElapsed = elapsed;
            }
        }

        // Movimento do fundo
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
            // --- Controlo da nave (teclado + joystick) ---
            let movingLeft = this.cursors.left.isDown || this.cursorKeys.left.isDown;
            let movingRight = this.cursors.right.isDown || this.cursorKeys.right.isDown;

            if (movingLeft) {
                this.ship.setVelocityX(-200);
                this.ship.play('turnLeft', true);
            } else if (movingRight) {
                this.ship.setVelocityX(200);
                this.ship.play('turnRight', true);
            } else {
                this.ship.setVelocityX(0);
                this.ship.play('idle', true);
            }

            // --- Consumo de combustível ---
            this.fuelLevel -= 0.05;
            if (this.fuelLevel <= 0) {
                this.fuelLevel = 0;
                this.gameOver();
            }
        }

        // Asteroides evitados
        this.asteroids.children.each((asteroid) => {
            if (asteroid && asteroid.active && asteroid.y > this.sys.game.config.height + 50) {
                asteroid.destroy();
                if (this.gameStarted) this.avoidAsteroid();
            }
        });

        // Linha de chegada
        if (this.background.tilePositionY <= -this.alturaDoPercurso) {
            this.finishLine.setVisible(true);
            this.finishLine.setVelocityY(100);
        }
    }

    spawnAsteroid() {
        const x = Phaser.Math.Between(50, 430);
        const asteroid = this.asteroids.create(x, -100, 'asteroid');
        asteroid.setVelocityY(100);
        asteroid.play('rotateAsteroid');

        const chance = Phaser.Math.Between(0, 100);
        if (chance < 60) asteroid.setScale(0.5);
        else if (chance < 90) asteroid.setScale(0.8);
        else asteroid.setScale(1.2);
    }

    spawnFuel() {
        const x = Phaser.Math.Between(50, 430);
        const fuel = this.fuels.create(x, -50, 'fuel');
        fuel.play('blinkFuel');
        fuel.setVelocityY(100);
    }

    startCountdown() {
        this.countdownSound.play();
        let countdown = 3;
        this.startText.setText(countdown);


        const timer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                countdown--;
                if (countdown > 0) {
                    this.startText.setText(countdown);
                } else {
                    this.startText.setText('GO!');
                    this.time.delayedCall(500, () => {
                        this.startText.setVisible(false);
                        this.startGame();
                        this.rocketSound.play({ volume: 1.0 });
                    });
                    timer.remove();
                }
            },
            loop: true
        });
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
                this.backgroundMusic.play();

            }
        });
    }

    hitAsteroid(ship, asteroid) {
        asteroid.destroy();
        this.loseSound.play();

        this.updateScore(-50);
        this.lives--;

        this.livesText.setText('❤️'.repeat(Math.max(0, this.lives)));

        this.ship.setTint(0xff0000);
        this.time.delayedCall(200, () => this.ship.clearTint());

        if (this.lives <= 0) {
            this.explodeAndGameOver();
        }
    }

    avoidAsteroid() {
        this.updateScore(10);
    }

    collectFuel(ship, fuel) {
        this.updateScore(20);
        this.fuelSound.play();

        this.ship.setTint(0x00ff00);
        this.time.delayedCall(200, () => this.ship.clearTint());

        fuel.destroy();

        this.fuelLevel += 50;
        if (this.fuelLevel > 100) this.fuelLevel = 100;
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

        let text = this.add.text(
            x,
            y,
            (amount > 0 ? "+" : "") + amount,
            { fontSize: '16px', fill: color }
        );

        this.tweens.add({
            targets: text,
            y: y - 20,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    updateFuelBar(value) {
        this.fuelBar.clear();

        let color = this.fuelLevel > 60 ? 0x00ff00 :
            this.fuelLevel > 30 ? 0xffff00 :
                0xff0000;

        this.fuelBar.fillStyle(color, 1);
        this.fuelBar.fillRect(this.sys.game.config.width - 130, 20, 120 * value, 8);
    }

    updateProgress(value) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x00ff00, 1);
        this.progressBar.fillRect(
            this.sys.game.config.width / 2 - 75,
            20,
            150 * value,
            8
        );
    }

    gameOver() {
        this.ship.setVelocityY(300);
        this.gameOverSound.play();
        this.backgroundMusic.stop();


        this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene', {
                score: this.score,
                time: this.lastElapsed
            });
        });
    }

    explodeAndGameOver() {
        this.backgroundMoving = false;
        this.ship.setVelocity(0, 0);

        const explosion = this.add.sprite(this.ship.x, this.ship.y, 'explosion');
        explosion.setScale(5);
        explosion.play('explode');
        this.explosionSound.play();

        this.ship.setVisible(false);

        //game over após explosão com funcao gameOver()
        this.gameOver();


    }

    reachFinish() {

        this.backgroundMoving = false;
        this.ship.setVelocity(0);

        this.add.text(240, 360, 'YOU WIN!', {
            fontSize: '32px',
            fill: '#0f0'
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            this.scene.start('WinScene', {
                score: this.score,
                time: this.lastElapsed

            });
            this.winSound.play();
            this.backgroundMusic.stop();
        });
    }
}
