import 'package:flutter/material.dart';
import '../utils/app_theme.dart';

/// Panel de filtros para la visualización del túnel
class FilterPanel extends StatefulWidget {
  final String filtroFrente;
  final String filtroActividad;
  final String filtroEstado;
  final double filtroAvanceMin;
  final double filtroAvanceMax;
  final Function(String, String, String, double, double) onApply;

  const FilterPanel({
    super.key,
    required this.filtroFrente,
    required this.filtroActividad,
    required this.filtroEstado,
    required this.filtroAvanceMin,
    required this.filtroAvanceMax,
    required this.onApply,
  });

  @override
  State<FilterPanel> createState() => _FilterPanelState();
}

class _FilterPanelState extends State<FilterPanel> {
  late String _frente;
  late String _actividad;
  late String _estado;
  late double _avanceMin;
  late double _avanceMax;

  @override
  void initState() {
    super.initState();
    _frente = widget.filtroFrente;
    _actividad = widget.filtroActividad;
    _estado = widget.filtroEstado;
    _avanceMin = widget.filtroAvanceMin;
    _avanceMax = widget.filtroAvanceMax;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Título
          const Padding(
            padding: EdgeInsets.all(20),
            child: Text(
              'FILTROS DE BÚSQUEDA',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Filtro por frente
                  _buildSectionTitle('Frente'),
                  _buildDropdown(
                    value: _frente,
                    items: ['Todos', 'Frente 1', 'Frente 2', 'Frente 3'],
                    onChanged: (v) => setState(() => _frente = v!),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Filtro por actividad
                  _buildSectionTitle('Actividad'),
                  _buildDropdown(
                    value: _actividad,
                    items: [
                      'Todas',
                      'Excavación',
                      'Sostenimiento',
                      'Impermeabilización',
                      'Viga Base',
                      'Revestimiento',
                      'Drenajes',
                      'Pavimento',
                    ],
                    onChanged: (v) => setState(() => _actividad = v!),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Filtro por estado
                  _buildSectionTitle('Estado'),
                  _buildDropdown(
                    value: _estado,
                    items: [
                      'Todos',
                      'No iniciado',
                      'Retrasado',
                      'En ejecución',
                      'Avanzado',
                      'Casi terminado',
                      'Terminado',
                    ],
                    onChanged: (v) => setState(() => _estado = v!),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Filtro por avance
                  _buildSectionTitle('Rango de Avance'),
                  _buildAvanceSlider(),
                  
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
          
          // Botones
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _frente = 'Todos';
                        _actividad = 'Todas';
                        _estado = 'Todos';
                        _avanceMin = 0;
                        _avanceMax = 100;
                      });
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withOpacity(0.3)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Limpiar'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () {
                      widget.onApply(
                        _frente,
                        _actividad,
                        _estado,
                        _avanceMin,
                        _avanceMax,
                      );
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Aplicar Filtros'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: AppTheme.accentColor,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildDropdown({
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.2)),
      ),
      child: DropdownButton<String>(
        value: value,
        isExpanded: true,
        dropdownColor: AppTheme.cardColor,
        style: const TextStyle(color: Colors.white),
        underline: const SizedBox(),
        items: items.map((item) => DropdownMenuItem(
          value: item,
          child: Text(item),
        )).toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildAvanceSlider() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${_avanceMin.toInt()}%',
              style: const TextStyle(color: Colors.white70),
            ),
            Text(
              '${_avanceMax.toInt()}%',
              style: const TextStyle(color: Colors.white70),
            ),
          ],
        ),
        RangeSlider(
          values: RangeValues(_avanceMin, _avanceMax),
          min: 0,
          max: 100,
          divisions: 20,
          activeColor: AppTheme.accentColor,
          inactiveColor: Colors.grey[800],
          labels: RangeLabels(
            '${_avanceMin.toInt()}%',
            '${_avanceMax.toInt()}%',
          ),
          onChanged: (values) {
            setState(() {
              _avanceMin = values.start;
              _avanceMax = values.end;
            });
          },
        ),
      ],
    );
  }
}
