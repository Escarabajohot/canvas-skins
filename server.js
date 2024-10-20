const express = require('express');
const axios = require('axios');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// URL de la cabeza de Steve
const steveHeadUrl = 'https://crafatar.com/avatars/8667ba71-b85a-4004-af54-457a9734eed7'; // Cambia esta URL por una válida que contenga la cabeza de Steve

// Función para obtener el UUID de un usuario
async function getUUID(username) {
    try {
        const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        return response.data.id;
    } catch (error) {
        return null; // Devuelve null si no se encuentra el usuario
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

// Función para obtener la cabeza de Steve
async function getSteveHead(size) {
    try {
        const imageBuffer = await axios.get(steveHeadUrl, { responseType: 'arraybuffer' });

        const headImageBuffer = await sharp(imageBuffer.data)
            .extract({ left: 8, top: 8, width: 8, height: 8 }) // Extraer el área de la cabeza
            .resize(size, size) // Redimensionar al tamaño especificado
            .toBuffer();

        return headImageBuffer;
    } catch (error) {
        throw new Error('Error al procesar la imagen de Steve');
    }
}

app.get('/head/:username/:size?', async (req, res) => {
    const { username, size } = req.params;
    const imageSize = size ? parseInt(size) : 64; // Tamaño por defecto será 64x64 si no se especifica

    try {
        const uuid = await getUUID(username);
        
        let headImage;

        if (uuid) {
            const skinUrl = await getSkinURL(uuid);
            headImage = await getHeadImage(skinUrl, imageSize);
        } else {
            // Si no se encuentra el UUID, se utiliza la cabeza de Steve
            headImage = await getSteveHead(imageSize);
        }

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
