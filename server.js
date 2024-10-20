const express = require('express');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

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
        const img = await loadImage(skinUrl);
        
        // Canvas de alta resolución para mejor calidad
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Suavizado y calidad alta para la escala
        ctx.imageSmoothingEnabled = true; 
        ctx.imageSmoothingQuality = 'high'; 

        // Dibujar la cabeza de la skin escalada al tamaño deseado
        ctx.drawImage(img, 8, 8, 8, 8, 0, 0, size, size); // Extrae los primeros 8x8 píxeles y los escala al tamaño dado

        return canvas.toBuffer();
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
