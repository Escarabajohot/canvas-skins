const express = require('express');
const axios = require('axios');
const path = require('path');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// URL de la cabeza de Steve
const steveHeadUrl = 'https://crafatar.com/avatars/8667ba71-b85a-4004-af54-457a9734eed7'; // Cambia esta URL por una válida que contenga la cabeza de Steve

// Función para obtener el UUID de un usuario
async function getUUID(username) {
    try {
        const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        return response.data.id;
    } catch (error) {
        console.error('Error al obtener el UUID:', error.message);
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
        console.error('Error al obtener la URL de la skin:', error.message);
        throw new Error('No se pudo obtener la skin');
    }
}

// Función para recortar la cabeza
async function getHeadImage(skinUrl, size) {
    try {
        const imageBuffer = await axios.get(skinUrl, { responseType: 'arraybuffer' });

        // Extraemos solo la cabeza
        const headBuffer = await sharp(imageBuffer.data)
            .extract({ left: 8, top: 8, width: 8, height: 8 }) // Coordenadas de la cabeza
            .resize(size, size, { kernel: sharp.kernel.nearest }) // Redimensionar manteniendo la calidad
            .toBuffer();

        return headBuffer;
    } catch (error) {
        console.error('Error al procesar la imagen de la cabeza:', error.message);
        throw new Error('Error al procesar la imagen');
    }
}

// Función para obtener la cabeza de Steve
async function getSteveHead(size) {
    try {
        const imageBuffer = await axios.get(steveHeadUrl, { responseType: 'arraybuffer' });

        const headImageBuffer = await sharp(imageBuffer.data)
            .extract({ left: 8, top: 8, width: 8, height: 8 }) // Extraer el área de la cabeza
            .resize(size, size, { kernel: sharp.kernel.nearest }) // Redimensionar manteniendo la calidad
            .toBuffer();

        return headImageBuffer;
    } catch (error) {
        console.error('Error al procesar la imagen de Steve:', error.message);
        throw new Error('Error al procesar la imagen de Steve');
    }
}

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/head/:username/:size?', async (req, res) => {
    const { username, size } = req.params;
    const imageSize = size ? parseInt(size) : 64; // Tamaño por defecto será 64x64 si no se especifica

    try {
        const uuid = await getUUID(username);
        
        let headImage;

        if (uuid) {
            const skinUrl = await getSkinURL(uuid);
            console.log('URL de la skin:', skinUrl); // Imprime la URL para verificarla
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
        console.error('Error en la solicitud de la cabeza:', error.message); // Imprime el error en consola
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
});
