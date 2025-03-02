class BlackHoleEffect {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            depth: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });

        if (!this.gl) {
            console.error('无法初始化 WebGL');
            return;
        }

        // 顶点着色器：处理位置和基本属性
        this.vertexShader = `
            attribute vec2 position;
            uniform mat4 projection;
            uniform vec2 center;
            uniform float time;
            
            varying vec2 vUv;
            
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = projection * vec4(position, 0.0, 1.0);
            }
        `;

        // 片段着色器：实现增强的黑洞视觉效果
        this.fragmentShader = `
            precision highp float;
            
            uniform vec2 resolution;
            uniform vec2 center;
            uniform float time;
            
            varying vec2 vUv;
            
            const float PI = 3.14159265359;
            const float BLACK_HOLE_RADIUS = 0.15;
            const float ACCRETION_DISK_INNER = 0.2;
            const float ACCRETION_DISK_OUTER = 0.6;
            const int NUM_METEORS = 12;
            const float MIN_METEOR_SIZE = 0.015;  // 最小陨石尺寸
            const float MAX_METEOR_SIZE = 0.035;  // 最大陨石尺寸
            
            // 伪随机数生成
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            // 创建星空背景
            float stars(vec2 uv, float t) {
                float v = 0.0;
                vec2 pos = uv * 50.0;
                
                // 分层星星
                for(float i = 0.0; i < 3.0; i++) {
                    vec2 p = floor(pos);
                    vec2 f = fract(pos);
                    
                    float size = sin(p.x * 100.0 + p.y * 6223.0 + t + i * 157.0) * 0.5 + 0.5;
                    float s = smoothstep(0.95, 1.0, 1.0 - length(f - 0.5) - size * 0.3);
                    
                    v += s * (sin(t * 0.5) * 0.5 + 0.5);
                    pos *= 1.5;
                }
                return v;
            }
            
            // 陨石效果
            vec4 meteor(vec2 uv, vec2 pos, vec2 dir, float speed, float size, float t) {
                vec2 meteorPos = pos + dir * speed * t;
                float dist = length(uv - meteorPos);
                
                // 陨石轨迹 - 根据陨石大小调整尾迹长度
                float trailLength = size * 8.0; // 尾迹长度与陨石大小成正比
                float trail = smoothstep(trailLength, 0.0, dist) * 
                            smoothstep(0.0, 1.0, length(meteorPos - pos) / speed / t);
                
                // 陨石头部
                float head = smoothstep(size, 0.0, dist);
                
                // 颜色渐变 - 降低亮度
                vec3 trailColor = mix(
                    vec3(0.6, 0.3, 0.1), // 暗橙色
                    vec3(0.1, 0.1, 0.4), // 暗蓝色
                    trail
                ) * 0.6; // 整体降低亮度
                
                vec3 headColor = vec3(0.7, 0.6, 0.4) * 0.7; // 降低头部亮度
                vec3 color = mix(trailColor, headColor, head);
                float alpha = max(trail * 0.3, head * 0.5); // 降低透明度
                
                return vec4(color, alpha);
            }
            
            // 引力透镜扭曲效果
            vec2 gravitationalLensing(vec2 uv, vec2 center, float mass) {
                vec2 dir = uv - center;
                float dist = length(dir);
                float force = mass / (pow(dist, 0.5) + 0.001);
                return normalize(dir) * force;
            }
            
            // 创建光环效果
            float ring(vec2 uv, vec2 center, float radius, float thickness, float blur) {
                float dist = length(uv - center);
                float inner = smoothstep(radius - thickness - blur, radius - thickness, dist);
                float outer = smoothstep(radius + blur, radius, dist);
                return inner * outer;
            }
            
            void main() {
                // 坐标系转换
                vec2 uv = (vUv - 0.5) * 2.0;
                uv.x *= resolution.x / resolution.y;
                
                // 黑洞中心缓慢移动
                vec2 blackHoleCenter = center + vec2(
                    sin(time * 0.1) * 0.05,
                    cos(time * 0.08) * 0.05
                );
                
                // 计算原始距离
                float dist = length(uv - blackHoleCenter);
                
                // 引力透镜效果
                vec2 distortedUv = uv;
                if (dist > BLACK_HOLE_RADIUS) {
                    vec2 lensing = gravitationalLensing(uv, blackHoleCenter, 0.3);
                    distortedUv += lensing * 0.3;
                }
                
                // 创建黑洞核心
                float core = 1.0 - smoothstep(0.0, BLACK_HOLE_RADIUS, dist);
                
                // 创建吸积盘
                float diskBase = ring(distortedUv, blackHoleCenter, 
                    (ACCRETION_DISK_INNER + ACCRETION_DISK_OUTER) * 0.5,
                    (ACCRETION_DISK_OUTER - ACCRETION_DISK_INNER) * 0.5,
                    0.1);
                
                // 动态扭曲效果
                float angle = atan(distortedUv.y - blackHoleCenter.y, distortedUv.x - blackHoleCenter.x);
                float warp = sin(angle * 6.0 + time) * 0.2;
                float diskIntensity = diskBase * (1.0 + warp);
                
                // 计算吸积盘颜色
                vec3 hotColor = vec3(1.0, 0.6, 0.1);  // 更亮的橙色
                vec3 coldColor = vec3(0.1, 0.4, 1.0); // 更鲜艳的蓝色
                float temp = smoothstep(ACCRETION_DISK_INNER, ACCRETION_DISK_OUTER, dist);
                vec3 diskColor = mix(hotColor, coldColor, temp);
                
                // 添加发光效果
                float glow = exp(-dist * 1.5);
                diskColor += vec3(1.0, 0.8, 0.6) * glow;
                
                // 添加星空背景
                float starField = stars(uv, time * 0.1) * 0.3;
                vec3 backgroundColor = vec3(0.02, 0.02, 0.05) + vec3(starField);
                
                // 合并所有效果
                vec3 finalColor = mix(backgroundColor, diskColor, diskIntensity);
                finalColor = mix(vec3(0.0), finalColor, 1.0 - core); // 黑洞核心
                
                // 添加整体光晕
                finalColor += vec3(1.0, 0.8, 0.6) * glow * 0.3;
                
                // 添加陨石
                vec4 meteorEffect = vec4(0.0);
                for(int i = 0; i < NUM_METEORS; i++) {
                    float offset = float(i) * PI * 2.0 / float(NUM_METEORS);
                    
                    // 使用伪随机数生成不同的速度和起始位置
                    float randSpeed = random(vec2(float(i), 1.0)) * 0.1 + 0.05; // 降低速度范围
                    float randRadius = random(vec2(float(i), 2.0)) * 2.0 + 1.0; // 随机半径
                    float randPhase = random(vec2(float(i), 3.0)) * PI * 2.0; // 随机相位
                    
                    vec2 startPos = vec2(
                        cos(offset + randPhase + time * 0.05) * randRadius,
                        sin(offset + randPhase + time * 0.05) * randRadius
                    );
                    
                    // 添加一些随机性到运动方向
                    vec2 baseDir = normalize(blackHoleCenter - startPos);
                    float randAngle = random(vec2(float(i), 4.0)) * PI * 0.25 - PI * 0.125;
                    vec2 direction = vec2(
                        baseDir.x * cos(randAngle) - baseDir.y * sin(randAngle),
                        baseDir.x * sin(randAngle) + baseDir.y * cos(randAngle)
                    );
                    
                    // 使用新的陨石尺寸范围
                    float meteorSize = MIN_METEOR_SIZE + random(vec2(float(i), 5.0)) * (MAX_METEOR_SIZE - MIN_METEOR_SIZE);
                    
                    vec4 m = meteor(
                        distortedUv, 
                        startPos, 
                        direction, 
                        randSpeed, 
                        meteorSize, 
                        mod(time * (0.5 + random(vec2(float(i), 6.0)) * 0.5) + offset * 3.0, 15.0)
                    );
                    meteorEffect = max(meteorEffect, m);
                }
                
                // 降低陨石效果的整体强度
                meteorEffect.a *= 0.7;
                
                // 合并陨石效果
                finalColor = mix(finalColor, meteorEffect.rgb, meteorEffect.a);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        this.startTime = performance.now();
        this.program = null;
        this.uniforms = {};
        this.attributes = {};

        this.init();
    }

    init() {
        // 创建并添加画布
        const container = document.createElement('div');
        container.className = 'magic-canvas';
        container.appendChild(this.canvas);
        document.body.appendChild(container);

        // 初始化着色器程序
        this.program = this.createProgram();
        if (!this.program) return;

        // 初始化顶点数据（覆盖整个屏幕的矩形）
        const vertices = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]);

        // 创建和绑定顶点缓冲区
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        // 获取着色器变量位置
        this.attributes.position = this.gl.getAttribLocation(this.program, 'position');
        this.uniforms.projection = this.gl.getUniformLocation(this.program, 'projection');
        this.uniforms.resolution = this.gl.getUniformLocation(this.program, 'resolution');
        this.uniforms.center = this.gl.getUniformLocation(this.program, 'center');
        this.uniforms.time = this.gl.getUniformLocation(this.program, 'time');

        // 设置顶点属性
        this.gl.enableVertexAttribArray(this.attributes.position);
        this.gl.vertexAttribPointer(this.attributes.position, 2, this.gl.FLOAT, false, 0, 0);

        // 设置混合模式
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // 设置视口和开始动画
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    createProgram() {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.vertexShader);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.fragmentShader);
        
        if (!vertexShader || !fragmentShader) return null;

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('程序链接错误:', this.gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('着色器编译错误:', this.gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    resize() {
        const { clientWidth, clientHeight } = document.documentElement;
        const pixelRatio = window.devicePixelRatio || 1;

        this.canvas.width = clientWidth * pixelRatio;
        this.canvas.height = clientHeight * pixelRatio;
        this.canvas.style.width = `${clientWidth}px`;
        this.canvas.style.height = `${clientHeight}px`;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // 更新投影矩阵
        const aspect = this.canvas.width / this.canvas.height;
        this.projectionMatrix = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];

        // 更新uniforms
        this.gl.useProgram(this.program);
        this.gl.uniformMatrix4fv(this.uniforms.projection, false, this.projectionMatrix);
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));

        const elapsedSeconds = (currentTime - this.startTime) / 1000;
        
        this.gl.clearColor(0.0, 0.0, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.program);
        
        // 更新uniforms
        this.gl.uniform1f(this.uniforms.time, elapsedSeconds);
        this.gl.uniform2f(this.uniforms.center, 0.0, 0.0);

        // 绘制
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}

// 初始化效果
document.addEventListener('DOMContentLoaded', () => {
    new BlackHoleEffect();
}); 