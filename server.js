const express = require('express');
const axios = require('axios');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Función para obtener el UUID de un usuario
async function getUUID(username) {
    try {
        const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        return response.data.id;
    } catch (error) {
        throw new Error('Usuario no encontrado');
    }
}

// Función para obtener la URL de la skin usando el UUID
async function getSkinURL(uuid) {
    try {
        const response = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
        const properties = response.data.properties.find(prop => prop.name === 'textures');
        const textureData = JSON.parse(Buffer.from(properties.value, 'base64').toString());
        return textureData.textures.SKIN.url;
    } catch (error) {
        throw new Error('No se pudo obtener la skin');
    }
}

// Función para recortar la cabeza de la skin con mejor calidad
async function getHeadImage(skinUrl, size) {
    try {
        const imageBuffer = await axios.get(skinUrl, { responseType: 'arraybuffer' });
        
        // Usa sharp para recortar y redimensionar la imagen
        const headImageBuffer = await sharp(imageBuffer.data)
            .extract({ left: 8, top: 8, width: 8, height: 8 }) // Extraer el área de la cabeza
            .resize(size, size) // Redimensionar al tamaño especificado
            .toBuffer();

        return headImageBuffer;
    } catch (error) {
        throw new Error('Error al procesar la imagen');
    }
}

app.get('/head/:username/:size?', async (req, res) => {
    const { username, size } = req.params;
    const imageSize = size ? parseInt(size) : 64; // Tamaño por defecto será 64x64 si no se especifica

    try {
        const uuid = await getUUID(username);
        const skinUrl = await getSkinURL(uuid);
        const headImage = await getHeadImage(skinUrl, imageSize);

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': headImage.length
        });
        res.end(headImage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
});
