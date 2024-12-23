'use strict';

document.addEventListener('DOMContentLoaded', function () {
    let gl;
    let surfaceU;
    let surfaceV;
    let shProgram;
    let spaceball;

    // Add sliders for granularity control
    const uSlider = document.getElementById("uGranularity");
    const vSlider = document.getElementById("vGranularity");

    if (uSlider && vSlider) {
        uSlider.addEventListener('input', updateSurface);
        vSlider.addEventListener('input', updateSurface);
    } else {
        console.error('Granularity sliders not found in the DOM');
    }

    function deg2rad(angle) {
        return angle * Math.PI / 180;
    }

    // Shader source code
    const vertexShaderSource = `
        attribute vec3 aPosition;
        attribute vec3 aNormal;
        
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uNormalMatrix;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vec4 position = uModelViewMatrix * vec4(aPosition, 1.0);
            vPosition = position.xyz;
            vNormal = normalize(mat3(uNormalMatrix) * aNormal);
            gl_Position = uProjectionMatrix * position;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        
        uniform vec4 color;
        uniform vec3 uLightDirection;
        uniform vec3 uViewPosition;
        uniform vec3 uAmbientColor;
        uniform vec3 uDiffuseColor;
        uniform vec3 uSpecularColor;
        uniform float uShininess;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vec3 normal = normalize(vNormal);
            vec3 lightDir = normalize(uLightDirection);
            
            // Ambient
            vec3 ambient = uAmbientColor;
            
            // Diffuse
            float diff = max(dot(normal, lightDir), 0.0);
            vec3 diffuse = diff * uDiffuseColor;
            
            // Specular
            vec3 viewDir = normalize(uViewPosition - vPosition);
            vec3 reflectDir = reflect(-lightDir, normal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
            vec3 specular = spec * uSpecularColor;
            
            // Combine all components
            vec3 result = (ambient + diffuse + specular) * color.rgb;
            gl_FragColor = vec4(result, color.a);
        }
    `;

    function createProgram(gl, vShader, fShader) {
        // Create shader objects
        let vsh = gl.createShader(gl.VERTEX_SHADER);
        let fsh = gl.createShader(gl.FRAGMENT_SHADER);

        // Set the shader source code
        gl.shaderSource(vsh, vShader);
        gl.shaderSource(fsh, fShader);

        // Compile the shaders
        gl.compileShader(vsh);
        if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
            throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
        }

        gl.compileShader(fsh);
        if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
            throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
        }

        // Create a program object and attach the shaders
        let prog = gl.createProgram();
        gl.attachShader(prog, vsh);
        gl.attachShader(prog, fsh);

        // Link the program
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
        }

        return prog;
    }

    function initGL() {
        let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
        shProgram = new ShaderProgram('Basic', prog);
        shProgram.Use();

        shProgram.iAttribPosition = gl.getAttribLocation(prog, "aPosition");
        shProgram.iAttribNormal = gl.getAttribLocation(prog, "aNormal");
        shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "uModelViewMatrix");
        shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "uProjectionMatrix");
        shProgram.iNormalMatrix = gl.getUniformLocation(prog, "uNormalMatrix");
        shProgram.iLightDirection = gl.getUniformLocation(prog, "uLightDirection");
        shProgram.iColor = gl.getUniformLocation(prog, "color");
        shProgram.iViewPosition = gl.getUniformLocation(prog, "uViewPosition");
        shProgram.iAmbientColor = gl.getUniformLocation(prog, "uAmbientColor");
        shProgram.iDiffuseColor = gl.getUniformLocation(prog, "uDiffuseColor");
        shProgram.iSpecularColor = gl.getUniformLocation(prog, "uSpecularColor");
        shProgram.iShininess = gl.getUniformLocation(prog, "uShininess");

        surfaceU = new Model('U-Lines');
        surfaceU.BufferData(CreateULines());

        surfaceV = new Model('V-Lines');
        surfaceV.BufferData(CreateVLines());

        gl.enable(gl.DEPTH_TEST);
    }

    // Other functions as before...

    function updateSurface() {
        surfaceU = new Model('U-Lines');
        surfaceU.BufferData(CreateULines(uSlider.value));

        surfaceV = new Model('V-Lines');
        surfaceV.BufferData(CreateVLines(vSlider.value));

        draw();
    }
    function CreateULines(granularity = 72) {
        let lines = [];
        let n = 720;
        let m = 100;
        let radius = 1.2;
        let height = 5;
        let frequency = 5;

        for (let i = 0; i < n; i += Math.max(1, Math.floor(720/granularity))) {
            let theta = deg2rad(i);
            let line = [];

            for (let j = 0; j <= m; j++) {
                let t = j / m;
                let y = height * t;
                let r = radius * Math.sin(frequency * Math.PI * t);
                let x = r * Math.cos(theta);
                let z = r * Math.sin(theta);

                line.push(x, y, z);
            }
            lines.push(line);
        }

        return lines;
    }

// Update CreateVLines to use granularity
    function CreateVLines(granularity = 20) {
        let lines = [];
        let n = 720;
        let m = 100;
        let radius = 1.2;
        let height = 5;
        let frequency = 5;

        for (let j = 0; j <= m; j += Math.max(1, Math.floor(100/granularity))) {
            let line = [];
            let t = j / m;
            let y = height * t;
            let r = radius * Math.sin(frequency * Math.PI * t);

            for (let i = 0; i < n; i += 10) {
                let theta = deg2rad(i);
                let x = r * Math.cos(theta);
                let z = r * Math.sin(theta);

                line.push(x, y, z);
            }
            lines.push(line);
        }

        return lines;
    }

    function Model(name) {
        this.name = name;
        this.vertexBuffers = [];
        this.counts = [];
        this.normalBuffer = null;
        this.normals = [];

        this.BufferData = function(lines) {
            this.normals = [];
            for (let vertices of lines) {
                let buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
                this.vertexBuffers.push(buffer);
                this.counts.push(vertices.length / 3);

                // Calculate normals for each vertex
                for (let i = 0; i < vertices.length; i += 3) {
                    let normal = calculateNormal(vertices[i], vertices[i+1], vertices[i+2]);
                    this.normals.push(...normal);
                }
            }

            // Create and fill normal buffer
            this.normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STREAM_DRAW);
        }

        this.Draw = function() {
            for (let i = 0; i < this.vertexBuffers.length; i++) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffers[i]);
                gl.vertexAttribPointer(shProgram.iAttribPosition, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(shProgram.iAttribPosition);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
                gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(shProgram.iAttribNormal);

                gl.drawArrays(gl.LINE_STRIP, 0, this.counts[i]);
            }
        }
    }


    function ShaderProgram(name, program) {
        this.name = name;
        this.prog = program;

        // Update attribute and uniform locations
        this.iAttribPosition = gl.getAttribLocation(this.prog, "aPosition");
        this.iAttribNormal = gl.getAttribLocation(this.prog, "aNormal");
        this.iModelViewMatrix = gl.getUniformLocation(this.prog, "uModelViewMatrix");
        this.iProjectionMatrix = gl.getUniformLocation(this.prog, "uProjectionMatrix");
        this.iNormalMatrix = gl.getUniformLocation(this.prog, "uNormalMatrix");
        this.iLightDirection = gl.getUniformLocation(this.prog, "uLightDirection");
        this.iColor = gl.getUniformLocation(this.prog, "color");
        this.iViewPosition = gl.getUniformLocation(this.prog, "uViewPosition");
        this.iAmbientColor = gl.getUniformLocation(this.prog, "uAmbientColor");
        this.iDiffuseColor = gl.getUniformLocation(this.prog, "uDiffuseColor");
        this.iSpecularColor = gl.getUniformLocation(this.prog, "uSpecularColor");
        this.iShininess = gl.getUniformLocation(this.prog, "uShininess");

        this.Use = function() {
            gl.useProgram(this.prog);
        }
    }

    function calculateNormal(x, y, z) {
        const length = Math.sqrt(x*x + y*y + z*z);
        return [x/length, y/length, z/length];
    }

    function draw() {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let projection = m4.perspective(Math.PI / 8, 1, 2, 10);
        let modelView = spaceball.getViewMatrix();
        let scaleMatrix = m4.scaling(0.4, 0.4, 0.4);
        let rotateToPointZero = m4.axisRotation([0.600, 0.600, 0], 0.7);
        let translateToPointZero = m4.translation(0, 0, -25);

        let matAccum0 = m4.multiply(rotateToPointZero, modelView);
        let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
        let matAccum2 = m4.multiply(scaleMatrix, matAccum1);

        // Calculate normal matrix
        let normalMatrix = m4.inverse(m4.transpose(matAccum2));

        // Set matrices
        gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection);
        gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);
        gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);

        // Set lighting parameters
        gl.uniform3f(shProgram.iViewPosition, 0.0, 0.0, 5.0);
        gl.uniform3f(shProgram.iAmbientColor, 0.2, 0.2, 0.2);
        gl.uniform3f(shProgram.iDiffuseColor, 0.6, 0.6, 0.6);
        gl.uniform3f(shProgram.iSpecularColor, 1.0, 1.0, 1.0);
        gl.uniform1f(shProgram.iShininess, 32.0);

        // Draw U-lines
        gl.uniform4fv(shProgram.iColor, [1, 0, 0, 1]);
        surfaceU.Draw();

        // Draw V-lines
        gl.uniform4fv(shProgram.iColor, [0, 1, 0, 1]);
        surfaceV.Draw();
    }

    function animateLight(time) {
        const radius = 10.0;
        const speed = 0.001;
        const x = radius * Math.cos(time * speed);
        const z = radius * Math.sin(time * speed);
        const y = 5.0;

        if (shProgram) {
            gl.uniform3f(shProgram.iLightDirection, x, y, z);
            draw();
        }
        requestAnimationFrame(animateLight);
    }

    // Initialize the WebGL context and the rest of the functions
    function init() {
        let canvas;
        try {
            canvas = document.getElementById("webglcanvas");
            gl = canvas.getContext("webgl");
            if (!gl) {
                throw "Browser does not support WebGL";
            }
        } catch (e) {
            document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not get a WebGL graphics context.</p>";
            return;
        }
        try {
            initGL();
            requestAnimationFrame(animateLight);
        } catch (e) {
            document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
            return;
        }

        spaceball = new TrackballRotator(canvas, draw, 0);
    }

    init();

});
