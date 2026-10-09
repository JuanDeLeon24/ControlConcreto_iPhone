import 'package:flutter/material.dart';
import '../services/data_service.dart';
import '../utils/app_theme.dart';
import '../widgets/kpi_card.dart';
import 'package:fl_chart/fl_chart.dart';

/// Dashboard Ejecutivo con KPIs del túnel
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final DataService _dataService = DataService();

  @override
  void initState() {
    super.initState();
    if (_dataService.modulos.isEmpty) {
      _dataService.inicializarModulos();
    }
  }

  @override
  Widget build(BuildContext context) {
    final kpi = _dataService.kpiData;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard Ejecutivo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => setState(() {}),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle('Resumen General'),
            const SizedBox(height: 12),
            _buildKPIGrid(kpi),
            const SizedBox(height: 24),
            _buildSectionTitle('Curva S'),
            const SizedBox(height: 12),
            _buildSCurveChart(kpi),
            const SizedBox(height: 24),
            _buildSectionTitle('Avance por Frente'),
            const SizedBox(height: 12),
            _buildAvancePorFrente(kpi),
            const SizedBox(height: 24),
            _buildSectionTitle('Actividades Principales'),
            const SizedBox(height: 12),
            _buildActividadesList(),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
    );
  }

  Widget _buildKPIGrid(kpi) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.3,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: [
        KPICard(
          title: 'Avance Total',
          value: '${kpi.avanceTotal.toStringAsFixed(1)}%',
          icon: Icons.trending_up,
          color: AppTheme.getColorByProgress(kpi.avanceTotal),
          subtitle: '${kpi.modulosCompletados}/${kpi.modulosTotales} módulos',
        ),
        KPICard(
          title: 'Metros Ejecutados',
          value: '${kpi.metrosEjecutados.toStringAsFixed(1)} m',
          icon: Icons.straighten,
          color: AppTheme.colorCasiTerminado,
          subtitle: 'de ${kpi.metrosEjecutados + kpi.metrosFaltantes} m totales',
        ),
        KPICard(
          title: 'Metros Faltantes',
          value: '${kpi.metrosFaltantes.toStringAsFixed(1)} m',
          icon: Icons.pending_actions,
          color: AppTheme.colorRetrasado,
          subtitle: 'por ejecutar',
        ),
        KPICard(
          title: 'Concreto Vaciado',
          value: '${kpi.concretoVaciado.toStringAsFixed(1)} m³',
          icon: Icons.water_drop,
          color: AppTheme.colorAvanzado,
          subtitle: 'acumulado',
        ),
        KPICard(
          title: 'Productividad Semanal',
          value: '${kpi.productividadSemanal.toStringAsFixed(1)} m/sem',
          icon: Icons.speed,
          color: AppTheme.colorEnEjecucion,
          subtitle: 'promedio',
        ),
        KPICard(
          title: 'Velocidad de Avance',
          value: '${kpi.velocidadAvance.toStringAsFixed(1)} m/día',
          icon: Icons.directions_car,
          color: AppTheme.colorCasiTerminado,
          subtitle: 'promedio',
        ),
        KPICard(
          title: 'Actividades Retrasadas',
          value: '${kpi.actividadesRetrasadas}',
          icon: Icons.warning,
          color: AppTheme.colorRetrasado,
          subtitle: 'requieren atención',
        ),
        KPICard(
          title: 'Módulos Completados',
          value: '${kpi.modulosCompletados}',
          icon: Icons.check_circle,
          color: AppTheme.colorTerminado,
          subtitle: 'de ${kpi.modulosTotales} totales',
        ),
      ],
    );
  }

  Widget _buildSCurveChart(kpi) {
    return Container(
      height: 250,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: true,
            horizontalInterval: 20,
            verticalInterval: 1,
            getDrawingHorizontalLine: (value) => FlLine(
              color: Colors.white.withOpacity(0.1),
              strokeWidth: 1,
            ),
            getDrawingVerticalLine: (value) => FlLine(
              color: Colors.white.withOpacity(0.1),
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            show: true,
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 30,
                interval: 1,
                getTitlesWidget: (value, meta) {
                  const style = TextStyle(color: Colors.white70, fontSize: 10);
                  return Text('S${value.toInt()}', style: style);
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: 20,
                reservedSize: 42,
                getTitlesWidget: (value, meta) {
                  return Text('${value.toInt()}%', style: const TextStyle(color: Colors.white70, fontSize: 10));
                },
              ),
            ),
          ),
          borderData: FlBorderData(
            show: true,
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          minX: 0,
          maxX: 10,
          minY: 0,
          maxY: 100,
          lineBarsData: [
            // Avance programado
            LineChartBarData(
              spots: const [
                FlSpot(0, 0),
                FlSpot(1, 10),
                FlSpot(2, 20),
                FlSpot(3, 35),
                FlSpot(4, 50),
                FlSpot(5, 65),
                FlSpot(6, 78),
                FlSpot(7, 88),
                FlSpot(8, 95),
                FlSpot(9, 100),
                FlSpot(10, 100),
              ],
              isCurved: true,
              color: AppTheme.colorCasiTerminado,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(show: false),
            ),
            // Avance real
            LineChartBarData(
              spots: [
                FlSpot(0, 0),
                FlSpot(1, 8),
                FlSpot(2, 18),
                FlSpot(3, 30),
                FlSpot(4, 42),
                FlSpot(5, 47.2),
                FlSpot(6, 47.2),
                FlSpot(7, 47.2),
                FlSpot(8, 47.2),
                FlSpot(9, 47.2),
                FlSpot(10, 47.2),
              ],
              isCurved: true,
              color: AppTheme.accentColor,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: AppTheme.accentColor.withOpacity(0.1),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvancePorFrente(kpi) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: kpi.avancePorFrente.entries.map((entry) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                SizedBox(
                  width: 100,
                  child: Text(
                    entry.key,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Expanded(
                  child: LinearProgressIndicator(
                    value: entry.value / 100,
                    backgroundColor: Colors.grey[800],
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppTheme.getColorByProgress(entry.value),
                    ),
                    minHeight: 12,
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 60,
                  child: Text(
                    '${entry.value.toStringAsFixed(1)}%',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.right,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildActividadesList() {
    final actividades = [
      {'nombre': 'Revestimiento - Concreto', 'avance': 47.2, 'estado': 'En ejecución'},
      {'nombre': 'Viga Base - Concreto', 'avance': 65.0, 'estado': 'Avanzado'},
      {'nombre': 'Impermeabilización', 'avance': 35.0, 'estado': 'En ejecución'},
      {'nombre': 'Drenajes', 'avance': 20.0, 'estado': 'Retrasado'},
      {'nombre': 'Pavimento', 'avance': 0.0, 'estado': 'No iniciado'},
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: actividades.map((act) {
          return ListTile(
            leading: CircleAvatar(
              backgroundColor: AppTheme.getColorByProgress(act['avance'] as double),
              child: Text(
                '${(act['avance'] as double).toInt()}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            title: Text(
              act['nombre'] as String,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: Text(
              act['estado'] as String,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 12,
              ),
            ),
            trailing: Icon(
              Icons.chevron_right,
              color: Colors.white.withOpacity(0.5),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class KPICard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final String subtitle;

  const KPICard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.cardColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 28),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    value,
                    style: TextStyle(
                      color: color,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.6),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
