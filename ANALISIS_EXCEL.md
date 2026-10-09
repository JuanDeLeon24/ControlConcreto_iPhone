# Análisis del Excel - Reporte Diario Túneles

## Archivo: `1. Reporte_Diario_Tuneles.xlsm`

---

## Estructura del Libro

### Hojas identificadas (16 total):

| # | Hoja | Filas | Columnas | Descripción |
|---|------|-------|----------|-------------|
| 0 | Catalogo | - | - | Catálogo de actividades |
| 1 | Memoria | - | - | Memoria de cálculo |
| 2 | **Matriz cant.** | 1132 | 27 | **Matriz de cantidades cobrables** |
| 3 | Resumen | 330 | 42 | Informe de cantidades ejecutadas |
| 4 | BD_Encargados | - | - | Base de datos de encargados |
| 5 | **BD_Actividades** | 4599 | 50 | **Base de datos de actividades diarias** |
| 6 | **Módulos_VB** | 141 | 16 | **Módulos de viga base Túnel 0** |
| 7 | **Formato Túnel_Dia** | 119 | 219 | **Reporte diario turno día** |
| 8 | **Formato Túnel_Noche** | 119 | 219 | **Reporte diario turno noche** |
| 9 | **Avances_Diarios** | 37 | 24 | **Avance por actividad con %** |
| 10 | Liberaciones de campo | - | - | Liberaciones |
| 11 | Topografia | - | - | Topografía |
| 12 | Formato_Liberación | - | - | Formato de liberación |
| 13 | Registro_Liberaciones | - | - | Registro de liberaciones |
| 14 | Cajas | - | - | Cajas de inspección |
| 15 | Cache_BD | - | - | Caché de base de datos |

---

## Datos Clave del Túnel 0

### Ubicación y Dimensiones

| Parámetro | Valor |
|-----------|-------|
| Nombre | TÚNEL 0 - K6+178_K7+173 |
| Longitud | 995 m |
| Abscisa Inicial | K6+178 (6178.00) |
| Abscisa Final | K7+173 (7173.35) |
| Módulos de Viga Base | 137 |
| Longitud por módulo | 7.5 m (típico) |

### Módulos de Viga Base (Hoja: Módulos_VB)

- **Módulo 1**: PK 7173.0 → 7165.5 (7.5 m)
- **Módulo 2**: PK 7165.5 → 7158.0 (7.5 m)
- **Módulo 3**: PK 7158.0 → 7152.0 (6.0 m)
- **Módulo 4**: PK 7152.0 → 7144.5 (7.5 m)
- ... (continúa hasta módulo 137)
- **Módulo 137**: PK 6183.97 → 6176.57 (7.4 m)

**Características por módulo:**
- MACROFIBRA: SI/NO
- MICROFIBRA: SI/NO
- MALLA ELECTROSOLDADA: SI/NO/SOLO EN NICHOS SOS

---

## Actividades Cobrables del Túnel 0 (Hoja: Matriz cant.)

### 1. SOPORTE-REGULARIZADO
| Actividad | Unidad | Cantidad Unitaria |
|-----------|--------|-------------------|
| Acero de refuerzo Fy=420 Mpa | kg | 5,506 |
| Excavación subterránea material tipo III | m³ | 246,443 |
| Excavación subterránea material tipo IV | m³ | 280,305 |
| Arco de Acero Estructural | Kg | 10,838 |
| Transporte de materiales | m³-km | 1,201 |
| Pernos anclados con resina | m | 145,374 |
| Excavación subterránea material tipo II | m³ | 234,936 |
| Fibra Sintética (Túneles) | kg | 39,700 |
| Excavación subterránea material tipo V | m³ | 362,533 |
| Pernos anclados con lechada | m | 101,177 |
| Concreto lanzado clase 28 MPa | m³ | 1,093,867 |
| Malla de acero electrosoldada Q5 | m² | 14,738 |
| Arco de acero tipo noruego | kg | 7,284 |
| Ensayo de predicción Sísmica | Campaña | 125,246,061 |
| Perforación exploratoria | m | 130,654 |
| Malla electrosoldada 150X150X7.5mm | m² | 42,634 |
| Conexión para inyecciones | u | 222,920 |
| Inyección de consolidación | Saco | 83,798 |
| Tubería para enfilajes 4" | m | 265,170 |
| Instalación de dianas | un | 90,139 |

### 2. IMPERMEABILIZACION
| Actividad | Unidad | Cantidad Unitaria | Avance Actual |
|-----------|--------|-------------------|---------------|
| Geomembrana impermeabilizante E=2.00mm | m² | 105,216 | **2,338.71 m²** |
| Tubería PVC sanitaria 150mm | m | 82,930 | **20.58 m** |
| Geodren vial (0.5m - tub 6") | m | 66,386 | 0 |
| Accesorios T 6" | un | 205,467 | 0 |
| Accesorios Y 6" | un | 172,189 | **12 und** |

### 3. SUBDRENAJES
| Actividad | Unidad | Cantidad Unitaria | Avance Actual |
|-----------|--------|-------------------|---------------|
| Excavación material tipo II | m³ | 234,936 | 0 |
| Excavación material tipo III | m³ | 246,443 | 0 |
| Excavación material tipo IV | m³ | 280,305 | 0 |
| Excavación material tipo V | m³ | 362,533 | 0 |
| Relleno Con Gravilla | m³ | 136,708 | 0 |
| Tubería PVC sanitaria 150mm | m | 82,930 | 0 |
| Tubería novafort 400mm | m | 244,498 | 0 |
| Geotextil NT-2500 | m² | 7,905 | 0 |
| Cámara de inspección Tipo A | u | 3,600,109 | **1 und** |
| Sumidero tipo CAZ | m | 383,884 | 0 |

### 4. VIGA BASE
| Actividad | Unidad | Cantidad Unitaria | Avance Actual |
|-----------|--------|-------------------|---------------|
| Concreto clase 14 MPA | m³ | 556,869 | 0 |
| Concreto clase 28 MPA (Zapatas/Estribos) | m³ | 955,986 | **269.99 m³** |
| Acero de refuerzo Fy=420 Mpa | kg | 5,506 | **14,885.09 kg** |

### 5. REVESTIMIENTO
| Actividad | Unidad | Cantidad Unitaria | Avance Actual |
|-----------|--------|-------------------|---------------|
| Malla electrosoldada 150X150X7.5mm | m² | 42,634 | **1,015.2 m²** |
| Concreto revestimiento clase 28 Mpa | m³ | 1,093,051 | **477 m³** |
| Fibra Sintética (Túneles) | kg | 39,700 | **868 kg** |
| Microfibra sintética | kg | 36,248 | **715.5 kg** |

### 6. GRANULARES
| Actividad | Unidad | Cantidad Unitaria |
|-----------|--------|-------------------|
| Relleno para estructuras con recebo | m³ | 79,935 |
| Base granular clase A | m³ | 134,362 |

### 7. MEZCLA
| Actividad | Unidad | Cantidad Unitaria |
|-----------|--------|-------------------|
| Mezcla semi densa MSC-25 | m³ | 912,211 |
| Riego de imprimación CRL-1 | m² | 2,987 |

### 8. PAVIMENTO
| Actividad | Unidad | Cantidad Unitaria |
|-----------|--------|-------------------|
| Pavimento de concreto Hidraulico | m³ | 803,455 |
| Acero de refuerzo Fy=420 Mpa | kg | 5,506 |

### 9. MOBILIARIO
| Actividad | Unidad | Cantidad Unitaria |
|-----------|--------|-------------------|
| Sumidero tipo CAZ | m | 383,884 |
| Tapaprefabricada laterales | No encontrado | - |
| Concreto 28 Mpa para Bordillo | m | 119,520 |
| Anclaje estructural 1/2" | Und | 15,455 |
| Operación y mantenimiento | No encontrado | - |

### 10. TANQUE
| Actividad | Unidad | Cantidad Unitaria |
|-----------|--------|-------------------|
| Sistema Hidro Enterrado | No encontrado | - |
| Excavaciones varias | m³ | 33,456 |
| Concreto clase 28 MPA | m³ | 798,706 |
| Acero de refuerzo Fy=420 Mpa | kg | 5,506 |

### 11. SEÑALIZACION
| Actividad | Unidad | Cantidad Unitaria |
|-----------|--------|-------------------|
| Pintura en frío acrílica | m | 1,832 |
| Pintura en frío acrílica | m² | 61,438 |
| Tachas reflectivas | u | 8,656 |
| Señal vertical de tránsito | u | 405,673 |
| Señal vertical de tránsito | u | 515,257 |
| Captafaros | u | 22,563 |

### 12. BROCALES
| Actividad | Unidad | Cantidad Unitaria |
|-----------|--------|-------------------|
| Excavaciones varias | m³ | 33,456 |
| Concreto revestimiento clase 28 Mpa | m³ | 1,093,051 |
| Concreto clase 28 MPA (Zapatas/Estribos) | m³ | 955,986 |
| Concreto clase 14 MPA | m³ | 556,869 |
| Acero de refuerzo Fy=420 Mpa | kg | 5,506 |
| Geodren vial (0.5m - tub 6") | m | 66,386 |
| Microfibra sintética | kg | 36,248 |

---

## Avances Diarios (Hoja: Avances_Diarios)

### Estructura de la hoja:
- **Fila 1**: Última fecha en BD_Actividades, PK inicial/final T0 y T4
- **Fila 3**: Encabezados (Actividad, Costado, Fecha, Turno, PK inicial, PK final, Long., Cantidad, Und., Módulos, % avance)
- **Fila 4+**: Datos de actividades

### Actividades con avance registrado:

| Actividad | Fecha | Turno | PK Ini | PK Fin | Long. | Cantidad | Und. | Avance |
|-----------|-------|-------|--------|--------|-------|----------|------|--------|
| Geomembrana en bóveda | 2026-10-08 | Día | 6583 | 6572 | 11 | - | m | 60.4% |
| Vaciado concreto viga base HD | 2026-10-06 | Día | 6198.77 | 6183.97 | 14.8 | 14.5 | m³ | 100% |
| Vaciado concreto viga base HI | 2026-10-05 | Día | 6220.98 | 6191.37 | 29.61 | 18.5 | m³ | 100% |
| Acero viga base HD | 2026-10-02 | Día | 6183.97 | 6176.57 | 7.4 | 364.95 | kg | 100% |
| Acero viga base HI | 2026-10-02 | Día | 6183.97 | 6176.57 | 7.4 | 364.95 | kg | 100% |
| Encofrado viga base HD | 2026-10-06 | Día | 6198.77 | 6183.97 | 14.8 | 14.8 | m | 100% |
| Encofrado viga base HI | 2026-10-05 | Día | 6220.98 | 6191.37 | 29.61 | 22.5 | m | 100% |
| Malla electrosoldada | 2026-10-07 | Noche | 7085 | 7085 | 0 | 24 | kg | 8.9% |
| Concreto de revestimiento | 2026-10-08 | Día | 7137 | 7129.5 | 7.5 | 42 | m³ | 4.4% |
| Posicionamiento formaleta | 2026-10-07 | Noche | 7137 | 7129.5 | 7.5 | - | - | 4.4% |
| Desencofrado formaleta | 2026-10-07 | Noche | 7144.5 | 7137 | 7.5 | - | - | 3.7% |

---

## Resumen de Avance Actual del Túnel 0

### Concreto Vaciado Acumulado:
- **Viga Base**: 269.99 m³
- **Revestimiento**: 477 m³
- **Total**: ~747 m³

### Acero Instalado:
- **Viga Base**: 14,885.09 kg
- **Revestimiento**: 1,015.2 m² (malla electrosoldada)

### Impermeabilización:
- **Geomembrana**: 2,338.71 m²
- **Tubería PVC**: 20.58 m
- **Accesorios Y 6"**: 12 und

### Avance Estimado Total: **~47.2%**

---

## Configuración de la App para Lectura Automática

### Hojas que la app debe leer automáticamente:

1. **Matriz cant.** → Actividades cobrables con cantidades
2. **Avances_Diarios** → Avance diario por actividad con porcentajes
3. **BD_Actividades** → Base de datos de actividades (4599 filas)
4. **Módulos_VB** → Módulos de viga base (137 módulos)
5. **Formato Túnel_Dia** → Reporte turno día
6. **Formato Túnel_Noche** → Reporte turno noche

### Mapeo de columnas esperado:

#### Hoja: Matriz cant.
| Columna | Contenido |
|---------|-----------|
| A | TRAMO (TUNEL 0) |
| B | GRUPO (SOPORTE-REGULARIZADO, IMPERMEABILIZACION, etc.) |
| C | Nombre de tarea |
| D | Unidad |
| E | V. Unitario |
| F | * |
| G | 0 |
| H | 18979.83 (acumulado) |
| I | 9376.37 (semanal) |
| J | - |
| K | 28356.20 (mensual) |

#### Hoja: Avances_Diarios
| Columna | Contenido |
|---------|-----------|
| A | Actividad |
| B | Costado |
| C | Fecha |
| D | Turno |
| E | PK inicial |
| F | PK final |
| G | Long. (m) |
| H | Cantidad |
| I | Und. |
| J | Módulos |
| K | % avance |
| L | - |
| M | Código |
| N | Costado (filtro) |
| O | Orden (fecha+turno) |

#### Hoja: BD_Actividades
| Columna | Contenido |
|---------|-----------|
| A | Fecha |
| B | Turno |
| C | Actividad |
| D | Frente |
| E | Grupo |
| F | Und. |
| G | PK inicial |
| H | PK final |
| I | ¿Qué va en dato 1? |
| J | Dato 1 |
| K | ¿Qué va en dato 2? |
| L | Dato 2 |
| M | Hora inicio (franja 1) |
| N | Hora fin (franja 1) |
| O | Hora inicio (franja 2) |

---

## Notas Importantes

1. **Los nombres de las hojas NUNCA cambian** - solo se alimentan con más datos
2. **El Túnel 0 es el principal** - tiene 137 módulos de viga base
3. **Las actividades cobrables** están en la hoja "Matriz cant."
4. **Los avances diarios** están en "Avances_Diarios" y "BD_Actividades"
5. **Los módulos** están en "Módulos_VB" con sus abscisas exactas
6. **El formato de reporte** está en "Formato Túnel_Dia" y "Formato Túnel_Noche"
7. **La app debe leer automáticamente** estas hojas al importar el archivo
8. **Validación**: Verificar que las hojas existan antes de procesar
9. **Manejo de errores**: Si una hoja no existe, mostrar advertencia pero continuar
10. **Actualización**: Al importar, actualizar el modelo 3D con los nuevos avances
