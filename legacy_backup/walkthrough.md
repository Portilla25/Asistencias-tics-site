# Walkthrough: WhatsApp Pollo Bot — Simulador Web

## Resumen

Ante la imposibilidad de acceder a Meta for Developers, se creó una **interfaz web de chat estilo WhatsApp** que se conecta directamente al backend del bot. La lógica core (máquina de estados, SQLite, Gemini) permanece intacta y lista para conectarse a WhatsApp real cuando Meta esté disponible.

## Cambios Realizados

### 1. Interfaz Web (nueva)
Se crearon 3 archivos en `public/`:
- [index.html](file:///C:/Users/Portilla/.gemini/antigravity/scratch/whatsapp-pollo-bot/public/index.html) — Chat con diseño dark WhatsApp, sidebar con estado del bot
- [styles.css](file:///C:/Users/Portilla/.gemini/antigravity/scratch/whatsapp-pollo-bot/public/styles.css) — Tema oscuro con glassmorphism y micro-animaciones
- [app.js](file:///C:/Users/Portilla/.gemini/antigravity/scratch/whatsapp-pollo-bot/public/app.js) — Lógica del chat (envío, recepción, formateo, tarjeta de pedido)

### 2. API REST para el Chat Web (nuevo)
- [chat-api.controller.js](file:///C:/Users/Portilla/.gemini/antigravity/scratch/whatsapp-pollo-bot/src/controllers/chat-api.controller.js) — Controlador que conecta la interfaz web con la misma lógica de estados y validaciones del bot

### 3. Sistema de Fallback Local para Gemini (actualizado)
- [gemini.service.js](file:///C:/Users/Portilla/.gemini/antigravity/scratch/whatsapp-pollo-bot/src/services/gemini.service.js) — Ahora incluye:
  - **Retry con backoff exponencial** para errores 429
  - **Análisis de intención local** mediante pattern matching cuando Gemini no está disponible
  - **Generador de respuestas local** con jerga peruana predefinida como fallback

### 4. Servidor actualizado
- [server.js](file:///C:/Users/Portilla/.gemini/antigravity/scratch/whatsapp-pollo-bot/server.js) — Ahora sirve archivos estáticos y expone las rutas `/api/chat`, `/api/menu` y `/api/reset`

### 5. Instalaciones del sistema
- **Node.js v25.9.0** y **ngrok v3.39.0** instalados vía `winget`

## Demo del Flujo Completo

El bot fue probado con un flujo de pedido completo: **Saludo → Menú → Pedido → Dirección → Pago → Confirmación**.

![Video del flujo completo de pedido](C:/Users/Portilla/.gemini/antigravity/brain/992daf10-a6bf-4e2e-9de8-eda12812568f/demo_recording.webp)

### Paso a paso con capturas:

````carousel
### 1. Menú y Pedido
El usuario escribe "hola", el bot muestra el menú completo con precios reales de la BD. Luego el usuario pide "un pollo entero y una gaseosa inka kola" y el bot calcula el subtotal de S/ 74.00.

![Paso del pedido](C:/Users/Portilla/.gemini/antigravity/brain/992daf10-a6bf-4e2e-9de8-eda12812568f/screenshot_order.png)
<!-- slide -->
### 2. Dirección de Entrega
El bot solicita la dirección. El usuario ingresa "Av. Larco 450, Miraflores, Lima". El bot confirma y ofrece los métodos de pago (Yape, Plin, Efectivo).

![Paso de la dirección](C:/Users/Portilla/.gemini/antigravity/brain/992daf10-a6bf-4e2e-9de8-eda12812568f/screenshot_address.png)
<!-- slide -->
### 3. Pago y Confirmación
El usuario selecciona "Yape". El bot confirma el pedido completo con una tarjeta resumen incluyendo el total de **S/ 74.00**, la dirección y el método de pago.

![Paso del pago](C:/Users/Portilla/.gemini/antigravity/brain/992daf10-a6bf-4e2e-9de8-eda12812568f/screenshot_payment.png)
````

## Estado Actual del Servidor

El servidor está corriendo en `http://localhost:3000`. Puedes abrirlo en tu navegador para interactuar con el bot.

> [!TIP]
> **Cuando Meta vuelva a funcionar**, solo necesitas configurar el Webhook en Meta Developers apuntando a tu URL de ngrok + `/webhook`. El código del webhook original sigue intacto y funcionará sin cambios.
