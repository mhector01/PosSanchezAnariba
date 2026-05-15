# Imza POS

**Sistema de facturación e inventarios para farmacia** — Point of Sale y gestión empresarial construido con Next.js.

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Funcionalidades](#funcionalidades)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
  - [Variables de Entorno](#variables-de-entorno)
  - [Base de Datos](#base-de-datos)
- [Ejecución en Desarrollo](#ejecución-en-desarrollo)
- [Construcción y Despliegue](#construcción-y-despliegue)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Descripción General

**Imza POS** es un sistema integral de punto de venta diseñado para farmacias. Gestiona ventas, inventarios, caja, comprobantes fiscales (RTN/CAI conforme a normativa hondureña), usuarios, reportes y más. Cuenta con un terminal POS optimizado para lectura de código de barras, un panel administrativo con indicadores clave y generación de tickets térmicos con formato fiscal.

---

## Funcionalidades

### Terminal POS (`/`)
- Búsqueda de productos por código de barras o nombre
- Filtros por categoría y subcategoría
- Carrito de compras con ajuste de cantidades y precios
- Selección de lote para productos perecederos
- Modal de pago: efectivo, tarjeta, depósito
- Creación rápida de clientes
- Selección de tipo de comprobante (factura/ticket)
- Control de caja (apertura/cierre obligatorio)

### Administración (`/admin`)
- **Dashboard:** KPIs (ventas del día, efectivo en caja, total clientes, alertas de inventario), gráfico de ventas anuales
- **Productos:** CRUD completo con código de barras, precios (público/mayoreo/3), stock, categoría, marca, presentación, imagen (Cloudinary), control de perecederos
- **Usuarios:** Gestión de empleados con credenciales y roles (admin/cajero)
- **Ventas:** Historial con búsqueda, paginación, edición con trazabilidad de cambios
- **Caja:** Apertura/cierre, movimientos (ingresos/egresos), arqueo, ticket de cierre
- **Compras:** Órdenes de compra con búsqueda de productos y registro de costos
- **Reportes:** Inventario valorizado, resúmenes por categoría/subcategoría, productos por categoría
- **Configuración:** Parámetros de empresa (nombre, RTN, dirección, IVA), rangos CAI, tipos de comprobante

### Tickets Fiscales (`/ticket/[id]`)
- Formato térmico para impresora POS
- Desglose de ISV 15% y 18%, exento y gravado
- RTN, CAI, serie, fecha y hora fiscal
- Código de barras del comprobante
- Firma y sello de la empresa

### Seguridad
- Autenticación mediante JWT (httpOnly cookie)
- Middleware de protección de rutas
- Roles de usuario: administrador y cajero
- Redirección inteligente post-login según rol

---

## Stack Tecnológico

| Categoría        | Tecnología                          |
| ---------------- | ----------------------------------- |
| **Framework**    | Next.js 16 (App Router)            |
| **UI**           | React 19, Tailwind CSS v4          |
| **Lenguaje**     | TypeScript 5                       |
| **Base de Datos**| MySQL / MariaDB                    |
| **ORM/Driver**   | mysql2 (promise) + Stored Procedures |
| **Autenticación**| jose (JWT), bcryptjs               |
| **Imágenes**     | Cloudinary SDK                     |
| **Iconos**       | Lucide React                       |
| **Linter**       | ESLint 9 + eslint-config-next      |

---

## Arquitectura

El proyecto sigue el modelo **App Router** de Next.js, combinando frontend y backend en una misma aplicación:

```
cliente (React) → Route Handlers (API) → Stored Procedures → MySQL
```

- **Páginas y componentes:** `app/` con layouts anidados y server/client components.
- **API REST:** Rutas en `app/api/` implementadas como Route Handlers de Next.js.
- **Autenticación:** Validación de JWT en middleware de borde (`middleware.ts`).
- **Lógica de negocio:** Mayormente implementada en stored procedures de MySQL.
- **Despliegue:** Configurado para `output: 'standalone'` (ideal para contenedores Docker).

---

## Requisitos Previos

- Node.js 20 o superior
- npm, yarn, pnpm o bun
- MySQL 8.0+ o MariaDB 10.5+
- (Opcional) Cuenta en [Cloudinary](https://cloudinary.com) para gestión de imágenes

---

## Instalación y Configuración

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd PosSanchezAnariba

# Instalar dependencias
npm install
```

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_base_datos

# Cloudinary (opcional, para imágenes de productos)
CLOUDINARY_CLOUD_NAME=tu_cloud
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# JWT (opcional — si no se define usa un valor por defecto)
JWT_SECRET=clave_secreta_segura
```

> **Nota de seguridad:** El archivo `.env` no debe versionarse. El repositorio incluye `.env` en `.gitignore`.

### Base de Datos

1. Crear la base de datos en MySQL:
   ```sql
   CREATE DATABASE nombre_base_datos;
   ```

2. Importar el esquema y datos iniciales desde el backup incluido:
   ```bash
   mysql -u root -p nombre_base_datos < BackUp060226.sql
   ```

3. (Opcional) Si se requiere el esquema más reciente:
   ```bash
   mysql -u root -p nombre_base_datos < dbBack.sql
   ```

---

## Ejecución en Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Construcción y Despliegue

```bash
# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

El proyecto está preconfigurado con `output: 'standalone'` en `next.config.ts`, lo que permite empaquetar la aplicación para entornos Docker o servidores sin necesidad de instalar dependencias en producción. Tras ejecutar `npm run build`, los archivos listos para producción se encuentran en `.next/standalone`.

---

## Estructura del Proyecto

```
├── app/
│   ├── admin/            # Panel de administración
│   │   ├── cashbox/      #   Gestión de caja
│   │   ├── products/     #   CRUD de productos
│   │   ├── purchases/    #   Órdenes de compra
│   │   ├── reports/      #   Reportes
│   │   ├── sales/        #   Historial de ventas
│   │   ├── settings/     #   Configuración del sistema
│   │   └── users/        #   Gestión de usuarios
│   ├── api/              # API REST (Route Handlers)
│   ├── login/            # Página de inicio de sesión
│   ├── pos/              # Terminal POS (alternativa)
│   ├── sales/            # Historial de ventas (cajero)
│   ├── ticket/[id]       # Vista de ticket/factura imprimible
│   ├── page.tsx          # Terminal POS principal
│   └── layout.tsx        # Layout raíz
├── context/
│   └── AuthContext.tsx    # Contexto de autenticación
├── lib/
│   └── db.ts             # Pool de conexión a MySQL
├── middleware.ts          # Middleware de autenticación JWT
├── public/               # Archivos estáticos
├── BackUp060226.sql      # Backup de base de datos
├── dbBack.sql            # Backup alternativo
└── tailwind.config.ts    # Configuración de Tailwind CSS
```

---

## Contribuir

1. Hacer fork del repositorio
2. Crear una rama para la funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Hacer commit de los cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Hacer push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

---

## Licencia

Uso interno — proyecto privado.
