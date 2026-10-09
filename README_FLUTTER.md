# Control de Avance - Túnel 0

## Gemelo Digital Operativo del Túnel 0

Aplicación móvil Android para el control integral de avance constructivo del Túnel 0 del proyecto Túnel Guillermo Gaviria Echeverri.

---

## Características Principales

### 1. Vista de Avance 3D
- Modelo tridimensional interactivo del túnel
- Colores dinámicos según avance (Gris, Rojo, Naranja, Amarillo, Azul, Verde)
- Vista isométrica, longitudinal, transversal y en planta
- Selección táctil de módulos
- Animaciones fluidas a 60 FPS

### 2. Barra de Progreso Longitudinal
- Representación visual del avance del túnel
- Cada bloque = un módulo constructivo
- Tocar un bloque → vuela la cámara al módulo y abre su ficha técnica
- Colores: Verde (terminado), Amarillo (en ejecución), Rojo (retrasado), Gris (no iniciado)

### 3. Dashboard Ejecutivo
- Avance total del túnel
- Avance por frente y galería
- Metros ejecutados y faltantes
- Concreto vaciado acumulado
- Productividad semanal y mensual
- Actividades retrasadas
- Curva S (programado vs real)

### 4. Integración con Excel
- Importación automática del archivo de reporte diario
- Hojas reconocidas: Matriz cant., Avances_Diarios, BD_Actividades, Módulos_VB
- Validación de datos y detección de errores
- Los nombres de las hojas NUNCA cambian

### 5. Asistente IA
- Consultas en lenguaje natural
- Respuestas sobre avance, módulos retrasados, concreto, rendimiento
- Proyección de fecha de terminación

### 6. Filtros Avanzados
- Por frente, actividad, estado, rango de avance
- Búsqueda por abscisas (K0+800 a K1+100)
- Búsqueda por porcentaje de avance

---

## Estructura del Proyecto

```
lib/
├── main.dart                    # Punto de entrada
├── models/                      # Modelos de datos
│   ├── tunnel_module.dart       # Módulo constructivo
│   ├── activity.dart            # Actividad constructiva
│   ├── daily_report.dart        # Reporte diario
│   └── kpi_data.dart            # KPIs del dashboard
├── services/                    # Servicios
│   ├── excel_service.dart       # Lectura de Excel
│   ├── data_service.dart        # Gestión de datos
│   └── ai_service.dart          # Asistente IA
├── screens/                     # Pantallas
│   ├── home_screen.dart         # Pantalla principal (3 opciones)
│   ├── tunnel_view_screen.dart  # Vista 3D del túnel
│   ├── dashboard_screen.dart    # Dashboard ejecutivo
│   ├── import_screen.dart       # Importar/Cargar datos
│   └── ai_assistant_screen.dart # Asistente IA
├── widgets/                     # Widgets reutilizables
│   ├── longitudinal_progress_bar.dart  # Barra de progreso
│   ├── module_detail_sheet.dart       # Detalle de módulo
│   ├── filter_panel.dart              # Panel de filtros
│   └── kpi_card.dart                  # Tarjeta KPI
└── utils/                       # Utilidades
    └── app_theme.dart           # Tema y colores
```

---

## Datos del Túnel 0

| Parámetro | Valor |
|-----------|-------|
| Abscisa Inicial | K6+178 |
| Abscisa Final | K7+173 |
| Longitud Total | 995 m |
| Módulos de Viga Base | 137 |
| Longitud por Módulo | 7.5 m (típico) |

### Actividades Cobrables (Matriz cant.)

1. **SOPORTE-REGULARIZADO**: Excavación, pernos, concreto lanzado, acero, mallas
2. **IMPERMEABILIZACION**: Geomembrana, geodren vial, tuberías PVC
3. **SUBDRENAJES**: Excavaciones, rellenos, tuberías, cámaras
4. **VIGA BASE**: Concreto clase 14 y 28 MPa, acero
5. **REVESTIMIENTO**: Malla electrosoldada, concreto revestimiento, fibras
6. **GRANULARES**: Rellenos, base granular
7. **MEZCLA**: Mezcla asfáltica, riego imprimación
8. **PAVIMENTO**: Pavimento concreto hidráulico, acero
9. **MOBILIARIO**: Sumideros, bordillos, anclajes
10. **TANQUE**: Excavaciones, concreto, acero
11. **SEÑALIZACION**: Pintura, tachas, señales, captafaros
12. **BROCALES**: Excavaciones, concreto, acero, geodren, microfibra

---

## Colores de Avance

| Avance | Color | Descripción |
|--------|-------|-------------|
| 0% | Gris | No iniciado |
| 1-25% | Rojo | Retrasado |
| 26-50% | Naranja | En ejecución |
| 51-75% | Amarillo | Avanzado |
| 76-99% | Azul | Casi terminado |
| 100% | Verde | Terminado |

---

## Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd control_concreto

# Instalar dependencias
flutter pub get

# Ejecutar en modo debug
flutter run

# Compilar APK release
flutter build apk --release
```

---

## Uso

### 1. Vista de Avance
- Ver el modelo 3D del túnel con colores de avance
- Tocar un módulo para ver su detalle
- Usar la barra longitudinal para navegar rápidamente
- Aplicar filtros para enfocar en áreas específicas

### 2. Cargar Jornada
- Seleccionar actividad (Revestimiento, Viga Base, etc.)
- Ingresar número de módulo (1-137)
- Ingresar cantidad en m³
- Ingresar responsable
- Guardar registro

### 3. Importar Reporte Diario
- Seleccionar archivo Excel (.xlsm)
- El sistema lee automáticamente las hojas:
  - Matriz cant. → Actividades cobrables
  - Avances_Diarios → Avance por actividad
  - BD_Actividades → Base de datos de actividades
  - Módulos_VB → Módulos de viga base
- Validación automática de datos
- Actualización del modelo 3D

---

## Integración con Excel

### Hojas esperadas (NUNCA cambian de nombre):

| Hoja | Contenido |
|------|-----------|
| Matriz cant. | Actividades cobrables con cantidades |
| Avances_Diarios | Avance diario por actividad |
| BD_Actividades | Base de datos de actividades |
| Módulos_VB | Módulos de viga base del Túnel 0 |
| Formato Túnel_Dia | Reporte turno día |
| Formato Túnel_Noche | Reporte turno noche |
| Resumen | Cantidades ejecutadas |

### Formato de datos:

```
ID_MODULO | ABSCISA_INICIAL | ABSCISA_FINAL | ACTIVIDAD | PORCENTAJE_AVANCE | ESTADO | FECHA_INICIO | FECHA_FIN
```

---

## Arquitectura Técnica

### Stack
- **Frontend**: Flutter 3.x
- **Motor 3D**: CustomPaint + animaciones (escalable a Three.js/Babylon.js)
- **Gráficas**: fl_chart
- **Excel**: excel package
- **Estado**: Provider
- **Navegación**: GoRouter

### Rendimiento
- Carga < 3 segundos
- 60 FPS en animaciones
- Soporte para 10,000+ registros
- 1,000+ módulos

### Escalabilidad
- Preparado para BIM 4D
- Integración futura con Firebase
- API REST lista para conectar
- Soporte IoT y drones

---

## Roadmap

- [x] Modelo 3D básico
- [x] Barra de progreso longitudinal
- [x] Dashboard ejecutivo
- [x] Integración Excel
- [x] Asistente IA
- [ ] Vista 3D con Three.js/Babylon.js
- [ ] Modo recorrido (walkthrough)
- [ ] Realidad aumentada (AR)
- [ ] Sincronización en tiempo real
- [ ] BIM 4D (tiempo + 3D)
- [ ] Integración IoT (sensores)
- [ ] Fotogrametría con drones
- [ ] Analítica predictiva avanzada

---

## Licencia

Propio - Uso interno del proyecto Túnel Guillermo Gaviria Echeverri

---

## Contacto

Equipo de Desarrollo - Control de Avance Túnel 0
