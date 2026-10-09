# Arquitectura del Sistema - Control de Avance Túnel 0

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APLICACIÓN FLUTTER ANDROID                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Home      │  │   Tunnel    │  │  Dashboard  │  │    Import   │        │
│  │   Screen    │  │   View 3D   │  │  Ejecutivo  │  │   Screen    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                   │                                         │
│                    ┌──────────────┴──────────────┐                         │
│                    │      DataService (Provider)  │                         │
│                    │  - Módulos del Túnel 0       │                         │
│                    │  - Actividades               │                         │
│                    │  - KPIs                      │                         │
│                    └──────────────┬──────────────┘                         │
│                                   │                                         │
│         ┌─────────────────────────┼─────────────────────────┐              │
│         │                         │                         │              │
│  ┌──────┴──────┐          ┌──────┴──────┐          ┌──────┴──────┐        │
│  │ ExcelService│          │  AIService  │          │  Firebase   │        │
│  │             │          │             │          │  (futuro)   │        │
│  │ - Leer      │          │ - Consultas │          │             │        │
│  │   Excel     │          │   lenguaje  │          │ - Auth      │        │
│  │ - Validar   │          │   natural   │          │ - Sync      │        │
│  │   datos     │          │ - Proyección│          │ - Real-time │        │
│  └──────┬──────┘          └─────────────┘          └─────────────┘        │
│         │                                                                 │
└─────────┼─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARCHIVO EXCEL (.xlsm)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Matriz      │ │ Avances     │ │ BD_         │ │ Módulos_VB  │           │
│  │ cant.       │ │ _Diarios    │ │ Actividades │ │             │           │
│  │             │ │             │ │             │ │ 137 módulos │           │
│  │ 1132 filas  │ │ 37 filas    │ │ 4599 filas  │ │ Túnel 0    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### Importación de Excel
```
Excel (.xlsm)
    │
    ▼
ExcelService.leerModulosTunel0()
    │
    ▼
ExcelService.leerAvancesDiarios()
    │
    ▼
ExcelService.leerActividades()
    │
    ▼
DataService.inicializarModulos()
    │
    ├──► Modelo 3D (vista 3D)
    ├──► Barra longitudinal (vista progreso)
    ├──► Dashboard (KPIs)
    └──► Asistente IA (consultas)
```

## Estructura de Base de Datos (Futura)

### PostgreSQL

```sql
-- Tabla de Túneles
CREATE TABLE tuneles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    abscisa_inicial DECIMAL(10,2) NOT NULL,
    abscisa_final DECIMAL(10,2) NOT NULL,
    longitud DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Galerías
CREATE TABLE galerias (
    id SERIAL PRIMARY KEY,
    tunel_id INTEGER REFERENCES tuneles(id),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla de Frentes
CREATE TABLE frentes (
    id SERIAL PRIMARY KEY,
    tunel_id INTEGER REFERENCES tuneles(id),
    nombre VARCHAR(100) NOT NULL,
    estado VARCHAR(50)
);

-- Tabla de Módulos
CREATE TABLE modulos (
    id SERIAL PRIMARY KEY,
    tunel_id INTEGER REFERENCES tuneles(id),
    numero_modulo INTEGER NOT NULL,
    abscisa_inicial DECIMAL(10,2) NOT NULL,
    abscisa_final DECIMAL(10,2) NOT NULL,
    longitud DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50),
    avance_total DECIMAL(5,2) DEFAULT 0,
    frente_id INTEGER REFERENCES frentes(id),
    galeria_id INTEGER REFERENCES galerias(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Actividades
CREATE TABLE actividades (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER REFERENCES modulos(id),
    nombre VARCHAR(200) NOT NULL,
    grupo VARCHAR(100),
    estado VARCHAR(50),
    unidad VARCHAR(20),
    cantidad_programada DECIMAL(15,2),
    cantidad_ejecutada DECIMAL(15,2),
    avance_percent DECIMAL(5,2) DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin DATE,
    responsable VARCHAR(100),
    observaciones TEXT,
    turno VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Avances Diarios
CREATE TABLE avances (
    id SERIAL PRIMARY KEY,
    actividad_id INTEGER REFERENCES actividades(id),
    fecha DATE NOT NULL,
    turno VARCHAR(20),
    cantidad DECIMAL(15,2),
    unidad VARCHAR(20),
    pk_inicial DECIMAL(10,2),
    pk_final DECIMAL(10,2),
    avance_percent DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Concretos
CREATE TABLE concretos (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER REFERENCES modulos(id),
    tipo VARCHAR(100),
    volumen DECIMAL(10,2),
    fecha_vaciado DATE,
    turno VARCHAR(20),
    responsable VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Fotografías
CREATE TABLE fotografias (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER REFERENCES modulos(id),
    url TEXT NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Roles y Permisos
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    permisos JSONB NOT NULL
);

-- Índices para optimización
CREATE INDEX idx_modulos_tunel ON modulos(tunel_id);
CREATE INDEX idx_actividades_modulo ON actividades(modulo_id);
CREATE INDEX idx_avances_fecha ON avances(fecha);
CREATE INDEX idx_concretos_fecha ON concretos(fecha_vaciado);
```

## API REST (Futura)

### Endpoints

```
GET    /api/tuneles                    # Lista de túneles
GET    /api/tuneles/{id}               # Detalle de túnel
GET    /api/tuneles/{id}/modulos       # Módulos del túnel
GET    /api/modulos/{id}               # Detalle de módulo
GET    /api/modulos/{id}/actividades   # Actividades del módulo
GET    /api/modulos/{id}/avances       # Avances del módulo
POST   /api/modulos/{id}/avances       # Registrar avance
GET    /api/actividades                # Lista de actividades
GET    /api/actividades/{id}           # Detalle de actividad
GET    /api/dashboard/kpis             # KPIs del dashboard
GET    /api/dashboard/curva-s          # Curva S
GET    /api/dashboard/avance-por-frente # Avance por frente
POST   /api/import/excel               # Importar archivo Excel
GET    /api/reporte/diario             # Reporte diario
GET    /api/reporte/semanal            # Reporte semanal
GET    /api/reporte/mensual            # Reporte mensual
POST   /api/ai/consulta                # Consulta al asistente IA
```

## Modelo 3D - Arquitectura

### Componentes del Motor 3D

```
┌─────────────────────────────────────────────────────────────┐
│                    MOTOR 3D DEL TÚNEL                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Tunnel3DPainter (CustomPaint)          │   │
│  │  - Dibuja módulos del túnel en perspectiva          │   │
│  │  - Colores dinámicos según avance                   │   │
│  │  - Animaciones de entrada                           │   │
│  │  - Selección de módulos                             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           LongitudinalProgressBar                    │   │
│  │  - Barra de progreso longitudinal                   │   │
│  │  - Cada bloque = un módulo                          │   │
│  │  - Tocar bloque → vuela a módulo                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ModuleDetailSheet                       │   │
│  │  - Ficha técnica del módulo                         │   │
│  │  - Actividades y avances                            │   │
│  │  - Observaciones                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Futura Implementación con Three.js/Babylon.js

```javascript
// Estructura del modelo 3D del túnel
const tunnelModel = {
  // Geometría del túnel
  geometry: {
    type: 'tunnel',
    length: 995,           // metros
    radius: 4.5,           // radio de bóveda
    width: 10,             // ancho total
    height: 6,             // altura total
  },
  
  // Módulos constructivos
  modules: [
    {
      id: 1,
      startAbscissa: 7173.0,
      endAbscissa: 7165.5,
      length: 7.5,
      activities: [
        { name: 'Excavación', progress: 100 },
        { name: 'Sostenimiento', progress: 100 },
        { name: 'Impermeabilización', progress: 60 },
        { name: 'Viga Base', progress: 85 },
        { name: 'Revestimiento', progress: 47.2 }
      ],
      color: '#FF9800' // Naranja (26-50%)
    },
    // ... 137 módulos
  ],
  
  // Componentes geométricos
  components: [
    'carcamo',      // Cárcamo de derrames
    'muro_bordillo', // Muro bordillo
    'mensula',      // Ménsula
    'mh',           // Manhole
    'viga_base',    // Viga base
    'boveda',       // Bóveda
    'solado'        // Solado
  ]
};
```

## Seguridad y Roles

### Roles de Usuarios

| Rol | Permisos |
|-----|----------|
| **Administrador** | Acceso completo, gestión de usuarios, configuración |
| **Ingeniero Residente** | Ver todo, editar actividades, aprobar avances |
| **Planeación** | Ver todo, editar programación, generar reportes |
| **Supervisor** | Ver asignados, registrar avances, cargar fotos |
| **Consulta** | Solo ver reportes y dashboard |

### Autenticación
- Firebase Authentication
- JWT tokens
- Refresh tokens automáticos
- Sesiones persistentes

## Rendimiento

### Optimizaciones

1. **Carga diferida**: Módulos se cargan según necesidad
2. **Caché local**: SharedPreferences para datos frecuentes
3. **Compresión de imágenes**: Fotografías optimizadas
4. **Paginación**: Listas grandes con paginación
5. **Lazy loading**: Componentes se cargan al hacer scroll

### Métricas objetivo

| Métrica | Objetivo |
|---------|----------|
| Tiempo de carga inicial | < 3 segundos |
| FPS en animaciones | 60 FPS |
| Memoria máxima | 200 MB |
| Tamaño APK | < 50 MB |
| Registros soportados | 10,000+ |
| Módulos soportados | 1,000+ |

## Estrategia BIM 4D

### Fase 1: Modelo 3D Básico (Actual)
- Geometría del túnel
- Módulos constructivos
- Avance visual

### Fase 2: Integración BIM
- Modelo IFC del túnel
- Propiedades BIM por elemento
- Clash detection

### Fase 3: BIM 4D (Tiempo)
- Simulación de construcción
- Secuencia animada
- Comparación programado vs real

### Fase 4: BIM 5D (Costo)
- Presupuesto integrado
- Costo por elemento
- Análisis de valor ganado

### Fase 5: BIM 6D (Sostenibilidad)
- Huella de carbono
- Materiales sostenibles
- Análisis de ciclo de vida

## Integración con IoT y Drones

### Sensores IoT
- **Convergencias**: Monitoreo de deformaciones
- **Instrumentación**: Inclinómetros, extensómetros
- **Ambientales**: CO, CH4, temperatura, humedad
- **Estructurales**: Strain gauges en revestimiento

### Drones y Fotogrametría
- **Vuelos programados**: Captura periódica
- **Modelos 3D**: Nubes de puntos
- **Comparación**: Antes vs después
- **Volúmenes**: Cálculo de excavación

### Analítica Predictiva
- **Machine Learning**: Predicción de avance
- **Series temporales**: Tendencias de producción
- **Alertas tempranas**: Riesgos de retraso
- **Optimización**: Recursos y secuencias
