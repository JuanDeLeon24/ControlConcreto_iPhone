import 'package:flutter/material.dart';
import '../models/tunnel_module.dart';
import '../services/data_service.dart';
import '../utils/app_theme.dart';
import '../widgets/longitudinal_progress_bar.dart';
import '../widgets/module_detail_sheet.dart';
import '../widgets/filter_panel.dart';
import 'ai_assistant_screen.dart';

/// Pantalla principal de visualización 3D del túnel
/// Incluye: vista 3D, barra longitudinal de progreso, filtros y panel de detalle
class TunnelViewScreen extends StatefulWidget {
  const TunnelViewScreen({super.key});

  @override
  State<TunnelViewScreen> createState() => _TunnelViewScreenState();
}

class _TunnelViewScreenState extends State<TunnelViewScreen> with TickerProviderStateMixin {
  final DataService _dataService = DataService();
  late AnimationController _animationController;
  
  // Estado de filtros
  String _filtroFrente = 'Todos';
  String _filtroActividad = 'Todas';
  String _filtroEstado = 'Todos';
  double _filtroAvanceMin = 0;
  double _filtroAvanceMax = 100;
  
  // Módulo seleccionado
  TunnelModule? _selectedModule;
  
  // Vista actual
  int _currentView = 0; // 0: 3D, 1: Longitudinal, 2: Transversal, 3: Planta

  @override
  void initState() {
    super.initState();
    _dataService.inicializarModulos();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Túnel 0 — Vista de Avance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterPanel,
            tooltip: 'Filtros',
          ),
          IconButton(
            icon: const Icon(Icons.smart_toy),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AIAssistantScreen()),
            ),
            tooltip: 'Asistente IA',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildViewSelector(),
          Expanded(
            child: _buildMainView(),
          ),
          _buildLongitudinalBar(),
        ],
      ),
    );
  }

  Widget _buildViewSelector() {
    return Container(
      height: 50,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildViewButton(0, Icons.view_in_ar, '3D'),
          _buildViewButton(1, Icons.straighten, 'Longitudinal'),
          _buildViewButton(2, Icons.crop_square, 'Transversal'),
          _buildViewButton(3, Icons.map, 'Planta'),
        ],
      ),
    );
  }

  Widget _buildViewButton(int index, IconData icon, String label) {
    final isSelected = _currentView == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _currentView = index),
        child: Container(
          margin: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.accentColor : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : Colors.white70,
                size: 20,
              ),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white70,
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMainView() {
    switch (_currentView) {
      case 0:
        return _build3DView();
      case 1:
        return _buildLongitudinalView();
      case 2:
        return _buildTransversalView();
      case 3:
        return _buildPlantaView();
      default:
        return _build3DView();
    }
  }

  Widget _build3DView() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.accentColor.withOpacity(0.3)),
      ),
      child: Stack(
        children: [
          // Vista 3D simulada del túnel
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: CustomPaint(
              painter: Tunnel3DPainter(
                modulos: _dataService.modulos,
                selectedModule: _selectedModule,
                animation: _animationController,
              ),
              size: Size.infinite,
            ),
          ),
          // Overlay con información
          Positioned(
            top: 16,
            left: 16,
            child: _buildInfoOverlay(),
          ),
          // Leyenda de colores
          Positioned(
            bottom: 16,
            right: 16,
            child: _buildColorLegend(),
          ),
          // Indicador de módulo seleccionado
          if (_selectedModule != null)
            Positioned(
              top: 16,
              right: 16,
              child: _buildSelectedModuleInfo(),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoOverlay() {
    final kpi = _dataService.kpiData;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'TÚNEL 0',
            style: TextStyle(
              color: AppTheme.accentColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Avance: ${kpi.avanceTotal.toStringAsFixed(1)}%',
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
          Text(
            'Metros: ${kpi.metrosEjecutados.toStringAsFixed(1)} / ${kpi.metrosEjecutados + kpi.metrosFaltantes} m',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildColorLegend() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Leyenda',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          _buildLegendItem('0%', AppTheme.colorNoIniciado),
          _buildLegendItem('1-25%', AppTheme.colorRetrasado),
          _buildLegendItem('26-50%', AppTheme.colorEnEjecucion),
          _buildLegendItem('51-75%', AppTheme.colorAvanzado),
          _buildLegendItem('76-99%', AppTheme.colorCasiTerminado),
          _buildLegendItem('100%', AppTheme.colorTerminado),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectedModuleInfo() {
    final modulo = _selectedModule!;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.accentColor.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Módulo ${modulo.moduloNumber}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            'K${modulo.abscisaInicial.toStringAsFixed(2)} - K${modulo.abscisaFinal.toStringAsFixed(2)}',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          Text(
            '${modulo.avanceTotal.toStringAsFixed(1)}%',
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildLongitudinalView() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'VISTA LONGITUDINAL',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'K6+178 — K7+173',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _dataService.modulos.length,
              itemBuilder: (context, index) {
                final modulo = _dataService.modulos[index];
                return _buildModuleRow(modulo);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModuleRow(TunnelModule modulo) {
    final isSelected = _selectedModule?.id == modulo.id;
    return GestureDetector(
      onTap: () => _selectModule(modulo),
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accentColor.withOpacity(0.3) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: isSelected ? Border.all(color: AppTheme.accentColor) : null,
        ),
        child: Row(
          children: [
            SizedBox(
              width: 60,
              child: Text(
                'M${modulo.moduloNumber}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Expanded(
              child: LinearProgressIndicator(
                value: modulo.avanceTotal / 100,
                backgroundColor: Colors.grey[800],
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppTheme.getColorByProgress(modulo.avanceTotal),
                ),
                minHeight: 8,
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 50,
              child: Text(
                '${modulo.avanceTotal.toStringAsFixed(0)}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                ),
                textAlign: TextAlign.right,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransversalView() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'VISTA TRANSVERSAL',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.engineering,
                    size: 80,
                    color: AppTheme.accentColor.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Sección transversal del túnel',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Carcamo, muro bordillo, ménsula, MH, viga base',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlantaView() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'VISTA EN PLANTA',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.map,
                    size: 80,
                    color: AppTheme.accentColor.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Vista en planta del túnel',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'K6+178 — K7+173 (995 m)',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLongitudinalBar() {
    return Container(
      height: 80,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.accentColor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'BARRA DE PROGRESO LONGITUDINAL',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'K6+178 — K7+173',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: LongitudinalProgressBar(
              modulos: _dataService.modulos,
              onModuleTap: (modulo) {
                _selectModule(modulo);
                _showModuleDetail(modulo);
              },
            ),
          ),
        ],
      ),
    );
  }

  void _selectModule(TunnelModule modulo) {
    setState(() {
      _selectedModule = modulo;
    });
  }

  void _showModuleDetail(TunnelModule modulo) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ModuleDetailSheet(modulo: modulo),
    );
  }

  void _showFilterPanel() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FilterPanel(
        filtroFrente: _filtroFrente,
        filtroActividad: _filtroActividad,
        filtroEstado: _filtroEstado,
        filtroAvanceMin: _filtroAvanceMin,
        filtroAvanceMax: _filtroAvanceMax,
        onApply: (frente, actividad, estado, avanceMin, avanceMax) {
          setState(() {
            _filtroFrente = frente;
            _filtroActividad = actividad;
            _filtroEstado = estado;
            _filtroAvanceMin = avanceMin;
            _filtroAvanceMax = avanceMax;
          });
        },
      ),
    );
  }
}

/// Painter personalizado para dibujar el túnel en 3D
class Tunnel3DPainter extends CustomPainter {
  final List<TunnelModule> modulos;
  final TunnelModule? selectedModule;
  final Animation<double> animation;

  Tunnel3DPainter({
    required this.modulos,
    this.selectedModule,
    required this.animation,
  }) : super(repaint: animation);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    final centerX = size.width / 2;
    final centerY = size.height / 2;
    
    // Dibujar fondo con gradiente
    final bgPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          AppTheme.backgroundColor,
          const Color(0xFF1A237E).withOpacity(0.3),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    // Dibujar túnel en perspectiva
    final tunnelWidth = size.width * 0.6;
    final tunnelHeight = size.height * 0.4;
    final startX = centerX - tunnelWidth / 2;
    final startY = centerY - tunnelHeight / 2;

    // Dibujar cada módulo como un segmento del túnel
    final moduleWidth = tunnelWidth / modulos.length;
    
    for (int i = 0; i < modulos.length; i++) {
      final modulo = modulos[i];
      final x = startX + i * moduleWidth;
      final isSelected = selectedModule?.id == modulo.id;
      
      // Color basado en avance
      paint.color = AppTheme.getColorByProgress(modulo.avanceTotal);
      
      // Aplicar animación de entrada
      final animatedHeight = tunnelHeight * animation.value;
      final animatedY = centerY - animatedHeight / 2;
      
      // Dibujar módulo con efecto 3D
      final rect = Rect.fromLTWH(
        x,
        animatedY,
        moduleWidth - 1,
        animatedHeight,
      );
      
      // Sombra
      paint.color = paint.color.withOpacity(0.3);
      canvas.drawRect(rect.shift(const Offset(2, 2)), paint);
      
      // Módulo principal
      paint.color = AppTheme.getColorByProgress(modulo.avanceTotal);
      if (isSelected) {
        paint.color = AppTheme.accentColor;
      }
      canvas.drawRect(rect, paint);
      
      // Borde
      paint.color = Colors.white.withOpacity(0.2);
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 1;
      canvas.drawRect(rect, paint);
      paint.style = PaintingStyle.fill;
    }

    // Dibujar línea central
    paint.color = Colors.white.withOpacity(0.3);
    paint.strokeWidth = 2;
    canvas.drawLine(
      Offset(startX, centerY),
      Offset(startX + tunnelWidth, centerY),
      paint,
    );

    // Dibujar etiquetas de abscisas
    final textStyle = TextStyle(
      color: Colors.white.withOpacity(0.7),
      fontSize: 10,
    );
    
    // K6+178
    _drawText(canvas, 'K6+178', Offset(startX, startY + tunnelHeight + 20), textStyle);
    // K7+173
    _drawText(canvas, 'K7+173', Offset(startX + tunnelWidth - 50, startY + tunnelHeight + 20), textStyle);
  }

  void _drawText(Canvas canvas, String text, Offset offset, TextStyle style) {
    final textSpan = TextSpan(text: text, style: style);
    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(canvas, offset);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
