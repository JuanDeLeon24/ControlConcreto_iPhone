/// Modelo de datos para los KPIs del dashboard
class KPIData {
  final double avanceTotal;
  final double metrosEjecutados;
  final double metrosFaltantes;
  final double concretoVaciado;
  final double productividadSemanal;
  final double productividadMensual;
  final int actividadesRetrasadas;
  final int modulosCompletados;
  final int modulosTotales;
  final double velocidadAvance;
  final DateTime? fechaProyectadaTerminacion;
  final List<AvanceSemanal> curvaS;
  final Map<String, double> avancePorFrente;
  final Map<String, double> avancePorGaleria;

  KPIData({
    this.avanceTotal = 0,
    this.metrosEjecutados = 0,
    this.metrosFaltantes = 0,
    this.concretoVaciado = 0,
    this.productividadSemanal = 0,
    this.productividadMensual = 0,
    this.actividadesRetrasadas = 0,
    this.modulosCompletados = 0,
    this.modulosTotales = 0,
    this.velocidadAvance = 0,
    this.fechaProyectadaTerminacion,
    this.curvaS = const [],
    this.avancePorFrente = const {},
    this.avancePorGaleria = const {},
  });

  double get porcentajeCompletado =>
      modulosTotales > 0 ? (modulosCompletados / modulosTotales) * 100 : 0;
}

class AvanceSemanal {
  final DateTime semana;
  final double avanceProgramado;
  final double avanceReal;

  AvanceSemanal({
    required this.semana,
    required this.avanceProgramado,
    required this.avanceReal,
  });
}
