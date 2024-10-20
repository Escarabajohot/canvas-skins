# CanvaSkins - Obtener Cabezas de Jugadores
Esta API permite obtener la cabeza de un jugador de Minecraft a partir de su nombre de usuario.

## Endpoints:

### 1. Obtener la cabeza de un jugador
**GET /head/:username/:size?**

- **username**: Nombre de usuario de Minecraft del que deseas obtener la cabeza.
- **size** (opcional): Tamaño de la imagen de la cabeza (en píxeles). Por defecto, es 64.

#### Ejemplo:
`GET /head/Steve/128` - Obtiene la cabeza del jugador 'Steve' con un tamaño de 128x128 píxeles.

![image](https://github.com/user-attachments/assets/dec32b6a-c789-4177-8c15-ef975d952159)
