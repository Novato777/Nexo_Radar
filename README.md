# 📡 NeXo Radar

> **Sistema de Telemetría Comercial, Georreferenciación y Gestión de Alertas en Tiempo Real** para la red de comercios y terminales con código QR.

---

## 🚀 Descripción del Proyecto

**NeXo Radar** es una plataforma integral diseñada para conectar comercios, comerciales y administradores en una infraestructura sincronizada en tiempo real. Permite registrar negocios con georreferenciación, vincular códigos QR de alta fidelidad, recibir solicitudes de asistencia o soporte técnico al instante vía WebSockets y visualizarlas en un mapa interactivo inteligente.

---

## 🌟 Características Principales

* 🗺️ **Radar en Tiempo Real (Mapa Interactivo)**:
  * Visualización geoespacial con Leaflet de todas las terminales registradas.
  * Marcadores dinámicos que cambian de color y estado visual según la prioridad de las alertas:
    * 🔴 **Nueva Alerta** (Pulsante roja)
    * 🟡 **En Proceso** (Revisión técnica)
    * 🟢 **Resuelta** (Operación normal)
    * 🔷 **Comercio Activo** (En línea)
  * Filtros dinámicos por ciudad, buscador predictivo y paneles flotantes de acceso rápido.

* 🔔 **Centro de Alertas (Alert Center)**:
  * Sincronización instantánea mediante **Socket.IO** y alertas auditivas sin latencia.
  * Conexión directa a **WhatsApp** para contactar al comercio con un solo clic con mensajes personalizados.
  * Historial de auditoría, filtros de estado y actualización optimista.

* 📱 **Portal del Cliente (Client Portal)**:
  * Acceso público y ligero optimizado para dispositivos móviles al escanear el código QR del comercio.
  * Envío de solicitudes prioritarias (Soporte, Ventas, Asistencia técnica o Insumos) sin requerir instalación de apps.

* 📊 **Gestión de Terminales y Base de Datos**:
  * Registro de comercios con geolocalización precisa (picker de mapa) y logotipo.
  * Generación y exportación de códigos QR para imprenta en formatos CSV y **PDF de alta fidelidad**.
  * Filtros por ciudad, métricas por zonas y control de estado de terminales.

* 🛡️ **Seguridad y Resiliencia**:
  * Protección contra ataques de fuerza bruta mediante **Express Rate Limit** y cabeceras seguras con **Helmet**.
  * Arquitectura desacoplada y endpoint Keep-Alive para garantizar alta disponibilidad en entornos cloud gratuitos.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router DOM, React-Leaflet, Lucide React, Socket.IO Client, jsPDF, Axios |
| **Backend** | Node.js, Express 5, Socket.IO, PostgreSQL (`pg`), Multer, Helmet, Rate Limit |
| **Base de Datos** | PostgreSQL Serverless (**Neon Database**) con soporte UUID |
| **Despliegue** | **Vercel** (Frontend) + **Render** (Backend & WebSockets) + **Cloudinary** (Imágenes) |

---

## 📂 Estructura del Repositorio

```text
NeXo_Radar/
├── backend/                  # Servidor API REST y WebSockets
│   ├── routes/               # Rutas: auth, businesses, requests
│   ├── db.js                 # Pool de conexión a PostgreSQL (Neon / Local)
│   ├── database.sql          # Esquema de tablas y extensiones
│   └── server.js             # Punto de entrada Express + Socket.IO
│
├── frontend/                 # Aplicación Web SPA (React + Vite)
│   ├── src/
│   │   ├── components/       # Modales, Navbar y componentes reutilizables
│   │   ├── context/          # Contexto global de Socket.IO
│   │   ├── pages/            # RadarMap, AlertCenter, Dashboard, Portal, etc.
│   │   └── config.js         # Configuración centralizada de API
│   ├── vercel.json           # Reglas de enrutamiento para producción
│   └── vite.config.js        # Configuración del bundler
│
└── README.md                 # Documentación del proyecto
```

---

## ⚙️ Instalación y Ejecución en Local

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Novato777/Nexo_Radar.git
cd Nexo_Radar
```

### 2. Configurar el Backend
```bash
cd backend
npm install
```

Crea un archivo `.env` dentro de la carpeta `backend/`:
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=tu_password_local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexo_radar
MASTER_PASSWORD=nexo2026
```

Ejecuta el servidor:
```bash
node server.js
```

### 3. Configurar el Frontend
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## ☁️ Despliegue en Producción

* **Neon**: Aloja la base de datos PostgreSQL en la nube con soporte SSL.
* **Render**: Ejecuta el backend Node.js (`Root Directory: backend`, `Build Command: npm install`, `Start Command: node server.js`).
* **Vercel**: Sirve el frontend React (`Root Directory: frontend`, con variable `VITE_API_URL` apuntando a Render).

---

## 📄 Licencia

Este proyecto está desarrollado bajo la licencia **ISC**.
