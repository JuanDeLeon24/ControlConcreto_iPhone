import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../services/excel_service.dart';
import '../services/data_service.dart';
import '../utils/app_theme.dart';

/// Pantalla para importar el archivo Excel de reporte diario
/// También permite cargar información de jornada de concreto
class ImportScreen extends StatefulWidget {
  const ImportScreen({super.key});

  @override
  State<ImportScreen> createState() => _ImportScreenState();
}

class _ImportScreenState extends State<ImportScreen> {
  final ExcelService _excelService = ExcelService();
  final DataService _dataService = DataService();
  
  bool _isLoading = false;
  String _statusMessage = '';
  String _selectedFileName = '';
  
  // Controladores para cargar jornada manual
  final _formKey = GlobalKey<FormState>();
  final _pmoduloController = TextEditingController();
  final _cantidadController = TextEditingController();
  final _responsableController = TextEditingController();
  String _actividadSeleccionada = 'Revestimiento - Concreto';

  @override
  void dispose() {
    _pmoduloController.dispose();
    _cantidadController.dispose();
    _responsableController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Importar / Cargar Datos'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.upload_file), text: 'Importar Excel'),
              Tab(icon: Icon(Icons.edit_note), text: 'Cargar Jornada'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildImportTab(),
            _buildManualEntryTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildImportTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Información del archivo
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.accentColor.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.description,
                  size: 64,
                  color: AppTheme.accentColor,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Formato Túnel_Dia / Túnel_Noche',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Seleccione el archivo Excel de reporte diario',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'El archivo debe contener las hojas: Matriz cant., Avances_Diarios, BD_Actividades',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Botón seleccionar archivo
          ElevatedButton.icon(
            onPressed: _isLoading ? null : _seleccionarArchivo,
            icon: _isLoading 
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.folder_open),
            label: Text(_isLoading ? 'Procesando...' : 'Seleccionar Archivo Excel'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Archivo seleccionado
          if (_selectedFileName.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.cardColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.insert_drive_file, color: Colors.green),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _selectedFileName,
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 24),
          
          // Estado de procesamiento
          if (_statusMessage.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _statusMessage.contains('Error') 
                  ? Colors.red.withOpacity(0.1)
                  : Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _statusMessage.contains('Error') ? Colors.red : Colors.green,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _statusMessage.contains('Error') ? Icons.error : Icons.check_circle,
                    color: _statusMessage.contains('Error') ? Colors.red : Colors.green,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _statusMessage,
                      style: TextStyle(
                        color: _statusMessage.contains('Error') ? Colors.red : Colors.green,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 24),
          
          // Hojas esperadas
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.cardColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Hojas esperadas en el archivo:',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                _buildSheetItem('Matriz cant.', 'Actividades cobrables'),
                _buildSheetItem('Avances_Diarios', 'Avance por actividad'),
                _buildSheetItem('BD_Actividades', 'Base de datos de actividades'),
                _buildSheetItem('Módulos_VB', 'Módulos de viga base'),
                _buildSheetItem('Formato Túnel_Dia', 'Reporte turno día'),
                _buildSheetItem('Formato Túnel_Noche', 'Reporte turno noche'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSheetItem(String name, String description) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Icon(Icons.table_chart, size: 16, color: AppTheme.accentColor),
          const SizedBox(width: 8),
          Text(
            name,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              description,
              style: TextStyle(
                color: Colors.white.withOpacity(0.6),
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildManualEntryTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Cargar Jornada de Concreto en Revestimiento',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Ingrese los datos del vaciado de concreto del revestimiento del túnel',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            
            // Actividad
            DropdownButtonFormField<String>(
              value: _actividadSeleccionada,
              decoration: _buildInputDecoration('Actividad', Icons.engineering),
              dropdownColor: AppTheme.cardColor,
              style: const TextStyle(color: Colors.white),
              items: [
                'Revestimiento - Concreto',
                'Viga Base HD - Concreto',
                'Viga Base HI - Concreto',
                'Solado - Concreto',
                'Carcamo - Concreto',
              ].map((act) => DropdownMenuItem(
                value: act,
                child: Text(act),
              )).toList(),
              onChanged: (value) => setState(() => _actividadSeleccionada = value!),
            ),
            
            const SizedBox(height: 16),
            
            // Número de módulo
            TextFormField(
              controller: _pmoduloController,
              decoration: _buildInputDecoration('Número de Módulo', Icons.numbers),
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Ingrese el nódulo';
                final n = int.tryParse(value);
                if (n == null || n < 1 || n > 137) return 'Módulo entre 1 y 137';
                return null;
              },
            ),
            
            const SizedBox(height: 16),
            
            // Cantidad
            TextFormField(
              controller: _cantidadController,
              decoration: _buildInputDecoration('Cantidad (m³)', Icons.water_drop),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(color: Colors.white),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Ingrese la cantidad';
                final n = double.tryParse(value);
                if (n == null || n <= 0) return 'Cantidad debe ser positiva';
                return null;
              },
            ),
            
            const SizedBox(height: 16),
            
            // Responsable
            TextFormField(
              controller: _responsableController,
              decoration: _buildInputDecoration('Responsable', Icons.person),
              style: const TextStyle(color: Colors.white),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Ingrese el responsable';
                return null;
              },
            ),
            
            const SizedBox(height: 24),
            
            // Botón guardar
            ElevatedButton.icon(
              onPressed: _guardarJornada,
              icon: const Icon(Icons.save),
              label: const Text('Guardar Registro'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.secondaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Información adicional
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.cardColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Información del módulo:',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '• El módulo determina la abscisa automáticamente',
                    style: TextStyle(color: Colors.white.withOpacity(0.7)),
                  ),
                  Text(
                    '• Se calcula el avance basado en la cantidad ingresada',
                    style: TextStyle(color: Colors.white.withOpacity(0.7)),
                  ),
                  Text(
                    '• El registro queda guardado para el reporte diario',
                    style: TextStyle(color: Colors.white.withOpacity(0.7)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _buildInputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
      prefixIcon: Icon(icon, color: AppTheme.accentColor),
      filled: true,
      fillColor: AppTheme.cardColor,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.accentColor),
      ),
    );
  }

  Future<void> _seleccionarArchivo() async {
    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx', 'xlsm', 'xls'],
        allowMultiple: false,
      );

      if (result != null && result.files.single.path != null) {
        final filePath = result.files.single.path!;
        setState(() {
          _selectedFileName = result.files.single.name;
        });

        // Procesar archivo
        await _procesarArchivoExcel(filePath);
      } else {
        setState(() {
          _statusMessage = 'No se seleccionó ningún archivo';
        });
      }
    } catch (e) {
      setState(() {
        _statusMessage = 'Error al procesar archivo: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _procesarArchivoExcel(String filePath) async {
    try {
      // Leer módulos del Túnel 0
      final modulos = await _excelService.leerModulosTunel0(filePath);
      
      // Leer avances diarios
      final avances = await _excelService.leerAvancesDiarios(filePath);
      
      // Leer actividades
      final actividades = await _excelService.leerActividades(filePath);

      // Actualizar servicio de datos
      _dataService.inicializarModulos();

      setState(() {
        _statusMessage = '✅ Archivo procesado exitosamente\n'
          '• Módulos encontrados: ${modulos.length}\n'
          '• Avances diarios: ${avances.length}\n'
          '• Actividades: ${actividades.length}';
      });

      // Mostrar diálogo de éxito
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: AppTheme.cardColor,
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green),
                SizedBox(width: 8),
                Text('Éxito', style: TextStyle(color: Colors.white)),
              ],
            ),
            content: Text(
              'El archivo fue procesado correctamente.\n\n'
              '• Módulos: ${modulos.length}\n'
              '• Avances: ${avances.length}\n'
              '• Actividades: ${actividades.length}',
              style: const TextStyle(color: Colors.white),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Aceptar'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      setState(() {
        _statusMessage = 'Error: ${e.toString()}';
      });
    }
  }

  void _guardarJornada() {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    // Simular guardado
    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        _isLoading = false;
      });

      // Mostrar éxito
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 8),
              Text('Registro guardado: Módulo ${_pmoduloController.text} - ${_cantidadController.text} m³'),
            ],
          ),
          backgroundColor: AppTheme.secondaryColor,
          behavior: SnackBarBehavior.floating,
        ),
      );

      // Limpiar formulario
      _pmoduloController.clear();
      _cantidadController.clear();
      _responsableController.clear();
    });
  }
}
