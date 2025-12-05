export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // Título
        this.add.text(width / 2, height / 2 - 200, 'GAME OVER', {
            fontSize: '40px',
            fill: '#ff0000'
        }).setOrigin(0.5);

        // Score
        this.add.text(width / 2, height / 2 - 100, `Score: ${data.score || 0}`, {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Time
        this.add.text(width / 2, height / 2 - 50, `Time: ${data.time || 0}s`, {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Botão Restart
        const buttonBg = this.add.rectangle(width / 2, height / 2 + 60, 150, 50, 0x808080)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        const buttonText = this.add.text(width / 2, height / 2 + 60, 'Restart', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        buttonBg.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        buttonBg.on('pointerover', () => buttonBg.setFillStyle(0xa9a9a9));
        buttonBg.on('pointerout', () => buttonBg.setFillStyle(0x808080));
    }
}
