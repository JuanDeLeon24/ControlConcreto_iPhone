/// Modelo de datos para el reporte diario de actividades
class DailyReport {
  final DateTime fecha;
  final String turno;
  final List<ReportActivity> actividades;
  final String? observaciones;
  final String? responsable;

  DailyReport({
    required this.fecha,
    required this.turno,
    this.actividades = const [],
    this.observaciones,
    this.responsable,
  });

  double get avancePromedio {
    if (actividades.isEmpty) return 0;
    return actividades.map((a) => a.avancePercent).reduce((a, b) => a + b) / actividades.length;
  }

  int get actividadesCompletadas => actividades.where((a) => a.avancePercent >= 100).length;
  int get actividadesRetrasadas => actividades.where((a) => a.avancePercent < 50).length;
}

class ReportActivity {
  final String codigo;
  final String nombre;
  final String frente;
  final String grupo;
  final double pkInicial;
  final double pkFinal;
  final double cantidad;
  final String unidad;
  final double avancePercent;

  ReportActivity({
    required this.codigo,
    required this.nombre,
    required this.frente,
    required this.grupo,
    required this.pkInicial,
    required this.pkFinal,
    required this.cantidad,
    required this.unidad,
    required this.avancePercent,
  });
}
