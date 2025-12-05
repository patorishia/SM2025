export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // Fundo preto
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);

        // Título do jogo
        this.add.text(width / 2, height / 4, 'Space Race', {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Botão JOGAR
        const playBtn = this.add.rectangle(width / 2, height / 2, 200, 50, 0x808080)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        const playText = this.add.text(width / 2, height / 2, 'PLAY', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        playBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        playBtn.on('pointerover', () => playBtn.setFillStyle(0xa9a9a9));
        playBtn.on('pointerout', () => playBtn.setFillStyle(0x808080));

        // Botão INSTRUCTIONS
        const instrBtn = this.add.rectangle(width / 2, height / 2 + 80, 200, 50, 0x808080)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        const instrText = this.add.text(width / 2, height / 2 + 80, 'INSTRUCTIONS', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        instrBtn.on('pointerdown', () => {
            this.showInstructions();
        });
        instrBtn.on('pointerover', () => instrBtn.setFillStyle(0xa9a9a9));
        instrBtn.on('pointerout', () => instrBtn.setFillStyle(0x808080));
    }
    showInstructions() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // Fundo semi-transparente
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0, 0);

        // Caixa de instruções
        const box = this.add.rectangle(width / 2, height / 2, 400, 300, 0x222222)
            .setStrokeStyle(2, 0xffffff);

        const instructions =
            "Objective:\n" +
            "- Reach the finish line avoiding asteroids\n" +
            "- Collect fuel to keep going\n\n" +
            "Controls:\n" +
            "- Left/Right arrows: move the ship\n" +
            "- For mobile: tap the screen to move\n\n" +
            "Good luck!";

        // Texto das instruções
        const instructionsText = this.add.text(width / 2, height / 2, instructions, {
            fontSize: '18px',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 380 }
        }).setOrigin(0.5);

        // Botão CLOSE
        const closeBtn = this.add.rectangle(width / 2, height / 2 + 120, 120, 40, 0x808080)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        const closeText = this.add.text(width / 2, height / 2 + 120, 'CLOSE', {
            fontSize: '20px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Evento do botão CLOSE
        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            box.destroy();
            instructionsText.destroy(); // <-- destrói o texto
            closeBtn.destroy();
            closeText.destroy();

            // Restaurar opacidade dos elementos do menu
            this.children.each(child => {
                if (![overlay, box, instructionsText, closeBtn, closeText].includes(child)) {
                    child.setAlpha(1);
                }
            });
        });

        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0xa9a9a9));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x808080));

        // Diminuir os outros elementos do menu enquanto overlay está ativo
        this.children.each(child => {
            if (![overlay, box, instructionsText, closeBtn, closeText].includes(child)) {
                child.setAlpha(0.3);
            }
        });
    }

}
