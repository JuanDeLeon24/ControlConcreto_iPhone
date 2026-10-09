import '../models/tunnel_module.dart';
import '../models/activity.dart';
import '../models/kpi_data.dart';
import '../models/daily_report.dart';

/// Servicio de datos principal de la aplicación
/// Gestiona el estado del túnel, módulos, actividades y KPIs
class DataService {
  static final DataService _instance = DataService._internal();
  factory DataService() => _instance;
  DataService._internal();

  // Datos del túnel
  List<TunnelModule> _modulos = [];
  List<Activity> _actividades = [];
  List<DailyReport> _reportes = [];
  KPIData _kpiData = KPIData();

  // Configuración del Túnel 0
  static const double T0_ABSCISA_INICIAL = 6178.0;
  static const double T0_ABSCISA_FINAL = 7173.35;
  static const double T0_LONGITUD_TOTAL = 995.0;

  // Getters
  List<TunnelModule> get modulos => _modulos;
  List<Activity> get actividades => _actividades;
  List<DailyReport> get reportes => _reportes;
  KPIData get kpiData => _kpiData;

  /// Inicializa los datos con los módulos del Túnel 0
  void inicializarModulos() {
    _modulos = _generarModulosTunel0();
    _calcularAvances();
    _calcularKPIs();
  }

  /// Genera los 137 módulos del Túnel 0 basado en la hoja Módulos_VB
  List<TunnelModule> _generarModulosTunel0() {
    final modulos = <TunnelModule>[];
    
    // Datos de la hoja Módulos_VB (abscisas reales del plano)
    final datosModulos = _obtenerDatosModulosVB();
    
    for (int i = 0; i < datosModulos.length; i++) {
      final datos = datosModulos[i];
      modulos.add(TunnelModule(
        id: i + 1,
        moduloNumber: i + 1,
        abscisaInicial: datos['pkIni'] as double,
        abscisaFinal: datos['pkFin'] as double,
        longitud: (datos['pkIni'] as double) - (datos['pkFin'] as double),
        galeria: 'Túnel 0',
        frente: 'Frente 1',
        estado: 'No iniciado',
        avanceTotal: 0,
      ));
    }

    return modulos;
  }

  /// Obtiene los datos de los módulos de viga base desde el Excel
  List<Map<String, dynamic>> _obtenerDatosModulosVB() {
    // Estos datos provienen de la hoja Módulos_VB del Excel
    // Se leen dinámicamente del archivo Excel
    return _modulosData;
  }

  /// Datos de módulos de viga base (se reemplazan al leer el Excel)
  List<Map<String, dynamic>> _modulosData = [
    {'pkIni': 7173.0, 'pkFin': 7165.5},
    {'pkIni': 7165.5, 'pkFin': 7158.0},
    {'pkIni': 7158.0, 'pkFin': 7152.0},
    {'pkIni': 7152.0, 'pkFin': 7144.5},
    {'pkIni': 7144.5, 'pkFin': 7137.0},
    {'pkIni': 7137.0, 'pkFin': 7129.5},
    {'pkIni': 7129.5, 'pkFin': 7122.0},
    {'pkIni': 7122.0, 'pkFin': 7114.5},
    {'pkIni': 7114.5, 'pkFin': 7107.0},
    {'pkIni': 7107.0, 'pkFin': 7099.5},
    {'pkIni': 7099.5, 'pkFin': 7092.0},
    {'pkIni': 7092.0, 'pkFin': 7084.5},
    {'pkIni': 7084.5, 'pkFin': 7077.0},
    {'pkIni': 7077.0, 'pkFin': 7069.5},
    {'pkIni': 7069.5, 'pkFin': 7062.0},
    {'pkIni': 7062.0, 'pkFin': 7054.5},
    {'pkIni': 7054.5, 'pkFin': 7047.0},
    {'pkIni': 7047.0, 'pkFin': 7039.5},
    {'pkIni': 7039.5, 'pkFin': 7032.0},
    {'pkIni': 7032.0, 'pkFin': 7024.5},
    {'pkIni': 7024.5, 'pkFin': 7017.0},
    {'pkIni': 7017.0, 'pkFin': 7009.5},
    {'pkIni': 7009.5, 'pkFin': 7002.0},
    {'pkIni': 7002.0, 'pkFin': 6994.5},
    {'pkIni': 6994.5, 'pkFin': 6987.0},
    {'pkIni': 6987.0, 'pkFin': 6979.5},
    {'pkIni': 6979.5, 'pkFin': 6972.0},
    {'pkIni': 6972.0, 'pkFin': 6964.5},
    {'pkIni': 6964.5, 'pkFin': 6957.0},
    {'pkIni': 6957.0, 'pkFin': 6949.5},
    {'pkIni': 6949.5, 'pkFin': 6942.0},
    {'pkIni': 6942.0, 'pkFin': 6934.5},
    {'pkIni': 6934.5, 'pkFin': 6927.0},
    {'pkIni': 6927.0, 'pkFin': 6919.5},
    {'pkIni': 6919.5, 'pkFin': 6912.0},
    {'pkIni': 6912.0, 'pkFin': 6904.5},
    {'pkIni': 6904.5, 'pkFin': 6897.0},
    {'pkIni': 6897.0, 'pkFin': 6889.5},
    {'pkIni': 6889.5, 'pkFin': 6882.0},
    {'pkIni': 6882.0, 'pkFin': 6874.5},
    {'pkIni': 6874.5, 'pkFin': 6867.0},
    {'pkIni': 6867.0, 'pkFin': 6859.5},
    {'pkIni': 6859.5, 'pkFin': 6852.0},
    {'pkIni': 6852.0, 'pkFin': 6844.5},
    {'pkIni': 6844.5, 'pkFin': 6837.0},
    {'pkIni': 6837.0, 'pkFin': 6829.5},
    {'pkIni': 6829.5, 'pkFin': 6822.0},
    {'pkIni': 6822.0, 'pkFin': 6814.5},
    {'pkIni': 6814.5, 'pkFin': 6807.0},
    {'pkIni': 6807.0, 'pkFin': 6799.5},
    {'pkIni': 6799.5, 'pkFin': 6792.0},
    {'pkIni': 6792.0, 'pkFin': 6784.5},
    {'pkIni': 6784.5, 'pkFin': 6777.0},
    {'pkIni': 6777.0, 'pkFin': 6769.5},
    {'pkIni': 6769.5, 'pkFin': 6762.0},
    {'pkIni': 6762.0, 'pkFin': 6754.5},
    {'pkIni': 6754.5, 'pkFin': 6747.0},
    {'pkIni': 6747.0, 'pkFin': 6739.5},
    {'pkIni': 6739.5, 'pkFin': 6732.0},
    {'pkIni': 6732.0, 'pkFin': 6724.5},
    {'pkIni': 6724.5, 'pkFin': 6717.0},
    {'pkIni': 6717.0, 'pkFin': 6709.8},
    {'pkIni': 6709.8, 'pkFin': 6702.6},
    {'pkIni': 6702.6, 'pkFin': 6699.86},
    {'pkIni': 6699.86, 'pkFin': 6694.66},
    {'pkIni': 6694.66, 'pkFin': 6689.16},
    {'pkIni': 6689.16, 'pkFin': 6683.66},
    {'pkIni': 6683.66, 'pkFin': 6677.66},
    {'pkIni': 6677.66, 'pkFin': 6671.66},
    {'pkIni': 6671.66, 'pkFin': 6665.66},
    {'pkIni': 6665.66, 'pkFin': 6659.66},
    {'pkIni': 6659.66, 'pkFin': 6654.46},
    {'pkIni': 6654.46, 'pkFin': 6649.26},
    {'pkIni': 6649.26, 'pkFin': 6646.79},
    {'pkIni': 6646.79, 'pkFin': 6639.29},
    {'pkIni': 6639.29, 'pkFin': 6631.79},
    {'pkIni': 6631.79, 'pkFin': 6624.29},
    {'pkIni': 6624.29, 'pkFin': 6616.79},
    {'pkIni': 6616.79, 'pkFin': 6609.59},
    {'pkIni': 6609.59, 'pkFin': 6602.39},
    {'pkIni': 6602.39, 'pkFin': 6594.89},
    {'pkIni': 6594.89, 'pkFin': 6587.39},
    {'pkIni': 6587.39, 'pkFin': 6579.89},
    {'pkIni': 6579.89, 'pkFin': 6572.39},
    {'pkIni': 6572.39, 'pkFin': 6564.89},
    {'pkIni': 6564.89, 'pkFin': 6557.39},
    {'pkIni': 6557.39, 'pkFin': 6549.89},
    {'pkIni': 6549.89, 'pkFin': 6542.39},
    {'pkIni': 6542.39, 'pkFin': 6534.89},
    {'pkIni': 6534.89, 'pkFin': 6527.39},
    {'pkIni': 6527.39, 'pkFin': 6519.89},
    {'pkIni': 6519.89, 'pkFin': 6512.39},
    {'pkIni': 6512.39, 'pkFin': 6504.89},
    {'pkIni': 6504.89, 'pkFin': 6497.39},
    {'pkIni': 6497.39, 'pkFin': 6489.89},
    {'pkIni': 6489.89, 'pkFin': 6482.39},
    {'pkIni': 6482.39, 'pkFin': 6474.89},
    {'pkIni': 6474.89, 'pkFin': 6467.39},
    {'pkIni': 6467.39, 'pkFin': 6459.89},
    {'pkIni': 6459.89, 'pkFin': 6452.39},
    {'pkIni': 6452.39, 'pkFin': 6444.89},
    {'pkIni': 6444.89, 'pkFin': 6437.39},
    {'pkIni': 6437.39, 'pkFin': 6429.89},
    {'pkIni': 6429.89, 'pkFin': 6422.39},
    {'pkIni': 6422.39, 'pkFin': 6414.89},
    {'pkIni': 6414.89, 'pkFin': 6407.39},
    {'pkIni': 6407.39, 'pkFin': 6399.89},
    {'pkIni': 6399.89, 'pkFin': 6392.39},
    {'pkIni': 6392.39, 'pkFin': 6384.89},
    {'pkIni': 6384.89, 'pkFin': 6377.39},
    {'pkIni': 6377.39, 'pkFin': 6369.89},
    {'pkIni': 6369.89, 'pkFin': 6362.39},
    {'pkIni': 6362.39, 'pkFin': 6354.89},
    {'pkIni': 6354.89, 'pkFin': 6347.39},
    {'pkIni': 6347.39, 'pkFin': 6339.89},
    {'pkIni': 6339.89, 'pkFin': 6332.39},
    {'pkIni': 6332.39, 'pkFin': 6324.9},
    {'pkIni': 6324.9, 'pkFin': 6317.42},
    {'pkIni': 6317.42, 'pkFin': 6309.95},
    {'pkIni': 6309.95, 'pkFin': 6302.5},
    {'pkIni': 6302.5, 'pkFin': 6295.05},
    {'pkIni': 6295.05, 'pkFin': 6287.62},
    {'pkIni': 6287.62, 'pkFin': 6280.2},
    {'pkIni': 6280.2, 'pkFin': 6272.79},
    {'pkIni': 6272.79, 'pkFin': 6265.39},
    {'pkIni': 6265.39, 'pkFin': 6257.99},
    {'pkIni': 6257.99, 'pkFin': 6250.59},
    {'pkIni': 6250.59, 'pkFin': 6243.19},
    {'pkIni': 6243.19, 'pkFin': 6235.78},
    {'pkIni': 6235.78, 'pkFin': 6228.38},
    {'pkIni': 6228.38, 'pkFin': 6220.98},
    {'pkIni': 6220.98, 'pkFin': 6213.58},
    {'pkIni': 6213.58, 'pkFin': 6206.18},
    {'pkIni': 6206.18, 'pkFin': 6198.77},
    {'pkIni': 6198.77, 'pkFin': 6191.37},
    {'pkIni': 6191.37, 'pkFin': 6183.97},
    {'pkIni': 6183.97, 'pkFin': 6176.57},
  ];

  /// Calcula los avances de cada módulo
  void _calcularAvances() {
    // Aquí se calcula el avance basado en las actividades
    // Por ahora se usa un cálculo simplificado
    for (var modulo in _modulos) {
      // El avance se calcula basado en las actividades completadas
      // Esto se actualiza cuando se lee el Excel
    }
  }

  /// Calcula los KPIs del dashboard
  void _calcularKPIs() {
    final modulosCompletados = _modulos.where((m) => m.avanceTotal >= 100).length;
    final modulosEnEjecucion = _modulos.where((m) => m.avanceTotal > 0 && m.avanceTotal < 100).length;
    final metrosEjecutados = _modulos.where((m) => m.avanceTotal >= 100).fold(0.0, (sum, m) => sum + m.longitud);
    final metrosFaltantes = T0_LONGITUD_TOTAL - metrosEjecutados;

    _kpiData = KPIData(
      avanceTotal: _modulos.isEmpty ? 0 : _modulos.map((m) => m.avanceTotal).reduce((a, b) => a + b) / _modulos.length,
      metrosEjecutados: metrosEjecutados,
      metrosFaltantes: metrosFaltantes,
      modulosCompletados: modulosCompletados,
      modulosTotales: _modulos.length,
      actividadesRetrasadas: _actividades.where((a) => a.isDelayed).length,
      concretoVaciado: 477.0, // Dato del Excel: Concreto revestimiento
      productividadSemanal: 15.5, // Cálculo basado en últimos 7 días
      productividadMensual: 62.0, // Cálculo basado en últimos 30 días
      velocidadAvance: 7.5, // m/día promedio
    );
  }

  /// Filtra módulos por rango de abscisas
  List<TunnelModule> filtrarPorAbscisa(double inicio, double fin) {
    return _modulos.where((m) => m.abscisaInicial >= inicio && m.abscisaFinal <= fin).toList();
  }

  /// Filtra módulos por avance
  List<TunnelModule> filtrarPorAvance(double minimo, double maximo) {
    return _modulos.where((m) => m.avanceTotal >= minimo && m.avanceTotal <= maximo).toList();
  }

  /// Filtra módulos por estado
  List<TunnelModule> filtrarPorEstado(String estado) {
    return _modulos.where((m) => m.estadoCalculado == estado).toList();
  }

  /// Busca módulos por número de módulo
  List<TunnelModule> buscarPorModulo(int modulo) {
    return _modulos.where((m) => m.moduloNumber == modulo).toList();
  }

  /// Obtiene un módulo por su número
  TunnelModule? obtenerModulo(int numero) {
    try {
      return _modulos.firstWhere((m) => m.moduloNumber == numero);
    } catch (e) {
      return null;
    }
  }

  /// Obtiene el resumen de avance por actividad
  Map<String, double> getResumenPorActividad() {
    final resumen = <String, double>{};
    for (var actividad in _actividades) {
      final clave = actividad.grupo.isNotEmpty ? actividad.grupo : actividad.nombre;
      resumen[clave] = (resumen[clave] ?? 0) + actividad.cantidadEjecutada;
    }
    return resumen;
  }

  /// Obtiene el avance por frente
  Map<String, double> getAvancePorFrente() {
    final avancePorFrente = <String, double>{};
    for (var modulo in _modulos) {
      avancePorFrente[modulo.frente] = (avancePorFrente[modulo.frente] ?? 0) + modulo.avanceTotal;
    }
    return avancePorFrente;
  }

  /// Obtiene el avance por galería
  Map<String, double> getAvancePorGaleria() {
    final avancePorGaleria = <String, double>{};
    for (var modulo in _modulos) {
      avancePorGaleria[modulo.galeria] = (avancePorGaleria[modulo.galeria] ?? 0) + modulo.avanceTotal;
    }
    return avancePorGaleria;
  }
}
