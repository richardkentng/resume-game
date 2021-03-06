class HealthBar {
    constructor (scene, x, y)
    {
        this.bar = new Phaser.GameObjects.Graphics(scene);

        this.x = x;
        this.y = y;

        this.draw();

        scene.add.existing(this.bar);
    }

    draw(num=1, denom=1)
    {
        this.bar.clear();

        //  BG
        this.bar.fillStyle(0xff0000);
        this.bar.fillRect(this.x, this.y, width, 1);

        // //  Health
        this.bar.fillStyle(0x00804d);

        const healthWidth = Math.floor(num / denom * width)
        this.bar.fillRect(0, 0, healthWidth, 2);
    }
}

        const width = window.innerWidth
        const height = window.innerHeight
        const cWidth = width/2
        const cHeight = height/2

        const config = {
            type: Phaser.AUTO,
            width,
            height,
            scene: {
                preload,
                create,
                update
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: {y: 0},
                    debug: false
                }
            }
        }


        
        const game = new Phaser.Game(config)

        let dude

        let target
        let cursors

        let icons
        let icon_keys

        let gameOver = false
        let justWon = false
        let inc = 0
        let clicks = 0

        let healthBar

        let intervalId
        let ms = 1000
        let msMin = 100

        const sndPowerdown = new Audio('./audio/powerdown.wav')
        const sndBop = new Audio('./audio/bop.m4a')
        const sndRip = new Audio('./audio/rip.wav')
        const sndDing = new Audio('./audio/ding.wav')
        const sndWoohoo = new Audio('./audio/woohoo.wav')
        const sndPiano = new Audio('./audio/piano.mp3')

        function preload() {
            cursors = this.input.keyboard.createCursorKeys()

            this.load.spritesheet('dude', './images/guy_typing_spritesheet_169_74_2.png', {frameWidth: 169, frameHeight: 74})

            this.load.image('resume', './images/resume.png')
            this.load.image('target', './images/target.png')

            this.load.image('facebook', './images/company_icons/facebook.png')
            this.load.image('apple', './images/company_icons/apple.png')
            this.load.image('amazon', './images/company_icons/amazon.png')
            this.load.image('netflix', './images/company_icons/netflix.png')
            this.load.image('google', './images/company_icons/google.png')
            this.load.image('mintbean', './images/company_icons/mintbean.png')
            icon_keys = ['facebook', 'apple', 'amazon', 'netflix', 'google', 'mintbean']
        }
        
        function create() {
            healthBar = new HealthBar(this, 0, 0)

            dude = this.add.sprite(cWidth, height - 35, 'dude')

            target = this.add.image(0, 0, 'target')
            target.destroy()

            icons = this.physics.add.group()
            for (let i = 0; i < 300; i++) {
                icon_keys.forEach(key => {
                    icons.create(0, 0, key)
                })
            }
            icons.children.iterate(icon => {
                icon.disableBody(true, true)
            })

            spawnIconsSetInterval(ms)

            //create animations for dude
            this.anims.create({
                key: 'typing',
                frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 1}),
                frameRate: 10,
                repeat: -1
            })
            this.anims.create({
                key: 'frozen',
                frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 0}),
            })
            this.anims.create({
                key: 'nohope',
                frames: this.anims.generateFrameNumbers('dude', {start: 2, end: 2}),
            })
            this.anims.create({
                key: 'fistpump',
                frames: this.anims.generateFrameNumbers('dude', {start: 3, end: 3}),
            })
            dude.anims.play('typing', true)


            //add event listeners
            onPointerDown(this)
        }
        

        function update() {
            disableUnseenIcons()

            if(!gameOver) checkActivity(this)
            inc++
        }

        function spawnIconsSetInterval(ms) {
            intervalId = setInterval(() => {
                const icon = icons.getFirstDead(false)
                
                const xPosStart = (Math.random() - 0.5 < 0) ? -25 : width + 25;
                let xVel = (xPosStart === -25) ? Phaser.Math.Between(200, 400) : Phaser.Math.Between(-200, -400)

                icon.enableBody(true, xPosStart, Phaser.Math.Between(35, height - 200), true, true)
                if (icon.texture.key === 'mintbean' && ms !== msMin) {
                    xVel *= 1.5
                    icon.setScale(0.66)
                } else {
                    icon.setScale(1)
                }
                icon.body.setVelocityX(xVel)
            }, ms)
        }

        function checkActivity(scene) {
            //visualize remaining time
            healthBar.draw(500 - inc, 500)

            //if player has not been clicking, make dude stop typing
            if (inc > 50) dude.anims.play('frozen', true)
            else {dude.anims.play('typing', true)}

            //if there is no activity, game over!
            if (inc > 500) {
                gameOver = true
                sndPowerdown.play()
                scene.physics.pause()
                const fontStyle = {fill: 'red', fontSize: '22px', backgroundColor: 'black'}
                scene.add.text(10, 10, 'Game Over!', fontStyle)
                scene.add.text(10, 34, 'You gave up hope!', fontStyle)
                scene.add.text(10, 65, 'You stopped sending', fontStyle)
                scene.add.text(10, 89, 'resumes!', fontStyle)
                scene.add.text(10, 120, 'Click to retry!', {fill: 'white', fontSize: '22px'})
                icons.children.iterate(icon => {
                    icon.setTint(0xff0000)
                })
                dude.anims.play('nohope', true)
            }
        }

        function disableUnseenIcons() {
            icons.children.iterate(icon => {
                if (icon.x < -50|| icon.x > width + 50)  {
                    icon.disableBody(true, true)
                }
            })
        }


        function onPointerDown(scene) {
            scene.input.on('pointerdown', pointer => {
                if (gameOver) {
                    if (!justWon) {
                        location.reload()
                    }
                    return  
                } 

                sndBop.play()
                inc = 0
                clicks++

                //move target to pointer (resume aims toward target)
                target.x = pointer.x
                target.y = pointer.y

                const resume = scene.physics.add.image(dude.x, dude.y, 'resume')
                resume.scene.physics.moveToObject(resume, target, 1000)

                scene.physics.add.collider(resume, icons, function(resume, icon) {


                    const red = 0xff0000
                    const green = 0x00ff00
                    let tint = red

                    let max = 200 - clicks
                    if (max < 4) max = 4
                    let rand = Math.floor(Math.random() * max)
                    
                    if (rand === 3) {
                        gameOver = true
                        justWon = true
                        setTimeout(() => {justWon = false}, 1000)

                        sndDing.play()
                        sndWoohoo.play()

                        tint = green

                        scene.physics.pause()

                        scene.add.text(15, 15, 'Your hard work paid off!', {fill: 'lime', fontSize: '22px', backgroundColor: 'black'})
                        scene.add.text(15, 40, 'Your resume was accepted!', {fill: 'lime', fontSize: '22px', backgroundColor: 'black'})

                        const key = icon.texture.key
                        const firstLetter = key[0].toUpperCase()
                        const otherLetters = key.substring(1, key.length)

                        scene.add.text(15, 67, `${firstLetter + otherLetters} is interested!`, {fill: 'lime', fontSize: '22px', backgroundColor: 'black'})
                        scene.add.text(15, 94, 'Click to replay!', {fill: 'white', fontSize: '22px', backgroundColor: 'black'})


                        dude.anims.play('fistpump', true)

                    } else {
                        if (icon.texture.key === 'mintbean' && ms !== msMin) {
                            sndPiano.play()
                            clearInterval(intervalId)
                            const msHalf = Math.floor(ms/2)
                            ms = msHalf > msMin ? msHalf : msMin
                            spawnIconsSetInterval(ms)
                        } else {
                            sndRip.play()
                        }

                        setTimeout(() => {
                            resume.destroy()
                            icon.destroy()
                        }, 50)
                    }
                    resume.setTint(tint)
                    icon.setTint(tint)

                }, null, this)
            })
        }


