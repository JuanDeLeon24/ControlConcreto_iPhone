/// Modelo de datos para un módulo constructivo del túnel
class TunnelModule {
  final int id;
  final int moduloNumber;
  final double abscisaInicial;
  final double abscisaFinal;
  final double longitud;
  final String galeria;
  final String frente;
  final String estado;
  final double avanceTotal;
  final List<Activity> activities;
  final DateTime? fechaInicio;
  final DateTime? fechaFin;
  final String? responsable;
  final String? observaciones;

  TunnelModule({
    required this.id,
    required this.moduloNumber,
    required this.abscisaInicial,
    required this.abscisaFinal,
    required this.longitud,
    required this.galeria,
    required this.frente,
    required this.estado,
    required this.avanceTotal,
    this.activities = const [],
    this.fechaInicio,
    this.fechaFin,
    this.responsable,
    this.observaciones,
  });

  /// Obtiene el color según el avance
  String get colorHex {
    if (avanceTotal <= 0) return '#9E9E9E';
    if (avanceTotal < 25) return '#E53935';
    if (avanceTotal < 50) return '#FF9800';
    if (avanceTotal < 75) return '#FDD835';
    if (avanceTotal < 100) return '#1E88E5';
    return '#43A047';
  }

  /// Verifica si el módulo está en un rango de abscisas
  bool isInRange(double start, double end) {
    return abscisaInicial >= start && abscisaFinal <= end;
  }

  /// Obtiene el estado basado en el avance
  String get estadoCalculado {
    if (avanceTotal <= 0) return 'No iniciado';
    if (avanceTotal < 25) return 'Retrasado';
    if (avanceTotal < 50) return 'En ejecución';
    if (avanceTotal < 75) return 'Avanzado';
    if (avanceTotal < 100) return 'Casi terminado';
    return 'Terminado';
  }

  factory TunnelModule.fromExcelRow(Map<String, dynamic> row) {
    return TunnelModule(
      id: row['id'] ?? 0,
      moduloNumber: row['modulo'] ?? 0,
      abscisaInicial: (row['abscisa_inicial'] ?? 0).toDouble(),
      abscisaFinal: (row['abscisa_final'] ?? 0).toDouble(),
      longitud: (row['longitud'] ?? 0).toDouble(),
      galeria: row['galeria'] ?? 'Túnel 0',
      frente: row['frente'] ?? 'Frente 1',
      estado: row['estado'] ?? 'No iniciado',
      avanceTotal: (row['avance'] ?? 0).toDouble(),
      fechaInicio: row['fecha_inicio'],
      fechaFin: row['fecha_fin'],
      responsable: row['responsable'],
      observaciones: row['observaciones'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'modulo': moduloNumber,
      'abscisa_inicial': abscisaInicial,
      'abscisa_final': abscisaFinal,
      'longitud': longitud,
      'galeria': galeria,
      'frente': frente,
      'estado': estado,
      'avance': avanceTotal,
      'fecha_inicio': fechaInicio?.toIso8601String(),
      'fecha_fin': fechaFin?.toIso8601String(),
      'responsable': responsable,
      'observaciones': observaciones,
    };
  }
}
