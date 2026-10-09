import 'package:flutter/material.dart';
import '../models/tunnel_module.dart';
import '../utils/app_theme.dart';

/// Barra de progreso longitudinal del túnel
/// Cada bloque representa un módulo con su color de avance
/// Al tocar un bloque, notifica para mostrar detalle del módulo
class LongitudinalProgressBar extends StatelessWidget {
  final List<TunnelModule> modulos;
  final Function(TunnelModule) onModuleTap;

  const LongitudinalProgressBar({
    super.key,
    required this.modulos,
    required this.onModuleTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final blockWidth = constraints.maxWidth / modulos.length;
        
        return Stack(
          children: [
            // Fondo con gradiente sutil
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.backgroundColor.withOpacity(0.5),
                    AppTheme.cardColor.withOpacity(0.8),
                  ],
                ),
              ),
            ),
            // Bloques de módulos
            Row(
              children: modulos.map((modulo) {
                final color = Color(
                  int.parse(modulo.colorHex.replaceFirst('#', '0xFF')),
                );
                
                return Expanded(
                  child: GestureDetector(
                    onTap: () => onModuleTap(modulo),
                    child: Tooltip(
                      message: 'M${modulo.moduloNumber}: ${modulo.avanceTotal.toStringAsFixed(0)}%',
                      child: Container(
                        height: 40,
                        decoration: BoxDecoration(
                          color: color,
                          border: Border.all(
                            color: Colors.white.withOpacity(0.1),
                            width: 0.5,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            '${modulo.moduloNumber}',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.8),
                              fontSize: blockWidth > 12 ? 10 : 0,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        );
      },
    );
  }
}
