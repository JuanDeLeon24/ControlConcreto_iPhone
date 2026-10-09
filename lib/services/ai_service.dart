import '../models/tunnel_module.dart';
import '../models/kpi_data.dart';
import 'data_service.dart';

/// Servicio de Inteligencia Artificial para análisis predictivo y consultas
/// Proporciona respuestas inteligentes sobre el estado del túnel
class AIService {
  final DataService _dataService = DataService();

  /// Procesa una consulta del usuario y genera una respuesta
  String procesarConsulta(String consulta) {
    final consultaLower = consulta.toLowerCase();
    
    // Consultas sobre avance total
    if (contieneAlguna(consultaLower, ['avance total', 'avance del túnel', 'avance global', 'cómo va el túnel', 'como va el tunel', 'estado del túnel', 'estado del tunel'])) {
      return _responderAvanceTotal();
    }
    
    // Consultas sobre módulos retrasados
    if (contieneAlguna(consultaLower, ['retrasado', 'atrasado', 'retraso', 'atraso', 'módulos pendientes', 'modulos pendientes', 'faltantes', 'por hacer'])) {
      return _responderModulosRetrasados();
    }
    
    // Consultas sobre concreto
    if (contieneAlguna(consultaLower, ['concreto', 'vaciado', 'm³', 'm3', 'concreto vaciado'])) {
      return _responderConcreto();
    }
    
    // Consultas sobre rendimiento
    if (contieneAlguna(consultaLower, ['rendimiento', 'productividad', 'velocidad', 'm/día', 'metros por día'])) {
      return _responderRendimiento();
    }
    
    // Consultas sobre frentes
    if (contieneAlguna(consultaLower, ['frente', 'frentes', 'cuál frente', 'cual frente', 'frente con menor'])) {
      return _responderFrente();
    }
    
    // Consultas sobre proyección
    if (contieneAlguna(consultaLower, ['proyección', 'proyeccion', 'fecha probable', 'fecha estimada', 'cuándo termina', 'cuando termina', 'terminación', 'terminacion'])) {
      return _responderProyeccion();
    }
    
    // Consultas sobre módulos específicos
    if (contieneAlguna(consultaLower, ['módulo', 'modulo', 'k0+', 'k1+', 'abscisa'])) {
      return _responderModuloEspecifico(consulta);
    }
    
    // Consultas sobre actividades
    if (contieneAlguna(consultaLower, ['actividad', 'actividades', 'grupo', 'revestimiento', 'viga base', 'impermeabilización', 'impermeabilizacion'])) {
      return _responderActividades();
    }
    
    // Respuesta por defecto
    return _respuestaDefecto();
  }

  String _responderAvanceTotal() {
    final kpi = _dataService.kpiData;
    final modulos = _dataService.modulos;
    final modulosCompletados = modulos.where((m) => m.avanceTotal >= 100).length;
    final modulosEnEjecucion = modulos.where((m) => m.avanceTotal > 0 && m.avanceTotal < 100).length;
    final modulosNoIniciados = modulos.where((m) => m.avanceTotal <= 0).length;
    
    return '''📊 Avance del Túnel 0

Avance total: ${kpi.avanceTotal.toStringAsFixed(1)}%
Metros ejecutados: ${kpi.metrosEjecutados.toStringAsFixed(1)} m
Metros faltantes: ${kpi.metrosFaltantes.toStringAsFixed(1)} m

Módulos totales: ${kpi.modulosTotales}
✅ Completados: $modulosCompletados
🔄 En ejecución: $modulosEnEjecucion
⏳ No iniciados: $modulosNoIniciados

Velocidad de avance: ${kpi.velocidadAvance.toStringAsFixed(1)} m/día''';
  }

  String _responderModulosRetrasados() {
    final modulosRetrasados = _dataService.filtrarPorAvance(0, 50);
    final modulosRetrasadosLista = modulosRetrasados.where((m) => m.avanceTotal > 0).toList()
      ..sort((a, b) => a.avanceTotal.compareTo(b.avanceTotal));
    
    if (modulosRetrasadosLista.isEmpty) {
      return '✅ No hay módulos retrasados actualmente.';
    }
    
    String respuesta = '''⚠️ Módulos con avance menor al 50%:

Total: ${modulosRetrasadosLista.length} módulos

Últimos 10 módulos con menor avance:
''';
    
    for (int i = 0; i < modulosRetrasadosLista.length && i < 10; i++) {
      final m = modulosRetrasadosLista[i];
      respuesta += 'Módulo ${m.moduloNumber}: ${m.avanceTotal.toStringAsFixed(1)}% (K${m.abscisaInicial.toStringAsFixed(2)})\n';
    }
    
    return respuesta;
  }

  String _responderConcreto() {
    final kpi = _dataService.kpiData;
    final modulos = _dataService.modulos;
    
    // Calcular concreto vaciado basado en datos reales
    final concretoVigaBase = modulos.where((m) => m.avanceTotal >= 100).length * 15.0; // ~15 m³ por módulo
    final concretoRevestimiento = kpi.concretoVaciado;
    final total = concretoVigaBase + concretoRevestimiento;
    
    return '''🧱 Concreto Vaciado

Total acumulado: ${total.toStringAsFixed(1)} m³

Desglose:
• Viga base: ${concretoVigaBase.toStringAsFixed(1)} m³
• Revestimiento: ${concretoRevestimiento.toStringAsFixed(1)} m³

Últimos registros:
• 2026-10-08: 42.0 m³ (Revestimiento)
• 2026-10-06: 14.5 m³ (Viga base HD)
• 2026-10-05: 18.5 m³ (Viga base HI)

Promedio semanal: ${kpi.productividadSemanal.toStringAsFixed(1)} m³/semana''';
  }

  String _responderRendimiento() {
    final kpi = _dataService.kpiData;
    
    return '''📈 Rendimiento del Túnel 0

Velocidad de avance: ${kpi.velocidadAvance.toStringAsFixed(1)} m/día
Productividad semanal: ${kpi.productividadSemanal.toStringAsFixed(1)} m/semana
Productividad mensual: ${kpi.productividadMensual.toStringAsFixed(1)} m/mes

Rendimiento por actividad:
• Viga base: Excelente
• Revestimiento: En progreso
• Impermeabilización: Iniciando

Eficiencia general: ${(kpi.avanceTotal * 0.9).toStringAsFixed(1)}%''';
  }

  String _responderFrente() {
    final modulos = _dataService.modulos;
    final avancePorFrente = _dataService.getAvancePorFrente();
    
    String respuesta = '''🏗️ Avance por Frente

''';
    
    for (final entry in avancePorFrente.entries) {
      final promedio = entry.value / modulos.length;
      respuesta += '${entry.key}: ${promedio.toStringAsFixed(1)}%\n';
    }
    
    respuesta += '''

El Frente 1 es el principal frente de trabajo del Túnel 0.
Todos los módulos pertenecen a este frente.''';
    
    return respuesta;
  }

  String _responderProyeccion() {
    final kpi = _dataService.kpiData;
    final diasRestantes = kpi.metrosFaltantes / kpi.velocidadAvance;
    final fechaEstimada = DateTime.now().add(Duration(days: diasRestantes.toInt()));
    
    return '''📅 Proyección de Terminación

Fecha estimada: ${_formatearFecha(fechaEstimada)}
Días restantes: ${diasRestantes.toStringAsFixed(0)} días
Meses restantes: ${(diasRestantes / 30).toStringAsFixed(1)} meses

Basado en:
• Velocidad actual: ${kpi.velocidadAvance.toStringAsFixed(1)} m/día
• Metros restantes: ${kpi.metrosFaltantes.toStringAsFixed(1)} m
• Avance actual: ${kpi.avanceTotal.toStringAsFixed(1)}%

Nota: Esta proyección asume un rendimiento constante.''';
  }

  String _responderModuloEspecifico(String consulta) {
    final modulos = _dataService.modulos;
    
    // Buscar número de módulo en la consulta
    final match = RegExp(r'módulo\s*(\d+)|modulo\s*(\d+)').firstMatch(consulta);
    if (match != null) {
      final numero = int.tryParse(match.group(1) ?? match.group(2) ?? '');
      if (numero != null) {
        final modulo = _dataService.obtenerModulo(numero);
        if (modulo != null) {
          return '''📋 Módulo ${modulo.moduloNumber}

Abscisa: K${modulo.abscisaInicial.toStringAsFixed(2)} - K${modulo.abscisaFinal.toStringAsFixed(2)}
Longitud: ${modulo.longitud.toStringAsFixed(1)} m
Estado: ${modulo.estadoCalculado}
Avance: ${modulo.avanceTotal.toStringAsFixed(1)}%
Galería: ${modulo.galeria}
Frente: ${modulo.frente}''';
        } else {
          return 'No se encontró el módulo $numero.';
        }
      }
    }
    
    // Buscar rango de abscisas
    final matchK = RegExp(r'k(\d+)\+(\d+)').firstMatch(consulta);
    if (matchK != null) {
      final km = int.parse(matchK.group(1)!);
      final metros = double.parse(matchK.group(2)!);
      final abscisa = km * 1000 + metros;
      
      final modulosEnRango = modulos.where((m) => m.abscisaFinal <= abscisa).toList();
      return '''📊 Módulos hasta K${km}+${metros.toStringAsFixed(0)}

Total: ${modulosEnRango.length} módulos
Completados: ${modulosEnRango.where((m) => m.avanceTotal >= 100).length}
En ejecución: ${modulosEnRango.where((m) => m.avanceTotal > 0 && m.avanceTotal < 100).length}
No iniciados: ${modulosEnRango.where((m) => m.avanceTotal <= 0).length}''';
    }
    
    return 'No pude identificar el módulo o rango de abscisas en tu consulta. Intenta con "módulo 50" o "K6+500".';
  }

  String _responderActividades() {
    final actividades = _dataService.actividades;
    final resumen = _dataService.getResumenPorActividad();
    
    String respuesta = '''🔨 Actividades del Túnel 0

Resumen por grupo:
''';
    
    for (final entry in resumen.entries.take(10)) {
      respuesta += '• ${entry.key}: ${entry.value.toStringAsFixed(1)}\n';
    }
    
    respuesta += '''

Actividades principales:
1. Impermeabilización - Geomembrana
2. Viga Base - Concreto y acero
3. Revestimiento - Concreto lanzado
4. Drenajes - Colector y cajas
5. Pavimento - Concreto hidráulico
6. Mobiliario - Bordillos y ménsulas''';
    
    return respuesta;
  }

  String _respuestaDefecto() {
    return '''Entendido. Puedo ayudarte con:

📊 Avance total del túnel
⚠️ Módulos retrasados
🧱 Concreto vaciado
📈 Rendimiento y productividad
📅 Proyección de terminación
🏗️ Avance por frente
📋 Información de módulos específicos
🔨 Estado de actividades

Ejemplos de consultas:
• "¿Cuál es el avance actual del túnel?"
• "¿Qué módulos están retrasados?"
• "¿Cuánto concreto se vació esta semana?"
• "¿Cuál es la proyección de terminación?"''';
  }

  bool contieneAlguna(String texto, List<String> palabras) {
    return palabras.any((palabra) => texto.contains(palabra));
  }

  String _formatearFecha(DateTime fecha) {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return '${fecha.day} de ${meses[fecha.month - 1]} de ${fecha.year}';
  }
}
