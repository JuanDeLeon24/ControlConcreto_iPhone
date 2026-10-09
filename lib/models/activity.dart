/// Modelo de datos para una actividad constructiva
class Activity {
  final String id;
  final String nombre;
  final String estado;
  final DateTime? fechaInicio;
  final DateTime? fechaFin;
  final double cantidadProgramada;
  final double cantidadEjecutada;
  final double avancePercent;
  final String unidad;
  final String? responsable;
  final String grupo;
  final String? observaciones;
  final String turno;

  Activity({
    required this.id,
    required this.nombre,
    required this.estado,
    this.fechaInicio,
    this.fechaFin,
    this.cantidadProgramada = 0,
    this.cantidadEjecutada = 0,
    this.avancePercent = 0,
    this.unidad = '',
    this.responsable,
    this.grupo = '',
    this.observaciones,
    this.turno = 'Día',
  });

  bool get isCompleted => avancePercent >= 100;
  bool get isDelayed => avancePercent < 50 && fechaFin != null && DateTime.now().isAfter(fechaFin!);
  bool get isInProgress => avancePercent > 0 && avancePercent < 100;

  factory Activity.fromExcelRow(Map<String, dynamic> row) {
    return Activity(
      id: row['id'] ?? '',
      nombre: row['nombre'] ?? '',
      estado: row['estado'] ?? 'Pendiente',
      fechaInicio: row['fecha_inicio'],
      fechaFin: row['fecha_fin'],
      cantidadProgramada: (row['cantidad_programada'] ?? 0).toDouble(),
      cantidadEjecutada: (row['cantidad_ejecutada'] ?? 0).toDouble(),
      avancePercent: (row['avance'] ?? 0).toDouble(),
      unidad: row['unidad'] ?? '',
      responsable: row['responsable'],
      grupo: row['grupo'] ?? '',
      observaciones: row['observaciones'],
      turno: row['turno'] ?? 'Día',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'estado': estado,
      'fecha_inicio': fechaInicio?.toIso8601String(),
      'fecha_fin': fechaFin?.toIso8601String(),
      'cantidad_programada': cantidadProgramada,
      'cantidad_ejecutada': cantidadEjecutada,
      'avance': avancePercent,
      'unidad': unidad,
      'responsable': responsable,
      'grupo': grupo,
      'observaciones': observaciones,
      'turno': turno,
    };
  }
}
