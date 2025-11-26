export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {

        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        this.add.text(width / 2, height / 2 - 200, 'GAME OVER', {
            fontSize: '40px',
            fill: '#ff0000'
        }).setOrigin(0.5);


        // Criar retângulo como fundo do botão
        const buttonBg = this.add.rectangle(width / 2, height / 2 + 60, 150, 50, 0x808080);
        buttonBg.setOrigin(0.5);
        buttonBg.setStrokeStyle(2, 0xffffff); // borda branca

        // Texto do botão
        const buttonText = this.add.text(width / 2, height / 2 + 60, 'Restart', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Tornar o retângulo interativo
        buttonBg.setInteractive();

        // Evento de clique
        buttonBg.on('pointerdown', () => {
            this.scene.start('GameScene'); // reinicia o jogo
        });

        // Efeito hover (opcional)
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0xa9a9a9);
        });
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x808080);
        });
    }
}
