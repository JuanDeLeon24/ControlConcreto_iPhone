import 'dart:io';
import 'package:excel/excel.dart';
import '../models/tunnel_module.dart';
import '../models/activity.dart';
import '../models/daily_report.dart';

/// Servicio para leer y procesar el archivo Excel de reporte diario
/// Las hojas NUNCA cambian de nombre, solo se alimentan con más información
class ExcelService {
  static const String HOJA_MATRIZ = 'Matriz cant.';
  static const String HOJA_AVANCES = 'Avances_Diarios';
  static const String HOJA_ACTIVIDADES = 'BD_Actividades';
  static const String HOJA_MODULOS = 'Módulos_VB';
  static const String HOJA_FORMATO_DIA = 'Formato Túnel_Dia';
  static const String HOJA_FORMATO_NOCHE = 'Formato Túnel_Noche';
  static const String HOJA_RESUMEN = 'Resumen';

  /// Lee el archivo Excel y extrae los módulos del Túnel 0
  Future<List<TunnelModule>> leerModulosTunel0(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) {
      throw Exception('Archivo no encontrado: $filePath');
    }

    final bytes = await file.readAsBytes();
    final excel = Excel.decodeBytes(bytes);

    // Leer módulos de viga base (hoja Módulos_VB)
    final modulos = <TunnelModule>[];
    final sheetModulos = excel.tables[HOJA_MODULOS];
    
    if (sheetModulos != null) {
      for (int i = 4; i < sheetModulos.maxRows; i++) {
        final row = sheetModulos.rows[i];
        final moduloNum = row[0]?.value;
        if (moduloNum == null) continue;

        try {
          final abscisaIni = _parseDouble(row[1]?.value);
          final abscisaFin = _parseDouble(row[2]?.value);
          final longitud = _parseDouble(row[3]?.value);

          modulos.add(TunnelModule(
            id: moduloNum is int ? moduloNum : int.tryParse(moduloNum.toString()) ?? i,
            moduloNumber: moduloNum is int ? moduloNum : int.tryParse(moduloNum.toString()) ?? i,
            abscisaInicial: abscisaIni,
            abscisaFinal: abscisaFin,
            longitud: longitud,
            galeria: 'Túnel 0',
            frente: 'Frente 1',
            estado: 'En ejecución',
            avanceTotal: 0, // Se calcula desde avances
          ));
        } catch (e) {
          // Continuar con el siguiente módulo si hay error
          continue;
        }
      }
    }

    return modulos;
  }

  /// Lee los avances diarios desde la hoja Avances_Diarios
  Future<List<DailyReport>> leerAvancesDiarios(String filePath) async {
    final file = File(filePath);
    final bytes = await file.readAsBytes();
    final excel = Excel.decodeBytes(bytes);

    final reportes = <DailyReport>[];
    final sheet = excel.tables[HOJA_AVANCES];

    if (sheet == null) return reportes;

    // Procesar filas desde la fila 4 (índice 3)
    final actividades = <ReportActivity>[];
    DateTime? fechaActual;

    for (int i = 3; i < sheet.maxRows; i++) {
      final row = sheet.rows[i];
      final actividad = row[0]?.value?.toString();
      
      if (actividad == null) continue;
      if (actividad.startsWith('AVANCE') || actividad.startsWith('TÚNEL')) {
        // Guardar reporte anterior si existe
        if (actividades.isNotEmpty && fechaActual != null) {
          reportes.add(DailyReport(
            fecha: fechaActual,
            turno: 'Día',
            actividades: List.from(actividades),
          ));
          actividades.clear();
        }
        continue;
      }

      try {
        final fecha = row[2]?.value;
        if (fecha is DateTime) fechaActual = fecha;

        final turno = row[3]?.value?.toString() ?? 'Día';
        final pkIni = _parseDouble(row[4]?.value);
        final pkFin = _parseDouble(row[5]?.value);
        final cantidad = _parseDouble(row[7]?.value);
        final unidad = row[8]?.value?.toString() ?? '';
        final avance = _parseDouble(row[10]?.value);
        final codigo = row[12]?.value?.toString() ?? '';

        actividades.add(ReportActivity(
          codigo: codigo,
          nombre: actividad,
          frente: 'TUNEL 0',
          grupo: '',
          pkInicial: pkIni,
          pkFinal: pkFin,
          cantidad: cantidad,
          unidad: unidad,
          avancePercent: avance,
        ));
      } catch (e) {
        continue;
      }
    }

    // Agregar último reporte
    if (actividades.isNotEmpty && fechaActual != null) {
      reportes.add(DailyReport(
        fecha: fechaActual,
        turno: 'Día',
        actividades: actividades,
      ));
    }

    return reportes;
  }

  /// Lee las actividades desde BD_Actividades
  Future<List<Activity>> leerActividades(String filePath) async {
    final file = File(filePath);
    final bytes = await file.readAsBytes();
    final excel = Excel.decodeBytes(bytes);

    final actividades = <Activity>[];
    final sheet = excel.tables[HOJA_ACTIVIDADES];

    if (sheet == null) return actividades;

    for (int i = 5; i < sheet.maxRows; i++) {
      final row = sheet.rows[i];
      final actividad = row[2]?.value?.toString();
      if (actividad == null) continue;

      try {
        final fecha = row[0]?.value;
        final turno = row[1]?.value?.toString() ?? 'Día';
        final frente = row[3]?.value?.toString() ?? '';
        final grupo = row[4]?.value?.toString() ?? '';
        final unidad = row[5]?.value?.toString() ?? '';
        final pkIni = _parseDouble(row[6]?.value);
        final pkFin = _parseDouble(row[7]?.value);
        final dato1 = row[9]?.value;
        final dato2 = row[11]?.value;

        actividades.add(Activity(
          id: '$i',
          nombre: actividad,
          estado: 'En ejecución',
          fechaInicio: fecha is DateTime ? fecha : null,
          cantidadEjecutada: _parseDouble(dato1 ?? dato2),
          unidad: unidad,
          grupo: grupo,
          turno: turno,
        ));
      } catch (e) {
        continue;
      }
    }

    return actividades;
  }

  /// Calcula el avance de cada módulo basado en las actividades
  Map<int, double> calcularAvancePorModulo(List<Activity> actividades) {
    final avancePorModulo = <int, double>{};

    for (final actividades in actividades) {
      // Extraer números de módulo del nombre de la actividad
      final match = RegExp(r'(\d+)(?::(\d+))?').firstMatch(actividades.nombre);
      if (match != null) {
        final modulo = int.tryParse(match.group(1) ?? '');
        if (modulo != null) {
          avancePorModulo[modulo] = (avancePorModulo[modulo] ?? 0) + actividades.avancePercent;
        }
      }
    }

    return avancePorModulo;
  }

  double _parseDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value.replaceAll(',', '.')) ?? 0;
    return 0;
  }
}
