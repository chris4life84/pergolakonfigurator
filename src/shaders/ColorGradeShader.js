(function(){
    // Simple color grading with exposure and warm/cool temperature
    THREE.ColorGradeShader={
        uniforms:{
            "tDiffuse":{value:null},
            "exposure":{value:1.0},
            "temperature":{value:0.08}, // positive = warmer, negative = cooler
            "contrast":{value:1.02},
            "saturation":{value:1.0}
        },
        vertexShader:[
            "varying vec2 vUv;",
            "void main(){",
            "    vUv=uv;",
            "    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);",
            "}"
        ].join("\n"),
        fragmentShader:[
            "uniform sampler2D tDiffuse;",
            "uniform float exposure;",
            "uniform float temperature;",
            "uniform float contrast;",
            "uniform float saturation;",
            "varying vec2 vUv;",
            "",
            "vec3 applyWhiteBalance(vec3 color, float temp){",
            "    // Lightweight temperature shift (Kelvin-inspired approximation)",
            "    float rShift = clamp(1.0 + temp*0.12, 0.8, 1.2);",
            "    float bShift = clamp(1.0 - temp*0.12, 0.8, 1.2);",
            "    mat3 balance = mat3(",
            "        rShift, 0.0,    0.0,",
            "        0.0,    1.0,    0.0,",
            "        0.0,    0.0,    bShift",
            "    );",
            "    return balance * color;",
            "}",
            "",
            "vec3 applySaturation(vec3 color, float sat){",
            "    float luma = dot(color, vec3(0.299, 0.587, 0.114));",
            "    return mix(vec3(luma), color, sat);",
            "}",
            "",
            "void main(){",
            "    vec3 color = texture2D(tDiffuse, vUv).rgb;",
            "    color *= exposure;",
            "    color = applyWhiteBalance(color, temperature);",
            "    color = applySaturation(color, saturation);",
            "    color = (color - 0.5) * contrast + 0.5;", // contrast pivot
            "    color = clamp(color, 0.0, 1.0);",
            "    gl_FragColor = vec4(color, 1.0);",
            "}"
        ].join("\n")
    };
})();
