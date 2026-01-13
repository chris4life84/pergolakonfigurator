/**
 * EXRLoader für Three.js
 * Lädt OpenEXR HDR-Dateien
 */

THREE.EXRLoader = class EXRLoader extends THREE.DataTextureLoader {
    constructor(manager) {
        super(manager);
        this.type = THREE.HalfFloatType;
    }

    parse(buffer) {
        const USHORT_RANGE = (1 << 16);
        const INT_RANGE = (1 << 32);

        function parseNullTerminatedString(buffer, offset) {
            const uintBuffer = new Uint8Array(buffer);
            const endOffset = uintBuffer.indexOf(0, offset.value);

            if (endOffset === -1) {
                return null;
            }

            const stringValue = new TextDecoder().decode(
                new Uint8Array(buffer, offset.value, endOffset - offset.value)
            );

            offset.value = endOffset + 1;
            return stringValue;
        }

        function parseFixedLengthString(buffer, offset, size) {
            const stringValue = new TextDecoder().decode(
                new Uint8Array(buffer, offset.value, size)
            );

            offset.value += size;
            return stringValue;
        }

        function parseUint8(dataView, offset) {
            const value = dataView.getUint8(offset.value);
            offset.value += 1;
            return value;
        }

        function parseUint32(dataView, offset) {
            const value = dataView.getUint32(offset.value, true);
            offset.value += 4;
            return value;
        }

        const dataView = new DataView(buffer);
        const offset = { value: 0 };

        // EXR Header: magic number (4 bytes)
        const magic = dataView.getUint32(offset.value, true);
        offset.value += 4;

        if (magic !== 0x01312f76) {
            throw new Error('Invalid EXR file signature');
        }

        // Version (1 byte) und flags (3 bytes)
        const version = parseUint8(dataView, offset);
        const flags = parseUint8(dataView, offset);
        parseUint8(dataView, offset);
        parseUint8(dataView, offset);

        const header = {};
        let dataWindow;

        // Parse header attributes
        while (true) {
            const attributeName = parseNullTerminatedString(buffer, offset);

            if (attributeName === null || attributeName.length === 0) {
                break;
            }

            const attributeType = parseNullTerminatedString(buffer, offset);
            const attributeSize = parseUint32(dataView, offset);
            const attributeValue = attributeSize;

            if (attributeType === 'box2i') {
                const xMin = dataView.getInt32(offset.value, true);
                offset.value += 4;
                const yMin = dataView.getInt32(offset.value, true);
                offset.value += 4;
                const xMax = dataView.getInt32(offset.value, true);
                offset.value += 4;
                const yMax = dataView.getInt32(offset.value, true);
                offset.value += 4;

                if (attributeName === 'dataWindow') {
                    dataWindow = { xMin, yMin, xMax, yMax };
                }
            } else {
                offset.value += attributeSize;
            }
        }

        if (!dataWindow) {
            throw new Error('Missing dataWindow in EXR header');
        }

        const width = dataWindow.xMax - dataWindow.xMin + 1;
        const height = dataWindow.yMax - dataWindow.yMin + 1;

        // Skip scan line offset table
        offset.value += 8 * height;

        // Parse pixel data (simplified RGB only)
        const numPixels = width * height;
        const data = new Float32Array(numPixels * 4);

        // Simplified: Assume RGB half-float data
        const pixelData = new Uint16Array(buffer, offset.value, numPixels * 3);

        for (let i = 0; i < numPixels; i++) {
            // Convert half-float to float
            data[i * 4 + 0] = THREE.DataUtils.fromHalfFloat(pixelData[i * 3 + 0]);
            data[i * 4 + 1] = THREE.DataUtils.fromHalfFloat(pixelData[i * 3 + 1]);
            data[i * 4 + 2] = THREE.DataUtils.fromHalfFloat(pixelData[i * 3 + 2]);
            data[i * 4 + 3] = 1.0;
        }

        return {
            data: data,
            width: width,
            height: height,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            colorSpace: THREE.LinearSRGBColorSpace
        };
    }

    load(url, onLoad, onProgress, onError) {
        const texture = new THREE.DataTexture();
        texture.type = this.type;
        texture.colorSpace = THREE.LinearSRGBColorSpace;

        const loader = new THREE.FileLoader(this.manager);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(this.requestHeader);
        loader.setPath(this.path);
        loader.setWithCredentials(this.withCredentials);

        loader.load(url, (buffer) => {
            try {
                const texData = this.parse(buffer);

                texture.image = {
                    width: texData.width,
                    height: texData.height,
                    data: texData.data
                };

                texture.format = texData.format;
                texture.type = texData.type;
                texture.colorSpace = texData.colorSpace;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                texture.flipY = false;
                texture.needsUpdate = true;

                if (onLoad) onLoad(texture);
            } catch (error) {
                if (onError) onError(error);
                console.error('EXRLoader: Error parsing EXR file', error);
            }
        }, onProgress, onError);

        return texture;
    }
};
