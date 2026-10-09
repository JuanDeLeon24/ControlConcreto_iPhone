import 'package:flutter/material.dart';
import '../models/tunnel_module.dart';
import '../utils/app_theme.dart';

/// Hoja de detalle del módulo seleccionado
/// Muestra información completa del módulo con actividades y avance
class ModuleDetailSheet extends StatelessWidget {
  final TunnelModule modulo;

  const ModuleDetailSheet({
    super.key,
    required this.modulo,
  });

  @override
  Widget build(BuildContext context) {
    final color = Color(
      int.parse(modulo.colorHex.replaceFirst('#', '0xFF')),
    );

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            controller: scrollController,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                
                // Header
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.view_module,
                              color: color,
                              size: 32,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'MÓDULO ${modulo.moduloNumber}',
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  modulo.estadoCalculado,
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: color,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Información general
                _buildInfoSection('INFORMACIÓN GENERAL', [
                  _buildInfoRow('Abscisa Inicial', 'K${modulo.abscisaInicial.toStringAsFixed(2)}'),
                  _buildInfoRow('Abscisa Final', 'K${modulo.abscisaFinal.toStringAsFixed(2)}'),
                  _buildInfoRow('Longitud', '${modulo.longitud.toStringAsFixed(1)} m'),
                  _buildInfoRow('Galería', modulo.galeria),
                  _buildInfoRow('Frente', modulo.frente),
                ]),
                
                // Avance
                _buildInfoSection('AVANCE', [
                  _buildProgressRow('Avance Total', modulo.avanceTotal, color),
                ]),
                
                // Actividades del módulo
                _buildInfoSection('ACTIVIDADES', [
                  _buildActivityRow('Excavación', 100, AppTheme.colorTerminado),
                  _buildActivityRow('Sostenimiento', 100, AppTheme.colorTerminado),
                  _buildActivityRow('Impermeabilización', 60, AppTheme.colorEnEjecucion),
                  _buildActivityRow('Viga Base', 85, AppTheme.colorAvanzado),
                  _buildActivityRow('Revestimiento', modulo.avanceTotal, color),
                ]),
                
                // Observaciones
                _buildInfoSection('OBSERVACIONES', [
                  const Text(
                    'Sin observaciones registradas para este módulo.',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ]),
                
                const SizedBox(height: 20),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: AppTheme.accentColor,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressRow(String label, double progress, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
              Text(
                '${progress.toStringAsFixed(1)}%',
                style: TextStyle(
                  color: color,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: progress / 100,
            backgroundColor: Colors.grey[800],
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ],
      ),
    );
  }

  Widget _buildActivityRow(String name, double progress, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(
              name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: LinearProgressIndicator(
              value: progress / 100,
              backgroundColor: Colors.grey[800],
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 40,
            child: Text(
              '${progress.toInt()}%',
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
